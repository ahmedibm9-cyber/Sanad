import type { ReactNode } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

interface FormSectionProps {
  title: string
  titleAr?: string
  children: ReactNode
  defaultOpen?: boolean
}

export default function FormSection({ title, titleAr, children, defaultOpen = true }: FormSectionProps) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button type="button" onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-5 py-3 bg-gray-50 hover:bg-gray-100 transition-colors">
        <span className="text-sm font-semibold text-brand-800">{title}{titleAr ? ` — ${titleAr}` : ''}</span>
        {open ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
      </button>
      {open && <div className="px-5 py-4 space-y-4">{children}</div>}
    </div>
  )
}
