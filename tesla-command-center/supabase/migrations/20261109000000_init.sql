-- CruiseCtrl: initial schema.
-- RLS is enabled on every table. Users can only read (and where noted, write)
-- rows where user_id = auth.uid(). Server-owned tables have RLS enabled with
-- no policies, so only the service role (server routes) can touch them.

create extension if not exists pgcrypto;

-- Profiles --------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (char_length(display_name) <= 60),
  -- First-touch campaign attribution only. No IPs, user agents or referrers.
  utm_source text check (char_length(utm_source) <= 64),
  utm_medium text check (char_length(utm_medium) <= 64),
  utm_campaign text check (char_length(utm_campaign) <= 64),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "profiles: read own" on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy "profiles: update own" on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Preferences (one JSON document per user, validated in the app) --------------
create table public.preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb check (pg_column_size(data) < 32768),
  updated_at timestamptz not null default now()
);
alter table public.preferences enable row level security;
create policy "preferences: read own" on public.preferences for select to authenticated using (user_id = (select auth.uid()));
create policy "preferences: insert own" on public.preferences for insert to authenticated with check (user_id = (select auth.uid()));
create policy "preferences: update own" on public.preferences for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Favorites (per preset, ordered) ---------------------------------------------
create table public.favorites (
  user_id uuid not null references auth.users (id) on delete cascade,
  preset text not null check (preset in ('watch', 'listen', 'focus', 'drive')),
  position smallint not null check (position between 0 and 7),
  service_id text not null check (service_id ~ '^[a-z0-9-]{1,64}$'),
  primary key (user_id, preset, position)
);
alter table public.favorites enable row level security;
create policy "favorites: read own" on public.favorites for select to authenticated using (user_id = (select auth.uid()));
create policy "favorites: insert own" on public.favorites for insert to authenticated with check (user_id = (select auth.uid()));
create policy "favorites: update own" on public.favorites for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "favorites: delete own" on public.favorites for delete to authenticated using (user_id = (select auth.uid()));

-- Paired car devices ----------------------------------------------------------
create table public.devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  label text not null check (char_length(label) between 1 and 40),
  token_hash text not null unique,
  scope text not null default 'dashboard' check (scope = 'dashboard'),
  created_at timestamptz not null default now(),
  last_seen_at timestamptz,
  revoked_at timestamptz
);
create index devices_user_idx on public.devices (user_id);
alter table public.devices enable row level security;
-- Users may list their own devices. token_hash is excluded via a column grant below.
create policy "devices: read own" on public.devices for select to authenticated using (user_id = (select auth.uid()));
-- Revocation goes through the server route (service role) so we can audit it.
revoke select on public.devices from authenticated;
grant select (id, user_id, label, scope, created_at, last_seen_at, revoked_at) on public.devices to authenticated;

create table public.pairing_requests (
  id uuid primary key,
  code_hash text not null unique,
  poll_secret_hash text not null,
  status text not null check (status in ('pending', 'approved', 'claimed', 'expired')),
  user_id uuid references auth.users (id) on delete cascade,
  device_label text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  approved_at timestamptz,
  claimed_at timestamptz
);
create index pairing_requests_expires_idx on public.pairing_requests (expires_at);
alter table public.pairing_requests enable row level security; -- service role only

create table public.rate_limit_hits (
  id bigint generated always as identity primary key,
  bucket text not null,
  created_at timestamptz not null default now()
);
create index rate_limit_hits_bucket_idx on public.rate_limit_hits (bucket, created_at);
alter table public.rate_limit_hits enable row level security; -- service role only

-- Billing ---------------------------------------------------------------------
create table public.stripe_customers (
  user_id uuid primary key references auth.users (id) on delete cascade,
  stripe_customer_id text not null unique,
  created_at timestamptz not null default now()
);
alter table public.stripe_customers enable row level security; -- service role only

create table public.subscriptions (
  stripe_subscription_id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  stripe_customer_id text not null,
  status text not null,
  price_id text,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  last_event_created bigint not null default 0,
  updated_at timestamptz not null default now()
);
create index subscriptions_user_idx on public.subscriptions (user_id);
alter table public.subscriptions enable row level security;
-- Read-only for the owner; only the webhook (service role) writes.
create policy "subscriptions: read own" on public.subscriptions for select to authenticated using (user_id = (select auth.uid()));

create table public.stripe_events (
  id text primary key,
  type text not null,
  received_at timestamptz not null default now()
);
alter table public.stripe_events enable row level security; -- service role only

-- Consent-gated product analytics (allowlisted names and props only) ---------
create table public.analytics_events (
  id bigint generated always as identity primary key,
  event text not null check (event in ('demo_open','favorite_added','checkout_started','subscription_activated','first_dashboard_use')),
  props jsonb not null default '{}'::jsonb check (pg_column_size(props) < 1024),
  utm jsonb not null default '{}'::jsonb check (pg_column_size(utm) < 1024),
  created_at timestamptz not null default now()
);
alter table public.analytics_events enable row level security; -- service role only

-- Housekeeping helper (schedule with pg_cron or call from a cron route) ------
create function public.purge_expired_pairing() returns void
language sql security definer set search_path = '' as $$
  delete from public.pairing_requests where expires_at < now() - interval '1 day';
  delete from public.rate_limit_hits where created_at < now() - interval '1 day';
$$;
revoke execute on function public.purge_expired_pairing() from public, anon, authenticated;
