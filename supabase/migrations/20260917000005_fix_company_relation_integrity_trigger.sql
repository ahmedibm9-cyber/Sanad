create or replace function public.enforce_company_relation_integrity()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  parent_company_id uuid;
begin
  if tg_table_name = 'todos' then
    return new;
  end if;

  if tg_table_name = 'work_items' then
    if new.customer_id is not null and not exists (
      select 1 from public.customers where id = new.customer_id and company_id = new.company_id
    ) then
      raise exception 'Customer must belong to the same company';
    end if;
    if new.parent_id is not null and not exists (
      select 1 from public.work_items where id = new.parent_id and company_id = new.company_id
    ) then
      raise exception 'Parent work item must belong to the same company';
    end if;
    return new;
  end if;

  if tg_table_name = 'documents' then
    if not exists (
      select 1 from public.work_items where id = new.work_item_id and company_id = new.company_id
    ) then
      raise exception 'Work item must belong to the same company';
    end if;
    return new;
  end if;

  if tg_table_name in ('notes', 'report_issues', 'attachments') then
    select company_id into parent_company_id
    from public.work_items
    where id = new.work_item_id;

    if parent_company_id is null then
      raise exception 'Work item not found: %', new.work_item_id;
    end if;
    if parent_company_id <> new.company_id then
      raise exception 'Company mismatch with work item';
    end if;

    if tg_table_name = 'attachments' and new.document_id is not null and not exists (
      select 1 from public.documents where id = new.document_id and company_id = new.company_id
    ) then
      raise exception 'Document must belong to the same company';
    end if;
    return new;
  end if;

  if tg_table_name in ('material_files', 'material_price_events') then
    if not exists (
      select 1 from public.materials where id = new.material_id and company_id = new.company_id
    ) then
      raise exception 'Material must belong to the same company';
    end if;
    return new;
  end if;

  return new;
end;
$$;

create or replace function public.enforce_work_item_material_company_integrity()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if not exists (
    select 1 from public.work_items where id = new.work_item_id and company_id = new.company_id
  ) then
    raise exception 'Work item must belong to the same company';
  end if;

  if new.material_id is not null and not exists (
    select 1 from public.materials where id = new.material_id and company_id = new.company_id
  ) then
    raise exception 'Material must belong to the same company';
  end if;

  return new;
end;
$$;
