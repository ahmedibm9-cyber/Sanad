/**
 * Tests for backup service.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockRequestContext } from '../../setup'

// ── Robust chainable Supabase mock ──
function createMockSupabase() {
  const createChain = (terminalResolve?: any) => {
    const chain: Record<string, any> = {}
    chain.select = vi.fn().mockReturnValue(chain)
    chain.insert = vi.fn().mockReturnValue(chain)
    chain.update = vi.fn().mockReturnValue(chain)
    chain.delete = vi.fn().mockReturnValue(chain)
    chain.eq = vi.fn().mockReturnValue(chain)
    chain.neq = vi.fn().mockReturnValue(chain)
    chain.in = vi.fn().mockReturnValue(chain)
    chain.order = vi.fn().mockReturnValue(chain)
    chain.limit = vi.fn().mockReturnValue(chain)
    chain.not = vi.fn().mockReturnValue(chain)
    chain.single = vi.fn().mockResolvedValue(terminalResolve ?? { data: null, error: null })
    chain.maybeSingle = vi.fn().mockResolvedValue(terminalResolve ?? { data: null, error: null })
    // Make the chain thenable so `await chain` resolves
    chain[Symbol.for('jest-resolved')] = true
    return chain
  }

  return {
    from: vi.fn().mockImplementation(() => createChain()),
  }
}

const mockSupabase = createMockSupabase()

vi.mock('@/lib/supabase', () => ({
  getSupabase: vi.fn(() => mockSupabase),
}))

vi.mock('@/lib/logger', () => ({
  appLogger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}))

vi.mock('@/lib/r2Client', () => ({
  uploadToR2: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/r2', () => ({
  downloadFromR2: vi.fn().mockResolvedValue({ body: Buffer.from('[]') }),
}))

/**
 * Helper: build a chain that resolves the next awaitable call with `value`.
 * All methods return `chain` for further chaining.
 */
function chainResolves(value: any) {
  const chain: Record<string, any> = {}
  chain.select = vi.fn().mockReturnValue(chain)
  chain.insert = vi.fn().mockReturnValue(chain)
  chain.update = vi.fn().mockReturnValue(chain)
  chain.delete = vi.fn().mockReturnValue(chain)
  chain.eq = vi.fn().mockReturnValue(chain)
  chain.neq = vi.fn().mockReturnValue(chain)
  chain.in = vi.fn().mockReturnValue(chain)
  chain.order = vi.fn().mockReturnValue(chain)
  chain.limit = vi.fn().mockReturnValue(chain)
  chain.not = vi.fn().mockReturnValue(chain)
  chain.single = vi.fn().mockResolvedValue(value)
  chain.maybeSingle = vi.fn().mockResolvedValue(value)
  return chain
}

/**
 * Helper: build a chain that resolves when awaited (no .single).
 * Used for countRows and collectR2Keys which `await query` directly.
 */
function chainAwaitResolves(value: any) {
  const chain: Record<string, any> = {}
  chain.select = vi.fn().mockReturnValue(chain)
  chain.insert = vi.fn().mockReturnValue(chain)
  chain.update = vi.fn().mockReturnValue(chain)
  chain.delete = vi.fn().mockReturnValue(chain)
  chain.eq = vi.fn().mockReturnValue(chain)
  chain.neq = vi.fn().mockReturnValue(chain)
  chain.in = vi.fn().mockReturnValue(chain)
  chain.order = vi.fn().mockReturnValue(chain)
  chain.limit = vi.fn().mockReturnValue(chain)
  chain.not = vi.fn().mockReturnValue(chain)
  chain.single = vi.fn().mockResolvedValue(value)
  chain.maybeSingle = vi.fn().mockResolvedValue(value)
  // Make the chain thenable so `await chain` resolves to `value`
  chain.then = (resolve: any) => resolve(value)
  return chain
}

describe('BackupService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── Type validation ──

  describe('BackupRecord type', () => {
    it('should include company_id field', () => {
      const backup: import('@/lib/services/backup').BackupRecord = {
        id: '1',
        company_id: 'comp-1',
        deployment_id: 'deploy-1',
        type: 'manual',
        destination: 'r2',
        r2_object_key: 'backups/comp-1/backup-1.json',
        status: 'completed',
        created_by: 'user-1',
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        error_message: null,
        metadata_json: null,
      }

      expect(backup.company_id).toBe('comp-1')
    })

    it('should allow null company_id', () => {
      const backup: import('@/lib/services/backup').BackupRecord = {
        id: '1',
        company_id: null,
        deployment_id: 'deploy-1',
        type: 'manual',
        destination: 'r2',
        r2_object_key: null,
        status: 'completed',
        created_by: 'user-1',
        created_at: new Date().toISOString(),
        completed_at: null,
        error_message: null,
        metadata_json: null,
      }

      expect(backup.company_id).toBeNull()
    })

    it('should use r2_object_key not r2_key', () => {
      const backup: import('@/lib/services/backup').BackupRecord = {
        id: '1',
        company_id: 'comp-1',
        deployment_id: null,
        type: 'automatic',
        destination: 'r2',
        r2_object_key: 'backups/comp-1/manifest.json',
        status: 'completed',
        created_by: null,
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        error_message: null,
        metadata_json: null,
      }

      expect(backup.r2_object_key).toBe('backups/comp-1/manifest.json')
      expect((backup as any).r2_key).toBeUndefined()
    })

    it('should define backup manifest correctly', async () => {
      const manifest: import('@/lib/services/backup').BackupManifest = {
        version: '1.0.0',
        deploymentId: 'deploy-1',
        timestamp: new Date().toISOString(),
        schemaVersion: '011',
        tables: { companies: 3, work_items: 15 },
        objectCount: 100,
        checksum: 'sha256-abc123',
      }

      expect(manifest.version).toBe('1.0.0')
      expect(manifest.schemaVersion).toBe('011')
      expect(manifest.tables.companies).toBe(3)
    })

    it('should handle backup types', async () => {
      const types: Array<import('@/lib/services/backup').BackupType> = ['manual', 'automatic']
      expect(types).toContain('manual')
      expect(types).toContain('automatic')
    })

    it('should handle backup statuses', async () => {
      const statuses: Array<import('@/lib/services/backup').BackupStatus> = [
        'pending', 'in_progress', 'completed', 'failed',
      ]
      expect(statuses).toHaveLength(4)
    })
  })

  describe('BackupSettings type', () => {
    it('should include company_id field', () => {
      const settings: import('@/lib/services/backup').BackupSettings = {
        id: '1',
        company_id: 'comp-1',
        auto_backup_enabled: true,
        backup_schedule: '0 2 * * *',
        retention_days: 30,
        last_backup_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      expect(settings.company_id).toBe('comp-1')
    })

  })

  // ── createManualBackup ──

  describe('createManualBackup', () => {
    it('should insert with company_id and r2_object_key', async () => {
      const { BackupService } = await import('@/lib/services/backup')
      const service = new BackupService()

      const context = createMockRequestContext({
        companyId: 'company-abc',
        permissions: { 'backup.create': true },
      })

      const insertedRecord = {
        id: 'backup-new',
        company_id: 'company-abc',
        type: 'manual',
        destination: 'r2',
        r2_object_key: null,
        status: 'in_progress',
        created_by: 'test-user-123',
        created_at: new Date().toISOString(),
        completed_at: null,
        error_message: null,
        metadata_json: null,
      }

      // Track which from() call this is
      let callIdx = 0
      mockSupabase.from.mockImplementation(() => {
        callIdx++

        // Call 1: insert backup record (from('backups').insert().select().single())
        if (callIdx === 1) {
          return chainResolves({ data: insertedRecord, error: null })
        }

        // Call 2-16: countRows for 15 tables (from(table).select().eq() → await)
        if (callIdx >= 2 && callIdx <= 16) {
          return chainAwaitResolves({ count: 0, error: null })
        }

        // Call 17-20: collectR2Keys for 4 tables (from(table).select().not().eq() → await)
        if (callIdx >= 17 && callIdx <= 20) {
          return chainAwaitResolves({ data: [], error: null })
        }

        // Call 21-35: exportTableData for 15 tables (from(table).select().eq() → await)
        if (callIdx >= 21 && callIdx <= 35) {
          return chainAwaitResolves({ data: [], error: null })
        }

        // Call 36: update status to completed (from('backups').update().eq())
        if (callIdx === 36) {
          return chainAwaitResolves({ data: null, error: null })
        }

        // Call 37: uploadBackupToR2 → update object_key (from('backups').update().eq())
        return chainAwaitResolves({ data: null, error: null })
      })

      const result = await service.createManualBackup(context)

      // Verify insert was called with company_id
      const firstChain = mockSupabase.from.mock.results[0].value
      expect(firstChain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'manual',
          company_id: 'company-abc',
          status: 'in_progress',
        })
      )

      expect(result.id).toBe('backup-new')
      expect(result.company_id).toBe('company-abc')
    })

    it('should use r2_object_key not r2_key in insert', async () => {
      const { BackupService } = await import('@/lib/services/backup')
      const service = new BackupService()

      const context = createMockRequestContext({
        companyId: 'company-xyz',
        permissions: { 'backup.create': true },
      })

      const insertedRecord = {
        id: 'backup-r2test',
        company_id: 'company-xyz',
        type: 'manual',
        destination: 'r2',
        r2_object_key: null,
        status: 'in_progress',
        created_by: 'test-user-123',
        created_at: new Date().toISOString(),
        completed_at: null,
        error_message: null,
        metadata_json: null,
      }

      let callIdx = 0
      mockSupabase.from.mockImplementation(() => {
        callIdx++
        if (callIdx === 1) {
          return chainResolves({ data: insertedRecord, error: null })
        }
        if (callIdx >= 2 && callIdx <= 16) {
          return chainAwaitResolves({ count: 0, error: null })
        }
        if (callIdx >= 17 && callIdx <= 20) {
          return chainAwaitResolves({ data: [], error: null })
        }
        if (callIdx >= 21 && callIdx <= 35) {
          return chainAwaitResolves({ data: [], error: null })
        }
        return chainAwaitResolves({ data: null, error: null })
      })

      await service.createManualBackup(context)

      const firstChain = mockSupabase.from.mock.results[0].value
      const insertArg = firstChain.insert.mock.calls[0][0]
      expect(insertArg).toHaveProperty('company_id')
      expect(insertArg).not.toHaveProperty('r2_key')
      expect(insertArg.company_id).toBe('company-xyz')
    })
  })

  // ── createAutomaticBackup ──

  describe('createAutomaticBackup', () => {
    it('should insert with company_id and r2_object_key', async () => {
      const { BackupService } = await import('@/lib/services/backup')
      const service = new BackupService()

      const context = createMockRequestContext({
        companyId: 'company-auto',
        permissions: { 'backup.create': true },
      })

      const insertedRecord = {
        id: 'backup-auto-1',
        company_id: 'company-auto',
        type: 'automatic',
        destination: 'r2',
        r2_object_key: null,
        status: 'in_progress',
        created_by: 'test-user-123',
        created_at: new Date().toISOString(),
        completed_at: null,
        error_message: null,
        metadata_json: null,
      }

      let callIdx = 0
      mockSupabase.from.mockImplementation(() => {
        callIdx++
        if (callIdx === 1) {
          return chainResolves({ data: insertedRecord, error: null })
        }
        if (callIdx >= 2 && callIdx <= 16) {
          return chainAwaitResolves({ count: 0, error: null })
        }
        if (callIdx >= 17 && callIdx <= 20) {
          return chainAwaitResolves({ data: [], error: null })
        }
        if (callIdx >= 21 && callIdx <= 35) {
          return chainAwaitResolves({ data: [], error: null })
        }
        return chainAwaitResolves({ data: null, error: null })
      })

      const result = await service.createAutomaticBackup(context)

      const firstChain = mockSupabase.from.mock.results[0].value
      expect(firstChain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'automatic',
          company_id: 'company-auto',
          status: 'in_progress',
        })
      )
      expect(result.id).toBe('backup-auto-1')
      expect(result.company_id).toBe('company-auto')
    })
  })

  // ── getBackupHistory ──

  describe('getBackupHistory', () => {
    it('should filter by company_id', async () => {
      const { BackupService } = await import('@/lib/services/backup')
      const service = new BackupService()

      const context = createMockRequestContext({
        companyId: 'company-filter',
      })

      const mockBackups = [
        { id: '1', company_id: 'company-filter', type: 'manual', status: 'completed' },
        { id: '2', company_id: 'company-filter', type: 'automatic', status: 'completed' },
      ]

      const selectChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: mockBackups, error: null }),
      }

      mockSupabase.from.mockReset()
      mockSupabase.from.mockReturnValue(selectChain)

      const result = await service.getBackupHistory(context)

      expect(selectChain.eq).toHaveBeenCalledWith('company_id', 'company-filter')
      expect(result).toHaveLength(2)
      expect(result[0].company_id).toBe('company-filter')
    })

    it('should return empty array when no backups exist', async () => {
      const { BackupService } = await import('@/lib/services/backup')
      const service = new BackupService()

      const context = createMockRequestContext({
        companyId: 'company-empty',
      })

      const selectChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      }

      mockSupabase.from.mockReset()
      mockSupabase.from.mockReturnValue(selectChain)

      const result = await service.getBackupHistory(context)

      expect(selectChain.eq).toHaveBeenCalledWith('company_id', 'company-empty')
      expect(result).toHaveLength(0)
    })

    it('should use default limit of 20', async () => {
      const { BackupService } = await import('@/lib/services/backup')
      const service = new BackupService()

      const context = createMockRequestContext({ companyId: 'comp-1' })

      const selectChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      }

      mockSupabase.from.mockReset()
      mockSupabase.from.mockReturnValue(selectChain)

      await service.getBackupHistory(context)

      expect(selectChain.limit).toHaveBeenCalledWith(20)
    })

    it('should respect custom limit', async () => {
      const { BackupService } = await import('@/lib/services/backup')
      const service = new BackupService()

      const context = createMockRequestContext({ companyId: 'comp-1' })

      const selectChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      }

      mockSupabase.from.mockReset()
      mockSupabase.from.mockReturnValue(selectChain)

      await service.getBackupHistory(context, 5)

      expect(selectChain.limit).toHaveBeenCalledWith(5)
    })
  })

  // ── getBackupSettings ──

  describe('getBackupSettings', () => {
    it('should read by company_id', async () => {
      const { BackupService } = await import('@/lib/services/backup')
      const service = new BackupService()

      const context = createMockRequestContext({
        companyId: 'company-settings',
      })

      const mockSettings = {
        id: 'settings-1',
        company_id: 'company-settings',
        auto_backup_enabled: true,
        backup_schedule: '0 2 * * *',
        retention_days: 30,
        last_backup_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const selectChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockSettings, error: null }),
      }

      mockSupabase.from.mockReset()
      mockSupabase.from.mockReturnValue(selectChain)

      const result = await service.getBackupSettings(context)

      expect(selectChain.eq).toHaveBeenCalledWith('company_id', 'company-settings')
      expect(result).not.toBeNull()
      expect(result!.company_id).toBe('company-settings')
    })

    it('should return null when no settings exist', async () => {
      const { BackupService } = await import('@/lib/services/backup')
      const service = new BackupService()

      const context = createMockRequestContext({
        companyId: 'company-no-settings',
      })

      const selectChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'No rows found' },
        }),
      }

      mockSupabase.from.mockReset()
      mockSupabase.from.mockReturnValue(selectChain)

      const result = await service.getBackupSettings(context)

      expect(selectChain.eq).toHaveBeenCalledWith('company_id', 'company-no-settings')
      expect(result).toBeNull()
    })
  })

  // ── updateBackupSettings ──

  describe('updateBackupSettings', () => {
    it('should upsert by company_id', async () => {
      const { BackupService } = await import('@/lib/services/backup')
      const service = new BackupService()

      const context = createMockRequestContext({
        companyId: 'company-update',
        permissions: { 'settings.edit': true },
      })

      const existingSettings = {
        id: 'settings-existing',
        company_id: 'company-update',
        auto_backup_enabled: false,
        backup_schedule: '0 2 * * *',
        retention_days: 7,
        last_backup_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const updatedSettings = {
        ...existingSettings,
        auto_backup_enabled: true,
        retention_days: 30,
      }

      // First call: getBackupSettings (select + eq + limit + single)
      const getChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: existingSettings, error: null }),
      }
      // Second call: update (update + eq + select + single)
      const updateChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: updatedSettings, error: null }),
      }

      mockSupabase.from.mockReset()
      mockSupabase.from
        .mockReturnValueOnce(getChain)
        .mockReturnValueOnce(updateChain)

      const result = await service.updateBackupSettings(
        { auto_backup_enabled: true, retention_days: 30 },
        context
      )

      // Verify it queried by company_id
      expect(getChain.eq).toHaveBeenCalledWith('company_id', 'company-update')
      // Verify it updated the existing record
      expect(result.auto_backup_enabled).toBe(true)
      expect(result.retention_days).toBe(30)
    })

    it('should insert settings scoped only by company_id when none exist', async () => {
      const { BackupService } = await import('@/lib/services/backup')
      const service = new BackupService()

      const context = createMockRequestContext({
        companyId: 'company-new-settings',
        permissions: { 'settings.edit': true },
      })

      const newSettings = {
        id: 'settings-new',
        company_id: 'company-new-settings',
        auto_backup_enabled: true,
        backup_schedule: '0 3 * * *',
        retention_days: 14,
        last_backup_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      // First call: getBackupSettings returns null (no existing)
      const getChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'No rows found' },
        }),
      }
      // Second call: insert new settings
      const insertChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: newSettings, error: null }),
      }

      mockSupabase.from.mockReset()
      mockSupabase.from
        .mockReturnValueOnce(getChain)
        .mockReturnValueOnce(insertChain)

      const result = await service.updateBackupSettings(
        { auto_backup_enabled: true, backup_schedule: '0 3 * * *', retention_days: 14 },
        context
      )

      // Verify insert included company_id
      expect(insertChain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          company_id: 'company-new-settings',
          auto_backup_enabled: true,
          backup_schedule: '0 3 * * *',
          retention_days: 14,
        })
      )
      expect(insertChain.insert.mock.calls[0][0]).not.toHaveProperty('deployment_id')
      expect(result.company_id).toBe('company-new-settings')
    })

    it('should reject when settings.edit permission is missing', async () => {
      const { BackupService } = await import('@/lib/services/backup')
      const service = new BackupService()

      const context = createMockRequestContext({
        companyId: 'company-no-perm',
        permissions: {},
      })

      await expect(
        service.updateBackupSettings({ auto_backup_enabled: true }, context)
      ).rejects.toThrow()
    })
  })
})
