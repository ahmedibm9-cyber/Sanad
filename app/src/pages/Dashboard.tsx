import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  FolderKanban,
  ClipboardList,
  AlertTriangle,
  ArrowRight,
  FileText,
  AlertCircle,
  Circle,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import { useCompany } from '../contexts/CompanyContext'
import { useAuth } from '../contexts/AuthContext'
import {
  useWorkItems,
  useTodos,
  useAuditEvents,
  useCompanyDocuments,
  useCompanyReportIssues,
  type ReportIssue,
} from '../hooks/useData'

const DOC_TYPE_LABELS: Record<string, { en: string; ar: string }> = {
  QUOT: { en: 'Quotation', ar: 'عرض سعر' },
  PINV: { en: 'Proforma Invoice', ar: 'فاتورة مبدئية' },
  TINV: { en: 'Tax Invoice', ar: 'فاتورة ضريبية' },
  CINV: { en: 'Commercial Invoice', ar: 'فاتورة تجارية' },
  PKL:  { en: 'Packing List', ar: 'قائمة التعبئة' },
  DN:   { en: 'Delivery Note', ar: 'إشعار التسليم' },
  BL:   { en: 'Bill of Lading', ar: 'بوليصة الشحن' },
}

const PRIORITY_CONFIG: Record<string, { bg: string; text: string; labelEn: string; labelAr: string }> = {
  high:   { bg: 'bg-red-50', text: 'text-red-600', labelEn: 'High', labelAr: 'عالية' },
  medium: { bg: 'bg-amber-50', text: 'text-amber-600', labelEn: 'Medium', labelAr: 'متوسطة' },
  low:    { bg: 'bg-gray-50', text: 'text-gray-500', labelEn: 'Low', labelAr: 'منخفضة' },
}

export default function Dashboard() {
  const { t } = useLanguage()
  const { currentCompany } = useCompany()
  const { user } = useAuth()

  const { data: rawWorkItems } = useWorkItems(currentCompany.id)
  const { data: rawTodos } = useTodos(user?.id)
  const { data: rawAuditEvents } = useAuditEvents(currentCompany.id)
  const { data: rawDocuments } = useCompanyDocuments(currentCompany.id)
  const { data: rawReportIssues } = useCompanyReportIssues(currentCompany.id)

  const workItems = rawWorkItems ?? []
  const todos = rawTodos ?? []
  const auditEvents = rawAuditEvents ?? []
  const documents = rawDocuments ?? []
  const reportIssues: ReportIssue[] = rawReportIssues ?? []

  // ── Derived data via useMemo ─────────────────────
  const allProjects = useMemo(() => workItems.filter((wi) => wi.type === 'project'), [workItems])
  const allTasks = useMemo(() => workItems.filter((wi) => wi.type === 'task'), [workItems])

  // Work item name lookup for document display
  const workItemNameMap = useMemo(() => {
    const map: Record<string, string> = {}
    for (const wi of workItems) {
      map[wi.id] = wi.name
    }
    return map
  }, [workItems])

  // ── Operational counts ──────────────────────────────
  const inProgressProjects = useMemo(() => allProjects.filter((p) => p.status === 'in_progress'), [allProjects])
  const completedProjects = useMemo(() => allProjects.filter((p) => p.status === 'completed'), [allProjects])
  const activeTasks = useMemo(() => allTasks.filter((tk) => tk.status === 'in_progress'), [allTasks])
  const pendingTodos = useMemo(() => todos.filter((td) => !td.is_done), [todos])
  const overdueTodos = useMemo(() => pendingTodos.filter((td) => {
    if (!td.due_date) return false
    return new Date(td.due_date) < new Date()
  }), [pendingTodos])

  // Overdue tasks: in_progress tasks created more than 30 days ago
  const overdueTasks = useMemo(() => {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    return activeTasks.filter((tk) => new Date(tk.created_at) < thirtyDaysAgo)
  }, [activeTasks])

  // Open report issues across all company projects
  const openIssues = useMemo(
    () => reportIssues.filter((ri) => ri.status === 'open'),
    [reportIssues]
  )

  // ── My To-dos (pending, sorted by priority then due date) ──
  const myTodos = useMemo(() => {
    const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 }
    return [...pendingTodos].sort((a, b) => {
      const pa = priorityOrder[a.priority] ?? 2
      const pb = priorityOrder[b.priority] ?? 2
      if (pa !== pb) return pa - pb
      if (a.due_date && b.due_date) return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
      if (a.due_date) return -1
      if (b.due_date) return 1
      return 0
    })
  }, [pendingTodos])

  // ── Recently Created/Edited Documents ──
  const recentDocuments = useMemo(
    () =>
      [...documents]
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        .slice(0, 5)
        .map((doc) => ({
          ...doc,
          projectName: workItemNameMap[doc.work_item_id] ?? '',
        })),
    [documents, workItemNameMap]
  )

  // ── Recent Activity (last 5) ──
  const recentActivity = useMemo(
    () =>
      [...auditEvents]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5),
    [auditEvents]
  )

  // ── Attention stat cards ──────────────────────────
  const attentionStats = [
    {
      label: t('In Progress Projects', 'مشاريع قيد التنفيذ'),
      value: inProgressProjects.length,
      icon: FolderKanban,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      link: '/projects',
      urgent: false,
    },
    {
      label: t('In Progress Tasks', 'مهام قيد التنفيذ'),
      value: activeTasks.length,
      icon: ClipboardList,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
      link: '/tasks',
      urgent: false,
    },
    {
      label: t('Overdue Tasks', 'مهام متأخرة'),
      value: overdueTasks.length,
      icon: AlertCircle,
      iconBg: 'bg-red-50',
      iconColor: 'text-red-600',
      link: '/tasks',
      urgent: overdueTasks.length > 0,
    },
    {
      label: t('Open Issues', 'مشاكل مفتوحة'),
      value: openIssues.length,
      icon: AlertTriangle,
      iconBg: 'bg-orange-50',
      iconColor: 'text-orange-600',
      link: '/projects',
      urgent: openIssues.length > 0,
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
            `Welcome back, ${user?.displayName ?? ''}`,
            `مرحبًا بعودتك، ${user?.displayName ?? ''}`
          )}
        </p>
      </div>

      {/* ── Attention Stats ──────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {attentionStats.map((stat) => {
          const Icon = stat.icon
          return (
            <Link
              key={stat.label}
              to={stat.link}
              className={`card p-5 hover:border-gray-300 transition-colors group ${
                stat.urgent ? 'border-red-200 bg-red-50/30' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className={`p-2.5 rounded-lg ${stat.iconBg}`}>
                  <Icon className={`w-5 h-5 ${stat.iconColor}`} />
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-brand-500 transition-colors" />
              </div>
              <div className="mt-3">
                <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                <p className={`text-2xl font-bold mt-0.5 ${
                  stat.urgent && stat.value > 0 ? 'text-red-600' : 'text-brand-900'
                }`}>
                  {stat.value}
                </p>
              </div>
            </Link>
          )
        })}
      </div>

      {/* ── My To-dos ──────────────────────────────── */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-brand-900">
            {t('My To-dos', 'مهامي الشخصية')}
          </h2>
          <Link to="/todos" className="text-sm text-brand-600 hover:text-brand-800 flex items-center gap-1">
            {t('View all', 'عرض الكل')}
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        {myTodos.length === 0 ? (
          <div className="empty-state py-6">
            <CheckCircle2 className="w-8 h-8 text-green-400 mb-2" />
            <p className="text-sm text-gray-400">
              {t('All caught up!', 'لقد أنهيت كل شيء!')}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {myTodos.slice(0, 5).map((todo) => {
              const isOverdue = todo.due_date && new Date(todo.due_date) < new Date()
              const pConfig = PRIORITY_CONFIG[todo.priority] || PRIORITY_CONFIG.low
              return (
                <div
                  key={todo.id}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                    isOverdue ? 'bg-red-50/60' : 'hover:bg-sand-50'
                  }`}
                >
                  <Circle className={`w-4 h-4 shrink-0 ${
                    isOverdue ? 'text-red-400' : 'text-gray-300'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${isOverdue ? 'text-red-700' : 'text-gray-800'}`}>
                      {todo.title}
                    </p>
                    {todo.description && (
                      <p className="text-xs text-gray-400 truncate mt-0.5">{todo.description}</p>
                    )}
                  </div>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${pConfig.bg} ${pConfig.text} shrink-0`}>
                    {t(pConfig.labelEn, pConfig.labelAr)}
                  </span>
                  {todo.due_date && (
                    <span className={`text-xs shrink-0 ${isOverdue ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                      {new Date(todo.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </div>
              )
            })}
            {myTodos.length > 5 && (
              <Link to="/todos" className="flex items-center justify-center gap-1 py-2 text-xs text-brand-600 hover:text-brand-800 font-medium">
                {t(`+${myTodos.length - 5} more`, `+${myTodos.length - 5} أخرى`)}
                <ChevronRight className="w-3 h-3" />
              </Link>
            )}
          </div>
        )}
      </div>

      {/* ── Bottom Section: Recent Documents + Activity + Project Status ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recently Created/Edited Documents */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-brand-900">
              {t('Recent Documents', 'المستندات الأخيرة')}
            </h2>
          </div>
          {recentDocuments.length === 0 ? (
            <div className="empty-state py-6">
              <FileText className="w-8 h-8 text-gray-300 mb-2" />
              <p className="text-sm text-gray-400">
                {t('No documents yet', 'لا توجد مستندات بعد')}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentDocuments.map((doc) => {
                const typeLabel = DOC_TYPE_LABELS[doc.document_type]
                const isDraft = doc.status === 'draft'
                return (
                  <div
                    key={doc.id}
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-sand-50 transition-colors"
                  >
                    <div className="p-1.5 bg-brand-50 rounded-lg shrink-0">
                      <FileText className="w-4 h-4 text-brand-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-brand-900 truncate">{doc.document_number}</p>
                        {isDraft && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 shrink-0">
                            {t('Draft', 'مسودة')}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 truncate">
                        {typeLabel ? t(typeLabel.en, typeLabel.ar) : doc.document_type}
                        {' · '}
                        {doc.projectName}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0">
                      {new Date(doc.updated_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

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
            <div className="empty-state py-6">
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
                        <span className="font-medium">{entry.actor_user_id}</span>
                        {' '}
                        <span className="text-gray-500">{entry.action.toLowerCase().replace('_', ' ')}</span>
                        {' '}
                        <span className="font-medium">{entry.entity_reference || entry.entity_type}</span>
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(entry.created_at).toLocaleDateString('en-US', {
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

        {/* Project Status Breakdown */}
        <div className="card p-5">
          <h2 className="text-lg font-semibold text-brand-900 mb-4">
            {t('Project Status', 'حالة المشاريع')}
          </h2>
          <div className="space-y-3">
            {[
              { label: t('In Progress', 'قيد التنفيذ'), count: inProgressProjects.length, color: 'bg-blue-500', textColor: 'text-blue-700', bgColor: 'bg-blue-50' },
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
      </div>
    </div>
  )
}
