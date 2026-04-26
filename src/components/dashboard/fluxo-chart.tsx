"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { FluxoMes } from "@/lib/mock/computations";

import { ModuleCard } from "./module-card";

const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

function formatMonth(month: string): string {
  // YYYY-MM → "abr"
  const [, mm] = month.split("-");
  if (!mm) return month;
  const date = new Date(2000, Number(mm) - 1, 1);
  return date.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
}

type TooltipPayload = { value: number; dataKey: string }[];

function FluxoTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayload;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const income = payload.find((p) => p.dataKey === "income")?.value ?? 0;
  const expense = payload.find((p) => p.dataKey === "expense")?.value ?? 0;
  return (
    <div className="border-border bg-popover text-popover-foreground shadow-card rounded-md border px-3 py-2 text-xs">
      <p className="text-muted-foreground mb-1.5 font-mono">{label ? formatMonth(label) : ""}</p>
      <p className="tabular flex items-center gap-2 font-mono">
        <span className="bg-norte-positive h-2 w-2 rounded-full" /> Entradas:{" "}
        <span className="ml-auto">{BRL.format(income)}</span>
      </p>
      <p className="tabular mt-0.5 flex items-center gap-2 font-mono">
        <span className="bg-norte-negative h-2 w-2 rounded-full" /> Saídas:{" "}
        <span className="ml-auto">{BRL.format(expense)}</span>
      </p>
    </div>
  );
}

export function FluxoChart({ data }: { data: FluxoMes[] }) {
  return (
    <ModuleCard title="Fluxo de caixa" subtitle="Receitas vs despesas mensais">
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: -16 }}>
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
              content={<FluxoTooltip />}
              cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }}
            />
            <Bar dataKey="income" fill="var(--color-norte-positive)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expense" fill="var(--color-norte-negative)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ModuleCard>
  );
}
