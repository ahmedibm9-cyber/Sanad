import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Search,
  Plus,
  ChevronDown,
  ChevronUp,
  Calendar,
  ArrowRight,
  Filter,
  X,
  ArrowRightLeft,
  ClipboardList,
  Pin,
} from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import { useCompany } from '../contexts/CompanyContext'
import { useWorkItems, useCustomers, useCreateWorkItem, useUpdateWorkItem } from '../hooks/useData'
import ProjectFormModal from '../components/projects/ProjectFormModal'
import ConfirmModal from '../components/common/ConfirmModal'
import type { WorkItemStatus, WorkItem as FrontendWorkItem } from '../types'
import type { WorkItem as DataWorkItem } from '../lib/services/workItem'

const STATUS_OPTIONS: { value: WorkItemStatus; label: string; labelAr: string; colorClass: string }[] = [
  { value: 'in_progress', label: 'In Progress', labelAr: 'قيد التنفيذ', colorClass: 'bg-blue-50 text-blue-700' },
  { value: 'completed', label: 'Completed', labelAr: 'مكتملة', colorClass: 'bg-green-50 text-green-700' },
  { value: 'cancelled', label: 'Cancelled', labelAr: 'ملغاة', colorClass: 'bg-red-50 text-red-700' },
  { value: 'archived', label: 'Archived', labelAr: 'مؤرشفة', colorClass: 'bg-gray-100 text-gray-600' },
]

function getStatusBadge(status: string) {
  const opt = STATUS_OPTIONS.find((s) => s.value === status)
  return opt || STATUS_OPTIONS[0]
}

export default function TasksPage() {
  const { t } = useLanguage()
  const { currentCompany } = useCompany()

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatuses, setSelectedStatuses] = useState<WorkItemStatus[]>([])
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('')
  const [showStatusFilter, setShowStatusFilter] = useState(false)
  const [archivedExpanded, setArchivedExpanded] = useState(false)
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [convertingTask, setConvertingTask] = useState<DataWorkItem | null>(null)

  const { data: tasksData, loading, refetch } = useWorkItems(currentCompany.id, 'task')
  const { data: customersData } = useCustomers(currentCompany.id)
  const { create: createWorkItem, loading: creating } = useCreateWorkItem()
  const { update: updateWorkItem } = useUpdateWorkItem()

  const allTasks = tasksData || []
  const customers = customersData || []

  // Filter logic
  const filteredTasks = useMemo(() => {
    return allTasks.filter((p) => {
      if (p.status === 'archived') return false
      if (selectedStatuses.length > 0 && !selectedStatuses.includes(p.status as WorkItemStatus)) return false
      if (selectedCustomerId && p.customer_id !== selectedCustomerId) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        return (
          p.name.toLowerCase().includes(q) ||
          (p.customer_name || '').toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [allTasks, searchQuery, selectedStatuses, selectedCustomerId])

  const archivedTasks = useMemo(() => {
    return allTasks.filter((p) => {
      if (p.status !== 'archived') return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        return (
          p.name.toLowerCase().includes(q) ||
          (p.customer_name || '').toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [allTasks, searchQuery])

  const toggleStatus = (status: WorkItemStatus) => {
    setSelectedStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    )
  }

  const activeFilterCount =
    selectedStatuses.length + (selectedCustomerId ? 1 : 0)

  const clearFilters = () => {
    setSelectedStatuses([])
    setSelectedCustomerId('')
    setSearchQuery('')
  }

  async function handleTogglePin(task: DataWorkItem) {
    await updateWorkItem(task.id, { pinned: !task.pinned })
    refetch()
  }

  async function handleConvertToProject() {
    if (convertingTask) {
      await updateWorkItem(convertingTask.id, { type: 'project' } as Partial<DataWorkItem>)
      refetch()
      setConvertingTask(null)
    }
  }

  async function handleCreateTask(formData: Partial<FrontendWorkItem>) {
    await createWorkItem({
      type: 'task',
      name: formData.name || 'New Task',
      customer_id: formData.customerId || null,
      status: 'in_progress',
    }, currentCompany.id)
    refetch()
    setShowTaskForm(false)
  }

  return (
    <>
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-900">
            {t('Tasks', 'المهام')}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {t(
              `${allTasks.length} total tasks`,
              `${allTasks.length} مهمة إجمالية`
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { if (allTasks.length > 0) setConvertingTask(allTasks[0]) }} className="btn-secondary">
            <ArrowRightLeft className="w-4 h-4 ms-1.5" />
            {t('Convert to Project', 'تحويل إلى مشروع')}
          </button>
          <button onClick={() => setShowTaskForm(true)} className="btn-primary">
            <Plus className="w-4 h-4 ms-1.5" />
            {t('New Task', 'مهمة جديدة')}
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('Search tasks...', 'بحث في المهام...')}
              className="input-field ps-10"
            />
          </div>

          {/* Status Filter Button */}
          <div className="relative">
            <button
              className="btn-secondary relative"
              onClick={() => setShowStatusFilter(!showStatusFilter)}
            >
              <Filter className="w-4 h-4 ms-1.5" />
              {t('Status', 'الحالة')}
              {selectedStatuses.length > 0 && (
                <span className="ms-1.5 bg-brand-700 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {selectedStatuses.length}
                </span>
              )}
            </button>
            {showStatusFilter && (
              <div className="absolute top-full start-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-sm z-20 p-2">
                {STATUS_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-sand-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedStatuses.includes(opt.value)}
                      onChange={() => toggleStatus(opt.value)}
                      className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                    />
                    <span className={`status-badge ${opt.colorClass}`}>
                      {t(opt.label, opt.labelAr)}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Customer Filter */}
          <select
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            className="select-field sm:w-56"
          >
            <option value="">{t('All Customers', 'جميع العملاء')}</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Active Filters */}
        {activeFilterCount > 0 && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
            <span className="text-xs text-gray-400">
              {t('Active filters:', 'المرشحات النشطة:')}
            </span>
            {selectedStatuses.map((s) => {
              const opt = STATUS_OPTIONS.find((o) => o.value === s)
              return (
                <span
                  key={s}
                  className={`status-badge ${opt?.colorClass} cursor-pointer`}
                  onClick={() => toggleStatus(s)}
                >
                  {opt ? t(opt.label, opt.labelAr) : ''}
                  <X className="w-3 h-3 me-1" />
                </span>
              )
            })}
            {selectedCustomerId && (
              <span className="status-badge bg-purple-100 text-purple-700 cursor-pointer" onClick={() => setSelectedCustomerId('')}>
                {customers.find((c) => c.id === selectedCustomerId)?.name}
                <X className="w-3 h-3 me-1" />
              </span>
            )}
            <button className="text-xs text-brand-600 hover:text-brand-800 ms-2" onClick={clearFilters}>
              {t('Clear all', 'مسح الكل')}
            </button>
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="card p-8 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full mx-auto mb-3" />
          <p className="text-gray-400">{t('Loading tasks...', 'جاري تحميل المهام...')}</p>
        </div>
      )}

      {/* Tasks Table */}
      {!loading && (
        <div className="card overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-brand-900">
              {t('All Tasks', 'جميع المهام')}
              <span className="ms-2 text-gray-400 font-normal">({filteredTasks.length})</span>
            </h2>
          </div>
          {filteredTasks.length === 0 && archivedTasks.length === 0 ? (
            <div className="empty-state">
              <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400">{t('No tasks found', 'لم يتم العثور على مهام')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-sand-50/50">
                    <th className="text-start text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">
                      {t('Task', 'المهمة')}
                    </th>
                    <th className="text-start text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">
                      {t('Customer', 'العميل')}
                    </th>
                    <th className="text-start text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">
                      {t('Status', 'الحالة')}
                    </th>
                    <th className="text-start text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">
                      {t('Created by', 'أنشأه')}
                    </th>
                    <th className="text-start text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">
                      {t('Date', 'التاريخ')}
                    </th>
                    <th className="w-10 px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredTasks.map((task) => {
                    const statusOpt = getStatusBadge(task.status)
                    return (
                      <tr
                        key={task.id}
                        className="table-row-hover"
                      >
                        <td className="px-5 py-3.5">
                          <Link
                            to={`/tasks/${task.id}`}
                            className="text-sm font-medium text-brand-900 hover:text-brand-600 transition-colors"
                          >
                            {task.name}
                          </Link>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-gray-600">
                          {task.customer_name || '—'}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`status-badge ${statusOpt.colorClass}`}>
                            {t(statusOpt.label, statusOpt.labelAr)}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-gray-600">
                          {task.created_by || '—'}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1 text-xs text-gray-400">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(task.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => handleTogglePin(task)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-amber-500" title={task.pinned ? t('Unpin', 'إلغاء التثبيت') : t('Pin', 'تثبيت')} aria-label={task.pinned ? t('Unpin task', 'إلغاء تثبيت المهمة') : t('Pin task', 'تثبيت المهمة')}>
                              <Pin className={`w-4 h-4 ${task.pinned ? 'fill-amber-400 text-amber-500' : ''}`} />
                            </button>
                            <Link to={`/tasks/${task.id}`} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-brand-600 transition-colors">
                              <ArrowRight className="w-4 h-4" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Archived Section (Collapsible) */}
      {!loading && archivedTasks.length > 0 && (
        <div className="card overflow-hidden">
          <button
            className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-sand-50/50 transition-colors"
            onClick={() => setArchivedExpanded(!archivedExpanded)}
          >
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-gray-600">
                {t('Archived Tasks', 'المهام المؤرشفة')}
              </h2>
              <span className="status-badge bg-gray-100 text-gray-600">
                {archivedTasks.length}
              </span>
            </div>
            {archivedExpanded ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </button>
          {archivedExpanded && (
            <div className="border-t border-gray-100">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-sand-50/30">
                    <th className="text-start text-xs font-medium text-gray-400 uppercase tracking-wider px-5 py-2.5">
                      {t('Task', 'المهمة')}
                    </th>
                    <th className="text-start text-xs font-medium text-gray-400 uppercase tracking-wider px-5 py-2.5">
                      {t('Customer', 'العميل')}
                    </th>
                    <th className="text-start text-xs font-medium text-gray-400 uppercase tracking-wider px-5 py-2.5">
                      {t('Date', 'التاريخ')}
                    </th>
                    <th className="w-10 px-5 py-2.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {archivedTasks.map((task) => (
                    <tr
                      key={task.id}
                      className="table-row-hover opacity-70"
                    >
                      <td className="px-5 py-3">
                        <Link
                          to={`/tasks/${task.id}`}
                          className="text-sm font-medium text-gray-600 hover:text-brand-600 transition-colors"
                        >
                          {task.name}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-500">
                        {task.customer_name || '—'}
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-400">
                        {new Date(task.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-5 py-3">
                        <Link
                          to={`/tasks/${task.id}`}
                          className="text-gray-400 hover:text-brand-600 transition-colors"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
    <ProjectFormModal open={showTaskForm} onClose={() => setShowTaskForm(false)} onSave={handleCreateTask} mode="task" />
    <ConfirmModal open={!!convertingTask} onClose={() => setConvertingTask(null)} onConfirm={handleConvertToProject} title={t('Convert Task to Project', 'تحويل المهمة إلى مشروع')} message={t(`Convert "${convertingTask?.name}" from a Task to a Project?`, `تحويل "${convertingTask?.name}" من مهمة إلى مشروع؟`)} details={t('All data, documents, and attachments will be preserved.', 'جميع البيانات والمستندات والمرفقات ستبقى محفوظة.')} confirmLabel={t('Convert to Project', 'تحويل إلى مشروع')} cancelLabel={t('Cancel', 'إلغاء')} variant="info" />
    </>
  )
}
