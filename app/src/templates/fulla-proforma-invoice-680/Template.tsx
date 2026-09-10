import type { TemplateProps } from '../types'
import { renderFullaTemplate } from '../fullaTemplateRenderer'
import { adaptForTemplate } from '../fullaSchemaAdapter'
import '../fullaTemplateStyles.css'

function ProformaInvoiceTemplate({ data, lang }: TemplateProps) {
  const templateData = adaptForTemplate(data, 'fulla-proforma-invoice-680')
  const html = renderFullaTemplate('invoice-proforma', templateData)

  return (
    <div dir={lang === 'ar' ? 'rtl' : 'ltr'} className={lang === 'ar' ? 'font-arabic' : ''} dangerouslySetInnerHTML={{ __html: html }} />
  )
}

export default ProformaInvoiceTemplate
