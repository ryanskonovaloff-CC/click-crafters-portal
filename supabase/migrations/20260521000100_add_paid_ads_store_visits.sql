alter table public.daily_performance
  add column if not exists store_visits numeric;

alter table public.campaign_daily_performance
  add column if not exists store_visits numeric;
