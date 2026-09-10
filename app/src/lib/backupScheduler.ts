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
      
      // Get backup settings
      const { data: settings } = await (supabase as any)
        .from('backup_settings')
        .select('*')
        .eq('auto_backup_enabled', true)
        .single()

      if (!settings) return

      const lastBackup = settings.last_backup_at ? new Date(settings.last_backup_at).getTime() : 0
      const now = Date.now()
      
      // Parse schedule (e.g., 'daily', 'weekly')
      let intervalMs = 24 * 60 * 60 * 1000 // default: daily
      if (settings.backup_schedule === 'weekly') intervalMs = 7 * 24 * 60 * 60 * 1000
      
      if (now - lastBackup < intervalMs) return

      // Trigger automatic backup
      // Note: backup_settings.deployment_id identifies the deployment,
      // which the backup service uses as the company scope for data isolation.
      await backupService.createAutomaticBackup({
        userId: 'system',
        companyId: settings.deployment_id,
        permissions: { 'backup.create': true },
        isSystemAdmin: true,
      })

      // Update last_backup_at
      await (supabase as any)
        .from('backup_settings')
        .update({ last_backup_at: new Date().toISOString() })
        .eq('id', settings.id)

      appLogger.info('Automatic backup triggered')
    } catch (error) {
      appLogger.error('Backup scheduler check failed', error)
    } finally {
      this.running = false
    }
  }
}

export const backupScheduler = new BackupScheduler()
