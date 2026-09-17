/**
 * Behavioral tests for DocumentService.
 * Tests actual service methods against mocked Supabase.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Document } from '@/lib/services/document'
import type { RequestContext } from '@/lib/api'

// ── Queue-based Supabase Mock ────────────────────────
// The service chains .from().select().eq()...single() synchronously,
// so we can't set up mocks after calling the service. Instead, we use
// a queue: each from() call pops the next queued result.

const singleQueue: Array<{ data: any; error: any }> = []

function createChain() {
  const chain: any = {}

  chain.select = vi.fn(() => chain)
  chain.insert = vi.fn(() => chain)
  chain.update = vi.fn(() => chain)
  chain.delete = vi.fn(() => chain)
  chain.eq = vi.fn(() => chain)
  chain.neq = vi.fn(() => chain)
  chain.is = vi.fn(() => chain)
  chain.order = vi.fn(() => chain)
  chain.range = vi.fn(() => chain)
  chain.single = vi.fn(() => {
    const next = singleQueue.shift()
    return Promise.resolve(next ?? { data: null, error: null })
  })
  // Make chain thenable so `await query` works (for getDocuments/getCompanyDocuments)
  chain.then = (onFulfilled: any, onRejected: any) => {
    const next = singleQueue.shift()
    return Promise.resolve(next ?? { data: null, error: null }).then(onFulfilled, onRejected)
  }
  return chain
}

vi.mock('@/lib/supabase', () => ({
  getSupabase: vi.fn(() => ({
    from: vi.fn(() => createChain()),
  })),
}))

vi.mock('@/lib/logger', () => ({
  appLogger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}))

// ── Import after mocks ────────────────────────────────
import { DocumentService } from '@/lib/services/document'

// ── Fixtures ──────────────────────────────────────────
const companyCtx: RequestContext = {
  userId: 'user-1',
  companyId: 'comp-1',
  permissions: { 'documents.create': true, 'documents.edit': true, 'documents.view': true, 'documents.delete': true },
  isSystemAdmin: false,
}

const existingDoc: Document = {
  id: 'doc-1',
  company_id: 'comp-1',
  work_item_id: 'wi-1',
  document_type: 'TINV',
  document_number: 'TINV-2024-001',
  created_date: '2024-01-01',
  language: 'en',
  template_key: 'fulla-tax-invoice-a-680',
  prepared_by: 'Test User',
  show_signature: true,
  show_stamp: true,
  status: 'draft',
  document_data: {},
  latest_render_object_key: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  created_by: 'user-1',
  updated_by: 'user-1',
  deleted_at: null,
  version: 1,
}

function enqueue(...results: Array<{ data: any; error: any }>) {
  singleQueue.push(...results)
}

// ── Tests ─────────────────────────────────────────────
describe('DocumentService — Behavioral Tests', () => {
  let service: DocumentService

  beforeEach(() => {
    vi.clearAllMocks()
    singleQueue.length = 0
    service = new DocumentService()
  })

  // ── createDocument ─────────────────────────────────
  describe('createDocument', () => {
    it('should create document when number is unique', async () => {
      // Queue: uniqueness check (null = no duplicate), then insert result
      enqueue(
        { data: null, error: null },
        { data: { ...existingDoc, id: 'doc-new' }, error: null }
      )

      const result = await service.createDocument(
        { document_type: 'TINV', document_number: 'TINV-2024-001', work_item_id: 'wi-1' },
        companyCtx
      )

      expect(result.id).toBe('doc-new')
    })

    it('should reject duplicate document number within same company', async () => {
      enqueue({ data: { id: 'existing-doc' }, error: null })

      await expect(
        service.createDocument(
          { document_type: 'TINV', document_number: 'TINV-2024-001', work_item_id: 'wi-1' },
          companyCtx
        )
      ).rejects.toThrow('already exists')
    })

    it('should allow same number in different company', async () => {
      const ctx2: RequestContext = { ...companyCtx, companyId: 'comp-2' }
      enqueue(
        { data: null, error: null },
        { data: { ...existingDoc, company_id: 'comp-2', id: 'doc-new' }, error: null }
      )

      const result = await service.createDocument(
        { document_type: 'TINV', document_number: 'TINV-2024-001', work_item_id: 'wi-1' },
        ctx2
      )

      expect(result.id).toBe('doc-new')
    })

    it('should require documents.create permission', async () => {
      const noPermCtx: RequestContext = { ...companyCtx, permissions: {} }
      await expect(
        service.createDocument({ document_type: 'QUOT', document_number: 'QUOT-001' }, noPermCtx)
      ).rejects.toThrow('Permission denied')
    })
  })

  // ── updateDocument ─────────────────────────────────
  describe('updateDocument', () => {
    it('should update document successfully', async () => {
      enqueue(
        { data: existingDoc, error: null },
        { data: { ...existingDoc, version: 2 }, error: null }
      )

      const result = await service.updateDocument('doc-1', { status: 'final' }, companyCtx)
      expect(result.version).toBe(2)
    })

    it('should reject duplicate number when changing document number', async () => {
      enqueue(
        { data: existingDoc, error: null },
        { data: { id: 'other-doc' }, error: null }
      )

      await expect(
        service.updateDocument('doc-1', { document_number: 'TINV-2024-999' }, companyCtx)
      ).rejects.toThrow('already exists')
    })

    it('should allow keeping same document number', async () => {
      enqueue(
        { data: existingDoc, error: null },
        { data: { ...existingDoc, version: 2 }, error: null }
      )

      const result = await service.updateDocument('doc-1', { document_number: 'TINV-2024-001' }, companyCtx)
      expect(result.version).toBe(2)
    })

    it('should require documents.edit permission', async () => {
      const noPermCtx: RequestContext = { ...companyCtx, permissions: {} }
      await expect(service.updateDocument('doc-1', { status: 'final' }, noPermCtx)).rejects.toThrow('Permission denied')
    })
  })

  // ── deleteDocument ─────────────────────────────────
  describe('deleteDocument', () => {
    it('should soft-delete document', async () => {
      enqueue({ data: existingDoc, error: null })

      await expect(service.deleteDocument('doc-1', companyCtx)).resolves.not.toThrow()
    })

    it('should require documents.delete permission', async () => {
      const noPermCtx: RequestContext = { ...companyCtx, permissions: {} }
      await expect(service.deleteDocument('doc-1', noPermCtx)).rejects.toThrow('Permission denied')
    })
  })

  // ── getDocuments ───────────────────────────────────
  describe('getDocuments', () => {
    it('should return documents for a work item', async () => {
      enqueue({ data: [existingDoc], error: null })

      const result = await service.getDocuments('wi-1', companyCtx)
      expect(result).toHaveLength(1)
      expect(result[0].work_item_id).toBe('wi-1')
    })

    it('should require documents.view permission', async () => {
      const noPermCtx: RequestContext = { ...companyCtx, permissions: {} }
      await expect(service.getDocuments('wi-1', noPermCtx)).rejects.toThrow('Permission denied')
    })
  })

  // ── getCompanyDocuments ────────────────────────────
  describe('getCompanyDocuments', () => {
    it('should return paginated company documents', async () => {
      enqueue({ data: [existingDoc], error: null, count: 1 })

      const result = await service.getCompanyDocuments(companyCtx, { page: 1, pageSize: 20 })
      expect(result.data).toHaveLength(1)
    })

    it('should require documents.view permission', async () => {
      const noPermCtx: RequestContext = { ...companyCtx, permissions: {} }
      await expect(service.getCompanyDocuments(noPermCtx)).rejects.toThrow('Permission denied')
    })
  })

  // ── UAT #48: Document Number Uniqueness ───────────
  describe('Document Number Uniqueness (UAT #48)', () => {
    it('Company A → CINV-100 succeeds', async () => {
      enqueue(
        { data: null, error: null },
        { data: { ...existingDoc, document_number: 'CINV-100' }, error: null }
      )

      const result = await service.createDocument(
        { document_type: 'CINV', document_number: 'CINV-100' },
        companyCtx
      )
      expect(result.document_number).toBe('CINV-100')
    })

    it('Company A → CINV-100 again is rejected', async () => {
      enqueue({ data: { id: 'existing' }, error: null })

      await expect(
        service.createDocument({ document_type: 'CINV', document_number: 'CINV-100' }, companyCtx)
      ).rejects.toThrow('already exists')
    })

    it('Company B → CINV-100 succeeds (different company)', async () => {
      const ctxB: RequestContext = { ...companyCtx, companyId: 'comp-B' }
      enqueue(
        { data: null, error: null },
        { data: { ...existingDoc, company_id: 'comp-B', document_number: 'CINV-100' }, error: null }
      )

      const result = await service.createDocument(
        { document_type: 'CINV', document_number: 'CINV-100' },
        ctxB
      )
      expect(result.document_number).toBe('CINV-100')
    })

    it('Edit same document with same number succeeds', async () => {
      enqueue(
        { data: existingDoc, error: null },
        { data: { ...existingDoc, version: 2 }, error: null }
      )

      const result = await service.updateDocument('doc-1', { document_number: 'TINV-2024-001' }, companyCtx)
      expect(result.version).toBe(2)
    })
  })
})
