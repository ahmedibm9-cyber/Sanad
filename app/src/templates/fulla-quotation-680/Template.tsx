import type { TemplateProps } from '../types'
import { A4Page } from '../primitives/A4Page'
import { formatDate, formatMoney, formatNumber, l } from '../primitives/format'

/* ── Quotation Template ─────────────────────────────────── */
export default function QuotationTemplate({ data, lang }: TemplateProps) {
  const isAr = lang === 'ar'

  return (
    <A4Page templateKey="fulla-quotation-680" lang={lang}>
      {/* ── Company Header ───────────────────────────────── */}
      <header className="border-b-2 border-brand-700 pb-4 mb-6">
        <div className="flex justify-between items-start">
          {/* Company Info - Left/Right based on direction */}
          <div className={isAr ? 'text-right' : 'text-left'}>
            <h1 className="text-xl font-bold text-brand-800">
              {isAr ? data.company.nameAr : data.company.nameEn}
            </h1>
            {data.company.legalNameEn && (
              <p className="text-xs text-brand-600 mt-1">
                {isAr ? data.company.legalNameAr : data.company.legalNameEn}
              </p>
            )}
            <div className="text-[10px] text-gray-600 mt-2 space-y-0.5">
              {data.company.address && <p>{data.company.address}</p>}
              {(data.company.city || data.company.country) && (
                <p>{[data.company.city, data.company.country].filter(Boolean).join(', ')}</p>
              )}
              {data.company.phone && <p>{l(lang, 'Tel:', 'هاتف:')} {data.company.phone}</p>}
              {data.company.email && <p>{data.company.email}</p>}
            </div>
          </div>

          {/* Logo - Centered */}
          <div className="flex-1 flex justify-center">
            {data.company.logo ? (
              <img
                src={data.company.logo}
                alt="Company Logo"
                className="h-16 w-auto object-contain"
              />
            ) : (
              <div className="text-center">
                <div className="text-2xl font-bold text-brand-700 tracking-wider">
                  FULLA
                </div>
                <div className="text-[9px] text-brand-500 tracking-widest">
                  {l(lang, 'TRADING COMPANY', 'للتجارة')}
                </div>
              </div>
            )}
          </div>

          {/* Company Details - Right/Left based on direction */}
          <div className={isAr ? 'text-left' : 'text-right'}>
            {data.company.crNumber && (
              <p className="text-[10px] text-gray-600">
                {l(lang, 'CR:', 'سجل تجاري:')} {data.company.crNumber}
              </p>
            )}
            {data.company.vatNumber && (
              <p className="text-[10px] text-gray-600">
                {l(lang, 'VAT:', 'رقم ضريبي:')} {data.company.vatNumber}
              </p>
            )}
          </div>
        </div>
      </header>

      {/* ── Document Title ────────────────────────────────── */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-brand-800 tracking-wide">
          {l(lang, 'QUOTATION', 'عرض أسعار')}
        </h2>
      </div>

      {/* ── Document Metadata ─────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 mb-6 text-[10px]">
        <div className={isAr ? 'text-right' : 'text-left'}>
          <div className="space-y-1">
            <p>
              <span className="font-semibold text-brand-700">
                {l(lang, 'Quotation Number:', 'رقم عرض الأسعار:')}
              </span>{' '}
              {data.number}
            </p>
            <p>
              <span className="font-semibold text-brand-700">
                {l(lang, 'Date:', 'التاريخ:')}
              </span>{' '}
              {formatDate(data.date, lang)}
            </p>
            {data.expirationDate && (
              <p>
                <span className="font-semibold text-brand-700">
                  {l(lang, 'Expiration Date:', 'تاريخ الانتهاء:')}
                </span>{' '}
                {formatDate(data.expirationDate, lang)}
              </p>
            )}
          </div>
        </div>
        <div className={isAr ? 'text-left' : 'text-right'}>
          <div className="space-y-1">
            <p>
              <span className="font-semibold text-brand-700">
                {l(lang, 'Customer ID:', 'رقم العميل:')}
              </span>{' '}
              {data.customer.name}
            </p>
          </div>
        </div>
      </div>

      {/* ── Customer / Buyer Section ──────────────────────── */}
      <div className="bg-sand-50 border border-sand-200 rounded p-3 mb-6">
        <h3 className="text-xs font-bold text-brand-700 mb-2 border-b border-sand-200 pb-1">
          {l(lang, 'BUYER / CUSTOMER', 'المشتري / العميل')}
        </h3>
        <div className="grid grid-cols-2 gap-4 text-[10px]">
          <div className="space-y-1">
            <p>
              <span className="font-semibold text-gray-600">
                {l(lang, 'Buyer Name:', 'اسم المشتري:')}
              </span>{' '}
              {data.customer.name}
            </p>
            {data.customer.nameAr && (
              <p>
                <span className="font-semibold text-gray-600">
                  {l(lang, ' Buyer Name (Arabic):', 'اسم المشتري (عربي):')}
                </span>{' '}
                {data.customer.nameAr}
              </p>
            )}
            {data.customer.contactPerson && (
              <p>
                <span className="font-semibold text-gray-600">
                  {l(lang, 'Contact:', 'جهة الاتصال:')}
                </span>{' '}
                {data.customer.contactPerson}
              </p>
            )}
          </div>
          <div className="space-y-1">
            {data.customer.address && (
              <p>
                <span className="font-semibold text-gray-600">
                  {l(lang, 'Address:', 'العنوان:')}
                </span>{' '}
                {data.customer.address}
              </p>
            )}
            {(data.customer.city || data.customer.country) && (
              <p>
                <span className="font-semibold text-gray-600">
                  {l(lang, 'City/Country:', 'المدينة/الدولة:')}
                </span>{' '}
                {[data.customer.city, data.customer.country].filter(Boolean).join(', ')}
              </p>
            )}
            {data.customer.phone && (
              <p>
                <span className="font-semibold text-gray-600">
                  {l(lang, 'Contact Number:', 'رقم الاتصال:')}
                </span>{' '}
                {data.customer.phone}
              </p>
            )}
            {data.customer.email && (
              <p>
                <span className="font-semibold text-gray-600">
                  {l(lang, 'Email:', 'البريد الإلكتروني:')}
                </span>{' '}
                {data.customer.email}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Commercial Materials Table ────────────────────── */}
      <div className="mb-6">
        <h3 className="text-xs font-bold text-brand-700 mb-2">
          {l(lang, 'COMMERCIAL MATERIALS', 'المواد التجارية')}
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-[9px] border-collapse">
            <thead>
              <tr className="bg-brand-700 text-white">
                <th className={`p-1.5 border border-brand-600 ${isAr ? 'text-right' : 'text-left'}`}>
                  {l(lang, 'Item Code', 'كود الصنف')}
                </th>
                <th className={`p-1.5 border border-brand-600 ${isAr ? 'text-right' : 'text-left'}`}>
                  {l(lang, 'Description', 'الوصف')}
                </th>
                <th className="p-1.5 border border-brand-600 text-center">
                  {l(lang, 'Quantity', 'الكمية')}
                </th>
                <th className="p-1.5 border border-brand-600 text-center">
                  {l(lang, 'Unit', 'الوحدة')}
                </th>
                <th className="p-1.5 border border-brand-600 text-center">
                  {l(lang, 'Price', 'السعر')}
                </th>
                <th className="p-1.5 border border-brand-600 text-center">
                  {l(lang, 'Currency', 'العملة')}
                </th>
                <th className={`p-1.5 border border-brand-600 ${isAr ? 'text-left' : 'text-right'}`}>
                  {l(lang, 'Line Total', 'الإجمالي')}
                </th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-sand-50'}>
                  <td className="p-1.5 border border-gray-300 font-medium">
                    {item.material}
                  </td>
                  <td className="p-1.5 border border-gray-300">
                    <div>{item.description}</div>
                    {item.grade && (
                      <div className="text-[8px] text-gray-500">
                        {l(lang, 'Grade:', 'الدرجة:')} {item.grade}
                      </div>
                    )}
                    {item.hsCode && (
                      <div className="text-[8px] text-gray-500">
                        {l(lang, 'HS Code:', 'كود HS:')} {item.hsCode}
                      </div>
                    )}
                    {item.packing && (
                      <div className="text-[8px] text-gray-500">
                        {l(lang, 'Packing:', 'التعبئة:')} {item.packing}
                      </div>
                    )}
                    {item.origin && (
                      <div className="text-[8px] text-gray-500">
                        {l(lang, 'Origin:', 'المنشأ:')} {item.origin}
                      </div>
                    )}
                  </td>
                  <td className="p-1.5 border border-gray-300 text-center">
                    {formatNumber(item.quantity)}
                  </td>
                  <td className="p-1.5 border border-gray-300 text-center">
                    {item.unit}
                  </td>
                  <td className="p-1.5 border border-gray-300 text-center">
                    {item.unitPrice ? formatNumber(item.unitPrice) : '—'}
                  </td>
                  <td className="p-1.5 border border-gray-300 text-center">
                    {item.currency || data.currency}
                  </td>
                  <td className={`p-1.5 border border-gray-300 font-medium ${isAr ? 'text-left' : 'text-right'}`}>
                    {item.total ? formatMoney(item.total, item.currency || data.currency) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Terms Section ────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 mb-6 text-[10px]">
        <div className="bg-sand-50 border border-sand-200 rounded p-3">
          <h4 className="font-bold text-brand-700 mb-2">
            {l(lang, 'TERMS & CONDITIONS', 'الشروط والأحكام')}
          </h4>
          <div className="space-y-1.5">
            {data.shipping.incoterm && (
              <p>
                <span className="font-semibold text-gray-600">
                  {l(lang, 'Payment Terms:', 'شروط الدفع:')}
                </span>{' '}
                {data.shipping.incoterm}
              </p>
            )}
            {data.shipping.freightTerms && (
              <p>
                <span className="font-semibold text-gray-600">
                  {l(lang, 'Delivery Terms:', 'شروط التسليم:')}
                </span>{' '}
                {data.shipping.freightTerms}
              </p>
            )}
            {(data.shipping.portOfLoading || data.shipping.portOfDischarge) && (
              <p>
                <span className="font-semibold text-gray-600">
                  {l(lang, 'Shipping Route:', 'مسار الشحن:')}
                </span>{' '}
                {[data.shipping.portOfLoading, data.shipping.portOfDischarge].filter(Boolean).join(' → ')}
              </p>
            )}
            {data.expirationDate && (
              <p>
                <span className="font-semibold text-gray-600">
                  {l(lang, 'Validity:', 'الصلاحية:')}
                </span>{' '}
                {l(lang, 'This quotation is valid until', 'عرض الأسعار هذا صالح حتى')} {formatDate(data.expirationDate, lang)}
              </p>
            )}
            {data.notes && (
              <p>
                <span className="font-semibold text-gray-600">
                  {l(lang, 'Other Comments:', 'تعليقات أخرى:')}
                </span>{' '}
                {data.notes}
              </p>
            )}
          </div>
        </div>

        {/* ── Bank Information ──────────────────────────────── */}
        <div className="bg-sand-50 border border-sand-200 rounded p-3">
          <h4 className="font-bold text-brand-700 mb-2">
            {l(lang, 'BANK INFORMATION', 'معلومات البنك')}
          </h4>
          <div className="space-y-1.5">
            {data.company.bankName && (
              <p>
                <span className="font-semibold text-gray-600">
                  {l(lang, 'Bank Name:', 'اسم البنك:')}
                </span>{' '}
                {data.company.bankName}
              </p>
            )}
            <p>
              <span className="font-semibold text-gray-600">
                {l(lang, 'Currency:', 'العملة:')}
              </span>{' '}
              {data.currency}
            </p>
            {data.company.accountName && (
              <p>
                <span className="font-semibold text-gray-600">
                  {l(lang, 'Account Name:', 'اسم الحساب:')}
                </span>{' '}
                {data.company.accountName}
              </p>
            )}
            {data.company.iban && (
              <p>
                <span className="font-semibold text-gray-600">
                  {l(lang, 'IBAN:', 'رقم الآيبان:')}
                </span>{' '}
                {data.company.iban}
              </p>
            )}
            {data.company.swift && (
              <p>
                <span className="font-semibold text-gray-600">
                  {l(lang, 'SWIFT/BIC:', 'كود السويفت:')}
                </span>{' '}
                {data.company.swift}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Financial Totals ──────────────────────────────── */}
      <div className={`mb-6 ${isAr ? 'text-left' : 'text-right'}`}>
        <div className="inline-block bg-brand-50 border border-brand-200 rounded p-4 min-w-[250px]">
          <div className="space-y-2 text-[10px]">
            <div className="flex justify-between">
              <span className="font-semibold text-gray-600">
                {l(lang, 'Subtotal:', 'المجموع الفرعي:')}
              </span>
              <span>{formatMoney(data.subtotal, data.currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-gray-600">
                {l(lang, 'Tax Rate:', 'نسبة الضريبة:')}
              </span>
              <span>{data.vatRate}%</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-gray-600">
                {l(lang, 'VAT Amount:', 'مبلغ الضريبة:')}
              </span>
              <span>{formatMoney(data.vatAmount, data.currency)}</span>
            </div>
            <div className="border-t border-brand-300 pt-2 mt-2">
              <div className="flex justify-between text-sm font-bold text-brand-800">
                <span>{l(lang, 'TOTAL:', 'الإجمالي:')}</span>
                <span>{formatMoney(data.total, data.currency)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Prepared By / Signature Section ───────────────── */}
      <footer className="border-t border-gray-300 pt-4 mt-8">
        <div className="grid grid-cols-2 gap-8">
          {/* Prepared By */}
          <div>
            <h4 className="text-[10px] font-bold text-brand-700 mb-2">
              {l(lang, 'PREPARED BY / EXPORT MANAGER', 'أعدّها / مدير التصدير')}
            </h4>
            <div className="space-y-2 text-[10px]">
              <p>
                <span className="font-semibold text-gray-600">
                  {l(lang, 'Name:', 'الاسم:')}
                </span>{' '}
                {data.preparedBy}
              </p>
              {data.showStamp && data.company.stamp && (
                <div className="mt-3">
                  <img
                    src={data.company.stamp}
                    alt="Company Stamp"
                    className="h-16 w-auto object-contain opacity-80"
                  />
                </div>
              )}
              {data.showSignature && data.company.signature && (
                <div className="mt-3">
                  <img
                    src={data.company.signature}
                    alt="Signature"
                    className="h-10 w-auto object-contain"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Customer Acknowledgment */}
          <div className={isAr ? 'text-left' : 'text-right'}>
            <h4 className="text-[10px] font-bold text-brand-700 mb-2">
              {l(lang, 'CUSTOMER ACKNOWLEDGMENT', 'تأكيد العميل')}
            </h4>
            <div className="space-y-2 text-[10px]">
              <p className="text-gray-500">
                {l(lang, 'Signature & Stamp', 'التوقيع والختم')}
              </p>
              <div className="h-20 border border-dashed border-gray-300 rounded mt-4"></div>
            </div>
          </div>
        </div>
      </footer>
    </A4Page>
  )
}