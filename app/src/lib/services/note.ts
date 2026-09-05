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
  author_user_id: string
  body: string
  created_at: string
}

export interface CreateNoteInput {
  body: string
}

export interface UpdateNoteInput {
  body: string
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
      .order('created_at', { ascending: false })

    if (error) {
      appLogger.error('Error fetching notes', error)
      throw handleSupabaseError(error)
    }

    return data || []
  }

  /**
   * Get a note by ID.
   */
  async getNoteById(id: string, context: RequestContext): Promise<Note> {
    const { data, error } = await (this.supabase as any)
      .from('notes')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      throw new NotFoundError('Note', id)
    }

    return data
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
        body: input.body,
      })
      .select()
      .single()

    if (error) {
      appLogger.error('Error creating note', error)
      throw handleSupabaseError(error)
    }

    appLogger.info('Note created', { noteId: data.id, workItemId })
    return data
  }

  /**
   * Update a note. Only author or admin can update.
   */
  async updateNote(id: string, input: UpdateNoteInput, context: RequestContext): Promise<Note> {
    const existing = await this.getNoteById(id, context)

    // Only author or admin can edit
    if (existing.author_user_id !== context.userId && !context.isSystemAdmin) {
      throw new Error('Not authorized to edit this note')
    }

    const { data, error } = await (this.supabase as any)
      .from('notes')
      .update({ body: input.body })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      appLogger.error('Error updating note', error)
      throw handleSupabaseError(error)
    }

    appLogger.info('Note updated', { noteId: id })
    return data
  }

  /**
   * Delete a note. Only author or admin can delete.
   */
  async deleteNote(id: string, context: RequestContext): Promise<void> {
    const existing = await this.getNoteById(id, context)

    if (existing.author_user_id !== context.userId && !context.isSystemAdmin) {
      throw new Error('Not authorized to delete this note')
    }

    const { error } = await (this.supabase as any)
      .from('notes')
      .delete()
      .eq('id', id)

    if (error) {
      appLogger.error('Error deleting note', error)
      throw handleSupabaseError(error)
    }

    appLogger.info('Note deleted', { noteId: id })
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
