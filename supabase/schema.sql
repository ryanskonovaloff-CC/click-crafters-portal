create extension if not exists pgcrypto;

create type public.user_role as enum ('admin', 'client_admin', 'client_viewer');

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  industry text,
  status text not null default 'active',
  last_updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role public.user_role not null default 'client_viewer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.client_users (
  client_id uuid not null references public.clients(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (client_id, user_id)
);

create table public.daily_performance (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  date date not null,
  platform text not null check (platform in ('Google Ads', 'Meta Ads')),
  spend numeric(12,2) not null default 0,
  revenue numeric(12,2) not null default 0,
  conversions integer not null default 0,
  clicks integer not null default 0,
  impressions integer not null default 0,
  created_at timestamptz not null default now(),
  unique (client_id, date, platform)
);

create table public.campaign_performance (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  platform text not null check (platform in ('Google Ads', 'Meta Ads')),
  campaign_name text not null,
  spend numeric(12,2) not null default 0,
  revenue numeric(12,2) not null default 0,
  conversions integer not null default 0,
  clicks integer not null default 0,
  impressions integer not null default 0,
  wasted_spend numeric(12,2) not null default 0,
  ctr numeric generated always as (case when impressions > 0 then round((clicks::numeric / impressions::numeric) * 100, 2) else 0 end) stored,
  cpc numeric generated always as (case when clicks > 0 then round(spend / clicks, 2) else 0 end) stored,
  cpa numeric generated always as (case when conversions > 0 then round(spend / conversions, 2) else 0 end) stored,
  roas numeric generated always as (case when spend > 0 then round(revenue / spend, 2) else 0 end) stored,
  created_at timestamptz not null default now()
);

create table public.ad_performance (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  platform text not null check (platform in ('Google Ads', 'Meta Ads')),
  campaign_name text not null,
  ad_name text not null,
  preview_url text,
  spend numeric(12,2) not null default 0,
  revenue numeric(12,2) not null default 0,
  conversions integer not null default 0,
  clicks integer not null default 0,
  impressions integer not null default 0,
  wasted_spend numeric(12,2) not null default 0,
  ctr numeric generated always as (case when impressions > 0 then round((clicks::numeric / impressions::numeric) * 100, 2) else 0 end) stored,
  cpc numeric generated always as (case when clicks > 0 then round(spend / clicks, 2) else 0 end) stored,
  cpa numeric generated always as (case when conversions > 0 then round(spend / conversions, 2) else 0 end) stored,
  roas numeric generated always as (case when spend > 0 then round(revenue / spend, 2) else 0 end) stored,
  created_at timestamptz not null default now()
);

create table public.campaign_daily_performance (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  date date not null,
  platform text not null,
  channel text,
  campaign_id text not null,
  campaign_name text,
  spend numeric default 0,
  revenue numeric default 0,
  conversions integer default 0,
  clicks integer default 0,
  impressions integer default 0,
  cpa numeric,
  roas numeric,
  ctr numeric,
  cpc numeric,
  wasted_spend numeric default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (client_id, date, platform, campaign_id)
);

create table public.ad_daily_performance (
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
  conversions integer default 0,
  clicks integer default 0,
  impressions integer default 0,
  cpa numeric,
  roas numeric,
  ctr numeric,
  cpc numeric,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (client_id, date, platform, ad_id)
);

create table public.ad_lifetime_performance (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
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
  conversions integer default 0,
  clicks integer default 0,
  impressions integer default 0,
  cpa numeric,
  roas numeric,
  ctr numeric,
  cpc numeric,
  updated_at timestamptz default now(),
  created_at timestamptz default now(),
  unique (client_id, platform, ad_id)
);

create table public.seo_performance (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  organic_clicks integer not null default 0,
  organic_impressions integer not null default 0,
  average_position numeric(5,2) not null default 0,
  organic_sessions integer not null default 0,
  organic_conversions integer not null default 0,
  top_queries jsonb not null default '[]'::jsonb,
  top_landing_pages jsonb not null default '[]'::jsonb,
  technical_issues jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  month text not null,
  summary text not null,
  wins text[] not null default '{}',
  issues text[] not null default '{}',
  actions_taken text[] not null default '{}',
  next_steps text[] not null default '{}',
  created_at timestamptz not null default now(),
  unique (client_id, month)
);

create table public.seo_technical_issues (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  detected_date date not null,
  issue_type text not null,
  severity text,
  page_url text,
  issue_description text,
  recommendation text,
  status text default 'open',
  source text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (client_id, detected_date, issue_type, page_url)
);

create table public.monthly_reports (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  report_month date not null,
  period_start date not null,
  period_end date not null,
  previous_period_start date,
  previous_period_end date,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  title text,
  executive_summary text,
  paid_ads_commentary text,
  seo_commentary text,
  mom_commentary text,
  wins text[] not null default '{}',
  watchouts text[] not null default '{}',
  next_steps text[] not null default '{}',
  paid_ads_summary jsonb,
  seo_summary jsonb,
  mom_summary jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  unique (client_id, report_month)
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', new.email))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() = 'admin', false)
$$;

create or replace function public.can_access_client(target_client_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin()
    or exists (
      select 1
      from public.client_users cu
      where cu.client_id = target_client_id
        and cu.user_id = auth.uid()
    )
$$;

alter table public.clients enable row level security;
alter table public.profiles enable row level security;
alter table public.client_users enable row level security;
alter table public.daily_performance enable row level security;
alter table public.campaign_performance enable row level security;
alter table public.ad_performance enable row level security;
alter table public.campaign_daily_performance enable row level security;
alter table public.ad_daily_performance enable row level security;
alter table public.ad_lifetime_performance enable row level security;
alter table public.seo_performance enable row level security;
alter table public.reports enable row level security;
alter table public.seo_technical_issues enable row level security;
alter table public.monthly_reports enable row level security;

create policy "Admins can manage clients" on public.clients for all using (public.is_admin()) with check (public.is_admin());
create policy "Assigned users can read clients" on public.clients for select using (public.can_access_client(id));

create policy "Users can read own profile" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "Admins can manage profiles" on public.profiles for all using (public.is_admin()) with check (public.is_admin());

create policy "Admins can manage client users" on public.client_users for all using (public.is_admin()) with check (public.is_admin());
create policy "Users can read own assignments" on public.client_users for select using (user_id = auth.uid() or public.is_admin());

create policy "Read assigned daily performance" on public.daily_performance for select using (public.can_access_client(client_id));
create policy "Admin manage daily performance" on public.daily_performance for all using (public.is_admin()) with check (public.is_admin());

create policy "Read assigned campaign performance" on public.campaign_performance for select using (public.can_access_client(client_id));
create policy "Admin manage campaign performance" on public.campaign_performance for all using (public.is_admin()) with check (public.is_admin());

create policy "Read assigned ad performance" on public.ad_performance for select using (public.can_access_client(client_id));
create policy "Admin manage ad performance" on public.ad_performance for all using (public.is_admin()) with check (public.is_admin());

create policy "Read assigned seo performance" on public.seo_performance for select using (public.can_access_client(client_id));
create policy "Admin manage seo performance" on public.seo_performance for all using (public.is_admin()) with check (public.is_admin());

create policy "Read assigned reports" on public.reports for select using (public.can_access_client(client_id));
create policy "Admin manage reports" on public.reports for all using (public.is_admin()) with check (public.is_admin());

create policy "Authenticated read campaign daily performance" on public.campaign_daily_performance for select to authenticated using (true);
create policy "Authenticated read ad daily performance" on public.ad_daily_performance for select to authenticated using (true);
create policy "Authenticated read ad lifetime performance" on public.ad_lifetime_performance for select to authenticated using (true);
create policy "Authenticated read seo technical issues" on public.seo_technical_issues for select to authenticated using (true);
create policy "Read assigned monthly reports" on public.monthly_reports for select to authenticated using (public.is_admin() or (status = 'published' and public.can_access_client(client_id)));
create policy "Admin manage monthly reports" on public.monthly_reports for all to authenticated using (public.is_admin()) with check (public.is_admin());

grant select on public.campaign_daily_performance to authenticated;
grant select on public.ad_daily_performance to authenticated;
grant select on public.ad_lifetime_performance to authenticated;
grant select on public.seo_technical_issues to authenticated;
grant select on public.monthly_reports to authenticated;

create index daily_performance_client_date_idx on public.daily_performance (client_id, date);
create index campaign_performance_client_period_idx on public.campaign_performance (client_id, period_start, period_end);
create index ad_performance_client_period_idx on public.ad_performance (client_id, period_start, period_end);
create index campaign_daily_performance_client_date_idx on public.campaign_daily_performance (client_id, date);
create index campaign_daily_performance_client_sort_idx on public.campaign_daily_performance (client_id, platform, campaign_id);
create index ad_daily_performance_client_date_idx on public.ad_daily_performance (client_id, date);
create index ad_daily_performance_client_sort_idx on public.ad_daily_performance (client_id, platform, ad_id);
create index ad_lifetime_performance_client_sort_idx on public.ad_lifetime_performance (client_id, roas desc, conversions desc, spend desc);
create index seo_performance_client_period_idx on public.seo_performance (client_id, period_start, period_end);
create index reports_client_month_idx on public.reports (client_id, month);
create index seo_technical_issues_client_date_idx on public.seo_technical_issues (client_id, detected_date);
create index monthly_reports_client_month_idx on public.monthly_reports (client_id, report_month desc);
create index monthly_reports_client_status_month_idx on public.monthly_reports (client_id, status, report_month desc);
