import type { TemplateProps } from '../types'
import { formatDate, l, dir, align } from '../primitives/format'
import { A4Page } from '../primitives/A4Page'
import { mapDeliveryNoteData } from './mapping'

/* ── Delivery Note Template ───────────────────────────── */
export default function DeliveryNoteTemplate({ data, lang }: TemplateProps) {
  const d = mapDeliveryNoteData(data)
  const isAr = lang === 'ar'
  const direction = dir(lang)
  const textAlign = align(lang)

  return (
    <A4Page templateKey="fulla-delivery-note-680" lang={lang}>
      <div dir={direction} className="flex flex-col gap-3">
        {/* ── Header ─────────────────────────────────────── */}
        <div
          className="rounded-t-lg px-6 py-5 text-white"
          style={{ backgroundColor: '#1a5c2a' }}
        >
          <div className="flex items-center justify-between">
            {/* Logo + Company Name */}
            <div className="flex items-center gap-3">
              {data.company.logo && (
                <img
                  src={data.company.logo}
                  alt="Company Logo"
                  className="h-12 w-12 rounded bg-white/10 object-contain"
                />
              )}
              <div>
                <div className="text-lg font-bold tracking-wide">
                  {l(lang, data.company.nameEn, data.company.nameAr || data.company.nameEn)}
                </div>
                {data.company.legalNameEn && (
                  <div className="text-xs opacity-80">
                    {l(lang, data.company.legalNameEn, data.company.legalNameAr || '')}
                  </div>
                )}
              </div>
            </div>

            {/* Title */}
            <div className={`${isAr ? 'mr-auto' : 'ml-auto'} text-center`}>
              <div className="text-2xl font-extrabold tracking-widest uppercase">
                {l(lang, 'DELIVERY NOTE', 'إشعار التسليم')}
              </div>
              <div className="mt-1 text-xs opacity-80">
                {l(lang, 'Shipping & Delivery Document', 'مستند الشحن والتسليم')}
              </div>
            </div>
          </div>
        </div>

        {/* ── Delivery Details Row ───────────────────────── */}
        <div className="grid grid-cols-3 gap-2 rounded border border-gray-200 bg-gray-50 p-3 text-[10px]">
          <DetailField
            label={l(lang, 'Delivery Note No.', 'رقم إشعار التسليم')}
            value={d.deliveryDetails.deliveryNoteNumber}
            lang={lang}
          />
          <DetailField
            label={l(lang, 'Date', 'التاريخ')}
            value={formatDate(d.deliveryDetails.date, lang)}
            lang={lang}
          />
          <DetailField
            label={l(lang, 'Customer / Importer', 'العميل / المستورد')}
            value={d.deliveryDetails.customerImporter}
            lang={lang}
          />
          <DetailField
            label={l(lang, 'Shipping Method', 'طريقة الشحن')}
            value={d.deliveryDetails.shippingMethod}
            lang={lang}
          />
          <DetailField
            label={l(lang, 'Destination Country', 'دولة الوجهة')}
            value={d.deliveryDetails.destinationCountry}
            lang={lang}
          />
          <DetailField
            label={l(lang, 'Deliver Before', ' التسليم قبل')}
            value={d.deliveryDetails.deliverBefore}
            lang={lang}
          />
        </div>

        {/* ── Document Details Row ───────────────────────── */}
        <div className="grid grid-cols-4 gap-2 rounded border border-gray-200 bg-gray-50 p-3 text-[10px]">
          <DetailField
            label={l(lang, 'Invoice No.', 'رقم الفاتورة')}
            value={d.documentDetails.invoiceNumber}
            lang={lang}
          />
          <DetailField
            label={l(lang, 'Document No.', 'رقم المستند')}
            value={d.documentDetails.documentNumber}
            lang={lang}
          />
          <DetailField
            label={l(lang, 'Date', 'التاريخ')}
            value={formatDate(d.documentDetails.date, lang)}
            lang={lang}
          />
          <DetailField
            label={l(lang, 'Customer / Consignee', 'العميل / المستلم')}
            value={d.documentDetails.customerConsignee}
            lang={lang}
          />
          <DetailField
            label={l(lang, 'Invoice Ref.', 'مرجع الفاتورة')}
            value={d.documentDetails.customerInvoiceReference}
            lang={lang}
          />
          <DetailField
            label={l(lang, 'Destination', 'الوجهة')}
            value={d.documentDetails.destination}
            lang={lang}
          />
          <DetailField
            label={l(lang, 'Shipping Method', 'طريقة الشحن')}
            value={d.documentDetails.shippingMethod}
            lang={lang}
          />
          <DetailField
            label={l(lang, 'Prepare Before', 'التحضير قبل')}
            value={d.documentDetails.prepareBefore}
            lang={lang}
          />
        </div>

        {/* ── Materials Table ─────────────────────────────── */}
        <div className="overflow-hidden rounded border border-gray-300">
          <table className="w-full border-collapse text-[10px]">
            <thead>
              <tr
                className="text-white"
                style={{ backgroundColor: '#1a5c2a' }}
              >
                <Th>{l(lang, 'No.', 'م')}</Th>
                <Th>{l(lang, 'Item Code', 'كود الصنف')}</Th>
                <Th>{l(lang, 'Item Name / Material Description', 'اسم الصنف / وصف المادة')}</Th>
                <Th>{l(lang, 'Unit', 'الوحدة')}</Th>
                <Th>{l(lang, 'Quantity / Delivered', 'الكمية / المُسلّمة')}</Th>
                <Th>{l(lang, 'Origin', 'المنشأ')}</Th>
                <Th>{l(lang, 'Remarks', 'ملاحظات')}</Th>
              </tr>
            </thead>
            <tbody>
              {d.materials.length === 0 ? (
                <tr>
                  <Td colSpan={7} className="py-6 text-center text-gray-400 italic">
                    {l(lang, 'No items', 'لا توجد عناصر')}
                  </Td>
                </tr>
              ) : (
                d.materials.map((row, idx) => (
                  <tr
                    key={idx}
                    className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                  >
                    <Td className="text-center">{row.rowNumber}</Td>
                    <Td>{row.itemCode}</Td>
                    <Td>{row.itemName}</Td>
                    <Td className="text-center">{row.unit}</Td>
                    <Td className="text-center">{row.quantity.toLocaleString()}</Td>
                    <Td>{row.countryOfOrigin}</Td>
                    <Td>{row.remarks}</Td>
                  </tr>
                ))
              )}
              {/* Empty filler rows to maintain minimum table height */}
              {d.materials.length > 0 &&
                d.materials.length < 5 &&
                Array.from({ length: 5 - d.materials.length }).map((_, i) => (
                  <tr key={`empty-${i}`} className="bg-white">
                    <Td className="text-center text-gray-300">{d.materials.length + i + 1}</Td>
                    <Td>&nbsp;</Td>
                    <Td>&nbsp;</Td>
                    <Td>&nbsp;</Td>
                    <Td>&nbsp;</Td>
                    <Td>&nbsp;</Td>
                    <Td>&nbsp;</Td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* ── Notes ──────────────────────────────────────── */}
        {data.notes && (
          <div className="rounded border border-gray-200 bg-gray-50 p-3 text-[10px]">
            <div className="mb-1 font-semibold text-gray-600">
              {l(lang, 'Notes:', 'ملاحظات:')}
            </div>
            <div className="whitespace-pre-wrap text-gray-700">{data.notes}</div>
          </div>
        )}

        {/* ── Approval / Receipt Section ─────────────────── */}
        <div className="mt-auto grid grid-cols-4 gap-3 rounded border border-gray-300 bg-white p-4 text-[10px]">
          <SignatureBlock
            label={l(lang, 'Approved By', 'اعتمد من')}
            lang={lang}
          />
          <SignatureBlock
            label={l(lang, 'Prepared / Export Manager', 'أعدّ / مدير التصدير')}
            lang={lang}
          />
          <SignatureBlock
            label={l(lang, 'Received By', 'استلم من')}
            lang={lang}
          />
          <SignatureBlock
            label={l(lang, 'Customer / Carrier', 'العميل / الناقل')}
            lang={lang}
          />
        </div>

        {/* ── Footer ─────────────────────────────────────── */}
        <div
          className="flex items-center justify-between rounded-b-lg px-4 py-2 text-[9px] text-white"
          style={{ backgroundColor: '#1a5c2a' }}
        >
          <span>{l(lang, 'Confidential', 'سري')}</span>
          <span>
            {l(lang, `Page 1 of 1`, 'صفحة ١ من ١')}
          </span>
          <span>{l(lang, 'Generated by SANAD', 'تم الإنشاء بواسطة سناد')}</span>
        </div>
      </div>
    </A4Page>
  )
}

/* ── Sub-components ───────────────────────────────────── */

function DetailField({
  label,
  value,
  lang,
}: {
  label: string
  value: string
  lang: 'en' | 'ar'
}) {
  const isAr = lang === 'ar'
  return (
    <div className={`${isAr ? 'text-right' : 'text-left'}`}>
      <div className="mb-0.5 font-semibold text-gray-500">{label}</div>
      <div className="font-medium text-gray-800">{value || '—'}</div>
    </div>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="border border-gray-400 px-2 py-1.5 text-center text-[10px] font-bold">
      {children}
    </th>
  )
}

function Td({
  children,
  className = '',
  colSpan,
}: {
  children: React.ReactNode
  className?: string
  colSpan?: number
}) {
  return (
    <td
      className={`border border-gray-200 px-2 py-1.5 ${className}`}
      colSpan={colSpan}
    >
      {children}
    </td>
  )
}

function SignatureBlock({
  label,
  lang,
}: {
  label: string
  lang: 'en' | 'ar'
}) {
  const isAr = lang === 'ar'
  return (
    <div className={`flex flex-col items-center ${isAr ? 'text-right' : 'text-left'}`}>
      <div className="mb-8 w-full border-b border-gray-400" />
      <div className="text-[9px] font-semibold text-gray-500">{label}</div>
    </div>
  )
}
