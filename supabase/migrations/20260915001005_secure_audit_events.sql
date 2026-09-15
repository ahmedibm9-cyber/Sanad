-- Audit identity and company scope are derived from the authenticated session.
create or replace function public.record_audit_event(
  p_company_id uuid,
  p_action text,
  p_entity_type text,
  p_entity_id uuid,
  p_changes jsonb default null
) returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_event_id uuid;
  v_email text;
begin
  if auth.uid() is null or not public.user_has_company_access(auth.uid(), p_company_id) then
    raise exception 'Not authorized to record audit event';
  end if;

  if p_action not in ('CREATE', 'VIEW', 'EDIT', 'DELETE', 'MOVE_TO_TRASH', 'RESTORE',
                      'DOWNLOAD', 'PDF_GENERATE', 'PDF_DOWNLOAD', 'EXPORT',
                      'ARCHIVE', 'REOPEN', 'PERMISSION_CHANGE', 'SETTINGS_CHANGE',
                      'FACTORY_IMPORT', 'BACKUP', 'RESTORE_BACKUP', 'TASK_TO_PROJECT') then
    raise exception 'Invalid audit action';
  end if;

  select email into v_email from public.users where id = auth.uid() and active = true;
  if v_email is null then raise exception 'Account disabled'; end if;

  insert into public.audit_events (company_id, action, entity_type, entity_id, changes, user_id, user_email)
  values (p_company_id, p_action, p_entity_type, p_entity_id, p_changes, auth.uid(), v_email)
  returning id into v_event_id;

  return v_event_id;
end;
$$;

revoke all on function public.record_audit_event(uuid, text, text, uuid, jsonb) from public, anon;
grant execute on function public.record_audit_event(uuid, text, text, uuid, jsonb) to authenticated;

drop policy if exists "Company members can manage audit_events" on public.audit_events;
drop policy if exists audit_events_insert on public.audit_events;
revoke insert, update, delete on public.audit_events from anon, authenticated;
