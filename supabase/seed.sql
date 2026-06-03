insert into public.clients (id, name, slug, industry, status, last_updated_at)
values ('11111111-1111-4111-8111-111111111111', 'Press Burger', 'press-burger', 'Fast casual restaurant', 'active', '2026-06-03 09:00:00-07')
on conflict (slug) do update set last_updated_at = excluded.last_updated_at;

insert into public.daily_performance (client_id, date, platform, spend, revenue, conversions, clicks, impressions) values
('11111111-1111-4111-8111-111111111111','2026-05-01','Google Ads',420,2380,41,612,22400),
('11111111-1111-4111-8111-111111111111','2026-05-01','Meta Ads',310,1260,24,744,38600),
('11111111-1111-4111-8111-111111111111','2026-05-02','Google Ads',455,2510,44,639,23120),
('11111111-1111-4111-8111-111111111111','2026-05-02','Meta Ads',335,1490,29,790,40120),
('11111111-1111-4111-8111-111111111111','2026-05-03','Google Ads',488,2890,49,702,24290),
('11111111-1111-4111-8111-111111111111','2026-05-03','Meta Ads',350,1630,31,816,41440),
('11111111-1111-4111-8111-111111111111','2026-05-04','Google Ads',510,3035,52,731,25100),
('11111111-1111-4111-8111-111111111111','2026-05-04','Meta Ads',372,1715,33,848,43100),
('11111111-1111-4111-8111-111111111111','2026-05-05','Google Ads',536,3310,57,765,26700),
('11111111-1111-4111-8111-111111111111','2026-05-05','Meta Ads',390,1840,36,892,45200),
('11111111-1111-4111-8111-111111111111','2026-05-06','Google Ads',560,3565,61,788,27220),
('11111111-1111-4111-8111-111111111111','2026-05-06','Meta Ads',402,1910,37,914,46800),
('11111111-1111-4111-8111-111111111111','2026-05-07','Google Ads',590,3825,65,840,28900),
('11111111-1111-4111-8111-111111111111','2026-05-07','Meta Ads',418,2025,39,941,48120)
on conflict (client_id, date, platform) do nothing;

insert into public.campaign_performance (client_id, period_start, period_end, platform, campaign_name, spend, revenue, conversions, clicks, impressions, wasted_spend) values
('11111111-1111-4111-8111-111111111111','2026-05-01','2026-05-15','Google Ads','Press Burger Search - Near Me',2860,18540,314,4032,132600,210),
('11111111-1111-4111-8111-111111111111','2026-05-01','2026-05-15','Meta Ads','Press Burger Lunch Offers',1735,7420,144,3860,194300,318),
('11111111-1111-4111-8111-111111111111','2026-05-01','2026-05-15','Google Ads','Press Burger Brand Defense',740,6240,118,1210,41100,38),
('11111111-1111-4111-8111-111111111111','2026-05-01','2026-05-15','Meta Ads','Press Burger Catering Retargeting',842,5150,83,1420,80220,96),
('11111111-1111-4111-8111-111111111111','2026-05-01','2026-05-15','Google Ads','Press Burger Competitor Terms',910,1980,31,1188,62300,402),
('11111111-1111-4111-8111-111111111111','2026-05-01','2026-05-15','Meta Ads','Press Burger New Store Awareness',680,1225,19,2024,138400,286);

insert into public.ad_performance (client_id, period_start, period_end, platform, campaign_name, ad_name, preview_url, spend, revenue, conversions, clicks, impressions, wasted_spend) values
('11111111-1111-4111-8111-111111111111','2026-05-01','2026-05-15','Meta Ads','Press Burger Lunch Offers','Double Stack Lunch Combo','Orange burger creative',620,3280,62,1330,68420,70),
('11111111-1111-4111-8111-111111111111','2026-05-01','2026-05-15','Google Ads','Press Burger Search - Near Me','Best Burger Near Me RSA','Search ad preview',940,6410,106,1394,43120,82),
('11111111-1111-4111-8111-111111111111','2026-05-01','2026-05-15','Meta Ads','Press Burger Catering Retargeting','Office Catering Tray','Catering tray creative',410,3090,47,684,30100,44),
('11111111-1111-4111-8111-111111111111','2026-05-01','2026-05-15','Google Ads','Press Burger Brand Defense','Press Burger Official Site','Search ad preview',260,2310,44,402,12980,9),
('11111111-1111-4111-8111-111111111111','2026-05-01','2026-05-15','Meta Ads','Press Burger New Store Awareness','Grand Opening Story','Storefront creative',295,720,11,890,65500,126);

insert into public.seo_performance (client_id, period_start, period_end, organic_clicks, organic_impressions, average_position, organic_sessions, organic_conversions, top_queries, top_landing_pages, technical_issues)
values (
  '11111111-1111-4111-8111-111111111111',
  '2026-05-01',
  '2026-05-15',
  4860,
  184500,
  7.8,
  8120,
  326,
  '[{"query":"press burger menu","clicks":920,"impressions":18400,"position":2.1},{"query":"best burgers near me","clicks":710,"impressions":39100,"position":5.8},{"query":"burger catering","clicks":388,"impressions":12100,"position":4.3},{"query":"smash burger lunch special","clicks":265,"impressions":9700,"position":6.4}]',
  '[{"page":"/menu","clicks":1420,"sessions":2360,"conversions":112},{"page":"/locations","clicks":1188,"sessions":2044,"conversions":86},{"page":"/catering","clicks":604,"sessions":980,"conversions":51},{"page":"/order-online","clicks":518,"sessions":1120,"conversions":77}]',
  '[{"severity":"medium","issue":"Missing meta descriptions on two location pages"},{"severity":"low","issue":"Four images missing alt text"},{"severity":"medium","issue":"LocalBusiness schema review pending"}]'
);

insert into public.reports (client_id, month, summary, wins, issues, actions_taken, next_steps)
values (
  '11111111-1111-4111-8111-111111111111',
  '2026-05',
  'Paid media is pacing efficiently with search campaigns driving the strongest revenue and SEO visibility continuing to improve for menu and location queries.',
  array['Search ROAS reached 6.5x on high-intent near-me terms','Meta lunch offer creative lowered CPA by 18%','Organic clicks are up 14% versus the prior period'],
  array['Competitor keyword CPA remains above target','New store awareness campaign needs tighter audience exclusions','A few location pages still need metadata cleanup'],
  array['Shifted budget toward brand and near-me search terms','Paused two low-intent Meta ad sets','Updated catering page internal links and conversion CTAs'],
  array['Launch revised competitor campaign with tighter match types','Refresh top Meta creative with new food photography','Complete local schema and metadata cleanup']
)
on conflict (client_id, month) do update set summary = excluded.summary;

insert into public.gbp_activity (
  client_id,
  date,
  business_profile_name,
  source,
  status,
  access_blocker,
  new_reviews,
  five_star_reviews,
  total_reviews,
  average_rating,
  profile_views,
  website_clicks,
  phone_calls,
  direction_requests,
  food_orders,
  latest_review_rating,
  latest_review_author,
  latest_review_text,
  latest_review_at,
  notes
) values (
  '11111111-1111-4111-8111-111111111111',
  '2026-06-03',
  'Press Burger',
  'manual_review_log',
  'blocked',
  'Awaiting Google Business Profile owner/admin access before live GBP insights can be connected. Manual review entries are allowed until API access is available.',
  1,
  1,
  null,
  5.00,
  null,
  null,
  null,
  null,
  null,
  5,
  'Google reviewer',
  'New 5-star local review logged manually while GBP access is pending.',
  '2026-06-03 09:00:00-07',
  'Seed row for the June 3, 2026 new 5-star review and GBP access follow-up.'
)
on conflict (client_id, date, business_profile_name) do update set
  source = excluded.source,
  status = excluded.status,
  access_blocker = excluded.access_blocker,
  new_reviews = excluded.new_reviews,
  five_star_reviews = excluded.five_star_reviews,
  total_reviews = excluded.total_reviews,
  average_rating = excluded.average_rating,
  profile_views = excluded.profile_views,
  website_clicks = excluded.website_clicks,
  phone_calls = excluded.phone_calls,
  direction_requests = excluded.direction_requests,
  food_orders = excluded.food_orders,
  latest_review_rating = excluded.latest_review_rating,
  latest_review_author = excluded.latest_review_author,
  latest_review_text = excluded.latest_review_text,
  latest_review_at = excluded.latest_review_at,
  notes = excluded.notes,
  updated_at = now();

-- After creating users in Supabase Auth, assign them like this:
-- update public.profiles set role = 'admin' where email = 'owner@clickcrafters.click';
-- update public.profiles set role = 'client_admin' where email = 'client@example.com';
-- insert into public.client_users (client_id, user_id)
-- select '11111111-1111-4111-8111-111111111111', id from public.profiles where email = 'client@example.com';
