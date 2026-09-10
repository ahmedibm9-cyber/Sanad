import { A4Page } from '../primitives/A4Page'
import { formatDate, formatNumber, l, dir } from '../primitives/format'
import type { TemplateProps, DocRenderItem } from '../types'

/* ── Fulla Packing List Template ─────────────────────────── */
function PackingListTemplate({ data, lang }: TemplateProps) {
  const isAr = lang === 'ar'
  const d = dir(lang)
  const t = (en: string, ar: string) => (isAr ? ar : en)

  const company = data.company
  const customer = data.customer
  const shipping = data.shipping
  const items = data.items ?? []

  /* Computed summaries */
  const totalPackages = items.reduce((sum, it) => sum + (it.packages ?? 0), 0)
  const totalNetWeight = items.reduce((sum, it) => sum + (it.netWeight ?? 0), 0)
  const totalGrossWeight = items.reduce((sum, it) => sum + (it.grossWeight ?? 0), 0)
  const totalCbm = items.reduce((sum, it) => sum + (it.cbm ?? 0), 0)

  return (
    <A4Page templateKey="fulla-packing-list-680" lang={lang}>
      <div dir={d} className={isAr ? 'font-arabic' : ''}>

        {/* ── HEADER ────────────────────────────────── */}
        <header className="flex items-start justify-between gap-4 mb-4">
          {/* Left: Company details */}
          <div className="flex-1 min-w-[200px] text-[10px] leading-tight">
            <p className="font-semibold text-brand-800 text-sm">
              {isAr ? company.nameAr : company.nameEn}
            </p>
            {company.crNumber && (
              <p className="text-gray-600">
                {t('CR', 'سجل تجاري')}: {company.crNumber}
              </p>
            )}
            {company.vatNumber && (
              <p className="text-gray-600">
                {t('VAT', 'رقم ضريبي')}: {company.vatNumber}
              </p>
            )}
            {company.address && (
              <p className="text-gray-600">{company.address}</p>
            )}
            {company.phone && (
              <p className="text-gray-600">
                {t('Tel', 'هاتف')}: {company.phone}
              </p>
            )}
            {company.email && (
              <p className="text-gray-600">{company.email}</p>
            )}
          </div>

          {/* Center: Logo */}
          <div className="flex-shrink-0 flex items-center justify-center w-[120px]">
            {company.logo ? (
              <img
                src={company.logo}
                alt={t('Logo', 'شعار')}
                className="max-h-[70px] max-w-full object-contain"
              />
            ) : (
              <div className="w-[100px] h-[50px] bg-sand-100 border border-sand-300 rounded flex items-center justify-center text-[9px] text-sand-500 font-medium">
                {t('FULLA', 'فولا')}
              </div>
            )}
          </div>

          {/* Right: Document title + number + date */}
          <div className="flex-1 min-w-[200px] text-[10px] leading-tight text-right">
            <h1 className="text-lg font-bold text-brand-800 uppercase tracking-wider mb-1">
              {t('Packing List', 'قائمة التعبئة')}
            </h1>
            <p className="text-gray-600">
              {t('No.', 'رقم')}: <span className="font-semibold text-gray-800">{data.number}</span>
            </p>
            <p className="text-gray-600">
              {t('Date', 'التاريخ')}: <span className="font-semibold text-gray-800">{formatDate(data.date, lang)}</span>
            </p>
            {data.invoiceReference && (
              <p className="text-gray-600">
                {t('Invoice Ref.', 'مرجع الفاتورة')}: <span className="font-semibold text-gray-800">{data.invoiceReference}</span>
              </p>
            )}
          </div>
        </header>

        {/* ── DIVIDER ───────────────────────────────── */}
        <hr className="border-brand-700 border-t-2 mb-3" />

        {/* ── CONSIGNEE + MARKS ROW ─────────────────── */}
        <div className="flex gap-4 mb-3">
          {/* Consignee block */}
          <div className="flex-1 border border-gray-300 rounded p-2">
            <h3 className="text-[9px] font-bold text-brand-700 uppercase tracking-wider mb-1">
              {t('Consignee / Buyer', 'المشتري / المستلم')}
            </h3>
            <p className="text-[10px] font-semibold text-gray-800">
              {customer.name}
            </p>
            {customer.address && (
              <p className="text-[10px] text-gray-600">{customer.address}</p>
            )}
            {(customer.city || customer.country) && (
              <p className="text-[10px] text-gray-600">
                {[customer.city, customer.country].filter(Boolean).join(', ')}
              </p>
            )}
            {customer.phone && (
              <p className="text-[10px] text-gray-600">
                {t('Tel', 'هاتف')}: {customer.phone}
              </p>
            )}
            {customer.email && (
              <p className="text-[10px] text-gray-600">{customer.email}</p>
            )}
          </div>

          {/* Marks & Numbers */}
          <div className="w-[220px] border border-gray-300 rounded p-2">
            <h3 className="text-[9px] font-bold text-brand-700 uppercase tracking-wider mb-1">
              {t('Marks & Numbers', 'العلامات والأرقام')}
            </h3>
            <p className="text-[10px] text-gray-700 whitespace-pre-wrap">
              {shipping.marksAndNumbers || '—'}
            </p>
          </div>
        </div>

        {/* ── MATERIAL TABLE ────────────────────────── */}
        <div className="border border-gray-300 rounded overflow-hidden mb-3">
          <table className="w-full text-[10px] border-collapse">
            <thead>
              <tr className="bg-brand-700 text-white">
                <th className="px-2 py-1.5 text-center font-semibold w-[40px]">
                  {t('Marks', 'العلامات')}
                </th>
                <th className="px-2 py-1.5 text-center font-semibold w-[70px]">
                  {t('Item Code', 'كود الصنف')}
                </th>
                <th className="px-2 py-1.5 text-center font-semibold">
                  {t('Material Name / Description', 'اسم المادة / الوصف')}
                </th>
                <th className="px-2 py-1.5 text-center font-semibold w-[65px]">
                  {t('Packages', 'العبوات')}
                </th>
                <th className="px-2 py-1.5 text-center font-semibold w-[60px]">
                  {t('Quantity', 'الكمية')}
                </th>
                <th className="px-2 py-1.5 text-center font-semibold w-[65px]">
                  {t('Net Wt (KG)', 'الوزن صافي (كغ)')}
                </th>
                <th className="px-2 py-1.5 text-center font-semibold w-[70px]">
                  {t('Gross Wt (KG)', 'الوزن brut (كغ)')}
                </th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-2 py-4 text-center text-gray-400 italic">
                    {t('No materials', 'لا توجد مواد')}
                  </td>
                </tr>
              ) : (
                items.map((item, idx) => (
                  <PackingListRow
                    key={idx}
                    item={item}
                    index={idx}
                    lang={lang}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── SUMMARY ROW ───────────────────────────── */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <SummaryCell
            label={t('Container', 'الحاوية')}
            value={shipping.containerNumber}
            lang={lang}
          />
          <SummaryCell
            label={t('Seal', 'الختم')}
            value={shipping.sealNumber}
            lang={lang}
          />
          <SummaryCell
            label={t('Total Packages', 'إجمالي العبوات')}
            value={totalPackages > 0 ? formatNumber(totalPackages) : undefined}
            lang={lang}
          />
          <SummaryCell
            label={t('Total CBM', 'إجمالي الحجم م³')}
            value={totalCbm > 0 ? `${totalCbm.toFixed(2)}` : undefined}
            lang={lang}
          />
        </div>

        {/* ── WEIGHT TOTALS (below summary) ─────────── */}
        <div className="flex gap-3 mb-4">
          <div className="flex-1 bg-sand-50 border border-sand-200 rounded px-3 py-2 text-center">
            <p className="text-[8px] text-gray-500 uppercase tracking-wider">
              {t('Total Net Weight (KG)', 'إجمالي الوزن الصافي (كغ)')}
            </p>
            <p className="text-sm font-bold text-brand-800">
              {totalNetWeight > 0 ? formatNumber(totalNetWeight) : '—'}
            </p>
          </div>
          <div className="flex-1 bg-sand-50 border border-sand-200 rounded px-3 py-2 text-center">
            <p className="text-[8px] text-gray-500 uppercase tracking-wider">
              {t('Total Gross Weight (KG)', 'إجمالي الوزن الكلي (كغ)')}
            </p>
            <p className="text-sm font-bold text-brand-800">
              {totalGrossWeight > 0 ? formatNumber(totalGrossWeight) : '—'}
            </p>
          </div>
        </div>

        {/* ── PREPARED BY / SIGNATURE ───────────────── */}
        <div className="flex items-end justify-between gap-6 pt-4 border-t border-gray-300">
          {/* Prepared by */}
          <div className="flex-1">
            <p className="text-[8px] text-gray-500 uppercase tracking-wider mb-0.5">
              {t('Prepared By', 'أعدّه')}
            </p>
            <p className="text-[10px] font-semibold text-gray-800">
              {data.preparedBy || '—'}
            </p>
          </div>

          {/* Export Manager signature block */}
          <div className="flex gap-6">
            {/* Stamp */}
            {data.showStamp && company.stamp && (
              <div className="flex flex-col items-center">
                <img
                  src={company.stamp}
                  alt={t('Stamp', 'ختم')}
                  className="h-[60px] w-auto object-contain opacity-80"
                />
              </div>
            )}

            {/* Signature */}
            {data.showSignature && company.signature && (
              <div className="flex flex-col items-center">
                <p className="text-[8px] text-gray-500 uppercase tracking-wider mb-1">
                  {t('Export Manager Signature', 'توقيع مدير التصدير')}
                </p>
                <img
                  src={company.signature}
                  alt={t('Signature', 'توقيع')}
                  className="h-[45px] w-auto object-contain"
                />
              </div>
            )}

            {/* Signature line (when no image) */}
            {data.showSignature && !company.signature && (
              <div className="flex flex-col items-center min-w-[140px]">
                <p className="text-[8px] text-gray-500 uppercase tracking-wider mb-1">
                  {t('Export Manager Signature', 'توقيع مدير التصدير')}
                </p>
                <div className="w-full border-b border-gray-400 mt-6" />
                <p className="text-[8px] text-gray-400 mt-0.5">
                  {t('Authorized Signature', 'توقيع مخول')}
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
    </A4Page>
  )
}

/* ── Sub-components ──────────────────────────────────────── */

function PackingListRow({
  item,
  index,
  lang,
}: {
  item: DocRenderItem
  index: number
  lang: 'en' | 'ar'
}) {
  const isAr = lang === 'ar'
  const t = (en: string, ar: string) => (isAr ? ar : en)

  /* Build structured description */
  const descParts: string[] = []
  descParts.push(item.material || item.description || '')
  if (item.grade) descParts.push(`${t('Grade', 'درجة')}: ${item.grade}`)
  if (item.hsCode) descParts.push(`HS: ${item.hsCode}`)
  if (item.packing) descParts.push(`${t('Packing', 'التعبئة')}: ${item.packing}`)
  if (item.origin) descParts.push(`${t('Origin', 'المصدر')}: ${item.origin}`)

  const bgClass = index % 2 === 0 ? 'bg-white' : 'bg-gray-50'

  return (
    <tr className={`${bgClass} border-t border-gray-100`}>
      <td className="px-2 py-1.5 text-center text-gray-700">
        {index + 1}
      </td>
      <td className="px-2 py-1.5 text-center text-gray-700">
        {item.hsCode || '—'}
      </td>
      <td className="px-2 py-1.5">
        <div className="text-[10px] leading-tight">
          <p className="font-medium text-gray-800">{item.material || item.description}</p>
          {descParts.length > 1 && (
            <p className="text-gray-500 mt-0.5">
              {descParts.slice(1).join(' · ')}
            </p>
          )}
        </div>
      </td>
      <td className="px-2 py-1.5 text-center text-gray-700">
        {item.packages != null ? formatNumber(item.packages) : '—'}
      </td>
      <td className="px-2 py-1.5 text-center text-gray-700">
        {item.quantity != null ? `${formatNumber(item.quantity)} ${item.unit || ''}` : '—'}
      </td>
      <td className="px-2 py-1.5 text-center text-gray-700">
        {item.netWeight != null ? formatNumber(item.netWeight) : '—'}
      </td>
      <td className="px-2 py-1.5 text-center text-gray-700">
        {item.grossWeight != null ? formatNumber(item.grossWeight) : '—'}
      </td>
    </tr>
  )
}

function SummaryCell({
  label,
  value,
  lang,
}: {
  label: string
  value?: string
  lang: 'en' | 'ar'
}) {
  return (
    <div className="border border-gray-300 rounded p-2">
      <p className="text-[8px] text-gray-500 uppercase tracking-wider mb-0.5">
        {label}
      </p>
      <p className="text-[10px] font-semibold text-gray-800">
        {value || '—'}
      </p>
    </div>
  )
}

export default PackingListTemplate
