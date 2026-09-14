-- Disabled users and unauthenticated callers must not satisfy tenant RLS checks.
create or replace function public.user_has_company_access(p_user_id uuid, p_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.company_memberships membership
    join public.users account on account.id = membership.user_id
    where membership.user_id = p_user_id
      and membership.company_id = p_company_id
      and membership.active = true
      and account.active = true
  );
$$;

create or replace function public.user_is_company_admin(p_user_id uuid, p_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.company_memberships membership
    join public.users account on account.id = membership.user_id
    where membership.user_id = p_user_id
      and membership.company_id = p_company_id
      and membership.base_role = 'admin'
      and membership.active = true
      and account.active = true
  );
$$;
