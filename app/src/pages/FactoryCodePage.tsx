import { useState, useMemo } from 'react'
import { Search, Download, Upload, FileSpreadsheet, Database, CheckCircle, AlertCircle, Info, X } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import { useCompany } from '../contexts/CompanyContext'
import { factoryCodes } from '../data/mockData'

type UploadStep = 'select' | 'validate' | 'preview' | 'summary'

export default function FactoryCodePage() {
  const { t } = useLanguage()
  const { currentCompany } = useCompany()
  const [search, setSearch] = useState('')
  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploadStep, setUploadStep] = useState<UploadStep>('select')
  const [selectedFile, setSelectedFile] = useState<string | null>(null)

  const filtered = useMemo(() => {
    if (!search.trim()) return factoryCodes
    const q = search.toLowerCase()
    return factoryCodes.filter(
      fc =>
        fc.factoryCode.toLowerCase().includes(q) ||
        fc.factoryName.toLowerCase().includes(q) ||
        fc.city.toLowerCase().includes(q) ||
        fc.region.toLowerCase().includes(q) ||
        fc.activity.toLowerCase().includes(q) ||
        fc.product.toLowerCase().includes(q) ||
        fc.hsCode.toLowerCase().includes(q)
    )
  }, [search])

  const [exportMsg, setExportMsg] = useState<string | null>(null)

  const handleExportFiltered = () => {
    setExportMsg(`Exported ${filtered.length} filtered records to Excel`)
    setTimeout(() => setExportMsg(null), 2000)
  }

  const handleExportFull = () => {
    setExportMsg(`Exported full database (${factoryCodes.length} records) to Excel`)
    setTimeout(() => setExportMsg(null), 2000)
  }

  const handleOpenUpload = () => {
    setUploadOpen(true)
    setUploadStep('select')
    setSelectedFile(null)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file.name)
      setUploadStep('validate')
      // Auto-advance after mock validation
      setTimeout(() => setUploadStep('preview'), 1200)
    }
  }

  const handleApplyUpdate = () => {
    setUploadStep('summary')
  }

  const handleCloseUpload = () => {
    setUploadOpen(false)
    setUploadStep('select')
    setSelectedFile(null)
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-6 pt-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-brand-900">{t('Factory Code Database', 'قاعدة أكواد المصانع')}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {t('Browse and manage factory registration codes', 'تصفح وأدر أكواد تسجيل المصانع')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {exportMsg && (
              <span className="text-sm text-green-600 font-medium">{exportMsg}</span>
            )}
            <button onClick={handleExportFiltered} className="btn-secondary">
              <FileSpreadsheet className="w-4 h-4 me-2" />
              {t('Export Filtered Excel', 'تصدير المُصفّى')}
            </button>
            <button onClick={handleExportFull} className="btn-secondary">
              <Database className="w-4 h-4 me-2" />
              {t('Export Full Database', 'تصدير قاعدة البيانات الكاملة')}
            </button>
            <button onClick={handleOpenUpload} className="btn-primary">
              <Upload className="w-4 h-4 me-2" />
              {t('Admin Upload Updated Excel', 'رفع ملف محدّث (مسؤول)')}
            </button>
          </div>
        </div>

        {/* Search bar + count */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={t('Search by code, name, city, activity, product, HS code...', 'بحث بالاسم أو الكود أو المدينة...')}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field ps-10"
            />
          </div>
          <span className="text-sm text-gray-500 whitespace-nowrap">
            {t(`${filtered.length} of ${factoryCodes.length} records`, `${filtered.length} من ${factoryCodes.length} سجل`)}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-6 pb-6">
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/80">
                <th className="text-start px-4 py-3 font-semibold text-gray-700">{t('Factory Code', 'كود المصنع')}</th>
                <th className="text-start px-4 py-3 font-semibold text-gray-700">{t('Factory Name', 'اسم المصنع')}</th>
                <th className="text-start px-4 py-3 font-semibold text-gray-700">{t('City', 'المدينة')}</th>
                <th className="text-start px-4 py-3 font-semibold text-gray-700">{t('Region', 'المنطقة')}</th>
                <th className="text-start px-4 py-3 font-semibold text-gray-700">{t('Activity', 'النشاط')}</th>
                <th className="text-start px-4 py-3 font-semibold text-gray-700">{t('Product', 'المنتج')}</th>
                <th className="text-start px-4 py-3 font-semibold text-gray-700">{t('HS Code', 'كود النظام المنسق')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(fc => (
                <tr key={fc.id} className="border-b border-gray-100 table-row-hover">
                  <td className="px-4 py-3 font-mono text-brand-700 font-medium">{fc.factoryCode}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{fc.factoryName}</div>
                    {fc.factoryNameAr && (
                      <div className="text-xs text-gray-400 mt-0.5">{fc.factoryNameAr}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{fc.city}</td>
                  <td className="px-4 py-3">
                    <span className="status-badge bg-blue-50 text-blue-700">{fc.region}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{fc.activity}</td>
                  <td className="px-4 py-3 text-gray-600">{fc.product}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{fc.hsCode}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="empty-state py-12 text-center text-gray-400">
                    {t('No factory codes match your search.', 'لا توجد أكواد مطابقة لبحثك.')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Modal */}
      {uploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="card w-full max-w-2xl mx-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-brand-900">
                {t('Upload Updated Factory Code Excel', 'رفع ملف أكواد المصانع المحدّث')}
              </h2>
              <button onClick={handleCloseUpload} className="btn-ghost p-1.5">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-5">
              {/* Step Indicator */}
              <div className="flex items-center gap-2 mb-6">
                {(['select', 'validate', 'preview', 'summary'] as UploadStep[]).map((step, i) => (
                  <div key={step} className="flex items-center gap-2">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                        uploadStep === step
                          ? 'bg-brand-700 text-white'
                          : (['select', 'validate', 'preview', 'summary'].indexOf(uploadStep) > i
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-200 text-gray-500')
                      }`}
                    >
                      {(['select', 'validate', 'preview', 'summary'].indexOf(uploadStep) > i) ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        i + 1
                      )}
                    </div>
                    {i < 3 && <div className="w-8 h-px bg-gray-300" />}
                  </div>
                ))}
              </div>

              {/* Step: Select */}
              {uploadStep === 'select' && (
                <div>
                  <p className="text-sm text-gray-600 mb-4">
                    {t(
                      'Select the updated factory code Excel file (.xlsx). The system will validate the format and compare against the existing database.',
                      'اختر ملف أكواد المصانع المحدّث (.xlsx). سيتحقق النظام من الصيغة ومقارنتها مع قاعدة البيانات الحالية.'
                    )}
                  </p>
                  <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors">
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-sm font-medium text-gray-600">
                      {t('Click to select file', 'انقر لاختيار الملف')}
                    </span>
                    <span className="text-xs text-gray-400 mt-1">.xlsx</span>
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                  </label>
                </div>
              )}

              {/* Step: Validate */}
              {uploadStep === 'validate' && (
                <div className="flex flex-col items-center py-8">
                  <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-700 rounded-full animate-spin mb-4" />
                  <p className="text-sm font-medium text-gray-700">
                    {t('Validating file format and structure...', 'التحقق من صيغة الملف وبنيته...')}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">{selectedFile}</p>
                </div>
              )}

              {/* Step: Preview */}
              {uploadStep === 'preview' && (
                <div>
                  <div className="flex items-center gap-2 mb-3 p-3 bg-green-50 rounded-lg border border-green-200">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <p className="text-sm text-green-800">
                      {t('File validated successfully. Preview the changes below.', 'تم التحقق من الملف بنجاح. شاهد التغييرات أدناه.')}
                    </p>
                  </div>
                  <div className="text-sm text-gray-700 mb-3">
                    <p className="font-medium mb-1">{selectedFile}</p>
                    <p className="text-gray-500">
                      {t('15,500 records detected across 7 columns', 'تم اكتشاف 15,500 سجل عبر 7 أعمدة')}
                    </p>
                  </div>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="text-start px-3 py-2 font-semibold text-gray-600">{t('Factory Code', 'كود المصنع')}</th>
                          <th className="text-start px-3 py-2 font-semibold text-gray-600">{t('Factory Name', 'اسم المصنع')}</th>
                          <th className="text-start px-3 py-2 font-semibold text-gray-600">{t('City', 'المدينة')}</th>
                          <th className="text-start px-3 py-2 font-semibold text-gray-600">{t('Activity', 'النشاط')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-gray-100">
                          <td className="px-3 py-2 font-mono">100001</td>
                          <td className="px-3 py-2">Saudi Basic Industries Corp (SABIC)</td>
                          <td className="px-3 py-2">Riyadh</td>
                          <td className="px-3 py-2">Petrochemicals</td>
                        </tr>
                        <tr className="border-b border-gray-100">
                          <td className="px-3 py-2 font-mono">100035</td>
                          <td className="px-3 py-2 text-green-700">New Factory Inc. (+)</td>
                          <td className="px-3 py-2">Riyadh</td>
                          <td className="px-3 py-2">Manufacturing</td>
                        </tr>
                        <tr>
                          <td className="px-3 py-2 font-mono">100002</td>
                          <td className="px-3 py-2">SABIC - Jubail Petrochemicals</td>
                          <td className="px-3 py-2">Jubail</td>
                          <td className="px-3 py-2">Petrochemicals</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Step: Summary */}
              {uploadStep === 'summary' && (
                <div>
                  <div className="flex items-center gap-2 mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <p className="text-sm font-medium text-green-800">
                      {t('Smart Update Complete', 'اكتمل التحديث الذكي')}
                    </p>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    {t(
                      'The factory code database has been updated. Here is a summary of the changes:',
                      'تم تحديث قاعدة بيانات أكواد المصانع. ملخص التغييرات:'
                    )}
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                      <div className="text-2xl font-bold text-green-700">3,000</div>
                      <div className="text-sm text-green-600">{t('New Records Added', 'سجل جديد مضاف')}</div>
                    </div>
                    <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                      <div className="text-2xl font-bold text-amber-700">500</div>
                      <div className="text-sm text-amber-600">{t('Updated Records', 'سجل محدّث')}</div>
                    </div>
                    <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                      <div className="text-2xl font-bold text-blue-700">12,500</div>
                      <div className="text-sm text-blue-600">{t('Unchanged Records', 'سجل不变')}</div>
                    </div>
                    <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                      <div className="text-2xl font-bold text-gray-700">1,000</div>
                      <div className="text-sm text-gray-600">{t('Retained (Not in File)', 'محفوظ (غير موجود بالملف)')}</div>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-gray-500">
                        {t(
                          'Total database: 17,000 records. The update was applied at ' + new Date().toLocaleString(),
                          'الإجمالي: 17,000 سجل. تم التطبيق في ' + new Date().toLocaleString()
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-200">
              {uploadStep === 'select' && (
                <button onClick={handleCloseUpload} className="btn-ghost">
                  {t('Cancel', 'إلغاء')}
                </button>
              )}
              {uploadStep === 'preview' && (
                <>
                  <button onClick={handleCloseUpload} className="btn-ghost">
                    {t('Cancel', 'إلغاء')}
                  </button>
                  <button onClick={handleApplyUpdate} className="btn-primary">
                    <CheckCircle className="w-4 h-4 me-2" />
                    {t('Apply Smart Update', 'تطبيق التحديث الذكي')}
                  </button>
                </>
              )}
              {uploadStep === 'summary' && (
                <button onClick={handleCloseUpload} className="btn-primary">
                  {t('Done', 'تم')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
