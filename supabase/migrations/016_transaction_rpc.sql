-- C4: Real database transaction support via RPC
-- Provides atomic multi-step operations

-- Execute a batch of SQL statements in a single transaction
CREATE OR REPLACE FUNCTION exec_transaction(operations JSONB)
RETURNS JSONB AS $$
DECLARE
  op JSONB;
  result JSONB := '[]'::JSONB;
  row_result JSONB;
BEGIN
  -- Verify caller is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  FOR op IN SELECT * FROM jsonb_array_elements(operations)
  LOOP
    -- Execute each operation and collect results
    IF op->>'method' = 'insert' THEN
      EXECUTE format('INSERT INTO %I (%s) VALUES (%s) RETURNING id',
        op->>'table',
        (SELECT string_agg(format('%I', key), ',') FROM jsonb_each_text(op->'data')),
        (SELECT string_agg(quote_literal(value), ',') FROM jsonb_each_text(op->'data'))
      ) INTO row_result;
    ELSIF op->>'method' = 'update' THEN
      EXECUTE format('UPDATE %I SET %s WHERE id = %L RETURNING id',
        op->>'table',
        (SELECT string_agg(format('%I = %L', key, value), ',') FROM jsonb_each_text(op->'data') WHERE key != 'id'),
        op->'data'->>'id'
      ) INTO row_result;
    ELSIF op->>'method' = 'delete' THEN
      EXECUTE format('DELETE FROM %I WHERE id = %L RETURNING id',
        op->>'table',
        op->>'id'
      ) INTO row_result;
    END IF;

    result := result || COALESCE(row_result, 'null'::JSONB);
  END LOOP;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
