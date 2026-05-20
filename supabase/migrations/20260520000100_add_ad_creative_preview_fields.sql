alter table public.ad_lifetime_performance
  add column if not exists ad_type text,
  add column if not exists status text,
  add column if not exists headline text,
  add column if not exists headline_2 text,
  add column if not exists headline_3 text,
  add column if not exists description text,
  add column if not exists description_2 text,
  add column if not exists display_url text,
  add column if not exists final_url text,
  add column if not exists preview_url text,
  add column if not exists image_url text,
  add column if not exists thumbnail_url text,
  add column if not exists date_range text,
  add column if not exists source_updated_at timestamptz,
  add column if not exists raw_payload jsonb;

alter table public.ad_daily_performance
  add column if not exists ad_type text,
  add column if not exists status text,
  add column if not exists headline text,
  add column if not exists headline_2 text,
  add column if not exists headline_3 text,
  add column if not exists description text,
  add column if not exists description_2 text,
  add column if not exists display_url text,
  add column if not exists final_url text,
  add column if not exists preview_url text,
  add column if not exists image_url text,
  add column if not exists thumbnail_url text,
  add column if not exists source_updated_at timestamptz,
  add column if not exists raw_payload jsonb;

create index if not exists ad_lifetime_performance_client_campaign_ad_idx
on public.ad_lifetime_performance (client_id, platform, campaign_id, ad_id);
