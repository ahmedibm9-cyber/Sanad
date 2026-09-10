/**
 * Document service for SANAD application.
 * 
 * Handles all 7 document types: QUOT, PINV, TINV, CINV, PKL, DN, BL
 */

import { getSupabase, type Database } from '../supabase'
import { type RequestContext, requirePermission, hasPermission } from '../api'
import { NotFoundError, ConflictError, handleSupabaseError } from '../errors'
import { appLogger } from '../logger'
import type { SupabaseClient } from '@supabase/supabase-js'

// ===========================================
// Types
// ===========================================

export type DocumentType = 'QUOT' | 'PINV' | 'TINV' | 'CINV' | 'PKL' | 'DN' | 'BL'

export interface Document {
  id: string
  company_id: string
  work_item_id: string
  document_type: DocumentType
  document_number: string
  created_date: string
  language: string
  template_key: string
  prepared_by: string | null
  show_signature: boolean
  show_stamp: boolean
  status: string
  document_data: Record<string, unknown>
  latest_render_object_key: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
  deleted_at: string | null
}

export interface CreateDocumentInput {
  work_item_id?: string | null
  document_type: DocumentType
  document_number: string
  language?: string
  template_key?: string
  prepared_by?: string
  show_signature?: boolean
  show_stamp?: boolean
  status?: string
  document_data?: Record<string, unknown>
}

export interface UpdateDocumentInput {
  document_number?: string
  language?: string
  template_key?: string
  prepared_by?: string
  show_signature?: boolean
  show_stamp?: boolean
  status?: string
  document_data?: Record<string, unknown>
}

// ===========================================
// Document Service
// ===========================================

export class DocumentService {
  private supabase: SupabaseClient<Database>

  constructor() {
    this.supabase = getSupabase()
  }

  /**
   * Get documents for a work item.
   */
  async getDocuments(workItemId: string, context: RequestContext): Promise<Document[]> {
    if (!hasPermission(context, 'documents.view')) {
      throw new Error('Permission denied: documents.view')
    }

    const query = (this.supabase as any)
      .from('documents')
      .select('*')
      .eq('work_item_id', workItemId)
      .is('deleted_at', null)
      .order('created_date', { ascending: false })

    if (context.companyId) {
      query.eq('company_id', context.companyId)
    }

    const { data, error } = await query

    if (error) {
      appLogger.error('Error fetching documents', error)
      throw handleSupabaseError(error)
    }

    return data || []
  }

  /**
   * Get a document by ID.
   */
  async getDocumentById(id: string, context: RequestContext): Promise<Document> {
    if (!hasPermission(context, 'documents.view')) {
      throw new Error('Permission denied: documents.view')
    }

    const query = (this.supabase as any)
      .from('documents')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)

    if (context.companyId) {
      query.eq('company_id', context.companyId)
    }

    const { data, error } = await query.single()

    if (error || !data) {
      throw new NotFoundError('Document', id)
    }

    return data
  }

  /**
   * Create a new document.
   * Validates document number uniqueness within the company.
   */
  async createDocument(input: CreateDocumentInput, context: RequestContext): Promise<Document> {
    requirePermission(context, 'documents.create')

    const companyId = context.companyId!

    // Check document number uniqueness within company
    const { data: existing } = await (this.supabase as any)
      .from('documents')
      .select('id')
      .eq('company_id', companyId)
      .eq('document_number', input.document_number)
      .is('deleted_at', null)
      .single()

    if (existing) {
      throw new ConflictError(`Document number "${input.document_number}" already exists in this company`)
    }

    const { data, error } = await (this.supabase as any)
      .from('documents')
      .insert({
        company_id: companyId,
        work_item_id: input.work_item_id,
        document_type: input.document_type,
        document_number: input.document_number,
        created_date: new Date().toISOString().split('T')[0],
        language: input.language || 'en',
        template_key: input.template_key || 'template-a',
        prepared_by: input.prepared_by || null,
        show_signature: input.show_signature ?? true,
        show_stamp: input.show_stamp ?? true,
        status: input.status || 'draft',
        document_data: input.document_data || {},
        created_by: context.userId,
        updated_by: context.userId,
      })
      .select()
      .single()

    if (error) {
      appLogger.error('Error creating document', error)
      throw handleSupabaseError(error)
    }

    appLogger.info('Document created', {
      documentId: data.id,
      type: input.document_type,
      number: input.document_number,
    })

    return data
  }

  /**
   * Update a document.
   * If document number changes, validates uniqueness.
   */
  async updateDocument(id: string, input: UpdateDocumentInput, context: RequestContext): Promise<Document> {
    requirePermission(context, 'documents.edit')

    const existing = await this.getDocumentById(id, context)

    // If document number is changing, check uniqueness
    if (input.document_number && input.document_number !== existing.document_number) {
      const { data: duplicate } = await (this.supabase as any)
        .from('documents')
        .select('id')
        .eq('company_id', existing.company_id)
        .eq('document_number', input.document_number)
        .is('deleted_at', null)
        .neq('id', id)
        .single()

      if (duplicate) {
        throw new ConflictError(`Document number "${input.document_number}" already exists in this company`)
      }
    }

    const updateData: Record<string, unknown> = { updated_by: context.userId }
    Object.entries(input).forEach(([key, value]) => {
      if (value !== undefined) {
        updateData[key] = value
      }
    })

    const { data, error } = await (this.supabase as any)
      .from('documents')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      appLogger.error('Error updating document', error)
      throw handleSupabaseError(error)
    }

    appLogger.info('Document updated', { documentId: id })
    return data
  }

  /**
   * Soft delete a document.
   */
  async deleteDocument(id: string, context: RequestContext): Promise<void> {
    requirePermission(context, 'documents.delete')

    const document = await this.getDocumentById(id, context)

    const { error } = await (this.supabase as any)
      .from('documents')
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
        entity_type: 'document',
        entity_id: id,
        company_id: document.company_id,
        deleted_by: context.userId,
        deleted_at: new Date().toISOString(),
      })

    appLogger.info('Document moved to trash', { documentId: id })
  }

  /**
   * Get documents for a company with optional filtering.
   */
  async getCompanyDocuments(
    companyId: string,
    context: RequestContext,
    options: {
      type?: DocumentType
      status?: string
      page?: number
      pageSize?: number
    } = {}
  ): Promise<{ data: Document[]; total: number }> {
    if (!hasPermission(context, 'documents.view')) {
      throw new Error('Permission denied: documents.view')
    }

    const { type, status, page = 1, pageSize = 20 } = options
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    let query = (this.supabase as any)
      .from('documents')
      .select('*', { count: 'exact' })
      .eq('company_id', companyId)
      .is('deleted_at', null)

    if (type) {
      query = query.eq('document_type', type)
    }

    if (status) {
      query = query.eq('status', status)
    }

    query = query.range(from, to).order('created_date', { ascending: false })

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
   * Restore a document from trash.
   */
  async restoreDocument(id: string, context: RequestContext): Promise<Document> {
    requirePermission(context, 'trash.restore')

    const doc = await this.getDocumentById(id, context)

    if (context.companyId && doc.company_id !== context.companyId) {
      throw new Error('Permission denied: company mismatch')
    }

    const { error } = await (this.supabase as any)
      .from('documents')
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
      .eq('entity_type', 'document')
      .eq('entity_id', id)

    return this.getDocumentById(id, context)
  }
}

// Singleton instance
let documentServiceInstance: DocumentService | null = null

export function getDocumentService(): DocumentService {
  if (!documentServiceInstance) {
    documentServiceInstance = new DocumentService()
  }
  return documentServiceInstance
}
