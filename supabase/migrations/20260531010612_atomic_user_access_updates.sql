create or replace function public.set_user_access(
  p_user_id uuid,
  p_role public.user_role,
  p_client_id uuid default null,
  p_email text default null,
  p_full_name text default null,
  p_require_existing_assignment boolean default false
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
  v_actor_role public.user_role;
  v_existing_role public.user_role;
  v_existing_email text;
  v_client_exists boolean;
  v_actor_can_manage_client boolean;
  v_target_has_requested_assignment boolean;
  v_target_has_other_assignments boolean;
  v_email text := nullif(lower(trim(p_email)), '');
  v_full_name text := nullif(trim(p_full_name), '');
begin
  if v_actor_id is null then
    raise exception 'Not authenticated.' using errcode = '28000';
  end if;

  if p_user_id is null then
    raise exception 'Missing user ID.' using errcode = '22023';
  end if;

  if p_role is null then
    raise exception 'Select a valid access level.' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtext(p_user_id::text));

  select role
  into v_actor_role
  from public.profiles
  where id = v_actor_id;

  if v_actor_role is null or v_actor_role not in ('admin', 'client_admin') then
    raise exception 'You do not have permission to manage users.' using errcode = '42501';
  end if;

  select role, email
  into v_existing_role, v_existing_email
  from public.profiles
  where id = p_user_id
  for update;

  if v_existing_email is null and v_email is null then
    raise exception 'Email is required for new user access.' using errcode = '22023';
  end if;

  if p_role <> 'admin' then
    if p_client_id is null then
      raise exception 'Select a client for client access.' using errcode = '22023';
    end if;

    select exists (
      select 1
      from public.clients
      where id = p_client_id
    )
    into v_client_exists;

    if not v_client_exists then
      raise exception 'Selected client does not exist.' using errcode = '23503';
    end if;
  end if;

  if v_actor_id = p_user_id and v_actor_role = 'admin' and p_role <> 'admin' then
    raise exception 'You cannot remove your own admin access.' using errcode = '42501';
  end if;

  if v_actor_role = 'client_admin' then
    if p_role = 'admin' then
      raise exception 'Client admins cannot create Click Crafters admin users.' using errcode = '42501';
    end if;

    if v_existing_role = 'admin' then
      raise exception 'Client admins cannot manage Click Crafters admin users.' using errcode = '42501';
    end if;

    select exists (
      select 1
      from public.client_users
      where user_id = v_actor_id
        and client_id = p_client_id
    )
    into v_actor_can_manage_client;

    if not v_actor_can_manage_client then
      raise exception 'You can only manage users assigned to your business.' using errcode = '42501';
    end if;

    select exists (
      select 1
      from public.client_users
      where user_id = p_user_id
        and client_id = p_client_id
    )
    into v_target_has_requested_assignment;

    if p_require_existing_assignment and not v_target_has_requested_assignment then
      raise exception 'You can only manage users assigned to your business.' using errcode = '42501';
    end if;

    select exists (
      select 1
      from public.client_users
      where user_id = p_user_id
        and client_id <> p_client_id
    )
    into v_target_has_other_assignments;

    if v_target_has_other_assignments then
      raise exception 'This user has access outside your business and must be managed by a Click Crafters admin.' using errcode = '42501';
    end if;
  end if;

  insert into public.profiles (id, email, full_name, role, updated_at)
  values (p_user_id, coalesce(v_email, v_existing_email), v_full_name, p_role, now())
  on conflict (id) do update
  set
    email = coalesce(v_email, public.profiles.email),
    full_name = case when p_full_name is null then public.profiles.full_name else v_full_name end,
    role = p_role,
    updated_at = now();

  delete from public.client_users
  where user_id = p_user_id;

  if p_role <> 'admin' then
    insert into public.client_users (client_id, user_id)
    values (p_client_id, p_user_id)
    on conflict (client_id, user_id) do nothing;
  end if;
end;
$$;

revoke all on function public.set_user_access(uuid, public.user_role, uuid, text, text, boolean) from public;
revoke all on function public.set_user_access(uuid, public.user_role, uuid, text, text, boolean) from anon;
grant execute on function public.set_user_access(uuid, public.user_role, uuid, text, text, boolean) to authenticated;
