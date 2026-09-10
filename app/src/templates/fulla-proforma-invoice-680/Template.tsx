import type { TemplateProps } from '../types'
import { formatDate, formatMoney, formatNumber, l, dir, align } from '../primitives/format'

/* ── Proforma Invoice Template — Fulla 680 ────────────── */
export default function ProformaInvoice({ data, lang }: TemplateProps) {
  const d = dir(lang)
  const a = align(lang)
  const t = (en: string, ar: string) => l(lang, en, ar)

  return (
    <div
      dir={d}
      className="bg-white text-sand-900 font-sans text-[11px] leading-tight w-full mx-auto"
      style={{ direction: d }}
    >
      {/* ── Company Header ──────────────────────────────── */}
      <header className="border-b-2 border-brand-800 pb-4 mb-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 text-center">
            {data.company.logo ? (
              <img
                src={data.company.logo}
                alt={data.company.nameEn}
                className="h-16 mx-auto object-contain"
              />
            ) : (
              <div className="h-16 flex items-center justify-center">
                <span className="text-2xl font-bold text-brand-800 tracking-wide">
                  {data.company.nameEn}
                </span>
              </div>
            )}
            <p className="mt-1 text-[13px] font-semibold text-brand-700">
              {data.company.nameEn}
            </p>
            <p className="text-[12px] text-brand-600 font-arabic">
              {data.company.nameAr}
            </p>
          </div>

          <div className={`flex-shrink-0 text-[10px] leading-relaxed ${a === 'right' ? 'text-left' : 'text-right'}`}>
            {data.company.address && <p>{data.company.address}</p>}
            {data.company.city && <p>{data.company.city}, {data.company.country}</p>}
            {data.company.phone && <p>{data.company.phone}</p>}
            {data.company.email && <p>{data.company.email}</p>}
            {data.company.crNumber && (
              <p>{t('CR', 'سجل تجاري')}: {data.company.crNumber}</p>
            )}
            {data.company.vatNumber && (
              <p>{t('VAT', 'الضريبة')}: {data.company.vatNumber}</p>
            )}
          </div>
        </div>
      </header>

      {/* ── Title ───────────────────────────────────────── */}
      <h1 className="text-center text-[18px] font-bold text-brand-900 uppercase tracking-widest mb-4 border-b border-brand-200 pb-2">
        {t('PROFORMA INVOICE', 'فاتورة مبدئية')}
      </h1>

      {/* ── Document Metadata ───────────────────────────── */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-1 mb-4 text-[10px]">
        <div>
          <span className="font-semibold text-brand-700">{t('PINV Number', 'رقم الفاتورة')}: </span>
          <span>{data.number}</span>
        </div>
        <div>
          <span className="font-semibold text-brand-700">{t('Date', 'التاريخ')}: </span>
          <span>{formatDate(data.date, lang)}</span>
        </div>
        <div>
          <span className="font-semibold text-brand-700">{t('Expiration Date', 'تاريخ الانتهاء')}: </span>
          <span>{data.expirationDate ? formatDate(data.expirationDate, lang) : '—'}</span>
        </div>
        <div>
          <span className="font-semibold text-brand-700">{t('Customer ID', 'رقم العميل')}: </span>
          <span>{data.customer.name}</span>
        </div>
      </div>

      {/* ── Buyer Section ───────────────────────────────── */}
      <div className="bg-brand-50 border border-brand-200 rounded p-3 mb-4">
        <h2 className="text-[11px] font-bold text-brand-800 uppercase tracking-wide mb-2 border-b border-brand-200 pb-1">
          {t('Buyer / Customer', 'المشتري / العميل')}
        </h2>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[10px]">
          <div>
            <span className="font-semibold text-brand-700">{t('Buyer Name', 'اسم المشتري')}: </span>
            <span>{data.customer.name}</span>
          </div>
          <div>
            <span className="font-semibold text-brand-700">{t('Contact Person', 'جهة الاتصال')}: </span>
            <span>{data.customer.contactPerson ?? '—'}</span>
          </div>
          <div className="col-span-2">
            <span className="font-semibold text-brand-700">{t('Address', 'العنوان')}: </span>
            <span>{[data.customer.address, data.customer.city, data.customer.country].filter(Boolean).join(', ') || '—'}</span>
          </div>
          <div>
            <span className="font-semibold text-brand-700">{t('Contact Number', 'رقم الاتصال')}: </span>
            <span>{data.customer.phone ?? '—'}</span>
          </div>
          {data.customer.vatNumber && (
            <div>
              <span className="font-semibold text-brand-700">{t('VAT Number', 'الرقم الضريبي')}: </span>
              <span>{data.customer.vatNumber}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Material Table ──────────────────────────────── */}
      <div className="mb-4">
        <h2 className="text-[11px] font-bold text-brand-800 uppercase tracking-wide mb-2">
          {t('Materials', 'المواد')}
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[10px]">
            <thead>
              <tr className="bg-brand-800 text-white">
                <th className="border border-brand-700 px-2 py-1.5 text-center w-[4%]">#</th>
                <th className="border border-brand-700 px-2 py-1.5 text-center w-[10%]">{t('Item Code', 'كود الصنف')}</th>
                <th className="border border-brand-700 px-2 py-1.5 text-center w-[34%]">{t('Description', 'الوصف')}</th>
                <th className="border border-brand-700 px-2 py-1.5 text-center w-[10%]">{t('Quantity', 'الكمية')}</th>
                <th className="border border-brand-700 px-2 py-1.5 text-center w-[6%]">{t('Unit', 'الوحدة')}</th>
                <th className="border border-brand-700 px-2 py-1.5 text-center w-[10%]">{t('Price', 'السعر')}</th>
                <th className="border border-brand-700 px-2 py-1.5 text-center w-[8%]">{t('Currency', 'العملة')}</th>
                <th className="border border-brand-700 px-2 py-1.5 text-center w-[18%]">{t('Line Total', 'الإجمالي')}</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-brand-50'}>
                  <td className="border border-brand-200 px-2 py-1.5 text-center">{idx + 1}</td>
                  <td className="border border-brand-200 px-2 py-1.5 text-center font-mono text-[9px]">{item.material}</td>
                  <td className="border border-brand-200 px-2 py-1.5">
                    <div className="font-semibold">{item.description}</div>
                    {item.grade && <div className="text-[9px] text-brand-600">{t('Grade', 'المستوى')}: {item.grade}</div>}
                    {item.hsCode && <div className="text-[9px] text-brand-600">{t('HS Code', 'رمز النظام المنسق')}: {item.hsCode}</div>}
                    {item.packing && <div className="text-[9px] text-brand-600">{t('Packing', 'التعبئة')}: {item.packing}</div>}
                    {item.origin && <div className="text-[9px] text-brand-600">{t('Origin', 'المنشأ')}: {item.origin}</div>}
                  </td>
                  <td className="border border-brand-200 px-2 py-1.5 text-center">{formatNumber(item.quantity)}</td>
                  <td className="border border-brand-200 px-2 py-1.5 text-center">{item.unit}</td>
                  <td className="border border-brand-200 px-2 py-1.5 text-center">
                    {item.unitPrice != null ? formatMoney(item.unitPrice, item.currency || data.currency) : '—'}
                  </td>
                  <td className="border border-brand-200 px-2 py-1.5 text-center">{item.currency || data.currency}</td>
                  <td className="border border-brand-200 px-2 py-1.5 text-center font-semibold">
                    {item.total != null ? formatMoney(item.total, item.currency || data.currency) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Terms of Sale ───────────────────────────────── */}
      <div className="bg-brand-50 border border-brand-200 rounded p-3 mb-4">
        <h2 className="text-[11px] font-bold text-brand-800 uppercase tracking-wide mb-2 border-b border-brand-200 pb-1">
          {t('Terms of Sale', 'شروط البيع')}
        </h2>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[10px]">
          <div>
            <span className="font-semibold text-brand-700">{t('Payment Terms', 'شروط الدفع')}: </span>
            <span>{data.terms || '—'}</span>
          </div>
          <div>
            <span className="font-semibold text-brand-700">{t('Delivery Terms', 'شروط التسليم')}: </span>
            <span>{data.shipping.incoterm ?? '—'}</span>
          </div>
          <div>
            <span className="font-semibold text-brand-700">{t('Shipping', 'الشحن')}: </span>
            <span>{data.shipping.shippingMethod ?? '—'}</span>
          </div>
          <div>
            <span className="font-semibold text-brand-700">{t('Validity', 'الصلاحية')}: </span>
            <span>{data.expirationDate ? formatDate(data.expirationDate, lang) : '—'}</span>
          </div>
          {data.notes && (
            <div className="col-span-2">
              <span className="font-semibold text-brand-700">{t('Notes', 'ملاحظات')}: </span>
              <span>{data.notes}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Financial Totals ────────────────────────────── */}
      <div className={`flex ${a === 'right' ? 'justify-start' : 'justify-end'} mb-4`}>
        <div className="w-[45%] border border-brand-200 rounded overflow-hidden">
          <div className="bg-brand-50 px-3 py-1.5 border-b border-brand-200">
            <h3 className="text-[11px] font-bold text-brand-800 uppercase tracking-wide">
              {t('Financial Summary', 'الملخص المالي')}
            </h3>
          </div>
          <div className="divide-y divide-brand-100 text-[10px]">
            <div className="flex justify-between px-3 py-1.5">
              <span className="font-semibold text-brand-700">{t('Subtotal', 'المجموع الفرعي')}</span>
              <span>{formatMoney(data.subtotal, data.currency)}</span>
            </div>
            <div className="flex justify-between px-3 py-1.5">
              <span className="font-semibold text-brand-700">
                {t('VAT', 'ضريبة القيمة المضافة')} ({data.vatRate}%)
              </span>
              <span>{formatMoney(data.vatAmount, data.currency)}</span>
            </div>
            <div className="flex justify-between px-3 py-1.5 bg-brand-100 font-bold text-brand-900">
              <span>{t('Total', 'الإجمالي')}</span>
              <span>{formatMoney(data.total, data.currency)}</span>
            </div>
            <div className="flex justify-between px-3 py-1.5">
              <span className="font-semibold text-brand-700">{t('Currency', 'العملة')}</span>
              <span>{data.currency}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bank Details ────────────────────────────────── */}
      <div className="bg-brand-50 border border-brand-200 rounded p-3 mb-4">
        <h2 className="text-[11px] font-bold text-brand-800 uppercase tracking-wide mb-2 border-b border-brand-200 pb-1">
          {t('Bank Details', 'تفاصيل البنك')}
        </h2>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[10px]">
          <div>
            <span className="font-semibold text-brand-700">{t('Bank Name', 'اسم البنك')}: </span>
            <span>{data.company.bankName ?? '—'}</span>
          </div>
          <div>
            <span className="font-semibold text-brand-700">{t('Account Name', 'اسم الحساب')}: </span>
            <span>{data.company.accountName ?? '—'}</span>
          </div>
          <div>
            <span className="font-semibold text-brand-700">{t('IBAN', 'آيبان')}: </span>
            <span className="font-mono text-[9px]">{data.company.iban ?? '—'}</span>
          </div>
          <div>
            <span className="font-semibold text-brand-700">{t('SWIFT', 'سويفت')}: </span>
            <span className="font-mono text-[9px]">{data.company.swift ?? '—'}</span>
          </div>
        </div>
      </div>

      {/* ── Signature / Stamp Area ──────────────────────── */}
      <div className="border-t-2 border-brand-800 pt-4 mt-6">
        <div className="grid grid-cols-2 gap-8">
          {/* Prepared By */}
          <div className="text-center">
            <h3 className="text-[11px] font-bold text-brand-800 uppercase tracking-wide mb-1">
              {t('Prepared By', 'أعدّها')}
            </h3>
            <div className="border-b border-brand-300 mb-2" />
            <p className="text-[10px] font-semibold">{data.preparedBy}</p>
          </div>

          {/* Export Manager */}
          <div className="text-center">
            <h3 className="text-[11px] font-bold text-brand-800 uppercase tracking-wide mb-1">
              {t('Export Manager', 'مدير التصدير')}
            </h3>
            <div className="border-b border-brand-300 mb-2" />
            <div className="flex justify-center gap-8 mt-2">
              {data.showStamp && data.company.stamp && (
                <div className="text-center">
                  <img
                    src={data.company.stamp}
                    alt="Stamp"
                    className="h-14 mx-auto object-contain opacity-80"
                  />
                  <p className="text-[9px] text-brand-500 mt-1">{t('Stamp', 'ختم')}</p>
                </div>
              )}
              {data.showSignature && data.company.signature && (
                <div className="text-center">
                  <img
                    src={data.company.signature}
                    alt="Signature"
                    className="h-10 mx-auto object-contain"
                  />
                  <p className="text-[9px] text-brand-500 mt-1">{t('Signature', 'توقيع')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
