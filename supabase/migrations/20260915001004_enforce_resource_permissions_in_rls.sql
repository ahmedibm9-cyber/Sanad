-- Browser service checks are advisory; direct Data API mutations must use the
-- same per-resource permissions.
insert into public.permission_catalog (permission_key, group_name, description_en, description_ar, is_critical, sort_order)
values
  ('files.upload', 'Files', 'Upload files', 'رفع الملفات', false, 63),
  ('files.delete', 'Files', 'Delete files', 'حذف الملفات', false, 64)
on conflict (permission_key) do nothing;

drop policy if exists "Company members can manage customers" on public.customers;
create policy customers_insert on public.customers for insert with check (public.check_user_permission(auth.uid(), company_id, 'customers.create'));
create policy customers_update on public.customers for update using (public.check_user_permission(auth.uid(), company_id, 'customers.edit')) with check (public.check_user_permission(auth.uid(), company_id, 'customers.edit'));
create policy customers_delete on public.customers for delete using (public.check_user_permission(auth.uid(), company_id, 'customers.delete'));

drop policy if exists "Company members can manage materials" on public.materials;
create policy materials_insert on public.materials for insert with check (public.check_user_permission(auth.uid(), company_id, 'materials.create'));
create policy materials_update on public.materials for update using (public.check_user_permission(auth.uid(), company_id, 'materials.edit')) with check (public.check_user_permission(auth.uid(), company_id, 'materials.edit'));
create policy materials_delete on public.materials for delete using (public.check_user_permission(auth.uid(), company_id, 'materials.delete'));

drop policy if exists "Company members can manage documents" on public.documents;
create policy documents_insert on public.documents for insert with check (public.check_user_permission(auth.uid(), company_id, 'documents.create'));
create policy documents_update on public.documents for update using (public.check_user_permission(auth.uid(), company_id, 'documents.edit')) with check (public.check_user_permission(auth.uid(), company_id, 'documents.edit'));
create policy documents_delete on public.documents for delete using (public.check_user_permission(auth.uid(), company_id, 'documents.delete'));

drop policy if exists "Company members can manage attachments" on public.attachments;
drop policy if exists attachments_insert on public.attachments;
drop policy if exists attachments_update on public.attachments;
drop policy if exists attachments_delete on public.attachments;
create policy attachments_insert on public.attachments for insert with check (public.check_user_permission(auth.uid(), company_id, 'files.upload'));
create policy attachments_update on public.attachments for update using (public.check_user_permission(auth.uid(), company_id, 'files.upload')) with check (public.check_user_permission(auth.uid(), company_id, 'files.upload'));
create policy attachments_delete on public.attachments for delete using (public.check_user_permission(auth.uid(), company_id, 'files.delete'));

drop policy if exists "Company members can manage work_items" on public.work_items;
create policy work_items_insert on public.work_items for insert with check (
  case when type = 'project' then public.check_user_permission(auth.uid(), company_id, 'projects.create')
       else public.check_user_permission(auth.uid(), company_id, 'tasks.create') end
);
create policy work_items_update on public.work_items for update using (
  case when type = 'project' then public.check_user_permission(auth.uid(), company_id, 'projects.edit')
       else public.check_user_permission(auth.uid(), company_id, 'tasks.edit') end
) with check (
  case when type = 'project' then public.check_user_permission(auth.uid(), company_id, 'projects.edit')
       else public.check_user_permission(auth.uid(), company_id, 'tasks.edit') end
);
create policy work_items_delete on public.work_items for delete using (
  case when type = 'project' then public.check_user_permission(auth.uid(), company_id, 'projects.delete')
       else public.check_user_permission(auth.uid(), company_id, 'tasks.delete') end
);
