"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ModuleCard } from "./module-card";

const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

type Series = { date: string; netWorth: number };

function formatMonth(date: string): string {
  const d = new Date(date);
  return d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
}

function PatrimonioTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ value: number; payload: Series }>;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0]!;
  return (
    <div className="border-border bg-popover text-popover-foreground shadow-card rounded-md border px-3 py-2 text-xs">
      <p className="text-muted-foreground font-mono">{formatMonth(point.payload.date)}</p>
      <p className="tabular mt-0.5 font-mono font-semibold">{BRL.format(point.value)}</p>
    </div>
  );
}

export function PatrimonioChart({ data }: { data: Series[] }) {
  const first = data[0]?.netWorth ?? 0;
  const last = data[data.length - 1]?.netWorth ?? 0;
  const delta = last - first;
  const deltaPct = first === 0 ? 0 : (delta / first) * 100;
  const positive = delta >= 0;

  return (
    <ModuleCard
      title="Evolução patrimonial"
      subtitle={`12 meses · ${positive ? "+" : ""}${deltaPct.toFixed(1)}%`}
    >
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: -16 }}>
            <defs>
              <linearGradient id="patFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="date"
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
              content={<PatrimonioTooltip />}
              cursor={{ stroke: "hsl(var(--muted-foreground))", strokeOpacity: 0.4 }}
            />
            <Area
              type="monotone"
              dataKey="netWorth"
              stroke="var(--color-chart-1)"
              strokeWidth={2}
              fill="url(#patFill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ModuleCard>
  );
}
