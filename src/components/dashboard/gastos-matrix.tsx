import type { CategoryMonthlyEntry } from "@/lib/mock/computations";

import { ModuleCard } from "./module-card";

const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

const CATEGORY_LABELS: Record<string, string> = {
  moradia: "Moradia",
  alimentacao: "Alimentação",
  transporte: "Transporte",
  saude: "Saúde",
  lazer: "Lazer",
  educacao: "Educação",
  servicos: "Serviços",
  receita_fixa: "Receita fixa",
  receita_variavel: "Receita variável",
  impostos: "Impostos",
  dizimo: "Dízimo",
  outros: "Outros",
};

function formatMonth(month: string): string {
  const [yyyy, mm] = month.split("-");
  if (!mm) return month;
  const date = new Date(Number(yyyy), Number(mm) - 1, 1);
  return date.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
}

export function GastosMatrix({
  data,
  categories,
}: {
  data: CategoryMonthlyEntry[];
  categories: string[];
}) {
  // Compute row totals per category
  const categoryTotals = new Map<string, number>();
  for (const cat of categories) {
    let sum = 0;
    for (const e of data) sum += e.byCategory[cat] ?? 0;
    categoryTotals.set(cat, sum);
  }
  const grandTotal = data.reduce((s, e) => s + e.total, 0);
  const sortedCategories = [...categories].sort(
    (a, b) => (categoryTotals.get(b) ?? 0) - (categoryTotals.get(a) ?? 0),
  );

  return (
    <ModuleCard title="Detalhe categoria × mês" subtitle="Gastos no período">
      {data.length === 0 ? (
        <p className="text-muted-foreground py-6 text-center text-sm">
          Sem gastos no período selecionado.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-border text-muted-foreground border-b text-left text-xs tracking-wide uppercase">
                <th className="py-2 pr-4 font-medium">Categoria</th>
                {data.map((e) => (
                  <th key={e.month} className="px-2 py-2 text-right font-mono font-medium">
                    {formatMonth(e.month)}
                  </th>
                ))}
                <th className="border-border border-l py-2 pl-4 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {sortedCategories.map((cat) => (
                <tr key={cat} className="border-border/60 border-b last:border-b-0">
                  <td className="py-2 pr-4 font-medium">{CATEGORY_LABELS[cat] ?? cat}</td>
                  {data.map((e) => {
                    const v = e.byCategory[cat] ?? 0;
                    return (
                      <td key={e.month} className="tabular px-2 py-2 text-right font-mono text-xs">
                        {v === 0 ? (
                          <span className="text-muted-foreground/50">—</span>
                        ) : (
                          BRL.format(v)
                        )}
                      </td>
                    );
                  })}
                  <td className="border-border tabular border-l py-2 pl-4 text-right font-mono text-xs font-semibold">
                    {BRL.format(categoryTotals.get(cat) ?? 0)}
                  </td>
                </tr>
              ))}
              <tr className="border-border border-t-2">
                <td className="py-2 pr-4 font-semibold">Total</td>
                {data.map((e) => (
                  <td
                    key={e.month}
                    className="tabular px-2 py-2 text-right font-mono text-xs font-semibold"
                  >
                    {BRL.format(e.total)}
                  </td>
                ))}
                <td className="border-border tabular border-l py-2 pl-4 text-right font-mono text-xs font-semibold">
                  {BRL.format(grandTotal)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </ModuleCard>
  );
}
