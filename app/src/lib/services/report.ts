/**
 * Report service for SANAD application.
 * 
 * Generates reports for company data with filtering and export.
 */

import { getSupabase, type Database } from '../supabase'
import { type RequestContext, requirePermission } from '../api'
import { handleSupabaseError } from '../errors'
import { appLogger } from '../logger'
import type { SupabaseClient } from '@supabase/supabase-js'

// ===========================================
// Types
// ===========================================

export type ReportType =
  | 'projects_by_status' | 'projects_by_date' | 'projects_by_company' | 'projects_by_customer'
  | 'documents_register' | 'tasks' | 'overdue_tasks'
  | 'user_activity' | 'customer_export_history' | 'material_export_history'
  | 'audit_report'

export interface ReportFilters {
  companyId?: string
  dateFrom?: string
  dateTo?: string
  status?: string
  customerId?: string
  materialId?: string
  userId?: string
  documentType?: string
}

export interface ReportResult {
  headers: string[]
  rows: Array<Record<string, unknown>>
  total: number
}

// ===========================================
// Report Service
// ===========================================

export class ReportService {
  private supabase: SupabaseClient<Database>

  constructor() {
    this.supabase = getSupabase()
  }

  /**
   * Generate a report based on type and filters.
   */
  async generateReport(
    reportType: ReportType,
    filters: ReportFilters,
    context: RequestContext
  ): Promise<ReportResult> {
    requirePermission(context, 'reports.view')

    switch (reportType) {
      case 'projects_by_status':
        return this.projectsByStatus(filters, context)
      case 'projects_by_date':
        return this.projectsByDate(filters, context)
      case 'projects_by_customer':
        return this.projectsByCustomer(filters, context)
      case 'tasks':
        return this.tasksReport(filters, context)
      case 'overdue_tasks':
        return this.overdueTasksReport(filters, context)
      case 'documents_register':
        return this.documentsRegister(filters, context)
      case 'user_activity':
        return this.userActivityReport(filters, context)
      case 'audit_report':
        return this.auditReport(filters, context)
      default:
        return { headers: [], rows: [], total: 0 }
    }
  }

  private async projectsByStatus(filters: ReportFilters, context: RequestContext): Promise<ReportResult> {
    let query = (this.supabase as any)
      .from('work_items')
      .select('status, count')
      .eq('company_id', filters.companyId || context.companyId)
      .eq('type', 'project')
      .eq('active', true)
      .is('deleted_at', null)

    const { data, error } = await query

    if (error) throw handleSupabaseError(error)

    // Group by status
    const statusCounts: Record<string, number> = {}
    ;(data || []).forEach((item: any) => {
      statusCounts[item.status] = (statusCounts[item.status] || 0) + 1
    })

    const rows = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
    }))

    return {
      headers: ['Status', 'Count'],
      rows,
      total: rows.reduce((sum, r) => sum + (r.count as number), 0),
    }
  }

  private async projectsByDate(filters: ReportFilters, context: RequestContext): Promise<ReportResult> {
    let query = (this.supabase as any)
      .from('work_items')
      .select('created_at, name, status')
      .eq('company_id', filters.companyId || context.companyId)
      .eq('type', 'project')
      .eq('active', true)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (filters.dateFrom) query = query.gte('created_at', filters.dateFrom)
    if (filters.dateTo) query = query.lte('created_at', filters.dateTo)

    const { data, error } = await query

    if (error) throw handleSupabaseError(error)

    const rows = (data || []).map((item: any) => ({
      date: item.created_at,
      name: item.name,
      status: item.status,
    }))

    return {
      headers: ['Date', 'Name', 'Status'],
      rows,
      total: rows.length,
    }
  }

  private async projectsByCustomer(filters: ReportFilters, context: RequestContext): Promise<ReportResult> {
    let query = (this.supabase as any)
      .from('work_items')
      .select('customer_id, status')
      .eq('company_id', filters.companyId || context.companyId)
      .eq('type', 'project')
      .eq('active', true)
      .is('deleted_at', null)

    if (filters.customerId) query = query.eq('customer_id', filters.customerId)

    const { data, error } = await query

    if (error) throw handleSupabaseError(error)

    // Group by customer
    const customerCounts: Record<string, number> = {}
    ;(data || []).forEach((item: any) => {
      const key = item.customer_id || 'No Customer'
      customerCounts[key] = (customerCounts[key] || 0) + 1
    })

    const rows = Object.entries(customerCounts).map(([customer, count]) => ({
      customer,
      count,
    }))

    return {
      headers: ['Customer', 'Count'],
      rows,
      total: rows.reduce((sum, r) => sum + (r.count as number), 0),
    }
  }

  private async tasksReport(filters: ReportFilters, context: RequestContext): Promise<ReportResult> {
    let query = (this.supabase as any)
      .from('work_items')
      .select('id, name, status, created_at, updated_at')
      .eq('company_id', filters.companyId || context.companyId)
      .eq('type', 'task')
      .eq('active', true)
      .is('deleted_at', null)
      .order('updated_at', { ascending: false })

    if (filters.status) query = query.eq('status', filters.status)

    const { data, error } = await query

    if (error) throw handleSupabaseError(error)

    const rows = (data || []).map((item: any) => ({
      name: item.name,
      status: item.status,
      created: item.created_at,
      updated: item.updated_at,
    }))

    return {
      headers: ['Name', 'Status', 'Created', 'Updated'],
      rows,
      total: rows.length,
    }
  }

  private async overdueTasksReport(filters: ReportFilters, context: RequestContext): Promise<ReportResult> {
    const today = new Date().toISOString().split('T')[0]

    const { data, error } = await (this.supabase as any)
      .from('work_items')
      .select('id, name, status, created_at')
      .eq('company_id', filters.companyId || context.companyId)
      .eq('type', 'task')
      .eq('active', true)
      .is('deleted_at', null)
      .eq('status', 'in_progress')

    if (error) throw handleSupabaseError(error)

    const rows = (data || []).map((item: any) => ({
      name: item.name,
      status: item.status,
      created: item.created_at,
    }))

    return {
      headers: ['Name', 'Status', 'Created'],
      rows,
      total: rows.length,
    }
  }

  private async documentsRegister(filters: ReportFilters, context: RequestContext): Promise<ReportResult> {
    let query = (this.supabase as any)
      .from('documents')
      .select('document_number, document_type, created_date, status, prepared_by')
      .eq('company_id', filters.companyId || context.companyId)
      .is('deleted_at', null)
      .order('created_date', { ascending: false })

    if (filters.documentType) query = query.eq('document_type', filters.documentType)

    const { data, error } = await query

    if (error) throw handleSupabaseError(error)

    const rows = (data || []).map((item: any) => ({
      number: item.document_number,
      type: item.document_type,
      date: item.created_date,
      status: item.status,
      prepared_by: item.prepared_by,
    }))

    return {
      headers: ['Number', 'Type', 'Date', 'Status', 'Prepared By'],
      rows,
      total: rows.length,
    }
  }

  private async userActivityReport(filters: ReportFilters, context: RequestContext): Promise<ReportResult> {
    let query = (this.supabase as any)
      .from('audit_events')
      .select('actor_user_id, action, entity_type, created_at')
      .eq('company_id', filters.companyId || context.companyId)
      .order('created_at', { ascending: false })
      .limit(100)

    if (filters.userId) query = query.eq('actor_user_id', filters.userId)

    const { data, error } = await query

    if (error) throw handleSupabaseError(error)

    const rows = (data || []).map((item: any) => ({
      user: item.actor_user_id,
      action: item.action,
      entity: item.entity_type,
      date: item.created_at,
    }))

    return {
      headers: ['User', 'Action', 'Entity', 'Date'],
      rows,
      total: rows.length,
    }
  }

  private async auditReport(filters: ReportFilters, context: RequestContext): Promise<ReportResult> {
    let query = (this.supabase as any)
      .from('audit_events')
      .select('actor_user_id, action, entity_type, entity_reference, created_at')
      .eq('company_id', filters.companyId || context.companyId)
      .order('created_at', { ascending: false })
      .limit(100)

    if (filters.dateFrom) query = query.gte('created_at', filters.dateFrom)
    if (filters.dateTo) query = query.lte('created_at', filters.dateTo)

    const { data, error } = await query

    if (error) throw handleSupabaseError(error)

    const rows = (data || []).map((item: any) => ({
      user: item.actor_user_id,
      action: item.action,
      entity: item.entity_type,
      reference: item.entity_reference,
      date: item.created_at,
    }))

    return {
      headers: ['User', 'Action', 'Entity', 'Reference', 'Date'],
      rows,
      total: rows.length,
    }
  }

  /**
   * Get available report types.
   */
  getReportTypes(): Array<{ id: ReportType; name: string; nameAr: string }> {
    return [
      { id: 'projects_by_status', name: 'Projects by Status', nameAr: 'المشاريع حسب الحالة' },
      { id: 'projects_by_date', name: 'Projects by Date', nameAr: 'المشاريع حسب التاريخ' },
      { id: 'projects_by_customer', name: 'Projects by Customer', nameAr: 'المشاريع حسب العميل' },
      { id: 'documents_register', name: 'Documents Register', nameAr: 'سجل المستندات' },
      { id: 'tasks', name: 'Tasks', nameAr: 'المهام' },
      { id: 'overdue_tasks', name: 'Overdue Tasks', nameAr: 'المهام المتأخرة' },
      { id: 'user_activity', name: 'User Activity', nameAr: 'نشاط المستخدم' },
      { id: 'audit_report', name: 'Audit Report', nameAr: 'تقرير المراجعة' },
    ]
  }
}

// Singleton instance
let reportServiceInstance: ReportService | null = null

export function getReportService(): ReportService {
  if (!reportServiceInstance) {
    reportServiceInstance = new ReportService()
  }
  return reportServiceInstance
}
