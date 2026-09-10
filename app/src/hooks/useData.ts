/**
 * React hook layer for SANAD application.
 *
 * Wraps domain services with React hooks, providing the same interface
 * to pages while routing through the full service layer (auth, validation, audit).
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useCompany } from '../contexts/CompanyContext'
import { type RequestContext } from '../lib/api'
import { getCustomerService, type Customer } from '../lib/services/customer'
import { getMaterialService, type Material } from '../lib/services/material'
import { getWorkItemService, type WorkItem, type WorkItemMaterial } from '../lib/services/workItem'
import { getDocumentService, type Document } from '../lib/services/document'
import { getTodoService, type ToDo } from '../lib/services/todo'
import { getNotificationService, type Notification } from '../lib/services/notification'
import { getNoteService, type Note } from '../lib/services/note'
import { getReportIssueService, type ReportIssue } from '../lib/services/reportIssue'
import { getAttachmentService, type Attachment } from '../lib/services/attachment'
import { getAuditService, type AuditEvent } from '../lib/services/audit'
import { getCompanyService, type Company } from '../lib/services/company'
import { getMembershipService } from '../lib/services/membership'
import { getFactoryCodeService } from '../lib/services/factoryCode'
import { appLogger } from '../lib/logger'

// Re-export service types for consumers
export type { Customer, Material, WorkItem, WorkItemMaterial, Document, ToDo, Notification, Note, ReportIssue, Attachment, AuditEvent, Company }

// ─── Request Context Builder ──────────────────────────

function useRequestContext(): RequestContext | null {
  const { user } = useAuth()
  const { currentCompany, permissions } = useCompany()

  return useMemo(() => {
    if (!user || !currentCompany?.id) return null
    return {
      userId: user.id,
      companyId: currentCompany.id,
      permissions: permissions?.permissions || {},
      isSystemAdmin: user.isSystemAdmin || false,
    }
  }, [user, currentCompany, permissions])
}

// ─── Generic Hook ─────────────────────────────────────

function useFetch<T>(fetcher: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    fetcher()
      .then(result => {
        if (!cancelled) setData(result)
      })
      .catch(err => {
        if (!cancelled) setError(err.message || 'Failed to load data')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, deps)

  const refetch = useCallback(() => {
    setLoading(true)
    setError(null)
    fetcher()
      .then(result => setData(result))
      .catch(err => setError(err.message || 'Failed to load data'))
      .finally(() => setLoading(false))
  }, deps)

  return { data, loading, error, refetch }
}

// ─── Companies ────────────────────────────────────────

export function useCompanies() {
  const service = getCompanyService()
  const ctx = useRequestContext()
  return useFetch(async () => {
    if (!ctx) return []
    try {
      return await service.getUserCompanies(ctx)
    } catch {
      return []
    }
  }, [ctx?.userId])
}

export function useCompanyById(id: string | undefined) {
  const service = getCompanyService()
  return useFetch(async () => {
    if (!id) return null
    try {
      return await service.getCompanyById(id, { userId: '', permissions: {}, isSystemAdmin: true })
    } catch {
      return null
    }
  }, [id])
}

// ─── Customers ────────────────────────────────────────

export function useCustomers(companyId: string | undefined) {
  const service = getCustomerService()
  const ctx = useRequestContext()
  return useFetch(async () => {
    if (!companyId || !ctx) return []
    try {
      const result = await service.getCustomers(companyId, ctx)
      return result.data
    } catch {
      return []
    }
  }, [companyId, ctx?.userId])
}

export function useCustomerById(id: string | undefined) {
  const service = getCustomerService()
  const ctx = useRequestContext()
  return useFetch(async () => {
    if (!id || !ctx) return null
    try {
      return await service.getCustomerById(id, ctx)
    } catch {
      return null
    }
  }, [id, ctx?.userId])
}

export function useCreateCustomer() {
  const service = getCustomerService()
  const ctx = useRequestContext()
  const [loading, setLoading] = useState(false)

  const create = useCallback(async (customer: Partial<Customer>, companyId: string) => {
    if (!ctx) return null
    setLoading(true)
    try {
      const result = await service.createCustomer(customer as any, ctx)
      // Audit logging
      try {
        const auditService = getAuditService()
        await auditService.logEvent({
          action: 'CREATE',
          entityType: 'customer',
          entityId: result.id,
          entityReference: result.name,
          after: result as unknown as Record<string, unknown>,
        }, ctx)
      } catch {
        // Audit logging is non-critical
      }
      return result
    } catch (err) {
      appLogger.error('Failed to create customer', err)
      return null
    } finally {
      setLoading(false)
    }
  }, [ctx])

  return { create, loading }
}

export function useUpdateCustomer() {
  const service = getCustomerService()
  const ctx = useRequestContext()
  const [loading, setLoading] = useState(false)

  const update = useCallback(async (id: string, updates: Partial<Customer>) => {
    if (!ctx) return null
    setLoading(true)
    try {
      const result = await service.updateCustomer(id, updates as any, ctx)
      // Audit logging
      try {
        const auditService = getAuditService()
        await auditService.logEvent({
          action: 'EDIT',
          entityType: 'customer',
          entityId: id,
          entityReference: result.name,
          after: result as unknown as Record<string, unknown>,
        }, ctx)
      } catch {
        // Audit logging is non-critical
      }
      return result
    } catch (err) {
      appLogger.error('Failed to update customer', err)
      return null
    } finally {
      setLoading(false)
    }
  }, [ctx])

  return { update, loading }
}

export function useDeleteCustomer() {
  const service = getCustomerService()
  const ctx = useRequestContext()
  const [loading, setLoading] = useState(false)

  const remove = useCallback(async (id: string) => {
    if (!ctx) return false
    setLoading(true)
    try {
      await service.deleteCustomer(id, ctx)
      // Audit logging
      try {
        const auditService = getAuditService()
        await auditService.logEvent({
          action: 'MOVE_TO_TRASH',
          entityType: 'customer',
          entityId: id,
        }, ctx)
      } catch {
        // Audit logging is non-critical
      }
      return true
    } catch (err) {
      appLogger.error('Failed to delete customer', err)
      return false
    } finally {
      setLoading(false)
    }
  }, [ctx])

  return { remove, loading }
}

// ─── Materials ────────────────────────────────────────

export function useMaterials(companyId: string | undefined) {
  const service = getMaterialService()
  const ctx = useRequestContext()
  return useFetch(async () => {
    if (!companyId || !ctx) return []
    try {
      const result = await service.getMaterials(companyId, ctx)
      return result.data
    } catch {
      return []
    }
  }, [companyId, ctx?.userId])
}

export function useMaterialById(id: string | undefined) {
  const service = getMaterialService()
  const ctx = useRequestContext()
  return useFetch(async () => {
    if (!id || !ctx) return null
    try {
      return await service.getMaterialById(id, ctx)
    } catch {
      return null
    }
  }, [id, ctx?.userId])
}

export function useCreateMaterial() {
  const service = getMaterialService()
  const ctx = useRequestContext()
  const [loading, setLoading] = useState(false)

  const create = useCallback(async (material: Partial<Material>, companyId: string) => {
    if (!ctx) return null
    setLoading(true)
    try {
      const result = await service.createMaterial(material as any, ctx)
      // Audit logging
      try {
        const auditService = getAuditService()
        await auditService.logEvent({
          action: 'CREATE',
          entityType: 'material',
          entityId: result.id,
          entityReference: result.name,
          after: result as unknown as Record<string, unknown>,
        }, ctx)
      } catch {
        // Audit logging is non-critical
      }
      return result
    } catch (err) {
      appLogger.error('Failed to create material', err)
      return null
    } finally {
      setLoading(false)
    }
  }, [ctx])

  return { create, loading }
}

export function useUpdateMaterial() {
  const service = getMaterialService()
  const ctx = useRequestContext()
  const [loading, setLoading] = useState(false)

  const update = useCallback(async (id: string, updates: Partial<Material>) => {
    if (!ctx) return null
    setLoading(true)
    try {
      const result = await service.updateMaterial(id, updates as any, ctx)
      // Audit logging
      try {
        const auditService = getAuditService()
        await auditService.logEvent({
          action: 'EDIT',
          entityType: 'material',
          entityId: id,
          entityReference: result.name,
          after: result as unknown as Record<string, unknown>,
        }, ctx)
      } catch {
        // Audit logging is non-critical
      }
      return result
    } catch (err) {
      appLogger.error('Failed to update material', err)
      return null
    } finally {
      setLoading(false)
    }
  }, [ctx])

  return { update, loading }
}

export function useDeleteMaterial() {
  const service = getMaterialService()
  const ctx = useRequestContext()
  const [loading, setLoading] = useState(false)

  const remove = useCallback(async (id: string) => {
    if (!ctx) return false
    setLoading(true)
    try {
      await service.deleteMaterial(id, ctx)
      // Audit logging
      try {
        const auditService = getAuditService()
        await auditService.logEvent({
          action: 'MOVE_TO_TRASH',
          entityType: 'material',
          entityId: id,
        }, ctx)
      } catch {
        // Audit logging is non-critical
      }
      return true
    } catch (err) {
      appLogger.error('Failed to delete material', err)
      return false
    } finally {
      setLoading(false)
    }
  }, [ctx])

  return { remove, loading }
}

// ─── Work Items ───────────────────────────────────────

export function useWorkItems(companyId: string | undefined, type?: string) {
  const service = getWorkItemService()
  const ctx = useRequestContext()
  return useFetch(async () => {
    if (!companyId || !ctx) return []
    try {
      const result = await service.getWorkItems(companyId, ctx, { type: type as any })
      return result.data
    } catch {
      return []
    }
  }, [companyId, type, ctx?.userId])
}

export function useWorkItemById(id: string | undefined) {
  const service = getWorkItemService()
  const ctx = useRequestContext()
  return useFetch(async () => {
    if (!id || !ctx) return null
    try {
      return await service.getWorkItemById(id, ctx)
    } catch {
      return null
    }
  }, [id, ctx?.userId])
}

export function useWorkItemMaterials(workItemId: string | undefined) {
  const service = getWorkItemService()
  const ctx = useRequestContext()
  return useFetch(async () => {
    if (!workItemId || !ctx) return []
    try {
      return await service.getWorkItemMaterials(workItemId, ctx)
    } catch {
      return []
    }
  }, [workItemId, ctx?.userId])
}

export function useCreateWorkItem() {
  const service = getWorkItemService()
  const ctx = useRequestContext()
  const [loading, setLoading] = useState(false)

  const create = useCallback(async (item: Partial<WorkItem>, companyId: string) => {
    if (!ctx) return null
    setLoading(true)
    try {
      const result = await service.createWorkItem(item as any, { ...ctx, companyId })
      // Audit logging
      try {
        const auditService = getAuditService()
        await auditService.logEvent({
          action: 'CREATE',
          entityType: result.type === 'project' ? 'project' : 'task',
          entityId: result.id,
          entityReference: result.name,
          after: result as unknown as Record<string, unknown>,
        }, ctx)
      } catch {
        // Audit logging is non-critical
      }
      // Notification creation
      try {
        const notificationService = getNotificationService()
        const isProject = result.type === 'project'
        await notificationService.createNotification({
          userId: ctx.userId,
          companyId: ctx.companyId,
          type: isProject ? 'project_status_changed' : 'task_assigned',
          title: isProject ? `Project "${result.name}" created` : `Task "${result.name}" created`,
          body: isProject ? 'A new project has been created.' : 'A new task has been created.',
          entityType: isProject ? 'project' : 'task',
          entityId: result.id,
        })
      } catch {
        // Notification creation is non-critical
      }
      return result
    } catch (err) {
      appLogger.error('Failed to create work item', err)
      return null
    } finally {
      setLoading(false)
    }
  }, [ctx])

  return { create, loading }
}

export function useUpdateWorkItem() {
  const service = getWorkItemService()
  const ctx = useRequestContext()
  const [loading, setLoading] = useState(false)

  const update = useCallback(async (id: string, updates: Partial<WorkItem>) => {
    if (!ctx) return null
    setLoading(true)
    try {
      const result = await service.updateWorkItem(id, updates as any, ctx)
      // Audit logging
      try {
        const auditService = getAuditService()
        await auditService.logEvent({
          action: 'EDIT',
          entityType: result.type === 'project' ? 'project' : 'task',
          entityId: id,
          entityReference: result.name,
          after: result as unknown as Record<string, unknown>,
        }, ctx)
      } catch {
        // Audit logging is non-critical
      }
      return result
    } catch (err) {
      appLogger.error('Failed to update work item', err)
      return null
    } finally {
      setLoading(false)
    }
  }, [ctx])

  return { update, loading }
}

export function useConvertTaskToProject() {
  const service = getWorkItemService()
  const ctx = useRequestContext()
  const [loading, setLoading] = useState(false)

  const convert = useCallback(async (id: string) => {
    if (!ctx) return null
    setLoading(true)
    try {
      const result = await service.convertTaskToProject(id, ctx)
      // Audit logging
      try {
        const auditService = getAuditService()
        await auditService.logEvent({
          action: 'TASK_TO_PROJECT',
          entityType: 'work_item',
          entityId: id,
          entityReference: result.name,
          after: result as unknown as Record<string, unknown>,
        }, ctx)
      } catch {
        // Audit logging is non-critical
      }
      return result
    } catch (err) {
      appLogger.error('Failed to convert task to project', err)
      return null
    } finally {
      setLoading(false)
    }
  }, [ctx])

  return { convert, loading }
}

export function useDeleteWorkItem() {
  const service = getWorkItemService()
  const ctx = useRequestContext()
  const [loading, setLoading] = useState(false)

  const remove = useCallback(async (id: string) => {
    if (!ctx) return null
    setLoading(true)
    try {
      await service.deleteWorkItem(id, ctx)
      // Audit logging
      try {
        const auditService = getAuditService()
        await auditService.logEvent({
          action: 'MOVE_TO_TRASH',
          entityType: 'work_item',
          entityId: id,
        }, ctx)
      } catch {
        // Audit logging is non-critical
      }
      return true
    } catch (err) {
      appLogger.error('Failed to delete work item', err)
      return false
    } finally {
      setLoading(false)
    }
  }, [ctx])

  return { remove, loading }
}

// ─── Documents ────────────────────────────────────────

export function useDocuments(workItemId: string | undefined) {
  const service = getDocumentService()
  const ctx = useRequestContext()
  return useFetch(async () => {
    if (!workItemId || !ctx) return []
    try {
      // getDocuments returns Document[] directly
      return await service.getDocuments(workItemId, ctx)
    } catch {
      return []
    }
  }, [workItemId, ctx?.userId])
}

export function useCompanyDocuments(companyId: string | undefined) {
  const service = getDocumentService()
  const ctx = useRequestContext()
  return useFetch(async () => {
    if (!companyId || !ctx) return []
    try {
      const result = await service.getCompanyDocuments(companyId, ctx)
      return result.data
    } catch {
      return []
    }
  }, [companyId, ctx?.userId])
}

export function useCreateDocument() {
  const service = getDocumentService()
  const ctx = useRequestContext()
  const [loading, setLoading] = useState(false)

  const create = useCallback(async (input: { work_item_id: string; document_type: string; document_number: string; language?: string; template_key?: string; prepared_by?: string; show_signature?: boolean; show_stamp?: boolean; status?: string; document_data?: Record<string, unknown> }) => {
    if (!ctx) return null
    setLoading(true)
    try {
      const result = await service.createDocument(input as any, ctx)
      // Audit logging
      try {
        const auditService = getAuditService()
        await auditService.logEvent({
          action: 'CREATE',
          entityType: 'document',
          entityId: result.id,
          entityReference: result.document_number,
          after: result as unknown as Record<string, unknown>,
        }, ctx)
      } catch {
        // Audit logging is non-critical
      }
      // Notification creation
      try {
        const notificationService = getNotificationService()
        await notificationService.createNotification({
          userId: ctx.userId,
          companyId: ctx.companyId,
          type: 'document_created',
          title: `Document ${result.document_number} created`,
          body: `A new ${result.document_type} document has been created.`,
          entityType: 'document',
          entityId: result.id,
        })
      } catch {
        // Notification creation is non-critical
      }
      return result
    } catch (err) {
      appLogger.error('Failed to create document', err)
      return null
    } finally {
      setLoading(false)
    }
  }, [ctx])

  return { create, loading }
}

export function useUpdateDocument() {
  const service = getDocumentService()
  const ctx = useRequestContext()
  const [loading, setLoading] = useState(false)

  const update = useCallback(async (id: string, updates: Record<string, unknown>) => {
    if (!ctx) return null
    setLoading(true)
    try {
      const result = await service.updateDocument(id, updates as any, ctx)
      // Audit logging
      try {
        const auditService = getAuditService()
        await auditService.logEvent({
          action: 'EDIT',
          entityType: 'document',
          entityId: id,
          entityReference: result.document_number,
          after: result as unknown as Record<string, unknown>,
        }, ctx)
      } catch {
        // Audit logging is non-critical
      }
      return result
    } catch (err) {
      appLogger.error('Failed to update document', err)
      return null
    } finally {
      setLoading(false)
    }
  }, [ctx])

  return { update, loading }
}

export function useUpdateMaterialLastPrice() {
  const service = getMaterialService()
  const ctx = useRequestContext()
  const [loading, setLoading] = useState(false)

  const updateLastPrice = useCallback(async (materialId: string, price: number, currency: string, unit: string, workItemId?: string) => {
    if (!ctx) return
    setLoading(true)
    try {
      await service.updateLastSellingPrice(materialId, price, currency, unit, ctx, workItemId)
    } catch (err) {
      appLogger.error('Failed to update material last price', err)
    } finally {
      setLoading(false)
    }
  }, [ctx])

  return { updateLastPrice, loading }
}

// ─── Todos ────────────────────────────────────────────

export function useTodos(userId: string | undefined) {
  const service = getTodoService()
  const ctx = useRequestContext()
  return useFetch(async () => {
    if (!userId || !ctx) return []
    try {
      const result = await service.getTodos(userId, ctx)
      return result.data
    } catch {
      return []
    }
  }, [userId, ctx?.userId])
}

export function useCreateTodo() {
  const service = getTodoService()
  const ctx = useRequestContext()
  const [loading, setLoading] = useState(false)

  const create = useCallback(async (todo: Partial<ToDo>, userId: string) => {
    if (!ctx) return null
    setLoading(true)
    try {
      const result = await service.createTodo(todo as any, ctx)
      return result
    } catch (err) {
      appLogger.error('Failed to create todo', err)
      return null
    } finally {
      setLoading(false)
    }
  }, [ctx])

  return { create, loading }
}

export function useUpdateTodo() {
  const service = getTodoService()
  const ctx = useRequestContext()
  const [loading, setLoading] = useState(false)

  const update = useCallback(async (id: string, updates: Partial<ToDo>) => {
    if (!ctx) return null
    setLoading(true)
    try {
      const result = await service.updateTodo(id, updates as any, ctx)
      return result
    } catch (err) {
      appLogger.error('Failed to update todo', err)
      return null
    } finally {
      setLoading(false)
    }
  }, [ctx])

  return { update, loading }
}

export function useDeleteTodo() {
  const service = getTodoService()
  const ctx = useRequestContext()
  const [loading, setLoading] = useState(false)

  const remove = useCallback(async (id: string) => {
    if (!ctx) return false
    setLoading(true)
    try {
      await service.deleteTodo(id, ctx)
      return true
    } catch (err) {
      appLogger.error('Failed to delete todo', err)
      return false
    } finally {
      setLoading(false)
    }
  }, [ctx])

  return { remove, loading }
}

// ─── Notifications ────────────────────────────────────

export function useNotifications(userId: string | undefined) {
  const service = getNotificationService()
  return useFetch(async () => {
    if (!userId) return []
    try {
      // getNotifications takes userId and options (not context)
      return await service.getNotifications(userId)
    } catch {
      return []
    }
  }, [userId])
}

export function useMarkNotificationRead() {
  const service = getNotificationService()
  const [loading, setLoading] = useState(false)

  const markRead = useCallback(async (notificationId: string, userId: string) => {
    setLoading(true)
    try {
      await service.markAsRead(notificationId, userId)
      return true
    } catch (err) {
      appLogger.error('Failed to mark notification as read', err)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  return { markRead, loading }
}

export function useMarkAllNotificationsRead() {
  const service = getNotificationService()
  const [loading, setLoading] = useState(false)

  const markAllRead = useCallback(async (userId: string) => {
    setLoading(true)
    try {
      await service.markAllAsRead(userId)
      return true
    } catch (err) {
      appLogger.error('Failed to mark all notifications as read', err)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  return { markAllRead, loading }
}

// ─── Notes ────────────────────────────────────────────

export function useNotes(workItemId: string | undefined) {
  const service = getNoteService()
  const ctx = useRequestContext()
  return useFetch(async () => {
    if (!workItemId || !ctx) return []
    try {
      // getNotes returns Note[] directly
      return await service.getNotes(workItemId, ctx)
    } catch {
      return []
    }
  }, [workItemId, ctx?.userId])
}

// ─── Report Issues ────────────────────────────────────

export function useReportIssues(workItemId: string | undefined) {
  const service = getReportIssueService()
  const ctx = useRequestContext()
  return useFetch(async () => {
    if (!workItemId || !ctx) return []
    try {
      // getIssues returns ReportIssue[] directly
      return await service.getIssues(workItemId, ctx)
    } catch {
      return []
    }
  }, [workItemId, ctx?.userId])
}

export function useCompanyReportIssues(companyId: string | undefined) {
  const ctx = useRequestContext()
  return useFetch(async () => {
    if (!companyId || !ctx) return []
    try {
      // No service method for company-level issues; query directly
      const { getSupabase } = await import('../lib/supabase')
      const sb = getSupabase()
      const { data, error } = await (sb as any)
        .from('report_issues')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(200)
      if (error) return []
      return data || []
    } catch {
      return []
    }
  }, [companyId, ctx?.userId])
}

// ─── Attachments ──────────────────────────────────────

export function useAttachments(workItemId: string | undefined) {
  const service = getAttachmentService()
  const ctx = useRequestContext()
  return useFetch(async () => {
    if (!workItemId || !ctx) return []
    try {
      // getAttachments returns Attachment[] directly
      return await service.getAttachments(workItemId, ctx)
    } catch {
      return []
    }
  }, [workItemId, ctx?.userId])
}

// ─── Audit ────────────────────────────────────────────

export function useAuditEvents(companyId: string | undefined) {
  const service = getAuditService()
  const ctx = useRequestContext()
  return useFetch(async () => {
    if (!companyId || !ctx) return []
    try {
      // searchEvents takes companyId and filters, returns { data, total }
      const result = await service.searchEvents(companyId, { pageSize: 100 })
      return result.data
    } catch {
      return []
    }
  }, [companyId, ctx?.userId])
}

// ─── Factory Code ─────────────────────────────────────

export function useFactoryCodeSearch(query: string) {
  const service = getFactoryCodeService()
  const ctx = useRequestContext()
  return useFetch(async () => {
    if (!query || !ctx) return []
    try {
      const result = await service.search(query, ctx)
      return result.data
    } catch {
      return []
    }
  }, [query, ctx?.userId])
}

/**
 * Fetch all factory code records (for full database export).
 * Uses a large page size to retrieve all records at once.
 */
export function useFactoryCodeAll() {
  const service = getFactoryCodeService()
  const ctx = useRequestContext()
  return useFetch(async () => {
    if (!ctx) return []
    try {
      const result = await service.search('', ctx, { pageSize: 50000 })
      return result.data
    } catch {
      return []
    }
  }, [ctx?.userId])
}

// ─── Trash Entries ────────────────────────────────────

export function useTrashEntries(companyId: string | undefined) {
  const ctx = useRequestContext()
  return useFetch(async () => {
    if (!companyId || !ctx) return []
    try {
      const { getSupabase } = await import('../lib/supabase')
      const sb = getSupabase()
      const { data, error } = await (sb as any)
        .from('trash_entries')
        .select('*')
        .eq('company_id', companyId)
        .order('deleted_at', { ascending: false })
      if (error) return []
      return data || []
    } catch {
      return []
    }
  }, [companyId, ctx?.userId])
}

export function useRestoreTrashEntry() {
  const ctx = useRequestContext()
  const [loading, setLoading] = useState(false)

  const restore = useCallback(async (entityType: string, entityId: string) => {
    if (!ctx) return false
    setLoading(true)
    try {
      const { getSupabase } = await import('../lib/supabase')
      const sb = getSupabase()
      // Remove trash entry (scoped to company)
      const deleteQuery = (sb as any)
        .from('trash_entries')
        .delete()
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
      if (ctx.companyId) {
        deleteQuery.eq('company_id', ctx.companyId)
      }
      await deleteQuery
      // Restore entity by clearing deleted_at
      const tableMap: Record<string, string> = {
        project: 'work_items',
        task: 'work_items',
        customer: 'customers',
        material: 'materials',
        document: 'documents',
        attachment: 'attachments',
      }
      const table = tableMap[entityType] || entityType + 's'
      const updateQuery = (sb as any)
        .from(table)
        .update({ deleted_at: null, updated_at: new Date().toISOString() })
        .eq('id', entityId)
      if (ctx.companyId) {
        updateQuery.eq('company_id', ctx.companyId)
      }
      await updateQuery
      return true
    } catch (err) {
      appLogger.error('Failed to restore trash entry', err)
      return false
    } finally {
      setLoading(false)
    }
  }, [ctx])

  return { restore, loading }
}

// ─── Company Memberships ──────────────────────────────

export function useCompanyMemberships(companyId: string | undefined) {
  const service = getMembershipService()
  const ctx = useRequestContext()
  return useFetch(async () => {
    if (!companyId || !ctx) return []
    try {
      // getCompanyMemberships returns MembershipWithUser[] directly
      return await service.getCompanyMemberships(companyId, ctx)
    } catch {
      return []
    }
  }, [companyId, ctx?.userId])
}

// ─── Users (company members) ──────────────────────────

export function useCompanyUsers(companyId: string | undefined) {
  const ctx = useRequestContext()
  return useFetch(async () => {
    if (!companyId || !ctx) return []
    try {
      const { getSupabase } = await import('../lib/supabase')
      const sb = getSupabase()
      const { data, error } = await (sb as any)
        .from('company_memberships')
        .select('*, users(*)')
        .eq('company_id', companyId)
        .eq('active', true)
      if (error) return []
      return (data || []).map((m: any) => ({
        ...m.users,
        membershipId: m.id,
        base_role: m.base_role,
        company_id: m.company_id,
      }))
    } catch {
      return []
    }
  }, [companyId, ctx?.userId])
}
