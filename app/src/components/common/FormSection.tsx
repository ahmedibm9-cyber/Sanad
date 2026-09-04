import type { ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { useState } from 'react'

interface FormSectionProps {
  title: string
  titleAr?: string
  subtitle?: string
  children: ReactNode
  defaultOpen?: boolean
}

export default function FormSection({ title, titleAr, subtitle, children, defaultOpen = true }: FormSectionProps) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors duration-100"
        aria-expanded={open}
      >
        <div className="text-left">
          <span className="text-sm font-semibold text-gray-800">{title}</span>
          {(subtitle || titleAr) && <span className="text-xs text-gray-400 ml-2">{subtitle || titleAr}</span>}
        </div>
        <ChevronDown size={16} className={`text-gray-400 transition-transform duration-150 ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      <div
        className={`transition-all duration-200 ease-out ${open ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}
      >
        <div className="px-4 py-4 space-y-4">
          {children}
        </div>
      </div>
    </div>
  )
}
