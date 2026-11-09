-- Owner/test entitlements: grant dashboard access to specific accounts without a
-- subscription. Server-owned: users can read their own row, only the service role
-- (or a SQL session in the dashboard) can grant or revoke.

create table public.entitlements (
  user_id uuid primary key references auth.users (id) on delete cascade,
  kind text not null check (kind in ('owner_test')),
  note text check (char_length(note) <= 200),
  granted_at timestamptz not null default now(),
  revoked_at timestamptz
);
alter table public.entitlements enable row level security;
create policy "entitlements: read own" on public.entitlements for select to authenticated using (user_id = (select auth.uid()));

-- Grant by email (the account must have signed in once). Run from the SQL editor:
--   select public.grant_owner_access('you@example.com');
create function public.grant_owner_access(target_email text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare uid uuid;
begin
  select id into uid from auth.users where lower(email) = lower(target_email) and email_confirmed_at is not null;
  if uid is null then raise exception 'No confirmed account for %', target_email; end if;
  insert into public.entitlements (user_id, kind, note) values (uid, 'owner_test', 'Owner test access')
  on conflict (user_id) do update set revoked_at = null, granted_at = now();
  return uid;
end;
$$;

-- Revoke:  select public.revoke_owner_access('you@example.com');
create function public.revoke_owner_access(target_email text) returns void
language sql security definer set search_path = '' as $$
  update public.entitlements set revoked_at = now()
  where user_id = (select id from auth.users where lower(email) = lower(target_email));
$$;

revoke execute on function public.grant_owner_access(text) from public, anon, authenticated;
revoke execute on function public.revoke_owner_access(text) from public, anon, authenticated;
