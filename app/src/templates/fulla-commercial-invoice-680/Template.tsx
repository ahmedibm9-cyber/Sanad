import type { TemplateProps } from '../types'
import { A4Page } from '../primitives/A4Page'
import { formatDate, formatMoney, formatNumber, l, dir } from '../primitives/format'
import {
  documentMetaFields,
  buyerFields,
  commercialTermFields,
  bankFields,
  financialFields,
} from './mapping'

/* ── Commercial Invoice Template ─────────────────────────── */
function CommercialInvoice({ data, lang }: TemplateProps) {
  const isAr = lang === 'ar'
  const d = dir(lang)

  const companyLabel = isAr ? data.company.nameAr : data.company.nameEn
  const companyLegal = isAr
    ? data.company.legalNameAr ?? data.company.nameAr
    : data.company.legalNameEn ?? data.company.nameEn

  return (
    <A4Page templateKey="fulla-commercial-invoice-680" lang={lang}>
      {/* ── Company Header ──────────────────────────────── */}
      <header className="flex items-start gap-4 pb-3 border-b-2 border-sand-400">
        {data.company.logo && (
          <img
            src={data.company.logo}
            alt={companyLabel}
            className="h-16 w-auto object-contain shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-[16px] font-bold text-brand-800 leading-tight">
            {companyLabel}
          </h1>
          {companyLegal !== companyLabel && (
            <p className="text-[10px] text-brand-500 mt-0.5">{companyLegal}</p>
          )}
          <div className="mt-1 space-y-0.5 text-[9.5px] text-brand-600">
            {data.company.address && <p>{data.company.address}</p>}
            {(data.company.city || data.company.country) && (
              <p>
                {[data.company.city, data.company.country].filter(Boolean).join(', ')}
              </p>
            )}
            <div className="flex gap-4 flex-wrap">
              {data.company.phone && <span>{data.company.phone}</span>}
              {data.company.email && <span>{data.company.email}</span>}
              {data.company.website && <span>{data.company.website}</span>}
            </div>
            <div className="flex gap-4 flex-wrap">
              {data.company.crNumber && (
                <span>
                  {l(lang, 'CR', 'سجل تجاري')}: {data.company.crNumber}
                </span>
              )}
              {data.company.vatNumber && (
                <span>
                  {l(lang, 'VAT', 'الرقم الضريبي')}: {data.company.vatNumber}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── Document Title ──────────────────────────────── */}
      <div className="mt-4 mb-3">
        <h2
          className={`text-[18px] font-extrabold tracking-wide text-center uppercase ${isAr ? 'font-arabic' : ''}`}
          style={{ letterSpacing: '0.15em' }}
        >
          {l(lang, 'COMMERCIAL INVOICE', 'فاتورة تجارية')}
        </h2>
      </div>

      {/* ── Document Metadata ───────────────────────────── */}
      <div className="grid grid-cols-3 gap-x-6 gap-y-1 mb-3 px-1 text-[10px]">
        {documentMetaFields.map((f) => {
          const val = f.getValue(data)
          if (val === undefined || val === '') return null
          const display = f.key === 'date' || f.key === 'expirationDate'
            ? formatDate(String(val), lang)
            : String(val)
          return (
            <div key={f.key} className="flex gap-1.5">
              <span className="font-semibold text-brand-700 shrink-0">
                {l(lang, f.label, f.labelAr)}:
              </span>
              <span className="text-brand-900">{display}</span>
            </div>
          )
        })}
      </div>

      {/* ── Buyer Section ───────────────────────────────── */}
      <div className="border border-sand-300 rounded-md p-3 mb-3 bg-sand-50/50">
        <h3 className="text-[11px] font-bold text-brand-700 mb-1.5 uppercase tracking-wide">
          {l(lang, 'Buyer', 'المشتري')}
        </h3>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[10px]">
          {buyerFields.map((f) => {
            const val = f.getValue(data)
            if (!val) return null
            return (
              <div key={f.key} className="flex gap-1.5">
                <span className="font-semibold text-brand-600 shrink-0">
                  {l(lang, f.label, f.labelAr)}:
                </span>
                <span className="text-brand-900">{String(val)}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Materials Table ─────────────────────────────── */}
      <div className="mb-3">
        <table className="w-full border-collapse text-[10px]" dir={d}>
          <thead>
            <tr className="bg-brand-800 text-white">
              <th className="py-1.5 px-2 text-center border border-brand-700 w-[5%]">
                {l(lang, '#', '#')}
              </th>
              <th className="py-1.5 px-2 border border-brand-700 w-[10%]">
                {l(lang, 'Item Code', 'رمز الصنف')}
              </th>
              <th className="py-1.5 px-2 border border-brand-700 w-[30%]">
                {l(lang, 'Description', 'الوصف')}
              </th>
              <th className="py-1.5 px-2 text-center border border-brand-700 w-[8%]">
                {l(lang, 'Qty', 'الكمية')}
              </th>
              <th className="py-1.5 px-2 text-center border border-brand-700 w-[7%]">
                {l(lang, 'Unit', 'الوحدة')}
              </th>
              <th className="py-1.5 px-2 text-center border border-brand-700 w-[10%]">
                {l(lang, 'Price', 'السعر')}
              </th>
              <th className="py-1.5 px-2 text-center border border-brand-700 w-[8%]">
                {l(lang, 'Currency', 'العملة')}
              </th>
              <th className="py-1.5 px-2 text-center border border-brand-700 w-[12%]">
                {l(lang, 'Total', 'الإجمالي')}
              </th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, idx) => {
              const rowBg = idx % 2 === 0 ? 'bg-white' : 'bg-sand-50'
              return (
                <tr key={idx} className={rowBg}>
                  <td className="py-1.5 px-2 text-center border border-sand-300 font-medium text-brand-600">
                    {idx + 1}
                  </td>
                  <td className="py-1.5 px-2 border border-sand-300 font-medium text-brand-800">
                    {item.material}
                  </td>
                  <td className="py-1.5 px-2 border border-sand-300">
                    <div className="leading-snug">{item.description}</div>
                    <div className="text-[8.5px] text-brand-500 mt-0.5 space-x-2">
                      {item.hsCode && (
                        <span>
                          {l(lang, 'HS', 'HS')}: {item.hsCode}
                        </span>
                      )}
                      {item.packing && (
                        <span>
                          {l(lang, 'Packing', 'التعبئة')}: {item.packing}
                        </span>
                      )}
                      {item.origin && (
                        <span>
                          {l(lang, 'Origin', 'المنشأ')}: {item.origin}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-1.5 px-2 text-center border border-sand-300 font-medium">
                    {formatNumber(item.quantity)}
                  </td>
                  <td className="py-1.5 px-2 text-center border border-sand-300">
                    {item.unit}
                  </td>
                  <td className="py-1.5 px-2 text-center border border-sand-300">
                    {item.unitPrice != null
                      ? formatNumber(item.unitPrice)
                      : '—'}
                  </td>
                  <td className="py-1.5 px-2 text-center border border-sand-300">
                    {item.currency ?? data.currency}
                  </td>
                  <td className="py-1.5 px-2 text-center border border-sand-300 font-semibold text-brand-800">
                    {item.total != null ? formatNumber(item.total) : '—'}
                  </td>
                </tr>
              )
            })}
            {data.items.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="py-6 text-center text-brand-400 border border-sand-300 italic"
                >
                  {l(lang, 'No items', 'لا توجد أصناف')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Commercial Terms ────────────────────────────── */}
      <div className="border border-sand-300 rounded-md p-3 mb-3 bg-sand-50/50">
        <h3 className="text-[11px] font-bold text-brand-700 mb-1.5 uppercase tracking-wide">
          {l(lang, 'Commercial Terms', 'الشروط التجارية')}
        </h3>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[10px]">
          {commercialTermFields.map((f) => {
            const val = f.getValue(data)
            if (!val) return null
            return (
              <div key={f.key} className="flex gap-1.5">
                <span className="font-semibold text-brand-600 shrink-0">
                  {l(lang, f.label, f.labelAr)}:
                </span>
                <span className="text-brand-900">{String(val)}</span>
              </div>
            )
          })}
        </div>
        {data.notes && (
          <div className="mt-2 pt-2 border-t border-sand-200">
            <span className="text-[10px] font-semibold text-brand-600">
              {l(lang, 'Other Comments:', 'ملاحظات أخرى:')}
            </span>
            <p className="text-[10px] text-brand-800 mt-0.5 whitespace-pre-wrap">
              {data.notes}
            </p>
          </div>
        )}
      </div>

      {/* ── Financial Totals ────────────────────────────── */}
      <div className="flex justify-end mb-3">
        <div className="w-[45%] border border-sand-300 rounded-md overflow-hidden">
          {financialFields.map((f, fIdx) => {
            const val = f.getValue(data)
            if (val === undefined || val === '') return null

            const isTotal = f.key === 'total'
            const rowBg = isTotal
              ? 'bg-brand-800 text-white font-bold'
              : fIdx % 2 === 0
                ? 'bg-white'
                : 'bg-sand-50'

            let display: string
            if (f.key === 'subtotal' || f.key === 'vatAmount') {
              display = formatMoney(Number(val), data.currency)
            } else {
              display = String(val)
            }

            return (
              <div
                key={f.key}
                className={`flex justify-between items-center px-3 py-1.5 text-[10px] border-b border-sand-200 last:border-b-0 ${rowBg}`}
              >
                <span className={isTotal ? 'text-white' : 'font-semibold text-brand-700'}>
                  {l(lang, f.label, f.labelAr)}
                </span>
                <span>{display}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Bank Information ────────────────────────────── */}
      <div className="border border-sand-300 rounded-md p-3 mb-3 bg-sand-50/50">
        <h3 className="text-[11px] font-bold text-brand-700 mb-1.5 uppercase tracking-wide">
          {l(lang, 'Bank Information', 'المعلومات البنكية')}
        </h3>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[10px]">
          {bankFields.map((f) => {
            const val = f.getValue(data)
            if (!val) return null
            return (
              <div key={f.key} className="flex gap-1.5">
                <span className="font-semibold text-brand-600 shrink-0">
                  {l(lang, f.label, f.labelAr)}:
                </span>
                <span className="text-brand-900 font-mono">{String(val)}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Signature / Stamp / Prepared By ─────────────── */}
      <footer className="mt-6 pt-3 border-t border-sand-300">
        <div className="flex justify-between items-end gap-8">
          <div className="text-[10px] text-brand-700">
            <span className="font-semibold">
              {l(lang, 'Prepared By:', 'أعدّه:')}
            </span>{' '}
            <span className="text-brand-900">{data.preparedBy || '—'}</span>
          </div>
          <div className="flex gap-8 items-end">
            {data.showStamp && data.company.stamp && (
              <div className="text-center">
                <img
                  src={data.company.stamp}
                  alt={l(lang, 'Stamp', 'ختم')}
                  className="h-16 w-auto object-contain opacity-80"
                />
                <p className="text-[8px] text-brand-500 mt-0.5">
                  {l(lang, 'Stamp', 'ختم')}
                </p>
              </div>
            )}
            {data.showSignature && data.company.signature && (
              <div className="text-center">
                <img
                  src={data.company.signature}
                  alt={l(lang, 'Signature', 'توقيع')}
                  className="h-10 w-auto object-contain"
                />
                <p className="text-[8px] text-brand-500 mt-0.5">
                  {l(lang, 'Signature', 'توقيع')}
                </p>
              </div>
            )}
          </div>
        </div>
      </footer>
    </A4Page>
  )
}

export default CommercialInvoice
