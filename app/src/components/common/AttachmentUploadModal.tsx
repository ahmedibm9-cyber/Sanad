import { useState } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import Modal from './Modal'
import { Upload, FileText, X } from 'lucide-react'

interface AttachmentUploadModalProps {
  open: boolean
  onClose: () => void
  onSave: (attachment: { name: string; category: string; description: string }) => void
}

export default function AttachmentUploadModal({ open, onClose, onSave }: AttachmentUploadModalProps) {
  const { t } = useLanguage()
  const [fileName, setFileName] = useState('')
  const [category, setCategory] = useState('general')
  const [description, setDescription] = useState('')

  const handleSave = () => {
    onSave({ name: fileName || 'uploaded-file.pdf', category, description })
    setFileName('')
    setCategory('general')
    setDescription('')
    onClose()
  }

  return (
    <Modal
      open={open} onClose={onClose} size="md"
      title={t('Upload Attachment', 'رفع مرفق')}
      subtitle={t('Add a file to this project', 'إضافة ملف إلى هذا المشروع')}
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">{t('Cancel', 'إلغاء')}</button>
          <button onClick={handleSave} className="btn-primary" disabled={!fileName}>
            {t('Upload', 'رفع')}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="label-field">{t('File', 'الملف')} *</label>
          {fileName ? (
            <div className="flex items-center gap-2 px-3 py-3 bg-green-50 border border-green-200 rounded-lg">
              <FileText size={18} className="text-green-600" />
              <span className="text-sm text-green-700 flex-1">{fileName}</span>
              <button onClick={() => setFileName('')} className="p-1 hover:bg-green-100 rounded"><X size={14} /></button>
            </div>
          ) : (
            <label className="flex flex-col items-center gap-2 px-6 py-8 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
              <Upload size={24} className="text-gray-400" />
              <span className="text-sm text-gray-500">{t('Click to select a file or drag & drop', 'انقر لاختيار ملف أو اسحب وأفلت')}</span>
              <span className="text-xs text-gray-400">PDF, DOC, DOCX, XLS, XLSX, JPG, PNG</span>
              <input type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) setFileName(f.name) }} />
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
        <div>
          <label className="label-field">{t('Description', 'الوصف')}</label>
          <textarea className="input-field" rows={2} value={description} onChange={e => setDescription(e.target.value)} placeholder={t('Optional description...', 'وصف اختياري...')} />
        </div>
      </div>
    </Modal>
  )
}
