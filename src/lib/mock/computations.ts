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
