/**
 * Tests for customer service.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/logger', () => ({
  appLogger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}))

describe('CustomerService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should define customer type correctly', async () => {
    const customer: import('@/lib/services/customer').Customer = {
      id: '1',
      company_id: 'comp-1',
      name: 'Test Customer',
      name_ar: null,
      legal_name: null,
      contact_person: 'John Doe',
      phone: '+1234567890',
      phone_secondary: null,
      email: 'john@example.com',
      website: null,
      country: 'US',
      city: 'New York',
      address: '123 Main St',
      postal_code: '10001',
      vat_number: null,
      registration_number: null,
      default_currency: 'SAR',
      default_vat_treatment: '0',
      payment_terms: 'Net 30',
      payment_method_notes: null,
      default_incoterm: null,
      delivery_terms: null,
      default_document_language: 'en',
      default_document_template: null,
      commercial_notes: null,
      default_dest_country: null,
      default_dest_city: null,
      default_port: null,
      transport_responsibility: 'Seller',
      loading_responsibility: 'Seller',
      unloading_responsibility: 'Buyer',
      default_consignee: null,
      default_notify_party: null,
      packing_instructions: null,
      shipping_notes: null,
      special_handling: null,
      notes: null,
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: null,
      updated_by: null,
      deleted_at: null,
    }

    expect(customer.name).toBe('Test Customer')
    expect(customer.default_currency).toBe('SAR')
    expect(customer.transport_responsibility).toBe('Seller')
    expect(customer.unloading_responsibility).toBe('Buyer')
  })

  it('should define create input correctly', async () => {
    const input: import('@/lib/services/customer').CreateCustomerInput = {
      name: 'New Customer',
      contact_person: 'Jane Doe',
      phone: '+1234567890',
      email: 'jane@example.com',
      country: 'US',
      default_currency: 'USD',
      payment_terms: 'Net 45',
      default_dest_country: 'US',
      transport_responsibility: 'Buyer',
    }

    expect(input.name).toBe('New Customer')
    expect(input.default_currency).toBe('USD')
    expect(input.transport_responsibility).toBe('Buyer')
  })
})
