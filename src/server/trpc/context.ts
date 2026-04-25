import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type SessionUser = {
  id: string;
  email: string;
};

export async function createContext(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _opts: FetchCreateContextFnOptions,
): Promise<{
  user: SessionUser | null;
}> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) return { user: null };

  return { user: { id: user.id, email: user.email } };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
