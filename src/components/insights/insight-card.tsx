import { AlertTriangle, CheckCircle2, Info } from "lucide-react";

import type { Insight } from "@/lib/insights";
import { cn } from "@/lib/utils";

const SEVERITY_STYLES = {
  info: {
    border: "border-norte-info/30",
    bg: "bg-norte-info/5",
    iconColor: "text-norte-info",
    Icon: Info,
  },
  warning: {
    border: "border-norte-warn/40",
    bg: "bg-norte-warn/10",
    iconColor: "text-norte-warn",
    Icon: AlertTriangle,
  },
  success: {
    border: "border-norte-positive/30",
    bg: "bg-norte-positive/10",
    iconColor: "text-norte-positive",
    Icon: CheckCircle2,
  },
} as const;

export function InsightCard({ insight }: { insight: Insight }) {
  const style = SEVERITY_STYLES[insight.severity];
  const Icon = style.Icon;

  return (
    <article
      className={cn(
        "border-border bg-card text-card-foreground shadow-card flex flex-col gap-3 rounded-lg border-l-4 p-5",
        style.border,
      )}
    >
      <header className="flex items-start gap-3">
        <span className={cn("mt-0.5 flex-shrink-0 rounded-md p-1.5", style.bg)}>
          <Icon className={cn("size-4", style.iconColor)} aria-hidden />
        </span>
        <div className="space-y-0.5">
          <p className="text-muted-foreground text-xs tracking-wider uppercase">
            {insight.category}
          </p>
          <h3 className="font-serif text-lg leading-tight tracking-tight">{insight.title}</h3>
        </div>
      </header>

      <p className="text-foreground text-sm leading-relaxed">{insight.body}</p>

      {insight.suggestion ? (
        <div className="bg-muted/50 rounded-md p-3">
          <p className="text-muted-foreground text-xs tracking-wider uppercase">Ação sugerida</p>
          <p className="mt-1 text-sm">{insight.suggestion}</p>
          {insight.estimatedImpact ? (
            <p className="text-norte-secondary mt-2 font-mono text-xs font-semibold">
              {insight.estimatedImpact}
            </p>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
