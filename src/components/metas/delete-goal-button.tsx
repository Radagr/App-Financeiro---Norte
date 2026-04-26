"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { trpc } from "@/trpc/client";

export function DeleteGoalButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const remove = trpc.goals.delete.useMutation();

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      disabled={pending}
      onClick={async () => {
        if (!confirm(`Excluir a meta "${name}"? Esta ação não pode ser desfeita.`)) return;
        setPending(true);
        try {
          await remove.mutateAsync({ id });
          router.refresh();
        } catch (err) {
          alert(err instanceof Error ? err.message : "Erro ao excluir");
        } finally {
          setPending(false);
        }
      }}
      aria-label={`Excluir ${name}`}
    >
      <Trash2 className="size-4" />
    </Button>
  );
}
