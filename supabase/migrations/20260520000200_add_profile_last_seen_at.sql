alter table public.profiles
  add column if not exists last_seen_at timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'Users can update own last seen'
  ) then
    create policy "Users can update own last seen" on public.profiles
    for update to authenticated
    using (id = auth.uid())
    with check (id = auth.uid());
  end if;
end $$;

grant update (last_seen_at) on public.profiles to authenticated;
