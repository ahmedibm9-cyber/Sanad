import { Link } from 'react-router-dom'
import {
  FolderKanban,
  ClipboardList,
  FileText,
  Users,
  Package,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Truck,
  BarChart3,
} from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import { useCompany } from '../contexts/CompanyContext'
import { useApp } from '../contexts/AppContext'
import {
  getProjectsByCompany,
  getTasksByCompany,
  getCustomersByCompany,
  getMaterialsByCompany,
  getActivityByCompany,
  getNotificationsForUser,
  getTodosForUser,
} from '../data/mockData'

export default function Dashboard() {
  const { t } = useLanguage()
  const { currentCompany } = useCompany()
  const { currentUser } = useApp()

  const allProjects = getProjectsByCompany(currentCompany.id)
  const allTasks = getTasksByCompany(currentCompany.id)
  const customers = getCustomersByCompany(currentCompany.id)
  const materials = getMaterialsByCompany(currentCompany.id)
  const activity = getActivityByCompany(currentCompany.id)
  const notifications = getNotificationsForUser(currentUser.id)
  const todos = getTodosForUser(currentUser.id)

  const activeProjects = allProjects.filter((p) => p.status === 'in_progress')
  const completedProjects = allProjects.filter((p) => p.status === 'completed')
  const activeTasks = allTasks.filter((t) => t.status === 'in_progress')
  const completedTasks = allTasks.filter((t) => t.status === 'completed')
  const unreadNotifications = notifications.filter((n) => !n.read)
  const pendingTodos = todos.filter((td) => !td.done)
  const overdueTodos = todos.filter((td) => {
    if (td.done || !td.dueDate) return false
    return new Date(td.dueDate) < new Date()
  })

  // Calculate total shipment value from active projects
  const totalShipmentValue = activeProjects.reduce((sum, p) => {
    const projectTotal = p.materials.reduce(
      (mSum, m) => mSum + m.quantity * m.unitPrice,
      0
    )
    return sum + projectTotal
  }, 0)

  // Recent activity (last 5)
  const recentActivity = [...activity]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5)

  const widgets = [
    {
      title: t('Active Projects', 'المشاريع النشطة'),
      value: activeProjects.length,
      total: allProjects.length,
      icon: FolderKanban,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      link: '/projects',
      linkLabel: t('View all', 'عرض الكل'),
      subtext: t('of total projects', 'من إجمالي المشاريع'),
    },
    {
      title: t('Active Tasks', 'المهام النشطة'),
      value: activeTasks.length,
      total: allTasks.length,
      icon: ClipboardList,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
      link: '/tasks',
      linkLabel: t('View all', 'عرض الكل'),
      subtext: t('of total tasks', 'من إجمالي المهام'),
    },
    {
      title: t('Total Value', 'القيمة الإجمالية'),
      value: `${totalShipmentValue.toLocaleString()}`,
      icon: TrendingUp,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      link: '/reports',
      linkLabel: t('View reports', 'عرض التقارير'),
      subtext: currentCompany.defaultCurrency || 'SAR',
      isCurrency: true,
    },
    {
      title: t('Customers', 'العملاء'),
      value: customers.length,
      icon: Users,
      iconBg: 'bg-purple-50',
      iconColor: 'text-purple-600',
      link: '/customers',
      linkLabel: t('View all', 'عرض الكل'),
      subtext: t('registered customers', 'عميل مسجل'),
    },
    {
      title: t('Materials', 'المواد'),
      value: materials.length,
      icon: Package,
      iconBg: 'bg-cyan-50',
      iconColor: 'text-cyan-600',
      link: '/materials',
      linkLabel: t('View all', 'عرض الكل'),
      subtext: t('in catalog', 'في الكتالوج'),
    },
    {
      title: t('Pending To-dos', 'المهام المعلقة'),
      value: pendingTodos.length,
      icon: Clock,
      iconBg: 'bg-orange-50',
      iconColor: 'text-orange-600',
      link: '/todos',
      linkLabel: t('View all', 'عرض الكل'),
      subtext: overdueTodos.length > 0
        ? t(`${overdueTodos.length} overdue`, `${overdueTodos.length} متأخرة`)
        : t('all on track', 'جميعها في الموعد'),
      valueColor: overdueTodos.length > 0 ? 'text-red-600' : undefined,
    },
    {
      title: t('Alerts', 'التنبيهات'),
      value: unreadNotifications.length,
      icon: AlertTriangle,
      iconBg: 'bg-rose-50',
      iconColor: 'text-rose-600',
      link: '/notifications',
      linkLabel: t('View all', 'عرض الكل'),
      subtext: t('unread notifications', 'إشعار غير مقروء'),
      valueColor: unreadNotifications.length > 0 ? 'text-rose-600' : undefined,
    },
    {
      title: t('Completed', 'المكتملة'),
      value: completedProjects.length + completedTasks.length,
      icon: CheckCircle2,
      iconBg: 'bg-green-50',
      iconColor: 'text-green-600',
      link: '/projects',
      linkLabel: t('View all', 'عرض الكل'),
      subtext: t('projects & tasks', 'مشاريع ومهام'),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-brand-900">
          {t('Dashboard', 'لوحة التحكم')}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {t(
            `Welcome back, ${currentUser.name}`,
            `مرحبًا بعودتك، ${currentUser.name}`
          )}
        </p>
      </div>

      {/* Widget Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {widgets.map((w) => {
          const Icon = w.icon
          return (
            <Link
              key={w.title}
              to={w.link}
              className="card p-5 hover:border-gray-300 transition-colors group"
            >
              <div className="flex items-start justify-between">
                <div className={`p-2.5 rounded-lg ${w.iconBg}`}>
                  <Icon className={`w-5 h-5 ${w.iconColor}`} />
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-brand-500 transition-colors" />
              </div>
              <div className="mt-3">
                <p className="text-sm font-medium text-gray-500">{w.title}</p>
                <p className={`text-2xl font-bold mt-0.5 ${w.valueColor || 'text-brand-900'}`}>
                  {w.isCurrency ? w.value : w.value}
                </p>
                {w.subtext && (
                  <p className="text-xs text-gray-400 mt-1">
                    {w.total !== undefined
                      ? `${w.total} ${w.subtext}`
                      : w.subtext}
                  </p>
                )}
              </div>
            </Link>
          )
        })}
      </div>

      {/* Bottom Section: Recent Activity + Quick Links */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-brand-900">
              {t('Recent Activity', 'النشاط الأخير')}
            </h2>
            <Link to="/activity" className="text-sm text-brand-600 hover:text-brand-800 flex items-center gap-1">
              {t('View all', 'عرض الكل')}
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {recentActivity.length === 0 ? (
            <div className="empty-state">
              <p className="text-sm text-gray-400">
                {t('No recent activity', 'لا يوجد نشاط حديث')}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((entry) => {
                const actionIcons: Record<string, string> = {
                  CREATE: '➕',
                  EDIT: '✏️',
                  UPLOAD: '📤',
                  ARCHIVE: '📦',
                  DELETE: '🗑️',
                  MOVE_TO_TRASH: '🗑️',
                  PDF_DOWNLOAD: '📄',
                  DOWNLOAD: '⬇️',
                  RESTORE: '♻️',
                  PERMISSION_CHANGE: '🔐',
                  BACKUP: '💾',
                  FACTORY_IMPORT: '🏭',
                }
                return (
                  <div key={entry.id} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-sand-50 transition-colors">
                    <span className="text-base mt-0.5">{actionIcons[entry.action] || '📌'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">{entry.userName}</span>
                        {' '}
                        <span className="text-gray-500">{entry.action.toLowerCase().replace('_', ' ')}</span>
                        {' '}
                        <span className="font-medium">{entry.entityRef || entry.entityType}</span>
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(entry.timestamp).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Quick Links & Project Status Breakdown */}
        <div className="space-y-6">
          {/* Project Status Breakdown */}
          <div className="card p-5">
            <h2 className="text-lg font-semibold text-brand-900 mb-4">
              {t('Project Status', 'حالة المشاريع')}
            </h2>
            <div className="space-y-3">
              {[
                { label: t('In Progress', 'قيد التنفيذ'), count: activeProjects.length, color: 'bg-blue-500', textColor: 'text-blue-700', bgColor: 'bg-blue-50' },
                { label: t('Completed', 'مكتملة'), count: completedProjects.length, color: 'bg-green-500', textColor: 'text-green-700', bgColor: 'bg-green-50' },
                { label: t('Cancelled', 'ملغاة'), count: allProjects.filter((p) => p.status === 'cancelled').length, color: 'bg-red-500', textColor: 'text-red-700', bgColor: 'bg-red-50' },
                { label: t('Archived', 'مؤرشفة'), count: allProjects.filter((p) => p.status === 'archived').length, color: 'bg-gray-400', textColor: 'text-gray-600', bgColor: 'bg-gray-100' },
              ].map((item) => {
                const pct = allProjects.length > 0 ? (item.count / allProjects.length) * 100 : 0
                return (
                  <div key={item.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`status-badge ${item.bgColor} ${item.textColor}`}>
                        {item.label}
                      </span>
                      <span className="text-sm font-semibold text-brand-900">{item.count}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div
                        className={`${item.color} h-1.5 rounded-full transition-all`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Active Shipment Highlights */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-brand-900">
                {t('Active Shipments', 'الشحنات النشطة')}
              </h2>
              <Link to="/projects" className="text-sm text-brand-600 hover:text-brand-800 flex items-center gap-1">
                {t('View all', 'عرض الكل')}
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            {activeProjects.length === 0 ? (
              <div className="empty-state">
                <p className="text-sm text-gray-400">
                  {t('No active shipments', 'لا توجد شحنات نشطة')}
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {activeProjects.slice(0, 5).map((proj) => {
                  const totalQty = proj.materials.reduce((s, m) => s + m.quantity, 0)
                  const totalValue = proj.materials.reduce((s, m) => s + m.quantity * m.unitPrice, 0)
                  return (
                    <Link
                      key={proj.id}
                      to={`/projects/${proj.id}`}
                      className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-sand-50 transition-colors"
                    >
                      <div className="p-1.5 bg-blue-50 rounded-lg">
                        <Truck className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-brand-900 truncate">{proj.name}</p>
                        <p className="text-xs text-gray-400">
                          {totalQty} {t('MT', 'طن')} &middot; {proj.destinationCountry || '—'}
                        </p>
                      </div>
                      <div className="text-end">
                        <p className="text-sm font-semibold text-brand-900">
                          {totalValue.toLocaleString()} {proj.currency || 'SAR'}
                        </p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
