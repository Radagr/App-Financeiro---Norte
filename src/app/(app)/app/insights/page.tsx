import Link from "next/link";
import { redirect } from "next/navigation";

import { ModuleCard } from "@/components/dashboard/module-card";
import { InsightCard } from "@/components/insights/insight-card";
import { accounts, transactions } from "@/lib/data/imported";
import { env } from "@/lib/env";
import { computeGoalStatus, monthlyContributionRequired } from "@/lib/goals";
import { aggregateContext, getInsightsForUser, type AnalysisResult } from "@/lib/insights";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { RefreshButton } from "./refresh-button";

type SearchParams = Promise<{ refresh?: string }>;

export default async function InsightsPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { refresh } = await searchParams;
  const forceRefresh = refresh !== undefined;

  if (!env.ANTHROPIC_API_KEY) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="space-y-1">
          <p className="text-muted-foreground text-xs tracking-[0.2em] uppercase">insights</p>
          <h1 className="text-norte-primary font-serif text-3xl tracking-tight dark:text-white">
            Insights inteligentes
          </h1>
          <p className="text-muted-foreground text-sm">
            Análise personalizada via IA dos seus padrões financeiros.
          </p>
        </header>
        <ModuleCard title="Configuração necessária">
          <div className="space-y-3">
            <p className="text-muted-foreground text-sm">
              Para gerar análises personalizadas, configure a chave da{" "}
              <span className="font-medium">Anthropic API</span> em{" "}
              <code className="bg-muted rounded px-1.5 py-0.5 font-mono text-xs">.env.local</code>.
            </p>
            <ol className="text-muted-foreground list-decimal space-y-1 pl-5 text-sm">
              <li>
                Crie uma API key em{" "}
                <Link
                  href="https://console.anthropic.com"
                  className="underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  console.anthropic.com
                </Link>
              </li>
              <li>
                Adicione ao <code className="bg-muted rounded px-1 font-mono">.env.local</code>:{" "}
                <code className="bg-muted rounded px-1 font-mono">
                  ANTHROPIC_API_KEY=sk-ant-...
                </code>
              </li>
              <li>Reinicie o dev server</li>
            </ol>
            <p className="text-muted-foreground text-xs">
              Custo estimado: ~R$ 0,02 por análise. Cache de 24h impede chamadas repetidas.
            </p>
          </div>
        </ModuleCard>
      </div>
    );
  }

  const goalRows = await prisma.goal
    .findMany({
      where: { userId: user.id },
      orderBy: [{ priority: "desc" }, { deadline: "asc" }],
    })
    .catch(() => []);

  const goalsForContext = goalRows.map((g) => {
    const target = Number(g.target);
    const current = Number(g.current);
    return {
      name: g.name,
      type: g.type,
      target,
      current,
      deadline: g.deadline,
      monthlyRequired: monthlyContributionRequired({ target, current, deadline: g.deadline }),
      status: computeGoalStatus({ target, current, deadline: g.deadline }),
    };
  });

  const context = aggregateContext({
    accounts,
    transactions,
    goals: goalsForContext,
  });

  let result: AnalysisResult | null = null;
  let error: string | null = null;
  try {
    result = await getInsightsForUser({
      userId: user.id,
      apiKey: env.ANTHROPIC_API_KEY,
      context,
      forceRefresh,
    });
  } catch (err) {
    error = err instanceof Error ? err.message : "Erro desconhecido";
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
        <div className="space-y-0.5">
          <p className="text-muted-foreground text-xs tracking-[0.2em] uppercase">insights</p>
          <h1 className="text-norte-primary font-serif text-3xl tracking-tight dark:text-white">
            Insights inteligentes
          </h1>
          <p className="text-muted-foreground text-sm">
            Análise personalizada via IA dos seus padrões financeiros.
          </p>
        </div>
        {result ? <RefreshButton /> : null}
      </header>

      {error ? (
        <ModuleCard title="Erro ao gerar análise">
          <p className="text-norte-negative text-sm">{error}</p>
          <p className="text-muted-foreground mt-2 text-xs">
            Verifique sua API key e os créditos da conta Anthropic. Tente novamente em alguns
            minutos.
          </p>
        </ModuleCard>
      ) : null}

      {result && result.insights.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-4">
            {result.insights.map((insight, idx) => (
              <InsightCard key={`${insight.title}-${idx}`} insight={insight} />
            ))}
          </div>
          <p className="text-muted-foreground text-center font-mono text-xs">
            Gerado em {new Date(result.generatedAt).toLocaleString("pt-BR")}
          </p>
        </>
      ) : null}

      {result && result.insights.length === 0 ? (
        <ModuleCard title="Sem insights gerados">
          <p className="text-muted-foreground text-sm">
            O modelo não retornou insights. Tente novamente.
          </p>
        </ModuleCard>
      ) : null}
    </div>
  );
}
