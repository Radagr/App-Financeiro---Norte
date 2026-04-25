import { redirect } from "next/navigation";

import { LogoutButton } from "@/components/auth/logout-button";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AppPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser?.onboardedAt) redirect("/onboarding");

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="space-y-1">
        <p className="text-muted-foreground text-xs tracking-[0.2em] uppercase">m1 — auth ok</p>
        <h1 className="text-norte-primary text-3xl font-semibold tracking-tight dark:text-white">
          Olá, {dbUser.name}
        </h1>
        <p className="text-muted-foreground">
          Você está autenticado. Em M3 esta tela vira o dashboard 360°.
        </p>
      </div>
      <div className="border-border bg-card text-card-foreground shadow-card rounded-lg border p-4">
        <p className="text-sm">
          <span className="text-muted-foreground">email:</span>{" "}
          <span className="font-mono">{dbUser.email}</span>
        </p>
        <p className="tabular text-muted-foreground mt-1 text-xs">user.id: {dbUser.id}</p>
      </div>
      <LogoutButton />
    </div>
  );
}
