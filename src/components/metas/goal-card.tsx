import type { CategoryAvg } from "@/lib/goals";
import { suggestSavingFromCategory } from "@/lib/goals";
import { cn } from "@/lib/utils";

import { ContributeForm } from "./contribute-form";
import { DeleteGoalButton } from "./delete-goal-button";

const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

const TYPE_LABEL: Record<string, string> = {
  emergency: "Reserva de emergência",
  trip: "Viagem",
  house: "Imóvel",
  vehicle: "Veículo",
  retirement: "Aposentadoria",
  education: "Educação",
  custom: "Personalizada",
};

const STATUS_LABEL: Record<"on_track" | "behind" | "completed", string> = {
  on_track: "No rumo",
  behind: "Atrasada",
  completed: "Concluída",
};

const STATUS_DOT: Record<"on_track" | "behind" | "completed", string> = {
  on_track: "bg-norte-positive",
  behind: "bg-norte-warn",
  completed: "bg-norte-secondary",
};

const CATEGORY_LABELS: Record<string, string> = {
  moradia: "moradia",
  alimentacao: "alimentação",
  transporte: "transporte",
  saude: "saúde",
  lazer: "lazer",
  educacao: "educação",
  servicos: "serviços",
  outros: "outros",
};

function monthsLabel(deadline: Date): string {
  const now = new Date();
  const months = Math.max(
    0,
    (deadline.getFullYear() - now.getFullYear()) * 12 + (deadline.getMonth() - now.getMonth()),
  );
  if (months === 0) return "Este mês";
  if (months === 1) return "1 mês";
  return `${months} meses`;
}

type Goal = {
  id: string;
  name: string;
  type: string;
  target: number;
  current: number;
  deadline: Date;
  priority: number;
  status: "on_track" | "behind" | "completed";
  monthlyRequired: number;
  progressPct: number;
};

export function GoalCard({ goal, categoryAvgs }: { goal: Goal; categoryAvgs: CategoryAvg[] }) {
  const suggestion =
    goal.status !== "completed" && goal.monthlyRequired > 0
      ? suggestSavingFromCategory(goal.monthlyRequired, categoryAvgs)
      : null;

  const topCategoryAvg =
    suggestion != null
      ? (categoryAvgs.find((c) => c.category === suggestion.category)?.monthlyAvg ?? 0)
      : 0;

  return (
    <article className="border-border bg-card text-card-foreground shadow-card flex flex-col gap-4 rounded-lg border p-5">
      {/* Card header */}
      <header className="space-y-1">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-muted-foreground text-xs tracking-wider uppercase">
              {TYPE_LABEL[goal.type] ?? "Personalizada"}
            </p>
            <h2 className="font-serif text-xl tracking-tight">{goal.name}</h2>
          </div>
          <DeleteGoalButton id={goal.id} name={goal.name} />
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_DOT[goal.status])} aria-hidden />
          <span className="text-muted-foreground">{STATUS_LABEL[goal.status]}</span>
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground">Faltam {monthsLabel(goal.deadline)}</span>
        </div>
      </header>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <span className="tabular font-mono text-2xl font-semibold">
            {BRL.format(goal.current)}
          </span>
          <span className="text-muted-foreground tabular font-mono text-sm">
            de {BRL.format(goal.target)}
          </span>
        </div>
        <div className="bg-muted h-2 overflow-hidden rounded-full">
          <div
            className="bg-norte-secondary h-full rounded-full transition-all"
            style={{ width: `${goal.progressPct}%` }}
            aria-label={`${goal.progressPct.toFixed(0)}% concluído`}
          />
        </div>
        <p className="text-muted-foreground text-right text-xs">
          {goal.progressPct.toFixed(0)}% concluído
        </p>
      </div>

      {/* Monthly required + suggestion */}
      {goal.status !== "completed" ? (
        <div className="bg-muted/50 space-y-1 rounded-md p-3">
          <p className="text-muted-foreground text-xs">Aporte mensal sugerido</p>
          <p className="tabular text-norte-primary font-mono text-lg font-semibold dark:text-white">
            {BRL.format(goal.monthlyRequired)}
          </p>
          {suggestion != null && topCategoryAvg > 0 ? (
            <p className="text-muted-foreground mt-1 text-xs">
              Cortar ~{Math.round((suggestion.cutAmount / topCategoryAvg) * 100)}% em{" "}
              <span className="font-medium">
                {CATEGORY_LABELS[suggestion.category] ?? suggestion.category}
              </span>{" "}
              libera {BRL.format(suggestion.cutAmount)}/mês.
            </p>
          ) : null}
        </div>
      ) : null}

      {/* Contribute inline */}
      {goal.status !== "completed" ? (
        <ContributeForm goalId={goal.id} goalName={goal.name} />
      ) : (
        <div className="bg-norte-light/50 rounded-md p-3 text-center">
          <p className="text-norte-secondary text-sm font-medium">Meta concluída!</p>
        </div>
      )}
    </article>
  );
}
