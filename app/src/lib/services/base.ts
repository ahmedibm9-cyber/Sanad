/**
 * Base service class for SANAD application.
 * 
 * This provides a common interface for all domain services,
 * with built-in authorization, validation, and audit support.
 */

import { getSupabase, type Database } from '../supabase'
import { 
  type RequestContext, 
  hasPermission, 
  requirePermission,
  getPaginationBounds,
  createPaginationMeta,
  validateRequiredFields,
  type PaginatedResult,
  type PaginationParams
} from '../api'
import { 
  AppError, 
  NotFoundError, 
  ConflictError,
  handleSupabaseError 
} from '../errors'
import { logAuditEvent } from '../logger'
import type { SupabaseClient } from '@supabase/supabase-js'

// ===========================================
// Service Configuration
// ===========================================

export interface ServiceConfig {
  tableName: string
  companyIdRequired?: boolean
  requiredPermission?: string
  createPermission?: string
  editPermission?: string
  deletePermission?: string
  auditEntityName: string
}

// ===========================================
// Base Service Class
// ===========================================

export abstract class BaseService<T extends Record<string, unknown>, TInsert, TUpdate> {
  protected supabase: SupabaseClient<Database>
  protected config: ServiceConfig

  constructor(config: ServiceConfig) {
    this.supabase = getSupabase()
    this.config = config
  }

  // ===========================================
  // Abstract Methods
  // ===========================================

  /**
   * Validate before create. Override for custom validation.
   */
  protected abstract validateCreate(data: TInsert, context: RequestContext): Promise<void>

  /**
   * Validate before update. Override for custom validation.
   */
  protected abstract validateUpdate(data: TUpdate, existing: T, context: RequestContext): Promise<void>

  // ===========================================
  // Query Methods
  // ===========================================

  /**
   * Get all records with pagination.
   */
  async findAll(
    context: RequestContext,
    options: PaginationParams & { filters?: Record<string, unknown> } = {}
  ): Promise<PaginatedResult<T>> {
    if (this.config.requiredPermission) {
      requirePermission(context, this.config.requiredPermission)
    }

    const { from, to, page, pageSize } = getPaginationBounds(options)

    let query = this.supabase
      .from(this.config.tableName)
      .select('*', { count: 'exact' })

    // Apply company filter
    if (this.config.companyIdRequired && context.companyId) {
      query = query.eq('company_id', context.companyId)
    }

    // Apply additional filters
    if (options.filters) {
      Object.entries(options.filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          query = query.eq(key, value)
        }
      })
    }

    // Apply pagination
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      throw handleSupabaseError(error)
    }

    return {
      data: (data || []) as T[],
      total: count || 0,
      page,
      pageSize,
      hasMore: page * pageSize < (count || 0),
    }
  }

  /**
   * Get a single record by ID.
   */
  async findById(id: string, context: RequestContext): Promise<T> {
    if (this.config.requiredPermission) {
      requirePermission(context, this.config.requiredPermission)
    }

    let query = this.supabase
      .from(this.config.tableName)
      .select('*')
      .eq('id', id)

    if (this.config.companyIdRequired && context.companyId) {
      query = query.eq('company_id', context.companyId)
    }

    const { data, error } = await query.single()

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError(this.config.auditEntityName, id)
      }
      throw handleSupabaseError(error)
    }

    return data as T
  }

  /**
   * Create a new record.
   */
  async create(data: TInsert, context: RequestContext): Promise<T> {
    if (this.config.createPermission) {
      requirePermission(context, this.config.createPermission)
    }

    // Validate
    await this.validateCreate(data, context)

    // Add metadata
    const insertData = {
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: context.userId,
      updated_by: context.userId,
    } as any

    // Add company_id if required
    if (this.config.companyIdRequired && context.companyId) {
      insertData.company_id = context.companyId
    }

    const { data: created, error } = await this.supabase
      .from(this.config.tableName)
      .insert(insertData)
      .select()
      .single()

    if (error) {
      throw handleSupabaseError(error)
    }

    // Audit
    this.logCreate(context, created)

    return created as T
  }

  /**
   * Update an existing record.
   */
  async update(id: string, data: TUpdate, context: RequestContext): Promise<T> {
    if (this.config.editPermission) {
      requirePermission(context, this.config.editPermission)
    }

    // Get existing record
    const existing = await this.findById(id, context)

    // Validate
    await this.validateUpdate(data, existing, context)

    // Add metadata
    const updateData = {
      ...data,
      updated_at: new Date().toISOString(),
      updated_by: context.userId,
    } as any

    let query = (this.supabase as any)
      .from(this.config.tableName)
      .update(updateData)
      .eq('id', id)

    if (this.config.companyIdRequired && context.companyId) {
      query = query.eq('company_id', context.companyId)
    }

    const { data: updated, error } = await query.select().single()

    if (error) {
      throw handleSupabaseError(error)
    }

    // Audit
    this.logUpdate(context, existing, updated)

    return updated as T
  }

  /**
   * Soft delete a record.
   */
  async softDelete(id: string, context: RequestContext): Promise<void> {
    if (this.config.deletePermission) {
      requirePermission(context, this.config.deletePermission)
    }

    const existing = await this.findById(id, context)

    const { error } = await (this.supabase as any)
      .from(this.config.tableName)
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        updated_by: context.userId,
      } as any)
      .eq('id', id)

    if (error) {
      throw handleSupabaseError(error)
    }

    // Audit
    this.logDelete(context, existing)

    // Create trash entry
    if (this.config.companyIdRequired && context.companyId) {
      await (this.supabase as any)
        .from('trash_entries')
        .insert({
          entity_type: this.config.auditEntityName,
          entity_id: id,
          company_id: context.companyId,
          deleted_by: context.userId,
          deleted_at: new Date().toISOString(),
        })
    }
  }

  /**
   * Restore a soft-deleted record.
   */
  async restore(id: string, context: RequestContext): Promise<T> {
    requirePermission(context, 'trash.restore')

    // Get the trash entry
    const { data: trashEntry, error: trashError } = await this.supabase
      .from('trash_entries')
      .select('*')
      .eq('entity_id', id)
      .eq('entity_type', this.config.auditEntityName)
      .eq('deleted_by', context.userId)
      .single()

    if (trashError || !trashEntry) {
      throw new NotFoundError('Trash entry')
    }

    // Restore the record
    const { error } = await (this.supabase as any)
      .from(this.config.tableName)
      .update({
        deleted_at: null,
        updated_at: new Date().toISOString(),
        updated_by: context.userId,
      } as any)
      .eq('id', id)

    if (error) {
      throw handleSupabaseError(error)
    }

    // Delete trash entry
    await (this.supabase as any)
      .from('trash_entries')
      .delete()
      .eq('id', (trashEntry as any).id)

    // Get and return restored record
    return this.findById(id, context)
  }

  /**
   * Count records.
   */
  async count(
    context: RequestContext,
    filters?: Record<string, unknown>
  ): Promise<number> {
    let query = this.supabase
      .from(this.config.tableName)
      .select('*', { count: 'exact', head: true })

    if (this.config.companyIdRequired && context.companyId) {
      query = query.eq('company_id', context.companyId)
    }

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          query = query.eq(key, value)
        }
      })
    }

    const { count, error } = await query

    if (error) {
      throw handleSupabaseError(error)
    }

    return count || 0
  }

  // ===========================================
  // Audit Helpers
  // ===========================================

  protected logCreate(context: RequestContext, record: T): void {
    logAuditEvent(
      context.userId,
      context.companyId || null,
      'CREATE',
      this.config.auditEntityName,
      (record as any).id,
      { after: record }
    )
  }

  protected logUpdate(context: RequestContext, before: T, after: T): void {
    logAuditEvent(
      context.userId,
      context.companyId || null,
      'EDIT',
      this.config.auditEntityName,
      (after as any).id,
      { before, after }
    )
  }

  protected logDelete(context: RequestContext, record: T): void {
    logAuditEvent(
      context.userId,
      context.companyId || null,
      'DELETE',
      this.config.auditEntityName,
      (record as any).id,
      { before: record }
    )
  }
}

// ===========================================
// Utility Types
// ===========================================

export type ServiceResult<T> = {
  success: true
  data: T
} | {
  success: false
  error: AppError
}

/**
 * Create a success result.
 */
export function ok<T>(data: T): ServiceResult<T> {
  return { success: true, data }
}

/**
 * Create an error result.
 */
export function err<T>(error: AppError): ServiceResult<T> {
  return { success: false, error }
}
