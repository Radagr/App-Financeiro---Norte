import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Entrar — Norte",
  description: "Acesse sua conta Norte com um link mágico.",
};

/**
 * Auth layout — minimal shell with Norte atmosphere.
 *
 * Background: very subtle radial gradient anchored top-left (forest-green tint)
 * layered over the base bg-background token. A 1px horizon line at the bottom
 * references Norte's "direction" motif.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-background relative flex min-h-svh flex-col overflow-hidden">
      {/* Subtle radial atmosphere — verde-floresta tint, top-left anchor */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 72% 56% at -8% -4%, hsl(160 60% 15% / 0.07) 0%, transparent 70%)",
        }}
      />

      {/* Noise overlay — 3% opacity grain, atmospheric depth */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundSize: "192px 192px",
        }}
      />

      {/* Main content */}
      <main className="relative z-10 flex flex-1 flex-col">{children}</main>

      {/* 1px horizon line — "norte" / direction motif */}
      <div
        aria-hidden
        className="relative z-10 h-px w-full"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, hsl(var(--border)) 20%, hsl(var(--border)) 80%, transparent 100%)",
        }}
      />
    </div>
  );
}
