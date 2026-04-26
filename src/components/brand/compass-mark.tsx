/**
 * CompassMark — Norte brand signature.
 *
 * Design rationale:
 *   Norte literally means "north". The mark is a geometric compass rose:
 *   - 4 cardinal diamond points, north dominant (taller) to signal direction
 *   - 4 intercardinal half-size points rotated 45°, at 40% opacity for depth
 *   - Centered pivot dot
 *
 *   All fills/strokes use `currentColor` — parents set the color via
 *   `text-norte-primary`, `text-primary`, etc.
 *
 *   Aesthetic: precise, geometric, calm. No organic curves, no playfulness.
 *   Leaning into Norte's "refined direction" identity.
 */

import type React from "react";

export type CompassMarkProps = {
  className?: string;
  size?: number;
};

export function CompassMark({ className, size = 24 }: CompassMarkProps): React.ReactElement {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      {/*
       * Cardinal points — 4 diamond-shaped petals.
       *
       * North (top): taller — the dominant direction, reinforcing brand meaning.
       * South, East, West: symmetric, shorter. Together they read as a star/rose.
       *
       * Each petal is a rhombus: two triangular halves sharing the center at (12,12).
       * Control points: N tip = (12, 2), S tip = (12, 22), E tip = (22, 12), W tip = (2, 12).
       * Waist width = ±2.5px.
       */}

      {/* North petal — tall, visually dominant */}
      <path d="M12 2 L14.2 10 L12 11.5 L9.8 10 Z" fill="currentColor" fillOpacity="1" />

      {/* South petal */}
      <path d="M12 22 L14.2 14 L12 12.5 L9.8 14 Z" fill="currentColor" fillOpacity="0.35" />

      {/* East petal */}
      <path d="M22 12 L14 9.8 L12.5 12 L14 14.2 Z" fill="currentColor" fillOpacity="0.35" />

      {/* West petal */}
      <path d="M2 12 L10 9.8 L11.5 12 L10 14.2 Z" fill="currentColor" fillOpacity="0.35" />

      {/*
       * Intercardinal points — 4 smaller petals at 45° rotation.
       * Each petal is a rhombus aligned along its diagonal axis.
       *
       * Geometry: center = (12,12), tip distance = 6px along diagonal,
       * waist width = ±1.2px perpendicular to the tip direction.
       *
       * NE tip:  (12 + 6·cos45°, 12 - 6·sin45°) ≈ (16.24, 7.76)
       * NE near: (12 + 1.2·cos45°, 12 + 1.2·sin45°) — from center outward
       * Waist left/right: ±1.2 perpendicular to NE axis = (±0.85, ∓0.85) offset
       *
       * For a clean, symmetric 4-point diamond on NE diagonal:
       *   tip = (16.24, 7.76)
       *   near-center = (12, 12)          ← base of petal (merges at center)
       *   left waist = center + perp      = (12 + 0.85, 12 + 0.85) = (12.85, 12.85) — wait, that's SE
       * Correct perpendicular to NE (which is direction +45°): rotate 90° → direction +135°
       *   perp unit = (-sin45°, -cos45°) = (-0.707, -0.707) — NW direction
       *   waist points at midpoint along petal (midpoint ≈ (14.12, 9.88)):
       *     left  = (14.12 - 0.85, 9.88 - 0.85) = (13.27, 9.03)  ← NW offset
       *     right = (14.12 + 0.85, 9.88 + 0.85) = (14.97, 10.73) ← SE offset
       */}

      {/* NE — tip (16.24, 7.76), waist ±1.2 perpendicular, near-base (12,12) */}
      <path
        d="M16.24 7.76 L13.27 9.03 L12 12 L14.97 10.73 Z"
        fill="currentColor"
        fillOpacity="0.2"
      />

      {/* SE — tip (16.24, 16.24), symmetrically mirrored */}
      <path
        d="M16.24 16.24 L14.97 13.27 L12 12 L13.27 14.97 Z"
        fill="currentColor"
        fillOpacity="0.2"
      />

      {/* SW — tip (7.76, 16.24) */}
      <path
        d="M7.76 16.24 L10.73 14.97 L12 12 L9.03 13.27 Z"
        fill="currentColor"
        fillOpacity="0.2"
      />

      {/* NW — tip (7.76, 7.76) */}
      <path d="M7.76 7.76 L9.03 10.73 L12 12 L10.73 9.03 Z" fill="currentColor" fillOpacity="0.2" />

      {/* Center pivot dot */}
      <circle cx="12" cy="12" r="1.5" fill="currentColor" fillOpacity="0.9" />
    </svg>
  );
}
