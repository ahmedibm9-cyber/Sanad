// @ts-nocheck
/**
 * Data layer for SANAD application.
 *
 * DEPRECATED: Pages should use hooks from hooks/useData.ts which route through
 * the domain services in lib/services/ with proper auth, validation, and audit.
 * This file is retained only for type re-exports used by some pages.
 */

import { getSupabase, type Database } from './supabase'
import { appLogger } from './logger'
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
}

export interface User {
  id: string
  display_name: string
  email: string
  preferred_language: string
  is_system_admin: boolean
  active: boolean
  created_at: string
  updated_at: string
}

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
  default_currency: string | null
  default_vat_treatment: string | null
  payment_terms: string | null
  payment_method_notes: string | null
  default_incoterm: string | null
  delivery_terms: string | null
  default_document_language: string | null
  default_document_template: string | null
  commercial_notes: string | null
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
  notes: string | null
  active: boolean
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
  deleted_at: string | null
}

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

export interface WorkItem {
  id: string
  company_id: string
  type: 'task' | 'project'
  name: string
  customer_id: string | null
  status: string
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
  // Joined fields
  customer_name?: string
}

export interface Document {
  id: string
  company_id: string
  work_item_id: string
  document_type: string
  document_number: string
  created_date: string
  language: string
  template_key: string
  prepared_by: string | null
  show_signature: boolean
  show_stamp: boolean
  status: string
  document_data: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface ToDo {
  id: string
  user_id: string
  title: string
  description: string | null
  due_date: string | null
  due_time: string | null
  priority: string
  is_done: boolean
  created_at: string
  updated_at: string
}

export interface Notification {
  id: string
  user_id: string
  company_id: string | null
  type: string
  title: string
  body: string | null
  entity_type: string | null
  entity_id: string | null
  read_at: string | null
  created_at: string
}

export interface Note {
  id: string
  company_id: string
  work_item_id: string
  author_user_id: string
  body: string
  created_at: string
}

export interface ReportIssue {
  id: string
  company_id: string
  work_item_id: string
  reporter_user_id: string
  body: string
  severity: string
  status: string
  resolved_by: string | null
  resolved_at: string | null
  created_at: string
  updated_at: string
}

export interface Attachment {
  id: string
  company_id: string
  work_item_id: string
  category: string | null
  r2_object_key: string
  original_name: string
  mime_type: string | null
  size: number | null
  uploaded_by: string | null
  active: boolean
  created_at: string
}

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
  created_at: string
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

// ===========================================
// Data Access Layer
// ===========================================

export class DataAccess {
  private supabase: SupabaseClient<Database>

  constructor() {
    this.supabase = getSupabase()
  }

  // ─── Companies ────────────────────────────────────

  async getCompanies(): Promise<Company[]> {
    const { data, error } = await this.supabase
      .from('companies')
      .select('*')
      .eq('active', true)
      .order('name_en') as any

    if (error) {
      appLogger.error('Failed to fetch companies', error)
      return []
    }
    return data || []
  }

  async getCompanyById(id: string): Promise<Company | null> {
    const { data, error } = await this.supabase
      .from('companies')
      .select('*')
      .eq('id', id)
      .single() as any

    if (error) return null
    return data
  }

  // ─── Customers ────────────────────────────────────

  async getCustomers(companyId: string): Promise<Customer[]> {
    const { data, error } = await this.supabase
      .from('customers')
      .select('*')
      .eq('company_id', companyId)
      .eq('active', true)
      .is('deleted_at', null)
      .order('name') as any

    if (error) {
      appLogger.error('Failed to fetch customers', error)
      return []
    }
    return data || []
  }

  async getCustomerById(id: string): Promise<Customer | null> {
    const { data, error } = await this.supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single() as any

    if (error) return null
    return data
  }

  async createCustomer(customer: Partial<Customer>, companyId: string): Promise<Customer | null> {
    const { data, error } = await this.supabase
      .from('customers')
      .insert({ ...customer, company_id: companyId, active: true })
      .select()
      .single() as any

    if (error) {
      appLogger.error('Failed to create customer', error)
      return null
    }
    return data
  }

  async updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer | null> {
    const { data, error } = await this.supabase
      .from('customers')
      .update(updates)
      .eq('id', id)
      .select()
      .single() as any

    if (error) {
      appLogger.error('Failed to update customer', error)
      return null
    }
    return data
  }

  async deleteCustomer(id: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('customers')
      .update({ deleted_at: new Date().toISOString(), active: false } as any)
      .eq('id', id) as any

    if (error) {
      appLogger.error('Failed to delete customer', error)
      return false
    }
    return true
  }

  // ─── Materials ────────────────────────────────────

  async getMaterials(companyId: string): Promise<Material[]> {
    const { data, error } = await this.supabase
      .from('materials')
      .select('*')
      .eq('company_id', companyId)
      .eq('active', true)
      .is('deleted_at', null)
      .order('name') as any

    if (error) {
      appLogger.error('Failed to fetch materials', error)
      return []
    }
    return data || []
  }

  async getMaterialById(id: string): Promise<Material | null> {
    const { data, error } = await this.supabase
      .from('materials')
      .select('*')
      .eq('id', id)
      .single() as any

    if (error) return null
    return data
  }

  async createMaterial(material: Partial<Material>, companyId: string): Promise<Material | null> {
    const { data, error } = await this.supabase
      .from('materials')
      .insert({ ...material, company_id: companyId, active: true })
      .select()
      .single() as any

    if (error) {
      appLogger.error('Failed to create material', error)
      return null
    }
    return data
  }

  async updateMaterial(id: string, updates: Partial<Material>): Promise<Material | null> {
    const { data, error } = await this.supabase
      .from('materials')
      .update(updates)
      .eq('id', id)
      .select()
      .single() as any

    if (error) {
      appLogger.error('Failed to update material', error)
      return null
    }
    return data
  }

  async deleteMaterial(id: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('materials')
      .update({ deleted_at: new Date().toISOString(), active: false } as any)
      .eq('id', id) as any

    if (error) {
      appLogger.error('Failed to delete material', error)
      return false
    }
    return true
  }

  // ─── Work Items (Projects/Tasks) ──────────────────

  async getWorkItems(companyId: string, type?: string): Promise<WorkItem[]> {
    let query = this.supabase
      .from('work_items')
      .select('*, customers!inner(name)') as any

    query = query
      .eq('company_id', companyId)
      .eq('active', true)
      .is('deleted_at', null)

    if (type) {
      query = query.eq('type', type)
    }

    const { data, error } = await query.order('pinned', { ascending: false }).order('updated_at', { ascending: false })

    if (error) {
      appLogger.error('Failed to fetch work items', error)
      return []
    }

    return (data || []).map((item: any) => ({
      ...item,
      customer_name: item.customers?.name,
    }))
  }

  async getWorkItemById(id: string): Promise<WorkItem | null> {
    const { data, error } = await this.supabase
      .from('work_items')
      .select('*, customers!inner(name)')
      .eq('id', id)
      .single() as any

    if (error) return null

    return {
      ...data,
      customer_name: data.customers?.name,
    }
  }

  async createWorkItem(item: Partial<WorkItem>, companyId: string): Promise<WorkItem | null> {
    const { data, error } = await this.supabase
      .from('work_items')
      .insert({ ...item, company_id: companyId, active: true } as any)
      .select()
      .single() as any

    if (error) {
      appLogger.error('Failed to create work item', error)
      return null
    }
    return data
  }

  async updateWorkItem(id: string, updates: Partial<WorkItem>): Promise<WorkItem | null> {
    const { data, error } = await this.supabase
      .from('work_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single() as any

    if (error) {
      appLogger.error('Failed to update work item', error)
      return null
    }
    return data
  }

  async deleteWorkItem(id: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('work_items')
      .update({ deleted_at: new Date().toISOString(), active: false } as any)
      .eq('id', id) as any

    if (error) {
      appLogger.error('Failed to delete work item', error)
      return false
    }
    return true
  }

  // ─── Documents ────────────────────────────────────

  async getDocuments(workItemId: string): Promise<Document[]> {
    const { data, error } = await this.supabase
      .from('documents')
      .select('*')
      .eq('work_item_id', workItemId)
      .is('deleted_at', null)
      .order('created_date', { ascending: false }) as any

    if (error) {
      appLogger.error('Failed to fetch documents', error)
      return []
    }
    return data || []
  }

  async createDocument(doc: Partial<Document>, companyId: string): Promise<Document | null> {
    const { data, error } = await this.supabase
      .from('documents')
      .insert({ ...doc, company_id: companyId } as any)
      .select()
      .single() as any

    if (error) {
      appLogger.error('Failed to create document', error)
      return null
    }
    return data
  }

  // ─── Todos ────────────────────────────────────────

  async getTodos(userId: string): Promise<ToDo[]> {
    const { data, error } = await this.supabase
      .from('todos')
      .select('*')
      .eq('user_id', userId)
      .order('priority')
      .order('due_date') as any

    if (error) {
      appLogger.error('Failed to fetch todos', error)
      return []
    }
    return data || []
  }

  async createTodo(todo: Partial<ToDo>, userId: string): Promise<ToDo | null> {
    const { data, error } = await this.supabase
      .from('todos')
      .insert({ ...todo, user_id: userId, is_done: false } as any)
      .select()
      .single() as any

    if (error) {
      appLogger.error('Failed to create todo', error)
      return null
    }
    return data
  }

  async updateTodo(id: string, updates: Partial<ToDo>): Promise<ToDo | null> {
    const { data, error } = await this.supabase
      .from('todos')
      .update(updates)
      .eq('id', id)
      .select()
      .single() as any

    if (error) {
      appLogger.error('Failed to update todo', error)
      return null
    }
    return data
  }

  async deleteTodo(id: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('todos')
      .delete()
      .eq('id', id) as any

    if (error) {
      appLogger.error('Failed to delete todo', error)
      return false
    }
    return true
  }

  // ─── Notifications ────────────────────────────────

  async getNotifications(userId: string): Promise<Notification[]> {
    const { data, error } = await this.supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }) as any

    if (error) {
      appLogger.error('Failed to fetch notifications', error)
      return []
    }
    return data || []
  }

  async markNotificationRead(id: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() } as any)
      .eq('id', id) as any

    if (error) {
      appLogger.error('Failed to mark notification as read', error)
      return false
    }
    return true
  }

  async markAllNotificationsRead(userId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() } as any)
      .eq('user_id', userId)
      .is('read_at', null) as any

    if (error) {
      appLogger.error('Failed to mark all notifications as read', error)
      return false
    }
    return true
  }

  // ─── Work Item Materials ──────────────────────────

  async getWorkItemMaterials(workItemId: string): Promise<WorkItemMaterial[]> {
    const { data, error } = await this.supabase
      .from('work_item_materials')
      .select('*')
      .eq('work_item_id', workItemId)
      .order('sort_order') as any

    if (error) {
      appLogger.error('Failed to fetch work item materials', error)
      return []
    }
    return data || []
  }

  // ─── Notes ────────────────────────────────────────

  async getNotes(workItemId: string): Promise<Note[]> {
    const { data, error } = await this.supabase
      .from('notes')
      .select('*')
      .eq('work_item_id', workItemId)
      .order('created_at', { ascending: false }) as any

    if (error) {
      appLogger.error('Failed to fetch notes', error)
      return []
    }
    return data || []
  }

  async createNote(workItemId: string, body: string, authorUserId: string, companyId: string): Promise<Note | null> {
    const { data, error } = await this.supabase
      .from('notes')
      .insert({
        work_item_id: workItemId,
        author_user_id: authorUserId,
        body,
        company_id: companyId,
      } as any)
      .select()
      .single() as any

    if (error) {
      appLogger.error('Failed to create note', error)
      return null
    }
    return data
  }

  // ─── Report Issues ────────────────────────────────

  async getReportIssues(workItemId: string): Promise<ReportIssue[]> {
    const { data, error } = await this.supabase
      .from('report_issues')
      .select('*')
      .eq('work_item_id', workItemId)
      .order('created_at', { ascending: false }) as any

    if (error) {
      appLogger.error('Failed to fetch report issues', error)
      return []
    }
    return data || []
  }

  async createReportIssue(issue: Partial<ReportIssue>, workItemId: string, reporterUserId: string, companyId: string): Promise<ReportIssue | null> {
    const { data, error } = await this.supabase
      .from('report_issues')
      .insert({
        work_item_id: workItemId,
        reporter_user_id: reporterUserId,
        company_id: companyId,
        body: issue.body,
        severity: issue.severity || 'medium',
        status: 'open',
      } as any)
      .select()
      .single() as any

    if (error) {
      appLogger.error('Failed to create report issue', error)
      return null
    }
    return data
  }

  async updateReportIssue(id: string, updates: Partial<ReportIssue>): Promise<ReportIssue | null> {
    const { data, error } = await this.supabase
      .from('report_issues')
      .update(updates)
      .eq('id', id)
      .select()
      .single() as any

    if (error) {
      appLogger.error('Failed to update report issue', error)
      return null
    }
    return data
  }

  // ─── Attachments ──────────────────────────────────

  async getAttachments(workItemId: string): Promise<Attachment[]> {
    const { data, error } = await this.supabase
      .from('attachments')
      .select('*')
      .eq('work_item_id', workItemId)
      .eq('active', true)
      .order('created_at', { ascending: false }) as any

    if (error) {
      appLogger.error('Failed to fetch attachments', error)
      return []
    }
    return data || []
  }

  async createAttachment(attachment: Partial<Attachment>, companyId: string): Promise<Attachment | null> {
    const { data, error } = await this.supabase
      .from('attachments')
      .insert({ ...attachment, company_id: companyId, active: true } as any)
      .select()
      .single() as any

    if (error) {
      appLogger.error('Failed to create attachment', error)
      return null
    }
    return data
  }

  // ─── Documents (company-level) ──────────────────

  async getDocumentsByCompany(companyId: string): Promise<Document[]> {
    const { data, error } = await this.supabase
      .from('documents')
      .select('*')
      .eq('company_id', companyId)
      .is('deleted_at', null)
      .order('updated_at', { ascending: false })
      .limit(100) as any

    if (error) {
      appLogger.error('Failed to fetch company documents', error)
      return []
    }
    return data || []
  }

  // ─── Report Issues (company-level) ───────────────

  async getReportIssuesByCompany(companyId: string): Promise<ReportIssue[]> {
    const { data, error } = await this.supabase
      .from('report_issues')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(200) as any

    if (error) {
      appLogger.error('Failed to fetch company report issues', error)
      return []
    }
    return data || []
  }

  // ─── Audit ────────────────────────────────────────

  async getAuditEvents(companyId: string): Promise<AuditEvent[]> {
    const { data, error } = await this.supabase
      .from('audit_events')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(100) as any

    if (error) {
      appLogger.error('Failed to fetch audit events', error)
      return []
    }
    return data || []
  }

  // ─── Factory Code ─────────────────────────────────

  async searchFactoryCodes(query: string): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('factory_code_records')
      .select('*')
      .or(`factory_code.ilike.%${query}%,factory_name.ilike.%${query}%,city.ilike.%${query}%,product.ilike.%${query}%,hs_code.ilike.%${query}%`)
      .limit(100) as any

    if (error) {
      appLogger.error('Failed to search factory codes', error)
      return []
    }
    return data || []
  }

  async getFactoryCodeCount(): Promise<number> {
    const { count, error } = await this.supabase
      .from('factory_code_records')
      .select('*', { count: 'exact', head: true }) as any

    if (error) return 0
    return count || 0
  }
}

// Singleton instance
let dataAccessInstance: DataAccess | null = null

export function getDataAccess(): DataAccess {
  if (!dataAccessInstance) {
    dataAccessInstance = new DataAccess()
  }
  return dataAccessInstance
}
