"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/trpc/client";

export function ContributeForm({ goalId, goalName }: { goalId: string; goalName: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const contribute = trpc.goals.contribute.useMutation();

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setPending(true);
        setError(null);
        const fd = new FormData(e.currentTarget);
        const amount = Number(fd.get("amount") ?? 0);
        if (!amount || amount <= 0) {
          setError("Valor deve ser maior que zero");
          setPending(false);
          return;
        }
        try {
          await contribute.mutateAsync({ goalId, amount });
          (e.currentTarget as HTMLFormElement).reset();
          router.refresh();
        } catch (err) {
          setError(err instanceof Error ? err.message : "Erro ao registrar aporte");
        } finally {
          setPending(false);
        }
      }}
      className="flex flex-col gap-1.5"
    >
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <label htmlFor={`contribute-${goalId}`} className="sr-only">
            Aportar para {goalName}
          </label>
          <Input
            id={`contribute-${goalId}`}
            name="amount"
            type="number"
            min="0"
            step="0.01"
            placeholder="Aportar agora (R$)"
            disabled={pending}
          />
        </div>
        <Button type="submit" disabled={pending} variant="outline" size="sm">
          {pending ? "..." : "Aportar"}
        </Button>
      </div>
      {error ? (
        <p className="text-norte-negative text-xs" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
