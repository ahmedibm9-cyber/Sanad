import type { TemplateProps } from '../types'
import { A4Page } from '../primitives/A4Page'
import { adaptInvoice, adaptSettings } from '../fullaDataAdapter'
import { invoicePaper } from '../fullaInvoiceRenderer'

function CommercialInvoice({ data, lang }: TemplateProps) {
  const v = adaptInvoice(data, 'commercial')
  const s = adaptSettings(data.company)
  const html = invoicePaper(v, 'modern', s, lang)

  return (
    <A4Page templateKey="fulla-commercial-invoice-680" lang={lang}>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </A4Page>
  )
}

export default CommercialInvoice
