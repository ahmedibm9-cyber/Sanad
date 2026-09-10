import { useState, useEffect, useRef, useMemo } from 'react'
import { Search, Download, Upload, FileSpreadsheet, Database, CheckCircle, AlertCircle, Info, X } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import { useCompany } from '../contexts/CompanyContext'
import { useAuth } from '../contexts/AuthContext'
import { useFactoryCodeSearch, useFactoryCodeAll } from '../hooks/useData'
import { exportFactoryCodeFiltered, exportFactoryCodeFull } from '../lib/excelExport'
import { FactoryCodeService, type ImportSummary, type ImportPreviewRow } from '../lib/services/factoryCode'

type UploadStep = 'select' | 'validate' | 'preview' | 'summary'

function useDebouncedValue(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

export default function FactoryCodePage() {
  const { t } = useLanguage()
  const { currentCompany, permissions } = useCompany()
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 400)
  const { data, loading, error } = useFactoryCodeSearch(debouncedSearch)
  const results = data ?? []
  const { data: allDataRaw } = useFactoryCodeAll()
  const allData = allDataRaw ?? []

  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploadStep, setUploadStep] = useState<UploadStep>('select')
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [selectedFileObj, setSelectedFileObj] = useState<File | null>(null)
  const [parsedRows, setParsedRows] = useState<Array<Record<string, unknown>>>([])
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null)
  const [importError, setImportError] = useState<string | null>(null)

  const requestContext = useMemo(() => {
    if (!user || !currentCompany?.id) return null
    return {
      userId: user.id,
      companyId: currentCompany.id,
      permissions: permissions?.permissions || {},
      isSystemAdmin: user.isSystemAdmin || false,
    }
  }, [user, currentCompany, permissions])

  const [exportMsg, setExportMsg] = useState<string | null>(null)

  const handleExportFiltered = () => {
    exportFactoryCodeFiltered(results)
    setExportMsg(`Exported ${results.length} filtered records to Excel`)
    setTimeout(() => setExportMsg(null), 2000)
  }

  const handleExportFull = () => {
    exportFactoryCodeFull(allData)
    setExportMsg(`Exported ${allData.length} records to Excel`)
    setTimeout(() => setExportMsg(null), 2000)
  }

  const handleOpenUpload = () => {
    setUploadOpen(true)
    setUploadStep('select')
    setSelectedFile(null)
    setSelectedFileObj(null)
    setParsedRows([])
    setImportSummary(null)
    setImportError(null)
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setSelectedFile(file.name)
    setSelectedFileObj(file)
    setUploadStep('validate')
    setImportError(null)

    try {
      const buffer = await file.arrayBuffer()
      const rows = FactoryCodeService.parseExcelFile(buffer)
      if (rows.length === 0) {
        setImportError('The file contains no data rows.')
        setUploadStep('select')
        return
      }
      setParsedRows(rows)
      setUploadStep('preview')
    } catch {
      setImportError('Failed to parse the Excel file. Please check the format.')
      setUploadStep('select')
    }
  }

  const handleApplyUpdate = async () => {
    if (!requestContext || parsedRows.length === 0) return
    setUploadStep('validate')
    setImportError(null)

    try {
      const service = new FactoryCodeService()
      const summary = await service.smartMerge(parsedRows, requestContext, selectedFile || 'uploaded-file.xlsx')
      setImportSummary(summary)
      setUploadStep('summary')
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Import failed. Please try again.')
      setUploadStep('preview')
    }
  }

  const handleCloseUpload = () => {
    setUploadOpen(false)
    setUploadStep('select')
    setSelectedFile(null)
    setSelectedFileObj(null)
    setParsedRows([])
    setImportSummary(null)
    setImportError(null)
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
            {loading
              ? t('Searching...', 'جارٍ البحث...')
              : debouncedSearch
                ? t(`${results.length} results`, `${results.length} نتيجة`)
                : t('Type to search', 'اكتب للبحث')
            }
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-6 pb-6">
        <div className="card overflow-hidden">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-700 rounded-full animate-spin mb-4" />
              <p className="text-sm text-gray-500">{t('Searching factory codes...', 'جارٍ البحث في أكواد المصانع...')}</p>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-4 text-sm text-red-700 bg-red-50 border-b border-red-200">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {t('Failed to load factory codes. Please try again.', 'فشل تحميل أكواد المصانع. يرجى المحاولة مرة أخرى.')}
            </div>
          )}

          {!loading && !error && (
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
                {results.map(fc => (
                  <tr key={fc.id} className="border-b border-gray-100 table-row-hover">
                    <td className="px-4 py-3 font-mono text-brand-700 font-medium">{fc.factory_code}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{fc.factory_name}</div>
                      {fc.factory_name_ar && (
                        <div className="text-xs text-gray-400 mt-0.5">{fc.factory_name_ar}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{fc.city}</td>
                    <td className="px-4 py-3">
                      <span className="status-badge bg-blue-50 text-blue-700">{fc.region}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{fc.activity}</td>
                    <td className="px-4 py-3 text-gray-600">{fc.product}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{fc.hs_code}</td>
                  </tr>
                ))}
                {results.length === 0 && !loading && debouncedSearch && (
                  <tr>
                    <td colSpan={7} className="empty-state py-12 text-center text-gray-400">
                      {t('No factory codes match your search.', 'لا توجد أكواد مطابقة لبحثك.')}
                    </td>
                  </tr>
                )}
                {!debouncedSearch && results.length === 0 && (
                  <tr>
                    <td colSpan={7} className="empty-state py-12 text-center text-gray-400">
                      {t('Type in the search box to find factory codes.', 'اكتب في مربع البحث للعثور على أكواد المصانع.')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
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
              <button onClick={handleCloseUpload} className="btn-ghost p-1.5" aria-label={t('Close', 'إغلاق')}>
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
                    {selectedFileObj
                      ? t('Parsing Excel file...', 'جارٍ تحليل ملف Excel...')
                      : t('Applying smart merge...', 'جارٍ تطبيق الدمج الذكي...')}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">{selectedFile}</p>
                </div>
              )}

              {/* Step: Preview */}
              {uploadStep === 'preview' && (
                <div>
                  {importError && (
                    <div className="flex items-center gap-2 mb-3 p-3 bg-red-50 rounded-lg border border-red-200">
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                      <p className="text-sm text-red-800">{importError}</p>
                    </div>
                  )}
                  <div className="flex items-center gap-2 mb-3 p-3 bg-green-50 rounded-lg border border-green-200">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <p className="text-sm text-green-800">
                      {t('File parsed successfully. Review the preview below.', 'تم تحليل الملف بنجاح. راجع المعاينة أدناه.')}
                    </p>
                  </div>
                  <div className="text-sm text-gray-700 mb-3">
                    <p className="font-medium mb-1">{selectedFile}</p>
                    <p className="text-gray-500">
                      {t(`${parsedRows.length} records detected`, `تم اكتشاف ${parsedRows.length} سجل`)}
                    </p>
                  </div>
                  <div className="border border-gray-200 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0">
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="text-start px-3 py-2 font-semibold text-gray-600">{t('Factory Code', 'كود المصنع')}</th>
                          <th className="text-start px-3 py-2 font-semibold text-gray-600">{t('Factory Name', 'اسم المصنع')}</th>
                          <th className="text-start px-3 py-2 font-semibold text-gray-600">{t('City', 'المدينة')}</th>
                          <th className="text-start px-3 py-2 font-semibold text-gray-600">{t('Product', 'المنتج')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedRows.slice(0, 20).map((row, i) => (
                          <tr key={i} className="border-b border-gray-100">
                            <td className="px-3 py-2 font-mono">{String(row['Factory Code'] ?? row['factory_code'] ?? '')}</td>
                            <td className="px-3 py-2">{String(row['Factory Name'] ?? row['factory_name'] ?? '')}</td>
                            <td className="px-3 py-2">{String(row['City'] ?? row['city'] ?? '')}</td>
                            <td className="px-3 py-2">{String(row['Product'] ?? row['product'] ?? '')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {parsedRows.length > 20 && (
                    <p className="text-xs text-gray-400 mt-2 text-center">
                      {t(`Showing 20 of ${parsedRows.length} rows`, `عرض 20 من أصل ${parsedRows.length} صف`)}
                    </p>
                  )}
                </div>
              )}

              {/* Step: Summary */}
              {uploadStep === 'summary' && importSummary && (
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
                      <div className="text-2xl font-bold text-green-700">{importSummary.inserted.toLocaleString()}</div>
                      <div className="text-sm text-green-600">{t('New Records Added', 'سجل جديد مضاف')}</div>
                    </div>
                    <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                      <div className="text-2xl font-bold text-amber-700">{importSummary.updated.toLocaleString()}</div>
                      <div className="text-sm text-amber-600">{t('Updated Records', 'سجل محدّث')}</div>
                    </div>
                    <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                      <div className="text-2xl font-bold text-blue-700">{importSummary.unchanged.toLocaleString()}</div>
                      <div className="text-sm text-blue-600">{t('Unchanged Records', 'سجل不变')}</div>
                    </div>
                    <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                      <div className="text-2xl font-bold text-gray-700">{importSummary.retained.toLocaleString()}</div>
                      <div className="text-sm text-gray-600">{t('Retained (Not in File)', 'محفوظ (غير موجود بالملف)')}</div>
                    </div>
                  </div>
                  {importSummary.errors > 0 && (
                    <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                        <p className="text-sm text-red-700">
                          {t(`${importSummary.errors} rows had errors and were skipped`, `تم تخطي ${importSummary.errors} صف بسبب أخطاء`)}
                        </p>
                      </div>
                    </div>
                  )}
                  {importSummary.preview.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs font-medium text-gray-500 mb-2">{t('Sample changes:', 'عينة من التغييرات:')}</p>
                      <div className="border border-gray-200 rounded-lg overflow-hidden max-h-40 overflow-y-auto">
                        <table className="w-full text-xs">
                          <thead className="sticky top-0">
                            <tr className="bg-gray-50 border-b border-gray-200">
                              <th className="text-start px-3 py-1.5 font-semibold text-gray-600">{t('Code', 'الكود')}</th>
                              <th className="text-start px-3 py-1.5 font-semibold text-gray-600">{t('Name', 'الاسم')}</th>
                              <th className="text-start px-3 py-1.5 font-semibold text-gray-600">{t('Action', 'الإجراء')}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {importSummary.preview.slice(0, 10).map((row, i) => (
                              <tr key={i} className="border-b border-gray-100">
                                <td className="px-3 py-1.5 font-mono">{row.factory_code}</td>
                                <td className="px-3 py-1.5">{row.factory_name}</td>
                                <td className="px-3 py-1.5">
                                  <span className={`status-badge ${
                                    row.action === 'add' ? 'bg-green-50 text-green-700' :
                                    row.action === 'update' ? 'bg-amber-50 text-amber-700' :
                                    'bg-gray-100 text-gray-600'
                                  }`}>
                                    {row.action === 'add' ? t('New', 'جديد') :
                                     row.action === 'update' ? t('Updated', 'محدّث') :
                                     t('Unchanged', '不变')}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-gray-500">
                        {t(
                          'Total database: ' + (importSummary.inserted + importSummary.updated + importSummary.unchanged + importSummary.retained).toLocaleString() + ' records. Applied at ' + new Date().toLocaleString(),
                          'الإجمالي: ' + (importSummary.inserted + importSummary.updated + importSummary.unchanged + importSummary.retained).toLocaleString() + ' سجل. تم التطبيق في ' + new Date().toLocaleString()
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
                  <button onClick={handleApplyUpdate} className="btn-primary" disabled={!requestContext}>
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
