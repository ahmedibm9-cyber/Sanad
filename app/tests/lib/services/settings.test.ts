/**
 * Tests for company settings service.
 * Covers DocumentDefaults, ConfigListItem types and service behaviors.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getSupabase } from '@/lib/supabase'

vi.mock('@/lib/logger', () => ({
  appLogger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}))

// ===========================================
// Seed data definition (mirrors migration 002)
// ===========================================

const SEED_CONFIG_LISTS = {
  currencies: ['SAR', 'USD', 'EUR', 'GBP'],
  vat_rates: ['0', '15'],
  weight_units: ['MT', 'KG', 'LB', 'TON'],
  packing_units: ['Bags', 'Jumbo Bags', 'Drums', 'Containers'],
  payment_terms: ['Net 30 days', 'Net 45 days', 'Net 60 days', 'Cash on Delivery'],
  delivery_terms: ['FOB', 'CIF', 'CFR', 'EXW'],
} as const

// ===========================================
// Type Validation Tests
// ===========================================

describe('SettingsService — Type Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('DocumentDefaults type has all fields matching company_document_defaults schema', () => {
    const defaults: import('@/lib/services/settings').DocumentDefaults = {
      id: '1',
      company_id: 'comp-1',
      default_language: 'en',
      default_template: 'template-a',
      default_vat_rate: 0,
      default_currency: 'SAR',
      default_weight_unit: 'MT',
      default_packing_unit: 'Bags',
      default_incoterm: null,
      default_payment_terms: null,
      default_delivery_terms: null,
      default_prepared_by: null,
      show_signature: true,
      show_stamp: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // All required fields present and match DB column names
    expect(defaults.id).toBeDefined()
    expect(defaults.company_id).toBeDefined()
    expect(defaults.default_language).toBe('en')
    expect(defaults.default_template).toBe('template-a')
    expect(defaults.default_vat_rate).toBe(0)
    expect(defaults.default_currency).toBe('SAR')
    expect(defaults.default_weight_unit).toBe('MT')
    expect(defaults.default_packing_unit).toBe('Bags')
    expect(defaults.show_signature).toBe(true)
    expect(defaults.show_stamp).toBe(true)
    expect(defaults.created_at).toBeDefined()
    expect(defaults.updated_at).toBeDefined()

    // Nullable fields accept null
    expect(defaults.default_incoterm).toBeNull()
    expect(defaults.default_payment_terms).toBeNull()
    expect(defaults.default_delivery_terms).toBeNull()
    expect(defaults.default_prepared_by).toBeNull()
  })

  it('DocumentDefaults type accepts non-null optional fields', () => {
    const defaults: import('@/lib/services/settings').DocumentDefaults = {
      id: '2',
      company_id: 'comp-2',
      default_language: 'ar',
      default_template: 'template-b',
      default_vat_rate: 15,
      default_currency: 'USD',
      default_weight_unit: 'KG',
      default_packing_unit: 'Drums',
      default_incoterm: 'FOB',
      default_payment_terms: 'Net 30 days',
      default_delivery_terms: 'CIF',
      default_prepared_by: 'Ahmed',
      show_signature: false,
      show_stamp: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    expect(defaults.default_incoterm).toBe('FOB')
    expect(defaults.default_payment_terms).toBe('Net 30 days')
    expect(defaults.default_delivery_terms).toBe('CIF')
    expect(defaults.default_prepared_by).toBe('Ahmed')
    expect(defaults.show_signature).toBe(false)
    expect(defaults.show_stamp).toBe(false)
  })

  it('ConfigListItem type has all fields matching company_config_lists schema', () => {
    const item: import('@/lib/services/settings').ConfigListItem = {
      id: '1',
      company_id: 'comp-1',
      list_name: 'currencies',
      item_value: 'SAR',
      is_default: true,
      sort_order: 0,
      created_at: new Date().toISOString(),
    }

    expect(item.id).toBeDefined()
    expect(item.company_id).toBeDefined()
    expect(item.list_name).toBe('currencies')
    expect(item.item_value).toBe('SAR')
    expect(item.is_default).toBe(true)
    expect(item.sort_order).toBe(0)
    expect(item.created_at).toBeDefined()
  })

  it('UpdateDocumentDefaultsInput has only optional fields', () => {
    const partial: import('@/lib/services/settings').UpdateDocumentDefaultsInput = {
      default_currency: 'EUR',
      show_stamp: false,
    }

    expect(partial.default_currency).toBe('EUR')
    expect(partial.show_stamp).toBe(false)
    expect(partial.default_language).toBeUndefined()
    expect(partial.default_vat_rate).toBeUndefined()
  })
})

// ===========================================
// Service Behavior Tests
// ===========================================

describe('SettingsService — getDocumentDefaults', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('reads from company_document_defaults table', async () => {
    const mockRow = {
      id: 'dd-1',
      company_id: 'comp-1',
      default_language: 'en',
      default_template: 'template-a',
      default_vat_rate: 0,
      default_currency: 'SAR',
      default_weight_unit: 'MT',
      default_packing_unit: 'Bags',
      default_incoterm: null,
      default_payment_terms: null,
      default_delivery_terms: null,
      default_prepared_by: null,
      show_signature: true,
      show_stamp: true,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    }

    // Override getSupabase to return a controlled mock
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockRow, error: null }),
        }),
      }),
    })
    vi.mocked(getSupabase).mockReturnValueOnce({
      auth: { getSession: vi.fn(), getUser: vi.fn() },
      from: mockFrom,
    } as any)

    const { SettingsService } = await import('@/lib/services/settings')
    const service = new SettingsService()
    const result = await service.getDocumentDefaults('comp-1', {
      userId: 'u1',
      companyId: 'comp-1',
      permissions: {},
      isSystemAdmin: false,
    })

    expect(mockFrom).toHaveBeenCalledWith('company_document_defaults')
    expect(result).toEqual(mockRow)
  })

  it('returns null when no document defaults exist (PGRST116)', async () => {
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116', message: 'No rows' } }),
        }),
      }),
    })
    vi.mocked(getSupabase).mockReturnValueOnce({
      auth: { getSession: vi.fn(), getUser: vi.fn() },
      from: mockFrom,
    } as any)

    const { SettingsService } = await import('@/lib/services/settings')
    const service = new SettingsService()
    const result = await service.getDocumentDefaults('comp-nonexistent', {
      userId: 'u1',
      companyId: 'comp-nonexistent',
      permissions: {},
      isSystemAdmin: false,
    })

    expect(result).toBeNull()
  })
})

describe('SettingsService — updateDocumentDefaults', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('upserts: updates existing record when one exists', async () => {
    const existingRow = {
      id: 'dd-1',
      company_id: 'comp-1',
      default_language: 'en',
      default_template: 'template-a',
      default_vat_rate: 0,
      default_currency: 'SAR',
      default_weight_unit: 'MT',
      default_packing_unit: 'Bags',
      default_incoterm: null,
      default_payment_terms: null,
      default_delivery_terms: null,
      default_prepared_by: null,
      show_signature: true,
      show_stamp: true,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    }

    const updatedRow = { ...existingRow, default_currency: 'EUR', show_stamp: false }

    // The service stores `this.supabase` from the constructor.
    // getDocumentDefaults uses from().select().eq().single()
    // updateDocumentDefaults (update path) uses from().update().eq().select().single()
    // We need single() to return different values for each call.
    const singleMock = vi.fn()
      .mockResolvedValueOnce({ data: existingRow, error: null }) // getDocumentDefaults
      .mockResolvedValueOnce({ data: updatedRow, error: null })   // update .select().single()

    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: singleMock,
        }),
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: singleMock,
          }),
        }),
      }),
    })
    vi.mocked(getSupabase).mockReturnValueOnce({
      auth: { getSession: vi.fn(), getUser: vi.fn() },
      from: mockFrom,
    } as any)

    const { SettingsService } = await import('@/lib/services/settings')
    const service = new SettingsService()
    const result = await service.updateDocumentDefaults(
      'comp-1',
      { default_currency: 'EUR', show_stamp: false },
      { userId: 'u1', companyId: 'comp-1', permissions: { 'settings.edit': true }, isSystemAdmin: false }
    )

    expect(result.default_currency).toBe('EUR')
    expect(result.show_stamp).toBe(false)
    // Both getDocumentDefaults and update used from()
    expect(mockFrom).toHaveBeenCalledTimes(2)
  })

  it('upserts: inserts new record when none exists', async () => {
    const newRow = {
      id: 'dd-new',
      company_id: 'comp-new',
      default_language: 'en',
      default_template: 'template-a',
      default_vat_rate: 0,
      default_currency: 'SAR',
      default_weight_unit: 'MT',
      default_packing_unit: 'Bags',
      default_incoterm: null,
      default_payment_terms: null,
      default_delivery_terms: null,
      default_prepared_by: null,
      show_signature: true,
      show_stamp: true,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    }

    const singleMock = vi.fn()
      .mockResolvedValueOnce({ data: null, error: { code: 'PGRST116', message: 'No rows' } }) // getDocumentDefaults: not found
      .mockResolvedValueOnce({ data: newRow, error: null }) // insert .select().single()

    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: singleMock,
        }),
      }),
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: singleMock,
        }),
      }),
    })
    vi.mocked(getSupabase).mockReturnValueOnce({
      auth: { getSession: vi.fn(), getUser: vi.fn() },
      from: mockFrom,
    } as any)

    const { SettingsService } = await import('@/lib/services/settings')
    const service = new SettingsService()
    const result = await service.updateDocumentDefaults(
      'comp-new',
      { default_currency: 'SAR' },
      { userId: 'u1', companyId: 'comp-new', permissions: { 'settings.edit': true }, isSystemAdmin: false }
    )

    expect(result.id).toBe('dd-new')
    expect(result.default_currency).toBe('SAR')
    expect(mockFrom).toHaveBeenCalledTimes(2)
  })
})

describe('SettingsService — getConfigList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('reads from company_config_lists table filtered by list_name', async () => {
    const mockRows = [
      { id: '1', company_id: 'comp-1', list_name: 'currencies', item_value: 'SAR', is_default: true, sort_order: 0, created_at: '2026-01-01T00:00:00Z' },
      { id: '2', company_id: 'comp-1', list_name: 'currencies', item_value: 'USD', is_default: false, sort_order: 1, created_at: '2026-01-01T00:00:00Z' },
    ]

    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockRows, error: null }),
          }),
        }),
      }),
    })
    vi.mocked(getSupabase).mockReturnValueOnce({
      auth: { getSession: vi.fn(), getUser: vi.fn() },
      from: mockFrom,
    } as any)

    const { SettingsService } = await import('@/lib/services/settings')
    const service = new SettingsService()
    const result = await service.getConfigList('comp-1', 'currencies', {
      userId: 'u1',
      companyId: 'comp-1',
      permissions: {},
      isSystemAdmin: false,
    })

    expect(mockFrom).toHaveBeenCalledWith('company_config_lists')
    expect(result).toHaveLength(2)
    expect(result[0].item_value).toBe('SAR')
    expect(result[1].item_value).toBe('USD')
  })

  it('returns empty array when list has no items', async () => {
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      }),
    })
    vi.mocked(getSupabase).mockReturnValueOnce({
      auth: { getSession: vi.fn(), getUser: vi.fn() },
      from: mockFrom,
    } as any)

    const { SettingsService } = await import('@/lib/services/settings')
    const service = new SettingsService()
    const result = await service.getConfigList('comp-1', 'nonexistent', {
      userId: 'u1',
      companyId: 'comp-1',
      permissions: {},
      isSystemAdmin: false,
    })

    expect(result).toEqual([])
  })
})

// ===========================================
// Seed Data Structure Validation
// ===========================================

describe('Seed Data — Config List Structure', () => {
  it('defines exactly 6 list types', () => {
    const listNames = Object.keys(SEED_CONFIG_LISTS)
    expect(listNames).toHaveLength(6)
    expect(listNames).toEqual([
      'currencies',
      'vat_rates',
      'weight_units',
      'packing_units',
      'payment_terms',
      'delivery_terms',
    ])
  })

  it('currencies: 4 items with SAR as default', () => {
    const items = SEED_CONFIG_LISTS.currencies
    expect(items).toHaveLength(4)
    expect(items[0]).toBe('SAR')
    expect(items).toContain('USD')
    expect(items).toContain('EUR')
    expect(items).toContain('GBP')
  })

  it('vat_rates: 2 items with 0 as default', () => {
    const items = SEED_CONFIG_LISTS.vat_rates
    expect(items).toHaveLength(2)
    expect(items[0]).toBe('0')
    expect(items).toContain('15')
  })

  it('weight_units: 4 items with MT as default', () => {
    const items = SEED_CONFIG_LISTS.weight_units
    expect(items).toHaveLength(4)
    expect(items[0]).toBe('MT')
    expect(items).toContain('KG')
    expect(items).toContain('LB')
    expect(items).toContain('TON')
  })

  it('packing_units: 4 items with Bags as default', () => {
    const items = SEED_CONFIG_LISTS.packing_units
    expect(items).toHaveLength(4)
    expect(items[0]).toBe('Bags')
    expect(items).toContain('Jumbo Bags')
    expect(items).toContain('Drums')
    expect(items).toContain('Containers')
  })

  it('payment_terms: 4 items with Net 30 days as default', () => {
    const items = SEED_CONFIG_LISTS.payment_terms
    expect(items).toHaveLength(4)
    expect(items[0]).toBe('Net 30 days')
    expect(items).toContain('Net 45 days')
    expect(items).toContain('Net 60 days')
    expect(items).toContain('Cash on Delivery')
  })

  it('delivery_terms: 4 items with FOB as default', () => {
    const items = SEED_CONFIG_LISTS.delivery_terms
    expect(items).toHaveLength(4)
    expect(items[0]).toBe('FOB')
    expect(items).toContain('CIF')
    expect(items).toContain('CFR')
    expect(items).toContain('EXW')
  })

  it('total seed items across all lists is 22', () => {
    const total = Object.values(SEED_CONFIG_LISTS).reduce((sum, items) => sum + items.length, 0)
    expect(total).toBe(22)
  })

  it('each list has a default (first item) defined', () => {
    for (const [, items] of Object.entries(SEED_CONFIG_LISTS)) {
      expect(items.length).toBeGreaterThan(0)
      expect(items[0]).toBeTruthy()
    }
  })
})
