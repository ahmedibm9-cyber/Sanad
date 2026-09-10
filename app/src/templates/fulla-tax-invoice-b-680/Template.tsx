import type { TemplateProps } from '../types'
import { A4Page } from '../primitives/A4Page'
import { formatDate, formatMoney, formatNumber, l } from '../primitives/format'

/* ── Tax Invoice B — Fulla Layout (Modern Minimal) ────── */
export default function TaxInvoiceBTemplate({ data, lang }: TemplateProps) {
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
    <A4Page templateKey="fulla-tax-invoice-b-680" lang={lang}>
      {/* ── Centered Company Header ──────────────────────── */}
      <header className="text-center mb-5">
        {/* Logo centered */}
        <div className="flex justify-center mb-2">
          {data.company.logo ? (
            <img src={data.company.logo} alt="Logo" className="h-16 w-auto object-contain" />
          ) : (
            <div className="h-16 w-16 rounded-full bg-brand-50 border-2 border-brand-200 flex items-center justify-center text-brand-700 font-bold text-xl">
              {data.company.nameEn?.charAt(0) || 'F'}
            </div>
          )}
        </div>

        {/* Company name centered */}
        <h1 className="text-lg font-bold text-brand-900 leading-tight">
          {isAr ? data.company.nameAr || data.company.nameEn : data.company.nameEn}
        </h1>
        {data.company.legalNameEn && (
          <p className="text-[9px] text-brand-500 mt-0.5">{data.company.legalNameEn}</p>
        )}

        {/* Company details centered */}
        <div className="mt-2 text-[9px] text-brand-600 space-y-0.5">
          {data.company.address && <p>{data.company.address}</p>}
          {(data.company.city || data.company.country) && (
            <p>{[data.company.city, data.company.country].filter(Boolean).join(', ')}</p>
          )}
          <div className="flex items-center justify-center gap-3">
            {data.company.phone && <span>{l(lang, 'Tel', 'هاتف')}: {data.company.phone}</span>}
            {data.company.email && <span>{data.company.email}</span>}
            {data.company.website && <span>{data.company.website}</span>}
          </div>
          <div className="flex items-center justify-center gap-3">
            {data.company.crNumber && (
              <span>{l(lang, 'CR', 'سجل تجاري')}: {data.company.crNumber}</span>
            )}
            {data.company.vatNumber && (
              <span>{l(lang, 'VAT', 'ضريبة')}: {data.company.vatNumber}</span>
            )}
          </div>
        </div>
      </header>

      {/* ── Title Bar ────────────────────────────────────── */}
      <div className="bg-brand-800 text-white text-center py-2 mb-5">
        <h2 className="text-sm font-bold tracking-[0.2em] uppercase">
          {l(lang, 'TAX INVOICE', 'فاتورة ضريبية')}
        </h2>
      </div>

      {/* ── Invoice Reference Bar ────────────────────────── */}
      <div className="flex items-center justify-between mb-5 text-[10px]">
        <div className="flex items-center gap-4">
          <div>
            <span className="text-brand-500">{l(lang, 'Invoice No.', 'رقم الفاتورة')}</span>
            <p className="font-bold text-brand-900 text-[11px]">{data.number}</p>
          </div>
          <div>
            <span className="text-brand-500">{l(lang, 'Date', 'التاريخ')}</span>
            <p className="font-semibold text-brand-900">{formatDate(data.date, lang)}</p>
          </div>
          {data.expirationDate && (
            <div>
              <span className="text-brand-500">{l(lang, 'Valid Until', 'صالح حتى')}</span>
              <p className="font-semibold text-brand-900">{formatDate(data.expirationDate, lang)}</p>
            </div>
          )}
        </div>
        {data.documentReference && (
          <div className="text-right">
            <span className="text-brand-500">{l(lang, 'Reference', 'المرجع')}</span>
            <p className="font-semibold text-brand-900">{data.documentReference}</p>
          </div>
        )}
      </div>

      {/* ── Buyer Card ───────────────────────────────────── */}
      <div className="mb-5 border border-brand-200 rounded-lg p-4">
        <h3 className="text-[9px] font-bold text-brand-400 uppercase tracking-wider mb-2">
          {l(lang, 'Bill To', 'الفاتورة لصالح')}
        </h3>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[10px]">
          <div>
            <p className="font-bold text-brand-900 text-[11px]">{data.customer.name}</p>
            {data.customer.nameAr && <p className="text-brand-500">{data.customer.nameAr}</p>}
          </div>
          <div className={`text-${isAr ? 'left' : 'right'} space-y-0.5`}>
            {data.customer.vatNumber && (
              <p><span className="text-brand-500">{l(lang, 'VAT No.', 'الرقم الضريبي')}:</span> <span className="font-semibold">{data.customer.vatNumber}</span></p>
            )}
            {data.customer.contactPerson && (
              <p><span className="text-brand-500">{l(lang, 'Contact', 'جهة الاتصال')}:</span> <span className="font-semibold">{data.customer.contactPerson}</span></p>
            )}
          </div>
          <div className="col-span-2">
            {data.customer.address && <p className="text-brand-700">{data.customer.address}</p>}
            {(data.customer.city || data.customer.country) && (
              <p className="text-brand-700">{[data.customer.city, data.customer.country].filter(Boolean).join(', ')}</p>
            )}
          </div>
          <div className="col-span-2 flex gap-4">
            {data.customer.phone && (
              <p className="text-brand-600">{l(lang, 'Phone', 'الهاتف')}: <span className="font-semibold text-brand-800">{data.customer.phone}</span></p>
            )}
            {data.customer.email && (
              <p className="text-brand-600">{l(lang, 'Email', 'البريد')}: <span className="font-semibold text-brand-800">{data.customer.email}</span></p>
            )}
          </div>
        </div>
      </div>

      {/* ── Items Table ──────────────────────────────────── */}
      <div className="mb-5">
        <h3 className="text-[9px] font-bold text-brand-400 uppercase tracking-wider mb-2">
          {l(lang, 'Commercial Material', 'المواد التجارية')}
        </h3>
        <table className="w-full border-collapse text-[10px]">
          <thead>
            <tr className="border-b-2 border-brand-800">
              <th className="px-2 py-1.5 text-center font-bold text-brand-700 w-8">#</th>
              <th className="px-2 py-1.5 text-left font-bold text-brand-700">{l(lang, 'Material', 'المادة')}</th>
              <th className="px-2 py-1.5 text-left font-bold text-brand-700">{l(lang, 'Description', 'الوصف')}</th>
              <th className="px-2 py-1.5 text-center font-bold text-brand-700">{l(lang, 'Qty', 'الكمية')}</th>
              <th className="px-2 py-1.5 text-center font-bold text-brand-700">{l(lang, 'Unit', 'الوحدة')}</th>
              <th className="px-2 py-1.5 text-right font-bold text-brand-700">{l(lang, 'Unit Price', 'سعر الوحدة')}</th>
              <th className="px-2 py-1.5 text-right font-bold text-brand-700">{l(lang, 'Currency', 'العملة')}</th>
              <th className="px-2 py-1.5 text-right font-bold text-brand-700">{l(lang, 'Amount', 'المبلغ')}</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, i) => (
              <tr key={i} className="border-b border-brand-100">
                <td className="px-2 py-2 text-center text-brand-400">{i + 1}</td>
                <td className="px-2 py-2 font-semibold text-brand-800">{item.material}</td>
                <td className="px-2 py-2 text-brand-700">
                  {item.description}
                  {item.grade && <span className="text-brand-400 ml-1">({item.grade})</span>}
                </td>
                <td className="px-2 py-2 text-center">{formatNumber(item.quantity)}</td>
                <td className="px-2 py-2 text-center text-brand-500">{item.unit}</td>
                <td className="px-2 py-2 text-right">
                  {item.unitPrice != null ? formatNumber(item.unitPrice) : '—'}
                </td>
                <td className="px-2 py-2 text-center text-brand-500">
                  {item.currency || data.currency}
                </td>
                <td className="px-2 py-2 text-right font-bold text-brand-900">
                  {item.total != null ? formatNumber(item.total) : '—'}
                </td>
              </tr>
            ))}
            {data.items.length === 0 && (
              <tr>
                <td colSpan={8} className="px-2 py-6 text-center text-brand-400">
                  {l(lang, 'No items', 'لا توجد بنود')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Terms of Sale + Totals Row ───────────────────── */}
      <div className="flex gap-5 mb-5">
        {/* Terms of Sale */}
        <div className="flex-1">
          <h3 className="text-[9px] font-bold text-brand-400 uppercase tracking-wider mb-2">
            {l(lang, 'Terms of Sale', 'شروط البيع')}
          </h3>
          <div className="text-[10px] text-brand-800 space-y-1 border border-brand-100 rounded p-3">
            {data.terms && (
              <p>{data.terms}</p>
            )}
            {hasShipping && (
              <div className="mt-1 space-y-0.5">
                {data.shipping.incoterm && (
                  <p><span className="text-brand-500">{l(lang, 'Incoterm', 'الشرط التجاري')}:</span> {data.shipping.incoterm}</p>
                )}
                {data.shipping.portOfLoading && (
                  <p><span className="text-brand-500">{l(lang, 'Port of Loading', 'ميناء التحميل')}:</span> {data.shipping.portOfLoading}</p>
                )}
                {data.shipping.portOfDischarge && (
                  <p><span className="text-brand-500">{l(lang, 'Port of Discharge', 'ميناء التفريغ')}:</span> {data.shipping.portOfDischarge}</p>
                )}
                {data.shipping.freightTerms && (
                  <p><span className="text-brand-500">{l(lang, 'Freight Terms', 'شروط النقل')}:</span> {data.shipping.freightTerms}</p>
                )}
                {data.shipping.shippingMethod && (
                  <p><span className="text-brand-500">{l(lang, 'Shipping Method', 'طريقة الشحن')}:</span> {data.shipping.shippingMethod}</p>
                )}
              </div>
            )}
            {!data.terms && !hasShipping && (
              <p className="text-brand-400 italic">{l(lang, 'Standard terms apply', 'تنطبق الشروط القياسية')}</p>
            )}
          </div>
        </div>

        {/* Amount Summary */}
        <div className="w-56">
          <h3 className="text-[9px] font-bold text-brand-400 uppercase tracking-wider mb-2">
            {l(lang, 'Amount Summary', 'ملخص المبالغ')}
          </h3>
          <div className="border border-brand-100 rounded p-3 space-y-1.5 text-[10px]">
            <div className="flex justify-between">
              <span className="text-brand-500">{l(lang, 'Subtotal', 'المجموع الفرعي')}</span>
              <span className="font-semibold text-brand-900">{formatMoney(data.subtotal, data.currency)}</span>
            </div>
            {data.vatRate > 0 && (
              <div className="flex justify-between">
                <span className="text-brand-500">{l(lang, `VAT (${data.vatRate}%)`, `الضريبة (${data.vatRate}%)`)}</span>
                <span className="text-brand-800">{formatMoney(data.vatAmount, data.currency)}</span>
              </div>
            )}
            <div className="border-t-2 border-brand-800 pt-1.5">
              <div className="flex justify-between">
                <span className="font-bold text-brand-900 text-[11px]">{l(lang, 'Total', 'الإجمالي')}</span>
                <span className="font-bold text-brand-900 text-[11px]">{formatMoney(data.total, data.currency)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Notes ────────────────────────────────────────── */}
      {data.notes && (
        <div className="mb-5">
          <h3 className="text-[9px] font-bold text-brand-400 uppercase tracking-wider mb-1">
            {l(lang, 'Notes', 'ملاحظات')}
          </h3>
          <p className="text-[10px] text-brand-700 border-l-2 border-brand-300 pl-2">{data.notes}</p>
        </div>
      )}

      {/* ── Banking Information ──────────────────────────── */}
      <div className="mb-5">
        <h3 className="text-[9px] font-bold text-brand-400 uppercase tracking-wider mb-2">
          {l(lang, 'Banking Information', 'المعلومات البنكية')}
        </h3>
        <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-[10px] border border-brand-100 rounded p-3">
          {data.company.bankName && (
            <div>
              <span className="text-brand-500">{l(lang, 'Bank', 'البنك')}</span>
              <p className="font-semibold text-brand-900">{data.company.bankName}</p>
            </div>
          )}
          {data.company.accountName && (
            <div>
              <span className="text-brand-500">{l(lang, 'Account Name', 'اسم الحساب')}</span>
              <p className="font-semibold text-brand-900">{data.company.accountName}</p>
            </div>
          )}
          {data.company.iban && (
            <div>
              <span className="text-brand-500">{l(lang, 'IBAN', 'رقم الآيبان')}</span>
              <p className="font-mono text-brand-900">{data.company.iban}</p>
            </div>
          )}
          {data.company.swift && (
            <div>
              <span className="text-brand-500">{l(lang, 'SWIFT', 'السويفت')}</span>
              <p className="font-mono text-brand-900">{data.company.swift}</p>
            </div>
          )}
          {!data.company.bankName && !data.company.iban && (
            <p className="col-span-2 text-brand-400 italic">{l(lang, 'No banking information provided', 'لا توجد معلومات بنكية')}</p>
          )}
        </div>
      </div>

      {/* ── ZATCA QR Code Area ───────────────────────────── */}
      {showQr && (
        <div className={`mb-5 flex ${isAr ? 'justify-end' : 'justify-start'}`}>
          <div className="border border-brand-200 rounded-lg p-3 text-center">
            <div className="w-20 h-20 bg-brand-50 border border-brand-200 rounded flex items-center justify-center mb-1">
              <span className="text-[8px] text-brand-500 font-semibold leading-tight text-center">
                {l(lang, 'ZATCA\nQR', 'QR\nزاتكا')}
              </span>
            </div>
            <p className="text-[8px] text-brand-500">{l(lang, 'ZATCA QR Code', 'رمز QR زاتكا')}</p>
          </div>
        </div>
      )}

      {/* ── Export Manager & Stamp/Signature ──────────────── */}
      <div className="grid grid-cols-2 gap-6 mt-6 pt-4 border-t border-brand-200">
        {/* Export Manager */}
        <div>
          <p className="text-[9px] text-brand-400 uppercase tracking-wider mb-1">
            {l(lang, 'Export Manager', 'مدير التصدير')}
          </p>
          <div className="mt-4 border-b border-brand-300 pb-1">
            <p className="text-[11px] font-bold text-brand-900">{data.preparedBy || '—'}</p>
          </div>
          <p className="text-[8px] text-brand-500 mt-1">{l(lang, 'Name & Title', 'الاسم والمنصب')}</p>
        </div>

        {/* Stamp & Signature */}
        <div className="flex gap-4">
          {/* Stamp */}
          <div className="flex-1">
            <p className="text-[9px] text-brand-400 uppercase tracking-wider mb-1">
              {l(lang, 'Stamp', 'الختم')}
            </p>
            {data.showStamp && data.company.stamp ? (
              <div className="mt-2 flex justify-center">
                <img src={data.company.stamp} alt="Stamp" className="h-16 w-auto object-contain" />
              </div>
            ) : (
              <div className="mt-2 h-16 border border-dashed border-brand-300 rounded flex items-center justify-center">
                <span className="text-[8px] text-brand-300">{l(lang, 'Company Stamp', 'ختم الشركة')}</span>
              </div>
            )}
          </div>

          {/* Signature */}
          <div className="flex-1">
            <p className="text-[9px] text-brand-400 uppercase tracking-wider mb-1">
              {l(lang, 'Signature', 'التوقيع')}
            </p>
            {data.showSignature && data.company.signature ? (
              <div className="mt-2 flex justify-center">
                <img src={data.company.signature} alt="Signature" className="h-12 w-auto object-contain" />
              </div>
            ) : (
              <div className="mt-2 h-12 border border-dashed border-brand-300 rounded flex items-center justify-center">
                <span className="text-[8px] text-brand-300">{l(lang, 'Authorized', 'معتمد')}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </A4Page>
  )
}
