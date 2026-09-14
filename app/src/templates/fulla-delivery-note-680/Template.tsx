import type { TemplateProps } from '../types'
import { renderFullaTemplate } from '../fullaTemplateRenderer'
import { adaptForTemplate } from '../fullaSchemaAdapter'
import '../fullaTemplateStyles.css'

function DeliveryNoteTemplate({ data, lang }: TemplateProps) {
  const templateData = adaptForTemplate(data, 'fulla-delivery-note-680')
  const html = renderFullaTemplate('delivery-note', templateData)

  return (
    <div dir={lang === 'ar' ? 'rtl' : 'ltr'} className={lang === 'ar' ? 'font-arabic' : ''} dangerouslySetInnerHTML={{ __html: html }} />
  )
}

export default DeliveryNoteTemplate
