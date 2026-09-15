-- DOWN Migration: Reverse harden active user access

-- Restore user_has_company_access without account.active check
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

-- Restore user_is_company_admin without account.active check
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
