import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type ModuleCardProps = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function ModuleCard({ title, subtitle, action, children, className }: ModuleCardProps) {
  return (
    <section
      className={cn(
        "border-border bg-card text-card-foreground shadow-card rounded-lg border",
        className,
      )}
    >
      <header className="flex items-start justify-between gap-4 px-5 pt-4 pb-3">
        <div className="space-y-0.5">
          <h2 className="font-serif text-base leading-none tracking-tight">{title}</h2>
          {subtitle ? <p className="text-muted-foreground text-xs">{subtitle}</p> : null}
        </div>
        {action ? <div className="flex-shrink-0">{action}</div> : null}
      </header>
      <div className="px-5 pb-5">{children}</div>
    </section>
  );
}
