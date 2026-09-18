-- Attachments may optionally belong to a document as well as a work item.
ALTER TABLE public.attachments
  ADD COLUMN IF NOT EXISTS document_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'attachments_document_id_fkey'
  ) THEN
    ALTER TABLE public.attachments
      ADD CONSTRAINT attachments_document_id_fkey
      FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_attachments_document_active
  ON public.attachments(document_id) WHERE active = true;
