create table if not exists public.social_accounts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  platform text not null check (platform in ('instagram')),
  platform_account_id text not null,
  username text,
  display_name text,
  profile_url text,
  is_active boolean not null default true,
  last_synced_at timestamptz,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (client_id, platform, platform_account_id)
);

create table if not exists public.social_account_daily_metrics (
  id uuid primary key default gen_random_uuid(),
  social_account_id uuid not null references public.social_accounts(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  metric_date date not null,
  followers_total numeric,
  followers_gained numeric,
  unfollows numeric,
  net_follower_growth numeric,
  reach_total numeric,
  reach_organic numeric,
  reach_paid numeric,
  impressions_total numeric,
  impressions_organic numeric,
  impressions_paid numeric,
  accounts_engaged numeric,
  profile_visits numeric,
  website_clicks numeric,
  total_interactions numeric,
  content_published numeric,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (social_account_id, metric_date)
);

create table if not exists public.social_media_content (
  id uuid primary key default gen_random_uuid(),
  social_account_id uuid not null references public.social_accounts(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  platform_media_id text not null,
  media_type text,
  caption text,
  media_url text,
  thumbnail_url text,
  permalink text,
  published_at timestamptz,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (social_account_id, platform_media_id)
);

create table if not exists public.social_media_daily_metrics (
  id uuid primary key default gen_random_uuid(),
  social_media_content_id uuid not null references public.social_media_content(id) on delete cascade,
  social_account_id uuid not null references public.social_accounts(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  metric_date date not null,
  reach_total numeric,
  reach_organic numeric,
  reach_paid numeric,
  impressions_total numeric,
  impressions_organic numeric,
  impressions_paid numeric,
  likes numeric,
  comments numeric,
  shares numeric,
  saves numeric,
  total_interactions numeric,
  engagement_rate numeric,
  video_views numeric,
  average_watch_time_seconds numeric,
  profile_activity numeric,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (social_media_content_id, metric_date)
);

create table if not exists public.social_paid_daily_metrics (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  metric_date date not null,
  source_platform text not null default 'Meta Ads',
  publisher_platform text not null default 'instagram',
  platform_position text,
  placement text,
  placement_key text not null default 'instagram',
  campaign_id text not null,
  campaign_name text,
  adset_id text not null default 'unknown',
  adset_name text,
  ad_id text not null default 'unknown',
  ad_name text,
  spend numeric not null default 0,
  reach numeric,
  impressions numeric,
  clicks numeric,
  inline_link_clicks numeric,
  video_views numeric,
  engagements numeric,
  profile_visits numeric,
  follows numeric,
  conversions numeric,
  conversion_value numeric,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (client_id, metric_date, campaign_id, adset_id, ad_id, placement_key)
);

alter table public.social_accounts enable row level security;
alter table public.social_account_daily_metrics enable row level security;
alter table public.social_media_content enable row level security;
alter table public.social_media_daily_metrics enable row level security;
alter table public.social_paid_daily_metrics enable row level security;

drop policy if exists "Read assigned social accounts" on public.social_accounts;
create policy "Read assigned social accounts" on public.social_accounts for select to authenticated using (public.can_access_client(client_id));
drop policy if exists "Admin manage social accounts" on public.social_accounts;
create policy "Admin manage social accounts" on public.social_accounts for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Read assigned social account daily metrics" on public.social_account_daily_metrics;
create policy "Read assigned social account daily metrics" on public.social_account_daily_metrics for select to authenticated using (public.can_access_client(client_id));
drop policy if exists "Admin manage social account daily metrics" on public.social_account_daily_metrics;
create policy "Admin manage social account daily metrics" on public.social_account_daily_metrics for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Read assigned social media content" on public.social_media_content;
create policy "Read assigned social media content" on public.social_media_content for select to authenticated using (public.can_access_client(client_id));
drop policy if exists "Admin manage social media content" on public.social_media_content;
create policy "Admin manage social media content" on public.social_media_content for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Read assigned social media daily metrics" on public.social_media_daily_metrics;
create policy "Read assigned social media daily metrics" on public.social_media_daily_metrics for select to authenticated using (public.can_access_client(client_id));
drop policy if exists "Admin manage social media daily metrics" on public.social_media_daily_metrics;
create policy "Admin manage social media daily metrics" on public.social_media_daily_metrics for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Read assigned social paid daily metrics" on public.social_paid_daily_metrics;
create policy "Read assigned social paid daily metrics" on public.social_paid_daily_metrics for select to authenticated using (public.can_access_client(client_id));
drop policy if exists "Admin manage social paid daily metrics" on public.social_paid_daily_metrics;
create policy "Admin manage social paid daily metrics" on public.social_paid_daily_metrics for all to authenticated using (public.is_admin()) with check (public.is_admin());

grant select on public.social_accounts to authenticated;
grant select on public.social_account_daily_metrics to authenticated;
grant select on public.social_media_content to authenticated;
grant select on public.social_media_daily_metrics to authenticated;
grant select on public.social_paid_daily_metrics to authenticated;

create index if not exists social_accounts_client_platform_idx on public.social_accounts (client_id, platform, is_active);
create index if not exists social_account_daily_metrics_client_date_idx on public.social_account_daily_metrics (client_id, metric_date);
create index if not exists social_media_content_client_published_idx on public.social_media_content (client_id, published_at desc);
create index if not exists social_media_daily_metrics_client_date_idx on public.social_media_daily_metrics (client_id, metric_date);
create index if not exists social_paid_daily_metrics_client_date_idx on public.social_paid_daily_metrics (client_id, metric_date);
create index if not exists social_paid_daily_metrics_instagram_idx on public.social_paid_daily_metrics (client_id, publisher_platform, platform_position);
