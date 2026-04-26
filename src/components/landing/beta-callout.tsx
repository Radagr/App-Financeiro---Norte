/**
 * BetaCallout — replaces what would have been a pricing section.
 *
 * V1 is 100% free. This section explains the beta with warm, direct copy.
 * No tiers, no pricing, no "Assinar" — just "Criar conta grátis".
 *
 * Compositional choice: full-width band with a subtle Atmosphere layer,
 * copy offset to the left for editorial asymmetry, CTA right-aligned on desktop.
 *
 * Server Component.
 */

import Link from "next/link";

import { Atmosphere } from "@/components/brand/atmosphere";

export function BetaCallout() {
  return (
    <section
      id="como-funciona"
      aria-labelledby="beta-heading"
      className="border-border relative overflow-hidden border-y"
    >
      {/* Atmosphere from bottom-right to vary from hero */}
      <Atmosphere gradient="bottom-right" />

      <div className="mx-auto max-w-6xl px-6 py-20 md:px-8 md:py-28">
        <div className="flex flex-col gap-12 md:flex-row md:items-end md:justify-between">
          {/* Left: copy block */}
          <div
            className="max-w-2xl"
            style={{ animation: "fadeSlideIn 0.65s var(--ease-out-quart) both" }}
          >
            {/* Eyebrow */}
            <p className="text-primary mb-4 font-mono text-xs tracking-[0.2em] uppercase">
              Beta gratuito
            </p>

            <h2
              id="beta-heading"
              className="text-foreground mb-6 font-serif text-3xl leading-tight sm:text-4xl lg:text-5xl"
            >
              Sem cartão. <span className="text-muted-foreground">Sem pegadinha.</span>
            </h2>

            <div className="text-muted-foreground flex flex-col gap-4 text-base leading-relaxed">
              <p>
                Norte está em beta aberto. Enquanto a gente lapida o produto, tudo é gratuito — sem
                limite de tempo, sem plano pago esperando no final do cadastro.
              </p>
              <p>
                Os primeiros usuários moldam o que Norte vira. Cada feedback importa. Cada feature
                pedida é anotada.
              </p>
            </div>
          </div>

          {/* Right: CTA + social proof nudge */}
          <div
            className="flex flex-col items-start gap-4 md:items-end md:text-right"
            style={{ animation: "fadeSlideIn 0.65s var(--ease-out-quart) 120ms both" }}
          >
            <Link
              href="/login"
              className="bg-primary text-primary-foreground focus-visible:ring-ring/50 inline-flex items-center justify-center rounded-lg px-7 py-3.5 text-sm font-medium whitespace-nowrap transition-all duration-[var(--default-transition-duration)] hover:opacity-90 focus-visible:ring-2 focus-visible:outline-none active:translate-y-px"
            >
              Criar conta grátis
            </Link>

            {/* Proof nudge */}
            <p className="text-muted-foreground/60 font-mono text-xs">
              Leva menos de 2 minutos · Sem cartão
            </p>
          </div>
        </div>

        {/* Visual rule / detail */}
        <div aria-hidden="true" className="mt-16 flex items-center gap-4">
          <div
            className="h-px flex-1"
            style={{
              background:
                "linear-gradient(90deg, hsl(var(--primary) / 0.4) 0%, hsl(var(--border)) 40%, transparent 100%)",
            }}
          />
          <span className="text-muted-foreground/40 font-mono text-xs tracking-widest uppercase">
            Versão beta
          </span>
          <div
            className="h-px w-12"
            style={{
              background: "hsl(var(--border))",
            }}
          />
        </div>
      </div>
    </section>
  );
}
