"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import type { AlocacaoSlice } from "@/lib/mock/computations";
import type { AssetClass } from "@/lib/mock/data";

import { ModuleCard } from "./module-card";

const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

const CLASS_LABELS: Record<AssetClass, string> = {
  rf: "Renda Fixa",
  rv: "Renda Variável",
  fii: "FIIs",
  cripto: "Cripto",
  cash: "Caixa",
};

const CLASS_COLORS: Record<AssetClass, string> = {
  rf: "var(--color-chart-1)",
  rv: "var(--color-chart-2)",
  fii: "var(--color-chart-3)",
  cripto: "var(--color-chart-4)",
  cash: "var(--color-chart-5)",
};

function AlocacaoTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: AlocacaoSlice }>;
}) {
  if (!active || !payload?.length) return null;
  const slice = payload[0]!.payload;
  return (
    <div className="border-border bg-popover text-popover-foreground shadow-card rounded-md border px-3 py-2 text-xs">
      <p className="font-medium">{CLASS_LABELS[slice.assetClass]}</p>
      <p className="tabular mt-0.5 font-mono">
        {BRL.format(slice.value)} · {slice.percentage.toFixed(1)}%
      </p>
    </div>
  );
}

export function AlocacaoDonut({ slices }: { slices: AlocacaoSlice[] }) {
  return (
    <ModuleCard title="Alocação" subtitle="Investimentos por classe de ativo">
      <div className="flex items-center gap-6">
        <div className="h-44 w-44 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={slices}
                dataKey="value"
                nameKey="assetClass"
                innerRadius={56}
                outerRadius={84}
                paddingAngle={2}
                strokeWidth={0}
              >
                {slices.map((s) => (
                  <Cell key={s.assetClass} fill={CLASS_COLORS[s.assetClass]} />
                ))}
              </Pie>
              <Tooltip content={<AlocacaoTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <ul className="flex-1 space-y-1.5 text-sm">
          {slices.map((s) => (
            <li key={s.assetClass} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: CLASS_COLORS[s.assetClass] }}
                  aria-hidden="true"
                />
                <span>{CLASS_LABELS[s.assetClass]}</span>
              </span>
              <span className="tabular font-mono text-xs">{s.percentage.toFixed(1)}%</span>
            </li>
          ))}
        </ul>
      </div>
    </ModuleCard>
  );
}
