begin;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

create or replace function private.user_has_company_access(p_user_id uuid, p_company_id uuid)
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

create or replace function private.user_is_company_admin(p_user_id uuid, p_company_id uuid)
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

create or replace function private.check_user_permission(p_user_id uuid, p_company_id uuid, p_permission_key text)
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

create or replace function private.get_user_company_ids()
returns setof uuid language sql stable security definer
set search_path = pg_catalog, public
as $$
  select cm.company_id from public.company_memberships cm
  where cm.user_id = auth.uid() and cm.active = true
$$;

create or replace function private.record_audit_event(
  p_company_id uuid, p_action text, p_entity_type text, p_entity_id uuid, p_changes jsonb default null
) returns uuid language plpgsql security definer
set search_path = pg_catalog, public
as $$
declare v_event_id uuid;
begin
  if auth.uid() is null or not private.user_has_company_access(auth.uid(), p_company_id) then raise exception 'Not authorized to record audit event'; end if;
  if p_action not in ('CREATE', 'VIEW', 'EDIT', 'DELETE', 'MOVE_TO_TRASH', 'RESTORE', 'DOWNLOAD', 'PDF_GENERATE', 'PDF_DOWNLOAD', 'EXPORT', 'ARCHIVE', 'REOPEN', 'PERMISSION_CHANGE', 'SETTINGS_CHANGE', 'FACTORY_IMPORT', 'BACKUP', 'RESTORE_BACKUP', 'TASK_TO_PROJECT') then raise exception 'Invalid audit action'; end if;
  if not exists (select 1 from public.users where id = auth.uid() and active = true) then raise exception 'Account disabled'; end if;
  insert into public.audit_events (company_id, actor_user_id, action, entity_type, entity_id, entity_reference, before_json, after_json, metadata_json)
  values (p_company_id, auth.uid(), p_action, p_entity_type, p_entity_id, p_changes->>'entityReference', p_changes->'before', p_changes->'after', p_changes->'metadata')
  returning id into v_event_id;
  return v_event_id;
end;
$$;

revoke all on all functions in schema private from public, anon;
grant execute on function private.user_has_company_access(uuid, uuid) to authenticated;
grant execute on function private.user_is_company_admin(uuid, uuid) to authenticated;
grant execute on function private.check_user_permission(uuid, uuid, text) to authenticated;
grant execute on function private.get_user_company_ids() to authenticated;
grant execute on function private.record_audit_event(uuid, text, text, uuid, jsonb) to authenticated;

create or replace function public.user_has_company_access(p_user_id uuid, p_company_id uuid)
returns boolean language sql stable security invoker set search_path = pg_catalog, public, private
as $$ select private.user_has_company_access(p_user_id, p_company_id) $$;
create or replace function public.user_is_company_admin(p_user_id uuid, p_company_id uuid)
returns boolean language sql stable security invoker set search_path = pg_catalog, public, private
as $$ select private.user_is_company_admin(p_user_id, p_company_id) $$;
create or replace function public.check_user_permission(p_user_id uuid, p_company_id uuid, p_permission_key text)
returns boolean language sql stable security invoker set search_path = pg_catalog, public, private
as $$ select private.check_user_permission(p_user_id, p_company_id, p_permission_key) $$;
create or replace function public.get_user_company_ids()
returns setof uuid language sql stable security invoker set search_path = pg_catalog, public, private
as $$ select * from private.get_user_company_ids() $$;
create or replace function public.record_audit_event(p_company_id uuid, p_action text, p_entity_type text, p_entity_id uuid, p_changes jsonb default null)
returns uuid language sql security invoker set search_path = pg_catalog, public, private
as $$ select private.record_audit_event(p_company_id, p_action, p_entity_type, p_entity_id, p_changes) $$;

revoke execute on function public.user_has_company_access(uuid, uuid) from public;
revoke execute on function public.user_is_company_admin(uuid, uuid) from public;
revoke execute on function public.check_user_permission(uuid, uuid, text) from public;
revoke execute on function public.get_user_company_ids() from public;
revoke execute on function public.record_audit_event(uuid, text, text, uuid, jsonb) from public;
grant execute on function public.user_has_company_access(uuid, uuid) to authenticated;
grant execute on function public.user_is_company_admin(uuid, uuid) to authenticated;
grant execute on function public.check_user_permission(uuid, uuid, text) to authenticated;
grant execute on function public.get_user_company_ids() to authenticated;
grant execute on function public.record_audit_event(uuid, text, text, uuid, jsonb) to authenticated;

commit;
