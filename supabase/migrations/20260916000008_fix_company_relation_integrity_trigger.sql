-- ============================================================================
-- SANAD V1 — 023: Fix enforce_company_relation_integrity trigger
-- ============================================================================
-- BUG: Original trigger checked new.document_id for ALL records including notes,
-- report_issues, and todos — which lack that column. This caused a runtime error
-- whenever a note, issue, or todo was inserted.
--
-- FIX: Split into separate IF branches:
--   - notes|report_issues|todos: check via work_item_id → work_items.company_id
--   - attachments: check via document_id → documents.company_id
-- ============================================================================

CREATE OR REPLACE FUNCTION public.enforce_company_relation_integrity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_company_id UUID;
  v_work_item_id UUID;
BEGIN
  IF TG_TABLE_NAME IN ('notes', 'report_issues', 'todos') THEN
    IF NEW.work_item_id IS NULL THEN
      RETURN NEW;
    END IF;

    SELECT wi.company_id INTO v_company_id
    FROM public.work_items wi
    WHERE wi.id = NEW.work_item_id;

    IF v_company_id IS NULL THEN
      RAISE EXCEPTION 'Work item not found: %', NEW.work_item_id;
    END IF;

    IF NEW.company_id IS NOT NULL AND NEW.company_id != v_company_id THEN
      RAISE EXCEPTION 'Company mismatch: record company % vs work item company %',
        NEW.company_id, v_company_id;
    END IF;

    NEW.company_id := v_company_id;

  ELSIF TG_TABLE_NAME = 'attachments' THEN
    IF NEW.document_id IS NOT NULL THEN
      SELECT d.company_id INTO v_company_id
      FROM public.documents d
      WHERE d.id = NEW.document_id;

      IF v_company_id IS NULL THEN
        RAISE EXCEPTION 'Document not found: %', NEW.document_id;
      END IF;

      NEW.company_id := v_company_id;
    ELSIF NEW.work_item_id IS NOT NULL THEN
      SELECT wi.company_id INTO v_company_id
      FROM public.work_items wi
      WHERE wi.id = NEW.work_item_id;

      IF v_company_id IS NULL THEN
        RAISE EXCEPTION 'Work item not found: %', NEW.work_item_id;
      END IF;

      NEW.company_id := v_company_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
