-- A company-scoped child must never point to a parent owned by another company.
create or replace function public.enforce_company_relation_integrity()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if tg_table_name = 'work_items' then
    if new.customer_id is not null and not exists (select 1 from public.customers where id = new.customer_id and company_id = new.company_id) then
      raise exception 'Customer must belong to the same company';
    end if;
    if new.parent_id is not null and not exists (select 1 from public.work_items where id = new.parent_id and company_id = new.company_id) then
      raise exception 'Parent work item must belong to the same company';
    end if;
  elsif tg_table_name = 'documents' then
    if not exists (select 1 from public.work_items where id = new.work_item_id and company_id = new.company_id) then
      raise exception 'Work item must belong to the same company';
    end if;
    if new.customer_id is not null and not exists (select 1 from public.customers where id = new.customer_id and company_id = new.company_id) then
      raise exception 'Customer must belong to the same company';
    end if;
  elsif tg_table_name in ('notes', 'report_issues', 'attachments', 'todos') then
    if new.work_item_id is not null and not exists (select 1 from public.work_items where id = new.work_item_id and company_id = new.company_id) then
      raise exception 'Work item must belong to the same company';
    end if;
    if tg_table_name = 'attachments' and new.document_id is not null and not exists (select 1 from public.documents where id = new.document_id and company_id = new.company_id) then
      raise exception 'Document must belong to the same company';
    end if;
  elsif tg_table_name in ('material_files', 'material_price_events') then
    if not exists (select 1 from public.materials where id = new.material_id and company_id = new.company_id) then
      raise exception 'Material must belong to the same company';
    end if;
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
    select 1
    from public.work_items work_item
    join public.materials material on material.company_id = work_item.company_id
    where work_item.id = new.work_item_id and material.id = new.material_id
  ) then
    raise exception 'Work item and material must belong to the same company';
  end if;
  return new;
end;
$$;

drop trigger if exists work_items_company_relation_integrity on public.work_items;
create trigger work_items_company_relation_integrity before insert or update on public.work_items for each row execute function public.enforce_company_relation_integrity();
drop trigger if exists documents_company_relation_integrity on public.documents;
create trigger documents_company_relation_integrity before insert or update on public.documents for each row execute function public.enforce_company_relation_integrity();
drop trigger if exists notes_company_relation_integrity on public.notes;
create trigger notes_company_relation_integrity before insert or update on public.notes for each row execute function public.enforce_company_relation_integrity();
drop trigger if exists report_issues_company_relation_integrity on public.report_issues;
create trigger report_issues_company_relation_integrity before insert or update on public.report_issues for each row execute function public.enforce_company_relation_integrity();
drop trigger if exists attachments_company_relation_integrity on public.attachments;
create trigger attachments_company_relation_integrity before insert or update on public.attachments for each row execute function public.enforce_company_relation_integrity();
drop trigger if exists todos_company_relation_integrity on public.todos;
create trigger todos_company_relation_integrity before insert or update on public.todos for each row execute function public.enforce_company_relation_integrity();
drop trigger if exists material_files_company_relation_integrity on public.material_files;
create trigger material_files_company_relation_integrity before insert or update on public.material_files for each row execute function public.enforce_company_relation_integrity();
drop trigger if exists material_price_events_company_relation_integrity on public.material_price_events;
create trigger material_price_events_company_relation_integrity before insert or update on public.material_price_events for each row execute function public.enforce_company_relation_integrity();
drop trigger if exists work_item_materials_company_relation_integrity on public.work_item_materials;
create trigger work_item_materials_company_relation_integrity before insert or update on public.work_item_materials for each row execute function public.enforce_work_item_material_company_integrity();
