import type { TemplateProps } from '../types'
import { A4Page } from '../primitives/A4Page'
import { formatDate, formatMoney, formatNumber, l, dir } from '../primitives/format'

/* ── Tax Invoice A — Fulla Layout ─────────────────────── */
export default function TaxInvoiceATemplate({ data, lang }: TemplateProps) {
  const d = dir(lang)
  const isAr = lang === 'ar'

  const showQr = data.vatRate === 15
  const hasShipping = !!(
    data.shipping.incoterm ||
    data.shipping.portOfLoading ||
    data.shipping.portOfDischarge ||
    data.shipping.freightTerms ||
    data.shipping.shippingMethod
  )

  return (
    <A4Page templateKey="fulla-tax-invoice-a-680" lang={lang}>
      {/* ── Company Header ──────────────────────────────── */}
      <header className="flex items-start justify-between mb-4">
        {/* Logo / Branding */}
        <div className="flex items-center gap-3">
          {data.company.logo ? (
            <img src={data.company.logo} alt="Logo" className="h-14 w-auto object-contain" />
          ) : (
            <div className="h-14 w-14 rounded bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-lg">
              {data.company.nameEn?.charAt(0) || 'F'}
            </div>
          )}
          <div>
            <h1 className="text-lg font-bold text-brand-800 leading-tight">
              {isAr ? data.company.nameAr || data.company.nameEn : data.company.nameEn}
            </h1>
            {data.company.legalNameEn && (
              <p className="text-[9px] text-brand-500">{data.company.legalNameEn}</p>
            )}
          </div>
        </div>

        {/* Company contact details */}
        <div className={`text-[9px] text-brand-600 ${isAr ? 'text-left' : 'text-right'}`}>
          {data.company.address && <p>{data.company.address}</p>}
          {(data.company.city || data.company.country) && (
            <p>{[data.company.city, data.company.country].filter(Boolean).join(', ')}</p>
          )}
          {data.company.phone && <p>{l(lang, 'Tel', 'هاتف')}: {data.company.phone}</p>}
          {data.company.email && <p>{data.company.email}</p>}
          {data.company.website && <p>{data.company.website}</p>}
        </div>
      </header>

      {/* ── Divider ─────────────────────────────────────── */}
      <hr className="border-brand-300 mb-4" />

      {/* ── Document Title ───────────────────────────────── */}
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold text-brand-900 tracking-wide uppercase">
          {l(lang, 'TAX INVOICE', 'فاتورة ضريبية')}
        </h2>
      </div>

      {/* ── Document Metadata ────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 mb-4 text-[10px]">
        <div className="space-y-1">
          <div className="flex gap-2">
            <span className="font-semibold text-brand-700">{l(lang, 'Tax Invoice No.', 'رقم الفاتورة الضريبية')}:</span>
            <span className="text-brand-900">{data.number}</span>
          </div>
          <div className="flex gap-2">
            <span className="font-semibold text-brand-700">{l(lang, 'Date', 'التاريخ')}:</span>
            <span className="text-brand-900">{formatDate(data.date, lang)}</span>
          </div>
          {data.expirationDate && (
            <div className="flex gap-2">
              <span className="font-semibold text-brand-700">{l(lang, 'Expiration', 'تاريخ الانتهاء')}:</span>
              <span className="text-brand-900">{formatDate(data.expirationDate, lang)}</span>
            </div>
          )}
        </div>
        <div className={`space-y-1 ${isAr ? 'text-right' : 'text-right'}`}>
          {data.company.crNumber && (
            <div className="flex gap-2 justify-end">
              <span className="font-semibold text-brand-700">{l(lang, 'CR No.', 'رقم السجل التجاري')}:</span>
              <span className="text-brand-900">{data.company.crNumber}</span>
            </div>
          )}
          {data.company.vatNumber && (
            <div className="flex gap-2 justify-end">
              <span className="font-semibold text-brand-700">{l(lang, 'VAT No.', 'الرقم الضريبي')}:</span>
              <span className="text-brand-900">{data.company.vatNumber}</span>
            </div>
          )}
          {data.documentReference && (
            <div className="flex gap-2 justify-end">
              <span className="font-semibold text-brand-700">{l(lang, 'Reference', 'المرجع')}:</span>
              <span className="text-brand-900">{data.documentReference}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Seller / Buyer Blocks ────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Seller */}
        <div className="border border-brand-200 rounded p-3">
          <h3 className="text-[10px] font-bold text-brand-700 mb-2 uppercase">
            {l(lang, 'Seller', 'البائع')}
          </h3>
          <div className="text-[10px] text-brand-900 space-y-0.5">
            <p className="font-semibold">{isAr ? data.company.nameAr || data.company.nameEn : data.company.nameEn}</p>
            {data.company.legalNameEn && <p className="text-brand-500">{data.company.legalNameEn}</p>}
            {data.company.address && <p>{data.company.address}</p>}
            {(data.company.city || data.company.country) && (
              <p>{[data.company.city, data.company.country].filter(Boolean).join(', ')}</p>
            )}
            {data.company.phone && <p>{l(lang, 'Phone', 'الهاتف')}: {data.company.phone}</p>}
            {data.company.email && <p>{data.company.email}</p>}
            {data.company.vatNumber && (
              <p className="mt-1">{l(lang, 'VAT No.', 'الرقم الضريبي')}: {data.company.vatNumber}</p>
            )}
          </div>
        </div>

        {/* Buyer */}
        <div className="border border-brand-200 rounded p-3">
          <h3 className="text-[10px] font-bold text-brand-700 mb-2 uppercase">
            {l(lang, 'Buyer / Customer', 'المشتري / العميل')}
          </h3>
          <div className="text-[10px] text-brand-900 space-y-0.5">
            <p className="font-semibold">{data.customer.name}</p>
            {data.customer.nameAr && <p className="text-brand-500">{data.customer.nameAr}</p>}
            {data.customer.contactPerson && <p>{l(lang, 'Contact', 'جهة الاتصال')}: {data.customer.contactPerson}</p>}
            {data.customer.address && <p>{data.customer.address}</p>}
            {(data.customer.city || data.customer.country) && (
              <p>{[data.customer.city, data.customer.country].filter(Boolean).join(', ')}</p>
            )}
            {data.customer.phone && <p>{l(lang, 'Phone', 'الهاتف')}: {data.customer.phone}</p>}
            {data.customer.email && <p>{data.customer.email}</p>}
            {data.customer.vatNumber && (
              <p className="mt-1">{l(lang, 'VAT No.', 'الرقم الضريبي')}: {data.customer.vatNumber}</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Items Table ──────────────────────────────────── */}
      <div className="mb-4">
        <table className="w-full border-collapse text-[10px]">
          <thead>
            <tr className="bg-brand-800 text-white">
              <th className="px-2 py-1.5 text-center font-semibold rounded-tl">#</th>
              <th className="px-2 py-1.5 text-left font-semibold">{l(lang, 'Item Code', 'كود الصنف')}</th>
              <th className="px-2 py-1.5 text-left font-semibold">{l(lang, 'Description', 'الوصف')}</th>
              <th className="px-2 py-1.5 text-center font-semibold">{l(lang, 'Qty', 'الكمية')}</th>
              <th className="px-2 py-1.5 text-center font-semibold">{l(lang, 'Unit', 'الوحدة')}</th>
              <th className="px-2 py-1.5 text-right font-semibold">{l(lang, 'Unit Price', 'سعر الوحدة')}</th>
              <th className="px-2 py-1.5 text-right font-semibold">{l(lang, 'Currency', 'العملة')}</th>
              <th className="px-2 py-1.5 text-right font-semibold rounded-tr">{l(lang, 'Line Total', 'الإجمالي')}</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, i) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-brand-50' : 'bg-white'}>
                <td className="px-2 py-1.5 text-center border-b border-brand-100">{i + 1}</td>
                <td className="px-2 py-1.5 border-b border-brand-100">{item.material}</td>
                <td className="px-2 py-1.5 border-b border-brand-100">
                  {item.description}
                  {item.grade && <span className="text-brand-400 ml-1">({item.grade})</span>}
                </td>
                <td className="px-2 py-1.5 text-center border-b border-brand-100">{formatNumber(item.quantity)}</td>
                <td className="px-2 py-1.5 text-center border-b border-brand-100">{item.unit}</td>
                <td className="px-2 py-1.5 text-right border-b border-brand-100">
                  {item.unitPrice != null ? formatNumber(item.unitPrice) : '—'}
                </td>
                <td className="px-2 py-1.5 text-center border-b border-brand-100">
                  {item.currency || data.currency}
                </td>
                <td className="px-2 py-1.5 text-right border-b border-brand-100 font-semibold">
                  {item.total != null ? formatNumber(item.total) : '—'}
                </td>
              </tr>
            ))}
            {data.items.length === 0 && (
              <tr>
                <td colSpan={8} className="px-2 py-4 text-center text-brand-400 border-b border-brand-100">
                  {l(lang, 'No items', 'لا توجد بنود')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Terms & Bank Details ─────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Payment / Delivery Terms */}
        <div>
          <h3 className="text-[10px] font-bold text-brand-700 mb-2 uppercase">
            {l(lang, 'Payment & Delivery Terms', 'شروط الدفع والتسليم')}
          </h3>
          <div className="text-[10px] text-brand-900 space-y-1">
            {data.terms && (
              <div>
                <span className="font-semibold">{l(lang, 'Payment Terms', 'شروط الدفع')}:</span>
                <p className="mt-0.5">{data.terms}</p>
              </div>
            )}
            {hasShipping && (
              <div className="mt-2 space-y-1">
                {data.shipping.incoterm && (
                  <p><span className="font-semibold">{l(lang, 'Incoterm', 'الشرط التجاري')}:</span> {data.shipping.incoterm}</p>
                )}
                {data.shipping.portOfLoading && (
                  <p><span className="font-semibold">{l(lang, 'Port of Loading', 'ميناء التحميل')}:</span> {data.shipping.portOfLoading}</p>
                )}
                {data.shipping.portOfDischarge && (
                  <p><span className="font-semibold">{l(lang, 'Port of Discharge', 'ميناء التفريغ')}:</span> {data.shipping.portOfDischarge}</p>
                )}
                {data.shipping.freightTerms && (
                  <p><span className="font-semibold">{l(lang, 'Freight Terms', 'شروط النقل')}:</span> {data.shipping.freightTerms}</p>
                )}
                {data.shipping.shippingMethod && (
                  <p><span className="font-semibold">{l(lang, 'Shipping Method', 'طريقة الشحن')}:</span> {data.shipping.shippingMethod}</p>
                )}
              </div>
            )}
            {data.notes && (
              <div className="mt-2">
                <span className="font-semibold">{l(lang, 'Notes', 'ملاحظات')}:</span>
                <p className="mt-0.5">{data.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Bank Details */}
        <div>
          <h3 className="text-[10px] font-bold text-brand-700 mb-2 uppercase">
            {l(lang, 'Bank Details', 'تفاصيل البنك')}
          </h3>
          <div className="text-[10px] text-brand-900 space-y-0.5">
            {data.company.bankName && (
              <p><span className="font-semibold">{l(lang, 'Bank Name', 'اسم البنك')}:</span> {data.company.bankName}</p>
            )}
            {data.company.accountName && (
              <p><span className="font-semibold">{l(lang, 'Account Name', 'اسم الحساب')}:</span> {data.company.accountName}</p>
            )}
            {data.company.iban && (
              <p><span className="font-semibold">{l(lang, 'IBAN', 'رقم الآيبان')}:</span> {data.company.iban}</p>
            )}
            {data.company.swift && (
              <p><span className="font-semibold">{l(lang, 'SWIFT Code', 'كود السويفت')}:</span> {data.company.swift}</p>
            )}
            {!data.company.bankName && !data.company.iban && (
              <p className="text-brand-400">{l(lang, 'No bank details provided', 'لا توجد تفاصيل بنكية')}</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Financial Totals ─────────────────────────────── */}
      <div className={`flex mb-4 ${isAr ? 'justify-start' : 'justify-end'}`}>
        <div className="w-64">
          <div className="bg-brand-50 border border-brand-200 rounded p-3 space-y-1.5 text-[10px]">
            <div className="flex justify-between">
              <span className="text-brand-600">{l(lang, 'Subtotal', 'المجموع الفرعي')}</span>
              <span className="text-brand-900 font-semibold">{formatMoney(data.subtotal, data.currency)}</span>
            </div>
            {data.vatRate > 0 && (
              <>
                <div className="flex justify-between">
                  <span className="text-brand-600">{l(lang, `VAT (${data.vatRate}%)`, `الضريبة (${data.vatRate}%)`)}</span>
                  <span className="text-brand-900">{formatMoney(data.vatAmount, data.currency)}</span>
                </div>
              </>
            )}
            <hr className="border-brand-300" />
            <div className="flex justify-between text-[11px]">
              <span className="font-bold text-brand-800">{l(lang, 'Total', 'الإجمالي')}</span>
              <span className="font-bold text-brand-900">{formatMoney(data.total, data.currency)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── ZATCA QR Code Area ───────────────────────────── */}
      {showQr && (
        <div className={`mb-4 flex ${isAr ? 'justify-end' : 'justify-start'}`}>
          <div className="border border-brand-300 rounded p-3 text-center">
            <div className="w-24 h-24 bg-brand-100 border border-brand-200 rounded flex items-center justify-center mb-1">
              <span className="text-[8px] text-brand-500 font-semibold">
                {l(lang, 'ZATCA\nQR', 'QR\nزاتكا')}
              </span>
            </div>
            <p className="text-[8px] text-brand-500">{l(lang, 'ZATCA QR Code', 'رمز QR زاتكا')}</p>
          </div>
        </div>
      )}

      {/* ── Signature / Stamp Area ───────────────────────── */}
      <div className="grid grid-cols-3 gap-4 mt-8 pt-4 border-t border-brand-200">
        {/* Prepared By */}
        <div className="text-center">
          <p className="text-[9px] text-brand-600 mb-1">{l(lang, 'Prepared By', 'أعدّها')}</p>
          <div className="h-8" />
          <p className="text-[10px] font-semibold text-brand-800">{data.preparedBy || '—'}</p>
          <div className="mt-1 border-t border-brand-400 mx-4" />
          <p className="text-[8px] text-brand-500 mt-0.5">{l(lang, 'Name & Title', 'الاسم والمنصب')}</p>
        </div>

        {/* Stamp */}
        <div className="text-center">
          <p className="text-[9px] text-brand-600 mb-1">{l(lang, 'Stamp', 'الختم')}</p>
          <div className="h-8" />
          {data.showStamp && data.company.stamp ? (
            <img src={data.company.stamp} alt="Stamp" className="h-14 w-auto mx-auto object-contain" />
          ) : (
            <div className="h-14 border border-dashed border-brand-300 rounded mx-4 flex items-center justify-center">
              <span className="text-[8px] text-brand-300">{l(lang, 'Company Stamp', 'ختم الشركة')}</span>
            </div>
          )}
        </div>

        {/* Signature */}
        <div className="text-center">
          <p className="text-[9px] text-brand-600 mb-1">{l(lang, 'Signature', 'التوقيع')}</p>
          <div className="h-8" />
          {data.showSignature && data.company.signature ? (
            <img src={data.company.signature} alt="Signature" className="h-10 w-auto mx-auto object-contain" />
          ) : (
            <div className="h-10 border border-dashed border-brand-300 rounded mx-4 flex items-center justify-center">
              <span className="text-[8px] text-brand-300">{l(lang, 'Authorized Signature', 'توقيع معتمد')}</span>
            </div>
          )}
        </div>
      </div>
    </A4Page>
  )
}
