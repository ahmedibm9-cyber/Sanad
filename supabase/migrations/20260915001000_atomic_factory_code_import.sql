-- A Factory Code import must either fully commit or leave the master data unchanged.
create or replace function apply_factory_code_import(p_import_id uuid)
returns table(inserted integer, updated integer, unchanged integer, retained integer)
language plpgsql
set search_path = public
as $$
declare
  invalid_rows integer;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if not exists (
    select 1 from factory_code_imports
    where id = p_import_id and uploaded_by = auth.uid()
  ) and not exists (
    select 1 from users where id = auth.uid() and is_system_admin = true
  ) then
    raise exception 'Not authorized to apply this import';
  end if;

  select count(*) into invalid_rows
  from factory_code_staging
  where import_id = p_import_id and status = 'error';

  if invalid_rows > 0 then
    raise exception 'Import has % invalid row(s)', invalid_rows;
  end if;

  if exists (
    select stable_source_key
    from factory_code_staging
    where import_id = p_import_id and status = 'validated'
    group by stable_source_key having count(*) > 1
  ) then
    raise exception 'Import contains duplicate Factory Code records';
  end if;

  select count(*) into inserted
  from factory_code_staging s
  where s.import_id = p_import_id and s.status = 'validated'
    and not exists (select 1 from factory_code_records r where r.stable_source_key = s.stable_source_key);

  select count(*) into updated
  from factory_code_staging s
  join factory_code_records r on r.stable_source_key = s.stable_source_key
  where s.import_id = p_import_id and s.status = 'validated'
    and row(r.factory_code, r.factory_name, r.factory_name_ar, r.city, r.region, r.activity, r.product, r.hs_code, r.registration_number)
      is distinct from row(s.factory_code, s.factory_name, s.factory_name_ar, s.city, s.region, s.activity, s.product, s.hs_code, s.registration_number);

  select count(*) - inserted - updated into unchanged
  from factory_code_staging
  where import_id = p_import_id and status = 'validated';

  select count(*) into retained
  from factory_code_records r
  where not exists (
    select 1 from factory_code_staging s
    where s.import_id = p_import_id and s.status = 'validated' and s.stable_source_key = r.stable_source_key
  );

  update factory_code_records r
  set factory_code = s.factory_code, factory_name = s.factory_name, factory_name_ar = s.factory_name_ar,
      city = s.city, region = s.region, activity = s.activity, product = s.product,
      hs_code = s.hs_code, registration_number = s.registration_number, last_seen_import_id = p_import_id
  from factory_code_staging s
  where s.import_id = p_import_id and s.status = 'validated' and r.stable_source_key = s.stable_source_key
    and row(r.factory_code, r.factory_name, r.factory_name_ar, r.city, r.region, r.activity, r.product, r.hs_code, r.registration_number)
      is distinct from row(s.factory_code, s.factory_name, s.factory_name_ar, s.city, s.region, s.activity, s.product, s.hs_code, s.registration_number);

  insert into factory_code_records (stable_source_key, factory_code, factory_name, factory_name_ar, city, region, activity, product, hs_code, registration_number, first_seen_import_id, last_seen_import_id)
  select stable_source_key, factory_code, factory_name, factory_name_ar, city, region, activity, product, hs_code, registration_number, p_import_id, p_import_id
  from factory_code_staging s
  where s.import_id = p_import_id and s.status = 'validated'
    and not exists (select 1 from factory_code_records r where r.stable_source_key = s.stable_source_key);

  update factory_code_staging s
  set status = case when exists (select 1 from factory_code_records r where r.first_seen_import_id = p_import_id and r.stable_source_key = s.stable_source_key) then 'inserted'
                    when exists (select 1 from factory_code_records r where r.last_seen_import_id = p_import_id and r.stable_source_key = s.stable_source_key) then 'updated'
                    else 'unchanged' end
  where s.import_id = p_import_id and s.status = 'validated';

  update factory_code_imports
  set inserted_count = inserted, updated_count = updated, unchanged_count = unchanged,
      status = 'completed', completed_at = now(), error_message = null
  where id = p_import_id;

  return next;
end;
$$;

revoke all on function apply_factory_code_import(uuid) from public;
grant execute on function apply_factory_code_import(uuid) to authenticated;
