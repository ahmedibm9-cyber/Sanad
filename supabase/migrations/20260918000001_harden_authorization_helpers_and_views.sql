begin;

create or replace function public.user_has_company_access(p_user_id uuid, p_company_id uuid)
returns boolean language sql stable security definer
set search_path = pg_catalog, public
as $$
  select auth.uid() is not null and p_user_id = auth.uid() and exists (
    select 1 from public.company_memberships membership
    join public.users account on account.id = membership.user_id
    where membership.user_id = p_user_id and membership.company_id = p_company_id
      and membership.active = true and account.active = true
  )
$$;

create or replace function public.user_is_company_admin(p_user_id uuid, p_company_id uuid)
returns boolean language sql stable security definer
set search_path = pg_catalog, public
as $$
  select auth.uid() is not null and p_user_id = auth.uid() and exists (
    select 1 from public.company_memberships membership
    join public.users account on account.id = membership.user_id
    where membership.user_id = p_user_id and membership.company_id = p_company_id
      and membership.base_role = 'admin' and membership.active = true and account.active = true
  )
$$;

create or replace function public.check_user_permission(p_user_id uuid, p_company_id uuid, p_permission_key text)
returns boolean language plpgsql stable security definer
set search_path = pg_catalog, public
as $$
declare v_is_admin boolean; v_base_role text; v_membership_id uuid; v_allowed boolean;
begin
  if auth.uid() is null or p_user_id <> auth.uid() then return false; end if;
  select is_system_admin into v_is_admin from public.users where id = p_user_id and active = true;
  if v_is_admin then return true; end if;
  select id, base_role into v_membership_id, v_base_role from public.company_memberships
    where user_id = p_user_id and company_id = p_company_id and active = true;
  if v_membership_id is null then return false; end if;
  if v_base_role = 'admin' then return true; end if;
  select allowed into v_allowed from public.membership_permissions
    where membership_id = v_membership_id and permission_key = p_permission_key;
  if v_base_role = 'viewer' then
    if p_permission_key in ('projects.view', 'tasks.view', 'documents.view', 'customers.view', 'materials.view', 'reports.view', 'factory.view') then return true; end if;
    if p_permission_key = 'files.download' then return coalesce(v_allowed, false); end if;
    return false;
  end if;
  return coalesce(v_allowed, false);
end;
$$;

revoke execute on function public.check_user_permission(uuid, uuid, text) from public;
revoke execute on function public.get_user_company_ids() from public;
revoke execute on function public.user_has_company_access(uuid, uuid) from public;
revoke execute on function public.user_is_company_admin(uuid, uuid) from public;
grant execute on function public.check_user_permission(uuid, uuid, text) to authenticated;
grant execute on function public.get_user_company_ids() to authenticated;
grant execute on function public.user_has_company_access(uuid, uuid) to authenticated;
grant execute on function public.user_is_company_admin(uuid, uuid) to authenticated;

revoke execute on function public.enforce_company_relation_integrity() from public, anon, authenticated;
revoke execute on function public.enforce_work_item_material_company_integrity() from public, anon, authenticated;
alter function public.update_updated_at_column() set search_path = pg_catalog, public;
alter function public.validate_staging_rows(uuid) set search_path = pg_catalog, public;
alter function public.exec_transaction(jsonb) set search_path = pg_catalog, public;

alter view public.user_memberships_view set (security_invoker = true);
alter view public.company_membership_count_view set (security_invoker = true);
alter view public.customer_search_view set (security_invoker = true);
alter view public.material_search_view set (security_invoker = true);
alter view public.todo_summary_view set (security_invoker = true);
alter view public.work_item_summary_view set (security_invoker = true);
alter view public.document_summary_view set (security_invoker = true);

commit;
