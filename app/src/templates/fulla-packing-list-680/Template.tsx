import type { TemplateProps } from '../types'
import { A4Page } from '../primitives/A4Page'
import { adaptPacking, adaptSettings } from '../fullaDataAdapter'
import { packingPaper } from '../fullaPackingRenderer'

function PackingListTemplate({ data, lang }: TemplateProps) {
  const p = adaptPacking(data)
  const s = adaptSettings(data.company)
  const html = packingPaper(p, 'detailed', s, lang)

  return (
    <A4Page templateKey="fulla-packing-list-680" lang={lang}>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </A4Page>
  )
}

export default PackingListTemplate
