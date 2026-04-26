import { redirect } from "next/navigation";

import { LogoutButton } from "@/components/auth/logout-button";
import { AlocacaoDonut } from "@/components/dashboard/alocacao-donut";
import { FluxoChart } from "@/components/dashboard/fluxo-chart";
import { MetasGrid } from "@/components/dashboard/metas-grid";
import { PatrimonioChart } from "@/components/dashboard/patrimonio-chart";
import { PeriodToggle } from "@/components/dashboard/period-toggle";
import { SaldoCard } from "@/components/dashboard/saldo-card";
import {
  computeAlocacao,
  computeFluxoCaixa,
  computeSaldoConsolidado,
  filterTransactionsByPeriod,
} from "@/lib/mock/computations";
import { accounts, goals, netWorthByMonth, positions, transactions } from "@/lib/mock/data";
import { parsePeriod, periodToDateRange } from "@/lib/mock/periods";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type SearchParams = Promise<{ period?: string }>;

export default async function AppPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser?.onboardedAt) redirect("/onboarding");

  const { period: rawPeriod } = await searchParams;
  const period = parsePeriod(rawPeriod);
  const { start, end } = periodToDateRange(period);

  const periodTxs = filterTransactionsByPeriod(transactions, start, end);
  const saldo = computeSaldoConsolidado(accounts);
  const fluxo = computeFluxoCaixa(periodTxs);
  const alocacao = computeAlocacao(positions);
  const patrimonio = netWorthByMonth();

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
        <div className="space-y-0.5">
          <p className="text-muted-foreground text-xs tracking-[0.2em] uppercase">dashboard 360°</p>
          <h1 className="text-norte-primary font-serif text-3xl tracking-tight dark:text-white">
            Olá, {dbUser.name}
          </h1>
        </div>
        <PeriodToggle current={period} />
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <SaldoCard saldo={saldo} />
        </div>
        <div className="lg:col-span-8">
          <PatrimonioChart data={patrimonio} />
        </div>
        <div className="lg:col-span-8">
          <FluxoChart data={fluxo} />
        </div>
        <div className="lg:col-span-4">
          <AlocacaoDonut slices={alocacao} />
        </div>
        <div className="lg:col-span-12">
          <MetasGrid goals={goals} />
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <LogoutButton />
      </div>
    </div>
  );
}
