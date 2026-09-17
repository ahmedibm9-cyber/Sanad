import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../contexts/LanguageContext'
import { useCompany } from '../contexts/CompanyContext'
import { useCompanyDocuments } from '../hooks/useData'
import { useAuth } from '../contexts/AuthContext'
import { useApp } from '../contexts/AppContext'
import { getDocumentService } from '../lib/services/document'
import ConfirmModal from '../components/common/ConfirmModal'
import Pagination from '../components/common/Pagination'
import type { DocumentType } from '../types'
import {
  FileText, Search, Plus, Eye, Pencil, Trash2, Download,
  Printer, Filter, ChevronDown,
} from 'lucide-react'

const docTypeLabels: Record<DocumentType, { en: string; ar: string }> = {
  QUOT: { en: 'Quotation', ar: 'عرض أسعار' },
  PINV: { en: 'Proforma Invoice', ar: 'فاتورة مبدئية' },
  TINV: { en: 'Tax Invoice', ar: 'فاتورة ضريبية' },
  CINV: { en: 'Commercial Invoice', ar: 'فاتورة تجارية' },
  PKL:  { en: 'Packing List', ar: 'قائمة التعبئة' },
  DN:   { en: 'Delivery Note', ar: 'إشعار التسليم' },
  BL:   { en: 'Bill of Lading', ar: 'بوليصة الشحن' },
}

const docTypeColors: Record<DocumentType, string> = {
  QUOT: 'bg-blue-100 text-blue-800',
  PINV: 'bg-purple-100 text-purple-800',
  TINV: 'bg-green-100 text-green-800',
  CINV: 'bg-amber-100 text-amber-800',
  PKL:  'bg-cyan-100 text-cyan-800',
  DN:   'bg-orange-100 text-orange-800',
  BL:   'bg-rose-100 text-rose-800',
}

const ITEMS_PER_PAGE = 20

export default function DocumentsPage() {
  const { t } = useLanguage()
  const { currentCompany, hasPermission, permissions } = useCompany()
  const { currentUser } = useApp()
  const { user } = useAuth()
  const navigate = useNavigate()

  const { data: documentsRaw, loading: isLoading, refetch } = useCompanyDocuments(currentCompany.id)

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<DocumentType | ''>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [showTypeDropdown, setShowTypeDropdown] = useState(false)
  const [page, setPage] = useState(1)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; number: string } | null>(null)
  const [deleting, setDeleting] = useState(false)

  const documents = documentsRaw || []

  const filtered = useMemo(() => {
    let result = documents
    if (search) {
      const q = search.toLowerCase()
      result = result.filter((d: any) =>
        d.document_number?.toLowerCase().includes(q) ||
        d.prepared_by?.toLowerCase().includes(q)
      )
    }
    if (typeFilter) {
      result = result.filter((d: any) => d.document_type === typeFilter)
    }
    if (statusFilter) {
      result = result.filter((d: any) => d.status === statusFilter)
    }
    return result
  }, [documents, search, typeFilter, statusFilter])

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const service = getDocumentService()
      await service.deleteDocument(deleteTarget.id, {
        userId: user?.id || currentUser.id,
        companyId: currentCompany.id,
        permissions: permissions?.permissions || {},
        isSystemAdmin: user?.isSystemAdmin || false,
      })
      setDeleteTarget(null)
      refetch()
    } catch (err) {
      console.error('Delete failed:', err)
    } finally {
      setDeleting(false)
    }
  }

  const canCreate = hasPermission('documents.create')
  const canEdit = hasPermission('documents.edit')
  const canDelete = hasPermission('documents.delete')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-900">
            {t('Documents', 'المستندات')}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {t(`${filtered.length} document(s)`, `${filtered.length} مستند(ات)`)}
          </p>
        </div>
        {canCreate && (
          <button
            onClick={() => navigate('/projects')}
            className="btn-primary"
          >
            <Plus size={16} className="ms-1.5" />
            {t('New Document', 'مستند جديد')}
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            className="input-field ps-9"
            placeholder={t('Search by number or prepared by...', 'بحث بالرقم أو المُعدّ...')}
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
        </div>

        {/* Type filter */}
        <div className="relative">
          <button
            onClick={() => setShowTypeDropdown(!showTypeDropdown)}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <Filter size={14} />
            {typeFilter ? docTypeLabels[typeFilter].en : t('All Types', 'كل الأنواع')}
            <ChevronDown size={14} />
          </button>
          {showTypeDropdown && (
            <div className="absolute top-full mt-1 start-0 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[180px]">
              <button
                className="w-full text-start px-3 py-2 text-sm hover:bg-gray-50 rounded-t-lg"
                onClick={() => { setTypeFilter(''); setShowTypeDropdown(false); setPage(1) }}
              >
                {t('All Types', 'كل الأنواع')}
              </button>
              {(Object.keys(docTypeLabels) as DocumentType[]).map(type => (
                <button
                  key={type}
                  className="w-full text-start px-3 py-2 text-sm hover:bg-gray-50 last:rounded-b-lg"
                  onClick={() => { setTypeFilter(type); setShowTypeDropdown(false); setPage(1) }}
                >
                  <span className={`inline-block px-2 py-0.5 rounded text-xs me-2 ${docTypeColors[type]}`}>
                    {type}
                  </span>
                  {docTypeLabels[type].en}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Status filter */}
        <div>
          <label htmlFor="document-status-filter" className="sr-only">
            {t('Filter by status', 'تصفية حسب الحالة')}
          </label>
          <select
            id="document-status-filter"
            className="select-field text-sm"
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
          >
            <option value="">{t('All Statuses', 'كل الحالات')}</option>
            <option value="draft">{t('Draft', 'مسودة')}</option>
            <option value="final">{t('Final', 'نهائي')}</option>
          </select>
        </div>
      </div>

      {/* Documents Table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="h-8 w-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
        </div>
      ) : paginated.length === 0 ? (
        <div className="text-center py-12">
          <FileText size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-700 text-lg">
            {t('No documents found', 'لم يتم العثور على مستندات')}
          </p>
          <p className="text-gray-600 text-sm mt-1">
            {t('Create documents from within a Project or Task', 'أنشئ المستندات من داخل مشروع أو مهمة')}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-start py-3 px-4 font-medium text-gray-600">
                  {t('Number', 'الرقم')}
                </th>
                <th className="text-start py-3 px-4 font-medium text-gray-600">
                  {t('Type', 'النوع')}
                </th>
                <th className="text-start py-3 px-4 font-medium text-gray-600">
                  {t('Date', 'التاريخ')}
                </th>
                <th className="text-start py-3 px-4 font-medium text-gray-600">
                  {t('Status', 'الحالة')}
                </th>
                <th className="text-start py-3 px-4 font-medium text-gray-600">
                  {t('Prepared By', 'أُعدّ بواسطة')}
                </th>
                <th className="text-end py-3 px-4 font-medium text-gray-600">
                  {t('Actions', 'الإجراءات')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginated.map((doc: any) => (
                <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4">
                    <span className="font-medium text-brand-900">{doc.document_number}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${docTypeColors[doc.document_type as DocumentType] || 'bg-gray-100 text-gray-800'}`}>
                      {t(docTypeLabels[doc.document_type as DocumentType]?.en || doc.document_type, docTypeLabels[doc.document_type as DocumentType]?.ar || doc.document_type)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {doc.created_date || doc.created_at?.split('T')[0]}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                      doc.status === 'final' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {t(doc.status === 'final' ? 'Final' : 'Draft', doc.status === 'final' ? 'نهائي' : 'مسودة')}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {doc.prepared_by || '—'}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => navigate(`/documents/${doc.id}/preview?type=${doc.document_type}&projectId=${doc.work_item_id}`)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                        title={t('Preview', 'معاينة')}
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => navigate(`/documents/${doc.id}/form?type=${doc.document_type}&projectId=${doc.work_item_id}`)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                        title={t('Edit', 'تعديل')}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget({ id: doc.id, number: doc.document_number })}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title={t('Delete', 'حذف')}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <ConfirmModal
          open
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          title={t('Delete Document', 'حذف المستند')}
          message={t(
            `Are you sure you want to delete document "${deleteTarget.number}"? This action can be undone from Trash.`,
            `هل أنت متأكد من حذف المستند "${deleteTarget.number}"؟ يمكن التراجع عن هذا الإجراء من سلة المهملات.`
          )}
          variant="danger"
          confirmLabel={t('Delete', 'حذف')}
          loading={deleting}
        />
      )}
    </div>
  )
}
