create table if not exists public.monthly_report_source_metrics (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  source text not null,
  status text not null default 'completed',
  metrics_json jsonb not null default '{}'::jsonb,
  error_message text,
  generated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint monthly_report_source_metrics_client_period_source_key
    unique (client_id, period_start, period_end, source)
);

alter table public.monthly_report_source_metrics
  add column if not exists client_id uuid references public.clients(id) on delete cascade,
  add column if not exists period_start date,
  add column if not exists period_end date,
  add column if not exists source text,
  add column if not exists status text not null default 'completed',
  add column if not exists metrics_json jsonb not null default '{}'::jsonb,
  add column if not exists error_message text,
  add column if not exists generated_at timestamptz not null default now(),
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

alter table public.monthly_report_source_metrics
  alter column client_id set not null,
  alter column period_start set not null,
  alter column period_end set not null,
  alter column source set not null,
  alter column status set not null,
  alter column status set default 'completed',
  alter column metrics_json set not null,
  alter column metrics_json set default '{}'::jsonb,
  alter column generated_at set not null,
  alter column generated_at set default now(),
  alter column created_at set not null,
  alter column created_at set default now(),
  alter column updated_at set not null,
  alter column updated_at set default now();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'monthly_report_source_metrics_client_period_source_key'
      and conrelid = 'public.monthly_report_source_metrics'::regclass
  ) then
    alter table public.monthly_report_source_metrics
      add constraint monthly_report_source_metrics_client_period_source_key
      unique (client_id, period_start, period_end, source);
  end if;
end $$;

alter table public.monthly_report_source_metrics enable row level security;

drop policy if exists "Read assigned monthly report source metrics" on public.monthly_report_source_metrics;

create policy "Read assigned monthly report source metrics"
on public.monthly_report_source_metrics
for select
to authenticated
using (public.can_access_client(client_id));

grant select on public.monthly_report_source_metrics to authenticated;

create index if not exists monthly_report_source_metrics_client_period_idx
on public.monthly_report_source_metrics (client_id, period_start desc, period_end desc);

create index if not exists monthly_report_source_metrics_source_status_idx
on public.monthly_report_source_metrics (source, status);

notify pgrst, 'reload schema';
