/**
 * Tests for audit service.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/logger', () => ({
  appLogger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}))

describe('AuditService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should define audit event type correctly', async () => {
    const event: import('@/lib/services/audit').AuditEvent = {
      id: '1',
      company_id: 'comp-1',
      actor_user_id: 'user-1',
      action: 'CREATE',
      entity_type: 'project',
      entity_id: 'proj-1',
      entity_reference: 'HDPE Shipment to Dubai',
      before_json: null,
      after_json: { name: 'HDPE Shipment to Dubai' },
      metadata_json: null,
      created_at: new Date().toISOString(),
    }

    expect(event.action).toBe('CREATE')
    expect(event.entity_type).toBe('project')
  })

  it('should define all required audit actions', async () => {
    const actions: Array<import('@/lib/services/audit').AuditAction> = [
      'CREATE', 'VIEW', 'EDIT', 'MOVE_TO_TRASH', 'RESTORE',
      'DOWNLOAD', 'PDF_GENERATE', 'PDF_DOWNLOAD', 'EXPORT',
      'ARCHIVE', 'REOPEN', 'PERMISSION_CHANGE', 'SETTINGS_CHANGE',
      'FACTORY_IMPORT', 'BACKUP', 'RESTORE_BACKUP', 'TASK_TO_PROJECT'
    ]

    expect(actions).toHaveLength(17)
  })
})
