import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
  MoreVertical,
  Pencil,
  Trash2,
  Loader2,
} from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import { useCompany } from '../contexts/CompanyContext'
import { useWorkItems, useCustomers } from '../hooks/useData'
import { getDataAccess } from '../lib/data'
import type { WorkItem } from '../lib/data'
import ProjectFormModal from '../components/projects/ProjectFormModal'
import Pagination from '../components/common/Pagination'
import ConfirmModal from '../components/common/ConfirmModal'
import type { WorkItemStatus } from '../types'

const STATUS_OPTIONS: { value: WorkItemStatus; label: string; colorClass: string }[] = [
  { value: 'in_progress', label: 'In Progress', colorClass: 'bg-blue-50 text-blue-700' },
  { value: 'completed', label: 'Completed', colorClass: 'bg-green-50 text-green-700' },
  { value: 'cancelled', label: 'Cancelled', colorClass: 'bg-red-50 text-red-700' },
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
  const navigate = useNavigate()

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatuses, setSelectedStatuses] = useState<WorkItemStatus[]>([])
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('')
  const [showStatusFilter, setShowStatusFilter] = useState(false)
  const [archivedExpanded, setArchivedExpanded] = useState(false)
  const [showProjectForm, setShowProjectForm] = useState(false)
  const [page, setPage] = useState(1)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [archiveConfirmId, setArchiveConfirmId] = useState<string | null>(null)
  const [trashConfirmId, setTrashConfirmId] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const PAGE_SIZE = 10

  // ── Real data from Supabase ──
  const { data: projectsData, loading, refetch } = useWorkItems(currentCompany.id, 'project')
  const { data: customersData } = useCustomers(currentCompany.id)
  const rawProjects = projectsData ?? []
  const rawCustomers = customersData ?? []

  // Cast status to WorkItemStatus for downstream type safety
  const projects: (WorkItem & { status: WorkItemStatus })[] = useMemo(
    () => rawProjects.map((p) => ({ ...p, status: p.status as WorkItemStatus })),
    [rawProjects]
  )

  // Filter logic
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (p.status === 'archived') return false // archived shown separately
      if (selectedStatuses.length > 0 && !selectedStatuses.includes(p.status)) return false
      if (selectedCustomerId && p.customer_id !== selectedCustomerId) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        return (
          p.name.toLowerCase().includes(q) ||
          (p.customer_name || '').toLowerCase().includes(q) ||
          (p.destination_country || '').toLowerCase().includes(q) ||
          (p.destination_city || '').toLowerCase().includes(q)
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
          (p.customer_name || '').toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [projects, searchQuery])

  const pinnedProjects = filteredProjects.filter((p) => p.pinned)
  const unpinnedProjects = filteredProjects.filter((p) => !p.pinned)

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

  // ── Pagination ──
  const totalPages = Math.max(1, Math.ceil(unpinnedProjects.length / PAGE_SIZE))
  const paginatedProjects = unpinnedProjects.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1) }, [searchQuery, selectedStatuses, selectedCustomerId])

  // ── Click outside to close More menu ──
  const handleMenuClickOutside = useCallback((e: MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpenMenuId(null)
  }, [])

  useEffect(() => {
    document.addEventListener('mousedown', handleMenuClickOutside)
    return () => document.removeEventListener('mousedown', handleMenuClickOutside)
  }, [handleMenuClickOutside])

  // ── Row actions (Supabase mutations) ──
  const handleArchive = async (id: string) => {
    try {
      const da = getDataAccess()
      await da.updateWorkItem(id, { status: 'archived', archived_at: new Date().toISOString() })
      refetch()
    } catch (err) {
      console.error('Failed to archive project:', err)
    }
    setArchiveConfirmId(null)
    setOpenMenuId(null)
  }

  const handleTrash = async (id: string) => {
    try {
      const da = getDataAccess()
      await da.deleteWorkItem(id)
      refetch()
    } catch (err) {
      console.error('Failed to trash project:', err)
    }
    setTrashConfirmId(null)
    setOpenMenuId(null)
  }

  const handleTogglePin = async (id: string, currentlyPinned: boolean) => {
    try {
      const da = getDataAccess()
      await da.updateWorkItem(id, { pinned: !currentlyPinned })
      refetch()
    } catch (err) {
      console.error('Failed to toggle pin:', err)
    }
  }

  const handleReopen = async (id: string) => {
    try {
      const da = getDataAccess()
      await da.updateWorkItem(id, { status: 'in_progress', archived_at: null })
      refetch()
    } catch (err) {
      console.error('Failed to reopen project:', err)
    }
  }

  const handleCreateProject = async (data: Record<string, unknown>) => {
    try {
      const da = getDataAccess()
      await da.createWorkItem({
        type: 'project',
        name: (data.name as string) || 'New Project',
        customer_id: (data.customerId as string) || null,
        status: 'in_progress',
        pinned: false,
        destination_country: (data.destinationCountry as string) || null,
        destination_city: (data.destinationCity as string) || null,
        currency: (data.currency as string) || null,
        incoterm: (data.incoterm as string) || null,
        payment_terms: (data.paymentTerms as string) || null,
        delivery_terms: (data.deliveryTerms as string) || null,
        port_of_loading: (data.portOfLoading as string) || null,
        port_of_discharge: (data.portOfDischarge as string) || null,
        vessel_name: (data.vesselName as string) || null,
        voyage_number: (data.voyageNumber as string) || null,
        container_number: (data.containerNumber as string) || null,
      }, currentCompany.id)
      refetch()
    } catch (err) {
      console.error('Failed to create project:', err)
    }
    setShowProjectForm(false)
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
            {loading && projects.length === 0 ? (
              <span className="inline-flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                {t('Loading...', 'جاري التحميل...')}
              </span>
            ) : (
              t(
                `${projects.length} total projects`,
                `${projects.length} مشروع إجمالي`
              )
            )}
          </p>
        </div>
        <button onClick={() => setShowProjectForm(true)} className="btn-primary">
          <Plus className="w-4 h-4 me-1.5" />
          {t('New Project', 'مشروع جديد')}
        </button>
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
              <Filter className="w-4 h-4 me-1.5" />
              {t('Status', 'الحالة')}
              {selectedStatuses.length > 0 && (
                <span className="ms-1.5 bg-brand-700 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {selectedStatuses.length}
                </span>
              )}
            </button>
            {showStatusFilter && (
              <div className="absolute top-full start-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-20 p-2">
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
            {rawCustomers.map((c) => (
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
                  <X className="w-3 h-3 ms-1" />
                </span>
              )
            })}
            {selectedCustomerId && (
              <span className="status-badge bg-purple-100 text-purple-700 cursor-pointer" onClick={() => setSelectedCustomerId('')}>
                {rawCustomers.find((c) => c.id === selectedCustomerId)?.name}
                <X className="w-3 h-3 ms-1" />
              </span>
            )}
            <button className="text-xs text-brand-600 hover:text-brand-800 ms-2" onClick={clearFilters}>
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

      {/* Loading state */}
      {loading && projects.length === 0 && (
        <div className="card p-12 text-center">
          <Loader2 className="w-8 h-8 text-brand-400 mx-auto mb-3 animate-spin" />
          <p className="text-sm text-gray-500">{t('Loading projects...', 'جاري تحميل المشاريع...')}</p>
        </div>
      )}

      {/* Projects Table */}
      {!loading || projects.length > 0 ? (
        <div className="card overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-brand-900">
              {t('All Projects', 'جميع المشاريع')}
              <span className="ms-2 text-gray-400 font-normal">({filteredProjects.length})</span>
            </h2>
          </div>
          {filteredProjects.length === 0 && archivedProjects.length === 0 ? (
            <div className="empty-state">
              <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400">{t('No projects found', 'لم يتم العثور على مشاريع')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-sand-50/50">
                    <th className="text-start text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">
                      {t('Project', 'المشروع')}
                    </th>
                    <th className="text-start text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">
                      {t('Customer', 'العميل')}
                    </th>
                    <th className="text-start text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">
                      {t('Destination', 'الوجهة')}
                    </th>
                    <th className="text-start text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">
                      {t('Status', 'الحالة')}
                    </th>
                    <th className="text-start text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3 hidden lg:table-cell">
                      {t('Date', 'التاريخ')}
                    </th>
                    <th className="w-10 px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {paginatedProjects.map((project) => {
                    const statusOpt = getStatusBadge(project.status)
                    return (
                      <tr
                        key={project.id}
                        className="table-row-hover"
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
                          {project.customer_name || '—'}
                        </td>
                        <td className="px-5 py-3.5">
                          {project.destination_country ? (
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <MapPin className="w-3.5 h-3.5 text-gray-400" />
                              {project.destination_city
                                ? `${project.destination_city}, ${project.destination_country}`
                                : project.destination_country}
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
                        <td className="px-5 py-3.5 hidden lg:table-cell">
                          <div className="flex items-center gap-1 text-xs text-gray-400">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(project.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => handleTogglePin(project.id, project.pinned)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-amber-500" title={project.pinned ? t('Unpin', 'إلغاء التثبيت') : t('Pin', 'تثبيت')}>
                              <Pin className={`w-4 h-4 ${project.pinned ? 'fill-amber-400 text-amber-500' : ''}`} />
                            </button>
                            <Link to={`/projects/${project.id}`} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-brand-600 transition-colors" title={t('View', 'عرض')}>
                              <ArrowRight className="w-4 h-4" />
                            </Link>
                            {/* More Menu */}
                            <div ref={openMenuId === project.id ? menuRef : undefined} className="relative">
                              <button
                                onClick={() => setOpenMenuId(openMenuId === project.id ? null : project.id)}
                                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
                                title={t('More', 'المزيد')}
                                aria-label={t('More actions', 'إجراءات إضافية')}
                                aria-expanded={openMenuId === project.id}
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>
                              {openMenuId === project.id && (
                                <div className="absolute top-full end-0 mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-30 py-1">
                                  <button
                                    onClick={() => { setOpenMenuId(null); navigate(`/projects/${project.id}`) }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                    {t('Edit', 'تعديل')}
                                  </button>
                                  <button
                                    onClick={() => { setArchiveConfirmId(project.id); setOpenMenuId(null) }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                  >
                                    <Archive className="w-3.5 h-3.5" />
                                    {t('Archive', 'أرشفة')}
                                  </button>
                                  <button
                                    onClick={() => { setTrashConfirmId(project.id); setOpenMenuId(null) }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    {t('Move to Trash', 'نقل إلى سلة المهملات')}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
          {/* Pagination */}
          {filteredProjects.length > 0 && (
            <div className="px-5 py-3 border-t border-gray-100">
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          )}
        </div>
      ) : null}
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
                    <th className="text-start text-xs font-medium text-gray-400 uppercase tracking-wider px-5 py-2.5">
                      {t('Project', 'المشروع')}
                    </th>
                    <th className="text-start text-xs font-medium text-gray-400 uppercase tracking-wider px-5 py-2.5">
                      {t('Customer', 'العميل')}
                    </th>
                    <th className="text-start text-xs font-medium text-gray-400 uppercase tracking-wider px-5 py-2.5">
                      {t('Destination', 'الوجهة')}
                    </th>
                    <th className="text-start text-xs font-medium text-gray-400 uppercase tracking-wider px-5 py-2.5 hidden lg:table-cell">
                      {t('Date', 'التاريخ')}
                    </th>
                    <th className="w-10 px-5 py-2.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {archivedProjects.map((project) => (
                    <tr
                      key={project.id}
                      className="table-row-hover opacity-70"
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
                        {project.customer_name || '—'}
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-500">
                        {project.destination_country || '—'}
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-400 hidden lg:table-cell">
                        {new Date(project.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleReopen(project.id)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-green-600" title={t('Reopen', 'إعادة فتح')}>
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
      // Map camelCase form data (from ProjectFormModal) to snake_case Supabase fields
      handleCreateProject(data as unknown as Record<string, unknown>)
    }} mode="project" />

    {/* Archive Confirm */}
    <ConfirmModal
      open={!!archiveConfirmId}
      onClose={() => setArchiveConfirmId(null)}
      onConfirm={() => archiveConfirmId && handleArchive(archiveConfirmId)}
      title={t('Archive Project', 'أرشفة المشروع')}
      message={t('Are you sure you want to archive this project? It will be moved to the Archived section.', 'هل أنت متأكد من أرشفة هذا المشروع؟ سيتم نقله إلى قسم المؤرشفة.')}
      confirmLabel={t('Archive', 'أرشفة')}
      cancelLabel={t('Cancel', 'إلغاء')}
      variant="warning"
    />

    {/* Trash Confirm */}
    <ConfirmModal
      open={!!trashConfirmId}
      onClose={() => setTrashConfirmId(null)}
      onConfirm={() => trashConfirmId && handleTrash(trashConfirmId)}
      title={t('Move to Trash', 'نقل إلى سلة المهملات')}
      message={t('Are you sure you want to move this project to trash?', 'هل أنت متأكد من نقل هذا المشروع إلى سلة المهملات؟')}
      details={t('This action can be undone from the Trash module.', 'يمكن التراجع عن هذا الإجراء من وحدة سلة المهملات.')}
      confirmLabel={t('Move to Trash', 'نقل إلى سلة المهملات')}
      cancelLabel={t('Cancel', 'إلغاء')}
      variant="danger"
    />
    </>
  )
}

/* ── Project Card ────────────────────────────── */
function ProjectCard({ project, t }: { project: WorkItem & { status: WorkItemStatus }; t: (en: string, ar: string) => string }) {
  const statusOpt = getStatusBadge(project.status)

  return (
    <Link to={`/projects/${project.id}`} className="card p-4 hover:border-gray-300 transition-colors group">
      <div className="flex items-start justify-between mb-2">
        <span className={`status-badge ${statusOpt.colorClass}`}>
          {t(
            statusOpt.label,
            statusOpt.label === 'In Progress' ? 'قيد التنفيذ' : statusOpt.label === 'Completed' ? 'مكتملة' : statusOpt.label
          )}
        </span>
        {project.pinned && <Pin className="w-3.5 h-3.5 text-amber-500" />}
      </div>
      <h3 className="text-sm font-semibold text-brand-900 group-hover:text-brand-600 transition-colors line-clamp-2">
        {project.name}
      </h3>
      <p className="text-xs text-gray-500 mt-1">
        {project.customer_name || t('No customer', 'بدون عميل')}
      </p>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <MapPin className="w-3 h-3" />
          {project.destination_country || '—'}
        </div>
        {project.currency && (
          <span className="text-xs font-semibold text-brand-900">
            {project.currency}
          </span>
        )}
      </div>
    </Link>
  )
}
