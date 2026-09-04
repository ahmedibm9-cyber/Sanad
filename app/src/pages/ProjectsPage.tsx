import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Search,
  Plus,
  Pin,
  ChevronDown,
  ChevronUp,
  MapPin,
  Calendar,
  ArrowRight,
  Filter,
  X,
  FolderOpen,
  Archive,
  RotateCcw,
} from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import { useCompany } from '../contexts/CompanyContext'
import { getProjectsByCompany, getCustomersByCompany } from '../data/mockData'
import ProjectFormModal from '../components/projects/ProjectFormModal'
import type { WorkItemStatus, WorkItem } from '../types'

const STATUS_OPTIONS: { value: WorkItemStatus; label: string; colorClass: string }[] = [
  { value: 'in_progress', label: 'In Progress', colorClass: 'bg-blue-100 text-blue-700' },
  { value: 'completed', label: 'Completed', colorClass: 'bg-green-100 text-green-700' },
  { value: 'cancelled', label: 'Cancelled', colorClass: 'bg-red-100 text-red-700' },
  { value: 'archived', label: 'Archived', colorClass: 'bg-gray-100 text-gray-600' },
]

function getStatusBadge(status: WorkItemStatus) {
  const opt = STATUS_OPTIONS.find((s) => s.value === status)
  return opt || STATUS_OPTIONS[0]
}

function formatCurrency(amount: number, currency: string) {
  return `${amount.toLocaleString()} ${currency}`
}

export default function ProjectsPage() {
  const { t } = useLanguage()
  const { currentCompany } = useCompany()

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatuses, setSelectedStatuses] = useState<WorkItemStatus[]>([])
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('')
  const [showStatusFilter, setShowStatusFilter] = useState(false)
  const [archivedExpanded, setArchivedExpanded] = useState(false)
  const [showProjectForm, setShowProjectForm] = useState(false)
  const [projects, setProjects] = useState<WorkItem[]>(() => getProjectsByCompany(currentCompany.id))
  const customers = getCustomersByCompany(currentCompany.id)

  // Filter logic
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (p.status === 'archived') return false // archived shown separately
      if (selectedStatuses.length > 0 && !selectedStatuses.includes(p.status)) return false
      if (selectedCustomerId && p.customerId !== selectedCustomerId) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        return (
          p.name.toLowerCase().includes(q) ||
          (p.customerName || '').toLowerCase().includes(q) ||
          (p.destinationCountry || '').toLowerCase().includes(q) ||
          (p.destinationCity || '').toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [projects, searchQuery, selectedStatuses, selectedCustomerId])

  const archivedProjects = useMemo(() => {
    return projects.filter((p) => {
      if (p.status !== 'archived') return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        return (
          p.name.toLowerCase().includes(q) ||
          (p.customerName || '').toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [projects, searchQuery])

  const pinnedProjects = filteredProjects.filter((p) => p.isPinned)
  const unpinnedProjects = filteredProjects.filter((p) => !p.isPinned)

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

  return (
    <>
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-900">
            {t('Projects', 'المشاريع')}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {t(
              `${projects.length} total projects`,
              `${projects.length} مشروع إجمالي`
            )}
          </p>
        </div>
        <button onClick={() => setShowProjectForm(true)} className="btn-primary">
          <Plus className="w-4 h-4 mr-1.5" />
          {t('New Project', 'مشروع جديد')}
        </button>
      </div>

      {/* Search & Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('Search projects...', 'بحث في المشاريع...')}
              className="input-field pl-10"
            />
          </div>

          {/* Status Filter Button */}
          <div className="relative">
            <button
              className="btn-secondary relative"
              onClick={() => setShowStatusFilter(!showStatusFilter)}
            >
              <Filter className="w-4 h-4 mr-1.5" />
              {t('Status', 'الحالة')}
              {selectedStatuses.length > 0 && (
                <span className="ml-1.5 bg-brand-700 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {selectedStatuses.length}
                </span>
              )}
            </button>
            {showStatusFilter && (
              <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg z-20 p-2">
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
                      {t(opt.label, opt.label === 'In Progress' ? 'قيد التنفيذ' : opt.label === 'Completed' ? 'مكتملة' : opt.label === 'Cancelled' ? 'ملغاة' : 'مؤرشفة')}
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
                  {opt?.label}
                  <X className="w-3 h-3 ml-1" />
                </span>
              )
            })}
            {selectedCustomerId && (
              <span className="status-badge bg-purple-100 text-purple-700 cursor-pointer" onClick={() => setSelectedCustomerId('')}>
                {customers.find((c) => c.id === selectedCustomerId)?.name}
                <X className="w-3 h-3 ml-1" />
              </span>
            )}
            <button className="text-xs text-brand-600 hover:text-brand-800 ml-2" onClick={clearFilters}>
              {t('Clear all', 'مسح الكل')}
            </button>
          </div>
        )}
      </div>

      {/* Pinned Projects */}
      {pinnedProjects.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Pin className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-semibold text-brand-900 uppercase tracking-wide">
              {t('Pinned', 'المثبّتة')}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {pinnedProjects.map((project) => (
              <ProjectCard key={project.id} project={project} t={t} />
            ))}
          </div>
        </div>
      )}

      {/* Projects Table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-brand-900">
            {t('All Projects', 'جميع المشاريع')}
            <span className="ml-2 text-gray-400 font-normal">({filteredProjects.length})</span>
          </h2>
        </div>
        {filteredProjects.length === 0 && archivedProjects.length === 0 ? (
          <div className="py-16 text-center">
            <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400">{t('No projects found', 'لم يتم العثور على مشاريع')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-sand-50/50">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">
                    {t('Project', 'المشروع')}
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">
                    {t('Customer', 'العميل')}
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">
                    {t('Destination', 'الوجهة')}
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">
                    {t('Status', 'الحالة')}
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">
                    {t('Value', 'القيمة')}
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">
                    {t('Date', 'التاريخ')}
                  </th>
                  <th className="w-10 px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {unpinnedProjects.map((project) => {
                  const statusOpt = getStatusBadge(project.status)
                  const totalValue = project.materials.reduce(
                    (s, m) => s + m.quantity * m.unitPrice,
                    0
                  )
                  return (
                    <tr
                      key={project.id}
                      className="hover:bg-sand-50/50 transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/projects/${project.id}`}
                            className="text-sm font-medium text-brand-900 hover:text-brand-600 transition-colors"
                          >
                            {project.name}
                          </Link>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-600">
                        {project.customerName || '—'}
                      </td>
                      <td className="px-5 py-3.5">
                        {project.destinationCountry ? (
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <MapPin className="w-3.5 h-3.5 text-gray-400" />
                            {project.destinationCity
                              ? `${project.destinationCity}, ${project.destinationCountry}`
                              : project.destinationCountry}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`status-badge ${statusOpt.colorClass}`}>
                          {t(
                            statusOpt.label,
                            statusOpt.label === 'In Progress'
                              ? 'قيد التنفيذ'
                              : statusOpt.label === 'Completed'
                              ? 'مكتملة'
                              : statusOpt.label === 'Cancelled'
                              ? 'ملغاة'
                              : 'مؤرشفة'
                          )}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm font-medium text-brand-900">
                        {totalValue > 0
                          ? formatCurrency(totalValue, project.currency || 'SAR')
                          : '—'}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(project.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => setProjects(prev => prev.map(p => p.id === project.id ? { ...p, isPinned: !p.isPinned } : p))} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-amber-500" title={project.isPinned ? t('Unpin', 'إلغاء التثبيت') : t('Pin', 'تثبيت')}>
                            <Pin className={`w-4 h-4 ${project.isPinned ? 'fill-amber-400 text-amber-500' : ''}`} />
                          </button>
                          <Link to={`/projects/${project.id}`} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-brand-600 transition-colors" title={t('View', 'عرض')}>
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

      {/* Archived Section (Collapsible) */}
      {archivedProjects.length > 0 && (
        <div className="card overflow-hidden">
          <button
            className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-sand-50/50 transition-colors"
            onClick={() => setArchivedExpanded(!archivedExpanded)}
          >
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-gray-600">
                {t('Archived Projects', 'المشاريع المؤرشفة')}
              </h2>
              <span className="status-badge bg-gray-100 text-gray-600">
                {archivedProjects.length}
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
                    <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-5 py-2.5">
                      {t('Project', 'المشروع')}
                    </th>
                    <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-5 py-2.5">
                      {t('Customer', 'العميل')}
                    </th>
                    <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-5 py-2.5">
                      {t('Destination', 'الوجهة')}
                    </th>
                    <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-5 py-2.5">
                      {t('Date', 'التاريخ')}
                    </th>
                    <th className="w-10 px-5 py-2.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {archivedProjects.map((project) => (
                    <tr
                      key={project.id}
                      className="hover:bg-sand-50/30 transition-colors opacity-70"
                    >
                      <td className="px-5 py-3">
                        <Link
                          to={`/projects/${project.id}`}
                          className="text-sm font-medium text-gray-600 hover:text-brand-600 transition-colors"
                        >
                          {project.name}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-500">
                        {project.customerName || '—'}
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-500">
                        {project.destinationCountry || '—'}
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-400">
                        {new Date(project.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => setProjects(prev => prev.map(p => p.id === project.id ? { ...p, status: 'in_progress' as WorkItemStatus } : p))} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-green-600" title={t('Reopen', 'إعادة فتح')}>
                            <RotateCcw className="w-4 h-4" />
                          </button>
                          <Link to={`/projects/${project.id}`} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-brand-600 transition-colors">
                            <ArrowRight className="w-4 h-4" />
                          </Link>
                        </div>
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
    <ProjectFormModal open={showProjectForm} onClose={() => setShowProjectForm(false)} onSave={(data) => {
      const newProj: WorkItem = {
        id: `proj-new-${Date.now()}`, type: 'project', companyId: currentCompany.id,
        name: data.name || 'New Project', customerId: data.customerId, customerName: data.customerName,
        status: 'in_progress', materials: data.materials || [],
        destinationCountry: data.destinationCountry, destinationCity: data.destinationCity,
        currency: data.currency, incoterm: data.incoterm, paymentTerms: data.paymentTerms,
        documents: [], attachments: [], reportIssues: [], projectNotes: [],
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), createdBy: 'Mohamed Al-Hassan',
      }
      setProjects(prev => [newProj, ...prev])
      setShowProjectForm(false)
    }} mode="project" />
    </>
  )
}

/* ── Project Card ────────────────────────────── */
function ProjectCard({ project, t }: { project: WorkItem; t: (en: string, ar: string) => string }) {
  const statusOpt = getStatusBadge(project.status)
  const totalValue = project.materials.reduce(
    (s, m) => s + m.quantity * m.unitPrice,
    0
  )
  const totalQty = project.materials.reduce((s, m) => s + m.quantity, 0)

  return (
    <Link to={`/projects/${project.id}`} className="card p-4 hover:shadow-md transition-shadow group">
      <div className="flex items-start justify-between mb-2">
        <span className={`status-badge ${statusOpt.colorClass}`}>
          {t(
            statusOpt.label,
            statusOpt.label === 'In Progress' ? 'قيد التنفيذ' : statusOpt.label === 'Completed' ? 'مكتملة' : statusOpt.label
          )}
        </span>
        <Pin className="w-3.5 h-3.5 text-amber-500" />
      </div>
      <h3 className="text-sm font-semibold text-brand-900 group-hover:text-brand-600 transition-colors line-clamp-2">
        {project.name}
      </h3>
      <p className="text-xs text-gray-500 mt-1">
        {project.customerName || t('No customer', 'بدون عميل')}
      </p>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <MapPin className="w-3 h-3" />
          {project.destinationCountry || '—'}
        </div>
        {totalValue > 0 && (
          <span className="text-xs font-semibold text-brand-900">
            {formatCurrency(totalValue, project.currency || 'SAR')}
          </span>
        )}
      </div>
      {project.materials.length > 0 && (
        <div className="mt-2 text-xs text-gray-400">
          {totalQty} MT &middot; {project.materials.length} {t('materials', 'مواد')}
        </div>
      )}
    </Link>
  )
}
