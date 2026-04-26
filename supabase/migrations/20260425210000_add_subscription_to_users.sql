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
