import { redirect } from "next/navigation";

import { ModuleCard } from "@/components/dashboard/module-card";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function MetasPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="space-y-1">
        <p className="text-muted-foreground text-xs tracking-[0.2em] uppercase">metas</p>
        <h1 className="text-norte-primary font-serif text-3xl tracking-tight dark:text-white">
          Metas financeiras
        </h1>
        <p className="text-muted-foreground text-sm">
          Acompanhe e gerencie suas metas de poupança e investimento.
        </p>
      </header>
      <ModuleCard title="Em construção">
        <p className="text-muted-foreground py-8 text-center text-sm">
          Esta página será implementada em breve.
        </p>
      </ModuleCard>
    </div>
  );
}
