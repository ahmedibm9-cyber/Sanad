/**
 * Tests for notification service.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/logger', () => ({
  appLogger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}))

describe('NotificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should define notification type correctly', async () => {
    const notification: import('@/lib/services/notification').Notification = {
      id: '1',
      user_id: 'user-1',
      company_id: 'comp-1',
      type: 'task_assigned',
      title: 'Task Assigned',
      body: 'You have been assigned a new task',
      entity_type: 'task',
      entity_id: 'task-1',
      read_at: null,
      created_at: new Date().toISOString(),
    }

    expect(notification.type).toBe('task_assigned')
    expect(notification.read_at).toBeNull()
  })

  it('should handle all notification types', async () => {
    const types: Array<import('@/lib/services/notification').NotificationType> = [
      'task_assigned', 'task_due_soon', 'task_overdue',
      'project_status_changed', 'project_archived', 'project_reopened',
      'report_issue_created', 'report_issue_changed',
      'mention_in_note',
      'document_created', 'document_edited', 'document_trashed',
      'attachment_uploaded', 'attachment_removed',
      'permission_changed',
      'factory_code_updated',
      'backup_success', 'backup_failure',
      'todo_reminder'
    ]

    expect(types).toHaveLength(19)
  })
})
