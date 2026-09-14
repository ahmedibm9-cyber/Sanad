import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  X, Bell, CheckCircle, AlertTriangle, FileText, Paperclip,
  Clock, Shield, Database, ChevronRight, CheckCheck,
} from 'lucide-react'
import { useLanguage } from '../../contexts/LanguageContext'
import { useApp } from '../../contexts/AppContext'
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from '../../hooks/useData'
import type { Notification } from '../../types'

interface NotificationPanelProps {
  open: boolean
  onClose: () => void
  onStateChange?: () => void
}

function relativeTime(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffSec = Math.max(0, Math.floor((now - then) / 1000))
  if (diffSec < 60) return 'just now'
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.floor(diffHr / 24)
  if (diffDay < 30) return `${diffDay}d ago`
  return new Date(dateStr).toLocaleDateString()
}

function getNotificationIcon(type: string) {
  switch (type) {
    case 'task_assigned':
    case 'task_overdue':
      return <AlertTriangle size={16} className="text-amber-500" />
    case 'document_created':
      return <FileText size={16} className="text-blue-500" />
    case 'report_issue':
      return <AlertTriangle size={16} className="text-red-500" />
    case 'project_status':
      return <CheckCircle size={16} className="text-green-500" />
    case 'attachment':
      return <Paperclip size={16} className="text-gray-500" />
    case 'permission_change':
      return <Shield size={16} className="text-purple-500" />
    case 'backup_success':
      return <Database size={16} className="text-green-500" />
    case 'todo_reminder':
      return <Clock size={16} className="text-orange-500" />
    case 'project_archived':
      return <Clock size={16} className="text-gray-400" />
    default:
      return <Bell size={16} className="text-gray-400" />
  }
}

export default function NotificationPanel({ open, onClose, onStateChange }: NotificationPanelProps) {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const panelRef = useRef<HTMLDivElement>(null)
  const { currentUser } = useApp()
  const { data: hookNotifications, refetch } = useNotifications(currentUser?.id)
  const { markRead: markReadDb } = useMarkNotificationRead()
  const { markAllRead: markAllReadDb } = useMarkAllNotificationsRead()
  const [notifications, setNotifications] = useState<Notification[]>([])

  // Sync with hook data when panel opens
  useEffect(() => {
    if (open && hookNotifications) {
      setNotifications(hookNotifications.map((n: any) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.body || n.message || '',
        read: n.read_at != null || n.read === true,
        createdAt: n.created_at || n.createdAt || '',
        entityId: n.entity_id || n.entityId,
        entityType: n.entity_type || n.entityType,
      })))
    }
  }, [open, hookNotifications])

  // Escape to close
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  const markRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
    if (currentUser?.id) {
      markReadDb(id, currentUser.id).then(() => refetch())
    }
    onStateChange?.()
  }, [onStateChange, markReadDb, currentUser?.id, refetch])

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    if (currentUser?.id) {
      markAllReadDb(currentUser.id).then(() => refetch())
    }
    onStateChange?.()
  }, [onStateChange, markAllReadDb, currentUser?.id, refetch])

  if (!open) return null

  const latestFive = notifications.slice(0, 5)
  const hasUnread = notifications.some(n => !n.read)

  // Lightweight slide-in panel: no full-viewport backdrop.
  // Clicks pass through the container to sidebar/topbar (pointer-events-none).
  // Only the panel is interactive (pointer-events-auto).
  return (
    <div
      className="fixed inset-0 z-50 pointer-events-none"
      onClick={onClose}
      aria-hidden="true"
    >
      {/* Panel — interactive, blocks pointer events */}
      <div
        ref={panelRef}
        role="dialog"
        aria-label={t('Notifications', 'الإشعارات')}
        className="fixed top-14 end-0 z-50 w-full max-w-sm bg-white border border-gray-200 rounded-bl-xl shadow-2xl overflow-hidden flex flex-col pointer-events-auto"
        onClick={e => e.stopPropagation()}
        style={{ height: 'calc(100vh - 3.5rem)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/50 shrink-0">
          <h2 className="text-sm font-semibold text-brand-900 flex items-center gap-2">
            <Bell size={16} className="text-brand-600" />
            {t('Notifications', 'الإشعارات')}
          </h2>
          <div className="flex items-center gap-2">
            {hasUnread && (
              <button
                onClick={markAllRead}
                className="text-xs text-brand-600 hover:text-brand-800 font-medium flex items-center gap-1 transition-colors"
              >
                <CheckCheck size={14} />
                {t('Mark all read', 'تحديد الكل كمقروء')}
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-200 rounded-md text-gray-400 hover:text-gray-600 transition-colors"
              aria-label={t('Close', 'إغلاق')}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto">
          {latestFive.length === 0 ? (
            <div className="p-8 text-center">
              <Bell size={32} className="mx-auto text-gray-300 mb-3" />
              <p className="text-sm text-gray-400">
                {t('No notifications yet', 'لا توجد إشعارات بعد')}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {latestFive.map((notif) => (
                <div
                  key={notif.id}
                  className={`px-4 py-3 hover:bg-gray-50/50 transition-colors ${
                    !notif.read ? 'bg-brand-50/30' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className="mt-0.5 shrink-0">
                      {getNotificationIcon(notif.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm leading-snug ${
                          !notif.read ? 'font-semibold text-brand-900' : 'text-gray-700'
                        }`}>
                          {notif.title}
                        </p>
                        {!notif.read && (
                          <span className="w-2 h-2 bg-brand-600 rounded-full shrink-0 mt-1.5" aria-label={t('Unread', 'غير مقروء')} />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                        {notif.message}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[11px] text-gray-400">
                          {relativeTime(notif.createdAt)}
                        </span>
                        {!notif.read && (
                          <button
                            onClick={() => markRead(notif.id)}
                            className="text-[11px] text-brand-600 hover:text-brand-800 font-medium transition-colors"
                          >
                            {t('Mark read', 'تحديد كمقروء')}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 bg-white px-4 py-3 shrink-0">
          <button
            onClick={() => { navigate('/notifications'); onClose() }}
            className="w-full text-center text-sm font-medium text-brand-600 hover:text-brand-800 flex items-center justify-center gap-1.5 transition-colors"
          >
            {t('View All Notifications', 'عرض جميع الإشعارات')}
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
