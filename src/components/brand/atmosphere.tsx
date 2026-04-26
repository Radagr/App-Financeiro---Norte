/**
 * Atmosphere — Norte layered background primitive.
 *
 * Composes three toggleable layers that sit BEHIND content:
 *   1. Noise   — subtle film grain at ~3% opacity (SVG feTurbulence via data URI)
 *   2. Gradient — soft radial glow; position driven by `gradient` prop
 *   3. Horizon  — 1px line across the full width, ~5% opacity; y-position
 *                 matches the gradient anchor so they feel compositionally linked
 *
 * Usage:
 *   <div className="relative overflow-hidden">
 *     <Atmosphere gradient="top" />
 *     <div className="relative z-10">…content…</div>
 *   </div>
 *
 * Container is `pointer-events-none -z-10 absolute inset-0`.
 * All color values reference Norte CSS tokens — never hardcoded hex.
 */

import type React from "react";

export type AtmosphereProps = {
  /** Film-grain noise overlay. @default true */
  noise?: boolean;
  /** Radial gradient anchor position. @default "top" */
  gradient?: "top" | "center" | "bottom-right" | "none";
  /** 1px horizon line. @default true */
  horizon?: boolean;
  /** Additional classes for the outer container. */
  className?: string;
};

// ---------------------------------------------------------------------------
// Gradient definitions — positioned using CSS tokens only.
// Each value maps to a radial-gradient() expression referencing Norte HSL vars.
// We use hsl(var(--primary)) family so this adapts to light/dark mode.
// ---------------------------------------------------------------------------

const GRADIENT_STYLES: Record<
  Exclude<AtmosphereProps["gradient"], "none" | undefined>,
  React.CSSProperties
> = {
  top: {
    background:
      "radial-gradient(ellipse 72% 56% at -8% -4%, hsl(var(--primary) / 0.07) 0%, transparent 70%)",
  },
  center: {
    background:
      "radial-gradient(ellipse 80% 60% at 50% -10%, hsl(var(--primary) / 0.06) 0%, transparent 65%), radial-gradient(ellipse 50% 40% at 90% 80%, hsl(var(--secondary) / 0.04) 0%, transparent 60%)",
  },
  "bottom-right": {
    background:
      "radial-gradient(ellipse 60% 50% at 100% 100%, hsl(var(--primary) / 0.06) 0%, transparent 70%)",
  },
};

// ---------------------------------------------------------------------------
// Horizon line positions — `top` percentage (as Tailwind inline style value)
// aligned with the dominant gradient anchor so both layers feel tied together.
// ---------------------------------------------------------------------------

const HORIZON_POSITION: Record<Exclude<AtmosphereProps["gradient"], "none" | undefined>, string> = {
  top: "15%",
  center: "45%",
  "bottom-right": "75%",
};

// ---------------------------------------------------------------------------
// Noise SVG data URI — feTurbulence fractalNoise, 192×192 tile, repeating.
// Pre-encoded so there's no runtime cost. Opacity is controlled externally.
// ---------------------------------------------------------------------------

const NOISE_DATA_URI =
  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")";

export function Atmosphere({
  noise = true,
  gradient = "top",
  horizon = true,
  className,
}: AtmosphereProps): React.ReactElement {
  const gradientStyle = gradient !== "none" ? GRADIENT_STYLES[gradient] : undefined;
  const horizonTop = gradient !== "none" ? HORIZON_POSITION[gradient] : "15%";

  return (
    <div
      aria-hidden="true"
      className={[
        // Base: covers entire parent, behind everything, clicks pass through
        "pointer-events-none absolute inset-0 -z-10 overflow-hidden",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* Layer 1 — Radial gradient */}
      {gradient !== "none" && gradientStyle && (
        <div className="absolute inset-0" style={gradientStyle} />
      )}

      {/* Layer 2 — Film grain noise */}
      {noise && (
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: NOISE_DATA_URI,
            backgroundSize: "192px 192px",
          }}
        />
      )}

      {/* Layer 3 — 1px horizon line */}
      {horizon && (
        <div
          className="absolute w-full"
          style={{
            top: horizonTop,
            height: "1px",
            // Fades out at both edges — references border token for light/dark adaptability
            background:
              "linear-gradient(90deg, transparent 0%, hsl(var(--border)) 20%, hsl(var(--border)) 80%, transparent 100%)",
            opacity: 0.5,
          }}
        />
      )}
    </div>
  );
}
