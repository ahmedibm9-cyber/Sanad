import { useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useLanguage } from '../contexts/LanguageContext'
import { useCompany } from '../contexts/CompanyContext'
import { getMaterialsByCompany, getProjectsByCompany } from '../data/mockData'
import {
  ArrowLeft, Package, Edit3, MapPin, Building2, FileText,
  FileCheck, FileWarning, Calendar, FolderOpen, ExternalLink,
  Tag, DollarSign, Box,
} from 'lucide-react'

export default function MaterialDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useLanguage()
  const { currentCompany } = useCompany()
  const navigate = useNavigate()

  const allMaterials = useMemo(
    () => getMaterialsByCompany(currentCompany.id),
    [currentCompany.id]
  )
  const material = allMaterials.find((m) => m.id === id)

  const allProjects = useMemo(
    () => getProjectsByCompany(currentCompany.id),
    [currentCompany.id]
  )

  const relatedProjects = useMemo(
    () =>
      allProjects.filter((p) =>
        p.materials.some((m) => m.materialId === id)
      ),
    [allProjects, id]
  )

  const totalQuantityUsed = useMemo(
    () =>
      relatedProjects.reduce(
        (sum, p) =>
          sum +
          p.materials
            .filter((m) => m.materialId === id)
            .reduce((mSum, m) => mSum + m.quantity, 0),
        0
      ),
    [relatedProjects, id]
  )

  if (!material) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card p-12 text-center">
          <Package size={48} className="mx-auto text-gray-300 mb-4" />
          <h2 className="text-lg font-semibold text-gray-600 mb-2">
            {t('Material Not Found', 'المادة غير موجودة')}
          </h2>
          <p className="text-sm text-gray-400 mb-4">
            {t('The requested material does not exist in this company catalog.', 'المادة المطلوبة غير موجودة في كتالوج هذه الشركة.')}
          </p>
          <button onClick={() => navigate('/materials')} className="btn-primary">
            {t('Back to Materials', 'العودة للمواد')}
          </button>
        </div>
      </div>
    )
  }

  function formatPrice(price?: number, currency?: string) {
    if (price == null) return '—'
    return `${currency || 'SAR'} ${price.toLocaleString()}`
  }

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
    <div className="max-w-5xl mx-auto">
      {/* Back Navigation */}
      <Link
        to="/materials"
        className="inline-flex items-center gap-1.5 text-sm text-brand-500 hover:text-brand-700 mb-4 transition-colors"
      >
        <ArrowLeft size={16} />
        {t('Back to Materials', 'العودة للمواد')}
      </Link>

      {/* Material Header */}
      <div className="card p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-brand-100 rounded-xl flex items-center justify-center shrink-0">
              <Package size={24} className="text-brand-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-brand-900">{material.name}</h1>
              {material.grade && (
                <p className="text-sm text-gray-500 mt-1">
                  {t('Grade:', 'الدرجة:')} <span className="font-medium text-gray-700">{material.grade}</span>
                </p>
              )}
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                {material.manufacturer && (
                  <span className="status-badge bg-brand-50 text-brand-700 border border-brand-200">
                    <Building2 size={12} className="mr-1" />
                    {material.manufacturer}
                  </span>
                )}
                {material.origin && (
                  <span className="status-badge bg-blue-50 text-blue-700 border border-blue-200">
                    <MapPin size={12} className="mr-1" />
                    {material.origin}
                  </span>
                )}
                {material.hsCode && (
                  <span className="status-badge bg-gray-100 text-gray-600 border border-gray-200">
                    <Tag size={12} className="mr-1" />
                    HS: {material.hsCode}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button className="btn-secondary">
            <Edit3 size={14} className="mr-1.5" />
            {t('Edit', 'تعديل')}
          </button>
        </div>
      </div>

      {/* Last Selling Price - Prominent */}
      <div className="card p-6 mb-6 bg-gradient-to-r from-brand-50 to-brand-100/50 border-brand-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-brand-700 rounded-xl flex items-center justify-center shrink-0">
            <DollarSign size={22} className="text-white" />
          </div>
          <div>
            <p className="text-xs text-brand-500 uppercase tracking-wider font-medium">
              {t('Last Selling Price', 'آخر سعر بيع')}
            </p>
            <p className="text-3xl font-bold text-brand-900 mt-0.5">
              {material.lastSellingPrice != null
                ? `${material.currency || 'SAR'} ${material.lastSellingPrice.toLocaleString()}`
                : t('Not set', 'غير محدد')}
            </p>
            <p className="text-xs text-brand-400 mt-1">
              {t('Per metric ton', 'لكل طن متري')}
            </p>
          </div>
        </div>
      </div>

      {/* Detail Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Material Properties */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            {t('Material Properties', 'خصائص المادة')}
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-sm text-gray-500">{t('Name', 'الاسم')}</span>
              <span className="text-sm font-medium text-gray-800">{material.name}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-sm text-gray-500">{t('Grade', 'الدرجة')}</span>
              <span className="text-sm font-medium text-gray-800">{material.grade || '—'}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-sm text-gray-500">{t('Manufacturer', 'المصنّع')}</span>
              <span className="text-sm font-medium text-gray-800">{material.manufacturer || '—'}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-sm text-gray-500">{t('Origin Country', 'دولة المنشأ')}</span>
              <span className="text-sm font-medium text-gray-800">{material.origin || '—'}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-sm text-gray-500">HS Code</span>
              <span className="text-sm font-medium font-mono text-gray-800">{material.hsCode || '—'}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-500">{t('Default Packing', 'التعبئة الافتراضية')}</span>
              <span className="text-sm font-medium text-gray-800">{material.defaultPacking || '—'}</span>
            </div>
          </div>
        </div>

        {/* Reference Files */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            {t('Reference Files', 'الملفات المرجعية')}
          </h3>
          <div className="space-y-3">
            {/* TDS */}
            <div className="flex items-center justify-between py-3 px-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center">
                  <FileText size={16} className="text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">TDS</p>
                  <p className="text-xs text-gray-400">{t('Technical Data Sheet', 'ورقة البيانات التقنية')}</p>
                </div>
              </div>
              {material.tdsFile ? (
                <button className="btn-ghost text-green-600 hover:text-green-700">
                  <ExternalLink size={14} />
                </button>
              ) : (
                <span className="text-xs text-gray-300 italic">{t('Not uploaded', 'لم يتم الرفع')}</span>
              )}
            </div>

            {/* MSDS */}
            <div className="flex items-center justify-between py-3 px-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center">
                  <FileWarning size={16} className="text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">MSDS</p>
                  <p className="text-xs text-gray-400">{t('Material Safety Data Sheet', 'ورقة سلامة المواد')}</p>
                </div>
              </div>
              {material.msdsFile ? (
                <button className="btn-ghost text-amber-600 hover:text-amber-700">
                  <ExternalLink size={14} />
                </button>
              ) : (
                <span className="text-xs text-gray-300 italic">{t('Not uploaded', 'لم يتم الرفع')}</span>
              )}
            </div>

            {/* COA */}
            <div className="flex items-center justify-between py-3 px-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileCheck size={16} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">COA</p>
                  <p className="text-xs text-gray-400">{t('Certificate of Analysis', 'شهادة التحليل')}</p>
                </div>
              </div>
              {material.coaFile ? (
                <button className="btn-ghost text-blue-600 hover:text-blue-700">
                  <ExternalLink size={14} />
                </button>
              ) : (
                <span className="text-xs text-gray-300 italic">{t('Not uploaded', 'لم يتم الرفع')}</span>
              )}
            </div>

            <div className="pt-2">
              <button className="btn-secondary w-full justify-center">
                <Box size={14} className="mr-1.5" />
                {t('Manage Files', 'إدارة الملفات')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Related Projects Section */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
            <FolderOpen size={14} />
            {t('Related Projects', 'المشاريع ذات الصلة')}
          </h3>
          <span className="text-xs text-gray-400">
            {t(`${relatedProjects.length} projects · ${totalQuantityUsed} MT total`, `${relatedProjects.length} مشاريع · ${totalQuantityUsed} طن إجمالي`)}
          </span>
        </div>

        {relatedProjects.length === 0 ? (
          <div className="p-8 text-center">
            <FolderOpen size={32} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm">
              {t('This material has not been used in any project yet.', 'لم يتم استخدام هذه المادة في أي مشروع بعد.')}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {relatedProjects.map((project) => {
              const materialLine = project.materials.find((m) => m.materialId === id)
              return (
                <Link
                  key={project.id}
                  to={`/projects/${project.id}`}
                  className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-brand-50/40 transition-colors border border-transparent hover:border-gray-100"
                >
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-brand-900 truncate">{project.name}</h4>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      {project.customerName && (
                        <span className="inline-flex items-center gap-1">
                          <Building2 size={11} />
                          {project.customerName}
                        </span>
                      )}
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
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    {materialLine && (
                      <div className="text-right">
                        <p className="text-sm font-semibold text-brand-800">
                          {materialLine.quantity} {materialLine.weightUnit}
                        </p>
                        <p className="text-xs text-gray-400">
                          @ {materialLine.currency} {materialLine.unitPrice.toLocaleString()}
                        </p>
                      </div>
                    )}
                    <span className={`status-badge ${statusColors[project.status]}`}>
                      {t(statusLabels[project.status].en, statusLabels[project.status].ar)}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
