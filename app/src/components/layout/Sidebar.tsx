import { NavLink, useLocation } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext'
import { useCompany } from '../../contexts/CompanyContext'
import {
  LayoutDashboard, FolderOpen, ListTodo, CheckSquare, Users, Package,
  Factory, BarChart3, Activity, Trash2, Settings, ChevronDown, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, en: 'Dashboard', ar: 'لوحة التحكم' },
  { path: '/projects', icon: FolderOpen, en: 'Projects', ar: 'المشاريع' },
  { path: '/tasks', icon: ListTodo, en: 'Tasks', ar: 'المهام' },
  { path: '/todos', icon: CheckSquare, en: 'To-dos', ar: 'المهام الشخصية' },
  { path: '/customers', icon: Users, en: 'Customers', ar: 'العملاء' },
  { path: '/materials', icon: Package, en: 'Materials', ar: 'المواد' },
  { path: '/factory', icon: Factory, en: 'Factory Code', ar: 'كود المصنع' },
  { path: '/reports', icon: BarChart3, en: 'Reports', ar: 'التقارير' },
  { path: '/activity', icon: Activity, en: 'Activity', ar: 'سجل النشاط' },
  { path: '/trash', icon: Trash2, en: 'Trash', ar: 'سلة المهملات' },
  { path: '/settings', icon: Settings, en: 'Settings', ar: 'الإعدادات' },
]

export default function Sidebar() {
  const { t } = useLanguage()
  const { currentCompany, allCompanies, setCurrentCompany } = useCompany()
  const [companyOpen, setCompanyOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()

  return (
    <aside className={`${collapsed ? 'w-[68px]' : 'w-60'} h-full bg-white border-r border-gray-200 flex flex-col transition-all duration-200 shrink-0`}>
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <div>
              <h1 className="text-base font-bold text-brand-900 leading-tight">SANAD</h1>
              <p className="text-[10px] text-gray-400 leading-none">سند</p>
            </div>
          </div>
        )}
        <button onClick={() => setCollapsed(!collapsed)} className="p-1 hover:bg-gray-100 rounded text-gray-400">
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Company Switcher */}
      {!collapsed && (
        <div className="px-3 py-2 border-b border-gray-100">
          <button
            onClick={() => setCompanyOpen(!companyOpen)}
            className="w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 bg-brand-100 rounded flex items-center justify-center text-brand-700 text-xs font-bold shrink-0">
                {currentCompany.shortName[0]}
              </div>
              <span className="truncate font-medium text-gray-800">{currentCompany.shortName}</span>
            </div>
            <ChevronDown size={14} className={`text-gray-400 transition-transform ${companyOpen ? 'rotate-180' : ''}`} />
          </button>
          {companyOpen && (
            <div className="mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
              {allCompanies.map((company) => (
                <button
                  key={company.id}
                  onClick={() => { setCurrentCompany(company.id); setCompanyOpen(false) }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${company.id === currentCompany.id ? 'bg-brand-50 text-brand-700 font-medium' : 'text-gray-700'}`}
                >
                  <div className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center text-xs font-bold">
                    {company.shortName[0]}
                  </div>
                  <div className="text-left">
                    <div className="font-medium">{company.shortName}</div>
                    <div className="text-xs text-gray-400">{company.code}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 px-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname.startsWith(item.path)
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm mb-0.5 transition-colors ${
                isActive
                  ? 'bg-brand-50 text-brand-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
              title={collapsed ? t(item.en, item.ar) : undefined}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && <span>{t(item.en, item.ar)}</span>}
            </NavLink>
          )
        })}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="px-3 py-3 border-t border-gray-100">
          <div className="flex items-center gap-2 px-2">
            <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 text-xs font-bold">
              MH
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">Mohamed Al-Hassan</p>
              <p className="text-xs text-gray-400">Admin</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
