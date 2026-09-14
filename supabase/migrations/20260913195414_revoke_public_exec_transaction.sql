-- Containment: this generic SECURITY DEFINER mutation RPC bypasses table RLS.
REVOKE EXECUTE ON FUNCTION public.exec_transaction(jsonb) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.exec_transaction(jsonb) FROM anon;
REVOKE EXECUTE ON FUNCTION public.exec_transaction(jsonb) FROM authenticated;
