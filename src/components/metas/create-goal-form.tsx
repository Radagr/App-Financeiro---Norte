"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/trpc/client";

const TYPES = [
  { value: "emergency", label: "Reserva de emergência" },
  { value: "trip", label: "Viagem" },
  { value: "house", label: "Imóvel" },
  { value: "vehicle", label: "Veículo" },
  { value: "retirement", label: "Aposentadoria" },
  { value: "education", label: "Educação" },
  { value: "custom", label: "Personalizada" },
];

export function CreateGoalForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const create = trpc.goals.create.useMutation();

  if (!open) {
    return (
      <Button
        onClick={() => setOpen(true)}
        className="bg-norte-primary hover:bg-norte-secondary text-white"
      >
        Nova meta
      </Button>
    );
  }

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setPending(true);
        setError(null);
        const fd = new FormData(e.currentTarget);
        try {
          await create.mutateAsync({
            name: String(fd.get("name") ?? "").trim(),
            type: String(fd.get("type") ?? "custom") as
              | "emergency"
              | "trip"
              | "house"
              | "vehicle"
              | "retirement"
              | "education"
              | "custom",
            target: Number(fd.get("target") ?? 0),
            current: Number(fd.get("current") ?? 0),
            deadline: String(fd.get("deadline") ?? ""),
            priority: Number(fd.get("priority") ?? 1),
          });
          setOpen(false);
          router.refresh();
        } catch (err) {
          setError(err instanceof Error ? err.message : "Erro ao criar meta");
        } finally {
          setPending(false);
        }
      }}
      className="border-border bg-card flex w-full flex-col gap-3 rounded-lg border p-4 md:w-auto md:min-w-[480px]"
    >
      <h3 className="font-serif text-lg">Nova meta</h3>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="name">Nome</Label>
          <Input id="name" name="name" required placeholder="Ex: viagem Europa" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="type">Tipo</Label>
          <select
            id="type"
            name="type"
            className="border-input bg-background h-9 w-full rounded-lg border px-3 text-sm"
            defaultValue="custom"
          >
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="priority">Prioridade</Label>
          <select
            id="priority"
            name="priority"
            className="border-input bg-background h-9 w-full rounded-lg border px-3 text-sm"
            defaultValue="3"
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n} {n === 5 ? "(máxima)" : n === 1 ? "(mínima)" : ""}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="target">Valor alvo (R$)</Label>
          <Input id="target" name="target" type="number" min="0" step="0.01" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="current">Já guardado (R$)</Label>
          <Input id="current" name="current" type="number" min="0" step="0.01" defaultValue="0" />
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="deadline">Prazo</Label>
          <Input id="deadline" name="deadline" type="date" required />
        </div>
      </div>
      {error ? (
        <p className="text-norte-negative text-sm" role="alert">
          {error}
        </p>
      ) : null}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={pending}
          className="bg-norte-primary hover:bg-norte-secondary text-white"
        >
          {pending ? "Criando..." : "Criar meta"}
        </Button>
      </div>
    </form>
  );
}
