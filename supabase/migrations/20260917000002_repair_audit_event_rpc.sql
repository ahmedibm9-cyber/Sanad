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

  if not exists (select 1 from public.users where id = auth.uid() and active = true) then
    raise exception 'Account disabled';
  end if;

  insert into public.audit_events (
    company_id,
    actor_user_id,
    action,
    entity_type,
    entity_id,
    entity_reference,
    before_json,
    after_json,
    metadata_json
  ) values (
    p_company_id,
    auth.uid(),
    p_action,
    p_entity_type,
    p_entity_id,
    p_changes->>'entityReference',
    p_changes->'before',
    p_changes->'after',
    p_changes->'metadata'
  ) returning id into v_event_id;

  return v_event_id;
end;
$$;
