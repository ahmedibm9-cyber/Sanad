import type { TemplateProps } from '../types'
import { A4Page } from '../primitives/A4Page'
import { adaptInvoice, adaptSettings } from '../fullaDataAdapter'
import { quotePaper } from '../fullaInvoiceRenderer'

function QuotationTemplate({ data, lang }: TemplateProps) {
  const v = adaptInvoice(data, 'quotation')
  const s = adaptSettings(data.company)
  const html = quotePaper(v, 'classic', s, lang)

  return (
    <A4Page templateKey="fulla-quotation-680" lang={lang}>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </A4Page>
  )
}

export default QuotationTemplate
