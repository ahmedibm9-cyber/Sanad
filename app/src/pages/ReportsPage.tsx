import { useState, useMemo, type ReactNode } from 'react'
import {
  BarChart3, Calendar, Building2, Users, FileText, CheckSquare,
  AlertTriangle, Activity, Globe, Package, ShieldCheck,
  FileDown, FileSpreadsheet, CheckCircle
} from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import { useCompany } from '../contexts/CompanyContext'
import { projects, tasks, users, activityLog, companies } from '../data/mockData'
import type { WorkItem } from '../types'

// ─── Filter State ──────────────────────────────────────
interface ReportFiltersState {
  dateFrom: string
  dateTo: string
  status: string
  companyId: string
}

const defaultFilters: ReportFiltersState = {
  dateFrom: '',
  dateTo: '',
  status: '',
  companyId: '',
}

// ─── Helper: apply common filters to a list of WorkItems ──
function filterWorkItems(items: WorkItem[], filters: ReportFiltersState): WorkItem[] {
  return items.filter(item => {
    if (filters.status && item.status !== filters.status) return false
    if (filters.companyId && item.companyId !== filters.companyId) return false
    if (filters.dateFrom && item.createdAt < filters.dateFrom) return false
    if (filters.dateTo && item.createdAt > filters.dateTo) return false
    return true
  })
}

// ─── Report Item definition ────────────────────────────
interface ReportItem {
  id: string
  name: string
  nameAr: string
  icon: ReactNode
}

const reports: ReportItem[] = [
  { id: 'by-status', name: 'Projects by Status', nameAr: 'المشاريع حسب الحالة', icon: <BarChart3 className="w-4 h-4" /> },
  { id: 'by-date', name: 'Projects by Date', nameAr: 'المشاريع حسب التاريخ', icon: <Calendar className="w-4 h-4" /> },
  { id: 'by-company', name: 'Projects by Company', nameAr: 'المشاريع حسب الشركة', icon: <Building2 className="w-4 h-4" /> },
  { id: 'by-customer', name: 'Projects by Customer', nameAr: 'المشاريع حسب العميل', icon: <Users className="w-4 h-4" /> },
  { id: 'documents-register', name: 'Documents Register', nameAr: 'سجل المستندات', icon: <FileText className="w-4 h-4" /> },
  { id: 'tasks', name: 'Tasks', nameAr: 'المهام', icon: <CheckSquare className="w-4 h-4" /> },
  { id: 'overdue-tasks', name: 'Overdue Tasks', nameAr: 'المهام المتأخرة', icon: <AlertTriangle className="w-4 h-4" /> },
  { id: 'user-activity', name: 'User Activity', nameAr: 'نشاط المستخدمين', icon: <Activity className="w-4 h-4" /> },
  { id: 'customer-export-history', name: 'Customer Export History', nameAr: 'سجل تصدير العملاء', icon: <Globe className="w-4 h-4" /> },
  { id: 'material-export-history', name: 'Material Export History', nameAr: 'سجل تصدير المواد', icon: <Package className="w-4 h-4" /> },
  { id: 'audit', name: 'Audit Report', nameAr: 'تقرير التدقيق', icon: <ShieldCheck className="w-4 h-4" /> },
]

// ─── Filter Bar (controlled, rendered once in parent) ──
function ReportFilterBar({ filters, onChange }: { filters: ReportFiltersState; onChange: (f: ReportFiltersState) => void }) {
  const { t } = useLanguage()
  const { companies: allCompanies } = useCompany()
  const update = (patch: Partial<ReportFiltersState>) => onChange({ ...filters, ...patch })

  return (
    <div className="flex flex-wrap items-end gap-3 mb-4">
      <div>
        <label className="label-field">{t('From Date', 'من تاريخ')}</label>
        <input
          type="date"
          className="input-field w-40"
          value={filters.dateFrom}
          onChange={e => update({ dateFrom: e.target.value })}
        />
      </div>
      <div>
        <label className="label-field">{t('To Date', 'إلى تاريخ')}</label>
        <input
          type="date"
          className="input-field w-40"
          value={filters.dateTo}
          onChange={e => update({ dateTo: e.target.value })}
        />
      </div>
      <div>
        <label className="label-field">{t('Status', 'الحالة')}</label>
        <select
          className="select-field w-44"
          value={filters.status}
          onChange={e => update({ status: e.target.value })}
        >
          <option value="">{t('All', 'الكل')}</option>
          <option value="in_progress">{t('In Progress', 'قيد التنفيذ')}</option>
          <option value="completed">{t('Completed', 'مكتمل')}</option>
          <option value="cancelled">{t('Cancelled', 'ملغى')}</option>
          <option value="archived">{t('Archived', 'مؤرشف')}</option>
        </select>
      </div>
      <div>
        <label className="label-field">{t('Company', 'الشركة')}</label>
        <select
          className="select-field w-44"
          value={filters.companyId}
          onChange={e => update({ companyId: e.target.value })}
        >
          <option value="">{t('All Companies', 'كل الشركات')}</option>
          {allCompanies.map(c => (
            <option key={c.id} value={c.id}>{c.nameEn}</option>
          ))}
        </select>
      </div>
    </div>
  )
}

// ─── Export Actions ────────────────────────────────────
function ReportActions() {
  const { t } = useLanguage()
  const [exported, setExported] = useState<string | null>(null)
  const handleExport = (type: string) => {
    setExported(type)
    setTimeout(() => setExported(null), 2000)
  }
  return (
    <div className="flex items-center gap-2 mb-4">
      {exported ? (
        <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
          <CheckCircle className="w-4 h-4" />
          {t(`Exported to ${exported} successfully`, `تم التصدير إلى ${exported} بنجاح`)}
        </div>
      ) : (
        <>
          <button onClick={() => handleExport('PDF')} className="btn-secondary">
            <FileDown className="w-4 h-4 ms-2" />
            {t('Export PDF', 'تصدير PDF')}
          </button>
          <button onClick={() => handleExport('Excel')} className="btn-secondary">
            <FileSpreadsheet className="w-4 h-4 ms-2" />
            {t('Export Excel', 'تصدير Excel')}
          </button>
        </>
      )}
    </div>
  )
}

// ─── Empty state row helper ────────────────────────────
function EmptyRow({ colSpan, message }: { colSpan: number; message: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-8 text-center text-gray-400 empty-state">
        {message}
      </td>
    </tr>
  )
}

// ─── Report: Projects by Status ────────────────────────
function ProjectsByStatusReport({ filtered }: { filtered: WorkItem[] }) {
  const { t } = useLanguage()
  const statusCounts = useMemo(() => filtered.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1
    return acc
  }, {} as Record<string, number>), [filtered])

  const statusLabels: Record<string, string> = {
    in_progress: t('In Progress', 'قيد التنفيذ'),
    completed: t('Completed', 'مكتمل'),
    cancelled: t('Cancelled', 'ملغى'),
    archived: t('Archived', 'مؤرشف'),
  }
  const statusColors: Record<string, string> = {
    in_progress: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    archived: 'bg-gray-100 text-gray-800',
  }

  return (
    <div className="card overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50/80">
            <th className="text-start px-4 py-3 font-semibold text-gray-700">{t('Status', 'الحالة')}</th>
            <th className="text-start px-4 py-3 font-semibold text-gray-700">{t('Count', 'العدد')}</th>
            <th className="text-start px-4 py-3 font-semibold text-gray-700">{t('Percentage', 'النسبة')}</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(statusCounts).map(([status, count]) => {
            const total = filtered.length || 1
            const pct = ((count / total) * 100).toFixed(1)
            return (
              <tr key={status} className="border-b border-gray-100 table-row-hover">
                <td className="px-4 py-3">
                  <span className={`status-badge ${statusColors[status] || ''}`}>{statusLabels[status] || status}</span>
                </td>
                <td className="px-4 py-3 font-medium">{count}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-brand-600 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-gray-500">{pct}%</span>
                  </div>
                </td>
              </tr>
            )
          })}
          {Object.keys(statusCounts).length === 0 && (
            <EmptyRow colSpan={3} message={t('No projects match the selected filters.', 'لا توجد مشاريع مطابقة للمرشّحات المحددة.')} />
          )}
        </tbody>
      </table>
    </div>
  )
}

// ─── Report: Projects by Date ──────────────────────────
function ProjectsByDateReport({ filtered }: { filtered: WorkItem[] }) {
  const { t } = useLanguage()
  const byMonth = useMemo(() => filtered.reduce((acc, p) => {
    const month = p.createdAt.substring(0, 7)
    acc[month] = (acc[month] || 0) + 1
    return acc
  }, {} as Record<string, number>), [filtered])

  return (
    <div className="card overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50/80">
            <th className="text-start px-4 py-3 font-semibold text-gray-700">{t('Month', 'الشهر')}</th>
            <th className="text-start px-4 py-3 font-semibold text-gray-700">{t('Projects Created', 'مشاريع منشأة')}</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(byMonth).sort().map(([month, count]) => (
            <tr key={month} className="border-b border-gray-100 table-row-hover">
              <td className="px-4 py-3 font-medium">{month}</td>
              <td className="px-4 py-3">{count}</td>
            </tr>
          ))}
          {Object.keys(byMonth).length === 0 && (
            <EmptyRow colSpan={2} message={t('No projects match the selected filters.', 'لا توجد مشاريع مطابقة للمرشّحات المحددة.')} />
          )}
        </tbody>
      </table>
    </div>
  )
}

// ─── Report: Projects by Company ───────────────────────
function ProjectsByCompanyReport({ filtered }: { filtered: WorkItem[] }) {
  const { t } = useLanguage()
  const byCompany = useMemo(() => filtered.reduce((acc, p) => {
    const comp = companies.find(c => c.id === p.companyId)
    const name = comp?.nameEn || p.companyId
    acc[name] = (acc[name] || 0) + 1
    return acc
  }, {} as Record<string, number>), [filtered])

  return (
    <div className="card overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50/80">
            <th className="text-start px-4 py-3 font-semibold text-gray-700">{t('Company', 'الشركة')}</th>
            <th className="text-start px-4 py-3 font-semibold text-gray-700">{t('Projects', 'المشاريع')}</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(byCompany).map(([name, count]) => (
            <tr key={name} className="border-b border-gray-100 table-row-hover">
              <td className="px-4 py-3 font-medium">{name}</td>
              <td className="px-4 py-3">{count}</td>
            </tr>
          ))}
          {Object.keys(byCompany).length === 0 && (
            <EmptyRow colSpan={2} message={t('No projects match the selected filters.', 'لا توجد مشاريع مطابقة للمرشّحات المحددة.')} />
          )}
        </tbody>
      </table>
    </div>
  )
}

// ─── Report: Projects by Customer ──────────────────────
function ProjectsByCustomerReport({ filtered }: { filtered: WorkItem[] }) {
  const { t } = useLanguage()
  const byCustomer = useMemo(() => filtered.reduce((acc, p) => {
    const name = p.customerName || 'Unknown'
    acc[name] = (acc[name] || 0) + 1
    return acc
  }, {} as Record<string, number>), [filtered])

  return (
    <div className="card overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50/80">
            <th className="text-start px-4 py-3 font-semibold text-gray-700">{t('Customer', 'العميل')}</th>
            <th className="text-start px-4 py-3 font-semibold text-gray-700">{t('Projects', 'المشاريع')}</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(byCustomer).sort((a, b) => b[1] - a[1]).map(([name, count]) => (
            <tr key={name} className="border-b border-gray-100 table-row-hover">
              <td className="px-4 py-3 font-medium">{name}</td>
              <td className="px-4 py-3">{count}</td>
            </tr>
          ))}
          {Object.keys(byCustomer).length === 0 && (
            <EmptyRow colSpan={2} message={t('No projects match the selected filters.', 'لا توجد مشاريع مطابقة للمرشّحات المحددة.')} />
          )}
        </tbody>
      </table>
    </div>
  )
}

// ─── Report: Documents Register ────────────────────────
function DocumentsRegisterReport({ filtered }: { filtered: WorkItem[] }) {
  const { t } = useLanguage()
  const allDocs = useMemo(() => filtered.flatMap(p => p.documents.map(d => ({ ...d, projectName: p.name }))), [filtered])

  return (
    <div className="card overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50/80">
            <th className="text-start px-4 py-3 font-semibold text-gray-700">{t('Doc Number', 'رقم المستند')}</th>
            <th className="text-start px-4 py-3 font-semibold text-gray-700">{t('Type', 'النوع')}</th>
            <th className="text-start px-4 py-3 font-semibold text-gray-700">{t('Project', 'المشروع')}</th>
            <th className="text-start px-4 py-3 font-semibold text-gray-700">{t('Date', 'التاريخ')}</th>
            <th className="text-start px-4 py-3 font-semibold text-gray-700">{t('Status', 'الحالة')}</th>
          </tr>
        </thead>
        <tbody>
          {allDocs.map(doc => (
            <tr key={doc.id} className="border-b border-gray-100 table-row-hover">
              <td className="px-4 py-3 font-mono text-brand-700 font-medium">{doc.number}</td>
              <td className="px-4 py-3">{doc.type}</td>
              <td className="px-4 py-3">{doc.projectName}</td>
              <td className="px-4 py-3">{doc.date}</td>
              <td className="px-4 py-3">
                <span className={`status-badge ${doc.status === 'final' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                  {doc.status === 'final' ? t('Final', 'نهائي') : t('Draft', 'مسودة')}
                </span>
              </td>
            </tr>
          ))}
          {allDocs.length === 0 && (
            <EmptyRow colSpan={5} message={t('No documents found.', 'لا توجد مستندات.')} />
          )}
        </tbody>
      </table>
    </div>
  )
}

// ─── Report: Tasks ─────────────────────────────────────
function TasksReport({ filtered }: { filtered: WorkItem[] }) {
  const { t } = useLanguage()
  return (
    <div className="card overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50/80">
            <th className="text-start px-4 py-3 font-semibold text-gray-700">{t('Task', 'المهمة')}</th>
            <th className="text-start px-4 py-3 font-semibold text-gray-700">{t('Customer', 'العميل')}</th>
            <th className="text-start px-4 py-3 font-semibold text-gray-700">{t('Status', 'الحالة')}</th>
            <th className="text-start px-4 py-3 font-semibold text-gray-700">{t('Created By', 'أنشأها')}</th>
            <th className="text-start px-4 py-3 font-semibold text-gray-700">{t('Created', 'أنشئ في')}</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(task => (
            <tr key={task.id} className="border-b border-gray-100 table-row-hover">
              <td className="px-4 py-3 font-medium">{task.name}</td>
              <td className="px-4 py-3 text-gray-600">{task.customerName || '-'}</td>
              <td className="px-4 py-3">
                <span className={`status-badge ${
                  task.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                  task.status === 'completed' ? 'bg-green-100 text-green-800' :
                  task.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {task.status === 'in_progress' ? t('In Progress', 'قيد التنفيذ') :
                   task.status === 'completed' ? t('Completed', 'مكتمل') :
                   task.status === 'cancelled' ? t('Cancelled', 'ملغى') : task.status}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-600">{task.createdBy || '-'}</td>
              <td className="px-4 py-3 text-gray-500">{task.createdAt}</td>
            </tr>
          ))}
          {filtered.length === 0 && (
            <EmptyRow colSpan={5} message={t('No tasks match the selected filters.', 'لا توجد مهام مطابقة للمرشّحات المحددة.')} />
          )}
        </tbody>
      </table>
    </div>
  )
}

// ─── Report: Overdue Tasks ─────────────────────────────
function OverdueTasksReport({ filtered }: { filtered: WorkItem[] }) {
  const { t } = useLanguage()
  return (
    <div className="card overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50/80">
            <th className="text-start px-4 py-3 font-semibold text-gray-700">{t('Task', 'المهمة')}</th>
            <th className="text-start px-4 py-3 font-semibold text-gray-700">{t('Customer', 'العميل')}</th>
            <th className="text-start px-4 py-3 font-semibold text-gray-700">{t('Created', 'أنشئ في')}</th>
            <th className="text-start px-4 py-3 font-semibold text-gray-700">{t('Days Overdue', 'أيام التأخير')}</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(task => {
            const days = Math.floor((Date.now() - new Date(task.createdAt).getTime()) / 86400000)
            return (
              <tr key={task.id} className="border-b border-gray-100 table-row-hover">
                <td className="px-4 py-3 font-medium">{task.name}</td>
                <td className="px-4 py-3 text-gray-600">{task.customerName || '-'}</td>
                <td className="px-4 py-3 text-gray-500">{task.createdAt}</td>
                <td className="px-4 py-3">
                  <span className="status-badge bg-red-100 text-red-800">{days} {t('days', 'يوم')}</span>
                </td>
              </tr>
            )
          })}
          {filtered.length === 0 && (
            <EmptyRow colSpan={4} message={t('No overdue tasks.', 'لا توجد مهام متأخرة.')} />
          )}
        </tbody>
      </table>
    </div>
  )
}

// ─── Report: User Activity ─────────────────────────────
function UserActivityReport({ filtered }: { filtered: WorkItem[] }) {
  const { t } = useLanguage()
  const companyIds = useMemo(() => new Set(filtered.map(p => p.companyId)), [filtered])
  const userActivity = useMemo(() => users.map(u => {
    const count = activityLog.filter(a => a.userId === u.id && companyIds.has(a.companyId)).length
    return { ...u, actionCount: count }
  }), [companyIds])

  return (
    <div className="card overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50/80">
            <th className="text-start px-4 py-3 font-semibold text-gray-700">{t('User', 'المستخدم')}</th>
            <th className="text-start px-4 py-3 font-semibold text-gray-700">{t('Email', 'البريد الإلكتروني')}</th>
            <th className="text-start px-4 py-3 font-semibold text-gray-700">{t('Role', 'الدور')}</th>
            <th className="text-start px-4 py-3 font-semibold text-gray-700">{t('Actions Logged', 'الإجراءات المسجلة')}</th>
          </tr>
        </thead>
        <tbody>
          {userActivity.map(u => (
            <tr key={u.id} className="border-b border-gray-100 table-row-hover">
              <td className="px-4 py-3 font-medium">{u.name}</td>
              <td className="px-4 py-3 text-gray-500">{u.email}</td>
              <td className="px-4 py-3">
                <span className={`status-badge ${
                  u.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                  u.role === 'user' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {u.role}
                </span>
              </td>
              <td className="px-4 py-3 font-medium">{u.actionCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Report: Customer Export History ───────────────────
function CustomerExportHistoryReport({ filtered }: { filtered: WorkItem[] }) {
  const { t } = useLanguage()
  const exportProjects = useMemo(() =>
    filtered.filter(p => p.status === 'completed' || p.status === 'archived'),
    [filtered]
  )

  return (
    <div className="card overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50/80">
            <th className="text-start px-4 py-3 font-semibold text-gray-700">{t('Customer', 'العميل')}</th>
            <th className="text-start px-4 py-3 font-semibold text-gray-700">{t('Project', 'المشروع')}</th>
            <th className="text-start px-4 py-3 font-semibold text-gray-700">{t('Destination', 'الوجهة')}</th>
            <th className="text-start px-4 py-3 font-semibold text-gray-700">{t('Status', 'الحالة')}</th>
            <th className="text-start px-4 py-3 font-semibold text-gray-700">{t('Date', 'التاريخ')}</th>
          </tr>
        </thead>
        <tbody>
          {exportProjects.map(p => (
            <tr key={p.id} className="border-b border-gray-100 table-row-hover">
              <td className="px-4 py-3 font-medium">{p.customerName || '-'}</td>
              <td className="px-4 py-3">{p.name}</td>
              <td className="px-4 py-3 text-gray-600">{p.destinationCity}{p.destinationCountry ? `, ${p.destinationCountry}` : ''}</td>
              <td className="px-4 py-3">
                <span className={`status-badge ${p.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {p.status === 'completed' ? t('Completed', 'مكتمل') : t('Archived', 'مؤرشف')}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-500">{p.updatedAt}</td>
            </tr>
          ))}
          {exportProjects.length === 0 && (
            <EmptyRow colSpan={5} message={t('No export history found.', 'لا يوجد سجل تصدير.')} />
          )}
        </tbody>
      </table>
    </div>
  )
}

// ─── Report: Material Export History ───────────────────
function MaterialExportHistoryReport({ filtered }: { filtered: WorkItem[] }) {
  const { t } = useLanguage()
  const materialExports = useMemo(() => {
    const completedProjects = filtered.filter(p => p.status === 'completed' || p.status === 'archived')
    return completedProjects.flatMap(p => p.materials.map(m => ({
      materialName: m.materialName,
      grade: m.grade || '-',
      quantity: m.quantity,
      unit: m.weightUnit,
      customer: p.customerName || '-',
      currency: m.currency,
    })))
  }, [filtered])

  return (
    <div className="card overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50/80">
            <th className="text-start px-4 py-3 font-semibold text-gray-700">{t('Material', 'المادة')}</th>
            <th className="text-start px-4 py-3 font-semibold text-gray-700">{t('Grade', 'الدرجة')}</th>
            <th className="text-start px-4 py-3 font-semibold text-gray-700">{t('Quantity', 'الكمية')}</th>
            <th className="text-start px-4 py-3 font-semibold text-gray-700">{t('Customer', 'العميل')}</th>
          </tr>
        </thead>
        <tbody>
          {materialExports.map((m, i) => (
            <tr key={i} className="border-b border-gray-100 table-row-hover">
              <td className="px-4 py-3 font-medium">{m.materialName}</td>
              <td className="px-4 py-3 text-gray-600">{m.grade}</td>
              <td className="px-4 py-3">{m.quantity} {m.unit}</td>
              <td className="px-4 py-3 text-gray-600">{m.customer}</td>
            </tr>
          ))}
          {materialExports.length === 0 && (
            <EmptyRow colSpan={4} message={t('No material export history found.', 'لا يوجد سجل تصدير مواد.')} />
          )}
        </tbody>
      </table>
    </div>
  )
}

// ─── Report: Audit ─────────────────────────────────────
function AuditReport({ auditLog }: { auditLog: typeof activityLog }) {
  const { t } = useLanguage()

  return (
    <div className="card overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50/80">
            <th className="text-start px-4 py-3 font-semibold text-gray-700">{t('Timestamp', 'الوقت')}</th>
            <th className="text-start px-4 py-3 font-semibold text-gray-700">{t('User', 'المستخدم')}</th>
            <th className="text-start px-4 py-3 font-semibold text-gray-700">{t('Action', 'الإجراء')}</th>
            <th className="text-start px-4 py-3 font-semibold text-gray-700">{t('Entity', 'الكيان')}</th>
            <th className="text-start px-4 py-3 font-semibold text-gray-700">{t('Reference', 'المرجع')}</th>
          </tr>
        </thead>
        <tbody>
          {auditLog.map(entry => (
            <tr key={entry.id} className="border-b border-gray-100 table-row-hover">
              <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{new Date(entry.timestamp).toLocaleString()}</td>
              <td className="px-4 py-3 font-medium">{entry.userName}</td>
              <td className="px-4 py-3">
                <span className={`status-badge ${
                  entry.action === 'CREATE' ? 'bg-green-100 text-green-800' :
                  entry.action === 'EDIT' ? 'bg-blue-100 text-blue-800' :
                  entry.action === 'DELETE' || entry.action === 'MOVE_TO_TRASH' ? 'bg-red-100 text-red-800' :
                  entry.action === 'ARCHIVE' ? 'bg-gray-100 text-gray-800' :
                  'bg-purple-100 text-purple-800'
                }`}>
                  {entry.action}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-600">{entry.entityType}</td>
              <td className="px-4 py-3 text-gray-500">{entry.entityRef || entry.entityId}</td>
            </tr>
          ))}
          {auditLog.length === 0 && (
            <EmptyRow colSpan={5} message={t('No audit entries match the selected filters.', 'لا توجد سجلات تدقيق مطابقة للمرشّحات المحددة.')} />
          )}
        </tbody>
      </table>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────
export default function ReportsPage() {
  const { t } = useLanguage()
  const [activeReport, setActiveReport] = useState('by-status')
  const [filters, setFilters] = useState<ReportFiltersState>(defaultFilters)

  // Apply common WorkItem filters to projects
  const filteredProjects = useMemo(() => filterWorkItems(projects, filters), [filters])
  // Apply common WorkItem filters to tasks, with overdue constraint
  const filteredTasks = useMemo(() => filterWorkItems(tasks, filters), [filters])
  const filteredOverdueTasks = useMemo(() =>
    filteredTasks.filter(task => task.status === 'in_progress' && task.createdAt < '2024-11-15'),
    [filteredTasks]
  )
  // Filter audit log by company + date range
  const filteredAuditLog = useMemo(() => {
    return activityLog.filter(entry => {
      if (filters.companyId && entry.companyId !== filters.companyId) return false
      if (filters.dateFrom && entry.timestamp.substring(0, 10) < filters.dateFrom) return false
      if (filters.dateTo && entry.timestamp.substring(0, 10) > filters.dateTo) return false
      return true
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }, [filters])

  const reportTitle = reports.find(r => r.id === activeReport)

  return (
    <div className="h-full flex overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0 border-r border-gray-200 bg-white overflow-y-auto">
        <div className="px-4 pt-5 pb-3">
          <h1 className="text-lg font-bold text-gray-900">{t('Reports', 'التقارير')}</h1>
        </div>
        <nav className="px-2 pb-4">
          {reports.map(report => (
            <button
              key={report.id}
              onClick={() => setActiveReport(report.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-start transition-colors mb-0.5 ${
                activeReport === report.id
                  ? 'bg-brand-50 text-brand-700 font-semibold'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              {report.icon}
              <span>{t(report.name, report.nameAr)}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <h2 className="text-xl font-bold text-gray-900 mb-1">
          {t(reportTitle?.name || '', reportTitle?.nameAr || '')}
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          {t('Data for current company', 'بيانات الشركة الحالية')}
        </p>

        {/* Filters + Actions rendered once */}
        <ReportFilterBar filters={filters} onChange={setFilters} />
        <ReportActions />

        {/* Active report */}
        {activeReport === 'by-status' && <ProjectsByStatusReport filtered={filteredProjects} />}
        {activeReport === 'by-date' && <ProjectsByDateReport filtered={filteredProjects} />}
        {activeReport === 'by-company' && <ProjectsByCompanyReport filtered={filteredProjects} />}
        {activeReport === 'by-customer' && <ProjectsByCustomerReport filtered={filteredProjects} />}
        {activeReport === 'documents-register' && <DocumentsRegisterReport filtered={filteredProjects} />}
        {activeReport === 'tasks' && <TasksReport filtered={filteredTasks} />}
        {activeReport === 'overdue-tasks' && <OverdueTasksReport filtered={filteredOverdueTasks} />}
        {activeReport === 'user-activity' && <UserActivityReport filtered={filteredProjects} />}
        {activeReport === 'customer-export-history' && <CustomerExportHistoryReport filtered={filteredProjects} />}
        {activeReport === 'material-export-history' && <MaterialExportHistoryReport filtered={filteredProjects} />}
        {activeReport === 'audit' && <AuditReport auditLog={filteredAuditLog} />}
      </div>
    </div>
  )
}
