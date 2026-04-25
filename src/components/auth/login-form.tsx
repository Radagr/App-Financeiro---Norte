"use client";

import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type LoginState = "idle" | "sending" | "sent" | "error";

interface LoginFormProps {
  next?: string;
}

export function LoginForm({ next }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<LoginState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!email.trim()) return;

    setState("sending");
    setErrorMessage(null);

    try {
      const callbackUrl = new URL("/auth/callback", window.location.origin);
      if (next) {
        callbackUrl.searchParams.set("next", next);
      }

      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: callbackUrl.toString(),
        },
      });

      if (error) {
        setState("error");
        setErrorMessage(error.message);
        return;
      }

      setState("sent");
    } catch (err) {
      setState("error");
      setErrorMessage(err instanceof Error ? err.message : "Algo deu errado. Tente novamente.");
    }
  }

  /* ── Sent state — replaces form entirely ─────────────────────────── */
  if (state === "sent") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex flex-col items-center gap-4 py-2 text-center"
        style={{
          animation: "fadeSlideIn 240ms cubic-bezier(0.165, 0.84, 0.44, 1) both",
        }}
      >
        {/* Envelope icon — subtle, Norte green */}
        <div className="bg-secondary flex size-12 items-center justify-center rounded-full">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-primary"
            aria-hidden
          >
            <rect width="20" height="16" x="2" y="4" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
          </svg>
        </div>

        <div className="space-y-1">
          <p className="text-foreground text-sm font-medium">Cheque seu email</p>
          <p className="text-muted-foreground text-sm">
            Enviamos um link de acesso para{" "}
            <span className="text-foreground font-medium">{email}</span>. O link expira em 1 hora.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setState("idle");
            setEmail("");
          }}
          className="text-muted-foreground hover:text-foreground text-xs underline-offset-4 transition-colors duration-[180ms] hover:underline"
        >
          Usar outro email
        </button>
      </div>
    );
  }

  /* ── Default / error / sending state ─────────────────────────────── */
  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      {/* Error message */}
      {state === "error" && errorMessage && (
        <div
          role="alert"
          aria-live="assertive"
          className="border-destructive/30 bg-destructive/8 rounded-lg border px-3 py-2.5"
          style={{
            animation: "fadeSlideIn 200ms cubic-bezier(0.165, 0.84, 0.44, 1) both",
          }}
        >
          <p className="text-destructive text-sm">{errorMessage}</p>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email-input">Email</Label>
        <Input
          id="email-input"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoFocus
          placeholder="voce@exemplo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={state === "sending"}
          required
          aria-invalid={state === "error" ? "true" : undefined}
          className="h-9 text-sm"
        />
      </div>

      <Button
        type="submit"
        disabled={state === "sending" || !email.trim()}
        className="h-9 w-full text-sm font-medium"
      >
        {state === "sending" ? (
          <span className="flex items-center gap-2">
            <svg className="size-3.5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Enviando…
          </span>
        ) : (
          "Receber link mágico"
        )}
      </Button>
    </form>
  );
}
