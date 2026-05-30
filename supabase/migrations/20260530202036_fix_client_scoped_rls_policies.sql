drop policy if exists "Authenticated read campaign daily performance" on public.campaign_daily_performance;
drop policy if exists "Authenticated read ad lifetime performance" on public.ad_lifetime_performance;
drop policy if exists "Authenticated read seo technical issues" on public.seo_technical_issues;

create policy "Authenticated read campaign daily performance"
on public.campaign_daily_performance
for select
to authenticated
using (public.can_access_client(client_id));

create policy "Authenticated read ad lifetime performance"
on public.ad_lifetime_performance
for select
to authenticated
using (public.can_access_client(client_id));

create policy "Authenticated read seo technical issues"
on public.seo_technical_issues
for select
to authenticated
using (public.can_access_client(client_id));
