import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Edit3,
  Printer,
  Download,
  Plus,
  FileText,
  Paperclip,
  AlertTriangle,
  MessageSquare,
  MapPin,
  Calendar,
  Ship,
  Anchor,
  Package,
  ExternalLink,
  Trash2,
  ChevronDown,
  Check,
  X,
} from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import { useCompany } from '../contexts/CompanyContext'
import { useApp } from '../contexts/AppContext'
import { getProjectsByCompany, getCustomersByCompany } from '../data/mockData'
import AttachmentUploadModal from '../components/common/AttachmentUploadModal'
import ConfirmModal from '../components/common/ConfirmModal'
import ProjectFormModal from '../components/projects/ProjectFormModal'
import type { WorkItemStatus, WorkItem, Document, ProjectNote, ReportIssue } from '../types'

const STATUS_OPTIONS: { value: WorkItemStatus; label: string; colorClass: string; labelAr: string }[] = [
  { value: 'in_progress', label: 'In Progress', labelAr: 'قيد التنفيذ', colorClass: 'bg-blue-50 text-blue-700' },
  { value: 'completed', label: 'Completed', labelAr: 'مكتملة', colorClass: 'bg-green-50 text-green-700' },
  { value: 'cancelled', label: 'Cancelled', labelAr: 'ملغاة', colorClass: 'bg-red-50 text-red-700' },
  { value: 'archived', label: 'Archived', labelAr: 'مؤرشفة', colorClass: 'bg-gray-100 text-gray-600' },
]

const DOC_TYPE_LABELS: Record<string, { en: string; ar: string }> = {
  QUOT: { en: 'Quotation', ar: 'عرض أسعار' },
  PINV: { en: 'Proforma Invoice', ar: 'فاتورة مبدئية' },
  TINV: { en: 'Tax Invoice', ar: 'فاتورة ضريبية' },
  CINV: { en: 'Commercial Invoice', ar: 'فاتورة تجارية' },
  PKL: { en: 'Packing List', ar: 'قائمة التعبئة' },
  DN: { en: 'Delivery Note', ar: 'إشعار التسليم' },
  BL: { en: 'Bill of Lading', ar: 'بوليصة الشحن' },
}

function getStatusBadge(status: WorkItemStatus) {
  const opt = STATUS_OPTIONS.find((s) => s.value === status)
  return opt || STATUS_OPTIONS[0]
}

type TabId = 'overview' | 'documents' | 'attachments' | 'issues' | 'notes'

const TABS: { id: TabId; label: string; labelAr: string; icon: typeof FileText }[] = [
  { id: 'overview', label: 'Overview', labelAr: 'نظرة عامة', icon: FileText },
  { id: 'documents', label: 'Documents', labelAr: 'المستندات', icon: FileText },
  { id: 'attachments', label: 'Attachments', labelAr: 'المرفقات', icon: Paperclip },
  { id: 'issues', label: 'Issues', labelAr: 'المشكلات', icon: AlertTriangle },
  { id: 'notes', label: 'Notes', labelAr: 'الملاحظات', icon: MessageSquare },
]

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useLanguage()
  const { currentCompany } = useCompany()
  const { currentUser } = useApp()

  const allProjects = getProjectsByCompany(currentCompany.id)
  const project = allProjects.find((p) => p.id === id)

  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [showInvoiceDropdown, setShowInvoiceDropdown] = useState(false)
  const [showAttachmentModal, setShowAttachmentModal] = useState(false)
  const [attachments, setAttachments] = useState(project?.attachments || [])
  const [projectNotes, setProjectNotes] = useState<ProjectNote[]>(project?.projectNotes || [])
  const [reportIssues, setReportIssues] = useState<ReportIssue[]>(project?.reportIssues || [])
  const [documents, setDocuments] = useState<Document[]>(project?.documents || [])
  const [newNote, setNewNote] = useState('')
  const [showNoteForm, setShowNoteForm] = useState(false)
  const [showIssueForm, setShowIssueForm] = useState(false)
  const [issueDesc, setIssueDesc] = useState('')
  const [issueSeverity, setIssueSeverity] = useState<ReportIssue['severity']>('medium')
  const [deleteAttachmentId, setDeleteAttachmentId] = useState<string | null>(null)
  const [showEditForm, setShowEditForm] = useState(false)
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [editingNoteContent, setEditingNoteContent] = useState('')

  const updateIssue = (issueId: string, field: string, value: string) => {
    setReportIssues(prev => prev.map(iss =>
      iss.id === issueId ? { ...iss, [field]: value } : iss
    ))
  }

  const startEditNote = (noteId: string, content: string) => {
    setEditingNoteId(noteId)
    setEditingNoteContent(content)
  }

  const saveEditNote = () => {
    if (editingNoteId && editingNoteContent.trim()) {
      setProjectNotes(prev => prev.map(n =>
        n.id === editingNoteId ? { ...n, content: editingNoteContent.trim() } : n
      ))
      setEditingNoteId(null)
      setEditingNoteContent('')
    }
  }

  const cancelEditNote = () => {
    setEditingNoteId(null)
    setEditingNoteContent('')
  }

  if (!project) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400 text-lg">{t('Project not found', 'المشروع غير موجود')}</p>
        <Link to="/projects" className="btn-primary mt-4 inline-flex">
          <ArrowLeft className="w-4 h-4 me-1.5" />
          {t('Back to Projects', 'العودة للمشاريع')}
        </Link>
      </div>
    )
  }

  const statusOpt = getStatusBadge(project.status)
  const totalValue = project.materials.reduce((s, m) => s + m.quantity * m.unitPrice, 0)

  return (
    <>
    <div className="space-y-6" onClick={() => setShowInvoiceDropdown(false)}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <button
            onClick={() => navigate('/projects')}
            className="mt-1 p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-brand-900">{project.name}</h1>
              <span className={`status-badge ${statusOpt.colorClass}`}>
                {t(statusOpt.label, statusOpt.labelAr)}
              </span>
              {project.isPinned && (
                <span className="text-xs text-amber-500 font-medium">
                  {t('📌 Pinned', '📌 مثبّت')}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {t('Created by', 'أنشأه')} {project.createdBy || '—'} &middot;{' '}
              {new Date(project.createdAt).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button className="btn-secondary" onClick={() => setShowEditForm(true)}>
            <Edit3 className="w-4 h-4 me-1.5" />
            {t('Edit', 'تعديل')}
          </button>
          <button className="btn-ghost" onClick={() => window.print()}>
            <Printer className="w-4 h-4" />
          </button>
          <button className="btn-ghost" onClick={() => alert(t('PDF download will be available in production.', 'سيتوفر تحميل PDF في الإنتاج.'))}>
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-0 -mb-px">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors
                  ${
                    isActive
                      ? 'border-brand-700 text-brand-700'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {t(tab.label, tab.labelAr)}
                {tab.id === 'documents' && (
                  <span className="text-xs bg-gray-100 text-gray-500 rounded-full px-1.5 py-0.5 ms-0.5">
                    {project.documents.length}
                  </span>
                )}
                {tab.id === 'attachments' && (
                  <span className="text-xs bg-gray-100 text-gray-500 rounded-full px-1.5 py-0.5 ms-0.5">
                    {project.attachments.length}
                  </span>
                )}
                {tab.id === 'issues' && (
                  <span className="text-xs bg-gray-100 text-gray-500 rounded-full px-1.5 py-0.5 ms-0.5">
                    {project.reportIssues.length}
                  </span>
                )}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Shipment Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipment Info Card */}
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-brand-900 mb-4 uppercase tracking-wide">
                {t('Shipment Details', 'تفاصيل الشحنة')}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <InfoField label={t('Customer', 'العميل')} value={project.customerName} />
                <InfoField label={t('Destination', 'الوجهة')} value={
                  project.destinationCity
                    ? `${project.destinationCity}, ${project.destinationCountry}`
                    : project.destinationCountry
                } icon={<MapPin className="w-3.5 h-3.5" />} />
                <InfoField label={t('Incoterm', 'الشروط التجارية')} value={project.incoterm} />
                <InfoField label={t('Port of Loading', 'ميناء التحميل')} value={project.portOfLoading} icon={<Anchor className="w-3.5 h-3.5" />} />
                <InfoField label={t('Port of Discharge', 'ميناء التفريغ')} value={project.portOfDischarge} icon={<Anchor className="w-3.5 h-3.5" />} />
                <InfoField label={t('Payment Terms', 'شروط الدفع')} value={project.paymentTerms} />
                <InfoField label={t('Currency', 'العملة')} value={project.currency} />
                {project.vesselName && (
                  <InfoField label={t('Vessel', 'السفينة')} value={project.vesselName} icon={<Ship className="w-3.5 h-3.5" />} />
                )}
                {project.voyageNumber && (
                  <InfoField label={t('Voyage #', 'رحلة #')} value={project.voyageNumber} />
                )}
                {project.containerNumber && (
                  <InfoField label={t('Container #', 'حاوية #')} value={project.containerNumber} icon={<Package className="w-3.5 h-3.5" />} />
                )}
              </div>
            </div>

            {/* Materials Table */}
            {project.materials.length > 0 && (
              <div className="card overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-brand-900 uppercase tracking-wide">
                    {t('Materials', 'المواد')}
                    <span className="ms-2 text-gray-400 font-normal normal-case">({project.materials.length})</span>
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100 bg-sand-50/50">
                        <th className="text-start text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-2.5">
                          {t('Material', 'المادة')}
                        </th>
                        <th className="text-start text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-2.5">
                          {t('Qty', 'الكمية')}
                        </th>
                        <th className="text-start text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-2.5">
                          {t('Unit Price', 'سعر الوحدة')}
                        </th>
                        <th className="text-start text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-2.5">
                          {t('Total', 'الإجمالي')}
                        </th>
                        <th className="text-start text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-2.5">
                          {t('Packing', 'التعبئة')}
                        </th>
                        <th className="text-start text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-2.5">
                          {t('Origin', 'المنشأ')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {project.materials.map((mat) => (
                        <tr key={mat.id} className="table-row-hover">
                          <td className="px-5 py-3">
                            <p className="text-sm font-medium text-brand-900">{mat.materialName}</p>
                            {mat.grade && <p className="text-xs text-gray-400">{mat.grade}</p>}
                          </td>
                          <td className="px-5 py-3 text-sm text-gray-600">
                            {mat.quantity} {mat.weightUnit}
                          </td>
                          <td className="px-5 py-3 text-sm text-gray-600">
                            {mat.unitPrice.toLocaleString()} {mat.currency}
                          </td>
                          <td className="px-5 py-3 text-sm font-medium text-brand-900">
                            {(mat.quantity * mat.unitPrice).toLocaleString()} {mat.currency}
                          </td>
                          <td className="px-5 py-3 text-sm text-gray-600">{mat.packing || '—'}</td>
                          <td className="px-5 py-3 text-sm text-gray-600">{mat.origin || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-sand-50/50 border-t border-gray-200">
                        <td className="px-5 py-3 text-sm font-semibold text-brand-900" colSpan={3}>
                          {t('Total Value', 'القيمة الإجمالية')}
                        </td>
                        <td className="px-5 py-3 text-sm font-bold text-brand-900">
                          {totalValue.toLocaleString()} {project.currency || 'SAR'}
                        </td>
                        <td colSpan={2} />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Right: Summary Sidebar */}
          <div className="space-y-4">
            {/* Quick Stats */}
            <div className="card p-4 space-y-3">
              <h3 className="text-sm font-semibold text-brand-900 uppercase tracking-wide">
                {t('Summary', 'ملخص')}
              </h3>
              <SummaryRow label={t('Documents', 'المستندات')} value={String(project.documents.length)} />
              <SummaryRow label={t('Attachments', 'المرفقات')} value={String(project.attachments.length)} />
              <SummaryRow label={t('Issues', 'المشكلات')} value={String(project.reportIssues.length)} />
              <SummaryRow label={t('Notes', 'الملاحظات')} value={String(project.projectNotes.length)} />
              <div className="pt-2 border-t border-gray-100">
                <SummaryRow label={t('Total Value', 'القيمة الإجمالية')} value={`${totalValue.toLocaleString()} ${project.currency || 'SAR'}`} highlight />
              </div>
            </div>

            {/* Customer Info */}
            {project.customerName && (
              <div className="card p-4">
                <h3 className="text-sm font-semibold text-brand-900 uppercase tracking-wide mb-3">
                  {t('Customer', 'العميل')}
                </h3>
                <p className="text-sm font-medium text-brand-900">{project.customerName}</p>
                {project.destinationCountry && (
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {project.destinationCity
                      ? `${project.destinationCity}, ${project.destinationCountry}`
                      : project.destinationCountry}
                  </p>
                )}
              </div>
            )}

            {/* Activity */}
            <div className="card p-4">
              <h3 className="text-sm font-semibold text-brand-900 uppercase tracking-wide mb-3">
                {t('Timeline', 'الجدول الزمني')}
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  {t('Created', 'أنشأ')}:{' '}
                  {new Date(project.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  {t('Updated', 'حُدّث')}:{' '}
                  {new Date(project.updatedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-brand-900 uppercase tracking-wide">
              {t('Documents', 'المستندات')} ({documents.length})
            </h3>
            <div className="relative">
              <button onClick={() => setShowInvoiceDropdown(!showInvoiceDropdown)} className="btn-primary">
                <Plus className="w-4 h-4 me-1.5" />
                {t('New Document', 'مستند جديد')}
                <ChevronDown className="w-3 h-3 ms-1.5" />
              </button>
              {showInvoiceDropdown && (
                <div className="absolute end-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-30 py-1">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase">{t('Invoice', 'الفاتورة')}</div>
                  {(['QUOT','PINV','TINV','CINV'] as const).map(type => (
                    <button key={type} onClick={() => { setShowInvoiceDropdown(false); navigate(`/documents/new/form?type=${type}&projectId=${project.id}`) }}
                      className="w-full text-start px-4 py-2.5 text-sm hover:bg-brand-50 flex items-center gap-3 transition-colors">
                      <span className="w-10 text-xs font-bold text-brand-600 bg-brand-50 rounded px-1.5 py-0.5 text-center">{type}</span>
                      <span className="text-gray-700">{t(DOC_TYPE_LABELS[type].en, DOC_TYPE_LABELS[type].ar)}</span>
                    </button>
                  ))}
                  <div className="border-t border-gray-100 my-1" />
                  <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase">{t('Other Documents', 'مستندات أخرى')}</div>
                  {(['PKL','DN','BL'] as const).map(type => (
                    <button key={type} onClick={() => { setShowInvoiceDropdown(false); navigate(`/documents/new/form?type=${type}&projectId=${project.id}`) }}
                      className="w-full text-start px-4 py-2.5 text-sm hover:bg-brand-50 flex items-center gap-3 transition-colors">
                      <span className="w-10 text-xs font-bold text-brand-600 bg-brand-50 rounded px-1.5 py-0.5 text-center">{type}</span>
                      <span className="text-gray-700">{t(DOC_TYPE_LABELS[type].en, DOC_TYPE_LABELS[type].ar)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          {documents.length === 0 ? (
            <div className="card empty-state">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400">{t('No documents yet', 'لا توجد مستندات بعد')}</p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-sand-50/50">
                    <th className="text-start text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">
                      {t('Number', 'الرقم')}
                    </th>
                    <th className="text-start text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">
                      {t('Type', 'النوع')}
                    </th>
                    <th className="text-start text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">
                      {t('Date', 'التاريخ')}
                    </th>
                    <th className="text-start text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">
                      {t('Status', 'الحالة')}
                    </th>
                    <th className="text-start text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">
                      {t('Prepared by', 'أعده')}
                    </th>
                    <th className="text-end text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">
                      {t('Actions', 'الإجراءات')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {documents.map((doc) => {
                    const typeLabel = DOC_TYPE_LABELS[doc.type]
                    return (
                      <tr key={doc.id} className="table-row-hover">
                        <td className="px-5 py-3.5">
                          <Link
                            to={`/documents/${doc.id}/preview`}
                            className="text-sm font-medium text-brand-700 hover:text-brand-900 transition-colors flex items-center gap-1.5"
                          >
                            {doc.number}
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-gray-600">
                          {typeLabel ? t(typeLabel.en, typeLabel.ar) : doc.type}
                        </td>
                        <td className="px-5 py-3.5 text-sm text-gray-600">
                          {new Date(doc.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`status-badge ${
                              doc.status === 'final'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {doc.status === 'final' ? t('Final', 'نهائي') : t('Draft', 'مسودة')}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-gray-600">
                          {doc.preparedBy || '—'}
                        </td>
                        <td className="px-5 py-3.5 text-end">
                          <div className="flex items-center justify-end gap-1">
                            <button className="btn-ghost p-1.5" title={t('Print', 'طباعة')} onClick={() => window.print()}>
                              <Printer className="w-4 h-4" />
                            </button>
                            <button className="btn-ghost p-1.5" title={t('Download', 'تحميل')} onClick={() => alert(t('Download will be available in production.', 'سيتوفر التحميل في الإنتاج.'))}>
                              <Download className="w-4 h-4" />
                            </button>
                            <button className="btn-ghost p-1.5" title={t('Edit', 'تعديل')} onClick={() => navigate(`/documents/${doc.id}/form?projectId=${project.id}`)}>
                              <Edit3 className="w-4 h-4" />
                            </button>
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

      {activeTab === 'attachments' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-brand-900 uppercase tracking-wide">
              {t('Attachments', 'المرفقات')} ({attachments.length})
            </h3>
            <button onClick={() => setShowAttachmentModal(true)} className="btn-primary">
              <Plus className="w-4 h-4 me-1.5" />
              {t('Upload', 'رفع')}
            </button>
          </div>
          {attachments.length === 0 ? (
            <div className="card empty-state">
              <Paperclip className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400">{t('No attachments', 'لا توجد مرفقات')}</p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-sand-50/50">
                    <th className="text-start text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">
                      {t('File Name', 'اسم الملف')}
                    </th>
                    <th className="text-start text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">
                      {t('Size', 'الحجم')}
                    </th>
                    <th className="text-start text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">
                      {t('Uploaded By', 'رفعه')}
                    </th>
                    <th className="text-start text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">
                      {t('Date', 'التاريخ')}
                    </th>
                    <th className="text-end text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">
                      {t('Actions', 'الإجراءات')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {attachments.map((att) => (
                    <tr key={att.id} className="table-row-hover">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <Paperclip className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium text-brand-900">{att.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-500">
                        {formatFileSize(att.size)}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-600">
                        {att.uploadedBy || '—'}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-600">
                        {new Date(att.uploadedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-5 py-3.5 text-end">
                        <div className="flex items-center justify-end gap-1">
                          <button className="btn-ghost p-1.5" title={t('Download', 'تحميل')} onClick={() => alert(t('Download will be available in production.', 'سيتوفر التحميل في الإنتاج.'))}>
                            <Download className="w-4 h-4" />
                          </button>
                          <button className="btn-ghost p-1.5" title={t('Delete', 'حذف')} onClick={() => setDeleteAttachmentId(att.id)}>
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
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

      {activeTab === 'issues' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-brand-900 uppercase tracking-wide">
              {t('Reported Issues', 'المشكلات المبلّغ عنها')} ({reportIssues.length})
            </h3>
            <button onClick={() => setShowIssueForm(!showIssueForm)} className="btn-primary">
              <Plus className="w-4 h-4 me-1.5" />
              {t('Report Issue', 'إبلاغ عن مشكلة')}
            </button>
          </div>
          {showIssueForm && (
            <div className="card p-4 space-y-3">
              <div>
                <label className="label-field">{t('Description', 'الوصف')} *</label>
                <textarea className="input-field" rows={3} value={issueDesc} onChange={e => setIssueDesc(e.target.value)} placeholder={t('Describe the issue...', 'صِف المشكلة...')} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-field">{t('Severity', 'الخطورة')}</label>
                  <select className="select-field" value={issueSeverity} onChange={e => setIssueSeverity(e.target.value as any)}>
                    <option value="low">{t('Low', 'منخفضة')}</option>
                    <option value="medium">{t('Medium', 'متوسطة')}</option>
                    <option value="high">{t('High', 'عالية')}</option>
                    <option value="critical">{t('Critical', 'حرجة')}</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowIssueForm(false)} className="btn-ghost">{t('Cancel', 'إلغاء')}</button>
                <button onClick={() => { if (issueDesc.trim()) { setReportIssues(prev => [{ id: `ri-${Date.now()}`, description: issueDesc, severity: issueSeverity, status: 'open', reporter: currentUser.name, createdAt: new Date().toISOString() }, ...prev]); setIssueDesc(''); setShowIssueForm(false) } }} className="btn-primary">{t('Submit', 'إرسال')}</button>
              </div>
            </div>
          )}
          {reportIssues.length === 0 ? (
            <div className="card empty-state">
              <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400">{t('No issues reported', 'لا توجد مشكلات مبلّغ عنها')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reportIssues.map((issue) => {
                return (
                  <div key={issue.id} className="card p-4">
                    <div className="flex items-start justify-between">
                      <p className="text-sm text-gray-700 flex-1">{issue.description}</p>
                    </div>
                    <div className="flex items-center gap-3 mt-3">
                      <div>
                        <label className="label-field text-xs">{t('Severity', 'الخطورة')}</label>
                        <select
                          className="select-field text-xs py-1 px-2"
                          value={issue.severity}
                          onChange={e => updateIssue(issue.id, 'severity', e.target.value)}
                        >
                          <option value="low">{t('Low', 'منخفضة')}</option>
                          <option value="medium">{t('Medium', 'متوسطة')}</option>
                          <option value="high">{t('High', 'عالية')}</option>
                          <option value="critical">{t('Critical', 'حرجة')}</option>
                        </select>
                      </div>
                      <div>
                        <label className="label-field text-xs">{t('Status', 'الحالة')}</label>
                        <select
                          className="select-field text-xs py-1 px-2"
                          value={issue.status}
                          onChange={e => updateIssue(issue.id, 'status', e.target.value)}
                        >
                          <option value="open">{t('Open', 'مفتوحة')}</option>
                          <option value="under_review">{t('Under Review', 'قيد المراجعة')}</option>
                          <option value="resolved">{t('Resolved', 'تم الحل')}</option>
                          <option value="rejected">{t('Rejected', 'مرفوضة')}</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                      <span>{t('Reported by', 'أبلغه')} {issue.reporter || '—'}</span>
                      <span>&middot;</span>
                      <span>
                        {new Date(issue.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'notes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-brand-900 uppercase tracking-wide">
              {t('Project Notes', 'ملاحظات المشروع')} ({projectNotes.length})
            </h3>
            <button onClick={() => setShowNoteForm(!showNoteForm)} className="btn-primary">
              <Plus className="w-4 h-4 me-1.5" />
              {t('Add Note', 'إضافة ملاحظة')}
            </button>
          </div>
          {showNoteForm && (
            <div className="card p-4 space-y-3">
              <div>
                <label className="label-field">{t('Note', 'ملاحظة')} *</label>
                <textarea className="input-field" rows={3} value={newNote} onChange={e => setNewNote(e.target.value)} placeholder={t('Write your note...', 'اكتب ملاحظتك...')} />
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowNoteForm(false)} className="btn-ghost">{t('Cancel', 'إلغاء')}</button>
                <button onClick={() => { if (newNote.trim()) { setProjectNotes(prev => [{ id: `pn-${Date.now()}`, content: newNote, author: currentUser.name, createdAt: new Date().toISOString() }, ...prev]); setNewNote(''); setShowNoteForm(false) } }} className="btn-primary">{t('Save Note', 'حفظ الملاحظة')}</button>
              </div>
            </div>
          )}
          {projectNotes.length === 0 ? (
            <div className="card empty-state">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400">{t('No notes yet', 'لا توجد ملاحظات بعد')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {projectNotes.map((note) => (
                <div key={note.id} className="card p-4">
                  {editingNoteId === note.id ? (
                    <div className="space-y-3">
                      <textarea
                        className="input-field"
                        rows={3}
                        value={editingNoteContent}
                        onChange={e => setEditingNoteContent(e.target.value)}
                      />
                      <div className="flex items-center gap-2 justify-end">
                        <button onClick={cancelEditNote} className="btn-ghost text-gray-500 hover:text-gray-700">
                          <X className="w-4 h-4 me-1" />
                          {t('Cancel', 'إلغاء')}
                        </button>
                        <button onClick={saveEditNote} className="btn-primary">
                          <Check className="w-4 h-4 me-1" />
                          {t('Save', 'حفظ')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-gray-700">{note.content}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                        <span>{note.author || '—'}</span>
                        <span>&middot;</span>
                        <span>
                          {new Date(note.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                        <button
                          onClick={() => startEditNote(note.id, note.content)}
                          className="ms-auto text-gray-400 hover:text-brand-600 transition-colors"
                          title={t('Edit', 'تعديل')}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
    <AttachmentUploadModal open={showAttachmentModal} onClose={() => setShowAttachmentModal(false)} onSave={(att) => { setAttachments(prev => [{ id: `att-${Date.now()}`, name: att.name, type: 'application/pdf', size: 245000, uploadedBy: currentUser.name, uploadedAt: new Date().toISOString().split('T')[0] }, ...prev]); setShowAttachmentModal(false) }} />
    <ConfirmModal open={!!deleteAttachmentId} onClose={() => setDeleteAttachmentId(null)} onConfirm={() => { setAttachments(prev => prev.filter(a => a.id !== deleteAttachmentId)); setDeleteAttachmentId(null) }} title={t('Delete Attachment', 'حذف المرفق')} message={t('Are you sure you want to delete this attachment?', 'هل أنت متأكد من حذف هذا المرفق؟')} confirmLabel={t('Delete', 'حذف')} cancelLabel={t('Cancel', 'إلغاء')} variant="danger" />
    <ProjectFormModal open={showEditForm} onClose={() => setShowEditForm(false)} onSave={(data) => { Object.assign(project, data); setShowEditForm(false) }} item={project} mode="project" />
    </>
  )
}

/* ── Helper Components ────────────────────────────── */

function InfoField({
  label,
  value,
  icon,
}: {
  label: string
  value?: string | number | null
  icon?: React.ReactNode
}) {
  return (
    <div>
      <label className="label-field">{label}</label>
      <div className="flex items-center gap-1.5 text-sm text-brand-900">
        {icon && <span className="text-gray-400">{icon}</span>}
        {value || <span className="text-gray-400">—</span>}
      </div>
    </div>
  )
}

function SummaryRow({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-gray-500">{label}</span>
      <span className={`text-sm ${highlight ? 'font-bold text-brand-900' : 'font-medium text-gray-700'}`}>
        {value}
      </span>
    </div>
  )
}
