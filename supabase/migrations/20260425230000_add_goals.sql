-- M3.5 Goals: financial goals + monthly contributions tracking
-- Apply via: Supabase Dashboard → SQL Editor → New query → paste this entire file → Run

-- Goals table
create table if not exists public.goals (
  id            uuid           primary key default gen_random_uuid(),
  user_id       uuid           not null references public.users (id) on delete cascade,
  name          text           not null,
  type          text           not null default 'custom',
  target        numeric(14, 2) not null check (target > 0),
  current       numeric(14, 2) not null default 0 check (current >= 0),
  deadline      date           not null,
  priority      smallint       not null default 1 check (priority between 1 and 5),
  linked_account_id text,
  created_at    timestamptz    not null default now(),
  updated_at    timestamptz    not null default now(),
  constraint goals_type_check check (
    type in ('emergency', 'trip', 'house', 'vehicle', 'retirement', 'education', 'custom')
  )
);

create index if not exists goals_user_id_idx on public.goals (user_id);
create index if not exists goals_user_deadline_idx on public.goals (user_id, deadline);

-- Monthly contribution log (history of aportes per goal)
create table if not exists public.goal_contributions (
  id           uuid           primary key default gen_random_uuid(),
  goal_id      uuid           not null references public.goals (id) on delete cascade,
  amount       numeric(14, 2) not null check (amount > 0),
  contributed_at timestamptz  not null default now(),
  note         text,
  created_at   timestamptz    not null default now()
);

create index if not exists goal_contributions_goal_id_idx on public.goal_contributions (goal_id);

-- Trigger: auto-update updated_at on goals
drop trigger if exists set_updated_at on public.goals;
create trigger set_updated_at
  before update on public.goals
  for each row
  execute function public.set_updated_at();

-- RLS: user can only read/write their own goals
alter table public.goals enable row level security;

drop policy if exists "goals_select_own" on public.goals;
create policy "goals_select_own"
  on public.goals for select
  using (auth.uid() = user_id);

drop policy if exists "goals_insert_own" on public.goals;
create policy "goals_insert_own"
  on public.goals for insert
  with check (auth.uid() = user_id);

drop policy if exists "goals_update_own" on public.goals;
create policy "goals_update_own"
  on public.goals for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "goals_delete_own" on public.goals;
create policy "goals_delete_own"
  on public.goals for delete
  using (auth.uid() = user_id);

-- RLS: contributions inherit access from their goal
alter table public.goal_contributions enable row level security;

drop policy if exists "contribs_select_via_goal" on public.goal_contributions;
create policy "contribs_select_via_goal"
  on public.goal_contributions for select
  using (
    exists (
      select 1 from public.goals g
      where g.id = goal_contributions.goal_id and g.user_id = auth.uid()
    )
  );

drop policy if exists "contribs_insert_via_goal" on public.goal_contributions;
create policy "contribs_insert_via_goal"
  on public.goal_contributions for insert
  with check (
    exists (
      select 1 from public.goals g
      where g.id = goal_contributions.goal_id and g.user_id = auth.uid()
    )
  );

drop policy if exists "contribs_delete_via_goal" on public.goal_contributions;
create policy "contribs_delete_via_goal"
  on public.goal_contributions for delete
  using (
    exists (
      select 1 from public.goals g
      where g.id = goal_contributions.goal_id and g.user_id = auth.uid()
    )
  );

comment on table public.goals is 'Financial goals (SMART) per user. Status is computed app-side from current vs target vs deadline.';
comment on table public.goal_contributions is 'History of contributions toward a goal. Each row = one aporte.';
