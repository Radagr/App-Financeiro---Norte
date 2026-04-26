/**
 * Nav — minimal sticky landing navigation.
 *
 * Desktop: brand left, anchor links center (hidden on mobile), "Entrar" right.
 * Mobile: brand left, "Entrar" right — anchor links omitted for brevity.
 *
 * Server Component — no client state needed.
 */

import Link from "next/link";

import { CompassMark } from "@/components/brand/compass-mark";

export function Nav() {
  return (
    <header className="border-border/50 bg-background/80 sticky top-0 z-50 w-full border-b backdrop-blur-md">
      <nav
        aria-label="Navegação principal"
        className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 md:px-8"
      >
        {/* Brand */}
        <Link
          href="/"
          className="text-norte-primary flex items-center gap-2 transition-opacity duration-[var(--default-transition-duration)] hover:opacity-80 dark:text-white"
          aria-label="Norte — página inicial"
        >
          <CompassMark size={20} />
          <span className="font-serif text-lg font-normal tracking-tight">Norte</span>
        </Link>

        {/* Anchor links — hidden on mobile */}
        <ul className="hidden items-center gap-6 md:flex" role="list">
          {[
            { label: "Recursos", href: "#recursos" },
            { label: "Como funciona", href: "#como-funciona" },
            { label: "FAQ", href: "#faq" },
          ].map(({ label, href }) => (
            <li key={href}>
              <a
                href={href}
                className="text-muted-foreground hover:text-foreground text-sm transition-colors duration-[var(--default-transition-duration)]"
              >
                {label}
              </a>
            </li>
          ))}
        </ul>

        {/* Right side */}
        <Link
          href="/login"
          className="border-border bg-background text-foreground hover:bg-muted focus-visible:border-ring focus-visible:ring-ring/50 dark:border-input dark:bg-input/30 dark:hover:bg-input/50 rounded-lg border px-4 py-1.5 text-sm font-medium transition-all duration-[var(--default-transition-duration)] focus-visible:ring-2 focus-visible:outline-none"
        >
          Entrar
        </Link>
      </nav>
    </header>
  );
}
