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
