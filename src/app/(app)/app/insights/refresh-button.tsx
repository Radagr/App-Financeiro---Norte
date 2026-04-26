"use client";

import { RefreshCw } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";

export function RefreshButton() {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  function refresh() {
    const next = new URLSearchParams(params.toString());
    next.set("refresh", String(Date.now()));
    startTransition(() => {
      router.replace(`?${next.toString()}`, { scroll: false });
    });
  }

  return (
    <Button variant="outline" size="sm" onClick={refresh} disabled={pending} className="gap-2">
      <RefreshCw className={pending ? "size-4 animate-spin" : "size-4"} aria-hidden />
      {pending ? "Analisando..." : "Atualizar análise"}
    </Button>
  );
}
