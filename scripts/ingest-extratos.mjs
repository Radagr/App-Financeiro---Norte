// Ingest local bank statement files (extratos/) into a TypeScript fixture
// (src/lib/data/imported.ts) used by the dashboard.
//
// Formats supported:
//  - BTG cartão CSV (semicolon, BR locale)
//  - Nubank conta OFX (BANKMSGSRSV1)
//  - Nubank cartão OFX (CREDITCARDMSGSRSV1)
//  - C6 conta OFX (BANKMSGSRSV1, FID 336)
//
// Categorization rules:
//   - PIX/transferência to "Mateus Felipe Alves Da Silva" → transferencias (NOT gasto)
//   - PIX/transferência to "igreja atos da fé" → dizimo
//   - Card payment / fatura → transferencias (intra-account)
//   - Otherwise → keyword-based heuristic
//
// Usage:  node scripts/ingest-extratos.mjs
// Output: src/lib/data/imported.ts (gitignored)

import { readdirSync, readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const ROOT = join(__dirname, "..");
const EXTRATOS = join(ROOT, "extratos");
const OUT_DIR = join(ROOT, "src", "lib", "data");
const OUT_FILE = join(OUT_DIR, "imported.ts");

const USER_NAME_REGEX = /mateus\s*felipe\s*alves\s*da\s*silva/i;
const CHURCH_REGEX = /igreja\s*atos\s*da\s*f[éeÉE]/i;

// === FORMAT DETECTION ===

function detectFormat(filename, content) {
  if (filename.endsWith(".csv")) return "btg_card_csv";
  if (filename.startsWith("Nubank_") && filename.endsWith(".ofx")) return "nubank_card_ofx";
  if (filename.startsWith("NU_") && filename.endsWith(".ofx")) return "nubank_account_ofx";
  if (content.includes("Banco C6 S.A.")) return "c6_account_ofx";
  if (content.includes("CREDITCARDMSGSRSV1")) return "generic_card_ofx";
  if (content.includes("BANKMSGSRSV1")) return "generic_account_ofx";
  return "unknown";
}

// === OFX PARSER (regex-based, sufficient for our needs) ===

function parseOfx(content) {
  const txs = [];
  const stmtRe = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/g;
  let m;
  while ((m = stmtRe.exec(content))) {
    const block = m[1];
    const trnType = matchTag(block, "TRNTYPE");
    const dtPosted = matchTag(block, "DTPOSTED");
    const trnAmt = matchTag(block, "TRNAMT");
    const fitId = matchTag(block, "FITID");
    const memo =
      matchTag(block, "MEMO") || matchTag(block, "NAME") || matchTag(block, "CHECKNUM") || "";

    if (!dtPosted || !trnAmt) continue;

    const date = parseOfxDate(dtPosted);
    const amount = Number(trnAmt);
    if (Number.isNaN(amount)) continue;

    txs.push({
      fitId: fitId || `${date}_${amount}_${memo.slice(0, 20)}`,
      date,
      amount,
      description: cleanText(memo),
      trnType,
    });
  }
  return txs;
}

function parseOfxBalance(content) {
  // Try LEDGERBAL first (bank), then AVAILBAL fallback
  const balMatch = content.match(/<LEDGERBAL>[\s\S]*?<BALAMT>([^<\r\n]+)/);
  const dtMatch = content.match(/<LEDGERBAL>[\s\S]*?<DTASOF>([^<\r\n]+)/);
  if (!balMatch) return null;
  const amount = Number(balMatch[1].trim());
  if (Number.isNaN(amount)) return null;
  const asOf = dtMatch ? parseOfxDate(dtMatch[1]) : null;
  return { amount, asOf };
}

function matchTag(block, tag) {
  const re = new RegExp(`<${tag}>([^<\\r\\n]*)`);
  const m = block.match(re);
  return m ? m[1].trim() : null;
}

function parseOfxDate(s) {
  // Formats: YYYYMMDD or YYYYMMDDHHMMSS or with [TZ]
  const clean = s.replace(/\[.*$/, "").trim();
  const yyyy = clean.slice(0, 4);
  const mm = clean.slice(4, 6);
  const dd = clean.slice(6, 8);
  return `${yyyy}-${mm}-${dd}`;
}

function cleanText(s) {
  return s.replace(/\s+/g, " ").trim();
}

// === BTG CSV PARSER ===

function parseBtgCsv(content) {
  // Strip BOM
  const clean = content.replace(/^﻿/, "");
  const lines = clean.split(/\r?\n/).filter(Boolean);
  const [, ...rows] = lines; // skip header
  const txs = [];
  for (const line of rows) {
    const cells = line.split(";");
    if (cells.length < 4) continue;
    const [data, descricao, valor, tipoLanc, , codAuth] = cells;
    if (!data) continue;
    const [dd, mm, yyyy] = data.split("/");
    if (!yyyy) continue;
    const date = `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
    // BR decimal: -411,28 → -411.28
    const rawAmount = Number(valor.replace(/\./g, "").replace(",", "."));
    if (Number.isNaN(rawAmount)) continue;
    // BTG CSV convention: positive = purchase (debt added), negative = payment/refund.
    // Flip to match our model: negative = expense, positive = credit/income.
    const amount = -rawAmount;
    txs.push({
      fitId: codAuth?.trim() || `btg_${date}_${amount}_${descricao.slice(0, 30)}`,
      date,
      amount,
      description: cleanText(descricao),
      trnType: amount >= 0 ? "CREDIT" : "DEBIT",
      tipoLanc: tipoLanc?.trim(),
    });
  }
  return txs;
}

// === CATEGORIZATION ===

function categorize(memo, amount, accountKind) {
  const m = memo || "";

  // 1. Special rules from user
  if (CHURCH_REGEX.test(m)) return "dizimo";
  if (USER_NAME_REGEX.test(m)) return "transferencias";

  // 2. Card payments / intra-account transfers
  if (
    /pagamento.*fatura|pgto.*cart[ãa]o|fatura.*nubank|fatura.*btg|fatura cart[ãa]o|pagamento recebido/i.test(
      m,
    )
  ) {
    return "transferencias";
  }

  // 3. Income (positive on bank account)
  if (amount > 0 && (accountKind === "checking" || accountKind === "savings")) {
    if (/sal[áa]rio|payroll/i.test(m)) return "receita_fixa";
    if (/empr[ée]stimo/i.test(m)) return "outros";
    if (/cancelamento|estorno|reembolso|refund/i.test(m)) return "outros";
    if (/pix recebid|transfer[êe]ncia recebid|cr[ée]dito|entrada pix/i.test(m))
      return "receita_variavel";
    return "receita_variavel";
  }

  // 4. Card refunds / cancellations (positive on credit card after sign-flip)
  if (amount > 0 && accountKind === "credit") {
    if (/estorno|cancelamento|reembolso|refund/i.test(m)) return "outros";
    return "outros";
  }

  // === Outflow categorization (negative amounts) ===

  // Transporte
  if (
    /uber|\b99\b|^99$|99 *Tecnologia|cabify|metr[ôo]|\bonibus\b|combust[íi]vel|\bposto\b|posto principe|ipiranga|shell|petrobras|estacion|pedagio|pedágio|gasolina|alcool|\bcar |carwash|estapar|onibus|braz[íi]lia veicul/i.test(
      m,
    )
  )
    return "transporte";

  // Alimentação — delivery + restaurantes
  if (
    /ifood|ifd\*|rappi|james|delivery|restaurante|lanchonete|hambur|pizza|sushi|burger|mcdonald|subway|starbucks|coffee|caf[ée]|padaria|botequim|cantina|restaur|outback|bk |pizzaria|hot dog|hotdog|kebab|brasileirinho|sucos|açaí|acai/i.test(
      m,
    )
  )
    return "alimentacao";

  // Alimentação — supermercados / atacarejos
  if (
    /mercado|carrefour|p[ãa]o de a[çc][úu]car|extra |hortifruti|atacad[ãa]o|atacarejo|sams club|sams ?club|\bdia\b|sendas|hiperme|supermerc|empório|emporio|verdurao|frutaria|fort atacad|tenda atac|assa[ií] atac|hortimar|açougue|acougue/i.test(
      m,
    )
  )
    return "alimentacao";

  // Moradia
  if (
    /aluguel|condom[íi]nio|condominio|imobili[áa]ria|aluguer|\bloft\b|housi |housing|quinto andar|kitnet|república|republica/i.test(
      m,
    )
  )
    return "moradia";

  // Moradia — utilities
  if (
    /\bluz\b|enel|cpfl|cemig|copel|coelba|el[ée]trica|energia |\bgas\b|\bgás\b|comgas|sabesp|cedae|copasa|\bágua\b|aguas |saneamento/i.test(
      m,
    )
  )
    return "moradia";

  // Serviços — telecom + streaming + saas
  if (
    /spotify|netflix|disney|prime video|prime video|hbo|paramount|globoplay|youtube premium|apple\.com|apple\.com|icloud|google one|chatgpt|openai|notion|figma|github|cursor|adobe|canva|deezer|pluto|zoom|dropbox|mega\.|onedrive|grammarly/i.test(
      m,
    )
  )
    return "servicos";

  // Serviços — telecom (mobile + internet)
  if (
    /\btim\*|\btim |\bvivo |\bclaro |\boi \b|claro net|vivo fibra|oi fibra|tim fibra|tim live|nextel|algar|virtua|sky |hubsoft|telef[oô]nica/i.test(
      m,
    )
  )
    return "servicos";

  // Saúde
  if (
    /farm[áa]cia|drogaria|drogasil|pacheco|raia |\braia\b|laborat[óo]rio|hospital|cl[íi]nica|m[ée]dico|psicologo|psicólogo|fisioterap|amil |unimed|sulam[ée]rica|hapvida|dermato|dental|odontolog|growth ?supplement|growthsupplement|suplemento|protein/i.test(
      m,
    )
  )
    return "saude";

  // Educação
  if (
    /escola|col[ée]gio|universidade|udemy|coursera|alura|hotmart|kindle |livraria|\bbook |\bbooks |kwikfix|geekie|edutech|enem|cursinho|pre-vestibular|preparat[óo]rio|edicao|editora|editora globo/i.test(
      m,
    )
  )
    return "educacao";

  // Lazer — entertainment / shopping
  if (
    /cinema|ingresso|sympla|show |teatro|\bbar\b|\bpub\b|balada|magazine|magalu|americanas|shopee|aliexpress|mercadoliv|mercado liv|netshoes|centauro|nike|adidas|under armour|reserva|riachuelo|c&a|c & a|renner|hering|zara|fast shop|kabum|amazon\.com|amazon mark|amazon$|\bsteam\b|epic games|playstation|xbox|nintendo|spotify premium/i.test(
      m,
    )
  )
    return "lazer";

  // Lazer — viagens / passagens
  if (
    /airlines|latam|\bgol\b|azul \w?vi|\btam\b|airbnb|booking|hotel |hotels\.com|decolar|123milhas|hostel|pousada|cvc viag|airbnb|expedia|trivago/i.test(
      m,
    )
  )
    return "lazer";

  // Lazer — pets
  if (/petlove|petshop|pet shop|cobasi|petz|veterin[áa]ri|ra[çc][aã]o|raça/i.test(m))
    return "lazer";

  // Investimentos (apenas saídas de conta corrente para corretora)
  if (
    amount < 0 &&
    /tesouro|aporte|aplica[çc][ãa]o|aplicar|investiment|nubank invest|btg invest|rico invest|xp invest|inter invest|c6 invest/i.test(
      m,
    ) &&
    (accountKind === "checking" || accountKind === "savings")
  )
    return "investimentos";

  // Impostos
  if (
    /imposto|iptu|ipva|darf|guia rj|\binss\b|previd[êe]ncia|simples nacional|\bicms\b|\bdas \b/i.test(
      m,
    )
  )
    return "impostos";

  // Catch-all: PIX/transfer to third party = gasto, mas marca como "outros" pra revisão posterior
  // (nesta versão MVP heurística; futuramente regras aprendidas do usuário tomam o lugar)
  return "outros";
}

// === ACCOUNTS ===

const ACCOUNTS = [
  {
    id: "acc_nubank_conta",
    name: "Nubank Conta",
    bank: "Nubank",
    kind: "checking",
    color: "chart-2",
    balance: 0,
  },
  {
    id: "acc_nubank_cartao",
    name: "Nubank Cartão",
    bank: "Nubank",
    kind: "credit",
    color: "chart-2",
    balance: 0,
  },
  {
    id: "acc_btg_cartao",
    name: "BTG Cartão (•••2427)",
    bank: "BTG",
    kind: "credit",
    color: "chart-1",
    balance: 0,
  },
  {
    id: "acc_c6_conta",
    name: "C6 Conta",
    bank: "C6",
    kind: "checking",
    color: "chart-4",
    balance: 0,
  },
];

function accountIdForFile(filename, content) {
  const fmt = detectFormat(filename, content);
  if (fmt === "btg_card_csv") return "acc_btg_cartao";
  if (fmt === "nubank_card_ofx") return "acc_nubank_cartao";
  if (fmt === "nubank_account_ofx") return "acc_nubank_conta";
  if (fmt === "c6_account_ofx") return "acc_c6_conta";
  return null;
}

// === MAIN ===

function main() {
  const files = readdirSync(EXTRATOS)
    .filter((f) => /\.(ofx|csv)$/i.test(f))
    .sort();
  console.log(`Found ${files.length} files in extratos/`);

  const seenFitIds = new Set();
  const allTxs = [];
  let skipped = 0;
  const formatCounts = {};
  const categoryCounts = {};
  // Track latest balance per account from OFX LEDGERBAL across files
  const latestBalances = new Map(); // accountId -> { amount, asOf }
  // Track latest BTG fatura sum (current outstanding card debt)
  const btgLatestFile = new Map(); // accountId -> { date, sum }

  for (const filename of files) {
    const filepath = join(EXTRATOS, filename);
    const content = readFileSync(filepath, "utf8");
    const fmt = detectFormat(filename, content);
    formatCounts[fmt] = (formatCounts[fmt] || 0) + 1;

    const accountId = accountIdForFile(filename, content);
    if (!accountId) {
      console.warn(`[skip] No account mapping for ${filename}`);
      continue;
    }
    const account = ACCOUNTS.find((a) => a.id === accountId);

    const rawTxs = fmt === "btg_card_csv" ? parseBtgCsv(content) : parseOfx(content);

    // Capture LEDGERBAL from OFX
    if (fmt !== "btg_card_csv") {
      const bal = parseOfxBalance(content);
      if (bal) {
        const prev = latestBalances.get(accountId);
        if (!prev || (bal.asOf && (!prev.asOf || bal.asOf > prev.asOf))) {
          latestBalances.set(accountId, bal);
        }
      }
    } else {
      // BTG: use the latest fatura as "current outstanding"
      // Date encoded in filename: 2026-04-05_Fatura_...
      const fileDateMatch = filename.match(/^(\d{4}-\d{2}-\d{2})/);
      if (fileDateMatch) {
        const fileDate = fileDateMatch[1];
        const prev = btgLatestFile.get(accountId);
        if (!prev || fileDate > prev.date) {
          // Sum of all transactions in this fatura = current outstanding
          // (negative because purchases > payments in any single closed cycle)
          const sum = rawTxs.reduce((s, t) => s + t.amount, 0);
          btgLatestFile.set(accountId, { date: fileDate, sum: Math.round(sum * 100) / 100 });
        }
      }
    }

    for (const t of rawTxs) {
      const dedupKey = `${accountId}::${t.fitId}`;
      if (seenFitIds.has(dedupKey)) {
        skipped++;
        continue;
      }
      seenFitIds.add(dedupKey);

      const category = categorize(t.description, t.amount, account.kind);
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;

      allTxs.push({
        id: `${accountId}_${t.fitId}`.replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 80),
        accountId,
        date: t.date,
        amount: t.amount,
        description: t.description.slice(0, 200),
        category,
      });
    }
  }

  // Apply real balances
  for (const acc of ACCOUNTS) {
    if (latestBalances.has(acc.id)) {
      acc.balance = Math.round(latestBalances.get(acc.id).amount * 100) / 100;
    } else if (btgLatestFile.has(acc.id)) {
      acc.balance = btgLatestFile.get(acc.id).sum;
    } else {
      acc.balance = 0;
    }
  }

  // Sort transactions by date asc
  allTxs.sort((a, b) => a.date.localeCompare(b.date));

  // === Output stats ===
  console.log("\n=== Format breakdown ===");
  for (const [fmt, n] of Object.entries(formatCounts)) console.log(`  ${fmt}: ${n} files`);
  console.log(`\nTotal transactions: ${allTxs.length} (skipped duplicates: ${skipped})`);
  console.log("\n=== Category breakdown ===");
  for (const [cat, n] of Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${cat.padEnd(20)} ${n}`);
  }
  console.log("\n=== Account balances (computed from tx sum) ===");
  for (const acc of ACCOUNTS) {
    console.log(
      `  ${acc.name.padEnd(28)} ${acc.balance.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`,
    );
  }

  // === Write TS file ===
  mkdirSync(OUT_DIR, { recursive: true });
  const ts = generateTsFile(ACCOUNTS, allTxs);
  writeFileSync(OUT_FILE, ts, "utf8");
  console.log(`\nWrote ${OUT_FILE}`);
  console.log(`(${allTxs.length} transactions, ${ACCOUNTS.length} accounts)`);
}

function generateTsFile(accounts, txs) {
  const accountsTs = accounts
    .map(
      (a) =>
        `  { id: ${JSON.stringify(a.id)}, name: ${JSON.stringify(a.name)}, bank: ${JSON.stringify(a.bank)}, kind: ${JSON.stringify(a.kind)}, balance: ${a.balance}, color: ${JSON.stringify(a.color)} },`,
    )
    .join("\n");

  const txsTs = txs
    .map(
      (t) =>
        `  { id: ${JSON.stringify(t.id)}, accountId: ${JSON.stringify(t.accountId)}, date: ${JSON.stringify(t.date)}, amount: ${t.amount}, description: ${JSON.stringify(t.description)}, category: ${JSON.stringify(t.category)} },`,
    )
    .join("\n");

  return `// Auto-generated from extratos/ via scripts/ingest-extratos.mjs
// DO NOT EDIT BY HAND. Re-run the script when extratos change.
// This file is gitignored — contains real bank data.

import type { Account, Transaction } from "@/lib/mock/data";

export const accounts: Account[] = [
${accountsTs}
];

export const transactions: Transaction[] = [
${txsTs}
];
`;
}

main();
