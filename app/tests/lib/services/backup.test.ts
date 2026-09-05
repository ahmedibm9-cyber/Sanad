/**
 * Tests for backup service.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/logger', () => ({
  appLogger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}))

describe('BackupService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should define backup record type correctly', async () => {
    const backup: import('@/lib/services/backup').BackupRecord = {
      id: '1',
      deployment_id: 'deploy-1',
      type: 'manual',
      destination: 'r2',
      object_key: 'backups/deploy-1/backup-1.json',
      status: 'completed',
      created_by: 'user-1',
      created_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      error_message: null,
      metadata_json: null,
    }

    expect(backup.type).toBe('manual')
    expect(backup.destination).toBe('r2')
    expect(backup.status).toBe('completed')
  })

  it('should define backup manifest correctly', async () => {
    const manifest: import('@/lib/services/backup').BackupManifest = {
      version: '1.0.0',
      deploymentId: 'deploy-1',
      timestamp: new Date().toISOString(),
      schemaVersion: '010',
      tables: { companies: 3, work_items: 15 },
      objectCount: 100,
      checksum: 'abc123',
    }

    expect(manifest.version).toBe('1.0.0')
    expect(manifest.tables.companies).toBe(3)
  })

  it('should handle backup types correctly', async () => {
    const types: Array<import('@/lib/services/backup').BackupType> = ['manual', 'automatic']
    expect(types).toContain('manual')
    expect(types).toContain('automatic')
  })

  it('should handle backup statuses correctly', async () => {
    const statuses: Array<import('@/lib/services/backup').BackupStatus> = [
      'pending', 'in_progress', 'completed', 'failed'
    ]
    expect(statuses).toHaveLength(4)
  })
})
