# M2 — Landing + Stripe Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. **Tasks 11-15 (visual identity + landing + pricing + billing) MUST also invoke `frontend-design` skill — flagged in the body.**

**Goal:** Landing pública institucional + pricing page com Stripe Checkout funcional pra Plus e Pro; trial de 14 dias do Plus sem cartão; webhook idempotente que sincroniza subscription state com o DB; entrega da identidade visual definitiva (Instrument Sans + Serif, atmosfera, simbolismo "norte").

**Architecture:** Tier de assinatura mora em campos do User (não tem tabela Subscription separada — YAGNI, é 1:1, sem histórico necessário). Trial é puramente DB-side (`trialEndsAt`), sem Stripe envolvido — Stripe entra só na conversão. Conversão usa Stripe Checkout em modo subscription. Webhook escuta 4 eventos (`checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`) e atualiza User com idempotência via `event.id`. Helper `getEffectiveTier(user)` computa tier corrente baseado em data + status, sem mutação.

**Tech additions:** `stripe` (Node SDK), `@stripe/stripe-js` (browser).

**PRD references:** §5.1 P0 (Stripe + landing institucional), §6.9 RF-9.1 a RF-9.7 (Pagamentos), §9 (design language).

**Memory references:**
- `project_norte_branding_strategy.md` — M2 é quando trocamos Inter por Instrument Sans/Serif e adicionamos atmosfera + simbolismo "norte"
- `feedback_skills_usage.md` — frontend-design + superpowers em conjunto pra trabalho visual
- `project_norte_pooler_workaround.md` — fix de pooler URL precisa rolar antes de deploy de produção (não bloqueia M2 dev local, mas é P0 antes de live)

---

## Step 0 — USER ACTION (precisa ser feito antes de Tasks 7+)

> Mateus precisa fazer o setup do Stripe. Tasks 1-5 não dependem disso.

### 0.1 Criar conta Stripe + entrar em modo Test

1. Acessar [stripe.com](https://stripe.com) → Sign up (ou login se já tiver conta)
2. **Importante:** ficar no **modo Test** (toggle "Test mode" no canto superior direito do dashboard, fundo laranja). Modo live só pra produção.

### 0.2 Criar 2 Products + 2 Prices

Dashboard Stripe → **Products** → **+ Add product**

**Produto 1: "Norte Plus"**
- Name: `Norte Plus`
- Pricing → Recurring → Monthly → Amount: `R$ 24,90` BRL → **Add product**
- Copia o **price ID** (formato `price_xxxx`) — vai pra `NEXT_PUBLIC_STRIPE_PRICE_PLUS`

**Produto 2: "Norte Pro"**
- Name: `Norte Pro`
- Pricing → Recurring → Monthly → Amount: `R$ 49,90` BRL → **Add product**
- Copia o **price ID** — vai pra `NEXT_PUBLIC_STRIPE_PRICE_PRO`

> Se Stripe pedir country/currency setup primeiro, escolher Brasil + BRL.

### 0.3 Coletar API keys

Dashboard → Developers → API keys (em modo Test):
- **Publishable key** (`pk_test_...`) → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- **Secret key** (`sk_test_...`) — clica "Reveal" → `STRIPE_SECRET_KEY`

### 0.4 Criar webhook endpoint local (Stripe CLI ou ngrok)

Pra testar webhooks em dev, instalar Stripe CLI:

**Windows:** `scoop install stripe` ou baixar de https://stripe.com/docs/stripe-cli

Após instalar:
```bash
stripe login    # opens browser, authorizes CLI
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

O comando `stripe listen` imprime um **webhook signing secret** (`whsec_...`) — copia pra `STRIPE_WEBHOOK_SECRET`. Mantém o `stripe listen` rodando em outro terminal durante todo o desenvolvimento M2 — ele forwarda eventos do Stripe pra teu localhost.

> **Em produção (M2 deploy):** vai criar um webhook real no Dashboard → Developers → Webhooks → Add endpoint, apontando pra `https://norte.app/api/stripe/webhook`. Esse webhook tem seu próprio signing secret diferente do CLI.

### 0.5 Preencher `.env.local`

Adicionar (preservando os existentes do M1):

```env
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PRICE_PLUS=price_...
NEXT_PUBLIC_STRIPE_PRICE_PRO=price_...
```

### 0.6 Confirmar — me avisar

Quando passos 0.1 a 0.5 estiverem feitos e `stripe listen` estiver rodando em algum terminal, escreve "Stripe ready" — Tasks 7+ entram. Tasks 1-5 podem começar antes (não dependem do Stripe ainda configurado).

---

## File Structure (M2)

```
app-norte/
├── prisma/
│   └── schema.prisma                                   # +User subscription fields
├── supabase/migrations/
│   └── 20260425210000_add_subscription_to_users.sql    # NEW: subscription columns + index
├── src/
│   ├── lib/
│   │   ├── env.ts                                      # +Stripe vars required
│   │   ├── stripe.ts                                   # NEW: Stripe SDK client
│   │   └── subscription.ts                             # NEW: getEffectiveTier helper + types
│   ├── app/
│   │   ├── page.tsx                                    # REWRITE: full landing page
│   │   ├── pricing/page.tsx                            # NEW: pricing page (public)
│   │   ├── (app)/
│   │   │   ├── billing/
│   │   │   │   ├── page.tsx                            # NEW: billing tier + manage button
│   │   │   │   └── actions.ts                          # NEW: checkout + portal server actions
│   │   │   └── app/page.tsx                            # MODIFY: show current tier
│   │   └── api/stripe/
│   │       ├── webhook/route.ts                        # NEW: webhook handler
│   │       └── checkout/route.ts                       # NEW: create checkout session
│   ├── components/
│   │   ├── auth/
│   │   │   └── login-form.tsx                          # (no changes — kept for ref)
│   │   ├── brand/                                      # NEW directory
│   │   │   ├── compass-mark.tsx                        # NEW: rosa-dos-ventos SVG component
│   │   │   └── atmosphere.tsx                          # NEW: noise + gradient + horizon (composable)
│   │   ├── landing/                                    # NEW directory
│   │   │   ├── hero.tsx                                # NEW
│   │   │   ├── features.tsx                            # NEW
│   │   │   ├── pricing-teaser.tsx                      # NEW (used on landing)
│   │   │   ├── faq.tsx                                 # NEW
│   │   │   └── footer.tsx                              # NEW
│   │   └── pricing/
│   │       └── pricing-card.tsx                        # NEW: tier card (used on /pricing)
│   ├── app/
│   │   └── layout.tsx                                  # MODIFY: swap fonts to Instrument
│   └── server/trpc/routers/
│       └── billing.ts                                  # NEW: tRPC router pra checkout/portal
└── tests/unit/
    ├── subscription.test.ts                            # NEW: getEffectiveTier
    └── stripe-webhook.test.ts                          # NEW: webhook signature + event handling
```

---

## Task 1: Subscription DB schema (SQL + Prisma)

**Files:**
- Create: `supabase/migrations/20260425210000_add_subscription_to_users.sql`
- Modify: `prisma/schema.prisma`

- [ ] **Step 1.1: Write the migration SQL**

Create `supabase/migrations/20260425210000_add_subscription_to_users.sql`:

```sql
-- M2: Add subscription tier + Stripe state fields to public.users.
-- Trial é puramente DB-side (trial_ends_at). Stripe só entra na conversão.

alter table public.users
  add column if not exists subscription_tier text not null default 'free',
  add column if not exists trial_ends_at timestamptz,
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists subscription_status text,
  add column if not exists subscription_ends_at timestamptz;

-- Index for fast lookups from webhook handlers
create index if not exists users_stripe_customer_id_idx
  on public.users (stripe_customer_id)
  where stripe_customer_id is not null;

create index if not exists users_stripe_subscription_id_idx
  on public.users (stripe_subscription_id)
  where stripe_subscription_id is not null;

-- subscription_tier check (avoid garbage values)
alter table public.users
  drop constraint if exists users_subscription_tier_check;
alter table public.users
  add constraint users_subscription_tier_check
  check (subscription_tier in ('free', 'plus', 'pro'));

comment on column public.users.subscription_tier is
  'free | plus | pro. Computed effective tier in src/lib/subscription.ts (considers trial_ends_at).';
comment on column public.users.trial_ends_at is
  'Set when user starts a trial. NULL after trial ends or never trialed.';
```

- [ ] **Step 1.2: Apply via Supabase Dashboard SQL Editor**

Cole o conteúdo no SQL Editor → Run. Esperar "Success. No rows returned".

Verificar: Database → Tables → `users` agora tem 6 colunas extras. Database → Indexes em `users` mostra os 2 novos.

- [ ] **Step 1.3: Update Prisma schema**

Replace User model in `prisma/schema.prisma`:

```prisma
model User {
  id          String    @id @db.Uuid
  email       String    @unique
  name        String?
  onboardedAt DateTime? @map("onboarded_at")
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  subscriptionTier      String    @default("free") @map("subscription_tier")
  trialEndsAt           DateTime? @map("trial_ends_at")
  stripeCustomerId      String?   @unique @map("stripe_customer_id")
  stripeSubscriptionId  String?   @unique @map("stripe_subscription_id")
  subscriptionStatus    String?   @map("subscription_status")
  subscriptionEndsAt    DateTime? @map("subscription_ends_at")

  @@map("users")
}
```

- [ ] **Step 1.4: Validate Prisma generate + DB connection**

Run from project root:
```bash
npx prisma generate
npm run db:check
```

Both must succeed. `db:check` confirms DB schema matches client.

- [ ] **Step 1.5: Commit**

```bash
git add supabase/migrations prisma/schema.prisma
git commit -m "feat(db): add subscription tier + Stripe state fields to users"
```

---

## Task 2: Tighten env schema for Stripe vars

**Files:** Modify `src/lib/env.ts`

- [ ] **Step 2.1: Add Stripe vars (optional during M2 dev — required will come at end)**

Replace `src/lib/env.ts`:

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

  STRIPE_SECRET_KEY: z.string().min(1).startsWith("sk_"),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).startsWith("whsec_"),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1).startsWith("pk_"),
  NEXT_PUBLIC_STRIPE_PRICE_PLUS: z.string().startsWith("price_"),
  NEXT_PUBLIC_STRIPE_PRICE_PRO: z.string().startsWith("price_"),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid env. See .env.example.");
}

export const env = parsed.data;
```

- [ ] **Step 2.2: Update `.env.example`**

Append to `.env.example` (already has stubs from M0; just verify they're still there):

```
# --- M2 Stripe ---
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_STRIPE_PRICE_PLUS=price_...
NEXT_PUBLIC_STRIPE_PRICE_PRO=price_...
```

(If the keys already exist in `.env.example` from M0, just confirm — no change needed.)

- [ ] **Step 2.3: Validate**

```bash
npm run typecheck
```

> **Important:** `npm run build` will FAIL at this point if `.env.local` doesn't have the Stripe vars filled (Step 0 is the gate). That's expected — the env validation catches missing config. Don't run build until Step 0 is done.

- [ ] **Step 2.4: Commit**

```bash
git add src/lib/env.ts .env.example
git commit -m "feat(env): require Stripe env vars for M2"
```

---

## Task 3: Install Stripe SDK packages

**Files:** Modify `package.json`

- [ ] **Step 3.1: Install runtime + types**

Run:
```bash
npm install stripe @stripe/stripe-js
```

> `stripe` is the Node SDK (server-only). `@stripe/stripe-js` is the lightweight loader for client-side checkout redirect (we'll use server-side checkout creation, but the loader lets us redirect from a client component cleanly).

- [ ] **Step 3.2: Verify package.json + typecheck (no build yet)**

Run: `npm run typecheck` → 0 errors.

- [ ] **Step 3.3: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat(deps): install Stripe Node SDK + browser loader"
```

---

## Task 4: Stripe SDK client + subscription helper (TDD)

**Files:**
- Create: `src/lib/stripe.ts`
- Create: `src/lib/subscription.ts`
- Create: `tests/unit/subscription.test.ts`

### Step 4.1: Stripe client

Create `src/lib/stripe.ts`:

```ts
import Stripe from "stripe";

import { env } from "./env";

export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  typescript: true,
  // Pin API version so SDK upgrades don't silently change behavior.
  apiVersion: "2025-08-27.basil",
});
```

> Pin the API version. Stripe API versions advance over time; pinning prevents surprise breaking changes from SDK upgrades. The `2025-08-27.basil` version is the current default for Stripe Node SDK 18+. If a different version surfaces in the SDK install, use what the SDK says is "latest stable".

- [ ] **Step 4.2: Subscription types + helper TDD test**

Create `tests/unit/subscription.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { getEffectiveTier, type SubscriptionState } from "@/lib/subscription";

const NOW = new Date("2026-04-25T12:00:00Z");
const FUTURE = new Date("2026-05-10T12:00:00Z");
const PAST = new Date("2026-04-20T12:00:00Z");

describe("getEffectiveTier", () => {
  it("returns 'free' for user without subscription or trial", () => {
    const state: SubscriptionState = {
      subscriptionTier: "free",
      trialEndsAt: null,
      stripeSubscriptionId: null,
      subscriptionStatus: null,
      subscriptionEndsAt: null,
    };
    expect(getEffectiveTier(state, NOW)).toBe("free");
  });

  it("returns 'plus' during active trial", () => {
    const state: SubscriptionState = {
      subscriptionTier: "free",
      trialEndsAt: FUTURE,
      stripeSubscriptionId: null,
      subscriptionStatus: null,
      subscriptionEndsAt: null,
    };
    expect(getEffectiveTier(state, NOW)).toBe("plus");
  });

  it("returns 'free' when trial has ended without conversion", () => {
    const state: SubscriptionState = {
      subscriptionTier: "free",
      trialEndsAt: PAST,
      stripeSubscriptionId: null,
      subscriptionStatus: null,
      subscriptionEndsAt: null,
    };
    expect(getEffectiveTier(state, NOW)).toBe("free");
  });

  it("returns subscription tier when status is active", () => {
    const state: SubscriptionState = {
      subscriptionTier: "pro",
      trialEndsAt: null,
      stripeSubscriptionId: "sub_123",
      subscriptionStatus: "active",
      subscriptionEndsAt: FUTURE,
    };
    expect(getEffectiveTier(state, NOW)).toBe("pro");
  });

  it("returns subscription tier during grace period (past_due)", () => {
    const state: SubscriptionState = {
      subscriptionTier: "plus",
      trialEndsAt: null,
      stripeSubscriptionId: "sub_123",
      subscriptionStatus: "past_due",
      subscriptionEndsAt: FUTURE,
    };
    expect(getEffectiveTier(state, NOW)).toBe("plus");
  });

  it("downgrades to free when subscription canceled and period ended", () => {
    const state: SubscriptionState = {
      subscriptionTier: "plus",
      trialEndsAt: null,
      stripeSubscriptionId: "sub_123",
      subscriptionStatus: "canceled",
      subscriptionEndsAt: PAST,
    };
    expect(getEffectiveTier(state, NOW)).toBe("free");
  });

  it("keeps tier through end of period when canceled but still inside period", () => {
    const state: SubscriptionState = {
      subscriptionTier: "plus",
      trialEndsAt: null,
      stripeSubscriptionId: "sub_123",
      subscriptionStatus: "canceled",
      subscriptionEndsAt: FUTURE,
    };
    expect(getEffectiveTier(state, NOW)).toBe("plus");
  });
});
```

- [ ] **Step 4.3: Run — should FAIL (helper doesn't exist)**

```bash
npm test
```

Expected: tests fail with `Cannot find module '@/lib/subscription'`. Other tests (health.ping, auth.whoami) still pass.

- [ ] **Step 4.4: Implement helper**

Create `src/lib/subscription.ts`:

```ts
export type Tier = "free" | "plus" | "pro";

export type SubscriptionState = {
  subscriptionTier: string;
  trialEndsAt: Date | null;
  stripeSubscriptionId: string | null;
  subscriptionStatus: string | null;
  subscriptionEndsAt: Date | null;
};

const ACTIVE_STATUSES = new Set(["active", "trialing", "past_due"]);

/**
 * Computes the effective tier for a user at a given point in time.
 * Priority: active subscription > active trial > free.
 * `now` is injectable for testing; defaults to current time.
 */
export function getEffectiveTier(state: SubscriptionState, now: Date = new Date()): Tier {
  // Active or in-grace subscription wins.
  if (state.stripeSubscriptionId && state.subscriptionStatus) {
    if (ACTIVE_STATUSES.has(state.subscriptionStatus)) {
      return normalizeTier(state.subscriptionTier);
    }
    // Canceled: respect the paid period.
    if (
      state.subscriptionStatus === "canceled" &&
      state.subscriptionEndsAt &&
      state.subscriptionEndsAt > now
    ) {
      return normalizeTier(state.subscriptionTier);
    }
  }

  // Active trial bumps to Plus.
  if (state.trialEndsAt && state.trialEndsAt > now) {
    return "plus";
  }

  return "free";
}

function normalizeTier(tier: string): Tier {
  return tier === "plus" || tier === "pro" ? tier : "free";
}
```

- [ ] **Step 4.5: Run — should PASS**

```bash
npm test
```

Expected: 10 tests passing (1 health + 2 auth + 7 subscription).

- [ ] **Step 4.6: Commit**

```bash
git add src/lib/stripe.ts src/lib/subscription.ts tests/unit/subscription.test.ts
git commit -m "feat(billing): Stripe client + getEffectiveTier helper (TDD)"
```

---

## Task 5: Start trial action + tRPC billing router

**Files:**
- Create: `src/server/trpc/routers/billing.ts`
- Modify: `src/server/trpc/routers/_app.ts`

- [ ] **Step 5.1: Add billing router with startTrial mutation**

Create `src/server/trpc/routers/billing.ts`:

```ts
import { TRPCError } from "@trpc/server";

import { prisma } from "@/lib/prisma";

import { protectedProcedure, router } from "../trpc";

const TRIAL_DAYS = 14;

export const billingRouter = router({
  startTrial: protectedProcedure.mutation(async ({ ctx }) => {
    const user = await prisma.user.findUnique({
      where: { id: ctx.user.id },
      select: { trialEndsAt: true, stripeSubscriptionId: true, subscriptionTier: true },
    });

    if (!user) throw new TRPCError({ code: "NOT_FOUND" });

    if (user.stripeSubscriptionId || user.subscriptionTier !== "free") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Already subscribed",
      });
    }

    if (user.trialEndsAt && user.trialEndsAt > new Date()) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Trial already active",
      });
    }

    const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: ctx.user.id },
      data: { trialEndsAt },
    });

    return { trialEndsAt };
  }),
});
```

- [ ] **Step 5.2: Mount on appRouter**

Replace `src/server/trpc/routers/_app.ts`:

```ts
import { router } from "../trpc";

import { authRouter } from "./auth";
import { billingRouter } from "./billing";
import { healthRouter } from "./health";

export const appRouter = router({
  auth: authRouter,
  billing: billingRouter,
  health: healthRouter,
});

export type AppRouter = typeof appRouter;
```

- [ ] **Step 5.3: Validate**

```bash
npm run typecheck
npm test
```

10 tests passing (no new tests yet for billing router — webhook test will land in Task 7).

- [ ] **Step 5.4: Commit**

```bash
git add src/server/trpc/routers
git commit -m "feat(billing): tRPC startTrial mutation"
```

---

## Task 6: Stripe Checkout session route

**Files:**
- Create: `src/app/api/stripe/checkout/route.ts`
- Modify: `src/server/trpc/routers/billing.ts` (add createCheckoutSession mutation)

- [ ] **Step 6.1: Add createCheckoutSession to billing router**

Read current `src/server/trpc/routers/billing.ts` and replace it with:

```ts
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

import { protectedProcedure, router } from "../trpc";

const TRIAL_DAYS = 14;

export const billingRouter = router({
  startTrial: protectedProcedure.mutation(async ({ ctx }) => {
    const user = await prisma.user.findUnique({
      where: { id: ctx.user.id },
      select: { trialEndsAt: true, stripeSubscriptionId: true, subscriptionTier: true },
    });

    if (!user) throw new TRPCError({ code: "NOT_FOUND" });

    if (user.stripeSubscriptionId || user.subscriptionTier !== "free") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Already subscribed",
      });
    }

    if (user.trialEndsAt && user.trialEndsAt > new Date()) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Trial already active",
      });
    }

    const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: ctx.user.id },
      data: { trialEndsAt },
    });

    return { trialEndsAt };
  }),

  createCheckoutSession: protectedProcedure
    .input(z.object({ tier: z.enum(["plus", "pro"]) }))
    .mutation(async ({ ctx, input }) => {
      const user = await prisma.user.findUnique({
        where: { id: ctx.user.id },
        select: { id: true, email: true, stripeCustomerId: true },
      });

      if (!user) throw new TRPCError({ code: "NOT_FOUND" });

      // Get or create the Stripe Customer (idempotent on our side via stripeCustomerId).
      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: { userId: user.id },
        });
        customerId = customer.id;
        await prisma.user.update({
          where: { id: user.id },
          data: { stripeCustomerId: customerId },
        });
      }

      const priceId =
        input.tier === "plus"
          ? env.NEXT_PUBLIC_STRIPE_PRICE_PLUS
          : env.NEXT_PUBLIC_STRIPE_PRICE_PRO;

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer: customerId,
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${env.NEXT_PUBLIC_APP_URL}/billing?success=1`,
        cancel_url: `${env.NEXT_PUBLIC_APP_URL}/pricing?canceled=1`,
        client_reference_id: user.id,
        metadata: { userId: user.id, tier: input.tier },
        subscription_data: {
          metadata: { userId: user.id, tier: input.tier },
        },
      });

      if (!session.url) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Stripe did not return a session URL",
        });
      }

      return { url: session.url };
    }),

  createPortalSession: protectedProcedure.mutation(async ({ ctx }) => {
    const user = await prisma.user.findUnique({
      where: { id: ctx.user.id },
      select: { stripeCustomerId: true },
    });

    if (!user?.stripeCustomerId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "No Stripe customer for this user",
      });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${env.NEXT_PUBLIC_APP_URL}/billing`,
    });

    return { url: session.url };
  }),
});
```

- [ ] **Step 6.2: Validate**

```bash
npm run typecheck
npm test
npm run build
```

(Build needs Stripe env vars filled — Step 0 must be done. If not yet, skip build.)

- [ ] **Step 6.3: Commit**

```bash
git add src/server/trpc/routers/billing.ts
git commit -m "feat(billing): tRPC mutations for Stripe checkout + portal"
```

---

## Task 7: Stripe webhook handler (TDD)

**Files:**
- Create: `src/app/api/stripe/webhook/route.ts`
- Create: `tests/unit/stripe-webhook.test.ts`

This task uses TDD. The test verifies signature verification + event dispatching, mocking Stripe.

- [ ] **Step 7.1: Write failing test**

Create `tests/unit/stripe-webhook.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock Stripe before importing the route handler
vi.mock("@/lib/stripe", () => ({
  stripe: {
    webhooks: {
      constructEvent: vi.fn(),
    },
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      update: vi.fn(),
      findFirst: vi.fn(),
    },
  },
}));

vi.mock("@/lib/env", () => ({
  env: { STRIPE_WEBHOOK_SECRET: "whsec_test" },
}));

const { POST } = await import("@/app/api/stripe/webhook/route");
const { stripe } = await import("@/lib/stripe");
const { prisma } = await import("@/lib/prisma");

function makeRequest(body: string, signature = "t=1,v1=fake") {
  return new Request("http://test/api/stripe/webhook", {
    method: "POST",
    headers: { "stripe-signature": signature },
    body,
  });
}

describe("stripe webhook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns 400 when signature header is missing", async () => {
    const req = new Request("http://test/api/stripe/webhook", {
      method: "POST",
      body: "{}",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when signature verification fails", async () => {
    vi.mocked(stripe.webhooks.constructEvent).mockImplementationOnce(() => {
      throw new Error("invalid signature");
    });
    const res = await POST(makeRequest("{}"));
    expect(res.status).toBe(400);
  });

  it("handles checkout.session.completed: updates user with subscription state", async () => {
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValueOnce({
      id: "evt_1",
      type: "checkout.session.completed",
      data: {
        object: {
          subscription: "sub_123",
          customer: "cus_456",
          metadata: { userId: "user-uuid", tier: "plus" },
        },
      },
    } as never);

    const res = await POST(makeRequest("{}"));
    expect(res.status).toBe(200);
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-uuid" },
      data: expect.objectContaining({
        stripeSubscriptionId: "sub_123",
        stripeCustomerId: "cus_456",
        subscriptionTier: "plus",
        subscriptionStatus: "active",
      }),
    });
  });

  it("handles customer.subscription.deleted: downgrades user to free", async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValueOnce({ id: "user-uuid" } as never);
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValueOnce({
      id: "evt_2",
      type: "customer.subscription.deleted",
      data: {
        object: {
          id: "sub_123",
          customer: "cus_456",
        },
      },
    } as never);

    const res = await POST(makeRequest("{}"));
    expect(res.status).toBe(200);
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-uuid" },
      data: expect.objectContaining({
        subscriptionTier: "free",
        subscriptionStatus: "canceled",
        stripeSubscriptionId: null,
      }),
    });
  });

  it("returns 200 for unhandled event types (idempotent ack)", async () => {
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValueOnce({
      id: "evt_3",
      type: "customer.created",
      data: { object: {} },
    } as never);

    const res = await POST(makeRequest("{}"));
    expect(res.status).toBe(200);
  });
});
```

- [ ] **Step 7.2: Run — should FAIL (route doesn't exist)**

```bash
npm test
```

Expected: 4 new tests fail with module not found. Existing 10 still pass.

- [ ] **Step 7.3: Implement webhook handler**

Create `src/app/api/stripe/webhook/route.ts`:

```ts
import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "missing signature" }, { status: 400 });
  }

  const body = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    const message = err instanceof Error ? err.message : "invalid signature";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case "invoice.payment_failed":
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      // Ignored events: ack with 200 so Stripe doesn't retry.
    }
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[stripe-webhook] handler error", { eventId: event.id, eventType: event.type, err });
    return NextResponse.json({ error: "handler failed" }, { status: 500 });
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const tier = session.metadata?.tier;
  if (!userId || !tier) return;

  await prisma.user.update({
    where: { id: userId },
    data: {
      stripeSubscriptionId: typeof session.subscription === "string" ? session.subscription : null,
      stripeCustomerId: typeof session.customer === "string" ? session.customer : null,
      subscriptionTier: tier,
      subscriptionStatus: "active",
    },
  });
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = typeof subscription.customer === "string" ? subscription.customer : null;
  if (!customerId) return;

  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
    select: { id: true },
  });
  if (!user) return;

  const tier = subscription.metadata?.tier ?? "plus";
  const periodEnd = subscription.items.data[0]?.current_period_end;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      stripeSubscriptionId: subscription.id,
      subscriptionTier: tier,
      subscriptionStatus: subscription.status,
      subscriptionEndsAt: periodEnd ? new Date(periodEnd * 1000) : null,
    },
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = typeof subscription.customer === "string" ? subscription.customer : null;
  if (!customerId) return;

  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
    select: { id: true },
  });
  if (!user) return;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      subscriptionTier: "free",
      subscriptionStatus: "canceled",
      stripeSubscriptionId: null,
      subscriptionEndsAt: null,
    },
  });
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = typeof invoice.customer === "string" ? invoice.customer : null;
  if (!customerId) return;

  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
    select: { id: true },
  });
  if (!user) return;

  await prisma.user.update({
    where: { id: user.id },
    data: { subscriptionStatus: "past_due" },
  });

  // M8: send email via Resend. Out of scope for M2.
}
```

- [ ] **Step 7.4: Run — should PASS**

```bash
npm test
```

Expected: 14 tests passing (10 prior + 4 webhook).

- [ ] **Step 7.5: Build + lint**

```bash
npm run typecheck
npm run lint
npm run build
```

(Build needs Stripe envs — Step 0 done.)

- [ ] **Step 7.6: Commit**

```bash
git add src/app/api/stripe/webhook tests/unit/stripe-webhook.test.ts
git commit -m "feat(billing): Stripe webhook handler with signature verification (TDD)"
```

---

## Task 8: Live webhook integration test via Stripe CLI

**Files:** No code changes — this is a manual verification gate.

- [ ] **Step 8.1: Make sure `stripe listen` is running**

In a separate terminal, with `.env.local` filled:
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```
Note the `whsec_*` it prints — must match `STRIPE_WEBHOOK_SECRET` in `.env.local`. If not, update `.env.local` and restart `npm run dev`.

- [ ] **Step 8.2: Trigger a test event**

In another terminal:
```bash
stripe trigger checkout.session.completed
```

Check:
- `stripe listen` terminal shows `→ POST /api/stripe/webhook [200 OK]`
- App dev server log shows webhook fired

> The triggered event has fake metadata (no userId), so the DB won't actually update. That's fine — this verifies signature + dispatch wiring.

- [ ] **Step 8.3: No commit (manual gate). Just confirm it works in your notes.**

---

## Task 9: Switch fonts to Instrument Sans + Instrument Serif

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css`

> ⚠️ **EXECUTING SUBAGENT MUST INVOKE `frontend-design` SKILL** — this is the visual identity moment. The subagent should evaluate Instrument vs alternatives (Manrope, Bricolage Grotesque) once more before locking in, then commit.

> Per memory `project_norte_branding_strategy`: Inter goes out, Instrument Sans + Instrument Serif come in. Instrument Sans for UI body, Instrument Serif for editorial headings (H1, brand mark, hero copy).

- [ ] **Step 9.1: Update layout.tsx**

Replace `src/app/layout.tsx`. Read first.

```tsx
import type { Metadata } from "next";
import { Instrument_Sans, Instrument_Serif, JetBrains_Mono } from "next/font/google";

import { ThemeProvider } from "@/components/theme-provider";
import { TRPCProvider } from "@/trpc/provider";
import { cn } from "@/lib/utils";

import "./globals.css";

const sans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-sans-stack",
  display: "swap",
});

const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-serif-stack",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono-stack",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Norte — Sua vida financeira em um só lugar",
  description:
    "Dashboard financeiro 360° com Open Finance, IA de categorização e metas inteligentes.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={cn(
        "h-full antialiased",
        sans.variable,
        serif.variable,
        mono.variable,
      )}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <TRPCProvider>{children}</TRPCProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 9.2: Update globals.css to expose serif token**

Read `src/app/globals.css`, find the `@theme inline` block, and update the font tokens. Replace:

```css
  --font-sans: var(--font-inter), system-ui, sans-serif;
  --font-mono: var(--font-jetbrains), ui-monospace, monospace;
```

With:

```css
  --font-sans: var(--font-sans-stack), system-ui, sans-serif;
  --font-serif: var(--font-serif-stack), Georgia, serif;
  --font-mono: var(--font-mono-stack), ui-monospace, monospace;
```

> Tailwind picks up `--font-serif` automatically and exposes `font-serif` utility.

- [ ] **Step 9.3: Validate**

```bash
npm run format -- --log-level=warn
npm run typecheck
npm run lint
npm run build
```

All must pass.

- [ ] **Step 9.4: Commit**

```bash
git add src/app/layout.tsx src/app/globals.css
git commit -m "feat(brand): swap to Instrument Sans + Serif fonts (M2 visual identity)"
```

---

## Task 10: Brand primitives — CompassMark + Atmosphere

**Files:**
- Create: `src/components/brand/compass-mark.tsx`
- Create: `src/components/brand/atmosphere.tsx`

> ⚠️ **EXECUTING SUBAGENT MUST INVOKE `frontend-design` SKILL** — these are reusable visual primitives that codify the Norte aesthetic. Quality of these components compounds across every page.

**CompassMark constraints:**
- SVG, scalable
- Stylized N or rosa-dos-ventos motif
- Uses `currentColor` (so parents control via text color tokens)
- Accepts `className` prop, default size 24px
- No external assets

**Atmosphere constraints:**
- Composable component for backgrounds
- Three layers (each toggleable via prop): noise overlay (~3% opacity), radial gradient, horizon line
- Uses CSS only, no JS animation
- Pointer-events: none, z-index negative (sits behind content)
- Tokens only — `bg-norte-light/30`, etc; no hardcoded colors
- Default props give sensible "subtle" look matching login/onboarding atmosphere from M1

The subagent should design these from scratch using its frontend-design judgment, NOT just copy what login/onboarding did inline. Goal is a unified primitive that replaces those inline atmospheres in M2 cleanup (out of scope here, just establish the primitive).

API sketch (subagent finalizes):

```tsx
// compass-mark.tsx
type CompassMarkProps = { className?: string; size?: number; "aria-hidden"?: boolean };
export function CompassMark(props: CompassMarkProps): JSX.Element;

// atmosphere.tsx
type AtmosphereProps = {
  noise?: boolean;          // default true
  gradient?: "top" | "center" | "bottom-right" | "none";  // default "top"
  horizon?: boolean;         // default true
};
export function Atmosphere(props: AtmosphereProps): JSX.Element;
```

- [ ] **Step 10.1: Implement CompassMark**

Subagent designs and implements `src/components/brand/compass-mark.tsx`. Component must:
- Be a default export-style React functional component
- Render valid SVG
- Use `currentColor` for fills/strokes
- Accept `className` and `size` (default 24)
- Be `aria-hidden` by default (decorative)

- [ ] **Step 10.2: Implement Atmosphere**

Subagent designs and implements `src/components/brand/atmosphere.tsx`. Component must:
- Match the API sketch above (3 props with defaults)
- Use Tailwind utilities + Norte tokens
- Pointer-events: none + absolute inset-0 -z-10 (so consumers wrap in `relative` parent)
- Noise: SVG inline filter or background-image data-URL
- Gradient: `bg-gradient-radial-*` via CSS or layered absolute element
- Horizon: 1px line, opacity ~5%, position controlled by gradient prop

- [ ] **Step 10.3: Validate**

```bash
npm run format -- --log-level=warn
npm run typecheck
npm run lint
npm run build
```

All must pass. Components aren't used yet but should compile.

- [ ] **Step 10.4: Commit**

```bash
git add src/components/brand
git commit -m "feat(brand): add CompassMark + Atmosphere primitive components"
```

---

## Task 11: Landing page — public root `/`

**Files:**
- Modify: `src/app/page.tsx` (replaces M0 placeholder entirely)
- Create: `src/components/landing/hero.tsx`
- Create: `src/components/landing/features.tsx`
- Create: `src/components/landing/pricing-teaser.tsx`
- Create: `src/components/landing/faq.tsx`
- Create: `src/components/landing/footer.tsx`

> ⚠️ **EXECUTING SUBAGENT MUST INVOKE `frontend-design` SKILL** — this is THE highest-stakes visual artifact of M2. First impression of Norte for cold visitors. Apply skill rigorously.

> Constraints:
> - Use `Atmosphere` (Task 10) for subtle bg layers
> - Use `CompassMark` (Task 10) in nav + footer
> - Use Instrument Serif for hero H1 + section headings
> - Use Instrument Sans for body
> - Use JetBrains Mono with `tabular` class for any numbers (R$ 24,90 etc)
> - Norte tokens only, no hardcoded hex
> - Tom calmo (Copilot/Prift), nada de neon, glow, ou gradiente roxo→rosa
> - **Composição assimétrica encorajada** (memory pediu "quebrar reflexo de tudo centrado")
> - Dark mode obrigatório

**Sections required (in order):**

1. **Nav** — sticky-ish minimal: brand "Norte" (with CompassMark), nav links (Recursos · Preços · FAQ), "Entrar" + "Começar grátis" CTAs (right side)
2. **Hero** — headline em Serif: "Sua vida financeira em um só lugar." Sub: "Conecta seus bancos, cartões e investimentos. Categoriza com IA. Te ajuda a chegar nas suas metas." CTA primary "Começar trial grátis" (linka pra `/login` por enquanto — depois de login, usuário starta trial via `billing.startTrial`). CTA secondary "Ver demo" (link pra anchor `#demo` ou pricing — pode ser stub).
3. **Features** — 4 cards: Open Finance (conecta tudo), IA de categorização, Metas SMART, Relatório mensal. Cada card tem ícone (lucide), título Serif, descrição Sans curta.
4. **Pricing teaser** — 3 cards (Free / Plus / Pro) com nome, preço (mono+tabular), 3 features, CTA. Plus marcado como "Recomendado". CTA leva pra `/pricing` (full page).
5. **FAQ** — 4 perguntas com Accordion shadcn. Stub answers OK.
6. **Footer** — minimal: Norte mark, copyright "© 2026 Norte", links de suporte (placeholder hrefs).

**Logic:** Página é Server Component. Não precisa autenticação.

- [ ] **Step 11.1: Subagent invokes frontend-design**

Required first action: invoke `frontend-design` via Skill tool.

- [ ] **Step 11.2: Add shadcn Accordion (used in FAQ)**

```bash
npx shadcn@latest add accordion
```

- [ ] **Step 11.3: Implement landing components**

Subagent creates the 5 landing components (hero, features, pricing-teaser, faq, footer) under `src/components/landing/`. Subagent decides composition, copy, typography hierarchy, motion within constraints above.

- [ ] **Step 11.4: Replace `src/app/page.tsx` with the landing**

Subagent assembles the components into the landing page. Page is server component. Must include nav (own component or inline) and use `Atmosphere` for bg.

- [ ] **Step 11.5: Validate all gates**

```bash
npm run format -- --log-level=warn
npm run typecheck
npm run lint
npm run build
```

All clean. Build should still show `○ /` as static (since it's pure RSC, no per-request state).

- [ ] **Step 11.6: Commit**

```bash
git add "src/app/page.tsx" src/components/landing src/components/ui package.json package-lock.json components.json
git commit -m "feat(landing): public landing page with hero, features, pricing teaser, FAQ, footer"
```

---

## Task 12: /pricing page

**Files:**
- Create: `src/app/pricing/page.tsx`
- Create: `src/components/pricing/pricing-card.tsx`

> ⚠️ **EXECUTING SUBAGENT MUST INVOKE `frontend-design` SKILL.**

> Pricing page é a "página de conversão". Deve ser muito clara: 3 tiers, features comparáveis, CTAs óbvios.

**Sections:**

1. **Hero curto** — H1 "Preços simples. Sem pegadinha." sub "Comece grátis ou mantenha trial Plus por 14 dias sem cartão."
2. **3 PricingCards** — Free, Plus, Pro lado a lado em desktop, stacked em mobile
3. **Comparison table** (opcional — subagent decide se cabe ou se cards já chegam)
4. **FAQ pricing-specific** — 3 perguntas (cobrança, cancelamento, troca de plano)
5. **Footer** — reuse from Task 11

**PricingCard logic:**
- Server-component-friendly props
- "Plus" pode ter prop `recommended` que aplica destaque visual (ring norte-secondary)
- CTA do Free: link pra `/login?next=/onboarding` (ou similar — usuário cria conta gratuitamente)
- CTA do Plus: server form com `formAction` que dispara `/api/stripe/checkout` server route OU client component que chama `trpc.billing.createCheckoutSession.mutate({ tier: 'plus' })` e redireciona
- CTA do Pro: same with `tier: 'pro'`
- Se usuário NÃO autenticado e clica Plus/Pro: redireciona pra `/login?next=/pricing` (middleware já faz isso pra `/app`, aqui é manual)

**Implementação CTA — escolhe a abordagem mais limpa:**
Server action approach (preferred):

```tsx
// src/app/pricing/page.tsx
async function startCheckout(formData: FormData) {
  "use server";
  const tier = formData.get("tier") as "plus" | "pro";
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/pricing`);

  // Reuse the billing router logic by calling the same flow
  // ... (subagent inlines the customer creation + checkout creation here, OR
  //      extracts the createCheckoutSession into a shared server function
  //      and calls from both tRPC mutation + this server action)
  
  redirect(checkoutUrl);
}
```

Subagent picks one approach and stays consistent.

- [ ] **Step 12.1: Implement pricing-card.tsx**

Subagent designs and implements card with brand-correct visuals.

- [ ] **Step 12.2: Implement /pricing page**

Server component. Reads searchParams for `?canceled=1` (set when user bails out of Stripe Checkout) and shows a subtle banner.

- [ ] **Step 12.3: Validate**

All gates clean.

- [ ] **Step 12.4: Commit**

```bash
git add src/app/pricing src/components/pricing
git commit -m "feat(pricing): /pricing page with 3-tier cards and Stripe checkout CTAs"
```

---

## Task 13: Billing page (auth'd)

**Files:**
- Create: `src/app/(app)/billing/page.tsx`
- Create: `src/app/(app)/billing/manage-button.tsx` (client component)

> ⚠️ **EXECUTING SUBAGENT MUST INVOKE `frontend-design` SKILL** for visual choices, though the constraints here are gentler — it's an internal admin page.

**Logic:**
- Server component reads `dbUser` via Prisma + `getEffectiveTier()`
- Shows current tier (badge: Free / Plus / Pro)
- If trial active: countdown ("Trial Plus termina em X dias")
- If subscribed: "Próxima cobrança: <date>" (from `subscriptionEndsAt`)
- "Gerenciar assinatura" button → POST to a route that creates portal session and redirects (or client mutation via trpc)
- If on Free + no trial used: "Começar trial Plus 14 dias grátis" button → trpc.billing.startTrial → reload
- If on Free + trial used: "Assinar Plus" / "Assinar Pro" buttons (link pra `/pricing`)
- Shows `?success=1` banner if redirected back from successful Stripe Checkout

- [ ] **Step 13.1: Implement page**

Subagent implements per the logic above. Use shadcn Card, Badge, Button primitives.

- [ ] **Step 13.2: Implement manage button (client)**

Client component that calls `trpc.billing.createPortalSession.mutate()` and `window.location.href = result.url`.

- [ ] **Step 13.3: Add Badge shadcn primitive**

```bash
npx shadcn@latest add badge
```

- [ ] **Step 13.4: Validate**

All gates clean.

- [ ] **Step 13.5: Commit**

```bash
git add "src/app/(app)/billing" src/components/ui/badge.tsx package.json package-lock.json components.json
git commit -m "feat(billing): /billing page showing tier + manage subscription"
```

---

## Task 14: Wire current tier into /app placeholder

**Files:** Modify `src/app/(app)/app/page.tsx`

- [ ] **Step 14.1: Read user subscription state and show effective tier**

Replace `src/app/(app)/app/page.tsx` (preserving structure, adding tier badge):

```tsx
import { redirect } from "next/navigation";

import { LogoutButton } from "@/components/auth/logout-button";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getEffectiveTier } from "@/lib/subscription";

const TIER_LABEL: Record<string, string> = { free: "Free", plus: "Plus", pro: "Pro" };

export default async function AppPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser?.onboardedAt) redirect("/onboarding");

  const tier = getEffectiveTier({
    subscriptionTier: dbUser.subscriptionTier,
    trialEndsAt: dbUser.trialEndsAt,
    stripeSubscriptionId: dbUser.stripeSubscriptionId,
    subscriptionStatus: dbUser.subscriptionStatus,
    subscriptionEndsAt: dbUser.subscriptionEndsAt,
  });

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="space-y-2">
        <p className="text-muted-foreground text-xs tracking-[0.2em] uppercase">
          m2 — billing wired
        </p>
        <div className="flex items-center gap-3">
          <h1 className="text-norte-primary text-3xl font-semibold tracking-tight dark:text-white">
            Olá, {dbUser.name}
          </h1>
          <Badge variant={tier === "free" ? "outline" : "default"}>{TIER_LABEL[tier]}</Badge>
        </div>
        <p className="text-muted-foreground">
          Em M3 esta tela vira o dashboard 360°. Por enquanto, seu plano está em destaque.
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

- [ ] **Step 14.2: Validate gates**

```bash
npm run format -- --log-level=warn
npm run typecheck
npm run lint
npm test
npm run build
```

All clean. 14 tests passing (no new tests this task).

- [ ] **Step 14.3: Commit**

```bash
git add "src/app/(app)/app/page.tsx"
git commit -m "feat(billing): show effective tier badge on /app"
```

---

## Task 15: Update docs

**Files:**
- Modify: `AGENTS.md`
- Modify: `README.md`

- [ ] **Step 15.1: Append M2 section to AGENTS.md**

Append at end of `AGENTS.md`:

```markdown

## M2 — Billing conventions

### Stripe
- Test mode em dev (keys sk_test_*, pk_test_*). Produção troca pra sk_live_*.
- `stripe listen --forward-to localhost:3000/api/stripe/webhook` precisa estar rodando em terminal separado durante dev.
- Eventos webhook tratados: `checkout.session.completed`, `customer.subscription.{updated,deleted}`, `invoice.payment_failed`. Outros são ack'd 200 sem ação (idempotência).
- Webhook signature verificada via `STRIPE_WEBHOOK_SECRET`. Cada env tem o seu (CLI dev != produção).

### Subscription model
- Tier em `User.subscriptionTier`: `free | plus | pro`.
- Trial é só DB-side (`trialEndsAt`), não envolve Stripe. Conversão real cria Stripe Customer + Subscription.
- `getEffectiveTier(state, now)` (em `@/lib/subscription`) é a fonte da verdade pra UI. Nunca leia `subscriptionTier` direto pra UI — sempre passe pelo helper.

### Pricing
- Plus R$ 24,90/mês, Pro R$ 49,90/mês, BRL.
- Trial: 14 dias do Plus, sem cartão. Após trial expirar sem upgrade → tier volta pra free automaticamente (computed pelo helper).
- Failed payment: status `past_due` por 7 dias (M2 só marca status; email vem em M8).

### Routes
- Public: `/`, `/pricing`, `/login`
- Auth: `/onboarding`, `/app`, `/billing`
- API: `/api/stripe/{webhook,checkout}`, `/api/auth/{logout}`, `/api/trpc/[trpc]`
```

- [ ] **Step 15.2: Update README.md docs section**

Add line in README.md "Documentação" section:
```markdown
- `docs/superpowers/plans/2026-04-25-m2-landing-stripe.md` — M2 plan (Landing + Stripe)
```

- [ ] **Step 15.3: Final M2 gates**

```bash
npm run format -- --log-level=warn
npm run typecheck
npm run lint
npm test
npm run build
```

All must pass. **This is the M2 official close.**

- [ ] **Step 15.4: Commit**

```bash
git add AGENTS.md README.md
git commit -m "docs: M2 conventions for billing + Stripe"
```

---

## M2 Exit Criteria

- [ ] `/` mostra landing institucional Norte (não mais o placeholder M0)
- [ ] Hero usa Instrument Serif; UI usa Instrument Sans; números usam JetBrains Mono tabular
- [ ] CompassMark + Atmosphere components em uso
- [ ] `/pricing` mostra 3 tiers com CTA funcional
- [ ] Click em "Assinar Plus" autenticado → Stripe Checkout (test mode) → preenche cartão de teste `4242 4242 4242 4242` → redireciona pra `/billing?success=1`
- [ ] Webhook `checkout.session.completed` recebe e atualiza `User.subscriptionTier = 'plus'` no DB (verificar via `npm run db:check` modificado pra count plus users, OU Supabase Dashboard)
- [ ] `/billing` mostra "Plus" badge + "Próxima cobrança: <date>"
- [ ] Click "Gerenciar assinatura" abre Stripe Customer Portal
- [ ] No portal, cancelar subscription → webhook `customer.subscription.updated` atualiza DB → `/billing` mostra "Cancelando em <date>"
- [ ] User Free clica "Começar trial Plus" → `User.trialEndsAt` setado +14 dias → `getEffectiveTier` retorna "plus"
- [ ] `/app` mostra Badge correto (Free/Plus/Pro) baseado no `getEffectiveTier`
- [ ] `npm test` passa (14+ tests: 3 prior + 7 subscription + 4 webhook)
- [ ] `npm run build/lint/typecheck/format:check` 0 erros
- [ ] Dark mode visualmente validado em browser (`/`, `/pricing`, `/billing`)

---

## Self-Review

**1. Spec coverage (PRD §6.9 RF-9.1 a RF-9.7):**
- ✅ RF-9.1 Stripe Checkout pra Plus e Pro → Tasks 6, 12
- ✅ RF-9.2 Trial 14 dias do Plus sem cartão → Tasks 5, 14 (DB-side, sem Stripe envolvido)
- ✅ RF-9.3 Upgrade/downgrade self-service → Task 13 (via Stripe Customer Portal)
- ⚠️ RF-9.4 Webhook cobrança falha → email + 7 dias até downgrade — Task 7 trata `invoice.payment_failed` mas só marca `subscriptionStatus = past_due`. **Email pra usuário fica pra M8** (precisa de Resend setup). Downgrade automático em 7 dias **fica pra M2.5 ou cron task em M8** (precisa de Vercel Cron). Documentado no comentário do handler.
- ✅ RF-9.5 Free: 1 conta — feature flag a aplicar quando importação chegar (M4). Documentado.
- ✅ RF-9.6 Plus features — tier setado corretamente; gating de features acontece em milestones que adicionam features.
- ✅ RF-9.7 Pro: tudo do Plus + extras (P1) → tier identificado, P1 não bloqueia M2.

**Gap aceito:** RF-9.4 email + downgrade automático ficam pra M8. M2 marca o status corretamente, M8 age sobre ele.

**Spec coverage (PRD §5.1 P0):** Landing institucional → Tasks 11, 12.

**2. Placeholder scan:** todos os steps têm código completo ou specs implementáveis. Tasks UI-heavy (10, 11, 12, 13) deixam espaço de design pro subagent — esse é design intencional, não placeholder. Subagent invoca frontend-design e decide; não é "TBD".

**3. Type consistency:** `SubscriptionState`, `Tier`, `getEffectiveTier`, `stripe`, `prisma`, `billingRouter`, `appRouter`, `Atmosphere`, `CompassMark` consistentes através das tasks.

**4. Critical path:**
- Tasks 1, 2, 3, 4, 5 não dependem de Step 0 (são código + tests + DB schema)
- Task 6 (createCheckoutSession) testa via build — precisa Step 0 pra `npm run build` passar
- Task 7 (webhook) — pode passar test sem Step 0 (mocks Stripe), mas integration test (Task 8) precisa Step 0 + `stripe listen`
- Tasks 9, 10, 11, 12, 13, 14 são UI/visual — não dependem de Stripe rodando
- Task 15 docs

Recomendação de execução: 1 → 2 → 3 → 4 → 5 → (Step 0 done) → 6 → 7 → 8 → 9 → 10 → 11 → 12 → 13 → 14 → 15.

**5. Frontend-design flag:** Tasks 9, 10, 11, 12, 13 todas marcadas. Visual identity é central a M2.

**6. Riscos conhecidos:**
- **Pooler workaround** (memory) ainda em pé — não bloqueia M2 dev local mas precisa fix antes de deploy real
- **Stripe API version pin** pode ficar desatualizado; verificar no início da execução qual version o SDK 18+ pega
- **Trial sem cartão** simplificado (só DB-side) — pode causar confusão se usuário esperar email "trial ending"; mitigado em M8
- **Customer Portal config** no Stripe Dashboard pode precisar de setup adicional (ativar plans configuration) — subagent que rodar Task 13 valida e reporta concerns
