import type { TemplateProps } from '../types'
import { renderFullaTemplate } from '../fullaTemplateRenderer'
import { adaptForTemplate } from '../fullaSchemaAdapter'
import '../fullaTemplateStyles.css'

function CommercialInvoiceTemplate({ data, lang }: TemplateProps) {
  const templateData = adaptForTemplate(data, 'fulla-commercial-invoice-680')
  const html = renderFullaTemplate('invoice-commercial', templateData)

  return (
    <div
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
      className={lang === 'ar' ? 'font-arabic' : ''}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

export default CommercialInvoiceTemplate
