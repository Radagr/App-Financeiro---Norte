import Anthropic from "@anthropic-ai/sdk";

import type { Account, Transaction } from "@/lib/mock/data";

export type InsightSeverity = "info" | "warning" | "success";

export type Insight = {
  title: string;
  severity: InsightSeverity;
  category: string;
  body: string;
  suggestion: string;
  estimatedImpact: string | null;
};

export type AnalysisResult = {
  insights: Insight[];
  generatedAt: string;
};

// In-memory cache (per Next.js process). MVP only — replace with Upstash
// or DB-backed cache before deploying to serverless (Vercel lambdas don't
// share memory).
const CACHE = new Map<string, { result: AnalysisResult; expiresAt: number }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

const cacheKey = (userId: string) => `insights:${userId}`;

function readCache(userId: string): AnalysisResult | null {
  const entry = CACHE.get(cacheKey(userId));
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    CACHE.delete(cacheKey(userId));
    return null;
  }
  return entry.result;
}

function writeCache(userId: string, result: AnalysisResult): void {
  CACHE.set(cacheKey(userId), {
    result,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

const CATEGORY_LABELS: Record<string, string> = {
  moradia: "moradia",
  alimentacao: "alimentação",
  transporte: "transporte",
  saude: "saúde",
  lazer: "lazer",
  educacao: "educação",
  servicos: "serviços (telecom + streaming + saas)",
  investimentos: "investimentos (aportes)",
  transferencias: "transferências entre contas",
  receita_fixa: "receita fixa (salário)",
  receita_variavel: "receita variável (freelas, PIX recebido)",
  impostos: "impostos",
  dizimo: "dízimo",
  outros: "outros",
};

const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

export type AggregatedContext = {
  netWorth: number;
  byBank: Array<{ bank: string; balance: number }>;
  totalIncomeLast6m: number;
  totalExpenseLast6m: number;
  monthlyExpenseAverage: number;
  topCategoriesLast6m: Array<{ category: string; total: number; share: number }>;
  monthOverMonth: Array<{ month: string; income: number; expense: number; net: number }>;
  goals: Array<{
    name: string;
    type: string;
    target: number;
    current: number;
    deadline: string;
    progressPct: number;
    monthlyRequired: number;
  }>;
};

export function aggregateContext(input: {
  accounts: Account[];
  transactions: Transaction[];
  goals: Array<{
    name: string;
    type: string;
    target: number;
    current: number;
    deadline: Date;
    monthlyRequired: number;
  }>;
  now?: Date;
}): AggregatedContext {
  const now = input.now ?? new Date();
  const sixMonthsAgo = new Date(now);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const recent = input.transactions.filter((t) => new Date(t.date) >= sixMonthsAgo);

  let netWorth = 0;
  const byBankMap = new Map<string, number>();
  for (const acc of input.accounts) {
    netWorth += acc.balance;
    byBankMap.set(acc.bank, (byBankMap.get(acc.bank) ?? 0) + acc.balance);
  }
  const byBank = Array.from(byBankMap.entries())
    .map(([bank, balance]) => ({ bank, balance }))
    .sort((a, b) => b.balance - a.balance);

  const monthMap = new Map<string, { income: number; expense: number }>();
  for (const tx of recent) {
    if (tx.category === "transferencias") continue;
    const month = tx.date.slice(0, 7);
    const entry = monthMap.get(month) ?? { income: 0, expense: 0 };
    if (tx.amount > 0) entry.income += tx.amount;
    else entry.expense += Math.abs(tx.amount);
    monthMap.set(month, entry);
  }
  const monthOverMonth = Array.from(monthMap.entries())
    .map(([month, { income, expense }]) => ({ month, income, expense, net: income - expense }))
    .sort((a, b) => a.month.localeCompare(b.month));

  const totalIncomeLast6m = monthOverMonth.reduce((s, m) => s + m.income, 0);
  const totalExpenseLast6m = monthOverMonth.reduce((s, m) => s + m.expense, 0);
  const monthlyExpenseAverage =
    monthOverMonth.length === 0 ? 0 : totalExpenseLast6m / monthOverMonth.length;

  const catMap = new Map<string, number>();
  for (const tx of recent) {
    if (tx.amount >= 0) continue;
    if (tx.category === "transferencias" || tx.category === "investimentos") continue;
    catMap.set(tx.category, (catMap.get(tx.category) ?? 0) + Math.abs(tx.amount));
  }
  const totalCatSpend = Array.from(catMap.values()).reduce((a, b) => a + b, 0);
  const topCategoriesLast6m = Array.from(catMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([category, total]) => ({
      category,
      total,
      share: totalCatSpend === 0 ? 0 : total / totalCatSpend,
    }));

  return {
    netWorth: Math.round(netWorth * 100) / 100,
    byBank,
    totalIncomeLast6m,
    totalExpenseLast6m,
    monthlyExpenseAverage,
    topCategoriesLast6m,
    monthOverMonth,
    goals: input.goals.map((g) => ({
      name: g.name,
      type: g.type,
      target: g.target,
      current: g.current,
      deadline: g.deadline.toISOString().slice(0, 10),
      progressPct: g.target === 0 ? 0 : Math.min(100, (g.current / g.target) * 100),
      monthlyRequired: g.monthlyRequired,
    })),
  };
}

function formatContextForPrompt(ctx: AggregatedContext): string {
  const lines: string[] = [];
  lines.push("=== Patrimônio atual ===");
  lines.push(`Total: ${BRL.format(ctx.netWorth)}`);
  for (const b of ctx.byBank) lines.push(`  ${b.bank}: ${BRL.format(b.balance)}`);

  lines.push("\n=== Últimos 6 meses ===");
  lines.push(`Receita total: ${BRL.format(ctx.totalIncomeLast6m)}`);
  lines.push(`Despesa total: ${BRL.format(ctx.totalExpenseLast6m)}`);
  lines.push(`Despesa média mensal: ${BRL.format(ctx.monthlyExpenseAverage)}`);

  lines.push("\nFluxo mês a mês:");
  for (const m of ctx.monthOverMonth) {
    lines.push(
      `  ${m.month}: +${BRL.format(m.income)} / -${BRL.format(m.expense)} = ${BRL.format(m.net)}`,
    );
  }

  lines.push("\nTop categorias de gasto:");
  for (const c of ctx.topCategoriesLast6m.slice(0, 8)) {
    const label = CATEGORY_LABELS[c.category] ?? c.category;
    lines.push(`  ${label}: ${BRL.format(c.total)} (${(c.share * 100).toFixed(0)}% dos gastos)`);
  }

  if (ctx.goals.length > 0) {
    lines.push("\n=== Metas financeiras ===");
    for (const g of ctx.goals) {
      lines.push(
        `  ${g.name} (${g.type}): ${BRL.format(g.current)}/${BRL.format(g.target)} = ${g.progressPct.toFixed(0)}% · prazo ${g.deadline} · aporte mensal necessário ${BRL.format(g.monthlyRequired)}`,
      );
    }
  } else {
    lines.push("\n=== Metas ===\nNenhuma meta cadastrada.");
  }

  return lines.join("\n");
}

const SYSTEM_PROMPT = `Você é um analista financeiro pessoal especializado em finanças brasileiras. O usuário compartilha seu histórico financeiro real.

Sua tarefa: analisar os dados e gerar EXATAMENTE 3 a 5 insights acionáveis. Foque em:
- Padrões anômalos (categoria que cresceu acima do normal)
- Oportunidades de economia concretas
- Risco de não bater metas
- Hábitos positivos que vale reforçar
- Sugestões de aporte/investimento quando faz sentido

Tom: respeitoso, sem moralismo, direto. Use português brasileiro coloquial mas profissional. Evite clichês.

FORMATO DE RESPOSTA: retorne APENAS um JSON válido com a estrutura exata:
{
  "insights": [
    {
      "title": "headline curto (máx 60 chars)",
      "severity": "info" | "warning" | "success",
      "category": "categoria principal afetada (ex: alimentacao, lazer, metas)",
      "body": "1-2 frases explicando o padrão observado",
      "suggestion": "ação concreta e específica que o usuário pode tomar",
      "estimatedImpact": "impacto monetário estimado (ex: 'R$ 200/mês economizados') ou null"
    }
  ]
}

NÃO adicione comentários, prefácios, ou markdown. Apenas o JSON.`;

export async function generateInsights(input: {
  apiKey: string;
  context: AggregatedContext;
}): Promise<AnalysisResult> {
  const client = new Anthropic({ apiKey: input.apiKey });

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2000,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      {
        role: "user",
        content: `Analise meu histórico financeiro e gere insights:\n\n${formatContextForPrompt(input.context)}`,
      },
    ],
  });

  const textBlock = message.content.find((c) => c.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Resposta do modelo sem conteúdo de texto");
  }
  const raw = textBlock.text.trim();

  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  let parsed: { insights?: Insight[] };
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    throw new Error(
      `Resposta do modelo não é JSON válido: ${err instanceof Error ? err.message : "unknown"}`,
    );
  }

  if (!parsed.insights || !Array.isArray(parsed.insights)) {
    throw new Error("Resposta do modelo sem campo insights[] válido");
  }

  const insights: Insight[] = parsed.insights
    .filter((i) => typeof i.title === "string" && typeof i.body === "string")
    .map((i) => ({
      title: i.title,
      severity: (["info", "warning", "success"] as InsightSeverity[]).includes(i.severity)
        ? i.severity
        : "info",
      category: typeof i.category === "string" ? i.category : "outros",
      body: i.body,
      suggestion: typeof i.suggestion === "string" ? i.suggestion : "",
      estimatedImpact:
        typeof i.estimatedImpact === "string" && i.estimatedImpact.length > 0
          ? i.estimatedImpact
          : null,
    }));

  return {
    insights,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Top-level: get insights for a user. Uses cache if fresh, otherwise calls API.
 * Returns null if API key missing — caller renders config message.
 */
export async function getInsightsForUser(input: {
  userId: string;
  apiKey: string | undefined;
  context: AggregatedContext;
  forceRefresh?: boolean;
}): Promise<AnalysisResult | null> {
  if (!input.apiKey) return null;

  if (!input.forceRefresh) {
    const cached = readCache(input.userId);
    if (cached) return cached;
  }

  const result = await generateInsights({
    apiKey: input.apiKey,
    context: input.context,
  });
  writeCache(input.userId, result);
  return result;
}
