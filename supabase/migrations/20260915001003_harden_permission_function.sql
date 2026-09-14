-- Permission checks are used by Edge Functions and must reject disabled accounts.
create or replace function public.check_user_permission(
  p_user_id uuid,
  p_company_id uuid,
  p_permission_key text
) returns boolean
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare
  v_is_admin boolean;
  v_base_role text;
  v_membership_id uuid;
  v_allowed boolean;
begin
  select is_system_admin into v_is_admin
  from public.users
  where id = p_user_id and active = true;

  if v_is_admin then return true; end if;

  select id, base_role into v_membership_id, v_base_role
  from public.company_memberships
  where user_id = p_user_id and company_id = p_company_id and active = true;

  if v_membership_id is null then return false; end if;
  if v_base_role = 'admin' then return true; end if;

  select allowed into v_allowed
  from public.membership_permissions
  where membership_id = v_membership_id and permission_key = p_permission_key;

  if v_base_role = 'viewer' then
    if p_permission_key in ('projects.view', 'tasks.view', 'documents.view',
                            'customers.view', 'materials.view', 'reports.view', 'factory.view') then
      return true;
    end if;
    if p_permission_key = 'files.download' then return coalesce(v_allowed, false); end if;
    return false;
  end if;

  return coalesce(v_allowed, false);
end;
$$;
