import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoginForm } from "@/components/auth/login-form";

interface LoginPageProps {
  searchParams: Promise<{ next?: string; error?: string }>;
}

/**
 * Login page — server component.
 *
 * Composition: brand mark top, card with ~60% width (max 400px) centered
 * in a slightly elevated vertical position (not dead-center — 40/60 split).
 * "Sent" state is handled inside LoginForm (client).
 */
export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next, error } = await searchParams;

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 sm:py-24">
      {/* Page enter animation wrapper */}
      <div
        className="flex w-full max-w-sm flex-col gap-6"
        style={{
          animation: "fadeSlideIn 320ms cubic-bezier(0.165, 0.84, 0.44, 1) both",
        }}
      >
        {/* Brand mark */}
        <div className="flex flex-col items-center gap-2">
          <Link
            href="/"
            className="group inline-flex items-baseline gap-1 transition-opacity duration-[180ms] hover:opacity-80"
            aria-label="Norte — página inicial"
          >
            {/* Compass rose — minimal SVG mark */}
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-norte-primary dark:text-primary mb-0.5 shrink-0"
              aria-hidden
            >
              <path
                d="M10 2L12.5 9.5H18L13.5 13.5L15.5 18L10 14.5L4.5 18L6.5 13.5L2 9.5H7.5L10 2Z"
                fill="currentColor"
                fillOpacity="0.15"
                stroke="currentColor"
                strokeWidth="1.25"
                strokeLinejoin="round"
              />
              <circle cx="10" cy="10" r="1.5" fill="currentColor" />
            </svg>

            <span className="text-norte-primary dark:text-primary text-2xl font-semibold tracking-tight">
              Norte
            </span>
          </Link>

          <p className="text-muted-foreground text-sm">Sua vida financeira em um só lugar</p>
        </div>

        {/* Error from URL query param (e.g. auth callback failure) */}
        {error && (
          <div
            role="alert"
            aria-live="assertive"
            className="border-destructive/30 bg-destructive/8 rounded-lg border px-3 py-2.5"
          >
            <p className="text-destructive text-sm">{decodeURIComponent(error)}</p>
          </div>
        )}

        {/* Login card */}
        <Card className="shadow-card">
          <CardHeader className="gap-1 pb-2">
            <CardTitle className="text-base font-semibold">Entrar</CardTitle>
            <CardDescription>Receba um link mágico no seu email — sem senha.</CardDescription>
          </CardHeader>

          <CardContent>
            <LoginForm next={next} />
          </CardContent>

          <CardFooter className="bg-muted/50 border-t px-4 py-3">
            <p className="text-muted-foreground text-xs">
              Ao entrar você concorda com nossos{" "}
              <Link
                href="/termos"
                className="hover:text-foreground underline underline-offset-4 transition-colors duration-[180ms]"
              >
                termos de uso
              </Link>
              .
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
