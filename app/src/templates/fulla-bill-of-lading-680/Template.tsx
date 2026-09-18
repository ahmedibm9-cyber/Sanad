import type { TemplateProps } from '../types'
import { renderFullaTemplate } from '../fullaTemplateRenderer'
import { adaptForTemplate } from '../fullaSchemaAdapter'
import '../fullaTemplateStyles.css'

function BillOfLadingTemplate({ data, lang }: TemplateProps) {
  const templateData = adaptForTemplate(data, 'fulla-bill-of-lading-680')
  const html = renderFullaTemplate('bill-of-lading', templateData)

  return (
    <div dir={lang === 'ar' ? 'rtl' : 'ltr'} className={lang === 'ar' ? 'font-arabic' : ''} dangerouslySetInnerHTML={{ __html: html }} />
  )
}

export default BillOfLadingTemplate
