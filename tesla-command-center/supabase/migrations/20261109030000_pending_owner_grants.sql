-- Pre-authorise an owner/test account by email before it first signs in.
-- Emails live only in this server-only table (never in code or env files).
-- When a listed email confirms sign-in, it receives the owner_test entitlement.
--   insert into public.pending_owner_grants (email) values ('you@example.com');
--   Revoke later with: select public.revoke_owner_access('you@example.com');
--   and delete from public.pending_owner_grants where email = 'you@example.com';

create table public.pending_owner_grants (
  email text primary key check (email = lower(email) and char_length(email) <= 254),
  created_at timestamptz not null default now()
);
alter table public.pending_owner_grants enable row level security; -- service role / SQL editor only

create function public.apply_pending_owner_grant() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.email_confirmed_at is not null
     and exists (select 1 from public.pending_owner_grants g where g.email = lower(new.email)) then
    insert into public.entitlements (user_id, kind, note)
    values (new.id, 'owner_test', 'Owner test access (pre-authorised)')
    on conflict (user_id) do nothing;
  end if;
  return new;
end;
$$;
revoke execute on function public.apply_pending_owner_grant() from public, anon, authenticated;

create trigger on_auth_user_confirmed_owner_grant
  after insert or update of email_confirmed_at on auth.users
  for each row execute function public.apply_pending_owner_grant();
