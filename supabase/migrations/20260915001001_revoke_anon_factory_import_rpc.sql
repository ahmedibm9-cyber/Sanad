-- Only authenticated users may invoke the Factory Code import RPC.
revoke all on function apply_factory_code_import(uuid) from anon;
grant execute on function apply_factory_code_import(uuid) to authenticated;
