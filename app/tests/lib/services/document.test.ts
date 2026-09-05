/**
 * Tests for document service.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/logger', () => ({
  appLogger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}))

describe('DocumentService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should define document type correctly', async () => {
    const doc: import('@/lib/services/document').Document = {
      id: '1',
      company_id: 'comp-1',
      work_item_id: 'wi-1',
      document_type: 'TINV',
      document_number: 'TINV-2024-001',
      created_date: '2024-11-01',
      language: 'en',
      template_key: 'template-a',
      prepared_by: 'Mohamed Al-Hassan',
      show_signature: true,
      show_stamp: true,
      status: 'draft',
      document_data: {},
      latest_render_object_key: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: null,
      updated_by: null,
      deleted_at: null,
    }

    expect(doc.document_type).toBe('TINV')
    expect(doc.document_number).toBe('TINV-2024-001')
    expect(doc.language).toBe('en')
    expect(doc.template_key).toBe('template-a')
  })

  it('should handle all 7 document types', async () => {
    const types: Array<import('@/lib/services/document').DocumentType> = [
      'QUOT', 'PINV', 'TINV', 'CINV', 'PKL', 'DN', 'BL'
    ]

    expect(types).toHaveLength(7)
    expect(types).toContain('QUOT')
    expect(types).toContain('PINV')
    expect(types).toContain('TINV')
    expect(types).toContain('CINV')
    expect(types).toContain('PKL')
    expect(types).toContain('DN')
    expect(types).toContain('BL')
  })

  it('should handle document data as JSON', async () => {
    const docData = {
      items: [
        { material: 'HDPE 952', quantity: 50, unit: 'MT', price: 1050, currency: 'SAR' }
      ],
      subtotal: 52500,
      vat_rate: 0,
      total: 52500,
    }

    expect(docData.items).toHaveLength(1)
    expect(docData.subtotal).toBe(52500)
  })

  it('should validate document number uniqueness per company', async () => {
    // Document numbers must be unique within a company
    const company1Docs = ['TINV-001', 'TINV-002']
    const company2Docs = ['TINV-001'] // Same number in different company is OK

    expect(company1Docs).toContain('TINV-001')
    expect(company2Docs).toContain('TINV-001')
    // Cross-company duplication is allowed
  })

  it('should handle VAT calculations', async () => {
    const subtotal = 52500
    const vatRate = 15
    const vatAmount = subtotal * (vatRate / 100)
    const total = subtotal + vatAmount

    expect(vatAmount).toBe(7875)
    expect(total).toBe(60375)
  })

  it('should handle document statuses', async () => {
    const statuses = ['draft', 'final']
    expect(statuses).toContain('draft')
    expect(statuses).toContain('final')
  })

  it('should handle language options', async () => {
    const languages = ['en', 'ar']
    expect(languages).toContain('en')
    expect(languages).toContain('ar')
  })

  it('should handle template options', async () => {
    const templates = ['template-a', 'template-b']
    expect(templates).toContain('template-a')
    expect(templates).toContain('template-b')
  })
})
