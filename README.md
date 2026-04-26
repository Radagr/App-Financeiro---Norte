# Norte

Plataforma de gestão financeira pessoal — dashboard 360°, Open Finance, IA de categorização, metas inteligentes.

## Stack

Next.js 16 · React 19 · TypeScript · Tailwind v4 · shadcn/ui (Base UI) · tRPC v11 · Prisma 7 · Supabase · Stripe · Pluggy · Claude API.

## Setup

```bash
nvm use            # ou instale Node 20+
npm install
cp .env.example .env.local   # preencher conforme cada milestone
npm run dev
```

## Scripts

| Comando                | Função                     |
| ---------------------- | -------------------------- |
| `npm run dev`          | Dev server                 |
| `npm run build`        | Build de produção          |
| `npm run typecheck`    | Checagem de tipos          |
| `npm test`             | Testes unitários           |
| `npm run test:watch`   | Vitest watch mode          |
| `npm run lint`         | ESLint                     |
| `npm run format`       | Prettier write             |
| `npm run format:check` | Prettier check             |
| `npm run db:generate`  | Prisma generate            |
| `npm run db:check`     | Verificar conexão Supabase |

## Documentação

- `../docs/PRD.md` — Product Requirements
- `../docs/superpowers/plans/` — planos de implementação por milestone
- `../docs/superpowers/plans/2026-04-25-m1-auth-multi-tenant.md` — M1 plan (Auth & Multi-tenant)
- `../docs/superpowers/plans/2026-04-25-m2-landing-stripe.md` — M2 plan (Landing + Visual Identity; V1 = free, Stripe deferred)
- `docs/superpowers/plans/2026-04-25-m3-dashboard-360.md` — M3 plan (Dashboard 360°)
- `AGENTS.md` — convenções para agentes/colaboradores
