/**
 * Audit/Activity Log service for SANAD application.
 * 
 * Tracks all significant actions with before/after data.
 */

import { getSupabase, type Database } from '../supabase'
import { type RequestContext } from '../api'
import { ilikeSearch } from '../search'
import { handleSupabaseError } from '../errors'
import { appLogger } from '../logger'
import type { SupabaseClient } from '@supabase/supabase-js'

// ===========================================
// Types
// ===========================================

export type AuditAction = 
  | 'CREATE' | 'VIEW' | 'EDIT' | 'MOVE_TO_TRASH' | 'RESTORE'
  | 'DOWNLOAD' | 'PDF_GENERATE' | 'PDF_DOWNLOAD' | 'EXPORT'
  | 'ARCHIVE' | 'REOPEN' | 'PERMISSION_CHANGE' | 'SETTINGS_CHANGE'
  | 'FACTORY_IMPORT' | 'BACKUP' | 'RESTORE_BACKUP' | 'TASK_TO_PROJECT'

export interface AuditEvent {
  id: string
  company_id: string | null
  actor_user_id: string
  action: string
  entity_type: string
  entity_id: string | null
  entity_reference: string | null
  before_json: Record<string, unknown> | null
  after_json: Record<string, unknown> | null
  metadata_json: Record<string, unknown> | null
  created_at: string
}

export interface AuditFilters {
  userId?: string
  entityType?: string
  action?: string
  entityId?: string
  entityReference?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  pageSize?: number
}

// ===========================================
// Audit Service
// ===========================================

export class AuditService {
  private supabase: SupabaseClient<Database>

  constructor() {
    this.supabase = getSupabase()
  }

  /**
   * Create an audit event.
   */
  async logEvent(params: {
    action: AuditAction
    entityType: string
    entityId?: string
    entityReference?: string
    before?: Record<string, unknown>
    after?: Record<string, unknown>
    metadata?: Record<string, unknown>
  }, context: RequestContext): Promise<void> {
    const { error } = await (this.supabase as any)
      .from('audit_events')
      .insert({
        company_id: context.companyId || null,
        actor_user_id: context.userId,
        action: params.action,
        entity_type: params.entityType,
        entity_id: params.entityId || null,
        entity_reference: params.entityReference || null,
        before_json: params.before || null,
        after_json: params.after || null,
        metadata_json: params.metadata || null,
      })

    if (error) {
      // Audit failures should not break the application
      appLogger.error('Failed to create audit event', error)
    }
  }

  /**
   * Search audit events with filters.
   */
  async searchEvents(
    companyId: string,
    filters: AuditFilters = {}
  ): Promise<{ data: AuditEvent[]; total: number }> {
    const { page = 1, pageSize = 20 } = filters
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    let query = (this.supabase as any)
      .from('audit_events')
      .select('*', { count: 'exact' })
      .eq('company_id', companyId)

    if (filters.userId) {
      query = query.eq('actor_user_id', filters.userId)
    }
    if (filters.entityType) {
      query = query.eq('entity_type', filters.entityType)
    }
    if (filters.action) {
      query = query.eq('action', filters.action)
    }
    if (filters.entityId) {
      query = query.eq('entity_id', filters.entityId)
    }
    if (filters.entityReference) {
      query = query.ilike('entity_reference', ilikeSearch(filters.entityReference))
    }
    if (filters.dateFrom) {
      query = query.gte('created_at', filters.dateFrom)
    }
    if (filters.dateTo) {
      query = query.lte('created_at', filters.dateTo)
    }

    query = query.range(from, to).order('created_at', { ascending: false })

    const { data, error, count } = await query

    if (error) {
      throw handleSupabaseError(error)
    }

    return {
      data: data || [],
      total: count || 0,
    }
  }

  /**
   * Get audit events for a specific entity.
   */
  async getEntityAudit(
    entityType: string,
    entityId: string,
    context: RequestContext
  ): Promise<AuditEvent[]> {
    const query = (this.supabase as any)
      .from('audit_events')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (context.companyId) {
      query.eq('company_id', context.companyId)
    }

    const { data, error } = await query

    if (error) {
      throw handleSupabaseError(error)
    }

    return data || []
  }

  /**
   * Get audit statistics for a company.
   */
  async getStats(companyId: string): Promise<{
    totalEvents: number
    recentEvents: number
    actionsBreakdown: Record<string, number>
  }> {
    const { count: total } = await (this.supabase as any)
      .from('audit_events')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const { count: recent } = await (this.supabase as any)
      .from('audit_events')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .gte('created_at', sevenDaysAgo)

    return {
      totalEvents: total || 0,
      recentEvents: recent || 0,
      actionsBreakdown: {},
    }
  }
}

// Singleton instance
let auditServiceInstance: AuditService | null = null

export function getAuditService(): AuditService {
  if (!auditServiceInstance) {
    auditServiceInstance = new AuditService()
  }
  return auditServiceInstance
}
