alter table public.daily_performance
add column if not exists channel text;

update public.daily_performance
set channel = case
  when platform = 'Google Ads' then 'Unspecified'
  when platform = 'Meta Ads' then 'Paid Social'
  else 'Unspecified'
end
where channel is null or btrim(channel) = '';

alter table public.daily_performance
alter column channel set default 'Unspecified';

alter table public.daily_performance
alter column channel set not null;

alter table public.daily_performance
drop constraint if exists daily_performance_client_id_date_platform_key;

create unique index if not exists daily_performance_client_date_platform_channel_uidx
on public.daily_performance (client_id, date, platform, channel);

-- Rollback:
-- drop index if exists public.daily_performance_client_date_platform_channel_uidx;
-- Do not restore the old three-column unique key while multiple channels can
-- exist for the same platform and date.
