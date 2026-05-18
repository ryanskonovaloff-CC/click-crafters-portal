create table if not exists public.monthly_reports (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  report_month date,
  period_start date,
  period_end date,
  previous_period_start date,
  previous_period_end date,
  status text not null default 'draft',
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
  published_at timestamptz
);

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'monthly_reports'
      and column_name = 'report_month'
      and data_type <> 'date'
  ) then
    alter table public.monthly_reports rename column report_month to report_month_legacy;
    alter table public.monthly_reports add column report_month date;
  end if;
end $$;

alter table public.monthly_reports
  add column if not exists report_month date,
  add column if not exists period_start date,
  add column if not exists period_end date,
  add column if not exists previous_period_start date,
  add column if not exists previous_period_end date,
  add column if not exists status text not null default 'draft',
  add column if not exists title text,
  add column if not exists executive_summary text,
  add column if not exists paid_ads_commentary text,
  add column if not exists seo_commentary text,
  add column if not exists mom_commentary text,
  add column if not exists wins text[] not null default '{}',
  add column if not exists watchouts text[] not null default '{}',
  add column if not exists next_steps text[] not null default '{}',
  add column if not exists paid_ads_summary jsonb,
  add column if not exists seo_summary jsonb,
  add column if not exists mom_summary jsonb,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists published_at timestamptz;

do $$
declare
  column_name text;
begin
  foreach column_name in array array['wins', 'watchouts', 'next_steps']
  loop
    if exists (
      select 1
      from information_schema.columns c
      where c.table_schema = 'public'
        and c.table_name = 'monthly_reports'
        and c.column_name = column_name
        and c.data_type = 'jsonb'
    ) then
      execute format('alter table public.monthly_reports rename column %I to %I', column_name, column_name || '_legacy');
      execute format('alter table public.monthly_reports add column %I text[] not null default ''{}''', column_name);
      execute format(
        'update public.monthly_reports set %1$I = coalesce((select array_agg(value) from jsonb_array_elements_text(%2$I) as value), ''{}''::text[])',
        column_name,
        column_name || '_legacy'
      );
    end if;
  end loop;
end $$;

update public.monthly_reports
set
  period_start = coalesce(period_start, date_trunc('month', period_end)::date, report_month),
  period_end = coalesce(period_end, (date_trunc('month', period_start)::date + interval '1 month - 1 day')::date),
  report_month = coalesce(report_month, date_trunc('month', period_start)::date),
  title = coalesce(title, 'Monthly Performance Report'),
  updated_at = coalesce(updated_at, now())
where report_month is null
   or period_start is null
   or period_end is null
   or title is null
   or updated_at is null;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'monthly_reports'
      and column_name = 'headline'
  ) then
    update public.monthly_reports
    set title = coalesce(title, headline);
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'monthly_reports'
      and column_name = 'summary'
  ) then
    update public.monthly_reports
    set executive_summary = coalesce(executive_summary, summary);
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'monthly_reports'
      and column_name = 'issues'
      and data_type = 'jsonb'
  ) then
    update public.monthly_reports
    set watchouts = coalesce(
      nullif(watchouts, '{}'::text[]),
      (select array_agg(value) from jsonb_array_elements_text(issues) as value),
      '{}'::text[]
    );
  end if;
end $$;

alter table public.monthly_reports
  alter column report_month set not null,
  alter column period_start set not null,
  alter column period_end set not null,
  alter column status set not null,
  alter column status set default 'draft',
  alter column wins set not null,
  alter column wins set default '{}',
  alter column watchouts set not null,
  alter column watchouts set default '{}',
  alter column next_steps set not null,
  alter column next_steps set default '{}',
  alter column created_at set not null,
  alter column created_at set default now(),
  alter column updated_at set not null,
  alter column updated_at set default now();

do $$
begin
  if exists (
    select 1
    from public.monthly_reports
    group by client_id, report_month
    having count(*) > 1
  ) then
    raise exception 'monthly_reports has duplicate client_id/report_month rows. Resolve duplicates before adding the unique constraint.';
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'monthly_reports_status_check'
      and conrelid = 'public.monthly_reports'::regclass
  ) then
    alter table public.monthly_reports
      add constraint monthly_reports_status_check
      check (status in ('draft', 'published', 'archived'));
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'monthly_reports_client_id_period_start_period_end_key'
      and conrelid = 'public.monthly_reports'::regclass
  ) then
    alter table public.monthly_reports drop constraint monthly_reports_client_id_period_start_period_end_key;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'monthly_reports_client_id_report_month_key'
      and conrelid = 'public.monthly_reports'::regclass
  ) then
    alter table public.monthly_reports
      add constraint monthly_reports_client_id_report_month_key unique (client_id, report_month);
  end if;
end $$;

alter table public.monthly_reports enable row level security;

drop policy if exists "Authenticated read monthly reports" on public.monthly_reports;
drop policy if exists "Read assigned monthly reports" on public.monthly_reports;
drop policy if exists "Admin manage monthly reports" on public.monthly_reports;

create policy "Read assigned monthly reports"
on public.monthly_reports
for select
to authenticated
using (
  public.is_admin()
  or (
    status = 'published'
    and public.can_access_client(client_id)
  )
);

create policy "Admin manage monthly reports"
on public.monthly_reports
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

grant select on public.monthly_reports to authenticated;

create index if not exists monthly_reports_client_month_idx
on public.monthly_reports (client_id, report_month desc);

create index if not exists monthly_reports_client_status_month_idx
on public.monthly_reports (client_id, status, report_month desc);
