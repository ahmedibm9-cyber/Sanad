-- DOWN Migration: Reverse enforce company relation integrity

-- Drop triggers
DROP TRIGGER IF EXISTS work_items_company_relation_integrity ON public.work_items;
DROP TRIGGER IF EXISTS documents_company_relation_integrity ON public.documents;
DROP TRIGGER IF EXISTS notes_company_relation_integrity ON public.notes;
DROP TRIGGER IF EXISTS report_issues_company_relation_integrity ON public.report_issues;
DROP TRIGGER IF EXISTS attachments_company_relation_integrity ON public.attachments;
DROP TRIGGER IF EXISTS todos_company_relation_integrity ON public.todos;
DROP TRIGGER IF EXISTS material_files_company_relation_integrity ON public.material_files;
DROP TRIGGER IF EXISTS material_price_events_company_relation_integrity ON public.material_price_events;
DROP TRIGGER IF EXISTS work_item_materials_company_relation_integrity ON public.work_item_materials;

-- Drop functions
DROP FUNCTION IF EXISTS public.enforce_company_relation_integrity();
DROP FUNCTION IF EXISTS public.enforce_work_item_material_company_integrity();
