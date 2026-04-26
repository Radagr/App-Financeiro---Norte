import type { Account, AssetClass, InvestmentPosition, Transaction } from "./data";

export type SaldoConsolidado = {
  liquid: number;
  total: number;
  byBank: Array<{ bank: string; total: number }>;
};

const LIQUID_KINDS = new Set(["checking", "savings"]);
const INVESTMENT_KIND = "investment";
const CREDIT_KIND = "credit";

export function computeSaldoConsolidado(accounts: Account[]): SaldoConsolidado {
  let liquid = 0;
  let investments = 0;
  let credit = 0;

  for (const acc of accounts) {
    if (LIQUID_KINDS.has(acc.kind)) liquid += acc.balance;
    else if (acc.kind === INVESTMENT_KIND) investments += acc.balance;
    else if (acc.kind === CREDIT_KIND) credit += Math.abs(acc.balance);
  }

  const byBankMap = new Map<string, number>();
  for (const acc of accounts) {
    byBankMap.set(acc.bank, (byBankMap.get(acc.bank) ?? 0) + acc.balance);
  }
  const byBank = Array.from(byBankMap.entries())
    .map(([bank, total]) => ({ bank, total }))
    .sort((a, b) => b.total - a.total);

  return { liquid, total: liquid + investments - credit, byBank };
}

export type FluxoMes = {
  month: string;
  income: number;
  expense: number;
};

export function computeFluxoCaixa(transactions: Transaction[]): FluxoMes[] {
  const map = new Map<string, { income: number; expense: number }>();

  for (const tx of transactions) {
    const month = tx.date.slice(0, 7);
    const entry = map.get(month) ?? { income: 0, expense: 0 };
    if (tx.amount > 0) entry.income += tx.amount;
    else entry.expense += Math.abs(tx.amount);
    map.set(month, entry);
  }

  return Array.from(map.entries())
    .map(([month, { income, expense }]) => ({ month, income, expense }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

export type AlocacaoSlice = {
  assetClass: AssetClass;
  value: number;
  percentage: number;
};

export function computeAlocacao(positions: InvestmentPosition[]): AlocacaoSlice[] {
  const map = new Map<AssetClass, number>();
  let total = 0;

  for (const p of positions) {
    map.set(p.assetClass, (map.get(p.assetClass) ?? 0) + p.currentValue);
    total += p.currentValue;
  }

  return Array.from(map.entries())
    .map(([assetClass, value]) => ({
      assetClass,
      value,
      percentage: total === 0 ? 0 : (value / total) * 100,
    }))
    .sort((a, b) => b.value - a.value);
}

export function filterTransactionsByPeriod(
  transactions: Transaction[],
  start: Date,
  end: Date,
): Transaction[] {
  const startTime = start.getTime();
  const endTime = end.getTime();
  return transactions.filter((tx) => {
    const t = new Date(tx.date).getTime();
    return t >= startTime && t <= endTime;
  });
}

export type CategoryMonthlyEntry = {
  month: string; // YYYY-MM
  byCategory: Record<string, number>; // category -> abs spending
  total: number;
};

const EXCLUDED_CATEGORIES = new Set(["transferencias", "investimentos"]);

/**
 * Aggregates spending (outflows only) by month and category.
 * Excludes transferencias and investimentos (intra-account flows).
 * Sorted by month ascending.
 */
export function computeSpendByCategoryMonth(transactions: Transaction[]): CategoryMonthlyEntry[] {
  const map = new Map<string, Record<string, number>>();

  for (const tx of transactions) {
    if (tx.amount >= 0) continue;
    if (EXCLUDED_CATEGORIES.has(tx.category)) continue;
    const month = tx.date.slice(0, 7);
    const entry = map.get(month) ?? {};
    entry[tx.category] = (entry[tx.category] ?? 0) + Math.abs(tx.amount);
    map.set(month, entry);
  }

  return Array.from(map.entries())
    .map(([month, byCategory]) => ({
      month,
      byCategory,
      total: Object.values(byCategory).reduce((a, b) => a + b, 0),
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

/**
 * Returns the top N categories by total absolute spending (over all transactions),
 * with the rest collapsed into "outros".
 * Useful for stacked chart legends where you want to limit cardinality.
 */
export function topCategoriesWithOthers(transactions: Transaction[], n: number): string[] {
  const totals = new Map<string, number>();
  for (const tx of transactions) {
    if (tx.amount >= 0) continue;
    if (EXCLUDED_CATEGORIES.has(tx.category)) continue;
    totals.set(tx.category, (totals.get(tx.category) ?? 0) + Math.abs(tx.amount));
  }
  const sorted = Array.from(totals.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([cat]) => cat);
  const top = sorted.slice(0, n);
  if (sorted.length > n) top.push("outros");
  return Array.from(new Set(top)); // ensure "outros" not duplicated if it was already in top
}
