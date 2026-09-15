-- DOWN Migration: Reverse revoke public rls_auto_enable

-- Re-grant EXECUTE on rls_auto_enable to PUBLIC
GRANT EXECUTE ON FUNCTION public.rls_auto_enable() TO PUBLIC;
