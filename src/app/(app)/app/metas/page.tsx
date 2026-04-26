import { redirect } from "next/navigation";

import { CreateGoalForm } from "@/components/metas/create-goal-form";
import { GoalCard } from "@/components/metas/goal-card";
import { ModuleCard } from "@/components/dashboard/module-card";
import { transactions } from "@/lib/data/imported";
import type { CategoryAvg } from "@/lib/goals";
import { computeGoalStatus, monthlyContributionRequired } from "@/lib/goals";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const EXCLUDED = new Set(["transferencias", "investimentos", "receita_fixa", "receita_variavel"]);

function categoryAveragesLast6Months(): CategoryAvg[] {
  const now = new Date("2026-04-25");
  const cutoff = new Date(now);
  cutoff.setMonth(cutoff.getMonth() - 6);
  const totals = new Map<string, number>();
  for (const tx of transactions) {
    if (tx.amount >= 0) continue;
    if (EXCLUDED.has(tx.category)) continue;
    if (new Date(tx.date) < cutoff) continue;
    totals.set(tx.category, (totals.get(tx.category) ?? 0) + Math.abs(tx.amount));
  }
  return Array.from(totals.entries()).map(([category, sum]) => ({
    category,
    monthlyAvg: sum / 6,
  }));
}

export default async function MetasPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Query Prisma directly (RSC pattern — avoids tRPC context plumbing for server render)
  const rows = await prisma.goal.findMany({
    where: { userId: user.id },
    orderBy: [{ priority: "desc" }, { deadline: "asc" }],
  });

  const goals = rows.map((g) => {
    const target = Number(g.target);
    const current = Number(g.current);
    return {
      id: g.id,
      name: g.name,
      type: g.type,
      target,
      current,
      deadline: g.deadline,
      priority: g.priority,
      status: computeGoalStatus({ target, current, deadline: g.deadline }),
      monthlyRequired: monthlyContributionRequired({ target, current, deadline: g.deadline }),
      progressPct: target === 0 ? 0 : Math.min(100, (current / target) * 100),
    };
  });

  const categoryAvgs = categoryAveragesLast6Months();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
        <div className="space-y-0.5">
          <p className="text-muted-foreground text-xs tracking-[0.2em] uppercase">metas</p>
          <h1 className="text-norte-primary font-serif text-3xl tracking-tight dark:text-white">
            Metas financeiras
          </h1>
          <p className="text-muted-foreground text-sm">
            Defina objetivos e acompanhe seu progresso mês a mês.
          </p>
        </div>
        <CreateGoalForm />
      </header>

      {goals.length === 0 ? (
        <ModuleCard title="Sem metas ainda">
          <p className="text-muted-foreground py-6 text-center text-sm">
            Crie sua primeira meta — reserva de emergência, viagem, ou o que for importante pra
            você.
          </p>
        </ModuleCard>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {goals.map((g) => (
            <GoalCard key={g.id} goal={g} categoryAvgs={categoryAvgs} />
          ))}
        </div>
      )}
    </div>
  );
}
