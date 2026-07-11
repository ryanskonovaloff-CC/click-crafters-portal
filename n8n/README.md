# Click Crafters Client Portal n8n Operations

This folder tracks the n8n workflows needed to keep the Click Crafters client portal populated with reporting data.

The portal does not calculate report narratives live. n8n is responsible for collecting source data, writing normalized metrics to Supabase, and generating monthly draft reports for review.

## Required Workflows

### 1. Google Search Console Pages Performance

Purpose: keeps SEO landing page data current.

Writes to:
- `public.seo_pages_performance`

Expected fields:
- `client_id`
- `date`
- `page`
- `clicks` / `organic_clicks`
- `impressions` / `organic_impressions`
- `ctr` / `organic_ctr`
- `position` / `average_position`

Cadence:
- Daily, after GSC data is available.

Portal dependency:
- SEO Dashboard → Top landing pages
- SEO Dashboard → Organic growth opportunities
- Monthly reports → SEO top landing pages

Validation:

```sql
select date, page, clicks, impressions, ctr, position
from public.seo_pages_performance
where client_id = '11111111-1111-4111-8111-111111111111'
order by date desc
limit 20;
```

### 2. Google Search Console Queries Performance

Purpose: keeps SEO query/search visibility data current.

Writes to:
- `public.seo_keyword_performance`

Expected fields:
- `client_id`
- `date`
- `query`
- `clicks` / `organic_clicks`
- `impressions` / `organic_impressions`
- `ctr` / `organic_ctr`
- `position` / `average_position`

Cadence:
- Daily, after GSC data is available.

Portal dependency:
- SEO Dashboard → Top queries
- SEO Dashboard → Organic growth opportunities
- Monthly reports → SEO top queries

Validation:

```sql
select date, query, clicks, impressions, ctr, position
from public.seo_keyword_performance
where client_id = '11111111-1111-4111-8111-111111111111'
order by date desc, clicks desc
limit 20;
```

### 3. SEO Daily Performance

Purpose: stores daily organic visibility totals and SEO rollup metrics.

Writes to:
- `public.seo_daily_performance`

Expected fields:
- `client_id`
- `date`
- `organic_clicks`
- `organic_impressions`
- `organic_ctr`
- `average_position`
- `organic_sessions`
- `organic_conversions`
- `outbound_clicks`
- `outbound_click_rate`
- `indexed_pages`

Cadence:
- Daily.

Portal dependency:
- SEO Dashboard KPI tiles
- Overview Dashboard organic visibility
- Monthly reports SEO summary

Validation:

```sql
select
  date,
  organic_clicks,
  organic_impressions,
  organic_sessions,
  outbound_clicks,
  indexed_pages
from public.seo_daily_performance
where client_id = '11111111-1111-4111-8111-111111111111'
order by date desc
limit 20;
```

### 4. GA4 Organic Daily Performance Flow - PB Portal

Purpose: keeps GA4 organic session/conversion data and outbound ordering/catering clicks current.

Current source file:
- `/Users/ryans/Downloads/GA4 Organic Daily Performance Flow - PB Portal.json`

Writes to:
- `public.analytics_daily_performance`
- `public.seo_daily_performance.outbound_clicks`

Important business rule:
- Count outbound clicks only when `eventName` starts with:
  - `order_click_`
  - `catering_click_`
- Do not count the generic GA4 `click` event.

Known event examples:
- `order_click_new_canaan`
- `order_click_Wilton`
- `catering_click_new_canaan`
- `catering_click_wilton`

Cadence:
- Daily.

Portal dependency:
- SEO Dashboard → Organic sessions
- SEO Dashboard → Outbound clicks
- SEO Dashboard → Outbound click rate
- Monthly reports → SEO action metrics

Validation:

```sql
select
  date,
  organic_sessions,
  organic_conversions
from public.analytics_daily_performance
where client_id = '11111111-1111-4111-8111-111111111111'
order by date desc
limit 20;
```

```sql
select
  sum(coalesce(organic_clicks, 0)) as organic_clicks,
  sum(coalesce(outbound_clicks, 0)) as outbound_clicks,
  case
    when sum(coalesce(organic_clicks, 0)) > 0
    then sum(coalesce(outbound_clicks, 0))::numeric / sum(coalesce(organic_clicks, 0))
    else null
  end as outbound_click_rate
from public.seo_daily_performance
where client_id = '11111111-1111-4111-8111-111111111111'
  and date >= date_trunc('month', current_date)::date;
```

Data quality note:
- Press Burger outbound clicks may include all traffic until the GA4 outbound request is filtered to Organic Search. The portal should still display stored values, but monthly commentary should avoid overstating outbound click rate if it exceeds 100%.

### 5. Paid Ads Daily Performance

Purpose: keeps paid ads dashboard and monthly paid ads report metrics current.

Current source file:
- `n8n/Paid Ads Daily Performance - Press Burger Portal.json`

Writes to:
- `public.daily_performance`
- `public.campaign_daily_performance`
- `public.ad_lifetime_performance`

Cadence:
- Daily.

Coverage:
- Search, Display, and Performance Max are included in channel/campaign daily reporting.
- Search and Display lifetime ad rows are written where Google Ads exposes normal `ad_group_ad` data.
- Performance Max may not expose normal ad-level rows through the same query. It is still included in `daily_performance` and `campaign_daily_performance`.

Portal dependency:
- Overview Dashboard paid media KPIs
- Paid Ads Dashboard
- Monthly reports paid ads summary

Required campaign fields:
- `client_id`
- `date`
- `platform`
- `channel`
- `campaign_id`
- `campaign_name`
- `spend`
- `revenue` or conversion value
- `conversions`
- `clicks`
- `impressions`
- `cpa`
- `roas`
- `ctr`
- `cpc`
- `wasted_spend`

Validation:

```sql
select
  date,
  platform,
  campaign_name,
  spend,
  revenue,
  conversions,
  clicks,
  impressions,
  roas,
  cpa
from public.campaign_daily_performance
where client_id = '11111111-1111-4111-8111-111111111111'
order by date desc, spend desc
limit 20;
```

### 6. Monthly Report Generator - Client Portal

Purpose: creates stored monthly draft reports after a month closes.

Current source file:
- `n8n/Monthly Report Generator - Client Portal.json`

Writes to:
- `public.monthly_reports`

Trigger:
- Monthly on the 1st at 6:00 AM Pacific.

Behavior:
- Generates the previous completed calendar month.
- Starts with Press Burger only.
- Saves reports as `status = draft`.
- Does not set `published_at`.
- Does not overwrite an already published report.
- If a draft exists for the same `client_id + report_month`, it updates the draft.
- If no paid ads or SEO data exists, it skips report creation and alerts Slack.

Reads from:
- `public.campaign_daily_performance`
- `public.seo_daily_performance`
- `public.seo_keyword_performance`
- `public.seo_pages_performance`

Portal dependency:
- Reports list page
- Report detail page

Validation:

```sql
select
  id,
  client_id,
  report_month,
  status,
  title,
  published_at,
  updated_at
from public.monthly_reports
where client_id = '11111111-1111-4111-8111-111111111111'
order by report_month desc;
```

### 7. Google Business Profile Activity - Press Burger Portal

Purpose: keeps Google Business Profile reviews and local activity current for the SEO dashboard and monthly report SEO section.

Current source file:
- `n8n/Google Business Profile Activity - Press Burger Portal.json`

Writes to:
- `public.gbp_activity`

Required before activation:
- Apply `supabase/migrations/20260603000100_create_gbp_activity.sql` to the live Supabase database.
- Enable the Google Business Profile APIs in Google Cloud.
- Create an n8n OAuth2 credential with the `https://www.googleapis.com/auth/business.manage` scope.
- Confirm the Google user connected in OAuth is an Owner or Manager on the Press Burger Business Profile.

Cadence:
- Daily at 7:00 AM Pacific.
- Uses a 1-day sync lag so Google has time to publish review and performance data.

Portal dependency:
- SEO Dashboard → Local reviews and GBP activity
- Monthly reports → SEO local review / GBP reporting

Validation:

```sql
select
  date,
  business_profile_name,
  profile_views,
  search_views,
  map_views,
  website_clicks,
  calls,
  direction_requests,
  food_orders,
  new_reviews,
  five_star_reviews,
  latest_review_rating,
  latest_review_at,
  source_status,
  blocker
from public.gbp_activity
where client_id = '11111111-1111-4111-8111-111111111111'
order by date desc
limit 20;
```

### 8. Instagram / Social Performance

Purpose: keeps the Instagram Performance dashboard ready for organic Instagram account/content metrics and paid Meta Instagram placement metrics.

Current source files:
- `n8n/Instagram Account Daily Metrics - Client Portal.json`
- `n8n/Instagram Content Discovery - Client Portal.json`
- `n8n/Instagram Content Daily Metrics - Client Portal.json`
- `n8n/Meta Instagram Paid Placement Metrics - Client Portal.json`

Writes to:
- `public.social_accounts`
- `public.social_account_daily_metrics`
- `public.social_media_content`
- `public.social_media_daily_metrics`
- `public.social_paid_daily_metrics`

Required before activation:
- Apply `supabase/migrations/20260709000100_create_instagram_performance_tables.sql` to the live Supabase database.
- Replace placeholders in each workflow's `Pipeline Config` node.
- Use a long-lived Meta token with the required Instagram Graph API and Ads Insights permissions.
- Use the Instagram Business Account ID for organic account/content workflows.
- Use the Meta ad account ID in `act_<ID>` format for paid placement metrics.

Recommended run order:
1. `Instagram Account Daily Metrics - Client Portal`
2. `Instagram Content Discovery - Client Portal`
3. `Instagram Content Daily Metrics - Client Portal`
4. `Meta Instagram Paid Placement Metrics - Client Portal`

Validation:

```sql
select platform, username, display_name, last_synced_at
from public.social_accounts
where client_id = '11111111-1111-4111-8111-111111111111'
order by updated_at desc;
```

```sql
select metric_date, followers_total, reach_total, impressions_total, profile_visits, website_clicks
from public.social_account_daily_metrics
where client_id = '11111111-1111-4111-8111-111111111111'
order by metric_date desc
limit 20;
```

```sql
select published_at, media_type, permalink
from public.social_media_content
where client_id = '11111111-1111-4111-8111-111111111111'
order by published_at desc
limit 20;
```

```sql
select metric_date, campaign_name, ad_name, placement_key, spend, impressions, clicks, inline_link_clicks
from public.social_paid_daily_metrics
where client_id = '11111111-1111-4111-8111-111111111111'
order by metric_date desc, spend desc
limit 20;
```

## Required Credentials / Environment

Use n8n credentials or environment variables. Do not hardcode secrets in exported JSON.

Required:
- Supabase service role key
- Supabase project URL
- Google Search Console OAuth
- GA4 OAuth
- Google Business Profile OAuth
- Paid ads platform credentials
- OpenAI API key
- Slack webhook or Slack OAuth/channel

Environment variable names used by the monthly report workflow:

```text
SUPABASE_SERVICE_ROLE_KEY
OPENAI_API_KEY
CLICK_CRAFTERS_REPORTS_SLACK_WEBHOOK_URL
```

## Standard Run Order

Daily:
1. Paid Ads daily imports
2. GSC query/page imports
3. SEO daily performance rollup
4. GA4 organic/outbound imports
5. Google Business Profile activity import

Monthly on the 1st:
1. Confirm prior month daily imports completed.
2. Run `Monthly Report Generator - Client Portal`.
3. Review generated draft in the portal.
4. Manually publish by setting `status = 'published'` and `published_at = now()` after review.

Publish SQL:

```sql
update public.monthly_reports
set
  status = 'published',
  published_at = coalesce(published_at, now()),
  updated_at = now()
where id = '<REPORT_ID>';
```

Unpublish/revert to draft:

```sql
update public.monthly_reports
set
  status = 'draft',
  published_at = null,
  updated_at = now()
where id = '<REPORT_ID>';
```

## Portal URLs

Reports list:

```text
https://portal.clickcrafters.click/dashboard/reports
```

Report detail:

```text
https://portal.clickcrafters.click/dashboard/reports/<REPORT_ID>
```

## Monthly Close Checklist

Before generating a monthly report:
- Confirm paid ads rows exist for the completed month.
- Confirm SEO daily rows exist for the completed month.
- Confirm GSC query/page rows exist for the completed month.
- Confirm GBP activity rows exist for the completed month, or the GBP blocker is represented.
- Confirm outbound clicks look reasonable.
- Confirm no published report already exists for the month.

After generating:
- Review executive summary and commentary.
- Check KPI overview values against Supabase.
- Check Paid Ads section.
- Check SEO section.
- Check MoM section.
- Review wins, watchouts, and next steps.
- Publish only after review.

## Known Current Scope

Initial automation scope:
- Press Burger only
- `client_id = 11111111-1111-4111-8111-111111111111`

Future expansion:
- Replace the single-client config with an active client list query.
- Loop through each active client.
- Add per-client source IDs and channel mappings.
- Enable Slack alerts once the final internal channel/webhook is configured.
