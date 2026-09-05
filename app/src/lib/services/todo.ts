/**
 * To-do service for SANAD application.
 * 
 * Handles personal to-do CRUD operations.
 * Each user only sees their own to-dos.
 */

import { getSupabase, type Database } from '../supabase'
import { type RequestContext, requirePermission } from '../api'
import { NotFoundError, handleSupabaseError } from '../errors'
import { appLogger } from '../logger'
import type { SupabaseClient } from '@supabase/supabase-js'

// ===========================================
// Types
// ===========================================

export interface ToDo {
  id: string
  user_id: string
  title: string
  description: string | null
  due_date: string | null
  due_time: string | null
  priority: 'low' | 'medium' | 'high'
  is_done: boolean
  created_at: string
  updated_at: string
}

export interface CreateToDoInput {
  title: string
  description?: string
  due_date?: string
  due_time?: string
  priority?: 'low' | 'medium' | 'high'
}

export interface UpdateToDoInput {
  title?: string
  description?: string
  due_date?: string
  due_time?: string
  priority?: 'low' | 'medium' | 'high'
  is_done?: boolean
}

// ===========================================
// Todo Service
// ===========================================

export class TodoService {
  private supabase: SupabaseClient<Database>

  constructor() {
    this.supabase = getSupabase()
  }

  /**
   * Get all to-dos for a user.
   */
  async getTodos(
    userId: string,
    context: RequestContext,
    options: {
      includeDone?: boolean
      priority?: string
      page?: number
      pageSize?: number
    } = {}
  ): Promise<{ data: ToDo[]; total: number }> {
    const { includeDone = false, priority, page = 1, pageSize = 50 } = options
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    let query = (this.supabase as any)
      .from('todos')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)

    if (!includeDone) {
      query = query.eq('is_done', false)
    }

    if (priority) {
      query = query.eq('priority', priority)
    }

    query = query.range(from, to).order('priority').order('due_date', { ascending: true })

    const { data, error, count } = await query

    if (error) {
      appLogger.error('Error fetching todos', error)
      throw handleSupabaseError(error)
    }

    return {
      data: data || [],
      total: count || 0,
    }
  }

  /**
   * Get a to-do by ID.
   */
  async getTodoById(id: string, context: RequestContext): Promise<ToDo> {
    const { data, error } = await (this.supabase as any)
      .from('todos')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      throw new NotFoundError('Todo', id)
    }

    // Verify ownership (unless system admin)
    if (data.user_id !== context.userId && !context.isSystemAdmin) {
      throw new Error('Not authorized to access this todo')
    }

    return data
  }

  /**
   * Create a new to-do.
   */
  async createTodo(input: CreateToDoInput, context: RequestContext): Promise<ToDo> {
    const { data, error } = await (this.supabase as any)
      .from('todos')
      .insert({
        user_id: context.userId,
        title: input.title,
        description: input.description || null,
        due_date: input.due_date || null,
        due_time: input.due_time || null,
        priority: input.priority || 'medium',
        is_done: false,
      })
      .select()
      .single()

    if (error) {
      appLogger.error('Error creating todo', error)
      throw handleSupabaseError(error)
    }

    appLogger.info('Todo created', { todoId: data.id, title: input.title })
    return data
  }

  /**
   * Update a to-do.
   */
  async updateTodo(id: string, input: UpdateToDoInput, context: RequestContext): Promise<ToDo> {
    const existing = await this.getTodoById(id, context)

    const updateData: Record<string, unknown> = {}
    if (input.title !== undefined) updateData.title = input.title
    if (input.description !== undefined) updateData.description = input.description
    if (input.due_date !== undefined) updateData.due_date = input.due_date
    if (input.due_time !== undefined) updateData.due_time = input.due_time
    if (input.priority !== undefined) updateData.priority = input.priority
    if (input.is_done !== undefined) updateData.is_done = input.is_done

    const { data, error } = await (this.supabase as any)
      .from('todos')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      appLogger.error('Error updating todo', error)
      throw handleSupabaseError(error)
    }

    appLogger.info('Todo updated', { todoId: id })
    return data
  }

  /**
   * Toggle todo completion status.
   */
  async toggleTodo(id: string, context: RequestContext): Promise<ToDo> {
    const existing = await this.getTodoById(id, context)

    const { data, error } = await (this.supabase as any)
      .from('todos')
      .update({ is_done: !existing.is_done })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      appLogger.error('Error toggling todo', error)
      throw handleSupabaseError(error)
    }

    appLogger.info('Todo toggled', { todoId: id, isDone: !existing.is_done })
    return data
  }

  /**
   * Delete a to-do.
   */
  async deleteTodo(id: string, context: RequestContext): Promise<void> {
    await this.getTodoById(id, context)

    const { error } = await (this.supabase as any)
      .from('todos')
      .delete()
      .eq('id', id)

    if (error) {
      appLogger.error('Error deleting todo', error)
      throw handleSupabaseError(error)
    }

    appLogger.info('Todo deleted', { todoId: id })
  }

  /**
   * Get todo statistics for a user.
   */
  async getTodoStats(userId: string): Promise<{
    total: number
    done: number
    overdue: number
    dueToday: number
    highPriority: number
  }> {
    const today = new Date().toISOString().split('T')[0]

    const { count: total } = await (this.supabase as any)
      .from('todos')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    const { count: done } = await (this.supabase as any)
      .from('todos')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_done', true)

    const { count: overdue } = await (this.supabase as any)
      .from('todos')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_done', false)
      .lt('due_date', today)

    const { count: dueToday } = await (this.supabase as any)
      .from('todos')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_done', false)
      .eq('due_date', today)

    const { count: highPriority } = await (this.supabase as any)
      .from('todos')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_done', false)
      .eq('priority', 'high')

    return {
      total: total || 0,
      done: done || 0,
      overdue: overdue || 0,
      dueToday: dueToday || 0,
      highPriority: highPriority || 0,
    }
  }

  /**
   * Get overdue to-dos for dashboard display.
   */
  async getOverdueTodos(userId: string, limit: number = 5): Promise<ToDo[]> {
    const today = new Date().toISOString().split('T')[0]

    const { data, error } = await (this.supabase as any)
      .from('todos')
      .select('*')
      .eq('user_id', userId)
      .eq('is_done', false)
      .lt('due_date', today)
      .order('due_date')
      .limit(limit)

    if (error) {
      return []
    }

    return data || []
  }
}

// Singleton instance
let todoServiceInstance: TodoService | null = null

export function getTodoService(): TodoService {
  if (!todoServiceInstance) {
    todoServiceInstance = new TodoService()
  }
  return todoServiceInstance
}
