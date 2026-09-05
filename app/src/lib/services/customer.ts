/**
 * Customer service for SANAD application.
 * 
 * Handles customer CRUD operations with company isolation.
 */

import { getSupabase, type Database } from '../supabase'
import { type RequestContext, requirePermission, hasPermission } from '../api'
import { NotFoundError, handleSupabaseError } from '../errors'
import { appLogger } from '../logger'
import type { SupabaseClient } from '@supabase/supabase-js'

// ===========================================
// Types
// ===========================================

export interface Customer {
  id: string
  company_id: string
  name: string
  name_ar: string | null
  legal_name: string | null
  contact_person: string | null
  phone: string | null
  phone_secondary: string | null
  email: string | null
  website: string | null
  country: string | null
  city: string | null
  address: string | null
  postal_code: string | null
  vat_number: string | null
  registration_number: string | null
  // Commercial defaults
  default_currency: string | null
  default_vat_treatment: string | null
  payment_terms: string | null
  payment_method_notes: string | null
  default_incoterm: string | null
  delivery_terms: string | null
  default_document_language: string | null
  default_document_template: string | null
  commercial_notes: string | null
  // Logistics defaults
  default_dest_country: string | null
  default_dest_city: string | null
  default_port: string | null
  transport_responsibility: string | null
  loading_responsibility: string | null
  unloading_responsibility: string | null
  default_consignee: string | null
  default_notify_party: string | null
  packing_instructions: string | null
  shipping_notes: string | null
  special_handling: string | null
  // General
  notes: string | null
  // Metadata
  active: boolean
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
  deleted_at: string | null
}

export interface CreateCustomerInput {
  name: string
  name_ar?: string
  legal_name?: string
  contact_person?: string
  phone?: string
  phone_secondary?: string
  email?: string
  website?: string
  country?: string
  city?: string
  address?: string
  postal_code?: string
  vat_number?: string
  registration_number?: string
  // Commercial defaults
  default_currency?: string
  default_vat_treatment?: string
  payment_terms?: string
  payment_method_notes?: string
  default_incoterm?: string
  delivery_terms?: string
  default_document_language?: string
  default_document_template?: string
  commercial_notes?: string
  // Logistics defaults
  default_dest_country?: string
  default_dest_city?: string
  default_port?: string
  transport_responsibility?: string
  loading_responsibility?: string
  unloading_responsibility?: string
  default_consignee?: string
  default_notify_party?: string
  packing_instructions?: string
  shipping_notes?: string
  special_handling?: string
  // General
  notes?: string
}

export interface UpdateCustomerInput extends Partial<CreateCustomerInput> {}

// ===========================================
// Customer Service
// ===========================================

export class CustomerService {
  private supabase: SupabaseClient<Database>

  constructor() {
    this.supabase = getSupabase()
  }

  /**
   * Get all customers for a company.
   */
  async getCustomers(
    companyId: string,
    context: RequestContext,
    options: { search?: string; page?: number; pageSize?: number } = {}
  ): Promise<{ data: Customer[]; total: number }> {
    if (!hasPermission(context, 'customers.view')) {
      throw new Error('Permission denied: customers.view')
    }

    const { search, page = 1, pageSize = 20 } = options
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    let query = (this.supabase as any)
      .from('customers')
      .select('*', { count: 'exact' })
      .eq('company_id', companyId)
      .eq('active', true)
      .is('deleted_at', null)

    // Search
    if (search) {
      query = query.or(`name.ilike.%${search}%,contact_person.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%,country.ilike.%${search}%`)
    }

    // Pagination
    query = query.range(from, to).order('name')

    const { data, error, count } = await query

    if (error) {
      appLogger.error('Error fetching customers', error)
      throw handleSupabaseError(error)
    }

    return {
      data: data || [],
      total: count || 0,
    }
  }

  /**
   * Get a customer by ID.
   */
  async getCustomerById(id: string, context: RequestContext): Promise<Customer> {
    if (!hasPermission(context, 'customers.view')) {
      throw new Error('Permission denied: customers.view')
    }

    const { data, error } = await (this.supabase as any)
      .from('customers')
      .select('*')
      .eq('id', id)
      .eq('active', true)
      .is('deleted_at', null)
      .single()

    if (error || !data) {
      throw new NotFoundError('Customer', id)
    }

    return data
  }

  /**
   * Create a new customer.
   */
  async createCustomer(input: CreateCustomerInput, context: RequestContext): Promise<Customer> {
    requirePermission(context, 'customers.create')

    const { data: company } = await (this.supabase as any)
      .from('company_memberships')
      .select('company_id')
      .eq('user_id', context.userId)
      .eq('active', true)
      .limit(1)
      .single()

    if (!company) {
      throw new Error('No company context')
    }

    const companyId = context.companyId || company.company_id

    const { data, error } = await (this.supabase as any)
      .from('customers')
      .insert({
        company_id: companyId,
        name: input.name,
        name_ar: input.name_ar || null,
        legal_name: input.legal_name || null,
        contact_person: input.contact_person || null,
        phone: input.phone || null,
        phone_secondary: input.phone_secondary || null,
        email: input.email || null,
        website: input.website || null,
        country: input.country || null,
        city: input.city || null,
        address: input.address || null,
        postal_code: input.postal_code || null,
        vat_number: input.vat_number || null,
        registration_number: input.registration_number || null,
        default_currency: input.default_currency || 'SAR',
        default_vat_treatment: input.default_vat_treatment || '0',
        payment_terms: input.payment_terms || null,
        payment_method_notes: input.payment_method_notes || null,
        default_incoterm: input.default_incoterm || null,
        delivery_terms: input.delivery_terms || null,
        default_document_language: input.default_document_language || 'en',
        default_document_template: input.default_document_template || null,
        commercial_notes: input.commercial_notes || null,
        default_dest_country: input.default_dest_country || null,
        default_dest_city: input.default_dest_city || null,
        default_port: input.default_port || null,
        transport_responsibility: input.transport_responsibility || 'Seller',
        loading_responsibility: input.loading_responsibility || 'Seller',
        unloading_responsibility: input.unloading_responsibility || 'Buyer',
        default_consignee: input.default_consignee || null,
        default_notify_party: input.default_notify_party || null,
        packing_instructions: input.packing_instructions || null,
        shipping_notes: input.shipping_notes || null,
        special_handling: input.special_handling || null,
        notes: input.notes || null,
        active: true,
        created_by: context.userId,
        updated_by: context.userId,
      })
      .select()
      .single()

    if (error) {
      appLogger.error('Error creating customer', error)
      throw handleSupabaseError(error)
    }

    appLogger.info('Customer created', { customerId: data.id, name: input.name })
    return data
  }

  /**
   * Update a customer.
   */
  async updateCustomer(id: string, input: UpdateCustomerInput, context: RequestContext): Promise<Customer> {
    requirePermission(context, 'customers.edit')

    const updateData: Record<string, unknown> = { updated_by: context.userId }
    
    // Only include provided fields
    Object.entries(input).forEach(([key, value]) => {
      if (value !== undefined) {
        updateData[key] = value
      }
    })

    const { data, error } = await (this.supabase as any)
      .from('customers')
      .update(updateData)
      .eq('id', id)
      .eq('active', true)
      .is('deleted_at', null)
      .select()
      .single()

    if (error) {
      appLogger.error('Error updating customer', error)
      throw handleSupabaseError(error)
    }

    appLogger.info('Customer updated', { customerId: id })
    return data
  }

  /**
   * Soft delete a customer (move to trash).
   */
  async deleteCustomer(id: string, context: RequestContext): Promise<void> {
    requirePermission(context, 'customers.delete')

    const customer = await this.getCustomerById(id, context)

    const { error } = await (this.supabase as any)
      .from('customers')
      .update({
        deleted_at: new Date().toISOString(),
        updated_by: context.userId,
      })
      .eq('id', id)

    if (error) {
      appLogger.error('Error deleting customer', error)
      throw handleSupabaseError(error)
    }

    // Create trash entry
    await (this.supabase as any)
      .from('trash_entries')
      .insert({
        entity_type: 'customer',
        entity_id: id,
        company_id: customer.company_id,
        deleted_by: context.userId,
        deleted_at: new Date().toISOString(),
      })

    appLogger.info('Customer moved to trash', { customerId: id })
  }

  /**
   * Restore a customer from trash.
   */
  async restoreCustomer(id: string, context: RequestContext): Promise<Customer> {
    if (!hasPermission(context, 'trash.restore')) {
      throw new Error('Permission denied: trash.restore')
    }

    const { error } = await (this.supabase as any)
      .from('customers')
      .update({
        deleted_at: null,
        updated_by: context.userId,
      })
      .eq('id', id)

    if (error) {
      appLogger.error('Error restoring customer', error)
      throw handleSupabaseError(error)
    }

    // Delete trash entry
    await (this.supabase as any)
      .from('trash_entries')
      .delete()
      .eq('entity_type', 'customer')
      .eq('entity_id', id)

    appLogger.info('Customer restored', { customerId: id })
    return this.getCustomerById(id, context)
  }

  /**
   * Get customer count for a company.
   */
  async getCustomerCount(companyId: string, context: RequestContext): Promise<number> {
    const { count, error } = await (this.supabase as any)
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('active', true)
      .is('deleted_at', null)

    if (error) {
      return 0
    }

    return count || 0
  }
}

// Singleton instance
let customerServiceInstance: CustomerService | null = null

export function getCustomerService(): CustomerService {
  if (!customerServiceInstance) {
    customerServiceInstance = new CustomerService()
  }
  return customerServiceInstance
}
