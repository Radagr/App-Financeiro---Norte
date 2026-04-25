-- =====================================================================
-- Norte — Initial schema (M1)
-- =====================================================================
--
-- Aplicar via: Supabase Dashboard → SQL Editor → New query →
--              Cole este arquivo inteiro → Run
--
-- O que este script faz:
--   1. Cria tabela public.users (mirror de auth.users com campos de domínio)
--   2. Habilita Row Level Security (RLS) em public.users
--   3. Cria policies: usuário só lê/atualiza a própria row
--   4. Cria trigger que popula public.users automaticamente quando
--      auth.users recebe um novo signup (magic link, OAuth, etc)
--
-- Idempotente: pode rodar múltiplas vezes sem efeito colateral
-- (usa CREATE IF NOT EXISTS e DROP IF EXISTS antes de recriar).
-- =====================================================================


-- =====================================================================
-- 1. Tabela public.users
-- =====================================================================
-- Mirror de auth.users. O id é o mesmo UUID que Supabase Auth gera.
-- ON DELETE CASCADE: quando o usuário deleta a conta no auth, a row
-- aqui também é removida (LGPD compliance, direito ao esquecimento).
create table if not exists public.users (
  id           uuid        primary key references auth.users (id) on delete cascade,
  email        text        unique not null,
  name         text,
  onboarded_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table public.users is
  'Mirror de auth.users com campos de domínio do Norte. Row criada via trigger handle_new_user em INSERT em auth.users.';


-- =====================================================================
-- 2. Row Level Security
-- =====================================================================
alter table public.users enable row level security;

-- SELECT: usuário lê apenas a própria row
drop policy if exists "users_select_own" on public.users;
create policy "users_select_own"
  on public.users
  for select
  using (auth.uid() = id);

-- UPDATE: usuário atualiza apenas a própria row
drop policy if exists "users_update_own" on public.users;
create policy "users_update_own"
  on public.users
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- INSERT bloqueado por padrão — só o trigger handle_new_user (security definer)
-- e o service_role podem inserir. Se quiser permitir self-insert, adicionar policy.

-- DELETE: usuário pode deletar a própria row (auth.users CASCADE também faz isso)
drop policy if exists "users_delete_own" on public.users;
create policy "users_delete_own"
  on public.users
  for delete
  using (auth.uid() = id);


-- =====================================================================
-- 3. Trigger: auto-popular public.users em signup
-- =====================================================================
-- security definer: roda com privilégios do criador da função (que tem
-- acesso a auth.users e bypassa RLS pra esta operação específica).
-- search_path = public: previne hijacking de schema.
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

comment on function public.handle_new_user() is
  'Cria row em public.users sempre que auth.users recebe um INSERT. Acionado por trigger on_auth_user_created.';

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();


-- =====================================================================
-- 4. Trigger: auto-update do updated_at em UPDATE
-- =====================================================================
-- Belt-and-suspenders: Prisma já gerencia updated_at via @updatedAt, mas
-- esta trigger garante que qualquer UPDATE direto (psql, dashboard,
-- service_role bypass) também bumpe o timestamp.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists set_updated_at on public.users;
create trigger set_updated_at
  before update on public.users
  for each row
  execute function public.set_updated_at();


-- =====================================================================
-- Done.
-- =====================================================================
-- Verificação: deve aparecer em
--   - Dashboard → Database → Tables → public.users
--   - Dashboard → Database → Functions → handle_new_user, set_updated_at
--   - Dashboard → Database → Triggers → on_auth_user_created (em auth.users),
--                                       set_updated_at (em public.users)
--   - Dashboard → Authentication → Policies → 3 policies em public.users
