import { getBackupService } from './services/backup'
import { getSupabase } from './supabase'
import { appLogger } from './logger'

const CHECK_INTERVAL_MS = 5 * 60 * 1000 // Check every 5 minutes

export class BackupScheduler {
  private intervalId: ReturnType<typeof setInterval> | null = null
  private running = false

  async start() {
    if (this.intervalId) return
    this.intervalId = setInterval(() => this.check(), CHECK_INTERVAL_MS)
    appLogger.info('Backup scheduler started')
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  private async check() {
    if (this.running) return
    this.running = true
    try {
      const backupService = getBackupService()
      const supabase = getSupabase()
      
      const { data: settings } = await (supabase as any)
        .from('backup_settings')
        .select('*')
        .eq('auto_backup_enabled', true)

      if (!settings) return

      const now = Date.now()
      const scheduleIntervals: Record<string, number> = {
        hourly: 60 * 60 * 1000,
        daily: 24 * 60 * 60 * 1000,
        weekly: 7 * 24 * 60 * 60 * 1000,
        monthly: 30 * 24 * 60 * 60 * 1000,
      }

      for (const setting of settings) {
        const lastBackup = setting.last_backup_at ? new Date(setting.last_backup_at).getTime() : 0
        const intervalMs = scheduleIntervals[setting.backup_schedule] || scheduleIntervals.daily

        if (now - lastBackup < intervalMs) continue

        await backupService.createAutomaticBackup({
          userId: 'system',
          companyId: setting.company_id,
          permissions: { 'backup.create': true },
          isSystemAdmin: true,
        })

        await (supabase as any)
          .from('backup_settings')
          .update({ last_backup_at: new Date().toISOString() })
          .eq('id', setting.id)
      }

      appLogger.info('Automatic backups checked')
    } catch (error) {
      appLogger.error('Backup scheduler check failed', error)
    } finally {
      this.running = false
    }
  }
}

export const backupScheduler = new BackupScheduler()
