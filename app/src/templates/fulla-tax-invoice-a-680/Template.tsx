import type { TemplateProps } from '../types'
import { A4Page } from '../primitives/A4Page'
import { adaptInvoice, adaptSettings } from '../fullaDataAdapter'
import { invoicePaper } from '../fullaInvoiceRenderer'

function TaxInvoiceATemplate({ data, lang }: TemplateProps) {
  const v = adaptInvoice(data, 'tax')
  const s = adaptSettings(data.company)
  const html = invoicePaper(v, 'classic', s, lang)

  return (
    <A4Page templateKey="fulla-tax-invoice-a-680" lang={lang}>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </A4Page>
  )
}

export default TaxInvoiceATemplate
