-- RLS helpers retain their existing privileged behavior with an immutable lookup path.
CREATE OR REPLACE FUNCTION public.user_has_company_access(p_user_id uuid, p_company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.company_memberships
    WHERE user_id = p_user_id
      AND company_id = p_company_id
      AND active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.user_is_company_admin(p_user_id uuid, p_company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.company_memberships
    WHERE user_id = p_user_id
      AND company_id = p_company_id
      AND base_role = 'admin'
      AND active = true
  );
$$;
