import type { TemplateProps } from '../types'
import { renderFullaTemplate, getFullaTemplateCSS } from '../fullaTemplateRenderer'
import { adaptForTemplate } from '../fullaSchemaAdapter'

function CommercialInvoiceTemplate({ data, lang }: TemplateProps) {
  const templateData = adaptForTemplate(data, 'fulla-commercial-invoice-680')
  const html = renderFullaTemplate('invoice-commercial', templateData)
  const css = getFullaTemplateCSS()

  return (
    <div
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
      className={lang === 'ar' ? 'font-arabic' : ''}
      style={{
        fontFamily: lang === 'ar' ? "'Noto Sans Arabic', sans-serif" : "'Inter', sans-serif",
        background: '#fff',
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  )
}

export default CommercialInvoiceTemplate
