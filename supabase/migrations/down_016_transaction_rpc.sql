-- DOWN Migration 016: Reverse Transaction RPC

DROP FUNCTION IF EXISTS exec_transaction(JSONB);
