import { redirect } from "next/navigation";

import { ModuleCard } from "@/components/dashboard/module-card";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function GastosPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="space-y-1">
        <p className="text-muted-foreground text-xs tracking-[0.2em] uppercase">gastos</p>
        <h1 className="text-norte-primary font-serif text-3xl tracking-tight dark:text-white">
          Gastos detalhados
        </h1>
        <p className="text-muted-foreground text-sm">
          Visualize seus gastos por categoria e por mês.
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
