/**
 * Company Settings service for SANAD application.
 * 
 * Handles company settings, assets, bank accounts, and document defaults.
 */

import { getSupabase, type Database } from '../supabase'
import { type RequestContext, requirePermission } from '../api'
import { NotFoundError, ConflictError, handleSupabaseError } from '../errors'
import { appLogger } from '../logger'
import type { SupabaseClient } from '@supabase/supabase-js'

// ===========================================
// Types
// ===========================================

export interface CompanySettings {
  id: string
  company_id: string
  settings: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface CompanyAsset {
  id: string
  company_id: string
  asset_type: 'logo' | 'stamp' | 'signature'
  object_key: string
  original_name: string | null
  mime_type: string | null
  size: number | null
  active: boolean
  created_at: string
  updated_at: string
}

export interface BankAccount {
  id: string
  company_id: string
  bank_name: string
  account_name: string
  account_number: string
  iban: string | null
  swift: string | null
  bank_address: string | null
  currency: string
  is_primary: boolean
  active: boolean
  created_at: string
  updated_at: string
}

export interface DocumentDefaults {
  id: string
  company_id: string
  default_language: string
  default_template: string
  default_vat_rate: number
  default_currency: string
  default_weight_unit: string
  default_packing_unit: string
  default_incoterm: string | null
  default_payment_terms: string | null
  default_delivery_terms: string | null
  default_prepared_by: string | null
  show_signature: boolean
  show_stamp: boolean
  created_at: string
  updated_at: string
}

export interface ConfigListItem {
  id: string
  company_id: string
  list_name: string
  item_value: string
  is_default: boolean
  sort_order: number
  created_at: string
}

export interface UpdateDocumentDefaultsInput {
  default_language?: string
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
}

export interface CreateBankAccountInput {
  bank_name: string
  account_name: string
  account_number: string
  iban?: string
  swift?: string
  bank_address?: string
  currency?: string
  is_primary?: boolean
}

// ===========================================
// Company Settings Service
// ===========================================

export class SettingsService {
  private supabase: SupabaseClient<Database>

  constructor() {
    this.supabase = getSupabase()
  }

  // ===========================================
  // Company Settings (JSON)
  // ===========================================

  /**
   * Get company settings.
   */
  async getCompanySettings(companyId: string, context: RequestContext): Promise<CompanySettings | null> {
    const { data, error } = await (this.supabase as any)
      .from('company_settings')
      .select('*')
      .eq('company_id', companyId)
      .single()

    if (error && error.code !== 'PGRST116') {
      appLogger.error('Error fetching company settings', error)
      throw handleSupabaseError(error)
    }

    return data
  }

  /**
   * Update company settings.
   */
  async updateCompanySettings(
    companyId: string,
    settings: Record<string, unknown>,
    context: RequestContext
  ): Promise<CompanySettings> {
    requirePermission(context, 'settings.edit')

    const existing = await this.getCompanySettings(companyId, context)

    if (existing) {
      // Merge with existing settings
      const mergedSettings = { ...existing.settings, ...settings }
      const { data, error } = await (this.supabase as any)
        .from('company_settings')
        .update({ settings: mergedSettings })
        .eq('company_id', companyId)
        .select()
        .single()

      if (error) {
        appLogger.error('Error updating company settings', error)
        throw handleSupabaseError(error)
      }

      return data
    } else {
      // Create new settings
      const { data, error } = await (this.supabase as any)
        .from('company_settings')
        .insert({ company_id: companyId, settings })
        .select()
        .single()

      if (error) {
        appLogger.error('Error creating company settings', error)
        throw handleSupabaseError(error)
      }

      return data
    }
  }

  // ===========================================
  // Company Assets
  // ===========================================

  /**
   * Get all assets for a company.
   */
  async getCompanyAssets(companyId: string, context: RequestContext): Promise<CompanyAsset[]> {
    const { data, error } = await (this.supabase as any)
      .from('company_assets')
      .select('*')
      .eq('company_id', companyId)
      .eq('active', true)
      .order('asset_type')

    if (error) {
      appLogger.error('Error fetching company assets', error)
      throw handleSupabaseError(error)
    }

    return data || []
  }

  /**
   * Get a specific asset by type.
   */
  async getAssetByType(
    companyId: string,
    assetType: 'logo' | 'stamp' | 'signature',
    context: RequestContext
  ): Promise<CompanyAsset | null> {
    const { data, error } = await (this.supabase as any)
      .from('company_assets')
      .select('*')
      .eq('company_id', companyId)
      .eq('asset_type', assetType)
      .eq('active', true)
      .single()

    if (error && error.code !== 'PGRST116') {
      appLogger.error('Error fetching asset', error)
      throw handleSupabaseError(error)
    }

    return data
  }

  /**
   * Upload or update a company asset.
   */
  async uploadAsset(
    companyId: string,
    assetType: 'logo' | 'stamp' | 'signature',
    fileKey: string,
    fileName: string,
    mimeType: string,
    size: number,
    context: RequestContext
  ): Promise<CompanyAsset> {
    requirePermission(context, 'settings.edit')

    // Check if asset already exists
    const existing = await this.getAssetByType(companyId, assetType, context)

    if (existing) {
      // Update existing asset
      const { data, error } = await (this.supabase as any)
        .from('company_assets')
        .update({
          object_key: fileKey,
          original_name: fileName,
          mime_type: mimeType,
          size,
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) {
        appLogger.error('Error updating asset', error)
        throw handleSupabaseError(error)
      }

      return data
    } else {
      // Create new asset
      const { data, error } = await (this.supabase as any)
        .from('company_assets')
        .insert({
          company_id: companyId,
          asset_type: assetType,
          object_key: fileKey,
          original_name: fileName,
          mime_type: mimeType,
          size,
          active: true,
        })
        .select()
        .single()

      if (error) {
        appLogger.error('Error creating asset', error)
        throw handleSupabaseError(error)
      }

      return data
    }
  }

  /**
   * Delete a company asset (soft delete).
   */
  async deleteAsset(assetId: string, context: RequestContext): Promise<void> {
    requirePermission(context, 'settings.edit')

    const { error } = await (this.supabase as any)
      .from('company_assets')
      .update({ active: false })
      .eq('id', assetId)

    if (error) {
      appLogger.error('Error deleting asset', error)
      throw handleSupabaseError(error)
    }
  }

  // ===========================================
  // Bank Accounts
  // ===========================================

  /**
   * Get all bank accounts for a company.
   */
  async getBankAccounts(companyId: string, context: RequestContext): Promise<BankAccount[]> {
    const { data, error } = await (this.supabase as any)
      .from('company_bank_accounts')
      .select('*')
      .eq('company_id', companyId)
      .eq('active', true)
      .order('is_primary', { ascending: false })

    if (error) {
      appLogger.error('Error fetching bank accounts', error)
      throw handleSupabaseError(error)
    }

    return data || []
  }

  /**
   * Create a bank account.
   */
  async createBankAccount(
    companyId: string,
    input: CreateBankAccountInput,
    context: RequestContext
  ): Promise<BankAccount> {
    requirePermission(context, 'settings.edit')

    const { data, error } = await (this.supabase as any)
      .from('company_bank_accounts')
      .insert({
        company_id: companyId,
        bank_name: input.bank_name,
        account_name: input.account_name,
        account_number: input.account_number,
        iban: input.iban || null,
        swift: input.swift || null,
        bank_address: input.bank_address || null,
        currency: input.currency || 'SAR',
        is_primary: input.is_primary ?? true,
        active: true,
      })
      .select()
      .single()

    if (error) {
      appLogger.error('Error creating bank account', error)
      throw handleSupabaseError(error)
    }

    return data
  }

  /**
   * Update a bank account.
   */
  async updateBankAccount(
    bankAccountId: string,
    updates: Partial<CreateBankAccountInput>,
    context: RequestContext
  ): Promise<BankAccount> {
    requirePermission(context, 'settings.edit')

    const updateData: Record<string, unknown> = {}
    if (updates.bank_name !== undefined) updateData.bank_name = updates.bank_name
    if (updates.account_name !== undefined) updateData.account_name = updates.account_name
    if (updates.account_number !== undefined) updateData.account_number = updates.account_number
    if (updates.iban !== undefined) updateData.iban = updates.iban
    if (updates.swift !== undefined) updateData.swift = updates.swift
    if (updates.bank_address !== undefined) updateData.bank_address = updates.bank_address
    if (updates.currency !== undefined) updateData.currency = updates.currency
    if (updates.is_primary !== undefined) updateData.is_primary = updates.is_primary

    const { data, error } = await (this.supabase as any)
      .from('company_bank_accounts')
      .update(updateData)
      .eq('id', bankAccountId)
      .select()
      .single()

    if (error) {
      appLogger.error('Error updating bank account', error)
      throw handleSupabaseError(error)
    }

    return data
  }

  /**
   * Delete a bank account (soft delete).
   */
  async deleteBankAccount(bankAccountId: string, context: RequestContext): Promise<void> {
    requirePermission(context, 'settings.edit')

    const { error } = await (this.supabase as any)
      .from('company_bank_accounts')
      .update({ active: false })
      .eq('id', bankAccountId)

    if (error) {
      appLogger.error('Error deleting bank account', error)
      throw handleSupabaseError(error)
    }
  }

  // ===========================================
  // Document Defaults
  // ===========================================

  /**
   * Get document defaults for a company.
   */
  async getDocumentDefaults(companyId: string, context: RequestContext): Promise<DocumentDefaults | null> {
    const { data, error } = await (this.supabase as any)
      .from('company_document_defaults')
      .select('*')
      .eq('company_id', companyId)
      .single()

    if (error && error.code !== 'PGRST116') {
      appLogger.error('Error fetching document defaults', error)
      throw handleSupabaseError(error)
    }

    return data
  }

  /**
   * Update document defaults.
   */
  async updateDocumentDefaults(
    companyId: string,
    input: UpdateDocumentDefaultsInput,
    context: RequestContext
  ): Promise<DocumentDefaults> {
    requirePermission(context, 'settings.edit')

    const existing = await this.getDocumentDefaults(companyId, context)

    if (existing) {
      const { data, error } = await (this.supabase as any)
        .from('company_document_defaults')
        .update(input)
        .eq('company_id', companyId)
        .select()
        .single()

      if (error) {
        appLogger.error('Error updating document defaults', error)
        throw handleSupabaseError(error)
      }

      return data
    } else {
      const { data, error } = await (this.supabase as any)
        .from('company_document_defaults')
        .insert({ company_id: companyId, ...input })
        .select()
        .single()

      if (error) {
        appLogger.error('Error creating document defaults', error)
        throw handleSupabaseError(error)
      }

      return data
    }
  }

  // ===========================================
  // Config Lists (Currencies, VAT rates, etc.)
  // ===========================================

  /**
   * Get all items for a config list.
   */
  async getConfigList(
    companyId: string,
    listName: string,
    context: RequestContext
  ): Promise<ConfigListItem[]> {
    const { data, error } = await (this.supabase as any)
      .from('company_config_lists')
      .select('*')
      .eq('company_id', companyId)
      .eq('list_name', listName)
      .order('sort_order')

    if (error) {
      appLogger.error('Error fetching config list', error)
      throw handleSupabaseError(error)
    }

    return data || []
  }

  /**
   * Add item to a config list.
   */
  async addConfigListItem(
    companyId: string,
    listName: string,
    itemValue: string,
    isDefault: boolean,
    context: RequestContext
  ): Promise<ConfigListItem> {
    requirePermission(context, 'settings.edit')

    // Check for duplicate
    const { data: existing } = await (this.supabase as any)
      .from('company_config_lists')
      .select('id')
      .eq('company_id', companyId)
      .eq('list_name', listName)
      .eq('item_value', itemValue)
      .single()

    if (existing) {
      throw new ConflictError(`Item "${itemValue}" already exists in ${listName}`)
    }

    // Get max sort order
    const { data: maxOrder } = await (this.supabase as any)
      .from('company_config_lists')
      .select('sort_order')
      .eq('company_id', companyId)
      .eq('list_name', listName)
      .order('sort_order', { ascending: false })
      .limit(1)
      .single()

    const sortOrder = (maxOrder?.sort_order ?? -1) + 1

    const { data, error } = await (this.supabase as any)
      .from('company_config_lists')
      .insert({
        company_id: companyId,
        list_name: listName,
        item_value: itemValue,
        is_default: isDefault,
        sort_order: sortOrder,
      })
      .select()
      .single()

    if (error) {
      appLogger.error('Error adding config list item', error)
      throw handleSupabaseError(error)
    }

    return data
  }

  /**
   * Remove item from a config list.
   */
  async removeConfigListItem(
    companyId: string,
    listName: string,
    itemValue: string,
    context: RequestContext
  ): Promise<void> {
    requirePermission(context, 'settings.edit')

    const { error } = await (this.supabase as any)
      .from('company_config_lists')
      .delete()
      .eq('company_id', companyId)
      .eq('list_name', listName)
      .eq('item_value', itemValue)

    if (error) {
      appLogger.error('Error removing config list item', error)
      throw handleSupabaseError(error)
    }
  }

  /**
   * Set default item in a config list.
   */
  async setConfigListDefault(
    companyId: string,
    listName: string,
    itemValue: string,
    context: RequestContext
  ): Promise<void> {
    requirePermission(context, 'settings.edit')

    // Reset all defaults for this list
    const { error: resetError } = await (this.supabase as any)
      .from('company_config_lists')
      .update({ is_default: false })
      .eq('company_id', companyId)
      .eq('list_name', listName)

    if (resetError) {
      appLogger.error('Error resetting config list defaults', resetError)
      throw handleSupabaseError(resetError)
    }

    // Set the new default
    const { error } = await (this.supabase as any)
      .from('company_config_lists')
      .update({ is_default: true })
      .eq('company_id', companyId)
      .eq('list_name', listName)
      .eq('item_value', itemValue)

    if (error) {
      appLogger.error('Error setting config list default', error)
      throw handleSupabaseError(error)
    }
  }

  /**
   * Get default value from a config list.
   */
  async getConfigListDefault(
    companyId: string,
    listName: string,
    context: RequestContext
  ): Promise<string | null> {
    const { data, error } = await (this.supabase as any)
      .from('company_config_lists')
      .select('item_value')
      .eq('company_id', companyId)
      .eq('list_name', listName)
      .eq('is_default', true)
      .single()

    if (error && error.code !== 'PGRST116') {
      appLogger.error('Error fetching config list default', error)
      return null
    }

    return data?.item_value || null
  }
}

// Singleton instance
let settingsServiceInstance: SettingsService | null = null

export function getSettingsService(): SettingsService {
  if (!settingsServiceInstance) {
    settingsServiceInstance = new SettingsService()
  }
  return settingsServiceInstance
}
