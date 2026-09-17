/**
 * Note service for SANAD application.
 * 
 * Handles project/task notes. Viewers can create notes.
 */

import { getSupabase, type Database } from '../supabase'
import { type RequestContext } from '../api'
import { NotFoundError, handleSupabaseError } from '../errors'
import { appLogger } from '../logger'
import type { SupabaseClient } from '@supabase/supabase-js'

// ===========================================
// Types
// ===========================================

export interface Note {
  id: string
  company_id: string
  work_item_id: string
  created_by: string
  content: string
  active: boolean
  created_at: string
}

export interface CreateNoteInput {
  content: string
}

export interface UpdateNoteInput {
  content: string
}

// ===========================================
// Note Service
// ===========================================

export class NoteService {
  private supabase: SupabaseClient<Database>

  constructor() {
    this.supabase = getSupabase()
  }

  /**
   * Get notes for a work item.
   */
  async getNotes(workItemId: string, context: RequestContext): Promise<Note[]> {
    const { data, error } = await (this.supabase as any)
      .from('notes')
      .select('*')
      .eq('work_item_id', workItemId)
      .eq('company_id', context.companyId)
      .eq('active', true)
      .order('created_at', { ascending: false })

    if (error) {
      appLogger.error('Error fetching notes', error)
      throw handleSupabaseError(error)
    }

    return (data || []).map((row: any) => ({
      ...row,
      created_by: row.author_user_id,
      content: row.body,
    })) as Note[]
  }

  /**
   * Get a note by ID.
   */
  async getNoteById(id: string, context: RequestContext): Promise<Note> {
    const { data, error } = await (this.supabase as any)
      .from('notes')
      .select('*')
      .eq('id', id)
      .eq('company_id', context.companyId)
      .eq('active', true)
      .single()

    if (error || !data) {
      throw new NotFoundError('Note', id)
    }

    return { ...data, created_by: data.author_user_id, content: data.body } as Note
  }

  /**
   * Create a note. Viewers can create notes.
   */
  async createNote(
    workItemId: string,
    input: CreateNoteInput,
    context: RequestContext
  ): Promise<Note> {
    // Get the work item to determine company_id
    const { data: workItem } = await (this.supabase as any)
      .from('work_items')
      .select('company_id')
      .eq('id', workItemId)
      .single()

    if (!workItem) {
      throw new NotFoundError('Work Item', workItemId)
    }

    const { data, error } = await (this.supabase as any)
      .from('notes')
      .insert({
        company_id: workItem.company_id,
        work_item_id: workItemId,
        author_user_id: context.userId,
        body: input.content,
      })
      .select()
      .single()

    if (error) {
      appLogger.error('Error creating note', error)
      throw handleSupabaseError(error)
    }

    appLogger.info('Note created', { noteId: data.id, workItemId })
    return { ...data, created_by: data.author_user_id, content: data.body } as Note
  }

  /**
   * Update a note. Only author or admin can update.
   */
  async updateNote(id: string, input: UpdateNoteInput, context: RequestContext): Promise<Note> {
    const existing = await this.getNoteById(id, context)

    // Only author or admin can edit
    if (existing.created_by !== context.userId && !context.isSystemAdmin) {
      throw new Error('Not authorized to edit this note')
    }

    const { data, error } = await (this.supabase as any)
      .from('notes')
      .update({ body: input.content })
      .eq('id', id)
      .eq('company_id', context.companyId)
      .select()
      .single()

    if (error) {
      appLogger.error('Error updating note', error)
      throw handleSupabaseError(error)
    }

    appLogger.info('Note updated', { noteId: id })
    return { ...data, created_by: data.author_user_id, content: data.body } as Note
  }

  /**
   * Delete a note. Only author or admin can delete.
   */
  async deleteNote(id: string, context: RequestContext): Promise<void> {
    const existing = await this.getNoteById(id, context)

    if (existing.created_by !== context.userId && !context.isSystemAdmin) {
      throw new Error('Not authorized to delete this note')
    }

    const { error } = await (this.supabase as any)
      .from('notes')
      .update({ active: false })
      .eq('id', id)
      .eq('company_id', context.companyId)

    if (error) {
      appLogger.error('Error deleting note', error)
      throw handleSupabaseError(error)
    }

    appLogger.info('Note deleted', { noteId: id })
  }

  /**
   * Restore a soft-deleted note. Only author or admin can restore.
   */
  async restoreNote(id: string, context: RequestContext): Promise<Note> {
    const { data: existing, error: fetchError } = await (this.supabase as any)
      .from('notes')
      .select('*')
      .eq('id', id)
      .eq('company_id', context.companyId)
      .single()

    if (fetchError || !existing) {
      throw new NotFoundError('Note', id)
    }

    if (existing.created_by !== context.userId && !context.isSystemAdmin) {
      throw new Error('Not authorized to restore this note')
    }

    const { data, error } = await (this.supabase as any)
      .from('notes')
      .update({ active: true })
      .eq('id', id)
      .eq('company_id', context.companyId)
      .select()
      .single()

    if (error) {
      appLogger.error('Error restoring note', error)
      throw handleSupabaseError(error)
    }

    appLogger.info('Note restored', { noteId: id })
    return { ...data, created_by: data.author_user_id, content: data.body } as Note
  }

  /**
   * Get note count for a work item.
   */
  async getNoteCount(workItemId: string): Promise<number> {
    const { count, error } = await (this.supabase as any)
      .from('notes')
      .select('*', { count: 'exact', head: true })
      .eq('work_item_id', workItemId)

    if (error) {
      return 0
    }

    return count || 0
  }
}

// Singleton instance
let noteServiceInstance: NoteService | null = null

export function getNoteService(): NoteService {
  if (!noteServiceInstance) {
    noteServiceInstance = new NoteService()
  }
  return noteServiceInstance
}
