drop policy if exists memberships_read on public.company_memberships;

create policy memberships_read
on public.company_memberships
for select
to public
using (
  user_id = auth.uid()
  or public.user_is_company_admin(auth.uid(), company_id)
  or exists (
    select 1
    from public.users
    where id = auth.uid()
      and is_system_admin = true
  )
);
