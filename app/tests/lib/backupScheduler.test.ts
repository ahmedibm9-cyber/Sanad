import { beforeEach, describe, expect, it, vi } from 'vitest'

const createAutomaticBackup = vi.fn()
const from = vi.fn()

vi.mock('@/lib/services/backup', () => ({
  getBackupService: vi.fn(() => ({ createAutomaticBackup })),
}))

vi.mock('@/lib/supabase', () => ({
  getSupabase: vi.fn(() => ({ from })),
}))

vi.mock('@/lib/logger', () => ({
  appLogger: { error: vi.fn(), info: vi.fn() },
}))

describe('BackupScheduler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates an automatic backup for every due company setting', async () => {
    const dueSettings = [
      { id: 'settings-a', company_id: 'company-a', backup_schedule: 'daily', last_backup_at: null },
      { id: 'settings-b', company_id: 'company-b', backup_schedule: 'daily', last_backup_at: null },
    ]
    const settingsQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: dueSettings }),
    }
    const updateQuery = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    }
    from.mockReturnValueOnce(settingsQuery).mockReturnValue(updateQuery)
    createAutomaticBackup.mockResolvedValue(undefined)

    const { backupScheduler } = await import('@/lib/backupScheduler')
    await (backupScheduler as any).check()

    expect(createAutomaticBackup).toHaveBeenCalledTimes(2)
    expect(createAutomaticBackup).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ companyId: 'company-a' })
    )
    expect(createAutomaticBackup).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ companyId: 'company-b' })
    )
  })
})
