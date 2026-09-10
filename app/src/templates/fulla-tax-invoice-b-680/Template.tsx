import type { TemplateProps } from '../types'
import { A4Page } from '../primitives/A4Page'
import { adaptInvoice, adaptSettings } from '../fullaDataAdapter'
import { invoicePaper } from '../fullaInvoiceRenderer'

function TaxInvoiceBTemplate({ data, lang }: TemplateProps) {
  const v = adaptInvoice(data, 'tax')
  const s = adaptSettings(data.company)
  const html = invoicePaper(v, 'bilingual', s, lang)

  return (
    <A4Page templateKey="fulla-tax-invoice-b-680" lang={lang}>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </A4Page>
  )
}

export default TaxInvoiceBTemplate
