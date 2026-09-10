import { useState, useEffect, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Edit3,
  Plus,
  FileText,
  Paperclip,
  AlertTriangle,
  MessageSquare,
  Calendar,
  ArrowRightLeft,
  ExternalLink,
  Printer,
  Download,
  Trash2,
  ChevronDown,
} from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import { useCompany } from '../contexts/CompanyContext'
import { useApp } from '../contexts/AppContext'
import {
  useWorkItemById,
  useDocuments,
  useNotes,
  useReportIssues,
  useAttachments,
  useWorkItemMaterials,
  useUpdateWorkItem,
  useConvertTaskToProject,
} from '../hooks/useData'
import { downloadAttachment } from '../lib/r2Client'
import AttachmentUploadModal from '../components/common/AttachmentUploadModal'
import ConfirmModal from '../components/common/ConfirmModal'
import ProjectFormModal from '../components/projects/ProjectFormModal'
import type { WorkItemStatus, Document, ProjectNote, ReportIssue } from '../types'
import type { WorkItemMaterial, Document as DbDocument, Note, ReportIssue as DbReportIssue, Attachment as DbAttachment } from '../hooks/useData'

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

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

type TabId = 'overview' | 'documents' | 'attachments' | 'issues' | 'notes'

const TABS: { id: TabId; label: string; labelAr: string; icon: typeof FileText }[] = [
  { id: 'overview', label: 'Overview', labelAr: 'نظرة عامة', icon: FileText },
  { id: 'documents', label: 'Documents', labelAr: 'المستندات', icon: FileText },
  { id: 'attachments', label: 'Attachments', labelAr: 'المرفقات', icon: Paperclip },
  { id: 'issues', label: 'Issues', labelAr: 'المشكلات', icon: AlertTriangle },
  { id: 'notes', label: 'Notes', labelAr: 'الملاحظات', icon: MessageSquare },
]

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useLanguage()
  const { currentUser } = useApp()
  const { currentCompany } = useCompany()

  // Fetch work item from Supabase
  const { data: dbTask, loading: taskLoading } = useWorkItemById(id)
  const { data: dbDocs = [] } = useDocuments(id)
  const { data: dbNotes = [] } = useNotes(id)
  const { data: dbIssues = [] } = useReportIssues(id)
  const { data: dbAttachments = [] } = useAttachments(id)
  const { data: dbMaterials = [] } = useWorkItemMaterials(id)
  const { update: updateWorkItem } = useUpdateWorkItem()
  const { convert: convertTaskToProject } = useConvertTaskToProject()

  // Map Supabase data to UI types
  const task = useMemo(() => {
    if (!dbTask) return null
    return {
      id: dbTask.id,
      type: dbTask.type as 'task' | 'project',
      companyId: dbTask.company_id,
      name: dbTask.name,
      customerId: dbTask.customer_id ?? undefined,
      customerName: dbTask.customer_name ?? undefined,
      status: dbTask.status as WorkItemStatus,
      isPinned: dbTask.pinned,
      materials: [] as import('../types').ProjectMaterial[],
      destinationCountry: dbTask.destination_country ?? undefined,
      destinationCity: dbTask.destination_city ?? undefined,
      currency: dbTask.currency ?? undefined,
      incoterm: dbTask.incoterm ?? undefined,
      paymentTerms: dbTask.payment_terms ?? undefined,
      deliveryTerms: dbTask.delivery_terms ?? undefined,
      portOfLoading: dbTask.port_of_loading ?? undefined,
      portOfDischarge: dbTask.port_of_discharge ?? undefined,
      vesselName: dbTask.vessel_name ?? undefined,
      voyageNumber: dbTask.voyage_number ?? undefined,
      containerNumber: dbTask.container_number ?? undefined,
      createdAt: dbTask.created_at,
      updatedAt: dbTask.updated_at,
      createdBy: dbTask.created_by ?? undefined,
      documents: [] as Document[],
      attachments: [] as import('../types').Attachment[],
      reportIssues: [] as ReportIssue[],
      projectNotes: [] as ProjectNote[],
    }
  }, [dbTask])

  // Map materials
  const mappedMaterials = useMemo(() => {
    return (dbMaterials ?? []).map((m: WorkItemMaterial) => ({
      id: m.id,
      materialId: m.material_id ?? '',
      materialName: m.description_override ?? '',
      grade: undefined,
      quantity: m.quantity,
      weightUnit: m.weight_unit,
      unitPrice: m.price ?? 0,
      currency: m.currency ?? 'SAR',
      packing: m.packing_description ?? undefined,
      packingUnit: m.packing_unit ?? undefined,
      origin: m.origin ?? undefined,
      hsCode: m.hs_code ?? undefined,
    }))
  }, [dbMaterials])

  // Map documents
  const mappedDocs = useMemo<Document[]>(() => {
    return (dbDocs ?? []).map((d: DbDocument) => ({
      id: d.id,
      companyId: d.company_id,
      workItemId: d.work_item_id,
      type: d.document_type as Document['type'],
      number: d.document_number,
      date: d.created_date,
      language: (d.language || 'en') as 'en' | 'ar',
      template: d.template_key || 'fulla-commercial-invoice-680',
      preparedBy: d.prepared_by ?? undefined,
      status: d.status as 'draft' | 'final',
      materials: [],
      createdAt: d.created_at,
      updatedAt: d.updated_at,
    }))
  }, [dbDocs])

  // Map notes
  const mappedNotes = useMemo<ProjectNote[]>(() => {
    return (dbNotes ?? []).map((n: Note) => ({
      id: n.id,
      content: n.body,
      author: n.author_user_id,
      createdAt: n.created_at,
    }))
  }, [dbNotes])

  // Map issues
  const mappedIssues = useMemo<ReportIssue[]>(() => {
    return (dbIssues ?? []).map((i: DbReportIssue) => ({
      id: i.id,
      description: i.body,
      severity: i.severity as ReportIssue['severity'],
      status: i.status as ReportIssue['status'],
      reporter: i.reporter_user_id,
      createdAt: i.created_at,
    }))
  }, [dbIssues])

  // Map attachments
  const mappedAttachments = useMemo(() => {
    return (dbAttachments ?? []).map((a: DbAttachment) => ({
      id: a.id,
      name: a.original_name,
      type: a.mime_type ?? 'application/octet-stream',
      size: a.size ?? 0,
      uploadedBy: a.uploaded_by ?? undefined,
      uploadedAt: a.created_at,
      r2_object_key: a.r2_object_key,
    }))
  }, [dbAttachments])

  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [showInvoiceDropdown, setShowInvoiceDropdown] = useState(false)
  const [showAttachmentModal, setShowAttachmentModal] = useState(false)
  const [attachments, setAttachments] = useState(mappedAttachments)
  const [taskNotes, setTaskNotes] = useState<ProjectNote[]>(mappedNotes)
  const [taskIssues, setTaskIssues] = useState<ReportIssue[]>(mappedIssues)
  const [taskDocs, setTaskDocs] = useState<Document[]>(mappedDocs)
  const [newNote, setNewNote] = useState('')
  const [showNoteForm, setShowNoteForm] = useState(false)
  const [showIssueForm, setShowIssueForm] = useState(false)
  const [issueDesc, setIssueDesc] = useState('')
  const [issueSeverity, setIssueSeverity] = useState('medium')
  const [showConvertModal, setShowConvertModal] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [deleteAttachmentId, setDeleteAttachmentId] = useState<string | null>(null)

  // Sync hook data into local state when it loads
  useEffect(() => {
    setAttachments(mappedAttachments)
  }, [mappedAttachments])
  useEffect(() => {
    setTaskNotes(mappedNotes)
  }, [mappedNotes])
  useEffect(() => {
    setTaskIssues(mappedIssues)
  }, [mappedIssues])
  useEffect(() => {
    setTaskDocs(mappedDocs)
  }, [mappedDocs])

  if (taskLoading) {
    return (
      <div className="text-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-brand-200 border-t-brand-700 rounded-full mx-auto mb-4" />
        <p className="text-gray-400">{t('Loading...', 'جارٍ التحميل...')}</p>
      </div>
    )
  }

  if (!task) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400 text-lg">{t('Task not found', 'المهمة غير موجودة')}</p>
        <Link to="/tasks" className="btn-primary mt-4 inline-flex">
          <ArrowLeft className="w-4 h-4 ms-1.5" />
          {t('Back to Tasks', 'العودة للمهام')}
        </Link>
      </div>
    )
  }

  const statusOpt = getStatusBadge(task.status)
  const totalValue = mappedMaterials.reduce((s, m) => s + m.quantity * m.unitPrice, 0)

  return (
    <>
    <div className="space-y-6" onClick={() => setShowInvoiceDropdown(false)}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <button
            onClick={() => navigate('/tasks')}
            className="mt-1 p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
            aria-label={t('Back to tasks', 'العودة إلى المهام')}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-brand-900">{task.name}</h1>
              <span className={`status-badge ${statusOpt.colorClass}`}>
                {t(statusOpt.label, statusOpt.labelAr)}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {t('Created by', 'أنشأه')} {task.createdBy || '—'} &middot;{' '}
              {new Date(task.createdAt).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button onClick={() => setShowConvertModal(true)} className="btn-secondary">
            <ArrowRightLeft className="w-4 h-4 ms-1.5" />
            {t('Convert to Project', 'تحويل إلى مشروع')}
          </button>
          <button onClick={() => setShowEditForm(true)} className="btn-secondary">
            <Edit3 className="w-4 h-4 ms-1.5" />
            {t('Edit', 'تعديل')}
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
                    {taskDocs.length}
                  </span>
                )}
                {tab.id === 'attachments' && (
                  <span className="text-xs bg-gray-100 text-gray-500 rounded-full px-1.5 py-0.5 ms-0.5">
                    {attachments.length}
                  </span>
                )}
                {tab.id === 'issues' && (
                  <span className="text-xs bg-gray-100 text-gray-500 rounded-full px-1.5 py-0.5 ms-0.5">
                    {taskIssues.length}
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
          {/* Left: Task Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Task Info Card */}
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-brand-900 mb-4 uppercase tracking-wide">
                {t('Task Details', 'تفاصيل المهمة')}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <InfoField label={t('Customer', 'العميل')} value={task.customerName} />
                <InfoField label={t('Status', 'الحالة')} value={statusOpt.label} />
                <InfoField label={t('Created by', 'أنشأه')} value={task.createdBy} />
                <InfoField label={t('Created', 'تاريخ الإنشاء')} value={
                  new Date(task.createdAt).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })
                } />
                <InfoField label={t('Last Updated', 'آخر تحديث')} value={
                  new Date(task.updatedAt).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })
                } />
                {totalValue > 0 && (
                  <InfoField
                    label={t('Related Value', 'القيمة المرتبطة')}
                    value={`${totalValue.toLocaleString()} ${task.currency || 'SAR'}`}
                  />
                )}
              </div>
            </div>

            {/* Materials Table (if any) */}
            {mappedMaterials.length > 0 && (
              <div className="card overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-brand-900 uppercase tracking-wide">
                    {t('Related Materials', 'المواد المرتبطة')}
                    <span className="ms-2 text-gray-400 font-normal normal-case">({mappedMaterials.length})</span>
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
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {mappedMaterials.map((mat) => (
                        <tr key={mat.id} className="table-row-hover">
                          <td className="px-5 py-3">
                            <p className="text-sm font-medium text-brand-900">{mat.materialName}</p>
                            {mat.grade && <p className="text-xs text-gray-400">{mat.grade}</p>}
                          </td>
                          <td className="px-5 py-3 text-sm text-gray-600">
                            {mat.quantity > 0 ? `${mat.quantity} ${mat.weightUnit}` : '—'}
                          </td>
                          <td className="px-5 py-3 text-sm text-gray-600">
                            {mat.unitPrice > 0 ? `${mat.unitPrice.toLocaleString()} ${mat.currency}` : '—'}
                          </td>
                          <td className="px-5 py-3 text-sm font-medium text-brand-900">
                            {mat.quantity > 0 && mat.unitPrice > 0
                              ? `${(mat.quantity * mat.unitPrice).toLocaleString()} ${mat.currency}`
                              : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
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
              <SummaryRow label={t('Documents', 'المستندات')} value={String(taskDocs.length)} />
              <SummaryRow label={t('Attachments', 'المرفقات')} value={String(attachments.length)} />
              <SummaryRow label={t('Issues', 'المشكلات')} value={String(taskIssues.length)} />
              <SummaryRow label={t('Notes', 'الملاحظات')} value={String(taskNotes.length)} />
              {totalValue > 0 && (
                <div className="pt-2 border-t border-gray-100">
                  <SummaryRow
                    label={t('Related Value', 'القيمة المرتبطة')}
                    value={`${totalValue.toLocaleString()} ${task.currency || 'SAR'}`}
                    highlight
                  />
                </div>
              )}
            </div>

            {/* Customer Info */}
            {task.customerName && (
              <div className="card p-4">
                <h3 className="text-sm font-semibold text-brand-900 uppercase tracking-wide mb-3">
                  {t('Customer', 'العميل')}
                </h3>
                <p className="text-sm font-medium text-brand-900">{task.customerName}</p>
              </div>
            )}

            {/* Convert to Project CTA */}
            <div className="card p-4 bg-brand-50 border-brand-100">
              <h3 className="text-sm font-semibold text-brand-900 uppercase tracking-wide mb-2">
                {t('Convert to Project', 'تحويل إلى مشروع')}
              </h3>
              <p className="text-xs text-gray-500 mb-3">
                {t(
                  'Turn this task into a full project with materials, documents, and tracking.',
                  'حوّل هذه المهمة إلى مشروع كامل مع المواد والمستندات والتتبع.'
                )}
              </p>
              <button onClick={() => setShowConvertModal(true)} className="btn-primary w-full">
                <ArrowRightLeft className="w-4 h-4 ms-1.5" />
                {t('Convert to Project', 'تحويل إلى مشروع')}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-brand-900 uppercase tracking-wide">
              {t('Documents', 'المستندات')} ({taskDocs.length})
            </h2>
            <div className="relative">
              <button onClick={(e) => { e.stopPropagation(); setShowInvoiceDropdown(!showInvoiceDropdown) }} className="btn-primary">
                <Plus className="w-4 h-4 ms-1.5" />
                {t('New Document', 'مستند جديد')}
                <ChevronDown className="w-3 h-3 me-1.5" />
              </button>
              {showInvoiceDropdown && (
                <div className="absolute end-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-sm z-30 py-1">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase">{t('Invoice', 'الفاتورة')}</div>
                  {(['QUOT','PINV','TINV','CINV'] as const).map(type => (
                    <button key={type} onClick={(e) => { e.stopPropagation(); setShowInvoiceDropdown(false); navigate(`/documents/new/form?type=${type}&projectId=${task.id}`) }}
                      className="w-full text-start px-4 py-2.5 text-sm hover:bg-brand-50 flex items-center gap-3 transition-colors">
                      <span className="w-10 text-xs font-bold text-brand-600 bg-brand-50 rounded px-1.5 py-0.5 text-center">{type}</span>
                      <span className="text-gray-700">{t(DOC_TYPE_LABELS[type].en, DOC_TYPE_LABELS[type].ar)}</span>
                    </button>
                  ))}
                  <div className="border-t border-gray-100 my-1" />
                  <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase">{t('Other Documents', 'مستندات أخرى')}</div>
                  {(['PKL','DN','BL'] as const).map(type => (
                    <button key={type} onClick={(e) => { e.stopPropagation(); setShowInvoiceDropdown(false); navigate(`/documents/new/form?type=${type}&projectId=${task.id}`) }}
                      className="w-full text-start px-4 py-2.5 text-sm hover:bg-brand-50 flex items-center gap-3 transition-colors">
                      <span className="w-10 text-xs font-bold text-brand-600 bg-brand-50 rounded px-1.5 py-0.5 text-center">{type}</span>
                      <span className="text-gray-700">{t(DOC_TYPE_LABELS[type].en, DOC_TYPE_LABELS[type].ar)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          {taskDocs.length === 0 ? (
            <div className="card py-16 text-center empty-state">
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
                  {taskDocs.map((doc) => {
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
                            <button className="btn-ghost p-1.5" title={t('Print', 'طباعة')} onClick={() => window.print()} aria-label={t('Print', 'طباعة')}>
                              <Printer className="w-4 h-4" />
                            </button>
                            <button className="btn-ghost p-1.5" title={t('Download', 'تحميل')} onClick={() => downloadAttachment((doc as any).r2_object_key || '', doc.number, currentCompany.id)} aria-label={t('Download document', 'تحميل المستند')}>
                              <Download className="w-4 h-4" />
                            </button>
                            <button className="btn-ghost p-1.5" title={t('Edit', 'تعديل')} onClick={() => navigate(`/documents/${doc.id}/form?projectId=${task.id}`)} aria-label={t('Edit document', 'تعديل المستند')}>
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
            <h2 className="text-sm font-semibold text-brand-900 uppercase tracking-wide">
              {t('Attachments', 'المرفقات')} ({attachments.length})
            </h2>
            <button onClick={() => setShowAttachmentModal(true)} className="btn-primary">
              <Plus className="w-4 h-4 ms-1.5" />
              {t('Upload', 'رفع')}
            </button>
          </div>
          {attachments.length === 0 ? (
            <div className="card py-16 text-center empty-state">
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
                           <button className="btn-ghost p-1.5" title={t('Download', 'تحميل')} onClick={() => downloadAttachment(att.r2_object_key || '', att.name, currentCompany.id)} aria-label={t('Download attachment', 'تحميل المرفق')}>
                             <Download className="w-4 h-4" />
                           </button>
                           <button className="btn-ghost p-1.5" title={t('Delete', 'حذف')} onClick={() => setDeleteAttachmentId(att.id)} aria-label={t('Delete attachment', 'حذف المرفق')}>
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
            <h2 className="text-sm font-semibold text-brand-900 uppercase tracking-wide">
              {t('Reported Issues', 'المشكلات المبلّغ عنها')} ({taskIssues.length})
            </h2>
            <button onClick={() => setShowIssueForm(!showIssueForm)} className="btn-primary">
              <Plus className="w-4 h-4 ms-1.5" />
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
                  <select className="select-field" value={issueSeverity} onChange={e => setIssueSeverity(e.target.value)}>
                    <option value="low">{t('Low', 'منخفضة')}</option>
                    <option value="medium">{t('Medium', 'متوسطة')}</option>
                    <option value="high">{t('High', 'عالية')}</option>
                    <option value="critical">{t('Critical', 'حرجة')}</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => { setShowIssueForm(false); setIssueDesc(''); setIssueSeverity('medium') }} className="btn-ghost">{t('Cancel', 'إلغاء')}</button>
                <button onClick={() => { if (issueDesc.trim()) { setTaskIssues(prev => [{ id: `ri-${Date.now()}`, description: issueDesc, severity: issueSeverity as any, status: 'open', reporter: currentUser.name, createdAt: new Date().toISOString() }, ...prev]); setIssueDesc(''); setIssueSeverity('medium'); setShowIssueForm(false) } }} className="btn-primary">{t('Submit', 'إرسال')}</button>
              </div>
            </div>
          )}
          {taskIssues.length === 0 ? (
            <div className="card py-16 text-center empty-state">
              <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400">{t('No issues reported', 'لا توجد مشكلات مبلّغ عنها')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {taskIssues.map((issue) => {
                const severityColors: Record<string, string> = {
                  low: 'bg-gray-100 text-gray-600',
                  medium: 'bg-amber-100 text-amber-700',
                  high: 'bg-orange-100 text-orange-700',
                  critical: 'bg-red-100 text-red-700',
                }
                const issueStatusColors: Record<string, string> = {
                  open: 'bg-red-100 text-red-700',
                  under_review: 'bg-blue-100 text-blue-700',
                  resolved: 'bg-green-100 text-green-700',
                  rejected: 'bg-gray-100 text-gray-600',
                }
                return (
                  <div key={issue.id} className="card p-4">
                    <div className="flex items-start justify-between">
                      <p className="text-sm text-gray-700 flex-1">{issue.description}</p>
                      <div className="flex items-center gap-2 ms-4">
                        <span className={`status-badge ${severityColors[issue.severity] || ''}`}>
                          {issue.severity}
                        </span>
                        <span className={`status-badge ${issueStatusColors[issue.status] || ''}`}>
                          {issue.status.replace('_', ' ')}
                        </span>
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
            <h2 className="text-sm font-semibold text-brand-900 uppercase tracking-wide">
              {t('Task Notes', 'ملاحظات المهمة')} ({taskNotes.length})
            </h2>
            <button onClick={() => setShowNoteForm(!showNoteForm)} className="btn-primary">
              <Plus className="w-4 h-4 ms-1.5" />
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
                <button onClick={() => { setShowNoteForm(false); setNewNote('') }} className="btn-ghost">{t('Cancel', 'إلغاء')}</button>
                <button onClick={() => { if (newNote.trim()) { setTaskNotes(prev => [{ id: `pn-${Date.now()}`, content: newNote, author: currentUser.name, createdAt: new Date().toISOString() }, ...prev]); setNewNote(''); setShowNoteForm(false) } }} className="btn-primary">{t('Save Note', 'حفظ الملاحظة')}</button>
              </div>
            </div>
          )}
          {taskNotes.length === 0 ? (
            <div className="card py-16 text-center empty-state">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400">{t('No notes yet', 'لا توجد ملاحظات بعد')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {taskNotes.map((note) => (
                <div key={note.id} className="card p-4">
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
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>

    {/* Attachment Upload Modal */}
    <AttachmentUploadModal
      open={showAttachmentModal}
      onClose={() => setShowAttachmentModal(false)}
      onSave={(att) => {
        setAttachments(prev => [{
          id: `att-${Date.now()}`,
          name: att.name,
          type: 'application/pdf',
          size: 245000,
          uploadedBy: currentUser.name,
          uploadedAt: new Date().toISOString().split('T')[0],
          r2_object_key: '',
        }, ...prev])
        setShowAttachmentModal(false)
      }}
    />

    {/* Convert to Project Confirmation Modal */}
    <ConfirmModal
      open={showConvertModal}
      onClose={() => setShowConvertModal(false)}
      onConfirm={() => {
        if (task) convertTaskToProject(task.id)
        setShowConvertModal(false)
      }}
      title={t('Convert to Project', 'تحويل إلى مشروع')}
      message={t(
        'Are you sure you want to convert this task to a project? This will create a new project with all the task data.',
        'هل أنت متأكد من تحويل هذه المهمة إلى مشروع؟ سيتم إنشاء مشروع جديد بجميع بيانات المهمة.'
      )}
      details={t(
        `Task: ${task.name}`,
        `المهمة: ${task.name}`
      )}
      confirmLabel={t('Convert', 'تحويل')}
      cancelLabel={t('Cancel', 'إلغاء')}
      variant="info"
    />

    {/* Edit Task Modal */}
    <ProjectFormModal
      open={showEditForm}
      onClose={() => setShowEditForm(false)}
      onSave={(data) => {
        if (task) updateWorkItem(task.id, data as any)
        setShowEditForm(false)
      }}
      item={task}
      mode="task"
    />

    {/* Delete Attachment Confirmation Modal */}
    <ConfirmModal
      open={!!deleteAttachmentId}
      onClose={() => setDeleteAttachmentId(null)}
      onConfirm={() => {
        setAttachments(prev => prev.filter(a => a.id !== deleteAttachmentId))
        setDeleteAttachmentId(null)
      }}
      title={t('Delete Attachment', 'حذف المرفق')}
      message={t(
        'Are you sure you want to delete this attachment? This action cannot be undone.',
        'هل أنت متأكد من حذف هذا المرفق؟ لا يمكن التراجع عن هذا الإجراء.'
      )}
      confirmLabel={t('Delete', 'حذف')}
      cancelLabel={t('Cancel', 'إلغاء')}
      variant="danger"
    />
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
