import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Bem-vindo — Norte",
  description: "Diga como você quer ser chamado para começar.",
};

async function completeOnboarding(formData: FormData) {
  "use server";
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await prisma.user.update({
    where: { id: user.id },
    data: { name, onboardedAt: new Date() },
  });

  redirect("/app");
}

export default async function OnboardingPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (dbUser?.onboardedAt) redirect("/app");

  return (
    /*
     * Onboarding composition — conversational, acolhedor.
     *
     * Unlike the login page (which uses an "access" framing with a brand mark
     * floating above a card), this page uses an "arrival" framing:
     *   - Centered single column, shifted slightly above center (py-20 / py-28)
     *   - A gentle icon moment before the card — a seedling/sprout to signal
     *     "beginning" — rendered in the Norte verde-floresta accent
     *   - The card itself is wider (max-w-md) and has more breathing room
     *   - Copy is warm and direct: "Bem-vindo" + "como quer ser chamado?"
     *   - Step indicator ("Passo 1 de 1") anchors progress — no ambiguity
     *   - Staggered reveal: icon → card header → card body (3 layers, 80ms apart)
     *
     * Atmosphere: same auth-layout gradient + noise (inherited from (auth) sibling).
     * Because (app) layout is a plain bg-background shell, we recreate the gradient
     * here inline so the onboarding page itself feels as welcoming as the auth pages
     * while the rest of the (app) group stays clean.
     */
    <div className="bg-background relative flex min-h-[calc(100vh-3rem)] flex-col overflow-hidden">
      {/* Warm radial atmosphere — slightly warmer tint than login (arriving vs accessing) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% -10%, hsl(160 60% 15% / 0.06) 0%, transparent 65%), radial-gradient(ellipse 50% 40% at 90% 80%, hsl(141 39% 30% / 0.04) 0%, transparent 60%)",
        }}
      />

      {/* Noise overlay */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.025]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundSize: "192px 192px",
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-20 sm:py-28">
        <div className="flex w-full max-w-md flex-col gap-8">
          {/* Welcome icon moment — seedling / sprout in Norte verde */}
          <div
            className="flex flex-col items-center gap-3"
            style={{
              animation: "fadeSlideIn 300ms cubic-bezier(0.165, 0.84, 0.44, 1) both",
              animationDelay: "0ms",
            }}
          >
            <div
              className="bg-secondary/80 ring-border flex size-14 items-center justify-center rounded-2xl ring-1"
              aria-hidden
            >
              {/*
               * Seedling SVG — handcrafted, minimal two-leaf sprout.
               * Signals "first step / new beginning" without gamification.
               */}
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-norte-primary dark:text-primary"
                aria-hidden
              >
                {/* Stem */}
                <path d="M12 20V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                {/* Left leaf */}
                <path
                  d="M12 14C12 14 8 13 7 9C7 9 11 8 12 12"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="currentColor"
                  fillOpacity="0.12"
                />
                {/* Right leaf */}
                <path
                  d="M12 11C12 11 16 10 17 6C17 6 13 5 12 9"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="currentColor"
                  fillOpacity="0.12"
                />
                {/* Ground line */}
                <path d="M9 20h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>

            {/* Step indicator — quiet, functional */}
            <span className="text-muted-foreground font-mono text-[11px] tracking-widest uppercase">
              Passo 1 de 1
            </span>
          </div>

          {/* Card — more generous than login, conversational tone */}
          <div
            style={{
              animation: "fadeSlideIn 320ms cubic-bezier(0.165, 0.84, 0.44, 1) both",
              animationDelay: "80ms",
            }}
          >
            <Card className="shadow-card">
              <CardHeader className="gap-2 pb-2">
                <CardTitle className="text-xl font-semibold">Bem-vindo ao Norte</CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  Como você quer ser chamado? Pode usar seu primeiro nome ou qualquer apelido — é
                  como vamos te cumprimentar aqui dentro.
                </CardDescription>
              </CardHeader>

              <CardContent
                style={{
                  animation: "fadeSlideIn 320ms cubic-bezier(0.165, 0.84, 0.44, 1) both",
                  animationDelay: "160ms",
                }}
              >
                <form action={completeOnboarding} className="flex flex-col gap-5">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="name-input" className="text-sm font-medium">
                      Seu nome
                    </Label>
                    <Input
                      id="name-input"
                      name="name"
                      type="text"
                      inputMode="text"
                      autoComplete="given-name"
                      autoFocus
                      placeholder="ex.: Ana, Carlos, Bê…"
                      required
                      minLength={1}
                      maxLength={80}
                      className="h-9 text-sm"
                      aria-describedby="name-hint"
                    />
                    <p id="name-hint" className="text-muted-foreground text-xs">
                      Você poderá alterar isso depois nas configurações.
                    </p>
                  </div>

                  <Button type="submit" size="lg" className="h-9 w-full text-sm font-medium">
                    Começar
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Quiet footer tagline */}
          <p
            className="text-muted-foreground text-center text-xs"
            style={{
              animation: "fadeSlideIn 320ms cubic-bezier(0.165, 0.84, 0.44, 1) both",
              animationDelay: "240ms",
            }}
          >
            Norte — sua vida financeira em um só lugar.
          </p>
        </div>
      </div>

      {/* 1px horizon line — Norte direction motif */}
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
