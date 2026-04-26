"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import { PERIOD_LABELS, type Period } from "@/lib/mock/periods";
import { cn } from "@/lib/utils";

const PERIODS: Period[] = ["1m", "3m", "6m", "12m", "ytd"];

export function PeriodToggle({ current }: { current: Period }) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  function setPeriod(p: Period) {
    const next = new URLSearchParams(params.toString());
    next.set("period", p);
    startTransition(() => {
      router.replace(`?${next.toString()}`, { scroll: false });
    });
  }

  return (
    <div
      role="radiogroup"
      aria-label="Período"
      className={cn(
        "bg-muted text-muted-foreground inline-flex items-center rounded-full p-1 text-sm",
        pending && "opacity-70",
      )}
    >
      {PERIODS.map((p) => (
        <button
          key={p}
          type="button"
          role="radio"
          aria-checked={current === p}
          onClick={() => setPeriod(p)}
          className={cn(
            "rounded-full px-3 py-1 transition-colors",
            "hover:text-foreground",
            current === p && "bg-background text-foreground shadow-sm",
          )}
        >
          {PERIOD_LABELS[p]}
        </button>
      ))}
    </div>
  );
}
