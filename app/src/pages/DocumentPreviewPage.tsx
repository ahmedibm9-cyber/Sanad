import { useState, useMemo, useCallback } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { useLanguage } from '../contexts/LanguageContext'
import { useCompany } from '../contexts/CompanyContext'
import { projects, customersFulla } from '../data/mockData'
import type { DocumentType } from '../types'
import {
  ArrowLeft, Printer, Download, FileText, Languages,
} from 'lucide-react'

/* ── helpers ──────────────────────────────────────────── */
const docTypeLabels: Record<DocumentType, { en: string; ar: string; enFull: string; arFull: string }> = {
  QUOT: { en: 'QUOTATION', ar: 'عرض أسعار', enFull: 'Quotation', arFull: 'عرض أسعار' },
  PINV: { en: 'PROFORMA INVOICE', ar: 'فاتورة مبدئية', enFull: 'Proforma Invoice', arFull: 'فاتورة مبدئية' },
  TINV: { en: 'TAX INVOICE', ar: 'فاتورة ضريبية', enFull: 'Tax Invoice', arFull: 'فاتورة ضريبية' },
  CINV: { en: 'COMMERCIAL INVOICE', ar: 'فاتورة تجارية', enFull: 'Commercial Invoice', arFull: 'فاتورة تجارية' },
  PKL:  { en: 'PACKING LIST', ar: 'قائمة التعبئة', enFull: 'Packing List', arFull: 'قائمة التعبئة' },
  DN:   { en: 'DELIVERY NOTE', ar: 'إشعار التسليم', enFull: 'Delivery Note', arFull: 'إشعار التسليم' },
  BL:   { en: 'BILL OF LADING', ar: 'بوليصة الشحن', enFull: 'Bill of Lading', arFull: 'بوليصة الشحن' },
}

/* ── shared doc data type ─────────────────────────────── */
interface DocPreviewItem {
  material: string; description: string; hsCode: string; origin: string;
  quantity: number; unit: string; unitPrice: number; currency: string; total: number;
}
interface DocPreviewParty { name: string; nameAr: string; address: string; contactPerson: string }
interface DocPreviewCompany {
  nameEn: string | undefined; nameAr: string | undefined; crNumber: string | undefined; vatNumber: string | undefined;
  address: string | undefined; phone: string | undefined; email: string | undefined; bankName: string | undefined; iban: string | undefined; swift: string | undefined;
}
interface DocPreviewData {
  id: string; type: DocumentType; number: string; date: string;
  language: 'en' | 'ar'; template: 'template-a' | 'template-b';
  preparedBy: string; showSignature: boolean; showStamp: boolean;
  vatRate: number; status: 'draft' | 'final'; notes: string; terms: string;
  items: DocPreviewItem[]; subtotal: number; vatAmount: number; total: number;
  company: DocPreviewCompany; buyer: DocPreviewParty;
  incoterm: string; portOfLoading: string; portOfDischarge: string;
}

/* ── realistic sample data ────────────────────────────── */
const sampleDoc: DocPreviewData = {
  id: 'doc-preview',
  type: 'CINV',
  number: 'CINV-2024-013',
  date: '2024-11-25',
  language: 'en',
  template: 'template-a',
  preparedBy: 'Mohamed Al-Hassan',
  showSignature: true,
  showStamp: true,
  vatRate: 0,
  status: 'draft',
  notes: '',
  terms: 'Payment to be effected within 30 days from the date of invoice. Goods remain property of the seller until full payment is received.',
  items: [
    { material: 'HDPE 952', description: 'Blow Molding Grade', hsCode: '3901.20', origin: 'Saudi Arabia', quantity: 50, unit: 'MT', unitPrice: 1050, currency: 'SAR', total: 52500 },
  ],
  subtotal: 52500,
  vatAmount: 0,
  total: 52500,
  company: {
    nameEn: 'Fulla International Trading Co.',
    nameAr: 'شركة فلا الدولية للتجارة',
    crNumber: '1010567890',
    vatNumber: '310567890100003',
    address: 'Olaya District, King Fahd Road, Riyadh 12211',
    phone: '+966 11 456 7890',
    email: 'info@fulla-trading.com',
    bankName: 'Saudi National Bank',
    iban: 'SA4420000001234567890123',
    swift: 'NCBKSAJE',
  },
  buyer: {
    name: 'Al-Baraka Trading LLC',
    nameAr: 'شركة البركة التجارية',
    address: 'Jebel Ali Free Zone, Dubai, UAE',
    contactPerson: 'Ahmed Mansour',
  },
  incoterm: 'FOB',
  portOfLoading: 'Jubail Port, Saudi Arabia',
  portOfDischarge: 'Jebel Ali Port, Dubai, UAE',
}

/* ══════════════════════════════════════════════════════ */
/*  TEMPLATE A  –  Classic Minimal                       */
/* ══════════════════════════════════════════════════════ */
function TemplateA({ data, lang }: { data: DocPreviewData; lang: 'en' | 'ar' }) {
  const isAr = lang === 'ar'
  const dir = isAr ? 'rtl' : 'ltr'
  const d = data

  return (
    <div dir={dir} className={`bg-white text-[11px] leading-relaxed ${isAr ? 'font-arabic' : ''}`} style={{ fontFamily: isAr ? "'Noto Sans Arabic', sans-serif" : "'Inter', sans-serif" }}>
      {/* ── Header ──────────────────────────────────── */}
      <div className="flex justify-between items-start pb-3 mb-4 border-b-2 border-gray-900">
        <div>
          <h1 className="text-[18px] font-bold tracking-wide text-gray-900" style={{ fontFamily: "'Inter', sans-serif" }}>
            {isAr ? d.company.nameAr : d.company.nameEn}
          </h1>
          <div className="text-[9.5px] text-gray-600 mt-1 space-y-0.5">
            <p>{isAr ? 'سجل تجاري' : 'CR'}: {d.company.crNumber} &nbsp;|&nbsp; {isAr ? 'الرقم الضريبي' : 'VAT'}: {d.company.vatNumber}</p>
            <p>{d.company.address}</p>
            <p>{d.company.phone} &nbsp;|&nbsp; {d.company.email}</p>
          </div>
        </div>
        <div className={`${isAr ? 'text-left' : 'text-right'} shrink-0`}>
          <div className="inline-block border-2 border-gray-900 px-3 py-1">
            <p className="text-[16px] font-bold tracking-wider">{isAr ? d.company.nameAr?.split(' ')[0] || 'FULLA' : 'FULLA'}</p>
          </div>
        </div>
      </div>

      {/* ── Document Title ──────────────────────────── */}
      <h2 className="text-center text-[15px] font-bold tracking-[0.2em] text-gray-900 mb-4 uppercase">
        {isAr ? docTypeLabels[d.type].arFull : docTypeLabels[d.type].enFull}
      </h2>

      {/* ── Doc Number & Date ───────────────────────── */}
      <div className={`flex justify-between mb-5 text-[10.5px] ${isAr ? 'flex-row-reverse' : ''}`}>
        <div>
          <span className="text-gray-500">{isAr ? 'رقم:' : 'No:'} </span>
          <span className="font-bold">{d.number}</span>
        </div>
        <div>
          <span className="text-gray-500">{isAr ? 'التاريخ:' : 'Date:'} </span>
          <span className="font-semibold">{new Date(d.date).toLocaleDateString(isAr ? 'ar-SA' : 'en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>

      {/* ── Shipper / Buyer ─────────────────────────── */}
      <div className="grid grid-cols-2 gap-6 mb-5">
        <div>
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">
            {isAr ? 'المُصدِّر / البائع' : 'Exporter / Seller'}
          </p>
          <p className="font-bold text-[11px]">{isAr ? d.company.nameAr : d.company.nameEn}</p>
          <p className="text-gray-600">{d.company.address}</p>
          <p className="text-gray-600">{d.company.phone}</p>
        </div>
        <div>
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">
            {isAr ? 'المشتري / العميل' : 'Buyer / Customer'}
          </p>
          <p className="font-bold text-[11px]">{isAr ? d.buyer.nameAr : d.buyer.name}</p>
          <p className="text-gray-600">{d.buyer.address}</p>
          <p className="text-gray-600">{isAr ? 'جهة الاتصال' : 'Contact'}: {d.buyer.contactPerson}</p>
        </div>
      </div>

      {/* ── Shipping Info ───────────────────────────── */}
      <div className="grid grid-cols-3 gap-4 mb-5 text-[10px]">
        <div>
          <span className="text-gray-500">{isAr ? 'شرطة التجارة:' : 'Incoterm:'}</span>
          <span className="font-semibold ms-1">{d.incoterm}</span>
        </div>
        <div>
          <span className="text-gray-500">{isAr ? 'ميناء التحميل:' : 'Port of Loading:'}</span>
          <span className="font-semibold ms-1">{d.portOfLoading}</span>
        </div>
        <div>
          <span className="text-gray-500">{isAr ? 'ميناء التفريغ:' : 'Port of Discharge:'}</span>
          <span className="font-semibold ms-1">{d.portOfDischarge}</span>
        </div>
      </div>

      {/* ── Items Table ─────────────────────────────── */}
      <div className="mb-5">
        <table className="w-full border-collapse text-[10px]">
          <thead>
            <tr className="bg-gray-50 border border-gray-300">
              {isAr ? (
                <>
                  <th className="py-1.5 px-2 text-right font-semibold border-l border-gray-300">#</th>
                  <th className="py-1.5 px-2 text-right font-semibold border-l border-gray-300">{d.type === 'CINV' ? 'كود النظام المنسق' : 'البضاعة'}</th>
                  <th className="py-1.5 px-2 text-right font-semibold border-l border-gray-300">الوصف</th>
                  <th className="py-1.5 px-2 text-right font-semibold border-l border-gray-300">المصدر</th>
                  <th className="py-1.5 px-2 text-center font-semibold border-l border-gray-300">الكمية</th>
                  <th className="py-1.5 px-2 text-center font-semibold border-l border-gray-300">الوحدة</th>
                  <th className="py-1.5 px-2 text-center font-semibold border-l border-gray-300">سعر الوحدة</th>
                  <th className="py-1.5 px-2 text-center font-semibold">المجموع</th>
                </>
              ) : (
                <>
                  <th className="py-1.5 px-2 text-left font-semibold border-r border-gray-300">#</th>
                  <th className="py-1.5 px-2 text-left font-semibold border-r border-gray-300">Description</th>
                  {d.type === 'CINV' && <th className="py-1.5 px-2 text-left font-semibold border-r border-gray-300">HS Code</th>}
                  {d.type === 'CINV' && <th className="py-1.5 px-2 text-left font-semibold border-r border-gray-300">Origin</th>}
                  <th className="py-1.5 px-2 text-center font-semibold border-r border-gray-300">Quantity</th>
                  <th className="py-1.5 px-2 text-center font-semibold border-r border-gray-300">Unit</th>
                  <th className="py-1.5 px-2 text-center font-semibold border-r border-gray-300">Unit Price</th>
                  <th className="py-1.5 px-2 text-right font-semibold">Total</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {d.items.map((item, idx) => (
              <tr key={idx} className="border border-gray-300">
                {isAr ? (
                  <>
                    <td className="py-2 px-2 text-center border-l border-gray-300">{idx + 1}</td>
                    <td className="py-2 px-2 border-l border-gray-300 font-medium">{d.type === 'CINV' ? item.hsCode : item.material}</td>
                    <td className="py-2 px-2 border-l border-gray-300">{item.description}</td>
                    <td className="py-2 px-2 border-l border-gray-300">{item.origin}</td>
                    <td className="py-2 px-2 text-center border-l border-gray-300">{item.quantity}</td>
                    <td className="py-2 px-2 text-center border-l border-gray-300">{item.unit}</td>
                    <td className="py-2 px-2 text-center border-l border-gray-300">{item.unitPrice.toLocaleString()} {item.currency}</td>
                    <td className="py-2 px-2 text-center font-bold">{item.total.toLocaleString()} {item.currency}</td>
                  </>
                ) : (
                  <>
                    <td className="py-2 px-2 text-center border-r border-gray-300">{idx + 1}</td>
                    <td className="py-2 px-2 border-r border-gray-300 font-medium">{item.material} — {item.description}</td>
                    {d.type === 'CINV' && <td className="py-2 px-2 border-r border-gray-300">{item.hsCode}</td>}
                    {d.type === 'CINV' && <td className="py-2 px-2 border-r border-gray-300">{item.origin}</td>}
                    <td className="py-2 px-2 text-center border-r border-gray-300">{item.quantity}</td>
                    <td className="py-2 px-2 text-center border-r border-gray-300">{item.unit}</td>
                    <td className="py-2 px-2 text-center border-r border-gray-300">{item.unitPrice.toLocaleString()} {item.currency}</td>
                    <td className="py-2 px-2 text-right font-bold">{item.total.toLocaleString()} {item.currency}</td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Totals ──────────────────────────────────── */}
      <div className={`flex ${isAr ? 'justify-start' : 'justify-end'} mb-5`}>
        <div className="w-64 border border-gray-300 text-[10.5px]">
          <div className={`flex justify-between py-1.5 px-3 ${isAr ? 'flex-row-reverse' : ''}`}>
            <span className="text-gray-600">{isAr ? 'المجموع الفرعي' : 'Subtotal'}</span>
            <span className="font-medium">{d.subtotal.toLocaleString()} {d.items[0]?.currency}</span>
          </div>
          {d.vatAmount > 0 && (
            <div className={`flex justify-between py-1.5 px-3 border-t border-gray-200 ${isAr ? 'flex-row-reverse' : ''}`}>
              <span className="text-gray-600">{isAr ? `الضريبة (${d.vatRate}%)` : `VAT (${d.vatRate}%)`}</span>
              <span className="font-medium">{d.vatAmount.toLocaleString()} {d.items[0]?.currency}</span>
            </div>
          )}
          <div className={`flex justify-between py-2 px-3 border-t-2 border-gray-800 bg-gray-50 font-bold text-[12px] ${isAr ? 'flex-row-reverse' : ''}`}>
            <span>{isAr ? 'المجموع' : 'Total'}</span>
            <span>{d.total.toLocaleString()} {d.items[0]?.currency}</span>
          </div>
        </div>
      </div>

      {/* ── Notes & Terms ───────────────────────────── */}
      {d.terms && (
        <div className="mb-5">
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">
            {isAr ? 'الشروط والأحكام' : 'Terms & Conditions'}
          </p>
          <p className="text-[10px] text-gray-600 leading-relaxed">{d.terms}</p>
        </div>
      )}

      {/* ── Footer: Prepared / Signature / Stamp ────── */}
      <div className="mt-8 pt-4 border-t border-gray-200">
        <div className={`flex justify-between items-end ${isAr ? 'flex-row-reverse' : ''}`}>
          {d.showSignature && (
            <div className="text-center">
              <div className="w-40 border-b border-gray-300 mb-1"></div>
              <p className="text-[9px] text-gray-500">{isAr ? 'التوقيع' : 'Signature'}</p>
            </div>
          )}
          <div className="text-center">
            <p className="text-[9px] text-gray-400 mb-0.5">{isAr ? 'أعدّه' : 'Prepared by'}</p>
            <p className="text-[10.5px] font-semibold">{d.preparedBy}</p>
          </div>
          {d.showStamp && (
            <div className="w-20 h-20 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center">
              <p className="text-[7px] text-gray-400 text-center leading-tight">{isAr ? 'ختم<br/>الشركة' : 'COMPANY<br/>STAMP'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════ */
/*  TEMPLATE B  –  Modern Minimal                        */
/* ══════════════════════════════════════════════════════ */
function TemplateB({ data, lang }: { data: DocPreviewData; lang: 'en' | 'ar' }) {
  const isAr = lang === 'ar'
  const dir = isAr ? 'rtl' : 'ltr'
  const d = data

  return (
    <div dir={dir} className={`bg-white text-[11px] leading-relaxed ${isAr ? 'font-arabic' : ''}`} style={{ fontFamily: isAr ? "'Noto Sans Arabic', sans-serif" : "'Inter', sans-serif" }}>
      {/* ── Header with subtle background ──────────── */}
      <div className="bg-gray-50 -mx-6 -mt-6 px-6 pt-6 pb-5 mb-6">
        <div className={`flex justify-between items-start ${isAr ? 'flex-row-reverse' : ''}`}>
          <div>
            <h1 className="text-[20px] font-bold text-gray-900 tracking-tight" style={{ fontFamily: "'Inter', sans-serif" }}>
              {isAr ? d.company.nameAr : d.company.nameEn}
            </h1>
            <div className="text-[9.5px] text-gray-500 mt-1.5 space-y-0.5">
              <p>{d.company.address}</p>
              <p>{d.company.phone} &nbsp;·&nbsp; {d.company.email}</p>
              <p className="text-[9px] text-gray-400 mt-1">
                {isAr ? 'سجل تجاري' : 'CR'}: {d.company.crNumber} &nbsp;·&nbsp; {isAr ? 'الرقم الضريبي' : 'VAT'}: {d.company.vatNumber}
              </p>
            </div>
          </div>
          <div className={`text-${isAr ? 'left' : 'right'} shrink-0`}>
            <div className="w-14 h-14 bg-brand-700 rounded-lg flex items-center justify-center">
              <span className="text-white text-[14px] font-bold tracking-wider" style={{ fontFamily: "'Inter', sans-serif" }}>F</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Document Type Title ─────────────────────── */}
      <div className={`mb-6 ${isAr ? 'text-right' : 'text-left'}`}>
        <h2 className="text-[22px] font-light text-gray-900 tracking-tight mb-1" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 200 }}>
          {isAr ? docTypeLabels[d.type].arFull : docTypeLabels[d.type].enFull}
        </h2>
        <div className="w-16 h-0.5 bg-brand-700 rounded-full"></div>
      </div>

      {/* ── Document Meta Cards ─────────────────────── */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-gray-50 rounded-lg px-3 py-2.5">
          <p className="text-[8.5px] text-gray-400 uppercase tracking-wider mb-0.5">{isAr ? 'رقم المستند' : 'Document No.'}</p>
          <p className="font-bold text-[12px] text-gray-900">{d.number}</p>
        </div>
        <div className="bg-gray-50 rounded-lg px-3 py-2.5">
          <p className="text-[8.5px] text-gray-400 uppercase tracking-wider mb-0.5">{isAr ? 'التاريخ' : 'Date'}</p>
          <p className="font-semibold text-[11px] text-gray-900">{new Date(d.date).toLocaleDateString(isAr ? 'ar-SA' : 'en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className="bg-gray-50 rounded-lg px-3 py-2.5">
          <p className="text-[8.5px] text-gray-400 uppercase tracking-wider mb-0.5">{isAr ? 'شرطة التجارة' : 'Incoterm'}</p>
          <p className="font-semibold text-[11px] text-gray-900">{d.incoterm}</p>
        </div>
      </div>

      {/* ── Party Cards ─────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="border border-gray-200 rounded-lg px-4 py-3">
          <p className="text-[8.5px] text-gray-400 uppercase tracking-wider mb-1.5">{isAr ? 'المُصدِّر / البائع' : 'Exporter / Seller'}</p>
          <p className="font-bold text-[11.5px] text-gray-900">{isAr ? d.company.nameAr : d.company.nameEn}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">{d.company.address}</p>
          <p className="text-[10px] text-gray-500">{d.company.phone}</p>
        </div>
        <div className="border border-gray-200 rounded-lg px-4 py-3">
          <p className="text-[8.5px] text-gray-400 uppercase tracking-wider mb-1.5">{isAr ? 'المشتري / العميل' : 'Buyer / Customer'}</p>
          <p className="font-bold text-[11.5px] text-gray-900">{isAr ? d.buyer.nameAr : d.buyer.name}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">{d.buyer.address}</p>
          <p className="text-[10px] text-gray-500">{isAr ? 'جهة الاتصال' : 'Contact'}: {d.buyer.contactPerson}</p>
        </div>
      </div>

      {/* ── Shipping Details Bar ────────────────────── */}
      <div className="flex gap-6 mb-6 py-3 border-y border-gray-100 text-[10px]">
        <div>
          <span className="text-gray-400">{isAr ? 'ميناء التحميل:' : 'Port of Loading:'} </span>
          <span className="font-medium text-gray-800">{d.portOfLoading}</span>
        </div>
        <div>
          <span className="text-gray-400">{isAr ? 'ميناء التفريغ:' : 'Port of Discharge:'} </span>
          <span className="font-medium text-gray-800">{d.portOfDischarge}</span>
        </div>
      </div>

      {/* ── Items Table (modern) ────────────────────── */}
      <div className="mb-6">
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="bg-brand-700 text-white">
                {isAr ? (
                  <>
                    <th className="py-2 px-3 text-right font-medium">#</th>
                    <th className="py-2 px-3 text-right font-medium">{d.type === 'CINV' ? 'كود النظام المنسق' : 'البضاعة'}</th>
                    <th className="py-2 px-3 text-right font-medium">الوصف</th>
                    {d.type === 'CINV' && <th className="py-2 px-3 text-right font-medium">المصدر</th>}
                    <th className="py-2 px-3 text-center font-medium">الكمية</th>
                    <th className="py-2 px-3 text-center font-medium">سعر الوحدة</th>
                    <th className="py-2 px-3 text-center font-medium">المجموع</th>
                  </>
                ) : (
                  <>
                    <th className="py-2 px-3 text-left font-medium">#</th>
                    <th className="py-2 px-3 text-left font-medium">Description</th>
                    {d.type === 'CINV' && <th className="py-2 px-3 text-left font-medium">HS Code</th>}
                    {d.type === 'CINV' && <th className="py-2 px-3 text-left font-medium">Origin</th>}
                    <th className="py-2 px-3 text-center font-medium">Qty</th>
                    <th className="py-2 px-3 text-center font-medium">Unit Price</th>
                    <th className="py-2 px-3 text-right font-medium">Total</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {d.items.map((item, idx) => (
                <tr key={idx} className={`border-t border-gray-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                  {isAr ? (
                    <>
                      <td className="py-2.5 px-3 text-center text-gray-400">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-medium">{d.type === 'CINV' ? item.hsCode : item.material}</td>
                      <td className="py-2.5 px-3 text-gray-600">{item.description}</td>
                      {d.type === 'CINV' && <td className="py-2.5 px-3 text-gray-600">{item.origin}</td>}
                      <td className="py-2.5 px-3 text-center">{item.quantity} {item.unit}</td>
                      <td className="py-2.5 px-3 text-center">{item.unitPrice.toLocaleString()} {item.currency}</td>
                      <td className="py-2.5 px-3 text-center font-semibold">{item.total.toLocaleString()} {item.currency}</td>
                    </>
                  ) : (
                    <>
                      <td className="py-2.5 px-3 text-gray-400">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-medium">{item.material} — {item.description}</td>
                      {d.type === 'CINV' && <td className="py-2.5 px-3 text-gray-600">{item.hsCode}</td>}
                      {d.type === 'CINV' && <td className="py-2.5 px-3 text-gray-600">{item.origin}</td>}
                      <td className="py-2.5 px-3 text-center">{item.quantity} {item.unit}</td>
                      <td className="py-2.5 px-3 text-center">{item.unitPrice.toLocaleString()} {item.currency}</td>
                      <td className="py-2.5 px-3 text-right font-semibold">{item.total.toLocaleString()} {item.currency}</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Totals Card ─────────────────────────────── */}
      <div className={`flex ${isAr ? 'justify-start' : 'justify-end'} mb-6`}>
        <div className="w-60 bg-gray-50 rounded-lg border border-gray-200 text-[10.5px] overflow-hidden">
          <div className={`flex justify-between py-2 px-4 ${isAr ? 'flex-row-reverse' : ''}`}>
            <span className="text-gray-500">{isAr ? 'المجموع الفرعي' : 'Subtotal'}</span>
            <span>{d.subtotal.toLocaleString()} {d.items[0]?.currency}</span>
          </div>
          {d.vatAmount > 0 && (
            <div className={`flex justify-between py-2 px-4 bg-white ${isAr ? 'flex-row-reverse' : ''}`}>
              <span className="text-gray-500">{isAr ? `الضريبة (${d.vatRate}%)` : `VAT (${d.vatRate}%)`}</span>
              <span>{d.vatAmount.toLocaleString()} {d.items[0]?.currency}</span>
            </div>
          )}
          <div className={`flex justify-between py-2.5 px-4 bg-brand-700 text-white font-bold text-[12px] ${isAr ? 'flex-row-reverse' : ''}`}>
            <span>{isAr ? 'المجموع' : 'Total'}</span>
            <span>{d.total.toLocaleString()} {d.items[0]?.currency}</span>
          </div>
        </div>
      </div>

      {/* ── Terms ───────────────────────────────────── */}
      {d.terms && (
        <div className="mb-6 bg-gray-50 rounded-lg px-4 py-3">
          <p className="text-[8.5px] text-gray-400 uppercase tracking-wider mb-1">
            {isAr ? 'الشروط والأحكام' : 'Terms & Conditions'}
          </p>
          <p className="text-[10px] text-gray-600 leading-relaxed">{d.terms}</p>
        </div>
      )}

      {/* ── Footer ──────────────────────────────────── */}
      <div className={`mt-6 pt-4 border-t border-gray-100 flex justify-between items-end ${isAr ? 'flex-row-reverse' : ''}`}>
        {d.showSignature && (
          <div className="text-center">
            <div className="w-40 border-b border-gray-300 mb-1"></div>
            <p className="text-[9px] text-gray-400">{isAr ? 'التوقيع' : 'Signature'}</p>
          </div>
        )}
        <div className="text-center">
          <p className="text-[8.5px] text-gray-400 mb-0.5">{isAr ? 'أعدّه' : 'Prepared by'}</p>
          <p className="text-[10.5px] font-semibold">{d.preparedBy}</p>
        </div>
        {d.showStamp && (
          <div className="w-16 h-16 rounded-full border border-gray-200 bg-gray-50 flex items-center justify-center">
            <p className="text-[7px] text-gray-400 text-center leading-tight">{isAr ? 'ختم' : 'STAMP'}</p>
          </div>
        )}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════ */
/*  MAIN PAGE                                            */
/* ══════════════════════════════════════════════════════ */
export default function DocumentPreviewPage() {
  const { t } = useLanguage()
  const { currentCompany } = useCompany()
  const navigate = useNavigate()
  const { id } = useParams()
  const [searchParams] = useSearchParams()

  const typeFromUrl = (searchParams.get('type') || 'CINV') as DocumentType
  const projectId = searchParams.get('projectId') || 'proj-1'
  const project = projects.find(p => p.id === projectId) || projects[0]

  /* ── state ─────────────────────────────────────────── */
  const [template, setTemplate] = useState<'template-a' | 'template-b'>(
    (currentCompany.defaultTemplate as 'template-a' | 'template-b') || 'template-a'
  )
  const [previewLang, setPreviewLang] = useState<'en' | 'ar'>('en')

  /* ── build document data from mock + project ───────── */
  const docData: DocPreviewData = useMemo(() => {
    const existingDoc = project.documents.find(d => d.id === id)
    const docType = existingDoc?.type || typeFromUrl

    // Build realistic item data from project materials
    const items = project.materials.length > 0
      ? project.materials.map(m => ({
          material: m.materialName,
          description: m.grade || '',
          hsCode: m.hsCode || '',
          origin: m.origin || 'Saudi Arabia',
          quantity: m.quantity,
          unit: m.weightUnit,
          unitPrice: m.unitPrice,
          currency: m.currency,
          total: m.quantity * m.unitPrice,
        }))
      : [{
          material: 'HDPE 952',
          description: 'Blow Molding Grade',
          hsCode: '3901.20',
          origin: 'Saudi Arabia',
          quantity: 50,
          unit: 'MT',
          unitPrice: 1050,
          currency: 'SAR',
          total: 52500,
        }]

    const subtotal = items.reduce((s, i) => s + i.total, 0)
    const vatRate = existingDoc?.vatRate ?? 0
    const vatAmount = Math.round(subtotal * (vatRate / 100) * 100) / 100

    const customer = customersFulla.find(c => c.id === project.customerId) || customersFulla[0]

    return {
      id: existingDoc?.id || id || 'doc-preview',
      type: docType,
      number: existingDoc?.number || `${docType}-${new Date().getFullYear()}-013`,
      date: existingDoc?.date || '2024-11-25',
      language: existingDoc?.language || 'en',
      template: existingDoc?.template || template,
      preparedBy: existingDoc?.preparedBy || 'Mohamed Al-Hassan',
      showSignature: existingDoc?.showSignature ?? true,
      showStamp: existingDoc?.showStamp ?? true,
      vatRate,
      status: existingDoc?.status || 'draft',
      notes: '',
      terms: 'Payment to be effected within 30 days from the date of invoice. Goods remain property of the seller until full payment is received. In case of dispute, the courts of Riyadh shall have jurisdiction.',
      items,
      subtotal,
      vatAmount,
      total: subtotal + vatAmount,
      company: {
        nameEn: currentCompany.legalNameEn || currentCompany.nameEn,
        nameAr: currentCompany.legalNameAr || currentCompany.nameAr,
        crNumber: currentCompany.crNumber || '',
        vatNumber: currentCompany.vatNumber || '',
        address: currentCompany.address || '',
        phone: currentCompany.phone || '',
        email: currentCompany.email || '',
        bankName: currentCompany.bankName || '',
        iban: currentCompany.iban || '',
        swift: currentCompany.swift || '',
      },
      buyer: {
        name: customer.name,
        nameAr: customer.nameAr || customer.name,
        address: customer.address || '',
        contactPerson: customer.contactPerson || '',
      },
      incoterm: project.incoterm || currentCompany.defaultIncoterm || 'FOB',
      portOfLoading: project.portOfLoading || 'Jubail Port, Saudi Arabia',
      portOfDischarge: project.portOfDischarge || 'Jebel Ali Port, Dubai, UAE',
    }
  }, [id, typeFromUrl, project, currentCompany, template])

  /* ── print ─────────────────────────────────────────── */
  const handlePrint = useCallback(() => {
    window.print()
  }, [])

  /* ── download (simulated) ──────────────────────────── */
  const handleDownload = useCallback(() => {
    alert(t(
      `PDF download for ${docData.number} would start here.\nIn production, this would use a PDF generation library (e.g. react-pdf, jsPDF, or server-side rendering).`,
      `سيبدأ تنزيل PDF لـ ${docData.number} هنا.\nفي الإنتاج، سيتم استخدام مكتبة توليد PDF (مثل react-pdf أو jsPDF).`
    ))
  }, [docData.number, t])

  /* ════════════════════════════════════════════════════ */
  return (
    <div className="max-w-5xl mx-auto">
      {/* ── Top Toolbar (hidden on print) ────────────── */}
      <div className="print:hidden flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="btn-ghost p-2">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-brand-900">
              {t('Document Preview', 'معاينة المستند')}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {docData.number} — {t(docTypeLabels[docData.type].enFull, docTypeLabels[docData.type].arFull)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleDownload} className="btn-secondary">
            <Download size={16} className="ms-1.5" />
            {t('Download PDF', 'تنزيل PDF')}
          </button>
          <button onClick={handlePrint} className="btn-primary">
            <Printer size={16} className="ms-1.5" />
            {t('Print', 'طباعة')}
          </button>
        </div>
      </div>

      {/* ── Controls (hidden on print) ───────────────── */}
      <div className="print:hidden flex items-center gap-4 mb-4 p-3 bg-white rounded-lg border border-gray-200">
        {/* Template Toggle */}
        <div className="flex items-center gap-2">
          <FileText size={16} className="text-gray-400" />
          <span className="text-sm font-medium text-gray-600">{t('Template:', 'القالب:')}</span>
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            <button
              onClick={() => setTemplate('template-a')}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                template === 'template-a'
                  ? 'bg-brand-700 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {t('A — Classic', 'أ — كلاسيكي')}
            </button>
            <button
              onClick={() => setTemplate('template-b')}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                template === 'template-b'
                  ? 'bg-brand-700 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {t('B — Modern', 'ب — عصري')}
            </button>
          </div>
        </div>

        <div className="w-px h-6 bg-gray-200"></div>

        {/* Language Toggle */}
        <div className="flex items-center gap-2">
          <Languages size={16} className="text-gray-400" />
          <span className="text-sm font-medium text-gray-600">{t('Language:', 'اللغة:')}</span>
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            <button
              onClick={() => setPreviewLang('en')}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                previewLang === 'en'
                  ? 'bg-brand-700 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              English
            </button>
            <button
              onClick={() => setPreviewLang('ar')}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                previewLang === 'ar'
                  ? 'bg-brand-700 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              العربية
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          A4 DOCUMENT PREVIEW
          ═══════════════════════════════════════════════ */}
      <div className="flex justify-center mb-8 print:mb-0">
        <div
          className="bg-white shadow-xl print:shadow-none w-full"
          style={{
            maxWidth: '800px',
            minHeight: '1122px', /* A4 approx at 96dpi */
            padding: '48px 56px',
            pageBreakAfter: 'always',
          }}
        >
          {template === 'template-a' ? (
            <TemplateA data={docData} lang={previewLang} />
          ) : (
            <TemplateB data={docData} lang={previewLang} />
          )}
        </div>
      </div>

      {/* ── Bottom Actions (hidden on print) ─────────── */}
      <div className="print:hidden flex items-center justify-between mb-8">
        <button onClick={() => navigate(-1)} className="btn-ghost">
          <ArrowLeft size={16} className="ms-1.5" />
          {t('Back', 'رجوع')}
        </button>
        <div className="flex items-center gap-2">
          <button onClick={handleDownload} className="btn-secondary">
            <Download size={16} className="ms-1.5" />
            {t('Download PDF', 'تنزيل PDF')}
          </button>
          <button onClick={handlePrint} className="btn-primary">
            <Printer size={16} className="ms-1.5" />
            {t('Print', 'طباعة')}
          </button>
        </div>
      </div>
    </div>
  )
}
