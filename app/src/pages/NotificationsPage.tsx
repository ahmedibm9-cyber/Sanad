import { useState, useMemo, useEffect } from 'react'
import {
  Bell, CheckCheck, Filter, Clock, AlertTriangle, FileText,
  CheckCircle, AlertCircle, Upload, Shield, Archive, Users,
  Calendar, Package
} from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import { useApp } from '../contexts/AppContext'
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from '../hooks/useData'
import type { Notification } from '../types'
import type { Notification as DbNotification } from '../hooks/useData'

const typeIcons: Record<string, React.ReactNode> = {
  task_assigned: <CheckCircle className="w-5 h-5 text-blue-600" />,
  task_overdue: <AlertTriangle className="w-5 h-5 text-red-600" />,
  document_created: <FileText className="w-5 h-5 text-indigo-600" />,
  report_issue: <AlertCircle className="w-5 h-5 text-amber-600" />,
  project_status: <CheckCircle className="w-5 h-5 text-green-600" />,
  attachment: <Upload className="w-5 h-5 text-teal-600" />,
  permission_change: <Shield className="w-5 h-5 text-purple-600" />,
  backup_success: <CheckCircle className="w-5 h-5 text-green-600" />,
  todo_reminder: <Calendar className="w-5 h-5 text-orange-600" />,
  project_archived: <Archive className="w-5 h-5 text-gray-600" />,
}

const typeBgColors: Record<string, string> = {
  task_assigned: 'bg-blue-50 border-blue-200',
  task_overdue: 'bg-red-50 border-red-200',
  document_created: 'bg-indigo-50 border-indigo-200',
  report_issue: 'bg-amber-50 border-amber-200',
  project_status: 'bg-green-50 border-green-200',
  attachment: 'bg-teal-50 border-teal-200',
  permission_change: 'bg-purple-50 border-purple-200',
  backup_success: 'bg-green-50 border-green-200',
  todo_reminder: 'bg-orange-50 border-orange-200',
  project_archived: 'bg-gray-50 border-gray-200',
}

const notificationTypes = [
  { value: '', label: 'All Types', labelAr: 'كل الأنواع' },
  { value: 'task_assigned', label: 'Task Assigned', labelAr: 'تم تكليف مهمة' },
  { value: 'task_overdue', label: 'Task Overdue', labelAr: 'مهمة متأخرة' },
  { value: 'document_created', label: 'Document Created', labelAr: 'تم إنشاء مستند' },
  { value: 'report_issue', label: 'Report Issue', labelAr: 'مشكلة في التقرير' },
  { value: 'project_status', label: 'Project Status', labelAr: 'حالة المشروع' },
  { value: 'attachment', label: 'Attachment', labelAr: 'مرفق' },
  { value: 'permission_change', label: 'Permission Change', labelAr: 'تغيير صلاحية' },
  { value: 'backup_success', label: 'Backup', labelAr: 'نسخ احتياطي' },
  { value: 'todo_reminder', label: 'To-do Reminder', labelAr: 'تذكير بمهمة' },
  { value: 'project_archived', label: 'Project Archived', labelAr: 'أُرشف مشروع' },
]

function formatTimeAgo(dateStr: string): string {
  const now = new Date('2024-11-25T12:00:00Z')
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHr = Math.floor(diffMs / 3600000)
  const diffDay = Math.floor(diffMs / 86400000)

  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHr < 24) return `${diffHr}h ago`
  if (diffDay < 7) return `${diffDay}d ago`
  return date.toLocaleDateString()
}

export default function NotificationsPage() {
  const { t } = useLanguage()
  const { currentUser } = useApp()

  const { data: dbNotifications = [], loading, refetch } = useNotifications(currentUser.id)
  const { markRead: markReadDb } = useMarkNotificationRead()
  const { markAllRead: markAllReadDb } = useMarkAllNotificationsRead()

  // Map Supabase Notification to UI Notification type
  const mappedNotifications = useMemo<Notification[]>(() => {
    return (dbNotifications ?? []).map((n: DbNotification) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.body ?? '',
      read: !!n.read_at,
      createdAt: n.created_at,
      entityId: n.entity_id ?? undefined,
      entityType: n.entity_type ?? undefined,
    }))
  }, [dbNotifications])

  const [notifs, setNotifs] = useState<Notification[]>(mappedNotifications)
  const [typeFilter, setTypeFilter] = useState('')
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)

  // Sync hook data into local state when it loads
  useEffect(() => {
    setNotifs(mappedNotifications)
  }, [mappedNotifications])

  const filtered = useMemo(() => {
    return notifs.filter(n => {
      if (typeFilter && n.type !== typeFilter) return false
      if (showUnreadOnly && n.read) return false
      return true
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [notifs, typeFilter, showUnreadOnly])

  const unreadCount = notifs.filter(n => !n.read).length

  const handleMarkAsRead = (id: string) => {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    markReadDb(id, currentUser.id).then(() => refetch())
  }

  const handleMarkAllRead = () => {
    setNotifs(prev => prev.map(n => ({ ...n, read: true })))
    markAllReadDb(currentUser.id).then(() => refetch())
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-6 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{t('Notifications', 'الإشعارات')}</h1>
              {unreadCount > 0 && (
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-500 text-white text-xs font-bold">
                  {unreadCount}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {loading
                ? t('Loading notifications...', 'جارٍ تحميل الإشعارات...')
                : t('Stay updated on project and system activities', 'تابع أحدث أنشطة المشاريع والنظام')}
            </p>
          </div>
          <button
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
            className="btn-secondary disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <CheckCheck className="w-4 h-4 ms-2" />
            {t('Mark All as Read', 'تعيين الكل كمقروء')}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex-shrink-0 px-6 pb-4">
        <div className="flex items-end gap-3">
          <div>
            <label className="label-field">{t('Filter by Type', 'تصفية حسب النوع')}</label>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="select-field w-52">
              {notificationTypes.map(nt => (
                <option key={nt.value} value={nt.value}>{t(nt.label, nt.labelAr)}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 pb-0.5">
            <input
              type="checkbox"
              id="unread-only"
              checked={showUnreadOnly}
              onChange={e => setShowUnreadOnly(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
            />
            <label htmlFor="unread-only" className="text-sm text-gray-600">
              {t('Unread only', 'غير مقروء فقط')}
            </label>
          </div>
        </div>
      </div>

      {/* Notification List */}
      <div className="flex-1 overflow-auto px-6 pb-6">
        <div className="space-y-2">
          {filtered.map(n => (
            <div
              key={n.id}
              onClick={() => handleMarkAsRead(n.id)}
              className={`card p-4 cursor-pointer transition-all border-s-4 ${
                !n.read
                  ? `${typeBgColors[n.type] || 'bg-gray-50 border-gray-200'} border-s-brand-600`
                  : 'bg-white border-s-transparent hover:bg-gray-50/50'
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                  !n.read ? 'bg-white' : 'bg-gray-50'
                }`}>
                  {typeIcons[n.type] || <Bell className="w-5 h-5 text-gray-400" />}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className={`text-sm font-semibold ${!n.read ? 'text-gray-900' : 'text-gray-700'}`}>
                        {n.title}
                      </h3>
                      <p className={`text-sm mt-0.5 ${!n.read ? 'text-gray-700' : 'text-gray-500'}`}>
                        {n.message}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {!n.read && (
                        <span className="w-2.5 h-2.5 rounded-full bg-brand-600" />
                      )}
                      <div className="flex items-center gap-1 text-xs text-gray-400 whitespace-nowrap">
                        <Clock className="w-3 h-3" />
                        {formatTimeAgo(n.createdAt)}
                      </div>
                    </div>
                  </div>
                  {/* Meta */}
                  <div className="flex items-center gap-3 mt-2">
                    {n.entityType && (
                      <span className="status-badge bg-gray-100 text-gray-600">
                        {n.entityType}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="card empty-state py-12">
              <Bell className="w-10 h-10 text-gray-300 mb-3" />
              <p className="text-gray-400 font-medium">
                {t('No notifications match your filters.', 'لا توجد إشعارات مطابقة لمرشّحاتك.')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
