/**
 * Company service for SANAD application.
 * 
 * Handles company CRUD operations with proper authorization.
 */

import { getSupabase, type Database } from '../supabase'
import { type RequestContext, requirePermission, hasPermission } from '../api'
import { NotFoundError, ConflictError, ForbiddenError, handleSupabaseError } from '../errors'
import { appLogger } from '../logger'
import type { SupabaseClient } from '@supabase/supabase-js'

// ===========================================
// Types
// ===========================================

export interface Company {
  id: string
  name_en: string
  name_ar: string
  legal_name_en: string | null
  legal_name_ar: string | null
  short_name: string
  company_code: string
  active: boolean
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
  // Additional properties used in UI (snake_case from DB)
  phone?: string
  email?: string
  website?: string
  country?: string
  city?: string
  address?: string
  postal_code?: string
  vat_number?: string
  bank_name?: string
  account_name?: string
  account_number?: string
  iban?: string
  swift?: string
  bank_currency?: string
  default_language?: 'en' | 'ar'
  default_template?: string
  default_vat_rate?: number
  default_currency?: string
  default_weight_unit?: string
  default_packing_unit?: string
  default_incoterm?: string
  default_payment_terms?: string
  default_delivery_terms?: string
  default_prepared_by?: string
  show_signature?: boolean
  show_stamp?: boolean
  // camelCase aliases for UI compatibility
  shortName?: string
  companyCode?: string
  legalNameEn?: string
  legalNameAr?: string
  defaultTemplate?: string
  showSignature?: boolean
  showStamp?: boolean
  defaultCurrency?: string
  defaultPreparedBy?: string
  defaultDeliveryTerms?: string
  defaultPaymentTerms?: string
  bankName?: string
  accountName?: string
  accountNumber?: string
  postalCode?: string
  nameEn?: string
  nameAr?: string
  vatNumber?: string
  defaultIncoterm?: string
  defaultWeightUnit?: string
  defaultPackingUnit?: string
  crNumber?: string
  code?: string
  bankCurrency?: string
  defaultLanguage?: 'en' | 'ar'
  defaultVatRate?: number
}

export interface CreateCompanyInput {
  name_en: string
  name_ar: string
  legal_name_en?: string
  legal_name_ar?: string
  short_name: string
  company_code: string
}

export interface UpdateCompanyInput {
  name_en?: string
  name_ar?: string
  legal_name_en?: string
  legal_name_ar?: string
  short_name?: string
  company_code?: string
  active?: boolean
}

// ===========================================
// Company Service
// ===========================================

export class CompanyService {
  private supabase: SupabaseClient<Database>

  constructor() {
    this.supabase = getSupabase()
  }

  /**
   * Get all companies the user has access to.
   */
  async getUserCompanies(context: RequestContext): Promise<Company[]> {
    let query = (this.supabase as any)
      .from('companies')
      .select('*')
      .eq('active', true)
      .order('name_en')

    // System admins see all companies
    if (!context.isSystemAdmin && context.companyId) {
      // Non-admins only see companies they're members of
      const { data: memberships } = await (this.supabase as any)
        .from('company_memberships')
        .select('company_id')
        .eq('user_id', context.userId)
        .eq('active', true)

      const companyIds = memberships?.map((m: any) => m.company_id) || []
      if (companyIds.length === 0) return []
      query = query.in('id', companyIds)
    }

    const { data, error } = await query

    if (error) {
      appLogger.error('Error fetching companies', error)
      throw handleSupabaseError(error)
    }

    return data || []
  }

  /**
   * Get a company by ID.
   */
  async getCompanyById(id: string, context: RequestContext): Promise<Company> {
    if (!hasPermission(context, 'company.view')) {
      throw new ForbiddenError('Permission denied: company.view')
    }

    const { data, error } = await (this.supabase as any)
      .from('companies')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      throw new NotFoundError('Company', id)
    }

    return data
  }

  /**
   * Create a new company.
   */
  async createCompany(input: CreateCompanyInput, context: RequestContext): Promise<Company> {
    requirePermission(context, 'company.edit')

    // Check for duplicate company code
    const { data: existing } = await (this.supabase as any)
      .from('companies')
      .select('id')
      .eq('company_code', input.company_code)
      .single()

    if (existing) {
      throw new ConflictError('Company code already exists')
    }

    const { data, error } = await (this.supabase as any)
      .from('companies')
      .insert({
        name_en: input.name_en,
        name_ar: input.name_ar,
        legal_name_en: input.legal_name_en || null,
        legal_name_ar: input.legal_name_ar || null,
        short_name: input.short_name,
        company_code: input.company_code,
        active: true,
        created_by: context.userId,
        updated_by: context.userId,
      })
      .select()
      .single()

    if (error) {
      appLogger.error('Error creating company', error)
      throw handleSupabaseError(error)
    }

    appLogger.info('Company created', { companyId: data.id, name: input.name_en })

    // Add the creating user as admin of the new company
    const { error: membershipError } = await (this.supabase as any)
      .from('company_memberships')
      .insert({
        company_id: data.id,
        user_id: context.userId,
        base_role: 'admin',
        active: true,
      })

    if (membershipError) {
      appLogger.error('Error creating admin membership', membershipError)
    }

    return data
  }

  /**
   * Update a company.
   */
  async updateCompany(id: string, input: UpdateCompanyInput, context: RequestContext): Promise<Company> {
    requirePermission(context, 'company.edit')

    // Check if company exists
    const existing = await this.getCompanyById(id, context)

    // If updating company code, check for duplicates
    if (input.company_code && input.company_code !== existing.company_code) {
      const { data: duplicate } = await (this.supabase as any)
        .from('companies')
        .select('id')
        .eq('company_code', input.company_code)
        .neq('id', id)
        .single()

      if (duplicate) {
        throw new ConflictError('Company code already exists')
      }
    }

    const updateData: Record<string, unknown> = {
      updated_by: context.userId,
    }
    if (input.name_en !== undefined) updateData.name_en = input.name_en
    if (input.name_ar !== undefined) updateData.name_ar = input.name_ar
    if (input.legal_name_en !== undefined) updateData.legal_name_en = input.legal_name_en
    if (input.legal_name_ar !== undefined) updateData.legal_name_ar = input.legal_name_ar
    if (input.short_name !== undefined) updateData.short_name = input.short_name
    if (input.company_code !== undefined) updateData.company_code = input.company_code
    if (input.active !== undefined) updateData.active = input.active

    const { data, error } = await (this.supabase as any)
      .from('companies')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      appLogger.error('Error updating company', error)
      throw handleSupabaseError(error)
    }

    appLogger.info('Company updated', { companyId: id })

    return data
  }

  /**
   * Get company membership count.
   */
  async getMembershipCount(companyId: string, context: RequestContext): Promise<number> {
    const { count, error } = await (this.supabase as any)
      .from('company_memberships')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('active', true)

    if (error) {
      appLogger.error('Error counting memberships', error)
      return 0
    }

    return count || 0
  }
}

// Singleton instance
let companyServiceInstance: CompanyService | null = null

export function getCompanyService(): CompanyService {
  if (!companyServiceInstance) {
    companyServiceInstance = new CompanyService()
  }
  return companyServiceInstance
}
