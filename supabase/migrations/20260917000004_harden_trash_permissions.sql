drop policy if exists trash_entries_write on public.trash_entries;

create policy trash_entries_insert
on public.trash_entries
for insert
to public
with check (
  case entity_type
    when 'project' then public.check_user_permission(auth.uid(), company_id, 'projects.delete')
    when 'task' then public.check_user_permission(auth.uid(), company_id, 'tasks.delete')
    when 'customer' then public.check_user_permission(auth.uid(), company_id, 'customers.delete')
    when 'material' then public.check_user_permission(auth.uid(), company_id, 'materials.delete')
    when 'document' then public.check_user_permission(auth.uid(), company_id, 'documents.delete')
    when 'attachment' then public.check_user_permission(auth.uid(), company_id, 'files.delete')
    else false
  end
);

create policy trash_entries_delete
on public.trash_entries
for delete
to public
using (public.check_user_permission(auth.uid(), company_id, 'trash.restore'));
