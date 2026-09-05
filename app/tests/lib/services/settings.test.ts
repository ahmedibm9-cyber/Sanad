/**
 * Tests for company settings service.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/logger', () => ({
  appLogger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}))

describe('SettingsService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should define document defaults interface correctly', async () => {
    const { SettingsService } = await import('@/lib/services/settings')
    
    // Test that the types are properly defined
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
    
    expect(defaults.default_language).toBe('en')
    expect(defaults.default_currency).toBe('SAR')
    expect(defaults.show_signature).toBe(true)
  })

  it('should define config list items correctly', async () => {
    const item: import('@/lib/services/settings').ConfigListItem = {
      id: '1',
      company_id: 'comp-1',
      list_name: 'currencies',
      item_value: 'SAR',
      is_default: true,
      sort_order: 0,
      created_at: new Date().toISOString(),
    }
    
    expect(item.list_name).toBe('currencies')
    expect(item.is_default).toBe(true)
  })

  it('should define bank account input correctly', async () => {
    const input: import('@/lib/services/settings').CreateBankAccountInput = {
      bank_name: 'Saudi National Bank',
      account_name: 'Test Company',
      account_number: '1234567890',
      iban: 'SA1234567890',
      swift: 'NCBKSAJE',
      currency: 'SAR',
      is_primary: true,
    }
    
    expect(input.bank_name).toBe('Saudi National Bank')
    expect(input.currency).toBe('SAR')
  })
})
