/**
 * Hero — asymmetric editorial layout.
 *
 * Desktop: 2-column grid. Left: headline + sub + CTAs. Right: abstract compass
 * diagram (decorative, aria-hidden) that bleeds off-edge on large viewports.
 *
 * The oversized CompassMark acts as the "unforgettable" visual anchor — a
 * brand signature writ large, calm and geometric, not decorative chrome.
 *
 * Server Component.
 */

import Link from "next/link";

import { Atmosphere } from "@/components/brand/atmosphere";
import { CompassMark } from "@/components/brand/compass-mark";

export function Hero() {
  return (
    <section id="hero" aria-labelledby="hero-heading" className="relative overflow-hidden">
      {/* Atmosphere: strong top-left radial, slightly stronger than default */}
      <Atmosphere gradient="top" />

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 px-6 py-20 md:grid-cols-[1fr_auto] md:items-center md:gap-16 md:px-8 md:py-28 lg:py-36">
        {/* ── Left column: editorial copy ── */}
        <div
          className="flex max-w-2xl flex-col gap-8"
          style={{
            animation: "fadeSlideIn 0.6s var(--ease-out-quart) both",
          }}
        >
          {/* Eyebrow */}
          <p
            className="text-muted-foreground font-mono text-xs tracking-[0.2em] uppercase"
            style={{
              animation: "fadeSlideIn 0.5s var(--ease-out-quart) 60ms both",
            }}
          >
            Beta gratuito · Disponível agora
          </p>

          {/* H1 — Instrument Serif, editorial weight */}
          <h1
            id="hero-heading"
            className="text-foreground font-serif text-4xl leading-[1.1] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
            style={{
              animation: "fadeSlideIn 0.65s var(--ease-out-quart) 80ms both",
            }}
          >
            Sua vida financeira <em className="text-primary not-italic">em um só lugar.</em>
          </h1>

          {/* Sub */}
          <p
            className="text-muted-foreground max-w-xl text-base leading-relaxed sm:text-lg"
            style={{
              animation: "fadeSlideIn 0.65s var(--ease-out-quart) 140ms both",
            }}
          >
            Norte conecta suas contas via Open Finance, categoriza gastos com IA e acompanha suas
            metas — tudo em um dashboard limpo, sem planilha, sem esforço.
          </p>

          {/* CTAs */}
          <div
            className="flex flex-wrap items-center gap-4"
            style={{
              animation: "fadeSlideIn 0.6s var(--ease-out-quart) 200ms both",
            }}
          >
            <Link
              href="/login"
              className="bg-primary text-primary-foreground focus-visible:ring-ring/50 inline-flex items-center justify-center rounded-lg px-6 py-3 text-sm font-medium transition-all duration-[var(--default-transition-duration)] hover:opacity-90 focus-visible:ring-2 focus-visible:outline-none active:translate-y-px"
            >
              Criar conta grátis
            </Link>
            <a
              href="#como-funciona"
              className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm font-medium transition-colors duration-[var(--default-transition-duration)]"
            >
              Ver como funciona
              <span aria-hidden="true" className="text-base">
                ↓
              </span>
            </a>
          </div>

          {/* Trust note */}
          <p
            className="text-muted-foreground/70 font-mono text-xs"
            style={{
              animation: "fadeSlideIn 0.55s var(--ease-out-quart) 260ms both",
            }}
          >
            Sem cartão de crédito · Cancele quando quiser
          </p>
        </div>

        {/* ── Right column: decorative compass diagram ── */}
        <div
          aria-hidden="true"
          className="pointer-events-none hidden select-none md:flex md:items-center md:justify-center"
          style={{
            animation: "fadeSlideIn 0.8s var(--ease-out-quart) 160ms both",
          }}
        >
          {/* Outer ring */}
          <div className="relative flex items-center justify-center">
            {/* Background circle — references border token */}
            <div
              className="border-border/60 absolute size-72 rounded-full border lg:size-96"
              style={{
                background:
                  "radial-gradient(ellipse 80% 80% at 50% 50%, hsl(var(--primary) / 0.04) 0%, transparent 70%)",
              }}
            />
            {/* Secondary ring */}
            <div className="border-border/40 absolute size-48 rounded-full border lg:size-64" />

            {/* Main compass mark — oversized, dominant */}
            <CompassMark size={112} className="text-primary relative opacity-80 lg:size-[140px]" />

            {/* Cardinal labels — typography accent */}
            <span className="text-muted-foreground/50 absolute -top-6 font-mono text-xs tracking-widest uppercase">
              N
            </span>
            <span className="text-muted-foreground/30 absolute -bottom-6 font-mono text-xs tracking-widest uppercase">
              S
            </span>
            <span className="text-muted-foreground/30 absolute -right-6 font-mono text-xs tracking-widest uppercase">
              L
            </span>
            <span className="text-muted-foreground/30 absolute -left-6 font-mono text-xs tracking-widest uppercase">
              O
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
