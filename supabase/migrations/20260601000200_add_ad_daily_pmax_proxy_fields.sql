create table if not exists public.ad_daily_performance (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  date date not null,
  platform text not null,
  channel text,
  campaign_id text,
  campaign_name text,
  ad_group_id text,
  ad_group_name text,
  ad_id text not null,
  ad_name text,
  creative_id text,
  creative_name text,
  creative_preview_url text,
  spend numeric default 0,
  revenue numeric default 0,
  conversions numeric default 0,
  clicks integer default 0,
  impressions integer default 0,
  cpa numeric,
  roas numeric,
  ctr numeric,
  cpc numeric,
  source_type text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.ad_daily_performance
  add column if not exists source_type text,
  add column if not exists metadata_json jsonb not null default '{}'::jsonb;

do $$
begin
  if not exists (
    select 1
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'ad_daily_performance'
      and c.contype = 'u'
      and (
        select array_agg(a.attname order by u.ordinality)
        from unnest(c.conkey) with ordinality as u(attnum, ordinality)
        join pg_attribute a on a.attrelid = c.conrelid and a.attnum = u.attnum
      ) = array['client_id', 'date', 'platform', 'ad_id']
  ) then
    alter table public.ad_daily_performance
      add constraint ad_daily_performance_client_date_platform_ad_id_key
      unique (client_id, date, platform, ad_id);
  end if;
end $$;

alter table public.ad_daily_performance enable row level security;

drop policy if exists "Authenticated read ad daily performance" on public.ad_daily_performance;

create policy "Authenticated read ad daily performance"
on public.ad_daily_performance
for select
to authenticated
using (public.can_access_client(client_id));

grant select on public.ad_daily_performance to authenticated;

create index if not exists ad_daily_performance_client_date_idx
on public.ad_daily_performance (client_id, date);

create index if not exists ad_daily_performance_client_sort_idx
on public.ad_daily_performance (client_id, platform, ad_id);

create index if not exists ad_daily_performance_source_type_idx
on public.ad_daily_performance (source_type);

notify pgrst, 'reload schema';
