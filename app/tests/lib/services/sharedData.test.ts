import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SharedDataService, type SharedDataConflict } from '@/lib/services/sharedData'

const testState = vi.hoisted(() => ({ supabase: null as any }))

vi.mock('@/lib/supabase', () => ({
  getSupabase: vi.fn(() => testState.supabase),
}))

vi.mock('@/lib/logger', () => ({
  appLogger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}))

describe('SharedDataService', () => {
  let service: SharedDataService

  beforeEach(() => {
    vi.clearAllMocks()
    testState.supabase = {
      from: vi.fn(),
      rpc: vi.fn().mockResolvedValue({ error: null }),
    }
    service = new SharedDataService()
  })

  describe('shared fields', () => {
    it('defines material shared fields', () => {
      const fields = service.getSharedFieldDefinitions()
      expect(fields.map(field => field.key)).toEqual(expect.arrayContaining(['quantity', 'unit_price', 'currency']))
    })

    it('identifies shared and document-specific fields', () => {
      expect(service.isSharedField('quantity')).toBe(true)
      expect(service.isSharedField('incoterm')).toBe(true)
      expect(service.isSharedField('document_number')).toBe(false)
    })
  })

  describe('conflict detection', () => {
    it('returns no conflicts for matching values', () => {
      expect(service.detectConflicts(
        { quantity: 50, unit_price: 1000, currency: 'SAR' },
        { quantity: 50, unit_price: 1000, currency: 'SAR' },
      )).toEqual([])
    })

    it('returns conflicts for changed shared values', () => {
      expect(service.detectConflicts(
        { quantity: 50, unit_price: 1000, currency: 'SAR' },
        { quantity: 48, unit_price: 1050, currency: 'USD' },
      )).toHaveLength(3)
    })

    it('ignores null values and document-specific fields', () => {
      expect(service.detectConflicts(
        { quantity: 50, document_number: 'INV-001' },
        { quantity: null, document_number: 'INV-002' },
      )).toEqual([])
    })

    it('compares shared values by their string representation', () => {
      expect(service.detectConflicts({ quantity: '50' }, { quantity: 50 })).toEqual([])
    })
  })

  it('audits the project and each affected document, including a failed update', async () => {
    const project = { id: 'work-1', quantity: 50, unit_price: 1000, currency: 'SAR' }
    const documents = new Map([
      ['doc-1', { id: 'doc-1', document_data: { quantity: 50 } }],
      ['doc-2', { id: 'doc-2', document_data: { quantity: 60 } }],
    ])
    let documentUpdateCount = 0

    testState.supabase.from.mockImplementation((table: string) => {
      let id: string | undefined
      return {
        select: vi.fn(() => ({
          eq: vi.fn((_column: string, value: string) => {
            id = value
            return { single: vi.fn(async () => ({
              data: table === 'work_items' ? project : documents.get(id!),
              error: null,
            })) }
          }),
        })),
        update: vi.fn(() => ({
          eq: vi.fn(async (_column: string, value: string) => {
            if (table === 'documents') {
              documentUpdateCount++
              return { error: documentUpdateCount === 2 ? new Error('DB error') : null }
            }
            return { error: null }
          }),
        })),
      }
    })

    const conflicts: SharedDataConflict[] = [
      { fieldKey: 'quantity', fieldLabel: 'Quantity', projectValue: 50, documentValue: 55 },
    ]

    await service.synchronizeData('work-1', conflicts, ['doc-1', 'doc-2'], {
      userId: 'user-1',
      companyId: 'company-1',
      permissions: {},
      isSystemAdmin: false,
    })

    expect(testState.supabase.rpc).toHaveBeenCalledTimes(3)
    expect(testState.supabase.rpc).toHaveBeenCalledWith('record_audit_event', expect.objectContaining({
      p_company_id: 'company-1',
      p_action: 'EDIT',
      p_entity_type: 'work_item',
      p_entity_id: 'work-1',
      p_changes: expect.objectContaining({
        entityReference: expect.any(String),
        before: { quantity: 50 },
        after: { quantity: 55 },
      }),
    }))
    expect(testState.supabase.rpc).toHaveBeenCalledWith('record_audit_event', expect.objectContaining({
      p_company_id: 'company-1',
      p_action: 'EDIT',
      p_entity_type: 'document',
      p_entity_id: 'doc-1',
    }))
    expect(testState.supabase.rpc).toHaveBeenCalledWith('record_audit_event', expect.objectContaining({
      p_company_id: 'company-1',
      p_action: 'EDIT',
      p_entity_type: 'document',
      p_entity_id: 'doc-2',
      p_changes: expect.objectContaining({
        after: expect.objectContaining({ _sync_error: 'DB error' }),
      }),
    }))
  })
})
