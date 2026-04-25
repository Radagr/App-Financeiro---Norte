import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";

export async function createContext(_opts: FetchCreateContextFnOptions) {
  return { user: null as null };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
