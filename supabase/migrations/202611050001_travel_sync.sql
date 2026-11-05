-- Run once in the Supabase SQL editor. No service_role key is used by clients.
create table if not exists public.travel_snapshots (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null check (jsonb_typeof(payload) = 'object' and octet_length(payload::text) <= 5242880),
  revision bigint not null default 1 check (revision > 0),
  updated_at timestamptz not null default now()
);
alter table public.travel_snapshots enable row level security;
revoke all on public.travel_snapshots from anon, authenticated;
grant select on public.travel_snapshots to authenticated;
create policy "Read own travel snapshot" on public.travel_snapshots
  for select to authenticated using ((select auth.uid()) = user_id);

-- Compare-and-swap prevents one device from silently deleting another's changes.
-- The owner is always the verified JWT user, never a client-supplied user ID.
create or replace function public.save_travel_snapshot(p_payload jsonb, p_expected_revision bigint, p_account_id uuid)
returns setof public.travel_snapshots
language plpgsql security definer set search_path = '' as $$
declare owner_id uuid := auth.uid(); saved public.travel_snapshots;
begin
  if owner_id is null or owner_id is distinct from p_account_id then raise exception 'Authentication required' using errcode = '28000'; end if;
  if p_expected_revision is null or p_expected_revision < 0 then raise exception 'Invalid revision'; end if;
  if jsonb_typeof(p_payload) is distinct from 'object'
     or jsonb_typeof(p_payload->'data') is distinct from 'object'
     or jsonb_typeof(p_payload->'base') is distinct from 'object' then
    raise exception 'Invalid travel snapshot';
  end if;
  if p_expected_revision = 0 then
    insert into public.travel_snapshots(user_id,payload) values(owner_id,p_payload)
      on conflict (user_id) do nothing returning * into saved;
  else
    update public.travel_snapshots set payload=p_payload, revision=revision+1, updated_at=now()
      where user_id=owner_id and revision=p_expected_revision returning * into saved;
  end if;
  if saved.user_id is null then raise exception 'Snapshot changed on another device' using errcode = '40001'; end if;
  return next saved;
end;
$$;
revoke all on function public.save_travel_snapshot(jsonb,bigint,uuid) from public, anon;
grant execute on function public.save_travel_snapshot(jsonb,bigint,uuid) to authenticated;
