import type { TemplateProps } from '../types'
import { A4Page } from '../primitives/A4Page'
import { adaptLoading, adaptSettings } from '../fullaDataAdapter'
import { loadingPaper } from '../fullaLoadingRenderer'

function DeliveryNoteTemplate({ data, lang }: TemplateProps) {
  const r = adaptLoading(data)
  const s = adaptSettings(data.company)
  const html = loadingPaper(r, 'load-classic', s, lang)

  return (
    <A4Page templateKey="fulla-delivery-note-680" lang={lang}>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </A4Page>
  )
}

export default DeliveryNoteTemplate
