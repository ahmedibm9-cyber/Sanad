-- DOWN Migration: Reverse revoke public exec_transaction

-- Re-grant EXECUTE on exec_transaction to PUBLIC
GRANT EXECUTE ON FUNCTION public.exec_transaction(jsonb) TO PUBLIC;
