import { redirect } from "next/navigation";

import { GastosMatrix } from "@/components/dashboard/gastos-matrix";
import { GastosStackChart } from "@/components/dashboard/gastos-stack-chart";
import { PeriodToggle } from "@/components/dashboard/period-toggle";
import { transactions } from "@/lib/data/imported";
import {
  computeSpendByCategoryMonth,
  filterTransactionsByPeriod,
  topCategoriesWithOthers,
} from "@/lib/mock/computations";
import { parsePeriod, periodToDateRange } from "@/lib/mock/periods";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type SearchParams = Promise<{ period?: string }>;

export default async function GastosPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { period: rawPeriod } = await searchParams;
  const period = parsePeriod(rawPeriod);
  const { start, end } = periodToDateRange(period);

  const periodTxs = filterTransactionsByPeriod(transactions, start, end);
  const monthly = computeSpendByCategoryMonth(periodTxs);
  const categories = topCategoriesWithOthers(periodTxs, 6);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
        <div className="space-y-0.5">
          <p className="text-muted-foreground text-xs tracking-[0.2em] uppercase">gastos</p>
          <h1 className="text-norte-primary font-serif text-3xl tracking-tight dark:text-white">
            Gastos detalhados
          </h1>
          <p className="text-muted-foreground text-sm">
            Visualize seus gastos por categoria e por mês.
          </p>
        </div>
        <PeriodToggle current={period} />
      </header>

      <GastosStackChart data={monthly} categories={categories} />
      <GastosMatrix data={monthly} categories={categories} />
    </div>
  );
}
