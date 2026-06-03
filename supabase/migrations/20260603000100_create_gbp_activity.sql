create table if not exists public.gbp_activity (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  date date not null,
  business_profile_name text,
  source text not null default 'manual',
  status text not null default 'manual_seed',
  access_blocker text,
  new_reviews integer,
  five_star_reviews integer,
  total_reviews integer,
  average_rating numeric(3,2),
  profile_views integer,
  search_views integer,
  map_views integer,
  website_clicks integer,
  phone_calls integer,
  direction_requests integer,
  food_orders integer,
  latest_review_rating integer,
  latest_review_author text,
  latest_review_text text,
  latest_review_at timestamptz,
  notes text,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint gbp_activity_review_rating_check check (latest_review_rating is null or latest_review_rating between 1 and 5),
  constraint gbp_activity_average_rating_check check (average_rating is null or average_rating between 0 and 5),
  constraint gbp_activity_client_date_profile_key unique (client_id, date, business_profile_name)
);

alter table public.gbp_activity
  add column if not exists client_id uuid references public.clients(id) on delete cascade,
  add column if not exists date date,
  add column if not exists business_profile_name text,
  add column if not exists source text not null default 'manual',
  add column if not exists status text not null default 'manual_seed',
  add column if not exists access_blocker text,
  add column if not exists new_reviews integer,
  add column if not exists five_star_reviews integer,
  add column if not exists total_reviews integer,
  add column if not exists average_rating numeric(3,2),
  add column if not exists profile_views integer,
  add column if not exists search_views integer,
  add column if not exists map_views integer,
  add column if not exists website_clicks integer,
  add column if not exists phone_calls integer,
  add column if not exists direction_requests integer,
  add column if not exists food_orders integer,
  add column if not exists latest_review_rating integer,
  add column if not exists latest_review_author text,
  add column if not exists latest_review_text text,
  add column if not exists latest_review_at timestamptz,
  add column if not exists notes text,
  add column if not exists raw_payload jsonb not null default '{}'::jsonb,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

alter table public.gbp_activity
  alter column client_id set not null,
  alter column date set not null,
  alter column source set not null,
  alter column source set default 'manual',
  alter column status set not null,
  alter column status set default 'manual_seed',
  alter column raw_payload set not null,
  alter column raw_payload set default '{}'::jsonb,
  alter column created_at set not null,
  alter column created_at set default now(),
  alter column updated_at set not null,
  alter column updated_at set default now();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'gbp_activity_review_rating_check'
      and conrelid = 'public.gbp_activity'::regclass
  ) then
    alter table public.gbp_activity
      add constraint gbp_activity_review_rating_check
      check (latest_review_rating is null or latest_review_rating between 1 and 5);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'gbp_activity_average_rating_check'
      and conrelid = 'public.gbp_activity'::regclass
  ) then
    alter table public.gbp_activity
      add constraint gbp_activity_average_rating_check
      check (average_rating is null or average_rating between 0 and 5);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'gbp_activity_client_date_profile_key'
      and conrelid = 'public.gbp_activity'::regclass
  ) then
    alter table public.gbp_activity
      add constraint gbp_activity_client_date_profile_key
      unique (client_id, date, business_profile_name);
  end if;
end $$;

alter table public.gbp_activity enable row level security;

drop policy if exists "Read assigned GBP activity" on public.gbp_activity;
drop policy if exists "Admin manage GBP activity" on public.gbp_activity;

create policy "Read assigned GBP activity"
on public.gbp_activity
for select
to authenticated
using (public.can_access_client(client_id));

create policy "Admin manage GBP activity"
on public.gbp_activity
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

grant select on public.gbp_activity to authenticated;

create index if not exists gbp_activity_client_date_idx
on public.gbp_activity (client_id, date desc);

create index if not exists gbp_activity_status_idx
on public.gbp_activity (status);

notify pgrst, 'reload schema';
