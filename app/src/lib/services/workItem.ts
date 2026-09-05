/**
 * Work Item service for SANAD application.
 * 
 * Handles both Tasks and Projects using the unified work-item model.
 */

import { getSupabase, type Database } from '../supabase'
import { type RequestContext, requirePermission, hasPermission } from '../api'
import { NotFoundError, handleSupabaseError } from '../errors'
import { appLogger } from '../logger'
import type { SupabaseClient } from '@supabase/supabase-js'

// ===========================================
// Types
// ===========================================

export type WorkItemType = 'task' | 'project'
export type WorkItemStatus = 'in_progress' | 'cancelled' | 'completed' | 'archived'

export interface WorkItem {
  id: string
  company_id: string
  type: WorkItemType
  name: string
  customer_id: string | null
  status: WorkItemStatus
  pinned: boolean
  destination_country: string | null
  destination_city: string | null
  currency: string | null
  incoterm: string | null
  payment_terms: string | null
  delivery_terms: string | null
  port_of_loading: string | null
  port_of_discharge: string | null
  vessel_name: string | null
  voyage_number: string | null
  container_number: string | null
  active: boolean
  archived_at: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
  deleted_at: string | null
}

export interface WorkItemMaterial {
  id: string
  company_id: string
  work_item_id: string
  material_id: string | null
  description_override: string | null
  quantity: number
  weight_unit: string
  price: number | null
  currency: string | null
  packing_unit: string | null
  packing_description: string | null
  origin: string | null
  hs_code: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export interface CreateWorkItemInput {
  type: WorkItemType
  name: string
  customer_id?: string
  destination_country?: string
  destination_city?: string
  currency?: string
  incoterm?: string
  payment_terms?: string
  delivery_terms?: string
  port_of_loading?: string
  port_of_discharge?: string
  vessel_name?: string
  voyage_number?: string
  container_number?: string
  materials?: CreateWorkItemMaterialInput[]
}

export interface UpdateWorkItemInput {
  name?: string
  customer_id?: string
  status?: WorkItemStatus
  pinned?: boolean
  destination_country?: string
  destination_city?: string
  currency?: string
  incoterm?: string
  payment_terms?: string
  delivery_terms?: string
  port_of_loading?: string
  port_of_discharge?: string
  vessel_name?: string
  voyage_number?: string
  container_number?: string
}

export interface CreateWorkItemMaterialInput {
  material_id?: string
  description_override?: string
  quantity: number
  weight_unit?: string
  price?: number
  currency?: string
  packing_unit?: string
  packing_description?: string
  origin?: string
  hs_code?: string
  sort_order?: number
}

// ===========================================
// Work Item Service
// ===========================================

export class WorkItemService {
  private supabase: SupabaseClient<Database>

  constructor() {
    this.supabase = getSupabase()
  }

  /**
   * Get work items for a company.
   */
  async getWorkItems(
    companyId: string,
    context: RequestContext,
    options: {
      type?: WorkItemType
      statuses?: WorkItemStatus[]
      customerId?: string
      search?: string
      page?: number
      pageSize?: number
    } = {}
  ): Promise<{ data: WorkItem[]; total: number }> {
    if (!hasPermission(context, 'projects.view')) {
      throw new Error('Permission denied: projects.view')
    }

    const { type, statuses, customerId, search, page = 1, pageSize = 20 } = options
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    let query = (this.supabase as any)
      .from('work_items')
      .select('*', { count: 'exact' })
      .eq('company_id', companyId)
      .eq('active', true)
      .is('deleted_at', null)

    if (type) {
      query = query.eq('type', type)
    }

    if (statuses && statuses.length > 0) {
      query = query.in('status', statuses)
    }

    if (customerId) {
      query = query.eq('customer_id', customerId)
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%`)
    }

    query = query.range(from, to).order('pinned', { ascending: false }).order('updated_at', { ascending: false })

    const { data, error, count } = await query

    if (error) {
      appLogger.error('Error fetching work items', error)
      throw handleSupabaseError(error)
    }

    return {
      data: data || [],
      total: count || 0,
    }
  }

  /**
   * Get a work item by ID.
   */
  async getWorkItemById(id: string, context: RequestContext): Promise<WorkItem> {
    if (!hasPermission(context, 'projects.view')) {
      throw new Error('Permission denied: projects.view')
    }

    const { data, error } = await (this.supabase as any)
      .from('work_items')
      .select('*')
      .eq('id', id)
      .eq('active', true)
      .is('deleted_at', null)
      .single()

    if (error || !data) {
      throw new NotFoundError('Work Item', id)
    }

    return data
  }

  /**
   * Create a new work item.
   */
  async createWorkItem(input: CreateWorkItemInput, context: RequestContext): Promise<WorkItem> {
    const permKey = input.type === 'project' ? 'projects.create' : 'tasks.create'
    requirePermission(context, permKey)

    const companyId = context.companyId!

    // Create the work item
    const { data, error } = await (this.supabase as any)
      .from('work_items')
      .insert({
        company_id: companyId,
        type: input.type,
        name: input.name,
        customer_id: input.customer_id || null,
        status: 'in_progress',
        pinned: false,
        destination_country: input.destination_country || null,
        destination_city: input.destination_city || null,
        currency: input.currency || 'SAR',
        incoterm: input.incoterm || null,
        payment_terms: input.payment_terms || null,
        delivery_terms: input.delivery_terms || null,
        port_of_loading: input.port_of_loading || null,
        port_of_discharge: input.port_of_discharge || null,
        vessel_name: input.vessel_name || null,
        voyage_number: input.voyage_number || null,
        container_number: input.container_number || null,
        active: true,
        created_by: context.userId,
        updated_by: context.userId,
      })
      .select()
      .single()

    if (error) {
      appLogger.error('Error creating work item', error)
      throw handleSupabaseError(error)
    }

    // Create materials if provided
    if (input.materials && input.materials.length > 0) {
      const materialRecords = input.materials.map((mat, idx) => ({
        company_id: companyId,
        work_item_id: data.id,
        material_id: mat.material_id || null,
        description_override: mat.description_override || null,
        quantity: mat.quantity,
        weight_unit: mat.weight_unit || 'MT',
        price: mat.price || 0,
        currency: mat.currency || 'SAR',
        packing_unit: mat.packing_unit || null,
        packing_description: mat.packing_description || null,
        origin: mat.origin || null,
        hs_code: mat.hs_code || null,
        sort_order: mat.sort_order ?? idx,
      }))

      await (this.supabase as any)
        .from('work_item_materials')
        .insert(materialRecords)
    }

    appLogger.info('Work item created', { id: data.id, type: input.type, name: input.name })
    return data
  }

  /**
   * Update a work item.
   */
  async updateWorkItem(id: string, input: UpdateWorkItemInput, context: RequestContext): Promise<WorkItem> {
    const existing = await this.getWorkItemById(id, context)
    const permKey = existing.type === 'project' ? 'projects.edit' : 'tasks.edit'
    requirePermission(context, permKey)

    const updateData: Record<string, unknown> = { updated_by: context.userId }
    Object.entries(input).forEach(([key, value]) => {
      if (value !== undefined) {
        updateData[key] = value
      }
    })

    const { data, error } = await (this.supabase as any)
      .from('work_items')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      appLogger.error('Error updating work item', error)
      throw handleSupabaseError(error)
    }

    appLogger.info('Work item updated', { id })
    return data
  }

  /**
   * Pin/Unpin a project.
   */
  async togglePin(id: string, context: RequestContext): Promise<WorkItem> {
    const existing = await this.getWorkItemById(id, context)
    requirePermission(context, 'projects.pin')

    const { data, error } = await (this.supabase as any)
      .from('work_items')
      .update({ pinned: !existing.pinned, updated_by: context.userId })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw handleSupabaseError(error)
    }

    appLogger.info('Work item pin toggled', { id, pinned: !existing.pinned })
    return data
  }

  /**
   * Archive a work item.
   */
  async archive(id: string, context: RequestContext): Promise<WorkItem> {
    const existing = await this.getWorkItemById(id, context)
    requirePermission(context, 'projects.archive')

    const { data, error } = await (this.supabase as any)
      .from('work_items')
      .update({
        status: 'archived',
        archived_at: new Date().toISOString(),
        updated_by: context.userId,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw handleSupabaseError(error)
    }

    appLogger.info('Work item archived', { id })
    return data
  }

  /**
   * Reopen an archived work item.
   */
  async reopen(id: string, context: RequestContext): Promise<WorkItem> {
    const existing = await this.getWorkItemById(id, context)
    requirePermission(context, 'projects.reopen')

    const { data, error } = await (this.supabase as any)
      .from('work_items')
      .update({
        status: 'in_progress',
        archived_at: null,
        updated_by: context.userId,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw handleSupabaseError(error)
    }

    appLogger.info('Work item reopened', { id })
    return data
  }

  /**
   * Convert a Task to a Project.
   * This changes the type in place, preserving all data.
   */
  async convertTaskToProject(id: string, context: RequestContext): Promise<WorkItem> {
    const existing = await this.getWorkItemById(id, context)

    if (existing.type !== 'task') {
      throw new Error('Can only convert tasks to projects')
    }

    requirePermission(context, 'tasks.convert_to_project')

    const { data, error } = await (this.supabase as any)
      .from('work_items')
      .update({
        type: 'project',
        updated_by: context.userId,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      appLogger.error('Error converting task to project', error)
      throw handleSupabaseError(error)
    }

    appLogger.info('Task converted to Project', { id })
    return data
  }

  /**
   * Soft delete a work item.
   */
  async deleteWorkItem(id: string, context: RequestContext): Promise<void> {
    const existing = await this.getWorkItemById(id, context)
    const permKey = existing.type === 'project' ? 'projects.delete' : 'tasks.delete'
    requirePermission(context, permKey)

    const { error } = await (this.supabase as any)
      .from('work_items')
      .update({
        deleted_at: new Date().toISOString(),
        updated_by: context.userId,
      })
      .eq('id', id)

    if (error) {
      throw handleSupabaseError(error)
    }

    await (this.supabase as any)
      .from('trash_entries')
      .insert({
        entity_type: existing.type,
        entity_id: id,
        company_id: existing.company_id,
        deleted_by: context.userId,
        deleted_at: new Date().toISOString(),
      })

    appLogger.info('Work item moved to trash', { id, type: existing.type })
  }

  /**
   * Restore a work item from trash.
   */
  async restoreWorkItem(id: string, context: RequestContext): Promise<WorkItem> {
    requirePermission(context, 'trash.restore')

    const { error } = await (this.supabase as any)
      .from('work_items')
      .update({
        deleted_at: null,
        updated_by: context.userId,
      })
      .eq('id', id)

    if (error) {
      throw handleSupabaseError(error)
    }

    await (this.supabase as any)
      .from('trash_entries')
      .delete()
      .eq('entity_id', id)

    appLogger.info('Work item restored', { id })
    return this.getWorkItemById(id, context)
  }

  // ===========================================
  // Materials
  // ===========================================

  /**
   * Get materials for a work item.
   */
  async getWorkItemMaterials(workItemId: string, context: RequestContext): Promise<WorkItemMaterial[]> {
    const { data, error } = await (this.supabase as any)
      .from('work_item_materials')
      .select('*')
      .eq('work_item_id', workItemId)
      .order('sort_order')

    if (error) {
      throw handleSupabaseError(error)
    }

    return data || []
  }

  /**
   * Add a material to a work item.
   */
  async addMaterial(
    workItemId: string,
    input: CreateWorkItemMaterialInput,
    context: RequestContext
  ): Promise<WorkItemMaterial> {
    const existing = await this.getWorkItemById(workItemId, context)
    requirePermission(context, existing.type === 'project' ? 'projects.edit' : 'tasks.edit')

    const { data, error } = await (this.supabase as any)
      .from('work_item_materials')
      .insert({
        company_id: existing.company_id,
        work_item_id: workItemId,
        material_id: input.material_id || null,
        description_override: input.description_override || null,
        quantity: input.quantity,
        weight_unit: input.weight_unit || 'MT',
        price: input.price || 0,
        currency: input.currency || 'SAR',
        packing_unit: input.packing_unit || null,
        packing_description: input.packing_description || null,
        origin: input.origin || null,
        hs_code: input.hs_code || null,
        sort_order: input.sort_order ?? 0,
      })
      .select()
      .single()

    if (error) {
      throw handleSupabaseError(error)
    }

    return data
  }

  /**
   * Update a material on a work item.
   */
  async updateMaterial(
    materialEntryId: string,
    updates: Partial<CreateWorkItemMaterialInput>,
    context: RequestContext
  ): Promise<WorkItemMaterial> {
    const updateData: Record<string, unknown> = {}
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        updateData[key] = value
      }
    })

    const { data, error } = await (this.supabase as any)
      .from('work_item_materials')
      .update(updateData)
      .eq('id', materialEntryId)
      .select()
      .single()

    if (error) {
      throw handleSupabaseError(error)
    }

    return data
  }

  /**
   * Remove a material from a work item.
   */
  async removeMaterial(materialEntryId: string, context: RequestContext): Promise<void> {
    const { error } = await (this.supabase as any)
      .from('work_item_materials')
      .delete()
      .eq('id', materialEntryId)

    if (error) {
      throw handleSupabaseError(error)
    }
  }
}

// Singleton instance
let workItemServiceInstance: WorkItemService | null = null

export function getWorkItemService(): WorkItemService {
  if (!workItemServiceInstance) {
    workItemServiceInstance = new WorkItemService()
  }
  return workItemServiceInstance
}
