/**
 * Features — 4 feature cards in an asymmetric 1+3 layout.
 *
 * Desktop: 2-column grid. Left column holds the "hero" feature card (Open Finance)
 * spanning full height. Right column stacks the remaining 3 cards.
 *
 * Mobile: single column, natural stack order.
 *
 * Server Component.
 */

import { BrainCircuit, Link2, LineChart, Target } from "lucide-react";

import type React from "react";

type Feature = {
  icon: React.ReactNode;
  title: string;
  description: string;
  accent?: boolean;
};

const FEATURES: Feature[] = [
  {
    icon: <Link2 className="size-6" aria-hidden="true" />,
    title: "Open Finance",
    description:
      "Conecte suas contas bancárias e cartões via Open Finance (Pluggy). Saldo, extrato e movimentações aparecem automaticamente — sem digitar senha, sem planilha.",
    accent: true,
  },
  {
    icon: <BrainCircuit className="size-5" aria-hidden="true" />,
    title: "IA de categorização",
    description:
      "Cada transação é categorizada por IA em tempo real. Menos trabalho manual, mais clareza sobre para onde o dinheiro vai.",
  },
  {
    icon: <Target className="size-5" aria-hidden="true" />,
    title: "Metas SMART",
    description:
      "Defina metas com valor, prazo e acompanhe o progresso semana a semana. Norte avisa quando você está desviando.",
  },
  {
    icon: <LineChart className="size-5" aria-hidden="true" />,
    title: "Relatório mensal",
    description:
      "Receba um resumo de cada mês: quanto entrou, quanto saiu, quais categorias cresceram, e onde você pode melhorar.",
  },
];

export function Features() {
  const [primary, ...rest] = FEATURES;

  return (
    <section id="recursos" aria-labelledby="features-heading" className="relative overflow-hidden">
      {/* Subtle horizon atmosphere from bottom-right to balance hero */}
      <div className="mx-auto max-w-6xl px-6 py-20 md:px-8 md:py-28">
        {/* Section header — left-aligned, not centered */}
        <div
          className="mb-12 max-w-lg"
          style={{ animation: "fadeSlideIn 0.6s var(--ease-out-quart) both" }}
        >
          <p className="text-muted-foreground mb-3 font-mono text-xs tracking-[0.2em] uppercase">
            Recursos
          </p>
          <h2
            id="features-heading"
            className="text-foreground font-serif text-3xl leading-tight sm:text-4xl"
          >
            Tudo que você precisa para sair do modo reativo.
          </h2>
        </div>

        {/* Asymmetric 1 + 3 layout */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_1fr]">
          {/* Primary feature — spans full height on desktop */}
          {primary && <FeatureCardPrimary feature={primary} />}

          {/* Secondary features — stacked 3 */}
          <div className="flex flex-col gap-4">
            {rest.map((feature) => (
              <FeatureCardSecondary key={feature.title} feature={feature} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function FeatureCardPrimary({ feature }: { feature: Feature }) {
  return (
    <div
      className="group border-border bg-card relative flex flex-col justify-between overflow-hidden rounded-[var(--radius-lg)] border p-8 transition-shadow duration-[var(--default-transition-duration)] hover:shadow-[var(--shadow-card)] md:min-h-[360px]"
      style={{
        animation: "fadeSlideIn 0.65s var(--ease-out-quart) 80ms both",
      }}
    >
      {/* Accent background gradient — references primary token */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at -10% 110%, hsl(var(--primary) / 0.06) 0%, transparent 60%)",
        }}
      />

      <div className="relative flex flex-col gap-6">
        {/* Icon */}
        <div className="border-border bg-secondary text-primary flex size-12 items-center justify-center rounded-xl border">
          {feature.icon}
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="text-foreground font-serif text-2xl">{feature.title}</h3>
          <p className="text-muted-foreground text-base leading-relaxed">{feature.description}</p>
        </div>
      </div>

      {/* Decorative bottom rule */}
      <div
        aria-hidden="true"
        className="relative mt-8 h-px w-full"
        style={{
          background: "linear-gradient(90deg, hsl(var(--primary) / 0.3) 0%, transparent 60%)",
        }}
      />
    </div>
  );
}

function FeatureCardSecondary({ feature }: { feature: Feature }) {
  return (
    <div
      className="group border-border bg-card flex flex-col gap-4 rounded-[var(--radius-lg)] border p-6 transition-shadow duration-[var(--default-transition-duration)] hover:shadow-[var(--shadow-card)]"
      style={{
        animation: "fadeSlideIn 0.6s var(--ease-out-quart) 120ms both",
      }}
    >
      {/* Icon */}
      <div className="border-border bg-secondary text-primary flex size-9 items-center justify-center rounded-lg border">
        {feature.icon}
      </div>

      <div className="flex flex-col gap-1.5">
        <h3 className="text-foreground font-serif text-lg">{feature.title}</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
      </div>
    </div>
  );
}
