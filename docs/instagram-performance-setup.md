# Instagram Performance Dashboard Setup

The portal Instagram page reads from Supabase tables populated by n8n. It does not use demo data in production.

## Tables

- `social_accounts`: one active Instagram account per client.
- `social_account_daily_metrics`: daily account snapshots for followers, reach, impressions, engagement, profile visits, clicks, and publishing count.
- `social_media_content`: Instagram media metadata, captions, thumbnails, and permalinks.
- `social_media_daily_metrics`: daily metrics per Instagram content item.
- `social_paid_daily_metrics`: Meta Ads Instagram placement data only. Do not include Facebook placement rows.

All tables include `client_id`, RLS, and authenticated read policies using `public.can_access_client(client_id)`.

## n8n Upsert Keys

Use these `on_conflict` values:

- `social_accounts`: `client_id,platform,platform_account_id`
- `social_account_daily_metrics`: `social_account_id,metric_date`
- `social_media_content`: `social_account_id,platform_media_id`
- `social_media_daily_metrics`: `social_media_content_id,metric_date`
- `social_paid_daily_metrics`: `client_id,metric_date,campaign_id,adset_id,ad_id,placement_key`

Every object sent to Supabase must include every conflict field. For Meta placement rows, send `placement_key` as a stable Instagram placement string such as `instagram_feed`, `instagram_reels`, `instagram_stories`, or `instagram_unknown`.

## Required Source Behavior

- Keep organic Instagram metrics separate from Meta paid placement metrics.
- Do not estimate organic or paid splits when the source API does not provide them.
- Store unavailable values as `null`, not `0`.
- Use `raw_payload` for source payload debugging.
- Set `last_synced_at` on `social_accounts` after a successful account-level sync.

## Suggested Workflow Cadence

- Account daily metrics: daily, refresh the last 30 days for lag.
- Media/content discovery: daily, refresh recent content plus any content published in the selected reporting window.
- Media daily metrics: daily, refresh recent content for at least 30 days.
- Meta paid placement metrics: daily, refresh the last 30 days and filter to Instagram placements.

## Manual Refresh

The page includes a disabled manual refresh button until a server-side webhook route is connected. If enabled later, the route should:

1. Verify the signed-in user can access the selected `client_id`.
2. Trigger a protected n8n webhook using a server-only secret.
3. Return a queued/running status without exposing webhook secrets client-side.
