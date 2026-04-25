<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

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

`npm run typecheck && npm test && npm run lint && npm run format:check`. Se algum falhar, não commitar.

## M1 — Auth conventions

### Autenticação

- Supabase Auth gerencia `auth.users`. Trigger SQL espelha em `public.users` (via `supabase/migrations/20260425200000_initial_schema.sql`).
- Server-side: `createSupabaseServerClient()` de `@/lib/supabase/server`.
- Browser-side: `createSupabaseBrowserClient()` de `@/lib/supabase/browser`.
- Middleware (`src/middleware.ts`) refresca sessão e protege `/app/*` e `/onboarding`.
- Auth callback em `/auth/callback` exchange o code do magic link por sessão.

### tRPC

- `protectedProcedure` (em `@/server/trpc/trpc`) lança `UNAUTHORIZED` se `ctx.user` for null.
- Use sempre `protectedProcedure` quando a operação tocar dados do usuário.
- `ctx.user` tipo: `{ id: string; email: string }` ou `null` (vide `SessionUser` em `context.ts`).

### RLS

- Toda tabela com user_id deve ter RLS habilitada.
- Policies em `supabase/migrations/*.sql` aplicadas via Supabase Dashboard SQL Editor.
- Padrão: `using (auth.uid() = user_id)` pra SELECT/UPDATE/DELETE.

### DB

- Prisma 7 + `@prisma/adapter-pg` (driver adapter; `directUrl` foi removido).
- Singleton em `src/lib/prisma.ts`.
- Schema canônico: `supabase/migrations/*.sql` (DB-first). `prisma/schema.prisma` é só pra gerar tipos.
- Verificar conexão a qualquer momento: `npm run db:check`.

### Pooler workaround (TODO antes de deploy)

- DATABASE_URL atualmente aponta pra direct connection (porta 5432, host `db.<ref>.supabase.co`) porque o pooler URL rejeitou tenant. Não escala em Vercel (Free tier limita ~60 conn).
- Fix: investigar URL correto do pooler na dashboard atualizada e re-testar antes de deploy de M2.
