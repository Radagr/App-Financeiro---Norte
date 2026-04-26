import Link from "next/link";
import { redirect } from "next/navigation";

import { LogoutButton } from "@/components/auth/logout-button";
import { ModuleCard } from "@/components/dashboard/module-card";
import { buttonVariants } from "@/components/ui/button";
import { accounts, transactions } from "@/lib/data/imported";
import {
  computeFluxoCaixa,
  computeSaldoConsolidado,
  filterTransactionsByPeriod,
} from "@/lib/mock/computations";
import { goals } from "@/lib/mock/data";
import { periodToDateRange } from "@/lib/mock/periods";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

const BRL_PRECISE = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const CATEGORY_LABELS: Record<string, string> = {
  moradia: "Moradia",
  alimentacao: "Alimentação",
  transporte: "Transporte",
  saude: "Saúde",
  lazer: "Lazer",
  educacao: "Educação",
  servicos: "Serviços",
  investimentos: "Investimentos",
  transferencias: "Transferências",
  receita_fixa: "Receita fixa",
  receita_variavel: "Receita variável",
  impostos: "Impostos",
  dizimo: "Dízimo",
  outros: "Outros",
};

export default async function ResumoPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser?.onboardedAt) redirect("/onboarding");

  // Current month spending (last 30 days)
  const { start, end } = periodToDateRange("1m");
  const monthTxs = filterTransactionsByPeriod(transactions, start, end);

  const saldo = computeSaldoConsolidado(accounts);

  // Aggregate spending by category for the period (only outflows)
  const spendByCategory = new Map<string, number>();
  let totalSpend = 0;
  for (const tx of monthTxs) {
    if (tx.amount >= 0) continue;
    if (tx.category === "transferencias" || tx.category === "investimentos") continue;
    const abs = Math.abs(tx.amount);
    spendByCategory.set(tx.category, (spendByCategory.get(tx.category) ?? 0) + abs);
    totalSpend += abs;
  }
  const topCategories = Array.from(spendByCategory.entries())
    .map(([category, amount]) => ({ category, amount, share: amount / totalSpend }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3);

  // Cash flow last month
  const fluxo = computeFluxoCaixa(monthTxs);
  const lastMonth = fluxo[fluxo.length - 1];
  const monthIncome = lastMonth?.income ?? 0;
  const monthExpense = lastMonth?.expense ?? 0;

  // Goals status
  const goalsOnTrack = goals.filter((g) => g.status === "on_track").length;
  const goalsBehind = goals.filter((g) => g.status === "behind").length;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="space-y-1">
        <p className="text-muted-foreground text-xs tracking-[0.2em] uppercase">resumo</p>
        <h1 className="text-norte-primary font-serif text-3xl tracking-tight dark:text-white">
          Olá, {dbUser.name}
        </h1>
        <p className="text-muted-foreground text-sm">
          Snapshot da sua vida financeira nos últimos 30 dias.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Saldo destacado */}
        <div className="lg:col-span-4">
          <ModuleCard title="Patrimônio" subtitle="Total consolidado">
            <p className="tabular text-norte-primary font-mono text-3xl font-semibold tracking-tight dark:text-white">
              {BRL.format(saldo.total)}
            </p>
            <p className="text-muted-foreground tabular mt-1 text-sm">
              Líquido: <span className="font-mono">{BRL_PRECISE.format(saldo.liquid)}</span>
            </p>
            <Link
              href="/app/dashboard"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-4 w-full")}
            >
              Ver dashboard 360°
            </Link>
          </ModuleCard>
        </div>

        {/* Fluxo do mês */}
        <div className="lg:col-span-4">
          <ModuleCard title="Fluxo do mês" subtitle="Receita vs despesa, últimos 30 dias">
            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="text-muted-foreground text-sm">Entradas</span>
                <span className="tabular text-norte-positive font-mono text-lg font-semibold">
                  {BRL_PRECISE.format(monthIncome)}
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-muted-foreground text-sm">Saídas</span>
                <span className="tabular text-norte-negative font-mono text-lg font-semibold">
                  {BRL_PRECISE.format(monthExpense)}
                </span>
              </div>
              <div className="border-border flex items-baseline justify-between border-t pt-2">
                <span className="text-sm font-medium">Saldo</span>
                <span className="tabular font-mono text-lg font-semibold">
                  {BRL_PRECISE.format(monthIncome - monthExpense)}
                </span>
              </div>
            </div>
          </ModuleCard>
        </div>

        {/* Status metas */}
        <div className="lg:col-span-4">
          <ModuleCard title="Metas" subtitle={`${goals.length} metas ativas`}>
            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="flex items-center gap-2 text-sm">
                  <span className="bg-norte-positive h-1.5 w-1.5 rounded-full" aria-hidden />
                  No rumo
                </span>
                <span className="tabular font-mono text-lg font-semibold">{goalsOnTrack}</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="flex items-center gap-2 text-sm">
                  <span className="bg-norte-warn h-1.5 w-1.5 rounded-full" aria-hidden />
                  Atrasadas
                </span>
                <span className="tabular font-mono text-lg font-semibold">{goalsBehind}</span>
              </div>
              <Link
                href="/app/metas"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-3 w-full")}
              >
                Gerenciar metas
              </Link>
            </div>
          </ModuleCard>
        </div>

        {/* Top categorias */}
        <div className="lg:col-span-8">
          <ModuleCard
            title="Onde foi seu dinheiro"
            subtitle="Top 3 categorias dos últimos 30 dias"
            action={
              <Link
                href="/app/gastos"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                Ver todos os gastos
              </Link>
            }
          >
            {topCategories.length === 0 ? (
              <p className="text-muted-foreground py-6 text-center text-sm">
                Sem gastos registrados no período.
              </p>
            ) : (
              <ul className="space-y-3">
                {topCategories.map((c) => (
                  <li key={c.category} className="space-y-1.5">
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm font-medium">
                        {CATEGORY_LABELS[c.category] ?? c.category}
                      </span>
                      <p className="tabular font-mono text-sm">
                        <span className="font-semibold">{BRL_PRECISE.format(c.amount)}</span>
                        <span className="text-muted-foreground text-xs">
                          {" "}
                          · {(c.share * 100).toFixed(0)}%
                        </span>
                      </p>
                    </div>
                    <div className="bg-muted h-1.5 overflow-hidden rounded-full">
                      <div
                        className="bg-norte-secondary h-full rounded-full"
                        style={{ width: `${c.share * 100}%` }}
                        aria-hidden
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </ModuleCard>
        </div>

        {/* Insights teaser */}
        <div className="lg:col-span-4">
          <ModuleCard title="Insights" subtitle="Análise inteligente das suas finanças">
            <p className="text-muted-foreground text-sm">
              Em breve: agente IA que analisa seus padrões e sugere ajustes personalizados.
            </p>
            <Link
              href="/app/insights"
              aria-disabled="true"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "pointer-events-none mt-4 w-full opacity-50",
              )}
            >
              Ver insights
            </Link>
          </ModuleCard>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <LogoutButton />
      </div>
    </div>
  );
}
