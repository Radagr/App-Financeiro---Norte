# App Norte — Master Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir o MVP do Norte (P0 do PRD) em milestones executáveis e verificáveis, com TDD onde aplicável e commits frequentes.

**Architecture:** Monorepo Next.js 15 com App Router, RSC + tRPC pra type-safety end-to-end, Supabase Postgres com RLS multi-tenant, integrações externas isoladas em adapters (Pluggy, Claude, Stripe, Resend) pra trocar provedores sem refactor. Server-side fetching nas pages (RSC), tRPC só pra mutations e dados que mudam por interação.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind v4, shadcn/ui, Recharts, tRPC v11, Prisma, Supabase, Stripe, Pluggy, Claude API, Resend, Upstash Redis, Vitest, Playwright, Vercel.

**PRD:** `docs/PRD.md`

> **Nota de versões (atualizado 2026-04-25 após Task 1):** `create-next-app@latest` instalou Next.js **16.2.4** + Tailwind **v4**. A decisão registrada com o usuário foi seguir nessas versões. Tailwind v4 não usa `tailwind.config.ts` — toda configuração de tema fica em CSS via `@theme` no `globals.css`. Task 3 abaixo já reflete isso.

---

## Milestone Roadmap

| ID  | Título                | Sessões | Depende | Deliverable                                                |
| --- | --------------------- | ------- | ------- | ---------------------------------------------------------- |
| M0  | Foundation & Setup    | 1       | —       | Projeto bootado, design system, banco, tRPC, primeira tela |
| M1  | Auth & Multi-tenant   | 1       | M0      | Login funcional + RLS + onboarding                         |
| M2  | Landing + Stripe      | 1       | M1      | Landing institucional + checkout funcional                 |
| M3  | Dashboard 360° (mock) | 1-2     | M1      | 5 módulos com fake data, design polido                     |
| M4  | Importação manual     | 1       | M3      | CSV/XLSX/OFX → banco com mapeamento                        |
| M5  | Pluggy Open Finance   | 2       | M4      | Sync de contas, cartões, corretoras BR                     |
| M6  | Categorização IA      | 1       | M5      | Claude Haiku + regras aprendidas                           |
| M7  | Metas financeiras     | 1       | M3      | CRUD + cálculo de aporte + alertas                         |
| M8  | Insights + Relatório  | 1       | M6, M7  | Email mensal automático + inbox de alertas                 |

**Estratégia:** este documento detalha **M0 task-a-task**. M1+ tem outline com objetivos e exit criteria. **O plano detalhado de cada milestone seguinte será escrito ao iniciar a milestone**, aproveitando aprendizado das anteriores. Isso evita planejamento especulativo (YAGNI) que vira documentação morta.

---

## File Structure (M0)

```
app-norte/
├── .env.example
├── .eslintrc.json
├── .gitignore
├── .nvmrc
├── .prettierrc
├── README.md
├── CLAUDE.md
├── components.json                 # shadcn config
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── prisma/
│   └── schema.prisma               # vazio com datasource Supabase
├── tailwind.config.ts              # design tokens Norte
├── tsconfig.json                   # strict
├── vitest.config.ts
├── public/
│   └── fonts/                      # Inter + JetBrains Mono local fallback
├── src/
│   ├── app/
│   │   ├── layout.tsx              # root layout, fonts, theme provider
│   │   ├── page.tsx                # placeholder home
│   │   ├── globals.css             # Tailwind + CSS vars do tema
│   │   └── api/
│   │       └── trpc/
│   │           └── [trpc]/
│   │               └── route.ts    # tRPC handler
│   ├── components/
│   │   ├── ui/                     # shadcn primitives (auto-gerados)
│   │   └── theme-provider.tsx      # next-themes
│   ├── lib/
│   │   ├── env.ts                  # Zod parser de process.env
│   │   ├── prisma.ts               # singleton PrismaClient
│   │   └── utils.ts                # cn() helper do shadcn
│   ├── server/
│   │   └── trpc/
│   │       ├── trpc.ts             # init tRPC
│   │       ├── context.ts          # createContext
│   │       └── routers/
│   │           ├── _app.ts         # appRouter
│   │           └── health.ts       # health.ping
│   └── trpc/
│       ├── client.ts               # tRPC react client
│       └── provider.tsx            # QueryClientProvider + tRPC provider
└── tests/
    └── unit/
        └── health.test.ts          # primeiro teste TDD
```

---

## M0: Foundation & Setup

**Goal:** Sair de zero pra um app Next.js navegável com design tokens Norte aplicados, banco Supabase conectado, tRPC funcionando com health check testado, dark mode e CI básico de typecheck/test/lint via npm script.

**Files** (todos os caminhos relativos a `app-norte/` que será criado pelo create-next-app dentro do working dir).

---

### Task 1: Verificar Node + criar projeto Next.js

**Files:**

- Create: `app-norte/` (via `create-next-app`)

- [ ] **Step 1.1: Verificar Node 20+**

Run: `node --version`
Expected: `v20.x.x` ou superior. Se inferior ou ausente: instalar via https://nodejs.org/ (LTS) e reabrir o terminal antes de continuar.

- [ ] **Step 1.2: Criar projeto Next.js 15 com TypeScript + Tailwind + App Router**

Run (na raiz `App Financeiro/`):

```bash
npx create-next-app@latest app-norte --typescript --tailwind --app --eslint --src-dir --import-alias "@/*" --no-turbopack --use-npm
```

Aceitar todos os defaults adicionais. Expected: pasta `app-norte/` criada com estrutura padrão.

- [ ] **Step 1.3: Init git e primeiro commit**

Run:

```bash
cd app-norte
git init
git add -A
git commit -m "chore: bootstrap Next.js 15 + TS + Tailwind"
```

- [ ] **Step 1.4: Adicionar `.nvmrc`**

Create `.nvmrc`:

```
20
```

Run:

```bash
git add .nvmrc && git commit -m "chore: pin node version via .nvmrc"
```

---

### Task 2: TypeScript estrito

**Files:**

- Modify: `tsconfig.json`

- [ ] **Step 2.1: Habilitar flags estritas**

Edit `tsconfig.json` `compilerOptions` adicionando:

```json
{
  "strict": true,
  "noUncheckedIndexedAccess": true,
  "noImplicitOverride": true,
  "noFallthroughCasesInSwitch": true,
  "forceConsistentCasingInFileNames": true,
  "verbatimModuleSyntax": true
}
```

- [ ] **Step 2.2: Validar typecheck passa**

Run: `npx tsc --noEmit`
Expected: 0 erros.

- [ ] **Step 2.3: Adicionar script `typecheck`**

Edit `package.json` `scripts`:

```json
"typecheck": "tsc --noEmit"
```

- [ ] **Step 2.4: Commit**

```bash
git add tsconfig.json package.json
git commit -m "chore: enable strict TypeScript"
```

---

### Task 3: Design tokens Norte no Tailwind v4

**Files:**

- Modify: `app-norte/src/app/globals.css`

> Tailwind v4 não tem mais `tailwind.config.ts`. Toda a configuração de tema fica no CSS via `@theme` (estática) e CSS vars (dinâmicas com light/dark). O bloco `@theme inline` mapeia `--color-*` pra vars HSL definidas em `:root` / `.dark`, permitindo dark mode via classe.

- [ ] **Step 3.1: Substituir `globals.css` com paleta Norte e tokens light/dark**

Replace `app-norte/src/app/globals.css` content:

```css
@import "tailwindcss";

@custom-variant dark (&:is(.dark *));

:root {
  --background: 0 0% 100%;
  --foreground: 222 13% 11%;
  --card: 0 0% 100%;
  --card-foreground: 222 13% 11%;
  --border: 220 14% 91%;
  --muted: 210 30% 96%;
  --muted-foreground: 215 16% 47%;
}

.dark {
  --background: 162 60% 6%;
  --foreground: 152 25% 92%;
  --card: 162 50% 9%;
  --card-foreground: 152 25% 92%;
  --border: 162 30% 18%;
  --muted: 162 30% 14%;
  --muted-foreground: 152 12% 65%;
}

@theme inline {
  --color-norte-primary: #0f3d2e;
  --color-norte-secondary: #1a6e4f;
  --color-norte-light: #e8f5ee;
  --color-norte-info: #1e3a5f;
  --color-norte-warn: #d4a017;
  --color-norte-positive: #16a34a;
  --color-norte-negative: #dc2626;
  --color-norte-ink: #111827;

  --color-background: hsl(var(--background));
  --color-foreground: hsl(var(--foreground));
  --color-card: hsl(var(--card));
  --color-card-foreground: hsl(var(--card-foreground));
  --color-border: hsl(var(--border));
  --color-muted: hsl(var(--muted));
  --color-muted-foreground: hsl(var(--muted-foreground));

  --font-sans: var(--font-inter), system-ui, sans-serif;
  --font-mono: var(--font-jetbrains), ui-monospace, monospace;

  --radius-lg: 16px;
  --radius-md: 12px;
  --radius-sm: 8px;

  --shadow-card: 0 1px 2px 0 rgb(0 0 0 / 0.04), 0 1px 3px 0 rgb(0 0 0 / 0.06);
}

@layer base {
  body {
    @apply bg-background text-foreground antialiased;
    font-feature-settings: "cv11", "ss01";
  }

  .tabular {
    font-variant-numeric: tabular-nums;
  }
}
```

- [ ] **Step 3.2: Validar build**

Run (de `app-norte/`): `npm run build`
Expected: build OK, classes `bg-norte-primary`, `text-norte-secondary`, `bg-background` reconhecidas.

- [ ] **Step 3.3: Commit**

```bash
git add src/app/globals.css
git commit -m "feat(design): add Norte palette and theme tokens for Tailwind v4"
```

---

### Task 4: Fontes Inter + JetBrains Mono

**Files:**

- Modify: `src/app/layout.tsx`

- [ ] **Step 4.1: Carregar fontes via next/font**

Replace `src/app/layout.tsx` content:

```tsx
import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Norte — Sua vida financeira em um só lugar",
  description:
    "Dashboard financeiro 360° com Open Finance, IA de categorização e metas inteligentes.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${jetbrains.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 4.2: Validar dev server**

Run: `npm run dev` (background)
Open `http://localhost:3000` no browser, confirmar que página padrão renderiza com Inter aplicado (inspect → font-family deve incluir Inter). Parar o dev server.

- [ ] **Step 4.3: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat(design): load Inter and JetBrains Mono via next/font"
```

---

### Task 5: Dark mode com next-themes

**Files:**

- Create: `src/components/theme-provider.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 5.1: Instalar next-themes**

Run: `npm install next-themes`

- [ ] **Step 5.2: Criar ThemeProvider**

Create `src/components/theme-provider.tsx`:

```tsx
"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

export function ThemeProvider({ children, ...props }: ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
```

- [ ] **Step 5.3: Wrapping no root layout**

Edit `src/app/layout.tsx` `RootLayout` body:

```tsx
<body>
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
    {children}
  </ThemeProvider>
</body>
```

Adicionar import: `import { ThemeProvider } from "@/components/theme-provider";`

Adicionar `suppressHydrationWarning` no `<html>` tag.

- [ ] **Step 5.4: Commit**

```bash
git add src/components/theme-provider.tsx src/app/layout.tsx package.json package-lock.json
git commit -m "feat(design): add dark mode via next-themes"
```

---

### Task 6: shadcn/ui

**Files:**

- Create: `components.json`
- Create: `src/lib/utils.ts`
- Create: `src/components/ui/button.tsx` (via CLI)

- [ ] **Step 6.1: Init shadcn**

Run:

```bash
npx shadcn@latest init -y --base-color slate
```

Aceitar defaults compatíveis com a estrutura `src/`. Confirmar `components.json` criado.

- [ ] **Step 6.2: Adicionar Button como sanity check**

Run: `npx shadcn@latest add button`

- [ ] **Step 6.3: Validar build**

Run: `npm run build`
Expected: 0 erros.

- [ ] **Step 6.4: Commit**

```bash
git add components.json src/components/ui src/lib/utils.ts src/app/globals.css package.json package-lock.json
git commit -m "feat(ui): bootstrap shadcn/ui with Button component"
```

---

### Task 7: Env parsing com Zod

**Files:**

- Create: `src/lib/env.ts`
- Create: `.env.example`
- Modify: `.gitignore` (verificar `.env*.local`)

- [ ] **Step 7.1: Instalar Zod**

Run: `npm install zod`

- [ ] **Step 7.2: Criar `.env.example`**

Create `.env.example`:

```
# --- M0 (foundation) ---
NEXT_PUBLIC_APP_URL=http://localhost:3000

# --- Supabase (M0+) ---
DATABASE_URL=
DIRECT_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# --- M2 Stripe ---
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PRICE_PLUS=
NEXT_PUBLIC_STRIPE_PRICE_PRO=

# --- M5 Pluggy ---
PLUGGY_CLIENT_ID=
PLUGGY_CLIENT_SECRET=

# --- M6 Claude ---
ANTHROPIC_API_KEY=

# --- M8 Resend ---
RESEND_API_KEY=

# --- Upstash ---
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

- [ ] **Step 7.3: Criar parser de env**

Create `src/lib/env.ts`:

```ts
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  DATABASE_URL: z.string().min(1).optional(),
  DIRECT_URL: z.string().min(1).optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid env. See .env.example.");
}

export const env = parsed.data;
```

> **Nota:** opcionais por enquanto até cada milestone exigir. M1 vai marcar Supabase como obrigatório.

- [ ] **Step 7.4: Criar `.env.local` vazio (local-only)**

Run:

```bash
cp .env.example .env.local
```

Conferir `.gitignore` contém `.env*.local`.

- [ ] **Step 7.5: Commit**

```bash
git add src/lib/env.ts .env.example package.json package-lock.json
git commit -m "feat(env): add Zod-validated environment parser"
```

---

### Task 8: Prisma + Supabase scaffold

**Files:**

- Create: `prisma/schema.prisma`
- Create: `src/lib/prisma.ts`

- [ ] **Step 8.1: Instalar Prisma**

Run: `npm install -D prisma && npm install @prisma/client`

- [ ] **Step 8.2: Init Prisma**

Run: `npx prisma init --datasource-provider postgresql`

- [ ] **Step 8.3: Configurar schema**

Replace `prisma/schema.prisma` content:

```prisma
generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "linux-musl-openssl-3.0.x"]
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

// Schemas reais virão por milestone (M1+)
```

- [ ] **Step 8.4: Singleton PrismaClient**

Create `src/lib/prisma.ts`:

```ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

- [ ] **Step 8.5: Validar generate**

Run: `npx prisma generate`
Expected: `Generated Prisma Client`. Sem aplicar migration ainda (sem Supabase connection real até o usuário ter projeto Supabase criado).

- [ ] **Step 8.6: Commit**

```bash
git add prisma/schema.prisma src/lib/prisma.ts package.json package-lock.json
git commit -m "feat(db): scaffold Prisma with PostgreSQL datasource"
```

---

### Task 9: tRPC v11 setup

**Files:**

- Create: `src/server/trpc/trpc.ts`
- Create: `src/server/trpc/context.ts`
- Create: `src/server/trpc/routers/_app.ts`
- Create: `src/server/trpc/routers/health.ts`
- Create: `src/app/api/trpc/[trpc]/route.ts`
- Create: `src/trpc/client.ts`
- Create: `src/trpc/provider.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 9.1: Instalar deps tRPC**

Run:

```bash
npm install @trpc/server@next @trpc/client@next @trpc/react-query@next @tanstack/react-query@^5 superjson
```

- [ ] **Step 9.2: Init tRPC**

Create `src/server/trpc/trpc.ts`:

```ts
import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import type { Context } from "./context";

const t = initTRPC.context<Context>().create({ transformer: superjson });

export const router = t.router;
export const publicProcedure = t.procedure;
```

- [ ] **Step 9.3: Context placeholder**

Create `src/server/trpc/context.ts`:

```ts
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";

export async function createContext(_opts: FetchCreateContextFnOptions) {
  return { user: null as null };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
```

- [ ] **Step 9.4: Router health (placeholder, será testado na Task 10)**

Create `src/server/trpc/routers/health.ts`:

```ts
import { router, publicProcedure } from "../trpc";

export const healthRouter = router({
  ping: publicProcedure.query(() => ({ ok: true, ts: Date.now() })),
});
```

- [ ] **Step 9.5: AppRouter**

Create `src/server/trpc/routers/_app.ts`:

```ts
import { router } from "../trpc";
import { healthRouter } from "./health";

export const appRouter = router({
  health: healthRouter,
});

export type AppRouter = typeof appRouter;
```

- [ ] **Step 9.6: Route handler Next.js**

Create `src/app/api/trpc/[trpc]/route.ts`:

```ts
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/server/trpc/routers/_app";
import { createContext } from "@/server/trpc/context";

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext,
  });

export { handler as GET, handler as POST };
```

- [ ] **Step 9.7: Client tRPC**

Create `src/trpc/client.ts`:

```ts
import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@/server/trpc/routers/_app";

export const trpc = createTRPCReact<AppRouter>();
```

- [ ] **Step 9.8: Provider**

Create `src/trpc/provider.tsx`:

```tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { useState } from "react";
import superjson from "superjson";
import { trpc } from "./client";

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [httpBatchLink({ url: "/api/trpc", transformer: superjson })],
    }),
  );
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
```

- [ ] **Step 9.9: Wrappar no layout**

Edit `src/app/layout.tsx` body:

```tsx
<body>
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
    <TRPCProvider>{children}</TRPCProvider>
  </ThemeProvider>
</body>
```

Import: `import { TRPCProvider } from "@/trpc/provider";`

- [ ] **Step 9.10: Build sanity**

Run: `npm run build`
Expected: 0 erros.

- [ ] **Step 9.11: Commit**

```bash
git add src package.json package-lock.json
git commit -m "feat(api): scaffold tRPC v11 with health.ping"
```

---

### Task 10: Vitest + primeiro teste TDD do health.ping

**Files:**

- Create: `vitest.config.ts`
- Create: `tests/unit/health.test.ts`
- Modify: `package.json`

- [ ] **Step 10.1: Instalar Vitest**

Run: `npm install -D vitest @vitejs/plugin-react vite-tsconfig-paths`

- [ ] **Step 10.2: Config Vitest**

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts", "src/**/*.test.ts"],
  },
});
```

- [ ] **Step 10.3: Adicionar scripts**

Edit `package.json` `scripts`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 10.4: Escrever teste failing primeiro**

Create `tests/unit/health.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { appRouter } from "@/server/trpc/routers/_app";

describe("health.ping", () => {
  it("returns ok=true with a numeric timestamp", async () => {
    const caller = appRouter.createCaller({ user: null });
    const result = await caller.health.ping();

    expect(result.ok).toBe(true);
    expect(typeof result.ts).toBe("number");
    expect(result.ts).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 10.5: Rodar pra confirmar que passa (a implementação já existe da Task 9, então este é um teste de regressão TDD-style — guarda o contrato)**

Run: `npm test`
Expected: 1 passed.

> **Nota TDD:** numa funcionalidade nova, o teste viria antes da impl e deveria FALHAR primeiro. Aqui o `health.ping` foi necessário pra wiring do tRPC na Task 9, então este teste estabelece o contrato pra futuras mudanças. Próximas features (M1+) seguem TDD estrito: red → green → refactor.

- [ ] **Step 10.6: Commit**

```bash
git add tests vitest.config.ts package.json package-lock.json
git commit -m "test: add Vitest setup and health.ping contract test"
```

---

### Task 11: ESLint + Prettier

**Files:**

- Modify: `.eslintrc.json` (ou `eslint.config.mjs` dependendo do que o create-next-app gerou)
- Create: `.prettierrc`
- Create: `.prettierignore`

- [ ] **Step 11.1: Instalar Prettier + plugin Tailwind**

Run: `npm install -D prettier prettier-plugin-tailwindcss eslint-config-prettier`

- [ ] **Step 11.2: `.prettierrc`**

Create `.prettierrc`:

```json
{
  "semi": true,
  "singleQuote": false,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

- [ ] **Step 11.3: `.prettierignore`**

Create `.prettierignore`:

```
.next
node_modules
prisma/migrations
public
```

- [ ] **Step 11.4: Estender ESLint pra desligar conflitos com Prettier**

Edit ESLint config (formato gerado pelo create-next-app) adicionando `"prettier"` ao final do array `extends` (ou equivalente).

- [ ] **Step 11.5: Adicionar scripts**

Edit `package.json` `scripts`:

```json
"format": "prettier --write .",
"format:check": "prettier --check ."
```

- [ ] **Step 11.6: Rodar format**

Run: `npm run format`
Then: `npm run lint`
Expected: 0 erros.

- [ ] **Step 11.7: Commit**

```bash
git add .
git commit -m "chore: configure Prettier + Tailwind plugin and align ESLint"
```

---

### Task 12: Home placeholder com identidade Norte

**Files:**

- Modify: `src/app/page.tsx`

- [ ] **Step 12.1: Substituir home pelo placeholder Norte**

Replace `src/app/page.tsx` content:

```tsx
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 py-16">
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-muted-foreground font-mono text-xs tracking-[0.2em] uppercase">
          em construção
        </p>
        <h1 className="text-norte-primary text-5xl font-semibold tracking-tight md:text-6xl">
          Norte
        </h1>
        <p className="text-muted-foreground max-w-md text-base text-balance md:text-lg">
          Sua vida financeira em um só lugar — saldo, fluxo, patrimônio e metas.
        </p>
      </div>
      <Button className="bg-norte-primary hover:bg-norte-secondary text-white">Em breve</Button>
      <p className="tabular text-muted-foreground text-xs">v0.0.1 · M0 foundation</p>
    </main>
  );
}
```

- [ ] **Step 12.2: Sanity visual**

Run: `npm run dev` (background)
Abrir `http://localhost:3000`. Validar:

- "Norte" em verde escuro Inter semibold
- Subtítulo em cinza
- Botão verde com hover mais claro
- Tabular nums no "v0.0.1"

Parar o dev server.

- [ ] **Step 12.3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat(ui): add Norte landing placeholder with brand palette"
```

---

### Task 13: README + CLAUDE.md

**Files:**

- Modify: `app-norte/README.md`
- Modify: `app-norte/CLAUDE.md` (auto-gerado pelo create-next-app v16 — vamos preservar o que veio e adicionar nossas convenções)
- Modify: `app-norte/AGENTS.md` (auto-gerado — vamos preservar)

> **Nota:** `create-next-app@16` gerou automaticamente `CLAUDE.md` e `AGENTS.md`. Decisão (com o usuário): manter o que veio e adicionar uma seção "Convenções deste repo" no fim de cada um.

- [ ] **Step 13.1: README**

Replace `app-norte/README.md` content:

````markdown
# Norte

Plataforma de gestão financeira pessoal — dashboard 360°, Open Finance, IA de categorização, metas inteligentes.

## Stack

Next.js 15 · React 19 · TypeScript · Tailwind · shadcn/ui · tRPC · Prisma · Supabase · Stripe · Pluggy · Claude API.

## Setup

```bash
nvm use            # ou instale Node 20+
npm install
cp .env.example .env.local   # preencher conforme cada milestone
npm run dev
```
````

## Scripts

| Comando             | Função            |
| ------------------- | ----------------- |
| `npm run dev`       | Dev server        |
| `npm run build`     | Build de produção |
| `npm run typecheck` | Checagem de tipos |
| `npm test`          | Testes unitários  |
| `npm run lint`      | ESLint            |
| `npm run format`    | Prettier write    |

## Documentação

- `docs/PRD.md` — Product Requirements
- `docs/superpowers/plans/` — planos de implementação por milestone

````

- [ ] **Step 13.2: Append Norte conventions ao CLAUDE.md auto-gerado**

Append ao final de `app-norte/CLAUDE.md` (preservando o conteúdo já existente):
```markdown

---

## Convenções do projeto Norte

### Idioma
Comunicação em português. Identificadores de código, mensagens de commit e nomes de arquivo em inglês.

### Princípios
- TDD: teste falha → impl mínima → refactor.
- Commits frequentes (1 commit por step do plano).
- DRY, YAGNI: nada de over-engineering, nada de abstração especulativa.
- Sem comentários explicando o "que" — só o "porquê" não-óbvio.

### Padrões de código
- Imports absolutos via `@/*`.
- Cores via tokens do Tailwind (`norte-primary`, `norte-secondary`, `bg-background` etc), nunca hex hardcoded em components.
- Números financeiros usam a classe utilitária `tabular` (font-variant-numeric: tabular-nums).
- Server Components por default; `"use client"` só quando precisa de interatividade ou hooks.
- tRPC pra mutations e dados client-driven; RSC com fetch direto pra páginas read-only.
- RLS Postgres em toda tabela com `user_id`.

### Workflow
- Plano canônico: `../docs/superpowers/plans/2026-04-25-app-norte-master-plan.md`
- PRD: `../docs/PRD.md`

### Antes de commitar
`npm run typecheck && npm test && npm run lint`. Se algum falhar, não commitar.
````

- [ ] **Step 13.3: Append Norte conventions ao AGENTS.md auto-gerado**

Append ao final de `app-norte/AGENTS.md` (preservando o que veio):

```markdown
---

## Convenções específicas do Norte

Mesmas convenções de `CLAUDE.md` se aplicam aqui (idioma PT-BR, TDD, tokens de Tailwind, RLS obrigatória, etc).
```

- [ ] **Step 13.4: Commit final M0**

```bash
git add README.md CLAUDE.md AGENTS.md
git commit -m "docs: add README and Norte conventions to CLAUDE.md/AGENTS.md"
```

---

### M0 Exit Criteria

- [ ] `npm run dev` abre `localhost:3000` mostrando o placeholder Norte com paleta correta
- [ ] `npm run build` passa sem erro
- [ ] `npm run typecheck` passa
- [ ] `npm test` passa (1 teste de health.ping)
- [ ] `npm run lint` passa
- [ ] Toggle dark/light visualmente diferente (manual: trocar classe `dark` no `<html>` via DevTools)
- [ ] Histórico git contém ≥10 commits incrementais
- [ ] `.env.example` documenta envs de M0–M8
- [ ] PRD e plano referenciados no README

---

## M1: Auth & Multi-tenant (outline)

**Goal:** usuários se cadastram, fazem login (magic link + Google), entram num onboarding mínimo e veem o dashboard placeholder. Toda tabela com `user_id` tem RLS.

**Deliverables:** páginas `/login`, `/onboarding`, `/app`. Tabelas `users`, `households` (placeholder pra P1). Middleware Next.js que protege `/app/*`. Supabase Auth integrada com tRPC context.

**Exit criteria:** signup → magic link → callback → onboarding (nome) → `/app` carrega; user só vê seus próprios dados (validado por teste); logout funciona.

**Plano detalhado:** será escrito ao iniciar M1.

---

## M2: Landing + Stripe (outline)

**Goal:** landing institucional pública com pricing; Plus e Pro vendidos via Stripe Checkout; webhook atualiza `subscription_tier` do user.

**Deliverables:** `/` (landing — substitui placeholder), `/pricing`, `/api/stripe/webhook`, `/app/billing`. Tabela `subscriptions`. Trial de 14 dias do Plus sem cartão.

**Exit criteria:** clico em "Assinar Plus" → Stripe Checkout → callback → `subscription_tier` = "plus" no DB; webhook de cobrança falha cria task de email.

---

## M3: Dashboard 360° com mock data (outline)

**Goal:** 5 módulos visuais polidos (saldo, fluxo, patrimônio, alocação, metas) com fake data realista BRL. Estética Copilot/Prift validada antes de gastar energia em integração real.

**Deliverables:** `/app` com SaldoConsolidadoCard, FluxoCaixaChart (Recharts barras empilhadas), PatrimonioChart (linha 12m), AlocacaoDonut, MetasGrid. Toggle de período. Skeleton loaders.

**Exit criteria:** dashboard renderiza em < 1.5s, todos os 5 módulos com fake data; design review interno passa (vs. screenshots Copilot).

---

## M4: Importação manual (outline)

**Goal:** usuário sobe `.csv/.xlsx/.ofx` e o sistema cria transações.

**Deliverables:** `/app/import`, parser CSV (Papa Parse), XLSX (SheetJS), OFX (regex/lib leve). Mapeamento inteligente de colunas com sugestão por header. Detecção de duplicatas por hash (data + valor + descrição).

**Exit criteria:** subir extrato Itaú real CSV → 100% das linhas viram transações categorizáveis; duplicata detectada na re-upload.

---

## M5: Pluggy Open Finance (outline)

**Goal:** usuário conecta Itaú/Nubank/BTG via widget Pluggy, sistema baixa e armazena 12 meses de histórico.

**Deliverables:** server-side adapter `pluggy.ts`, página `/app/contas`, widget Pluggy, cron diário (Vercel Cron) `/api/cron/sync-pluggy`, idempotência por `pluggy_transaction_id`.

**Exit criteria:** conectar Itaú real → ver saldo + 90 dias de transações; re-sync não duplica.

---

## M6: Categorização IA (outline)

**Goal:** transações novas categorizadas automaticamente via Claude Haiku; correções do usuário viram regras aplicadas retroativamente.

**Deliverables:** adapter `claude.ts` com prompt estruturado, batch endpoint pra Sonnet mensal, tabela `category_rules`, UI de correção inline com auto-aprendizado.

**Exit criteria:** 90% accuracy em 100 transações de teste; correção em 1 transação aplica em todas do mesmo `merchant`.

---

## M7: Metas financeiras (outline)

**Goal:** CRUD de metas SMART com cálculo de aporte, vinculação a contas, alertas.

**Deliverables:** `/app/metas`, tabela `goals`, tabela `goal_contributions`, lógica de cálculo de aporte mensal `(target - current) / months_remaining`, alerta quando aporte mensal real < 80% do necessário por 2m.

**Exit criteria:** criar meta "viagem R$ 12k em 12m" → ver "aporte mensal: R$ 1.000" → barra de progresso correta após 1 aporte simulado.

---

## M8: Insights + Relatório mensal (outline)

**Goal:** motor de regras gera alertas; cron mensal compõe PDF + email com resumo, top categorias, status metas, 3 sugestões IA.

**Deliverables:** `engine/insights.ts` (regras), `engine/monthly-report.ts`, templates React Email, `/api/cron/monthly-report`, inbox `/app/insights`.

**Exit criteria:** rodar cron manualmente → email aparece no Resend dashboard com PDF anexado e conteúdo correto.

---

## Self-Review (master plan)

- **Cobertura PRD:** todos os RFs P0 mapeados a uma milestone (M1–M8). RNFs cobertos transversalmente: perf (M3 carga + M5 paginação), segurança (M1 RLS + M5 tokens server-side), compliance (M1 termos + M8 export), acessibilidade (M3 design review), observabilidade (adicionar Sentry+PostHog em M2 antes de pagamentos reais).
- **Sem placeholders TBD:** M0 task-a-task tem código completo; M1–M8 outlines são intencionalmente de alto nível e serão expandidos por sessão.
- **Consistência de tipos:** identifiers `appRouter`, `healthRouter`, `health.ping`, `Context`, `TRPCProvider`, `prisma` consistentes entre Tasks 8–10.
- **Gap conhecido:** Sentry/PostHog não estão em M0. Decisão consciente — M0 deve ser executável sem contas externas adicionais. Adicionar em M2 (antes de Stripe ir live).
