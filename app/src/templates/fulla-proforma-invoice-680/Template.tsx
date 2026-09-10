import type { TemplateProps } from '../types'
import { A4Page } from '../primitives/A4Page'
import { adaptInvoice, adaptSettings } from '../fullaDataAdapter'
import { invoicePaper } from '../fullaInvoiceRenderer'

function ProformaInvoice({ data, lang }: TemplateProps) {
  const v = adaptInvoice(data, 'proforma')
  const s = adaptSettings(data.company)
  const html = invoicePaper(v, 'elegant', s, lang)

  return (
    <A4Page templateKey="fulla-proforma-invoice-680" lang={lang}>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </A4Page>
  )
}

export default ProformaInvoice
