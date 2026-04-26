import { describe, expect, it } from "vitest";

import { computeSpendByCategoryMonth, topCategoriesWithOthers } from "@/lib/mock/computations";
import type { Transaction } from "@/lib/mock/data";

const sampleTxs: Transaction[] = [
  {
    id: "1",
    accountId: "a",
    date: "2026-01-15",
    amount: -100,
    description: "Mercado",
    category: "alimentacao",
  },
  {
    id: "2",
    accountId: "a",
    date: "2026-01-20",
    amount: -50,
    description: "Uber",
    category: "transporte",
  },
  {
    id: "3",
    accountId: "a",
    date: "2026-02-01",
    amount: -200,
    description: "Restaurante",
    category: "alimentacao",
  },
  {
    id: "4",
    accountId: "a",
    date: "2026-02-10",
    amount: -75,
    description: "iFood",
    category: "alimentacao",
  },
  {
    id: "5",
    accountId: "a",
    date: "2026-02-15",
    amount: -3000,
    description: "PIX para mim mesmo",
    category: "transferencias",
  },
  {
    id: "6",
    accountId: "a",
    date: "2026-02-20",
    amount: 5000,
    description: "Salário",
    category: "receita_fixa",
  },
];

describe("computeSpendByCategoryMonth", () => {
  it("groups by month + category, excluding transferencias and income", () => {
    const result = computeSpendByCategoryMonth(sampleTxs);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      month: "2026-01",
      byCategory: { alimentacao: 100, transporte: 50 },
      total: 150,
    });
    expect(result[1]).toEqual({
      month: "2026-02",
      byCategory: { alimentacao: 275 },
      total: 275,
    });
  });

  it("returns empty array when no outflows", () => {
    const result = computeSpendByCategoryMonth([sampleTxs[5]!]);
    expect(result).toEqual([]);
  });
});

describe("topCategoriesWithOthers", () => {
  it("returns top N categories plus 'outros' when more exist", () => {
    const txs: Transaction[] = [
      {
        id: "1",
        accountId: "a",
        date: "2026-01-01",
        amount: -1000,
        description: "x",
        category: "alimentacao",
      },
      {
        id: "2",
        accountId: "a",
        date: "2026-01-01",
        amount: -500,
        description: "x",
        category: "transporte",
      },
      {
        id: "3",
        accountId: "a",
        date: "2026-01-01",
        amount: -300,
        description: "x",
        category: "saude",
      },
      {
        id: "4",
        accountId: "a",
        date: "2026-01-01",
        amount: -100,
        description: "x",
        category: "lazer",
      },
    ];
    const result = topCategoriesWithOthers(txs, 2);
    expect(result).toEqual(["alimentacao", "transporte", "outros"]);
  });

  it("does not append 'outros' if total categories <= N", () => {
    const txs: Transaction[] = [
      {
        id: "1",
        accountId: "a",
        date: "2026-01-01",
        amount: -1000,
        description: "x",
        category: "alimentacao",
      },
      {
        id: "2",
        accountId: "a",
        date: "2026-01-01",
        amount: -500,
        description: "x",
        category: "transporte",
      },
    ];
    const result = topCategoriesWithOthers(txs, 5);
    expect(result).toEqual(["alimentacao", "transporte"]);
  });
});
