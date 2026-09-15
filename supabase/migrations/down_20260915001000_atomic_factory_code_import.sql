-- DOWN Migration: Reverse atomic factory code import

-- Re-grant permissions to public and revoke from authenticated
REVOKE ALL ON FUNCTION apply_factory_code_import(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION apply_factory_code_import(uuid) TO public;

-- Drop the function
DROP FUNCTION IF EXISTS apply_factory_code_import(uuid);
