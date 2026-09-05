/**
 * Report Issue service for SANAD application.
 * 
 * Handles report issues for projects/tasks.
 * Viewers can create issues, authorized users can update status/severity.
 */

import { getSupabase, type Database } from '../supabase'
import { type RequestContext } from '../api'
import { NotFoundError, handleSupabaseError } from '../errors'
import { appLogger } from '../logger'
import type { SupabaseClient } from '@supabase/supabase-js'

// ===========================================
// Types
// ===========================================

export type IssueSeverity = 'low' | 'medium' | 'high' | 'critical'
export type IssueStatus = 'open' | 'under_review' | 'resolved' | 'rejected'

export interface ReportIssue {
  id: string
  company_id: string
  work_item_id: string
  reporter_user_id: string
  body: string
  severity: IssueSeverity
  status: IssueStatus
  resolved_by: string | null
  resolved_at: string | null
  created_at: string
  updated_at: string
}

export interface CreateIssueInput {
  body: string
  severity?: IssueSeverity
}

export interface UpdateIssueInput {
  body?: string
  severity?: IssueSeverity
  status?: IssueStatus
}

// ===========================================
// Report Issue Service
// ===========================================

export class ReportIssueService {
  private supabase: SupabaseClient<Database>

  constructor() {
    this.supabase = getSupabase()
  }

  /**
   * Get issues for a work item.
   */
  async getIssues(workItemId: string, context: RequestContext): Promise<ReportIssue[]> {
    const { data, error } = await (this.supabase as any)
      .from('report_issues')
      .select('*')
      .eq('work_item_id', workItemId)
      .order('created_at', { ascending: false })

    if (error) {
      appLogger.error('Error fetching issues', error)
      throw handleSupabaseError(error)
    }

    return data || []
  }

  /**
   * Get an issue by ID.
   */
  async getIssueById(id: string, context: RequestContext): Promise<ReportIssue> {
    const { data, error } = await (this.supabase as any)
      .from('report_issues')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      throw new NotFoundError('Report Issue', id)
    }

    return data
  }

  /**
   * Create an issue. Viewers can create issues.
   */
  async createIssue(
    workItemId: string,
    input: CreateIssueInput,
    context: RequestContext
  ): Promise<ReportIssue> {
    const { data: workItem } = await (this.supabase as any)
      .from('work_items')
      .select('company_id')
      .eq('id', workItemId)
      .single()

    if (!workItem) {
      throw new NotFoundError('Work Item', workItemId)
    }

    const { data, error } = await (this.supabase as any)
      .from('report_issues')
      .insert({
        company_id: workItem.company_id,
        work_item_id: workItemId,
        reporter_user_id: context.userId,
        body: input.body,
        severity: input.severity || 'medium',
        status: 'open',
      })
      .select()
      .single()

    if (error) {
      appLogger.error('Error creating issue', error)
      throw handleSupabaseError(error)
    }

    appLogger.info('Report issue created', { issueId: data.id, workItemId })
    return data
  }

  /**
   * Update an issue. Admin/user can update status/severity.
   */
  async updateIssue(id: string, input: UpdateIssueInput, context: RequestContext): Promise<ReportIssue> {
    const existing = await this.getIssueById(id, context)

    const updateData: Record<string, unknown> = {}
    if (input.body !== undefined) updateData.body = input.body
    if (input.severity !== undefined) updateData.severity = input.severity
    if (input.status !== undefined) {
      updateData.status = input.status
      if (input.status === 'resolved' || input.status === 'rejected') {
        updateData.resolved_by = context.userId
        updateData.resolved_at = new Date().toISOString()
      }
    }

    const { data, error } = await (this.supabase as any)
      .from('report_issues')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      appLogger.error('Error updating issue', error)
      throw handleSupabaseError(error)
    }

    appLogger.info('Report issue updated', { issueId: id, changes: input })
    return data
  }

  /**
   * Delete an issue.
   */
  async deleteIssue(id: string, context: RequestContext): Promise<void> {
    const { error } = await (this.supabase as any)
      .from('report_issues')
      .delete()
      .eq('id', id)

    if (error) {
      appLogger.error('Error deleting issue', error)
      throw handleSupabaseError(error)
    }

    appLogger.info('Report issue deleted', { issueId: id })
  }

  /**
   * Get issue count for a work item.
   */
  async getIssueCount(workItemId: string, status?: IssueStatus): Promise<number> {
    let query = (this.supabase as any)
      .from('report_issues')
      .select('*', { count: 'exact', head: true })
      .eq('work_item_id', workItemId)

    if (status) {
      query = query.eq('status', status)
    }

    const { count, error } = await query

    if (error) {
      return 0
    }

    return count || 0
  }
}

// Singleton instance
let reportIssueServiceInstance: ReportIssueService | null = null

export function getReportIssueService(): ReportIssueService {
  if (!reportIssueServiceInstance) {
    reportIssueServiceInstance = new ReportIssueService()
  }
  return reportIssueServiceInstance
}
