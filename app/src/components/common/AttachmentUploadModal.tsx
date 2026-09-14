import { useState } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import Modal from './Modal'
import { Upload, FileText, X } from 'lucide-react'

interface AttachmentUploadModalProps {
  open: boolean
  onClose: () => void
  onSave: (attachment: { file: File; category: string }) => Promise<void> | void
}

export default function AttachmentUploadModal({ open, onClose, onSave }: AttachmentUploadModalProps) {
  const { t } = useLanguage()
  const [file, setFile] = useState<File | null>(null)
  const [category, setCategory] = useState('general')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const selectFile = (selected: File | undefined) => {
    if (!selected) return
    setFile(selected)
    setError('')
  }

  const reset = () => {
    setFile(null)
    setCategory('general')
    setError('')
  }

  const handleSave = async () => {
    if (!file) return

    setSaving(true)
    setError('')
    try {
      await onSave({ file, category })
      reset()
      onClose()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('Upload failed. Please try again.', 'فشل الرفع. يرجى المحاولة مرة أخرى.'))
    } finally {
      setSaving(false)
    }
  }

  const handleClose = () => {
    if (saving) return
    reset()
    onClose()
  }

  return (
    <Modal
      open={open} onClose={handleClose} size="md"
      title={t('Upload Attachment', 'رفع مرفق')}
      subtitle={t('Add a file to this project', 'إضافة ملف إلى هذا المشروع')}
      footer={
        <>
          <button onClick={handleClose} className="btn-secondary" disabled={saving}>{t('Cancel', 'إلغاء')}</button>
          <button onClick={handleSave} className="btn-primary" disabled={!file || saving}>
            {t('Upload', 'رفع')}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="label-field">{t('File', 'الملف')} *</label>
          {file ? (
            <div className="flex items-center gap-2 px-3 py-3 bg-green-50 border border-green-200 rounded-lg">
              <FileText size={18} className="text-green-600" />
              <span className="text-sm text-green-700 flex-1">{file.name}</span>
              <button onClick={() => setFile(null)} className="p-1 hover:bg-green-100 rounded" disabled={saving} aria-label={t('Remove file', 'إزالة الملف')}><X size={14} /></button>
            </div>
          ) : (
            <label
              className="flex flex-col items-center gap-2 px-6 py-8 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors"
              onDragOver={event => event.preventDefault()}
              onDrop={event => { event.preventDefault(); selectFile(event.dataTransfer.files[0]) }}
            >
              <Upload size={24} className="text-gray-400" />
              <span className="text-sm text-gray-500">{t('Click to select a file or drag & drop', 'انقر لاختيار ملف أو اسحب وأفلت')}</span>
              <span className="text-xs text-gray-400">PDF, DOC, DOCX, XLS, XLSX, JPG, PNG</span>
              <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png" className="hidden" disabled={saving} onChange={(e) => selectFile(e.target.files?.[0])} />
            </label>
          )}
        </div>
        <div>
          <label className="label-field">{t('Category', 'الفئة')}</label>
          <select className="select-field" value={category} onChange={e => setCategory(e.target.value)}>
            <option value="general">{t('General', 'عام')}</option>
            <option value="certificate">{t('Certificate', 'شهادة')}</option>
            <option value="government">{t('Government Document', 'وثيقة حكومية')}</option>
            <option value="client">{t('Client File', 'ملف العميل')}</option>
            <option value="shipping">{t('Shipping Document', 'وثيقة شحن')}</option>
            <option value="other">{t('Other', 'أخرى')}</option>
          </select>
        </div>
        {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
      </div>
    </Modal>
  )
}
