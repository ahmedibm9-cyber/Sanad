import type { TemplateProps } from '../types'
import { renderFullaTemplate } from '../fullaTemplateRenderer'
import { adaptForTemplate } from '../fullaSchemaAdapter'
import '../fullaTemplateStyles.css'

function QuotationTemplate({ data, lang }: TemplateProps) {
  const templateData = adaptForTemplate(data, 'fulla-quotation-680')
  const html = renderFullaTemplate('quotation', templateData)

  return (
    <div dir={lang === 'ar' ? 'rtl' : 'ltr'} className={lang === 'ar' ? 'font-arabic' : ''} dangerouslySetInnerHTML={{ __html: html }} />
  )
}

export default QuotationTemplate
