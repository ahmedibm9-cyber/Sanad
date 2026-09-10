/**
 * Material service for SANAD application.
 * 
 * Handles material CRUD operations, files, and price tracking.
 */

import { getSupabase, type Database } from '../supabase'
import { type RequestContext, requirePermission, hasPermission } from '../api'
import { ilikeSearch } from '../search'
import { NotFoundError, handleSupabaseError } from '../errors'
import { appLogger } from '../logger'
import type { SupabaseClient } from '@supabase/supabase-js'

// ===========================================
// Types
// ===========================================

export interface Material {
  id: string
  company_id: string
  name: string
  grade: string | null
  manufacturer: string | null
  origin: string | null
  hs_code: string | null
  default_packing: string | null
  last_selling_price: number | null
  last_selling_currency: string | null
  last_selling_unit: string | null
  active: boolean
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
  deleted_at: string | null
}

export interface MaterialFile {
  id: string
  company_id: string
  material_id: string
  file_type: 'TDS' | 'MSDS' | 'COA' | 'other'
  r2_object_key: string
  original_name: string
  mime_type: string | null
  size: number | null
  uploaded_by: string | null
  active: boolean
  created_at: string
  updated_at: string
}

export interface MaterialPriceEvent {
  id: string
  company_id: string
  material_id: string
  work_item_id: string | null
  price: number
  currency: string
  unit: string
  recorded_at: string
  recorded_by: string | null
}

export interface CreateMaterialInput {
  name: string
  grade?: string
  manufacturer?: string
  origin?: string
  hs_code?: string
  default_packing?: string
  last_selling_price?: number
  last_selling_currency?: string
  last_selling_unit?: string
}

export interface UpdateMaterialInput extends Partial<CreateMaterialInput> {}

// ===========================================
// Material Service
// ===========================================

export class MaterialService {
  private supabase: SupabaseClient<Database>

  constructor() {
    this.supabase = getSupabase()
  }

  /**
   * Get all materials for a company.
   */
  async getMaterials(
    companyId: string,
    context: RequestContext,
    options: { search?: string; page?: number; pageSize?: number } = {}
  ): Promise<{ data: Material[]; total: number }> {
    if (!hasPermission(context, 'materials.view')) {
      throw new Error('Permission denied: materials.view')
    }

    const { search, page = 1, pageSize = 20 } = options
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    let query = (this.supabase as any)
      .from('materials')
      .select('*', { count: 'exact' })
      .eq('company_id', companyId)
      .eq('active', true)
      .is('deleted_at', null)

    if (search) {
      const sPattern = ilikeSearch(search)
      query = query.or(`name.ilike.${sPattern},grade.ilike.${sPattern},manufacturer.ilike.${sPattern},hs_code.ilike.${sPattern},origin.ilike.${sPattern}`)
    }

    query = query.range(from, to).order('name')

    const { data, error, count } = await query

    if (error) {
      appLogger.error('Error fetching materials', error)
      throw handleSupabaseError(error)
    }

    return {
      data: data || [],
      total: count || 0,
    }
  }

  /**
   * Get a material by ID.
   */
  async getMaterialById(id: string, context: RequestContext): Promise<Material> {
    if (!hasPermission(context, 'materials.view')) {
      throw new Error('Permission denied: materials.view')
    }

    const { data, error } = await (this.supabase as any)
      .from('materials')
      .select('*')
      .eq('id', id)
      .eq('company_id', context.companyId)
      .eq('active', true)
      .is('deleted_at', null)
      .single()

    if (error || !data) {
      throw new NotFoundError('Material', id)
    }

    return data
  }

  /**
   * Create a new material.
   */
  async createMaterial(input: CreateMaterialInput, context: RequestContext): Promise<Material> {
    requirePermission(context, 'materials.create')

    const companyId = context.companyId!

    const { data, error } = await (this.supabase as any)
      .from('materials')
      .insert({
        company_id: companyId,
        name: input.name,
        grade: input.grade || null,
        manufacturer: input.manufacturer || null,
        origin: input.origin || null,
        hs_code: input.hs_code || null,
        default_packing: input.default_packing || null,
        last_selling_price: input.last_selling_price || null,
        last_selling_currency: input.last_selling_currency || 'SAR',
        last_selling_unit: input.last_selling_unit || 'MT',
        active: true,
        created_by: context.userId,
        updated_by: context.userId,
      })
      .select()
      .single()

    if (error) {
      appLogger.error('Error creating material', error)
      throw handleSupabaseError(error)
    }

    appLogger.info('Material created', { materialId: data.id, name: input.name })
    return data
  }

  /**
   * Update a material.
   */
  async updateMaterial(id: string, input: UpdateMaterialInput, context: RequestContext): Promise<Material> {
    requirePermission(context, 'materials.edit')

    const updateData: Record<string, unknown> = { updated_by: context.userId }
    Object.entries(input).forEach(([key, value]) => {
      if (value !== undefined) {
        updateData[key] = value
      }
    })

    const { data, error } = await (this.supabase as any)
      .from('materials')
      .update(updateData)
      .eq('id', id)
      .eq('company_id', context.companyId)
      .eq('active', true)
      .is('deleted_at', null)
      .select()
      .single()

    if (error) {
      appLogger.error('Error updating material', error)
      throw handleSupabaseError(error)
    }

    appLogger.info('Material updated', { materialId: id })
    return data
  }

  /**
   * Soft delete a material (move to trash).
   */
  async deleteMaterial(id: string, context: RequestContext): Promise<void> {
    requirePermission(context, 'materials.delete')

    const material = await this.getMaterialById(id, context)

    const { error } = await (this.supabase as any)
      .from('materials')
      .update({
        deleted_at: new Date().toISOString(),
        updated_by: context.userId,
      })
      .eq('id', id)

    if (error) {
      appLogger.error('Error deleting material', error)
      throw handleSupabaseError(error)
    }

    await (this.supabase as any)
      .from('trash_entries')
      .insert({
        entity_type: 'material',
        entity_id: id,
        company_id: material.company_id,
        deleted_by: context.userId,
        deleted_at: new Date().toISOString(),
      })

    appLogger.info('Material moved to trash', { materialId: id })
  }

  /**
   * Restore a material from trash.
   */
  async restoreMaterial(id: string, context: RequestContext): Promise<Material> {
    if (!hasPermission(context, 'trash.restore')) {
      throw new Error('Permission denied: trash.restore')
    }

    const { error } = await (this.supabase as any)
      .from('materials')
      .update({
        deleted_at: null,
        updated_by: context.userId,
      })
      .eq('id', id)

    if (error) {
      appLogger.error('Error restoring material', error)
      throw handleSupabaseError(error)
    }

    await (this.supabase as any)
      .from('trash_entries')
      .delete()
      .eq('entity_type', 'material')
      .eq('entity_id', id)

    appLogger.info('Material restored', { materialId: id })
    return this.getMaterialById(id, context)
  }

  // ===========================================
  // Material Files
  // ===========================================

  /**
   * Get files for a material.
   */
  async getMaterialFiles(materialId: string, context: RequestContext): Promise<MaterialFile[]> {
    const { data, error } = await (this.supabase as any)
      .from('material_files')
      .select('*')
      .eq('material_id', materialId)
      .eq('active', true)
      .order('file_type')

    if (error) {
      appLogger.error('Error fetching material files', error)
      throw handleSupabaseError(error)
    }

    return data || []
  }

  /**
   * Upload a material file.
   */
  async uploadMaterialFile(
    materialId: string,
    fileType: 'TDS' | 'MSDS' | 'COA' | 'other',
    r2ObjectKey: string,
    fileName: string,
    mimeType: string,
    size: number,
    context: RequestContext
  ): Promise<MaterialFile> {
    requirePermission(context, 'materials.files.manage')

    // Check if file of this type already exists
    const { data: existing } = await (this.supabase as any)
      .from('material_files')
      .select('id')
      .eq('material_id', materialId)
      .eq('file_type', fileType)
      .eq('active', true)
      .single()

    if (existing) {
      // Update existing file
      const { data, error } = await (this.supabase as any)
        .from('material_files')
        .update({
          r2_object_key: r2ObjectKey,
          original_name: fileName,
          mime_type: mimeType,
          size,
          uploaded_by: context.userId,
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) {
        throw handleSupabaseError(error)
      }
      return data
    } else {
      // Create new file record
      const { data, error } = await (this.supabase as any)
        .from('material_files')
        .insert({
          material_id: materialId,
          company_id: context.companyId!,
          file_type: fileType,
          r2_object_key: r2ObjectKey,
          original_name: fileName,
          mime_type: mimeType,
          size,
          uploaded_by: context.userId,
          active: true,
        })
        .select()
        .single()

      if (error) {
        throw handleSupabaseError(error)
      }
      return data
    }
  }

  /**
   * Delete a material file.
   */
  async deleteMaterialFile(fileId: string, context: RequestContext): Promise<void> {
    requirePermission(context, 'materials.files.manage')

    const { error } = await (this.supabase as any)
      .from('material_files')
      .update({ active: false })
      .eq('id', fileId)

    if (error) {
      throw handleSupabaseError(error)
    }
  }

  // ===========================================
  // Price Tracking
  // ===========================================

  /**
   * Update last selling price for a material.
   */
  async updateLastSellingPrice(
    materialId: string,
    price: number,
    currency: string,
    unit: string,
    context: RequestContext,
    workItemId?: string
  ): Promise<void> {
    // Update the material's latest price
    await (this.supabase as any)
      .from('materials')
      .update({
        last_selling_price: price,
        last_selling_currency: currency,
        last_selling_unit: unit,
        updated_by: context.userId,
      })
      .eq('id', materialId)

    // Record price event
    await (this.supabase as any)
      .from('material_price_events')
      .insert({
        company_id: context.companyId!,
        material_id: materialId,
        work_item_id: workItemId || null,
        price,
        currency,
        unit,
        recorded_by: context.userId,
      })

    appLogger.info('Material price updated', { materialId, price, currency })
  }

  /**
   * Get price history for a material.
   */
  async getPriceHistory(
    materialId: string,
    context: RequestContext,
    limit: number = 10
  ): Promise<MaterialPriceEvent[]> {
    const { data, error } = await (this.supabase as any)
      .from('material_price_events')
      .select('*')
      .eq('material_id', materialId)
      .order('recorded_at', { ascending: false })
      .limit(limit)

    if (error) {
      throw handleSupabaseError(error)
    }

    return data || []
  }

  /**
   * Get latest selling price for a material.
   */
  async getLatestPrice(materialId: string): Promise<{ price: number; currency: string } | null> {
    const { data, error } = await (this.supabase as any)
      .from('materials')
      .select('last_selling_price, last_selling_currency')
      .eq('id', materialId)
      .single()

    if (error || !data) {
      return null
    }

    if (!data.last_selling_price) {
      return null
    }

    return {
      price: data.last_selling_price,
      currency: data.last_selling_currency || 'SAR',
    }
  }

  /**
   * Get material count for a company.
   */
  async getMaterialCount(companyId: string): Promise<number> {
    const { count, error } = await (this.supabase as any)
      .from('materials')
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
let materialServiceInstance: MaterialService | null = null

export function getMaterialService(): MaterialService {
  if (!materialServiceInstance) {
    materialServiceInstance = new MaterialService()
  }
  return materialServiceInstance
}
