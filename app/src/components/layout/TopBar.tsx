import { useLanguage } from '../../contexts/LanguageContext'
import { useCompany } from '../../contexts/CompanyContext'
import { useApp } from '../../contexts/AppContext'
import { useNavigate } from 'react-router-dom'
import { Search, Bell, Globe, User, ChevronDown } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { notifications as mockNotifications } from '../../data/mockData'

export default function TopBar() {
  const { language, setLanguage, t } = useLanguage()
  const { currentCompany } = useCompany()
  const { currentUser, setCurrentUser } = useApp()
  const navigate = useNavigate()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const unreadCount = mockNotifications.filter(n => !n.read).length
  const userMenuRef = useRef<HTMLDivElement>(null)
  const langRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false)
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const users = [
    { id: 'user-1', name: 'Mohamed Al-Hassan', email: 'mohamed@sanad-app.com', role: 'admin' },
    { id: 'user-2', name: 'Fatima Al-Rashid', email: 'fatima@sanad-app.com', role: 'user' },
    { id: 'user-3', name: 'Omar Saeed', email: 'omar@sanad-app.com', role: 'user' },
    { id: 'user-4', name: 'Nora Khalil', email: 'nora@sanad-app.com', role: 'viewer' },
  ]

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0">
      {/* Search */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-brand-700 font-bold text-lg"
        >
          <div className="w-7 h-7 bg-brand-700 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xs">S</span>
          </div>
          <span className="hidden lg:inline">SANAD</span>
        </button>
        <div className="hidden md:flex items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 w-80 ml-4">
          <Search size={16} className="text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder={t('Search projects, customers, materials...', 'ابحث عن المشاريع والعملاء والمواد...')}
            className="ml-2 bg-transparent text-sm w-full focus:outline-none text-gray-700 placeholder-gray-400"
          />
          <kbd className="text-[10px] text-gray-400 bg-white border border-gray-200 px-1.5 py-0.5 rounded ml-2 shrink-0">⌘K</kbd>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Language Switcher */}
        <div ref={langRef} className="relative">
          <button
            onClick={() => setLangOpen(!langOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <Globe size={16} />
            <span className="hidden sm:inline">{language === 'en' ? 'EN' : 'AR'}</span>
          </button>
          {langOpen && (
            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-50 w-32">
              <button
                onClick={() => { setLanguage('en'); setLangOpen(false) }}
                className={`w-full px-3 py-2 text-sm text-left hover:bg-gray-50 ${language === 'en' ? 'bg-brand-50 text-brand-700 font-medium' : ''}`}
              >
                English
              </button>
              <button
                onClick={() => { setLanguage('ar'); setLangOpen(false) }}
                className={`w-full px-3 py-2 text-sm text-right hover:bg-gray-50 ${language === 'ar' ? 'bg-brand-50 text-brand-700 font-medium' : ''}`}
              >
                العربية
              </button>
            </div>
          )}
        </div>

        {/* Notifications */}
        <button
          onClick={() => navigate('/notifications')}
          className="relative p-2 text-gray-500 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
              {unreadCount}
            </span>
          )}
        </button>

        {/* User Menu */}
        <div ref={userMenuRef} className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 text-xs font-bold">
              {currentUser.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-gray-800 leading-tight">{currentUser.name}</p>
              <p className="text-xs text-gray-400 leading-tight capitalize">{currentUser.role}</p>
            </div>
            <ChevronDown size={14} className="text-gray-400 hidden md:block" />
          </button>
          {userMenuOpen && (
            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-50 w-56">
              <div className="px-3 py-2 border-b border-gray-100">
                <p className="text-xs text-gray-400">{t('Switch User (Demo)', 'تبديل المستخدم (عرض تجريبي)')}</p>
              </div>
              {users.map((u) => (
                <button
                  key={u.id}
                  onClick={() => { setCurrentUser(u); setUserMenuOpen(false) }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 ${u.id === currentUser.id ? 'bg-brand-50' : ''}`}
                >
                  <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-600">
                    {u.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-gray-800">{u.name}</div>
                    <div className="text-xs text-gray-400 capitalize">{u.role}</div>
                  </div>
                </button>
              ))}
              <div className="border-t border-gray-100 px-3 py-2">
                <button onClick={() => { navigate('/users'); setUserMenuOpen(false) }}
                  className="text-xs text-brand-600 hover:text-brand-700 font-medium">
                  {t('Manage Users', 'إدارة المستخدمين')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
