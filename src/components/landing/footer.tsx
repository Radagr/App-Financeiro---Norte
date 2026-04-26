/**
 * Footer — minimal, left-aligned.
 *
 * Brand mark + wordmark left. Links right. Copyright bottom.
 * No centering — editorial asymmetry maintained.
 *
 * Server Component.
 */

import Link from "next/link";

import { CompassMark } from "@/components/brand/compass-mark";

const FOOTER_LINKS = [
  { label: "Suporte", href: "mailto:suporte@norte.app" },
  { label: "Privacidade", href: "/privacidade" },
  { label: "Termos", href: "/termos" },
  { label: "Contato", href: "mailto:oi@norte.app" },
] as const;

export function Footer() {
  return (
    <footer aria-label="Rodapé" className="border-border bg-muted/30 relative border-t">
      <div className="mx-auto max-w-6xl px-6 py-12 md:px-8">
        {/* Top row: brand + links */}
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          {/* Brand */}
          <div className="text-norte-primary flex items-center gap-2 dark:text-white">
            <CompassMark size={18} />
            <span className="font-serif text-base">Norte</span>
          </div>

          {/* Links */}
          <nav aria-label="Links do rodapé">
            <ul className="flex flex-wrap gap-x-6 gap-y-2" role="list">
              {FOOTER_LINKS.map(({ label, href }) => (
                <li key={label}>
                  {href.startsWith("mailto:") ? (
                    <a
                      href={href}
                      className="text-muted-foreground hover:text-foreground text-sm transition-colors duration-[var(--default-transition-duration)]"
                    >
                      {label}
                    </a>
                  ) : (
                    <Link
                      href={href}
                      className="text-muted-foreground hover:text-foreground text-sm transition-colors duration-[var(--default-transition-duration)]"
                    >
                      {label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Bottom row: copyright */}
        <div className="border-border/60 mt-10 border-t pt-6">
          <p className="text-muted-foreground/60 font-mono text-xs">
            &copy; 2026 Norte. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
