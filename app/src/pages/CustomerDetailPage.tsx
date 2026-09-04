import { useState, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useLanguage } from '../contexts/LanguageContext'
import { useCompany } from '../contexts/CompanyContext'
import { getCustomersByCompany, getProjectsByCompany } from '../data/mockData'
import CustomerFormModal from '../components/customers/CustomerFormModal'
import type { DocumentType, Customer } from '../types'
import {
  ArrowLeft, Edit3, Phone, Mail, MapPin, Building2, Calendar,
  FolderOpen, FileText, Clock, ExternalLink, User, ChevronRight,
} from 'lucide-react'

const docTypeLabels: Record<DocumentType, { en: string; ar: string }> = {
  QUOT: { en: 'Quotation', ar: 'عرض سعر' },
  PINV: { en: 'Proforma Invoice', ar: 'فاتورة مبدئية' },
  TINV: { en: 'Tax Invoice', ar: 'فاتورة ضريبية' },
  CINV: { en: 'Commercial Invoice', ar: 'فاتورة تجارية' },
  PKL: { en: 'Packing List', ar: 'قائمة التعبئة' },
  DN: { en: 'Delivery Note', ar: 'إشعار التسليم' },
  BL: { en: 'Bill of Lading', ar: 'بوليصة الشحن' },
}

type TabKey = 'overview' | 'projects' | 'documents' | 'history'

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useLanguage()
  const { currentCompany } = useCompany()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabKey>('overview')
  const [showEditForm, setShowEditForm] = useState(false)

  const customers = useMemo(
    () => getCustomersByCompany(currentCompany.id),
    [currentCompany.id]
  )
  const customer = customers.find((c) => c.id === id)

  const allProjects = useMemo(
    () => getProjectsByCompany(currentCompany.id),
    [currentCompany.id]
  )

  const relatedProjects = useMemo(
    () => allProjects.filter((p) => p.customerId === id),
    [allProjects, id]
  )

  const relatedDocuments = useMemo(() => {
    return relatedProjects.flatMap((p) =>
      p.documents.map((doc) => ({ ...doc, projectName: p.name }))
    )
  }, [relatedProjects])

  const projectHistory = useMemo(() => {
    return relatedProjects
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  }, [relatedProjects])

  const totalProjectValue = useMemo(() => {
    return relatedProjects.reduce((sum, p) => {
      return sum + p.materials.reduce((mSum, m) => mSum + m.quantity * m.unitPrice, 0)
    }, 0)
  }, [relatedProjects])

  if (!customer) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card p-12 text-center">
          <Building2 size={48} className="mx-auto text-gray-300 mb-4" />
          <h2 className="text-lg font-semibold text-gray-600 mb-2">
            {t('Customer Not Found', 'العميل غير موجود')}
          </h2>
          <p className="text-sm text-gray-400 mb-4">
            {t('The requested customer does not exist.', 'العميل المطلوب غير موجود.')}
          </p>
          <button onClick={() => navigate('/customers')} className="btn-primary">
            {t('Back to Customers', 'العودة للعملاء')}
          </button>
        </div>
      </div>
    )
  }

  const tabs: { key: TabKey; label: { en: string; ar: string }; icon: React.ReactNode; count?: number }[] = [
    { key: 'overview', label: { en: 'Overview', ar: 'نظرة عامة' }, icon: <Building2 size={14} /> },
    { key: 'projects', label: { en: 'Projects', ar: 'المشاريع' }, icon: <FolderOpen size={14} />, count: relatedProjects.length },
    { key: 'documents', label: { en: 'Documents', ar: 'المستندات' }, icon: <FileText size={14} />, count: relatedDocuments.length },
    { key: 'history', label: { en: 'Export History', ar: 'سجل التصدير' }, icon: <Clock size={14} />, count: projectHistory.length },
  ]

  return (
    <>
    <div className="max-w-5xl mx-auto">
      {/* Back Navigation */}
      <Link
        to="/customers"
        className="inline-flex items-center gap-1.5 text-sm text-brand-500 hover:text-brand-700 mb-4 transition-colors"
      >
        <ArrowLeft size={16} />
        {t('Back to Customers', 'العودة للعملاء')}
      </Link>

      {/* Customer Header Card */}
      <div className="card p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-brand-100 rounded-xl flex items-center justify-center text-brand-700 text-xl font-bold shrink-0">
              {customer.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-brand-900">{customer.name}</h1>
              {customer.contactPerson && (
                <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-1">
                  <User size={14} className="text-gray-400" />
                  {customer.contactPerson}
                </p>
              )}
              <div className="flex items-center gap-4 mt-2 flex-wrap">
                {customer.country && (
                  <span className="status-badge bg-brand-50 text-brand-700 border border-brand-200">
                    <MapPin size={12} className="mr-1" />
                    {customer.city ? `${customer.city}, ` : ''}{customer.country}
                  </span>
                )}
                <span className="text-xs text-gray-400 inline-flex items-center gap-1">
                  <Calendar size={12} />
                  {t('Since', 'منذ')} {new Date(customer.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>
          <button onClick={() => setShowEditForm(true)} className="btn-secondary">
            <Edit3 size={14} className="mr-1.5" />
            {t('Edit', 'تعديل')}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 border-b border-gray-200 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.key
                ? 'border-brand-700 text-brand-700'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {tab.icon}
            {t(tab.label.en, tab.label.ar)}
            {tab.count !== undefined && (
              <span className="ml-1 bg-gray-100 text-gray-500 text-xs px-1.5 py-0.5 rounded-full">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Contact Details */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
              {t('Contact Details', 'بيانات الاتصال')}
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center">
                  <User size={14} className="text-gray-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">{t('Contact Person', 'جهة الاتصال')}</p>
                  <p className="text-sm font-medium text-gray-800">{customer.contactPerson || '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center">
                  <Phone size={14} className="text-gray-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">{t('Phone', 'الهاتف')}</p>
                  <p className="text-sm font-medium text-gray-800">{customer.phone || '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center">
                  <Mail size={14} className="text-gray-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">{t('Email', 'البريد الإلكتروني')}</p>
                  <p className="text-sm font-medium text-gray-800">{customer.email || '—'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Address & Location */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
              {t('Address & Location', 'العنوان والموقع')}
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center shrink-0">
                  <MapPin size={14} className="text-gray-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">{t('Address', 'العنوان')}</p>
                  <p className="text-sm font-medium text-gray-800">{customer.address || '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center">
                  <Building2 size={14} className="text-gray-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">{t('Country', 'الدولة')}</p>
                  <p className="text-sm font-medium text-gray-800">
                    {customer.city ? `${customer.city}, ` : ''}{customer.country || '—'}
                  </p>
                </div>
              </div>
              {customer.vatNumber && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center">
                    <FileText size={14} className="text-gray-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">VAT Number</p>
                    <p className="text-sm font-medium text-gray-800">{customer.vatNumber}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Summary Stats */}
          <div className="card p-5 md:col-span-2">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
              {t('Business Summary', 'ملخص الأعمال')}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-brand-700">{relatedProjects.length}</p>
                <p className="text-xs text-gray-500 mt-1">{t('Projects', 'مشاريع')}</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-brand-700">{relatedDocuments.length}</p>
                <p className="text-xs text-gray-500 mt-1">{t('Documents', 'مستندات')}</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">
                  {relatedProjects.filter((p) => p.status === 'completed').length}
                </p>
                <p className="text-xs text-gray-500 mt-1">{t('Completed', 'مكتملة')}</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-brand-700">
                  {totalProjectValue > 0
                    ? `${(totalProjectValue / 1000).toFixed(0)}K`
                    : '—'}
                </p>
                <p className="text-xs text-gray-500 mt-1">{t('Total Value', 'القيمة الإجمالية')}</p>
              </div>
            </div>
          </div>

          {/* Notes */}
          {customer.notes && (
            <div className="card p-5 md:col-span-2">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                {t('Notes', 'ملاحظات')}
              </h3>
              <p className="text-sm text-gray-700">{customer.notes}</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'projects' && (
        <div className="space-y-3">
          {relatedProjects.length === 0 ? (
            <div className="card p-8 text-center">
              <FolderOpen size={40} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 text-sm">
                {t('No projects found for this customer.', 'لا توجد مشاريع لهذا العميل.')}
              </p>
            </div>
          ) : (
            relatedProjects.map((project) => {
              const statusColors: Record<string, string> = {
                in_progress: 'bg-blue-100 text-blue-700 border border-blue-200',
                completed: 'bg-green-100 text-green-700 border border-green-200',
                cancelled: 'bg-red-100 text-red-700 border border-red-200',
                archived: 'bg-gray-100 text-gray-600 border border-gray-200',
              }
              const statusLabels: Record<string, { en: string; ar: string }> = {
                in_progress: { en: 'In Progress', ar: 'قيد التنفيذ' },
                completed: { en: 'Completed', ar: 'مكتمل' },
                cancelled: { en: 'Cancelled', ar: 'ملغي' },
                archived: { en: 'Archived', ar: 'مؤرشف' },
              }
              return (
                <Link
                  key={project.id}
                  to={`/projects/${project.id}`}
                  className="card p-4 flex items-center justify-between hover:bg-brand-50/40 transition-colors"
                >
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-brand-900 truncate">{project.name}</h4>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span className="inline-flex items-center gap-1">
                        <Calendar size={11} />
                        {project.createdAt}
                      </span>
                      {project.destinationCountry && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin size={11} />
                          {project.destinationCity
                            ? `${project.destinationCity}, ${project.destinationCountry}`
                            : project.destinationCountry}
                        </span>
                      )}
                      <span>
                        {project.materials.length} {t('material(s)', 'مادة')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`status-badge ${statusColors[project.status]}`}>
                      {t(statusLabels[project.status].en, statusLabels[project.status].ar)}
                    </span>
                    <ChevronRight size={16} className="text-gray-300" />
                  </div>
                </Link>
              )
            })
          )}
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="space-y-3">
          {relatedDocuments.length === 0 ? (
            <div className="card p-8 text-center">
              <FileText size={40} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 text-sm">
                {t('No documents found for this customer.', 'لا توجد مستندات لهذا العميل.')}
              </p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">
                      {t('Document Type', 'نوع المستند')}
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">
                      {t('Number', 'الرقم')}
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">
                      {t('Project', 'المشروع')}
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">
                      {t('Date', 'التاريخ')}
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">
                      {t('Status', 'الحالة')}
                    </th>
                    <th className="w-10 px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {relatedDocuments.map((doc) => (
                    <tr
                      key={doc.id}
                      onClick={() => navigate(`/documents/${doc.id}/preview`)}
                      className="hover:bg-brand-50/40 cursor-pointer transition-colors"
                    >
                      <td className="px-5 py-3">
                        <span className="status-badge bg-brand-50 text-brand-700 border border-brand-200">
                          {t(docTypeLabels[doc.type].en, docTypeLabels[doc.type].ar)}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-sm font-mono font-medium text-brand-800">
                        {doc.number}
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-700 truncate max-w-[200px]">
                        {doc.projectName}
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-500">{doc.date}</td>
                      <td className="px-5 py-3">
                        <span className={`status-badge ${
                          doc.status === 'final'
                            ? 'bg-green-100 text-green-700 border border-green-200'
                            : 'bg-amber-100 text-amber-700 border border-amber-200'
                        }`}>
                          {doc.status === 'final' ? t('Final', 'نهائي') : t('Draft', 'مسودة')}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <ExternalLink size={14} className="text-gray-300" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-3">
          {projectHistory.length === 0 ? (
            <div className="card p-8 text-center">
              <Clock size={40} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 text-sm">
                {t('No export history for this customer.', 'لا يوجد سجل تصدير لهذا العميل.')}
              </p>
            </div>
          ) : (
            projectHistory.map((project, idx) => (
              <div key={project.id} className="card p-4">
                <div className="flex items-start gap-4">
                  {/* Timeline indicator */}
                  <div className="flex flex-col items-center shrink-0">
                    <div className={`w-3 h-3 rounded-full ${
                      project.status === 'completed' ? 'bg-green-500' :
                      project.status === 'in_progress' ? 'bg-blue-500' :
                      project.status === 'cancelled' ? 'bg-red-500' : 'bg-gray-400'
                    }`} />
                    {idx < projectHistory.length - 1 && (
                      <div className="w-px h-full bg-gray-200 mt-1" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm font-semibold text-brand-900 truncate">{project.name}</h4>
                      <span className="text-xs text-gray-400 shrink-0">
                        {project.updatedAt}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      {project.destinationCountry && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin size={11} />
                          {project.destinationCity
                            ? `${project.destinationCity}, ${project.destinationCountry}`
                            : project.destinationCountry}
                        </span>
                      )}
                      {project.materials.length > 0 && (
                        <span>
                          {project.materials.length} {t('material(s)', 'مادة')} · {
                            project.materials.reduce((sum, m) => sum + m.quantity, 0)
                          } {t('MT', 'طن')}
                        </span>
                      )}
                      {project.documents.length > 0 && (
                        <span className="inline-flex items-center gap-1">
                          <FileText size={11} />
                          {project.documents.length} {t('doc(s)', 'مستند')}
                        </span>
                      )}
                    </div>
                    {project.materials.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {project.materials.map((m) => (
                          <span key={m.id} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                            {m.materialName} — {m.quantity} {m.weightUnit}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
    <CustomerFormModal open={showEditForm} onClose={() => setShowEditForm(false)} onSave={() => setShowEditForm(false)} customer={customer} />
    </>
  )
}
