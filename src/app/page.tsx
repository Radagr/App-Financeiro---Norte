/**
 * Landing page — Norte public homepage (M2 Task 11).
 *
 * Replaces the M0 placeholder with a full editorial landing:
 *   Nav → Hero → Features → Beta Callout → FAQ → Footer
 *
 * Static Server Component. No client boundary needed at this level.
 *
 * Atmosphere is composed at the page level as a global background layer
 * (center variant for the full-page gradient) with individual sections
 * adding their own local Atmosphere layers for depth variation.
 */

import { BetaCallout } from "@/components/landing/beta-callout";
import { FAQ } from "@/components/landing/faq";
import { Features } from "@/components/landing/features";
import { Footer } from "@/components/landing/footer";
import { Hero } from "@/components/landing/hero";
import { Nav } from "@/components/landing/nav";

export default function LandingPage() {
  return (
    <>
      {/* Skip to main content — accessibility */}
      <a
        href="#main-content"
        className="focus:bg-primary focus:text-primary-foreground sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-lg focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:outline-none"
      >
        Ir para o conteúdo principal
      </a>

      <Nav />

      <main id="main-content" className="flex flex-col">
        <Hero />
        <Features />
        <BetaCallout />
        <FAQ />
      </main>

      <Footer />
    </>
  );
}
