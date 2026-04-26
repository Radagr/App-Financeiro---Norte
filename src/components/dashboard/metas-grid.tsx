import type { Goal } from "@/lib/mock/data";
import { cn } from "@/lib/utils";

import { ModuleCard } from "./module-card";

const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

const STATUS_LABEL: Record<Goal["status"], string> = {
  on_track: "No rumo",
  behind: "Atrasada",
  completed: "Concluída",
};

const STATUS_DOT: Record<Goal["status"], string> = {
  on_track: "bg-norte-positive",
  behind: "bg-norte-warn",
  completed: "bg-norte-secondary",
};

export function MetasGrid({ goals }: { goals: Goal[] }) {
  return (
    <ModuleCard title="Metas" subtitle="Progresso das suas metas financeiras">
      <ul className="space-y-4">
        {goals.map((g) => {
          const pct = Math.min(100, (g.current / g.target) * 100);
          return (
            <li key={g.id} className="space-y-2">
              <div className="flex items-baseline justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span
                    className={cn("h-1.5 w-1.5 rounded-full", STATUS_DOT[g.status])}
                    aria-hidden="true"
                  />
                  <span className="text-sm font-medium">{g.name}</span>
                  <span className="text-muted-foreground text-xs">· {STATUS_LABEL[g.status]}</span>
                </div>
                <p className="tabular font-mono text-xs">
                  <span className="font-semibold">{BRL.format(g.current)}</span>
                  <span className="text-muted-foreground"> / {BRL.format(g.target)}</span>
                </p>
              </div>
              <div className="bg-muted h-1.5 overflow-hidden rounded-full">
                <div
                  className="bg-norte-secondary h-full rounded-full transition-all"
                  style={{ width: `${pct}%` }}
                  aria-label={`${pct.toFixed(0)}% concluído`}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </ModuleCard>
  );
}
