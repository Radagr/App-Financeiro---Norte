# M1 — Auth & Multi-tenant Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. **For UI tasks (Login, Onboarding, /app shell), the executing subagent MUST also invoke `frontend-design` skill — these tasks are flagged in the body.**

**Goal:** Conectar Norte ao Supabase Auth (magic link), proteger `/app/*` com middleware, criar tabela `users` com RLS, integrar identidade ao tRPC context, fluxo end-to-end signup → onboarding → app funcionando.

**Architecture:** Supabase Auth (`auth.users` gerenciado pela Supabase) + tabela `public.users` mirror via trigger pra dados de domínio do Norte. RLS força isolamento por user. `@supabase/ssr` pra session em RSC + Route Handlers + Middleware. Prisma 7 conecta via `@prisma/adapter-pg` (substituto do `directUrl` removido). tRPC context lê o session-user do Supabase server client; `protectedProcedure` lança `UNAUTHORIZED` se sem user.

**Tech additions:** `@supabase/ssr`, `@supabase/supabase-js`, `@prisma/adapter-pg`, `pg`, `lucide-react` (já tem via shadcn).

**PRD references:** RF-1.1 a RF-1.5 (Auth & Onboarding), RNF-2.1 a RNF-2.4 (Segurança).

---

## Step 0 — USER ACTION (precisa ser feito antes de Task 1)

> Você (Mateus) precisa fazer este setup. O resto do plano depende dele.

### 0.1 Criar projeto Supabase

1. Acessar [supabase.com](https://supabase.com) e fazer login com GitHub ou email
2. **New project**:
   - Name: `norte-prod` (ou `norte-dev` se preferir separar — recomendado começar com 1 só)
   - Database password: gerar uma forte e salvar no 1Password / Bitwarden
   - Region: `South America (São Paulo)` (latência menor pro Brasil)
   - Pricing plan: Free
3. Aguardar provisionamento (~2 min)

### 0.2 Coletar 5 envs

No dashboard do projeto:

**Settings → API:**

- `Project URL` → cole em `NEXT_PUBLIC_SUPABASE_URL`
- `anon public` → cole em `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `service_role secret` (clique "Reveal") → cole em `SUPABASE_SERVICE_ROLE_KEY` ⚠️ NUNCA exponha no client; só server-side.

**Settings → Database → Connection string:**

- Aba **Transaction (port 6543)** → cole em `DATABASE_URL` (este é o pooled, usado pelo runtime do app)
- Aba **Session (port 5432)** → cole em `DIRECT_URL` (este é direto, usado por migrations)

> Substitua `[YOUR-PASSWORD]` no template pela senha que você criou.

### 0.3 Preencher `app-norte/.env.local`

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000

DATABASE_URL=postgresql://postgres.<project-ref>:<password>@aws-0-sa-east-1.pooler.supabase.com:6543/postgres
DIRECT_URL=postgresql://postgres.<project-ref>:<password>@aws-0-sa-east-1.pooler.supabase.com:5432/postgres
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### 0.4 Habilitar magic link no Supabase

Authentication → Providers → Email → ✅ Enable Email signup, ✅ Enable email confirmations (default).
Authentication → URL Configuration → Site URL: `http://localhost:3000`. Adicionar redirect URL: `http://localhost:3000/auth/callback`.

### 0.5 Confirmar — me avisar quando terminado

Quando você confirmar "0.5 done", a execução das Tasks começa. Sem isso, Tasks 4+ falham por DB inacessível.

---

## File Structure (M1)

```
app-norte/
├── prisma/
│   ├── schema.prisma                         # +User model
│   └── migrations/
│       └── <timestamp>_add_users_table/      # auto-gen
├── supabase/                                  # NEW
│   └── migrations/
│       └── <timestamp>_initial_rls.sql       # RLS + auth trigger
├── src/
│   ├── lib/
│   │   ├── env.ts                            # tighten Supabase vars (now required)
│   │   ├── prisma.ts                         # rewrite com adapter-pg
│   │   └── supabase/
│   │       ├── server.ts                     # NEW: server client (RSC + handlers)
│   │       ├── browser.ts                    # NEW: browser client
│   │       └── middleware.ts                 # NEW: session refresh helper
│   ├── middleware.ts                         # NEW: route protection
│   ├── server/trpc/
│   │   ├── context.ts                        # +user from supabase.auth.getUser()
│   │   ├── trpc.ts                           # +protectedProcedure
│   │   └── routers/
│   │       ├── _app.ts                       # +auth router
│   │       └── auth.ts                       # auth.whoami
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── layout.tsx                    # NEW: minimal auth shell
│   │   │   └── login/page.tsx                # NEW: magic link form
│   │   ├── (app)/
│   │   │   ├── layout.tsx                    # NEW: protected app shell
│   │   │   ├── onboarding/page.tsx           # NEW
│   │   │   └── app/page.tsx                  # NEW: protected /app
│   │   ├── auth/
│   │   │   └── callback/route.ts             # NEW: code exchange
│   │   └── api/auth/logout/route.ts          # NEW: signOut
│   └── components/
│       └── auth/
│           ├── login-form.tsx                # NEW
│           └── logout-button.tsx             # NEW
└── tests/unit/
    └── auth.whoami.test.ts                   # NEW
```

---

## Task 1: Tighten env schema for Supabase vars

**Files:** Modify `app-norte/src/lib/env.ts`

- [ ] **Step 1.1: Promover Supabase vars de optional para required**

Replace `app-norte/src/lib/env.ts`:

```ts
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),

  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid env. See .env.example.");
}

export const env = parsed.data;
```

- [ ] **Step 1.2: Validar typecheck**

Run from `app-norte/`: `npm run typecheck` → 0 errors.

- [ ] **Step 1.3: Commit**

```bash
git add src/lib/env.ts
git commit -m "feat(env): require Supabase env vars for M1"
```

---

## Task 2: Install Supabase + adapter-pg packages

**Files:** Modify `app-norte/package.json`

- [ ] **Step 2.1: Install runtime deps**

Run from `app-norte/`:

```bash
npm install @supabase/ssr @supabase/supabase-js @prisma/adapter-pg pg
npm install -D @types/pg
```

- [ ] **Step 2.2: Verificar package.json e build**

Run: `npm run build` → 0 erros.

- [ ] **Step 2.3: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat(deps): add Supabase SSR + Prisma pg adapter"
```

---

## Task 3: Prisma schema — User model

**Files:** Modify `app-norte/prisma/schema.prisma`

- [ ] **Step 3.1: Adicionar User model**

Replace `app-norte/prisma/schema.prisma`:

```prisma
generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "linux-musl-openssl-3.0.x"]
  previewFeatures = ["driverAdapters"]
}

datasource db {
  provider = "postgresql"
}

// O id de User mirror auth.users.id (Supabase). Trigger SQL em
// supabase/migrations cria a row aqui automaticamente.
model User {
  id          String    @id @db.Uuid
  email       String    @unique
  name        String?
  onboardedAt DateTime? @map("onboarded_at")
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  @@map("users")
}
```

- [ ] **Step 3.2: Generate client**

Run: `npx prisma generate` → confirma "Generated Prisma Client".

- [ ] **Step 3.3: Commit (sem migration ainda)**

```bash
git add prisma/schema.prisma
git commit -m "feat(db): add User model mirroring auth.users"
```

---

## Task 4: Rewrite prisma.ts com adapter-pg

**Files:** Modify `app-norte/src/lib/prisma.ts`

- [ ] **Step 4.1: Substituir conteúdo de prisma.ts**

Replace `app-norte/src/lib/prisma.ts`:

```ts
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

import { env } from "./env";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function makeClient(): PrismaClient {
  const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });
  return new PrismaClient({
    adapter,
    log: env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? makeClient();

if (env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

- [ ] **Step 4.2: Validar build + typecheck**

Run: `npm run build && npm run typecheck` → 0 erros.

- [ ] **Step 4.3: Commit**

```bash
git add src/lib/prisma.ts
git commit -m "feat(db): wire Prisma 7 driver adapter for Supabase pgbouncer"
```

---

## Task 5: Aplicar primeira migration Prisma

**Files:** Create `app-norte/prisma/migrations/<timestamp>_init_users/migration.sql` (auto-gen)

> Esta task **requer Step 0 done** (DATABASE_URL/DIRECT_URL preenchidos com Supabase real). Se ainda não, BLOCKED.

- [ ] **Step 5.1: Criar migration**

Run from `app-norte/`:

```bash
npx prisma migrate dev --name init_users
```

Expected: cria pasta `prisma/migrations/<timestamp>_init_users/` com `migration.sql` contendo `CREATE TABLE "users"`. Aplica no DB Supabase. Re-gera o client.

- [ ] **Step 5.2: Verificar tabela existe no Supabase**

No dashboard Supabase → Database → Tables, deve aparecer schema `public` com tabela `users`. Se não, investigar (provavelmente DATABASE_URL/DIRECT_URL incorretos).

- [ ] **Step 5.3: Commit**

```bash
git add prisma/migrations
git commit -m "feat(db): apply initial users migration"
```

---

## Task 6: RLS + trigger auth.users → public.users

**Files:** Create `app-norte/supabase/migrations/<timestamp>_initial_rls.sql`

- [ ] **Step 6.1: Criar pasta supabase/migrations**

Run: `mkdir -p supabase/migrations` (from `app-norte/`).

- [ ] **Step 6.2: Escrever migration SQL**

Get current timestamp: `node -e "console.log(new Date().toISOString().replace(/[-:]/g,'').replace(/\..+/,'').slice(0,14))"` (e.g., `20260425190000`).

Create `app-norte/supabase/migrations/<timestamp>_initial_rls.sql`:

```sql
-- M1: RLS on public.users + trigger to mirror auth.users

-- Enable RLS
alter table public.users enable row level security;

-- Policy: users can read their own row
create policy "users_select_own"
  on public.users for select
  using (auth.uid() = id);

-- Policy: users can update their own row
create policy "users_update_own"
  on public.users for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Trigger function: copy auth.users row into public.users on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, created_at, updated_at)
  values (new.id, new.email, now(), now())
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Trigger: fire after auth.users insert
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
```

- [ ] **Step 6.3: Aplicar SQL via Supabase Dashboard**

> Não temos Supabase CLI instalada (escolha consciente — minimizar tooling). Aplicar manualmente:
>
> 1. Supabase Dashboard → SQL Editor → New query
> 2. Colar o conteúdo do arquivo SQL acima
> 3. Run
> 4. Verificar: Authentication → Users (vazio por enquanto). Database → Functions → confirmar `handle_new_user` existe. Database → Triggers → `on_auth_user_created` em `auth.users`.

- [ ] **Step 6.4: Commit**

```bash
git add supabase/migrations
git commit -m "feat(db): RLS on users + trigger mirroring auth.users to public.users"
```

---

## Task 7: Supabase clients (server, browser, middleware helper)

**Files:**

- Create: `app-norte/src/lib/supabase/server.ts`
- Create: `app-norte/src/lib/supabase/browser.ts`
- Create: `app-norte/src/lib/supabase/middleware.ts`

- [ ] **Step 7.1: Server client (pra RSC e Route Handlers)**

Create `app-norte/src/lib/supabase/server.ts`:

```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { env } from "@/lib/env";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // RSC contexts can't set cookies; ignore. Middleware refreshes the session.
        }
      },
    },
  });
}
```

- [ ] **Step 7.2: Browser client (pra Client Components)**

Create `app-norte/src/lib/supabase/browser.ts`:

```ts
import { createBrowserClient } from "@supabase/ssr";

import { env } from "@/lib/env";

export function createSupabaseBrowserClient() {
  return createBrowserClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
```

- [ ] **Step 7.3: Middleware helper (refresh de sessão por request)**

Create `app-norte/src/lib/supabase/middleware.ts`:

```ts
import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { env } from "@/lib/env";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, user };
}
```

- [ ] **Step 7.4: Validar build + typecheck**

Run: `npm run build && npm run typecheck` → 0 erros.

- [ ] **Step 7.5: Commit**

```bash
git add src/lib/supabase
git commit -m "feat(auth): add Supabase server, browser, middleware clients"
```

---

## Task 8: Next.js middleware — protect /app/\*

**Files:** Create `app-norte/src/middleware.ts`

- [ ] **Step 8.1: Implement middleware**

Create `app-norte/src/middleware.ts`:

```ts
import { NextResponse, type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

const PROTECTED_PREFIXES = ["/app", "/onboarding"];
const AUTH_PREFIXES = ["/login"];

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isAuth = AUTH_PREFIXES.some((p) => pathname.startsWith(p));

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (isAuth && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/app";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
```

- [ ] **Step 8.2: Validar build**

Run: `npm run build` → 0 erros, deve mencionar `ƒ Middleware`.

- [ ] **Step 8.3: Commit**

```bash
git add src/middleware.ts
git commit -m "feat(auth): protect /app and /onboarding via middleware"
```

---

## Task 9: Auth callback route — exchange code for session

**Files:** Create `app-norte/src/app/auth/callback/route.ts`

- [ ] **Step 9.1: Implementar handler**

Create `app-norte/src/app/auth/callback/route.ts`:

```ts
import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/app";

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=missing_code", url));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, url));
  }

  return NextResponse.redirect(new URL(next, url));
}
```

- [ ] **Step 9.2: Build sanity**

Run: `npm run build` → deve mostrar `ƒ /auth/callback`.

- [ ] **Step 9.3: Commit**

```bash
git add src/app/auth
git commit -m "feat(auth): add callback route to exchange auth code for session"
```

---

## Task 10: tRPC context + protectedProcedure + auth.whoami

**Files:**

- Modify: `app-norte/src/server/trpc/context.ts`
- Modify: `app-norte/src/server/trpc/trpc.ts`
- Create: `app-norte/src/server/trpc/routers/auth.ts`
- Modify: `app-norte/src/server/trpc/routers/_app.ts`
- Create: `app-norte/tests/unit/auth.whoami.test.ts`

- [ ] **Step 10.1: Test failing primeiro (TDD)**

Create `app-norte/tests/unit/auth.whoami.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { appRouter } from "@/server/trpc/routers/_app";

describe("auth.whoami", () => {
  it("returns null user when context has no auth", async () => {
    const caller = appRouter.createCaller({ user: null });
    const result = await caller.auth.whoami();
    expect(result).toEqual({ user: null });
  });

  it("returns user payload when context has auth user", async () => {
    const caller = appRouter.createCaller({
      user: { id: "abc-123", email: "test@example.com" },
    });
    const result = await caller.auth.whoami();
    expect(result.user).toEqual({ id: "abc-123", email: "test@example.com" });
  });
});
```

- [ ] **Step 10.2: Run — should FAIL (auth router missing)**

Run: `npm test` → expect failure with "Cannot read properties of undefined (reading 'whoami')" or similar.

- [ ] **Step 10.3: Update context com user real**

Replace `app-norte/src/server/trpc/context.ts`:

```ts
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type SessionUser = {
  id: string;
  email: string;
};

export async function createContext(_opts: FetchCreateContextFnOptions): Promise<{
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
```

- [ ] **Step 10.4: Add protectedProcedure**

Replace `app-norte/src/server/trpc/trpc.ts`:

```ts
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";

import type { Context } from "./context";

const t = initTRPC.context<Context>().create({ transformer: superjson });

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
  return next({ ctx: { ...ctx, user: ctx.user } });
});
```

- [ ] **Step 10.5: Auth router**

Create `app-norte/src/server/trpc/routers/auth.ts`:

```ts
import { publicProcedure, router } from "../trpc";

export const authRouter = router({
  whoami: publicProcedure.query(({ ctx }) => ({
    user: ctx.user,
  })),
});
```

- [ ] **Step 10.6: Mount no \_app**

Replace `app-norte/src/server/trpc/routers/_app.ts`:

```ts
import { router } from "../trpc";
import { authRouter } from "./auth";
import { healthRouter } from "./health";

export const appRouter = router({
  auth: authRouter,
  health: healthRouter,
});

export type AppRouter = typeof appRouter;
```

- [ ] **Step 10.7: Run tests — should PASS**

Run: `npm test` → 3 testes passing (1 health.ping + 2 auth.whoami).

- [ ] **Step 10.8: Build + typecheck**

Run: `npm run build && npm run typecheck` → 0 erros.

- [ ] **Step 10.9: Commit**

```bash
git add src/server tests
git commit -m "feat(api): add tRPC auth.whoami + protectedProcedure"
```

---

## Task 11: Login page (com pass de frontend-design)

**Files:**

- Create: `app-norte/src/app/(auth)/layout.tsx`
- Create: `app-norte/src/app/(auth)/login/page.tsx`
- Create: `app-norte/src/components/auth/login-form.tsx`
- Modify: shadcn Input + Card (rodar `npx shadcn add input card`)

> ⚠️ **EXECUTING SUBAGENT MUST INVOKE `frontend-design` SKILL** antes de escrever a UI. A página de login é o primeiro contato do usuário com Norte logado — qualidade visual importa.

> **Constraint:** mantém branding do M0 (Norte, verde-floresta) sem trocar fontes ainda (mudança de Inter → Instrument Sans/Serif foi adiada pra M2 conforme memory `project_norte_branding_strategy`). Atmosfera leve OK (gradient sutil ou linha-horizonte) mas sem extravagância — Norte é tom calmo Copilot/Prift.

- [ ] **Step 11.1: Adicionar shadcn primitives Input + Card + Label**

Run from `app-norte/`:

```bash
npx shadcn@latest add input card label
```

- [ ] **Step 11.2: Layout do route group (auth)**

Create `app-norte/src/app/(auth)/layout.tsx`:

```tsx
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-background relative flex min-h-screen items-center justify-center p-6">
      <div className="from-norte-light/30 dark:from-norte-secondary/10 pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b to-transparent" />
      {children}
    </div>
  );
}
```

- [ ] **Step 11.3: LoginForm (client component)**

Create `app-norte/src/components/auth/login-form.tsx`:

```tsx
"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type Status = "idle" | "sending" | "sent" | "error";

export function LoginForm({ next }: { next?: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setErrorMsg(null);

    const supabase = createSupabaseBrowserClient();
    const callbackUrl = new URL("/auth/callback", window.location.origin);
    if (next) callbackUrl.searchParams.set("next", next);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: callbackUrl.toString() },
    });

    if (error) {
      setStatus("error");
      setErrorMsg(error.message);
      return;
    }

    setStatus("sent");
  }

  if (status === "sent") {
    return (
      <div className="space-y-2 text-center">
        <p className="text-norte-primary text-lg font-medium dark:text-white">Cheque seu email</p>
        <p className="text-muted-foreground text-sm">
          Enviamos um link mágico para <span className="font-mono">{email}</span>. Clique nele para
          entrar.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          disabled={status === "sending"}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="voce@exemplo.com"
        />
      </div>
      {errorMsg ? (
        <p className="text-norte-negative text-sm" role="alert">
          {errorMsg}
        </p>
      ) : null}
      <Button type="submit" className="w-full" disabled={status === "sending"}>
        {status === "sending" ? "Enviando..." : "Receber link mágico"}
      </Button>
    </form>
  );
}
```

- [ ] **Step 11.4: Login page**

Create `app-norte/src/app/(auth)/login/page.tsx`:

```tsx
import Link from "next/link";

import { LoginForm } from "@/components/auth/login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type SearchParams = Promise<{ next?: string; error?: string }>;

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const { next, error } = await searchParams;

  return (
    <div className="w-full max-w-sm space-y-8">
      <div className="space-y-1 text-center">
        <Link
          href="/"
          className="text-norte-primary inline-block text-2xl font-semibold tracking-tight dark:text-white"
        >
          Norte
        </Link>
        <p className="text-muted-foreground text-sm">Sua vida financeira em um só lugar</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Entrar</CardTitle>
          <CardDescription>Receba um link mágico no seu email — sem senha.</CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <p className="text-norte-negative mb-4 text-sm" role="alert">
              {decodeURIComponent(error)}
            </p>
          ) : null}
          <LoginForm next={next} />
        </CardContent>
      </Card>

      <p className="text-muted-foreground text-center text-xs">
        Ao entrar você concorda com nossos termos de uso.
      </p>
    </div>
  );
}
```

- [ ] **Step 11.5: Build + lint + format + typecheck**

Run all four. 0 erros expected.

- [ ] **Step 11.6: Manual sanity (opcional, mas recomendado)**

Run `npm run dev`, abrir `http://localhost:3000/login`. Submeter um email seu real. Checar inbox — magic link deve chegar em ~30s. Click → callback → redireciona pra `/app` (que ainda não existe, vai dar 404 — vamos criar nas próximas tasks).

- [ ] **Step 11.7: Commit**

```bash
git add src/app/(auth) src/components/auth/login-form.tsx src/components/ui package.json package-lock.json components.json
git commit -m "feat(auth): login page with magic link form"
```

---

## Task 12: Onboarding page (com pass de frontend-design)

**Files:**

- Create: `app-norte/src/app/(app)/onboarding/page.tsx`
- Create: `app-norte/src/app/(app)/layout.tsx`

> ⚠️ **EXECUTING SUBAGENT MUST INVOKE `frontend-design` SKILL** — onboarding é UX crítica.

**Constraint:** captura nome do usuário e marca `onboardedAt`. Form simples, 1 campo. Skip tem sentido (usuário pode preencher nome depois) mas mantemos obrigatório no MVP.

- [ ] **Step 12.1: Layout do route group (app)**

Create `app-norte/src/app/(app)/layout.tsx`:

```tsx
import { redirect } from "next/navigation";

import { ThemeToggle } from "@/components/theme-toggle";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="bg-background min-h-screen">
      <header className="border-border flex items-center justify-between border-b px-6 py-3">
        <span className="text-norte-primary font-semibold tracking-tight dark:text-white">
          Norte
        </span>
        <ThemeToggle />
      </header>
      <main className="px-6 py-8">{children}</main>
    </div>
  );
}
```

- [ ] **Step 12.2: Onboarding form (server action)**

Create `app-norte/src/app/(app)/onboarding/page.tsx`:

```tsx
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function completeOnboarding(formData: FormData) {
  "use server";
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await prisma.user.update({
    where: { id: user.id },
    data: { name, onboardedAt: new Date() },
  });

  redirect("/app");
}

export default async function OnboardingPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (dbUser?.onboardedAt) redirect("/app");

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Bem-vindo</CardTitle>
          <CardDescription>Como você quer ser chamado?</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={completeOnboarding} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Seu nome</Label>
              <Input
                id="name"
                name="name"
                type="text"
                autoComplete="given-name"
                required
                placeholder="Carlos"
                defaultValue={dbUser?.name ?? ""}
              />
            </div>
            <Button type="submit" className="w-full">
              Continuar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 12.3: Build + lint**

Run: `npm run build && npm run lint`. 0 erros.

- [ ] **Step 12.4: Commit**

```bash
git add "src/app/(app)"
git commit -m "feat(auth): protected app layout + onboarding form"
```

---

## Task 13: /app placeholder + auto-redirect onboarding

**Files:** Create `app-norte/src/app/(app)/app/page.tsx`

- [ ] **Step 13.1: Implementar /app**

Create `app-norte/src/app/(app)/app/page.tsx`:

```tsx
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
```

(LogoutButton vem na próxima task — o build vai quebrar por enquanto, o que é OK; commit no final da Task 14 cobre as duas.)

---

## Task 14: Logout + final M1 wiring

**Files:**

- Create: `app-norte/src/components/auth/logout-button.tsx`
- Create: `app-norte/src/app/api/auth/logout/route.ts`

- [ ] **Step 14.1: Logout route handler**

Create `app-norte/src/app/api/auth/logout/route.ts`:

```ts
import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 14.2: LogoutButton component**

Create `app-norte/src/components/auth/logout-button.tsx`:

```tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <Button variant="outline" onClick={handleClick} disabled={pending}>
      {pending ? "Saindo..." : "Sair"}
    </Button>
  );
}
```

- [ ] **Step 14.3: Run all gates**

Run from `app-norte/`:

```bash
npm run format
npm run lint
npm run typecheck
npm test
npm run build
```

All must pass.

- [ ] **Step 14.4: Commit**

```bash
git add "src/app/(app)/app/page.tsx" src/app/api/auth/logout src/components/auth/logout-button.tsx
git commit -m "feat(auth): /app placeholder + logout flow"
```

---

## Task 15: Update env.example and docs

**Files:**

- Modify: `app-norte/.env.example` (já cobre Supabase via M0; só validar)
- Modify: `app-norte/AGENTS.md` (adicionar nota sobre RLS + protectedProcedure)
- Modify: `app-norte/README.md` (referenciar M1 plan)

- [ ] **Step 15.1: Append em AGENTS.md (depois das Convenções existentes)**

Append at end of `app-norte/AGENTS.md`:

```markdown
## M1 — Auth conventions

### Autenticação

- Supabase Auth gerencia `auth.users`. Trigger SQL espelha em `public.users`.
- Server-side: `createSupabaseServerClient()` de `@/lib/supabase/server`.
- Browser-side: `createSupabaseBrowserClient()` de `@/lib/supabase/browser`.
- Middleware (`src/middleware.ts`) refresca sessão e protege `/app/*` e `/onboarding`.

### tRPC

- `protectedProcedure` (em `@/server/trpc/trpc`) lança `UNAUTHORIZED` se `ctx.user` for null.
- Use sempre `protectedProcedure` quando a operação tocar dados do usuário.

### RLS

- Toda tabela com user_id deve ter RLS habilitada.
- Policies em `supabase/migrations/*.sql` aplicadas via Supabase Dashboard SQL Editor.
- Padrão: `using (auth.uid() = user_id)` pra SELECT/UPDATE/DELETE.
```

- [ ] **Step 15.2: Add M1 plan link no README.md**

Edit `app-norte/README.md` "Documentação" section adicionando linha:

```markdown
- `../docs/superpowers/plans/2026-04-25-m1-auth-multi-tenant.md` — M1 plan (Auth & Multi-tenant)
```

- [ ] **Step 15.3: Commit final M1**

```bash
git add AGENTS.md README.md
git commit -m "docs: M1 conventions for auth + RLS + tRPC protected procedures"
```

---

## M1 Exit Criteria

- [ ] Login page renderiza em `/login`, magic link enviado para email real recebido em < 60s
- [ ] Click no link redireciona pra `/onboarding`
- [ ] Submeter nome em `/onboarding` redireciona pra `/app`
- [ ] `/app` mostra "Olá, {nome}" + email + user.id
- [ ] Botão "Sair" desloga e volta pra `/login`
- [ ] Tentar acessar `/app` sem login redireciona pra `/login?next=/app`
- [ ] Tentar acessar `/login` logado redireciona pra `/app`
- [ ] `npm test` passa (3 testes: 1 health + 2 auth.whoami)
- [ ] `npm run build/lint/typecheck/format:check` 0 erros
- [ ] Tabela `public.users` no Supabase tem 1 row depois do primeiro signup (verificar no Dashboard → Database → Tables)
- [ ] RLS habilitada — verificar via Supabase Dashboard que tabela `users` tem `RLS enabled` com 2 policies (`users_select_own`, `users_update_own`)

---

## Self-Review

**1. Spec coverage (PRD §6.1 RF-1.1 a RF-1.5):**

- ✅ RF-1.1 Magic link → Task 11
- ⏸ RF-1.2 OAuth Google → adiado pra hotfix de M1 ou M2 (escolha consciente: magic link cobre 90% dos use cases; Google requer OAuth credentials Google Cloud Console que adiciona setup; YAGNI pra MVP demo)
- ✅ RF-1.3 Onboarding nome → Task 12
- ✅ RF-1.4 Email confirmation → habilitada no Step 0.4 + magic link já é a confirmação
- ✅ RF-1.5 Recuperação via magic link → mesmo fluxo (magic link substitui senha)

**Gap aceito:** Google OAuth adiado. Documentado.

**2. Placeholder scan:** todos os steps têm código completo. Nenhum "TBD" ou "implement appropriately".

**3. Type consistency:** `SessionUser`, `Context`, `appRouter`, `protectedProcedure`, `createSupabaseServerClient`, `createSupabaseBrowserClient`, `updateSession` consistentes em todas as tasks.

**4. Critical path validation:**

- Task 1 (env) → Task 2 (deps) → Task 3 (schema) → Task 4 (prisma rewrite) → **Task 5 requires Step 0** → Task 6 (RLS via dashboard) → Task 7 (clients) → Task 8 (middleware) → Task 9 (callback) → Task 10 (tRPC) → Task 11 (login) → Task 12 (onboarding) → Task 13 (app) → Task 14 (logout) → Task 15 (docs)
- Login flow só funciona end-to-end depois de Tasks 6, 7, 8, 9 todas. Tasks 10–14 podem ser paralelizadas em parte se necessário, mas dependem de 7+ pra ler o user.

**5. Frontend-design flag:** Tasks 11 e 12 marcadas. Subagentes devem invocar a skill antes de escrever UI.

**6. Risco conhecido:** Prisma 7's `previewFeatures = ["driverAdapters"]` pode ter mudado de status (became default) ou exigir flag diferente desde meu cutoff Jan 2026. Se `npx prisma generate` reclamar, remover a flag ou consultar `node_modules/prisma/dist/docs` para verificar.
