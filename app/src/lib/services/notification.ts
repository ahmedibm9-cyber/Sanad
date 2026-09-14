/**
 * Notification service for SANAD application.
 * 
 * Handles in-app notifications with configurable preferences.
 */

import { getSupabase, type Database } from '../supabase'
import { handleSupabaseError } from '../errors'
import { appLogger } from '../logger'
import type { SupabaseClient } from '@supabase/supabase-js'

// ===========================================
// Types
// ===========================================

export type NotificationType =
  | 'task_assigned' | 'task_due_soon' | 'task_overdue'
  | 'project_status_changed' | 'project_archived' | 'project_reopened'
  | 'report_issue_created' | 'report_issue_changed'
  | 'mention_in_note'
  | 'document_created' | 'document_edited' | 'document_trashed'
  | 'attachment_uploaded' | 'attachment_removed'
  | 'permission_changed'
  | 'factory_code_updated'
  | 'backup_success' | 'backup_failure'
  | 'todo_reminder'

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

export interface NotificationPreference {
  id: string
  user_id: string
  notification_type: string
  enabled: boolean
}

// ===========================================
// Notification Service
// ===========================================

export class NotificationService {
  private supabase: SupabaseClient<Database>

  constructor() {
    this.supabase = getSupabase()
  }

  /**
   * Create a notification.
   */
  async createNotification(params: {
    userId: string
    companyId?: string
    type: NotificationType
    title: string
    body?: string
    entityType?: string
    entityId?: string
  }): Promise<void> {
    // Check if user has this notification type enabled
    const { data: pref } = await (this.supabase as any)
      .from('notification_preferences')
      .select('enabled')
      .eq('user_id', params.userId)
      .eq('notification_type', params.type)
      .single()

    if (pref && !pref.enabled) {
      return // User has disabled this notification type
    }

    const { error } = await (this.supabase as any)
      .from('notifications')
      .insert({
        user_id: params.userId,
        company_id: params.companyId || null,
        type: params.type,
        title: params.title,
        body: params.body || null,
        entity_type: params.entityType || null,
        entity_id: params.entityId || null,
      })

    if (error) {
      appLogger.error('Failed to create notification', error)
    }
  }

  /**
   * Get notifications for a user.
   */
  async getNotifications(
    userId: string,
    options: { includeRead?: boolean; limit?: number } = {}
  ): Promise<Notification[]> {
    const { includeRead = true, limit = 50 } = options

    let query = (this.supabase as any)
      .from('notifications')
      .select('*')
      .eq('user_id', userId)

    if (!includeRead) {
      query = query.is('read_at', null)
    }

    query = query.order('created_at', { ascending: false }).limit(limit)

    const { data, error } = await query

    if (error) {
      throw handleSupabaseError(error)
    }

    return data || []
  }

  /**
   * Get unread notification count.
   */
  async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await (this.supabase as any)
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('read_at', null)

    if (error) return 0
    return count || 0
  }

  /**
   * Mark a notification as read.
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    const { error } = await (this.supabase as any)
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', notificationId)
      .eq('user_id', userId)

    if (error) {
      appLogger.error('Failed to mark notification as read', error)
    }
  }

  /**
   * Mark all notifications as read.
   */
  async markAllAsRead(userId: string): Promise<void> {
    const { error } = await (this.supabase as any)
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .is('read_at', null)

    if (error) {
      appLogger.error('Failed to mark all notifications as read', error)
    }
  }

  /**
   * Get notification preferences.
   */
  async getPreferences(userId: string): Promise<NotificationPreference[]> {
    const { data, error } = await (this.supabase as any)
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .order('notification_type')

    if (error) {
      throw handleSupabaseError(error)
    }

    return data || []
  }

  /**
   * Update a notification preference.
   */
  async updatePreference(
    userId: string,
    notificationType: string,
    enabled: boolean
  ): Promise<void> {
    const { error } = await (this.supabase as any)
      .from('notification_preferences')
      .upsert({
        user_id: userId,
        notification_type: notificationType,
        enabled,
      })

    if (error) {
      throw handleSupabaseError(error)
    }
  }

  /**
   * Delete old notifications (cleanup).
   */
  async cleanupOldNotifications(daysOld: number = 90): Promise<number> {
    const cutoff = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000).toISOString()

    const { data, error } = await (this.supabase as any)
      .from('notifications')
      .delete()
      .lt('created_at', cutoff)
      .not('read_at', 'is', null)

    if (error) {
      appLogger.error('Failed to cleanup old notifications', error)
      return 0
    }

    return data?.length || 0
  }
}

// Singleton instance
let notificationServiceInstance: NotificationService | null = null

export function getNotificationService(): NotificationService {
  if (!notificationServiceInstance) {
    notificationServiceInstance = new NotificationService()
  }
  return notificationServiceInstance
}
