"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

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

const CHART_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
  "var(--color-chart-6)",
  "var(--color-norte-warn)",
  "var(--color-muted-foreground)",
];

function formatMonth(month: string): string {
  const [, mm] = month.split("-");
  if (!mm) return month;
  const date = new Date(2000, Number(mm) - 1, 1);
  return date.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
}

type ChartRow = { month: string } & Record<string, number | string>;

function StackTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string; color: string; name?: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const sorted = [...payload].sort((a, b) => b.value - a.value);
  const total = payload.reduce((sum, p) => sum + p.value, 0);
  return (
    <div className="border-border bg-popover text-popover-foreground shadow-card rounded-md border px-3 py-2 text-xs">
      <p className="text-muted-foreground mb-2 font-mono">{label ? formatMonth(label) : ""}</p>
      {sorted.map((p) => (
        <p key={p.dataKey} className="tabular flex items-center gap-2 font-mono">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} aria-hidden />
          <span>{CATEGORY_LABELS[p.dataKey] ?? p.dataKey}</span>
          <span className="ml-auto">{BRL.format(p.value)}</span>
        </p>
      ))}
      <p className="border-border mt-2 flex justify-between border-t pt-1.5 font-mono font-semibold">
        <span>Total</span>
        <span className="tabular">{BRL.format(total)}</span>
      </p>
    </div>
  );
}

export function GastosStackChart({
  data,
  categories,
}: {
  data: CategoryMonthlyEntry[];
  categories: string[];
}) {
  // Convert to flat rows for Recharts
  const rows: ChartRow[] = data.map((e) => ({
    month: e.month,
    ...categories.reduce(
      (acc, cat) => {
        acc[cat] = e.byCategory[cat] ?? 0;
        return acc;
      },
      {} as Record<string, number>,
    ),
  }));

  return (
    <ModuleCard title="Gastos empilhados" subtitle="Categoria por mês, período filtrado">
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 8, right: 4, bottom: 0, left: -16 }}>
            <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="month"
              tickFormatter={formatMonth}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => BRL.format(v).replace("R$", "").trim()}
            />
            <Tooltip
              content={<StackTooltip />}
              cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }}
            />
            {categories.map((cat, i) => (
              <Bar
                key={cat}
                dataKey={cat}
                stackId="spend"
                fill={CHART_COLORS[i % CHART_COLORS.length]}
                radius={i === categories.length - 1 ? [4, 4, 0, 0] : 0}
                name={CATEGORY_LABELS[cat] ?? cat}
              />
            ))}
            <Legend
              wrapperStyle={{ fontSize: 11, paddingTop: 12 }}
              iconType="circle"
              iconSize={8}
              formatter={(value: string) => CATEGORY_LABELS[value] ?? value}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ModuleCard>
  );
}
