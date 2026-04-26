import { describe, expect, it } from "vitest";

import {
  computeAlocacao,
  computeFluxoCaixa,
  computeSaldoConsolidado,
  filterTransactionsByPeriod,
} from "@/lib/mock/computations";
import { accounts, positions, transactions } from "@/lib/mock/data";

describe("computeSaldoConsolidado", () => {
  it("sums liquid balances (excludes negative credit balances and investments)", () => {
    const result = computeSaldoConsolidado(accounts);
    // Liquid = checking + savings (NOT credit, NOT investment)
    // Itaú + Inter + Caixa = 8420.55 + 12340 + 18750.20 = 39510.75
    expect(result.liquid).toBeCloseTo(39510.75, 2);
  });

  it("returns breakdown grouped by bank", () => {
    const result = computeSaldoConsolidado(accounts);
    expect(result.byBank).toContainEqual(expect.objectContaining({ bank: "Itaú", total: 8420.55 }));
    expect(result.byBank).toContainEqual(expect.objectContaining({ bank: "Inter", total: 12340 }));
  });

  it("includes total = liquid + investments - credit", () => {
    const result = computeSaldoConsolidado(accounts);
    // Liquid 39510.75 + investments (45200 + 28100.50 + 7890.30 = 81190.80) - credit 3210.40
    expect(result.total).toBeCloseTo(39510.75 + 81190.8 - 3210.4, 2);
  });
});

describe("computeFluxoCaixa", () => {
  it("groups transactions by month with separate income vs expense", () => {
    const result = computeFluxoCaixa(transactions);
    expect(result).toHaveLength(12);
    for (const month of result) {
      expect(month).toHaveProperty("month");
      expect(month.income).toBeGreaterThan(0);
      expect(month.expense).toBeGreaterThan(0);
    }
  });

  it("sorts by month ascending", () => {
    const result = computeFluxoCaixa(transactions);
    for (let i = 1; i < result.length; i++) {
      expect(result[i]!.month >= result[i - 1]!.month).toBe(true);
    }
  });
});

describe("computeAlocacao", () => {
  it("returns one slice per asset class with sum + percentage", () => {
    const result = computeAlocacao(positions);
    const classes = result.map((s) => s.assetClass).sort();
    expect(classes).toEqual(["cripto", "fii", "rf", "rv"]);
  });

  it("percentages sum to ~100", () => {
    const result = computeAlocacao(positions);
    const total = result.reduce((acc, s) => acc + s.percentage, 0);
    expect(total).toBeCloseTo(100, 1);
  });

  it("returns slices in descending value order", () => {
    const result = computeAlocacao(positions);
    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1]!.value >= result[i]!.value).toBe(true);
    }
  });
});

describe("filterTransactionsByPeriod", () => {
  it("returns only transactions in [start, end]", () => {
    const start = new Date("2026-03-01");
    const end = new Date("2026-03-31");
    const result = filterTransactionsByPeriod(transactions, start, end);
    for (const tx of result) {
      const d = new Date(tx.date);
      expect(d >= start && d <= end).toBe(true);
    }
  });
});
