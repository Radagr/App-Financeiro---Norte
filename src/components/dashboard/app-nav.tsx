"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

type Tab = { href: string; label: string };

const TABS: Tab[] = [
  { href: "/app", label: "Resumo" },
  { href: "/app/dashboard", label: "Dashboard" },
  { href: "/app/gastos", label: "Gastos" },
  { href: "/app/metas", label: "Metas" },
  { href: "/app/insights", label: "Insights" },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav
      role="navigation"
      aria-label="Navegação principal"
      className="border-border flex items-center gap-1 overflow-x-auto border-b px-6"
    >
      {TABS.map((tab) => {
        // Match: exact for /app, prefix for sub-routes
        const active = tab.href === "/app" ? pathname === "/app" : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "relative px-3 py-3 text-sm font-medium tracking-tight whitespace-nowrap transition-colors",
              "hover:text-foreground",
              active ? "text-foreground" : "text-muted-foreground",
            )}
            aria-current={active ? "page" : undefined}
          >
            {tab.label}
            {active ? (
              <span
                className="bg-norte-primary dark:bg-primary absolute right-3 bottom-0 left-3 h-0.5 rounded-t"
                aria-hidden
              />
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
