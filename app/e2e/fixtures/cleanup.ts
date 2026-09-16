import { e2eEnvironment } from '../environment'

const SUPABASE_URL = e2eEnvironment.supabaseUrl
const SUPABASE_ANON_KEY = e2eEnvironment.supabaseAnonKey

async function supabaseDelete(table: string, filter: string) {
  if (!SUPABASE_ANON_KEY) return
  const url = `${SUPABASE_URL}/rest/v1/${table}?${filter}`
  await fetch(url, {
    method: 'DELETE',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      Prefer: 'return=minimal',
    },
  })
}

export async function cleanupTestData() {
  await supabaseDelete('todos', 'title.like.%E2E%25')
  await supabaseDelete('todos', 'title.like.%Test%25')
  await supabaseDelete('todos', 'title.like.%test%25')
  await supabaseDelete('customers', 'name.like.%E2E%25')
  await supabaseDelete('customers', 'name.like.%Test%25')
  await supabaseDelete('customers', 'name=eq.')
  await supabaseDelete('materials', 'name.like.%E2E%25')
  await supabaseDelete('materials', 'name.like.%Test%25')
  await supabaseDelete('work_items', 'name.like.%E2E%25')
  await supabaseDelete('work_items', 'name.like.%Test%25')
  await supabaseDelete('notes', 'content.like.%E2E%25')
  await supabaseDelete('report_issues', 'title.like.%E2E%25')
}

export async function cleanupAllTestData() {
  if (!SUPABASE_ANON_KEY) return
  await supabaseDelete('todos', 'neq.id.00000000-0000-0000-0000-000000000000')
  await supabaseDelete('documents', 'neq.id.00000000-0000-0000-0000-000000000000')
  await supabaseDelete('notes', 'neq.id.00000000-0000-0000-0000-000000000000')
  await supabaseDelete('report_issues', 'neq.id.00000000-0000-0000-0000-000000000000')
  await supabaseDelete('attachments', 'neq.id.00000000-0000-0000-0000-000000000000')
  await supabaseDelete('work_item_materials', 'neq.id.00000000-0000-0000-0000-000000000000')
  await supabaseDelete('work_items', 'neq.id.00000000-0000-0000-0000-000000000000')
  await supabaseDelete('materials', 'neq.id.00000000-0000-0000-0000-000000000000')
  await supabaseDelete('customers', 'name.like.%E2E%25')
  await supabaseDelete('customers', 'name.like.%Test%25')
  await supabaseDelete('customers', 'name=eq.')
  await supabaseDelete('audit_events', 'neq.id.00000000-0000-0000-0000-000000000000')
  await supabaseDelete('notifications', 'neq.id.00000000-0000-0000-0000-000000000000')
}
