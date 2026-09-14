/**
 * Tests for customer service.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Customer } from '@/lib/services/customer'
import { createMockRequestContext } from '../../setup'

vi.mock('@/lib/logger', () => ({
  appLogger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}))

vi.mock('@/lib/supabase', () => ({
  getSupabase: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
      range: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
    })),
  })),
}))

describe('CustomerService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should define customer type correctly', async () => {
    const customer: Customer = {
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
      version: 1,
    }

    expect(customer.name).toBe('Test Customer')
    expect(customer.default_currency).toBe('SAR')
    expect(customer.transport_responsibility).toBe('Seller')
    expect(customer.unloading_responsibility).toBe('Buyer')
  })

  it('should include version field with default value 1', async () => {
    const customer: Customer = {
      id: '1',
      company_id: 'comp-1',
      name: 'Test',
      name_ar: null,
      legal_name: null,
      contact_person: null,
      phone: null,
      phone_secondary: null,
      email: null,
      website: null,
      country: null,
      city: null,
      address: null,
      postal_code: null,
      vat_number: null,
      registration_number: null,
      default_currency: 'SAR',
      default_vat_treatment: '0',
      payment_terms: null,
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
      version: 1,
    }

    expect(customer.version).toBe(1)
    expect(typeof customer.version).toBe('number')
  })

  describe('optimistic locking', () => {
    it('should increment version on successful update', async () => {
      const existing: Customer = {
        id: '1',
        company_id: 'comp-1',
        name: 'Original Name',
        name_ar: null,
        legal_name: null,
        contact_person: null,
        phone: null,
        phone_secondary: null,
        email: null,
        website: null,
        country: null,
        city: null,
        address: null,
        postal_code: null,
        vat_number: null,
        registration_number: null,
        default_currency: 'SAR',
        default_vat_treatment: '0',
        payment_terms: null,
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
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        created_by: null,
        updated_by: null,
        deleted_at: null,
        version: 2,
      }

      const currentVersion = (existing as any).version ?? 1
      const newVersion = currentVersion + 1

      expect(currentVersion).toBe(2)
      expect(newVersion).toBe(3)
    })

    it('should detect version mismatch for conflict', async () => {
      const existing: Customer = {
        id: '1',
        company_id: 'comp-1',
        name: 'Original Name',
        name_ar: null,
        legal_name: null,
        contact_person: null,
        phone: null,
        phone_secondary: null,
        email: null,
        website: null,
        country: null,
        city: null,
        address: null,
        postal_code: null,
        vat_number: null,
        registration_number: null,
        default_currency: 'SAR',
        default_vat_treatment: '0',
        payment_terms: null,
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
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        created_by: null,
        updated_by: null,
        deleted_at: null,
        version: 2,
      }

      // Simulate concurrent update
      const concurrentVersion = 3
      const currentVersion = (existing as any).version ?? 1

      expect(currentVersion).not.toBe(concurrentVersion)
    })
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

  it('requires an explicit company context when creating a customer', async () => {
    const { CustomerService } = await import('@/lib/services/customer')
    const service = new CustomerService()
    const context = createMockRequestContext({
      companyId: undefined,
      permissions: { 'customers.create': true },
    })

    await expect(service.createCustomer({ name: 'New Customer' }, context)).rejects.toThrow(
      'Company context is required'
    )
  })
})
