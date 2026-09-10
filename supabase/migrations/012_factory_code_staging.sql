-- 012_factory_code_staging.sql
-- Staging table for Factory Code imports

create table if not exists factory_code_staging (
  id uuid default gen_random_uuid() primary key,
  import_id uuid references factory_code_imports(id) on delete cascade,
  stable_source_key text not null,
  row_number integer not null,
  raw_data jsonb not null,
  factory_code text,
  factory_name text,
  factory_name_ar text,
  city text,
  region text,
  activity text,
  product text,
  hs_code text,
  registration_number text,
  status text default 'pending' check (status in ('pending', 'validated', 'inserted', 'updated', 'unchanged', 'error')),
  error_message text,
  created_at timestamp with time zone default now()
);

-- Index for fast lookup during merge
create index if not exists idx_staging_import_status on factory_code_staging(import_id, status);
create index if not exists idx_staging_key on factory_code_staging(import_id, stable_source_key);

-- RLS
alter table factory_code_staging enable row level security;

create policy "Staging visible to import owner or admin" on factory_code_staging
  for all using (
    exists (
      select 1 from factory_code_imports fi
      where fi.id = factory_code_staging.import_id
      and fi.uploaded_by = auth.uid()
    )
    or exists (
      select 1 from users u
      where u.id = auth.uid()
      and u.is_system_admin = true
    )
  );

-- Validate staging rows function
create or replace function validate_staging_rows(p_import_id uuid)
returns void as $$
begin
  update factory_code_staging
  set status = case
    when stable_source_key is null or stable_source_key = '' then 'error'
    when factory_code is null and factory_name is null then 'error'
    else 'validated'
  end,
  error_message = case
    when stable_source_key is null or stable_source_key = '' then 'Missing stable source key'
    when factory_code is null and factory_name is null then 'Both factory code and name are empty'
    else null
  end
  where import_id = p_import_id and status = 'pending';
end;
$$ language plpgsql;
