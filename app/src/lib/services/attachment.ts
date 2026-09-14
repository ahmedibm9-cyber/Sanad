/**
 * Attachment service for SANAD application.
 * 
 * Handles file attachments for projects/tasks using R2 storage.
 */

import { getSupabase, type Database } from '../supabase'
import { type RequestContext, requirePermission } from '../api'
import { NotFoundError, handleSupabaseError } from '../errors'
import { appLogger } from '../logger'
import { deleteFromR2, generateAttachmentKey, uploadToR2 } from '../r2Client'
import type { SupabaseClient } from '@supabase/supabase-js'

// ===========================================
// Types
// ===========================================

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
  updated_at: string
}

export interface CreateAttachmentInput {
  work_item_id: string
  category?: string
  r2_object_key: string
  original_name: string
  mime_type?: string
  size?: number
}

const MAX_ATTACHMENT_SIZE = 25 * 1024 * 1024
const ALLOWED_ATTACHMENT_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
])

function validateAttachmentFile(file: File): void {
  if (!ALLOWED_ATTACHMENT_TYPES.has(file.type)) {
    throw new Error('Unsupported file type')
  }

  if (file.size === 0 || file.size > MAX_ATTACHMENT_SIZE) {
    throw new Error('File size must be between 1 byte and 25 MB')
  }
}

// ===========================================
// Attachment Service
// ===========================================

export class AttachmentService {
  private supabase: SupabaseClient<Database>

  constructor() {
    this.supabase = getSupabase()
  }

  /**
   * Get attachments for a work item.
   */
  async getAttachments(workItemId: string, context: RequestContext): Promise<Attachment[]> {
    requirePermission(context, 'files.view')

    const { data, error } = await (this.supabase as any)
      .from('attachments')
      .select('*')
      .eq('work_item_id', workItemId)
      .eq('company_id', context.companyId)
      .eq('active', true)
      .order('created_at', { ascending: false })

    if (error) {
      appLogger.error('Error fetching attachments', error)
      throw handleSupabaseError(error)
    }

    return data || []
  }

  /**
   * Get an attachment by ID.
   */
  async getAttachmentById(id: string, context: RequestContext): Promise<Attachment> {
    requirePermission(context, 'files.view')

    const query = (this.supabase as any)
      .from('attachments')
      .select('*')
      .eq('id', id)
      .eq('company_id', context.companyId)

    const { data, error } = await query.single()

    if (error || !data) {
      throw new NotFoundError('Attachment', id)
    }

    return data
  }

  /**
   * Upload an attachment.
   */
  async uploadAttachment(input: CreateAttachmentInput, context: RequestContext): Promise<Attachment> {
    requirePermission(context, 'files.upload')

    const { data: workItem } = await (this.supabase as any)
      .from('work_items')
      .select('company_id')
      .eq('id', input.work_item_id)
      .eq('company_id', context.companyId)
      .single()

    if (!workItem) {
      throw new NotFoundError('Work Item', input.work_item_id)
    }

    const { data, error } = await (this.supabase as any)
      .from('attachments')
      .insert({
        company_id: workItem.company_id,
        work_item_id: input.work_item_id,
        category: input.category || 'general',
        r2_object_key: input.r2_object_key,
        original_name: input.original_name,
        mime_type: input.mime_type || null,
        size: input.size || null,
        uploaded_by: context.userId,
        active: true,
      })
      .select()
      .single()

    if (error) {
      appLogger.error('Error uploading attachment', error)
      throw handleSupabaseError(error)
    }

    appLogger.info('Attachment uploaded', { attachmentId: data.id, name: input.original_name })
    return data
  }

  async uploadFile(file: File, workItemId: string, category: string, context: RequestContext): Promise<Attachment> {
    requirePermission(context, 'files.upload')
    if (!context.companyId) {
      throw new Error('A company is required to upload an attachment')
    }

    validateAttachmentFile(file)

    const companyId = context.companyId
    const key = generateAttachmentKey(companyId, workItemId, file.name)
    const result = await uploadToR2(key, new Uint8Array(await file.arrayBuffer()), file.type, companyId, {
      originalName: file.name,
      category,
    })

    try {
      return await this.uploadAttachment({
        work_item_id: workItemId,
        category,
        r2_object_key: result.key,
        original_name: file.name,
        mime_type: result.contentType,
        size: result.size,
      }, context)
    } catch (error) {
      try {
        await deleteFromR2(result.key, companyId)
      } catch (cleanupError) {
        appLogger.error('Failed to clean up orphaned attachment object', { error: cleanupError, key: result.key })
      }
      throw error
    }
  }

  /**
   * Delete an attachment (soft delete).
   */
  async deleteAttachment(id: string, context: RequestContext): Promise<void> {
    requirePermission(context, 'files.delete')

    const { error } = await (this.supabase as any)
      .from('attachments')
      .update({ active: false })
      .eq('id', id)
      .eq('company_id', context.companyId)

    if (error) {
      appLogger.error('Error deleting attachment', error)
      throw handleSupabaseError(error)
    }

    appLogger.info('Attachment deleted', { attachmentId: id })
  }

  /**
   * Restore an attachment.
   */
  async restoreAttachment(id: string, context: RequestContext): Promise<Attachment> {
    requirePermission(context, 'trash.restore')

    const { error } = await (this.supabase as any)
      .from('attachments')
      .update({ active: true })
      .eq('id', id)
      .eq('company_id', context.companyId)

    if (error) {
      throw handleSupabaseError(error)
    }

    return this.getAttachmentById(id, context)
  }

  /**
   * Get attachment count for a work item.
   */
  async getAttachmentCount(workItemId: string): Promise<number> {
    const { count, error } = await (this.supabase as any)
      .from('attachments')
      .select('*', { count: 'exact', head: true })
      .eq('work_item_id', workItemId)
      .eq('active', true)

    if (error) {
      return 0
    }

    return count || 0
  }
}

// Singleton instance
let attachmentServiceInstance: AttachmentService | null = null

export function getAttachmentService(): AttachmentService {
  if (!attachmentServiceInstance) {
    attachmentServiceInstance = new AttachmentService()
  }
  return attachmentServiceInstance
}
