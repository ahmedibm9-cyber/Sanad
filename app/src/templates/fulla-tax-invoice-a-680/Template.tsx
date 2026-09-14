import type { TemplateProps } from '../types'
import { renderFullaTemplate } from '../fullaTemplateRenderer'
import { adaptForTemplate } from '../fullaSchemaAdapter'
import '../fullaTemplateStyles.css'

function TaxInvoiceATemplate({ data, lang }: TemplateProps) {
  const templateData = adaptForTemplate(data, 'fulla-tax-invoice-a-680')
  const html = renderFullaTemplate('invoice-tax-a', templateData)

  return (
    <div dir={lang === 'ar' ? 'rtl' : 'ltr'} className={lang === 'ar' ? 'font-arabic' : ''} dangerouslySetInnerHTML={{ __html: html }} />
  )
}

export default TaxInvoiceATemplate
