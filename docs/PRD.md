# PRD — App Norte

**Versão:** 1.0
**Data:** 2026-04-25
**Owner:** Mateus
**Status:** Aprovado para desenvolvimento

---

## 1. Visão Geral

O **Norte** é uma plataforma SaaS web de gestão financeira pessoal que consolida, em uma única interface, todo o panorama financeiro do usuário: contas bancárias, cartões, investimentos, dívidas e metas. Conecta automaticamente as contas via Open Finance (Pluggy), categoriza transações com IA (Claude), e apresenta um dashboard 360° com saldo consolidado, fluxo de caixa, patrimônio total, alocação de investimentos e progresso de metas.

**One-liner:** "O dashboard único que mostra onde seu dinheiro está, pra onde vai e como chegar nas suas metas."

---

## 2. Problema

Pessoas de 19–40 anos com renda e múltiplas contas/cartões/investimentos se perdem em:

- Quanto ganham (renda fragmentada)
- Onde gastam (cartões + débito + Pix em apps diferentes)
- Quanto têm guardado e onde está aplicado
- Como o gasto evolui no tempo
- Como dimensionar e atingir metas financeiras

Soluções existentes resolvem **partes** do problema:

- **Apps de banco (Nubank, Inter):** mostram só a própria conta
- **Mint/Organizze:** budget-first, fracos em investimentos
- **Kubera:** wealth tracking, mas spreadsheet-like, sem categorização inteligente
- **Wealthfront:** advisory, força gestão pelo próprio app
- **Copilot Money:** belíssimo, mas iOS-only, sem investimentos consolidados, sem suporte a bancos BR

Lacuna: **visibilidade 360° + IA de categorização + projeção de metas + foco BR** numa interface bonita o bastante pra ser usada todo dia.

---

## 3. Persona

**Carlos, 32 anos, gerente de produto em SP**

- Renda: R$ 14k CLT + R$ 3k freelas
- Contas: Itaú (CLT), Nubank (cartão), Inter (PJ freelas), Caixa (FGTS)
- Investimentos: Tesouro Direto na Rico, FIIs no BTG, cripto na Binance
- Dor: abre 6 apps por mês pra ver patrimônio total; não sabe se está poupando o suficiente pra dar entrada num apartamento em 3 anos
- Comportamento: usa iPhone + Mac, paga por Spotify/Netflix/Notion, valoriza design

**Persona secundária — casal:** dashboard compartilhado entre 2 logins (P1, fora do MVP).

---

## 4. Objetivos & Métricas

### 4.1 Objetivos de Produto

- **O1** — Reduzir o tempo gasto pelo usuário pra ter visão financeira completa de >30min/mês para <5min/semana
- **O2** — Aumentar a taxa de conclusão de metas financeiras (vs. self-tracking em planilhas)
- **O3** — Tornar-se referência de design em fintech BR (top 3 em satisfação visual em 12 meses)

### 4.2 KPIs (12 meses pós-launch)

| Métrica | Meta |
|---|---|
| MAU | 5.000 |
| Conversão free → Plus | 8% |
| Churn mensal Plus+Pro | <5% |
| Contas conectadas/usuário ativo | ≥2,5 |
| NPS | ≥50 |
| Retention W4 | ≥40% |

---

## 5. Escopo

### 5.1 MVP (P0)

- Auth (magic link + Google)
- Onboarding progressivo (conecta → categoriza → orça)
- Dashboard 360° (5 módulos: saldo, fluxo, patrimônio, alocação, metas)
- Importação manual (.csv/.xlsx/.ofx)
- Conexão Pluggy (contas, cartões, corretoras BR)
- Categorização automática Claude API + regras aprendidas
- Módulo de Metas SMART (CRUD + cálculo de aporte + barra de progresso)
- Tela de Investimentos (consolidação, rentabilidade vs CDI/IPCA)
- Análise de evolução temporal (12 meses)
- Motor de insights e alertas
- Relatório mensal automático (PDF + email)
- Stripe (Free, Plus R$ 24,90, Pro R$ 49,90; trial 14d)
- Landing page institucional
- Dark mode

### 5.2 P1

- Multi-usuário (compartilhamento com cônjuge/parceiro)
- Simulador de decisões (Pro)
- Integração com contador (Pro)
- Notificações push
- App mobile (React Native)

### 5.3 Out of Scope

- Robo-advisor / gestão ativa
- Transferências/pagamentos no Norte (read-only)
- Crédito/empréstimos
- Mercados internacionais
- Custódia de cripto
- Gamificação, badges, streaks

---

## 6. Requisitos Funcionais

### 6.1 Auth & Onboarding

- **RF-1.1** Magic link via email (Supabase Auth)
- **RF-1.2** OAuth Google
- **RF-1.3** Onboarding: nome → primeira conta (Pluggy ou CSV) → primeira meta opcional → dashboard
- **RF-1.4** Verificação de email obrigatória
- **RF-1.5** Recuperação de conta via magic link

### 6.2 Conexão de Contas

- **RF-2.1** Widget Pluggy embedado pra OAuth bancário
- **RF-2.2** Sync diária automática (cron 03:00 BRT)
- **RF-2.3** Sync manual via botão na tela de contas
- **RF-2.4** Importação CSV/XLSX com mapeamento inteligente de colunas
- **RF-2.5** Importação OFX
- **RF-2.6** Detecção e merge de duplicatas
- **RF-2.7** Free: 1 conta. Plus/Pro: ilimitadas.

### 6.3 Categorização

- **RF-3.1** 13 categorias pré-definidas (moradia, alimentação, transporte, saúde, lazer, educação, serviços, investimentos, transferências, receita fixa, receita variável, impostos, outros)
- **RF-3.2** Subcategorias customizáveis pelo usuário
- **RF-3.3** Categorização automática com Claude Haiku no momento do sync
- **RF-3.4** Re-categorização em batch com Claude Sonnet (mensal)
- **RF-3.5** Quando usuário corrige categoria → sistema cria regra "estabelecimento X → categoria Y" e aplica retroativamente
- **RF-3.6** Confiança da categoria visível (alta/média/baixa)

### 6.4 Dashboard 360°

- **RF-4.1** Card de saldo consolidado (soma + breakdown por banco)
- **RF-4.2** Fluxo de caixa mensal — barras empilhadas últimos 6 meses
- **RF-4.3** Evolução patrimonial — linha mensal últimos 12 meses
- **RF-4.4** Donut de alocação de investimentos (RF, RV, FII, Cripto, Cash)
- **RF-4.5** Cards de metas com barra de progresso e status (no rumo / atrasada / concluída)
- **RF-4.6** Toggle período (mês atual, último mês, 3m, 6m, 12m, ano)

### 6.5 Metas

- **RF-5.1** CRUD de metas SMART (nome, valor-alvo R$, prazo, prioridade, tipo)
- **RF-5.2** Tipos: emergência, viagem, imóvel, veículo, aposentadoria, educação, custom
- **RF-5.3** Cálculo automático do aporte mensal necessário
- **RF-5.4** Vinculação opcional com conta/investimento específico
- **RF-5.5** Alerta quando ritmo cai abaixo do necessário por 2 meses consecutivos
- **RF-5.6** Histórico de aportes por meta

### 6.6 Investimentos

- **RF-6.1** Lista de posições agrupadas por classe e por ativo
- **RF-6.2** Rentabilidade do mês, do ano, acumulada
- **RF-6.3** Comparação vs CDI e IPCA
- **RF-6.4** Histórico de aportes
- **RF-6.5** Alocação real vs alocação-alvo (se definida)

### 6.7 Insights & Alertas

- **RF-7.1** Regra "gasto de categoria > 1.5x média 6m" → alerta
- **RF-7.2** Regra "fatura cartão projetada > 35% renda" → alerta
- **RF-7.3** Regra "meta com aporte atrasado" → alerta
- **RF-7.4** 3 sugestões mensais geradas pela IA com economia estimada
- **RF-7.5** Inbox de alertas no app + digest semanal por email

### 6.8 Relatório Mensal

- **RF-8.1** Gerado automaticamente no dia 1 às 06:00 BRT (Vercel Cron)
- **RF-8.2** Conteúdo: resumo executivo, top 5 categorias, variações vs mês anterior, performance investimentos, status metas, 3 sugestões
- **RF-8.3** PDF baixável + email com sumário (Resend + React Email)

### 6.9 Pagamentos

- **RF-9.1** Stripe Checkout pra Plus e Pro
- **RF-9.2** Trial 14 dias do Plus (sem cartão)
- **RF-9.3** Upgrade/downgrade self-service
- **RF-9.4** Webhook cobrança falha → email + 7 dias até downgrade pra Free
- **RF-9.5** Free: 1 conta, sem IA, sem metas (só tracking)
- **RF-9.6** Plus: contas ilimitadas, IA, metas, relatórios
- **RF-9.7** Pro: tudo do Plus + simulador (P1) + integração contador (P1) + suporte prioritário

---

## 7. Requisitos Não-Funcionais

### 7.1 Performance

- **RNF-1.1** LCP < 2.5s no dashboard (3G fast)
- **RNF-1.2** TTI < 4s
- **RNF-1.3** Sync Pluggy de 12 meses de transações em < 30s

### 7.2 Segurança

- **RNF-2.1** Dados sensíveis criptografados em repouso (Supabase native)
- **RNF-2.2** RLS obrigatória em toda tabela com `user_id`
- **RNF-2.3** Tokens Pluggy só server-side, nunca expostos ao client
- **RNF-2.4** Rate limit 100 req/min por usuário (Upstash)
- **RNF-2.5** 2FA opcional via TOTP

### 7.3 Compliance

- **RNF-3.1** Conformidade LGPD: consentimento explícito, exportação e exclusão em até 15 dias
- **RNF-3.2** Termos de uso e política de privacidade no onboarding
- **RNF-3.3** Audit trail de acesso a dados sensíveis

### 7.4 Acessibilidade

- **RNF-4.1** WCAG 2.1 AA
- **RNF-4.2** Navegação 100% via teclado
- **RNF-4.3** Contraste mínimo 4.5:1
- **RNF-4.4** Dark mode com mesma qualidade

### 7.5 Observabilidade

- **RNF-5.1** Sentry pra erros (front + back)
- **RNF-5.2** PostHog pra analytics de produto
- **RNF-5.3** Logs estruturados via Pino

---

## 8. Stack Técnica

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 15 (App Router, RSC) |
| UI | React 19, Tailwind v4, shadcn/ui 4.5 (Base UI primitives) |
| Charts | Recharts |
| API | tRPC, Zod |
| ORM | Prisma |
| Banco | Supabase Postgres + RLS |
| Auth | Supabase Auth (magic link + Google) |
| Pagamentos | Stripe (Checkout + Webhooks) |
| Open Finance | Pluggy |
| IA | Claude API (Haiku + Sonnet) |
| Email | Resend + React Email |
| Cache | Upstash Redis |
| Cron | Vercel Cron + Supabase pg_cron |
| Testes | Vitest + Playwright |
| Observabilidade | Sentry, PostHog |
| Hosting | Vercel |
| CI/CD | GitHub Actions |

---

## 9. Design Language

- Paleta: verde-floresta institucional (#0F3D2E primário, #1A6E4F secundário, #E8F5EE light)
- Accents: #1E3A5F info, #D4A017 alerta, #16A34A positivo, #DC2626 negativo
- Typography: Inter (UI) + JetBrains Mono (números, `font-variant-numeric: tabular-nums`)
- Border-radius: 12-16px
- Shadow: `shadow-sm` sutil
- Cards brancos, fundo neutro
- Sem gradientes, sem neon, sem mascote, sem gamificação
- Microinterações 150-200ms
- Skeleton loaders (nunca spinners)
- Dark mode obrigatório

Referências (em ordem):

1. **Copilot Money** — design primário, hierarquia visual, regras de categorização
2. **Prift** — tom calmo, sem urgência artificial
3. **Kubera** — módulo de net worth
4. **Wealthfront** — wealth curve, projeção
5. **Monarch Money** — funcionalidades, multi-conta
6. **Altruist** — tipografia bold, data viz

---

## 10. Riscos & Mitigações

| Risco | Prob. | Impacto | Mitigação |
|---|---|---|---|
| Pluggy fora do ar / instável | M | A | Fallback CSV/OFX como caminho oficial |
| Custo Claude API explode | M | M | Cache agressivo + Haiku como default, Sonnet só batch |
| Stripe webhook falha em prod | B | A | Idempotency keys + retry + alertas Sentry |
| Performance ruim com >10k transações | M | M | Paginação obrigatória + índices Postgres |
| Categorização IA erra muito | A | M | Sistema de regras aprendidas + UI fácil de corrigir |
| Compliance LGPD com dados bancários | M | A | Auditoria jurídica antes do launch |

---

## 11. Glossário

- **Open Finance:** padrão regulado pelo BCB de compartilhamento de dados financeiros
- **Pluggy:** agregador BR de Open Finance (camada de dados)
- **RLS:** Row Level Security do Postgres
- **CDI:** Certificado de Depósito Interbancário (benchmark de RF)
- **MAU:** Monthly Active Users
- **NPS:** Net Promoter Score
- **RSC:** React Server Components
