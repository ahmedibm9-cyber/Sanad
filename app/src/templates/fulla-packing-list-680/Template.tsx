import type { TemplateProps } from '../types'
import { renderFullaTemplate } from '../fullaTemplateRenderer'
import { adaptForTemplate } from '../fullaSchemaAdapter'
import '../fullaTemplateStyles.css'

function PackingListTemplate({ data, lang }: TemplateProps) {
  const templateData = adaptForTemplate(data, 'fulla-packing-list-680')
  const html = renderFullaTemplate('packing-list', templateData)

  return (
    <div dir={lang === 'ar' ? 'rtl' : 'ltr'} className={lang === 'ar' ? 'font-arabic' : ''} dangerouslySetInnerHTML={{ __html: html }} />
  )
}

export default PackingListTemplate
