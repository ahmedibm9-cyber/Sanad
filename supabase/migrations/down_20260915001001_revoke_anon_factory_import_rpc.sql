-- DOWN Migration: Reverse revoke anon factory import RPC

-- Re-grant to anon and revoke from authenticated
REVOKE ALL ON FUNCTION apply_factory_code_import(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION apply_factory_code_import(uuid) TO anon;
GRANT EXECUTE ON FUNCTION apply_factory_code_import(uuid) TO authenticated;
