import type { TemplateProps } from '../types'
import { renderFullaTemplate } from '../fullaTemplateRenderer'
import { adaptForTemplate } from '../fullaSchemaAdapter'

function ProformaInvoiceTemplate({ data, lang }: TemplateProps) {
  const templateData = adaptForTemplate(data, 'fulla-proforma-invoice-680')
  const html = renderFullaTemplate('invoice-proforma', templateData)

  return (
    <div
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
      className={lang === 'ar' ? 'font-arabic' : ''}
      style={{
        fontFamily: lang === 'ar' ? "'Noto Sans Arabic', sans-serif" : "'Inter', sans-serif",
        width: '210mm',
        minHeight: '297mm',
        margin: '0 auto',
        background: '#fff',
      }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

export default ProformaInvoiceTemplate
