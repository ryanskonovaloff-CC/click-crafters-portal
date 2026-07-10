do $$
declare
  v_column_name text;
begin
  foreach v_column_name in array array[
    'spend',
    'revenue',
    'conversions',
    'cpa',
    'roas',
    'ctr',
    'cpc',
    'wasted_spend'
  ]
  loop
    if exists (
      select 1
      from information_schema.columns c
      where c.table_schema = 'public'
        and c.table_name = 'ad_daily_performance'
        and c.column_name = v_column_name
    ) then
      execute format(
        'alter table public.ad_daily_performance alter column %I type numeric using %I::numeric',
        v_column_name,
        v_column_name
      );
    end if;
  end loop;
end $$;

notify pgrst, 'reload schema';
