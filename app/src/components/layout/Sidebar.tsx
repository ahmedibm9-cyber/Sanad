import { NavLink, useLocation } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext'
import { useCompany } from '../../contexts/CompanyContext'
import { useApp } from '../../contexts/AppContext'
import {
  LayoutDashboard, FolderOpen, ListTodo, CheckSquare, Users, Package,
  Factory, BarChart3, Activity, Trash2, Settings, ChevronDown, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { useState } from 'react'

// ─── Grouped navigation ───────────────────────────────────
interface NavSection {
  labelEn: string
  labelAr: string
  items: { path: string; icon: typeof LayoutDashboard; en: string; ar: string }[]
}

const navSections: NavSection[] = [
  {
    labelEn: 'Work',
    labelAr: 'العمل',
    items: [
      { path: '/dashboard', icon: LayoutDashboard, en: 'Dashboard', ar: 'لوحة التحكم' },
      { path: '/projects', icon: FolderOpen, en: 'Projects', ar: 'المشاريع' },
      { path: '/tasks', icon: ListTodo, en: 'Tasks', ar: 'المهام' },
      { path: '/todos', icon: CheckSquare, en: 'To-dos', ar: 'المهام الشخصية' },
    ],
  },
  {
    labelEn: 'Data',
    labelAr: 'البيانات',
    items: [
      { path: '/customers', icon: Users, en: 'Customers', ar: 'العملاء' },
      { path: '/materials', icon: Package, en: 'Materials', ar: 'المواد' },
      { path: '/factory', icon: Factory, en: 'Factory Code', ar: 'كود المصنع' },
    ],
  },
  {
    labelEn: 'Insights',
    labelAr: 'المعلومات',
    items: [
      { path: '/reports', icon: BarChart3, en: 'Reports', ar: 'التقارير' },
      { path: '/activity', icon: Activity, en: 'Activity', ar: 'سجل النشاط' },
    ],
  },
  {
    labelEn: 'System',
    labelAr: 'النظام',
    items: [
      { path: '/trash', icon: Trash2, en: 'Trash', ar: 'سلة المهملات' },
      { path: '/settings', icon: Settings, en: 'Settings', ar: 'الإعدادات' },
    ],
  },
]

export default function Sidebar() {
  const { t, dir } = useLanguage()
  const { currentCompany, allCompanies, setCurrentCompany } = useCompany()
  const { currentUser } = useApp()
  const [companyOpen, setCompanyOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()
  const isRtl = dir === 'rtl'

  const userInitials = currentUser.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)

  return (
    <aside
      className={`${collapsed ? 'w-[68px]' : 'w-56'} h-full bg-white border-r border-gray-200 flex flex-col transition-all duration-200 shrink-0`}
      role="navigation"
      aria-label={t('Main navigation', 'التنقل الرئيسي')}
    >
      {/* Logo */}
      <div className="h-14 flex items-center justify-between px-3 border-b border-gray-100 shrink-0">
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-brand-700 rounded-lg flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-900 leading-tight tracking-tight">SANAD</h1>
              <p className="text-[10px] text-gray-400 leading-none">سند</p>
            </div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 hover:bg-gray-100 rounded-md text-gray-400 hover:text-gray-600 transition-colors"
          aria-label={collapsed ? t('Expand sidebar', 'توسيع الشريط') : t('Collapse sidebar', 'طي الشريط')}
        >
          {collapsed ? <ChevronRight size={16} className={isRtl ? 'rotate-180' : ''} /> : <ChevronLeft size={16} className={isRtl ? 'rotate-180' : ''} />}
        </button>
      </div>

      {/* Company Switcher */}
      {!collapsed && (
        <div className="px-2.5 py-2 border-b border-gray-100 shrink-0">
          <button
            onClick={() => setCompanyOpen(!companyOpen)}
            className="w-full flex items-center justify-between px-2.5 py-2 text-sm rounded-md hover:bg-gray-50 transition-colors"
            aria-expanded={companyOpen}
            aria-haspopup="listbox"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 bg-brand-100 rounded flex items-center justify-center text-brand-700 text-xs font-bold shrink-0">
                {currentCompany.shortName[0]}
              </div>
              <span className="truncate font-medium text-gray-800">{currentCompany.shortName}</span>
            </div>
            <ChevronDown size={14} className={`text-gray-400 transition-transform duration-150 ${companyOpen ? 'rotate-180' : ''}`} />
          </button>
          {companyOpen && (
            <div className="mt-1 dropdown-panel" role="listbox">
              {allCompanies.map((company) => (
                <button
                  key={company.id}
                  onClick={() => { setCurrentCompany(company.id); setCompanyOpen(false) }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${company.id === currentCompany.id ? 'bg-brand-50 text-brand-700 font-medium' : 'text-gray-700'}`}
                  role="option"
                  aria-selected={company.id === currentCompany.id}
                >
                  <div className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center text-xs font-bold shrink-0">
                    {company.shortName[0]}
                  </div>
                  <div className={isRtl ? 'text-right' : 'text-left'}>
                    <div className="font-medium">{company.shortName}</div>
                    <div className="text-xs text-gray-400">{company.code}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Navigation – Grouped Sections */}
      <nav className="flex-1 overflow-y-auto py-3 px-2" aria-label={t('Main navigation', 'التنقل الرئيسي')}>
        {navSections.map((section, sIdx) => (
          <div key={section.labelEn} className={sIdx > 0 ? 'mt-4' : ''}>
            {/* Section header */}
            {!collapsed && (
              <p className="px-2.5 mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                {t(section.labelEn, section.labelAr)}
              </p>
            )}
            {collapsed && sIdx > 0 && (
              <div className="mx-2 my-2 border-t border-gray-100" />
            )}
            {section.items.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname.startsWith(item.path)
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm mb-0.5 transition-colors duration-100 ${
                    isActive
                      ? 'bg-brand-50 text-brand-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                  title={collapsed ? t(item.en, item.ar) : undefined}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon size={18} className="shrink-0" />
                  {!collapsed && <span>{t(item.en, item.ar)}</span>}
                </NavLink>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Footer – Current User */}
      {!collapsed && (
        <div className="px-2.5 py-3 border-t border-gray-100 shrink-0">
          <div className="flex items-center gap-2 px-2">
            <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 text-xs font-bold shrink-0" aria-hidden="true">
              {userInitials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{currentUser.name}</p>
              <p className="text-xs text-gray-400 capitalize">{currentUser.role}</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
