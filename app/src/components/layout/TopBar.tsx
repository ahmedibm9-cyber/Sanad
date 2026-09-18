import { useLanguage } from '../../contexts/useLanguage'
import { useCompany } from '../../contexts/useCompany'
import { useApp } from '../../contexts/useApp'
import { useNavigate } from 'react-router-dom'
import { Search, Bell, Globe, ChevronDown, LogOut } from 'lucide-react'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useNotifications } from '../../hooks/useData'
import GlobalSearch from '../common/GlobalSearch'
import NotificationPanel from '../common/NotificationPanel'
import { useAuth } from '../../contexts/useAuth'

export default function TopBar() {
  const { language, setLanguage, t, dir } = useLanguage()
  const { currentCompany } = useCompany()
  const { currentUser, searchOpen, setSearchOpen } = useApp()
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const isRtl = dir === 'rtl'
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const [notifPanelOpen, setNotifPanelOpen] = useState(false)
  const { data: hookNotifications } = useNotifications(currentUser?.id)
  const [unreadCount, setUnreadCount] = useState(0)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const langRef = useRef<HTMLDivElement>(null)

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false)
    if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false)
  }, [])

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [handleClickOutside])

  // Keyboard shortcut for search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [setSearchOpen])

  // Sync unread count from hook data
  useEffect(() => {
    if (hookNotifications) {
      setUnreadCount(hookNotifications.filter((n: any) => !n.read).length)
    }
  }, [hookNotifications])

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0" role="banner">
{/* Left: Search */}
       <div className="flex items-center gap-3">
         {/* Company Indicator */}
         <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-brand-50 border border-brand-200 rounded-md">
           <div className="w-5 h-5 bg-brand-600 rounded flex items-center justify-center">
             <span className="text-white text-[10px] font-bold">{currentCompany?.short_name?.charAt(0) || '?'}</span>
           </div>
           <span className="text-sm font-semibold text-brand-700 hidden sm:inline">{currentCompany?.short_name || 'Select'}</span>
         </div>
         <button
           onClick={() => setSearchOpen(true)}
           className="hidden md:flex items-center bg-gray-50 border border-gray-200 rounded-md px-3 py-1.5 w-72 transition-colors focus-within:border-brand-400 focus-within:bg-white focus-within:ring-1 focus-within:ring-brand-400 cursor-pointer"
           aria-label={t('Search...', 'بحث...')}
         >
            <Search size={15} className="text-gray-600 shrink-0" aria-hidden="true" />
            <span className={`${isRtl ? 'mr-2' : 'ml-2'} bg-transparent text-sm w-full text-gray-700`}>
             {t('Search...', 'بحث...')}
           </span>
            <kbd className="text-xs text-gray-700 bg-white border border-gray-200 px-1.5 py-0.5 rounded shrink-0" aria-hidden="true">⌘K</kbd>
         </button>
       </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1">
        {/* Language Switcher */}
        <div ref={langRef} className="relative">
          <button
            onClick={() => setLangOpen(!langOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
            aria-label={t('Switch language', 'تبديل اللغة')}
            aria-expanded={langOpen}
            aria-haspopup="listbox"
          >
            <Globe size={16} aria-hidden="true" />
            <span className="hidden sm:inline font-medium">{language === 'en' ? 'EN' : 'AR'}</span>
          </button>
          {langOpen && (
            <div className="absolute top-full mt-1 dropdown-panel w-32" role="listbox">
              <button
                onClick={() => { setLanguage('en'); setLangOpen(false) }}
                className={`w-full px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors ${language === 'en' ? 'bg-brand-50 text-brand-700 font-medium' : 'text-gray-700'}`}
                role="option"
                aria-selected={language === 'en'}
              >
                English
              </button>
              <button
                onClick={() => { setLanguage('ar'); setLangOpen(false) }}
                className={`w-full px-3 py-2 text-sm text-right hover:bg-gray-50 transition-colors ${language === 'ar' ? 'bg-brand-50 text-brand-700 font-medium' : 'text-gray-700'}`}
                role="option"
                aria-selected={language === 'ar'}
              >
                العربية
              </button>
            </div>
          )}
        </div>

        {/* Notifications */}
        <button
          onClick={() => setNotifPanelOpen(!notifPanelOpen)}
          className="relative p-2 text-gray-500 hover:bg-gray-50 rounded-md transition-colors"
          aria-label={t('Notifications', 'الإشعارات')}
        >
          <Bell size={18} aria-hidden="true" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold" aria-label={`${unreadCount} unread`}>
              {unreadCount}
            </span>
          )}
        </button>

        {/* User Menu */}
        <div ref={userMenuRef} className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 px-2 py-1 hover:bg-gray-50 rounded-md transition-colors"
            aria-label={t('User menu', 'قائمة المستخدم')}
            aria-expanded={userMenuOpen}
            aria-haspopup="menu"
          >
            <div className="w-7 h-7 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 text-xs font-bold shrink-0" aria-hidden="true">
              {currentUser.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-gray-800 leading-tight">{currentUser.name}</p>
              <p className="text-xs text-gray-700 leading-tight capitalize">{currentUser.role}</p>
            </div>
            <ChevronDown size={14} className={`text-gray-600 hidden md:block transition-transform duration-150 ${userMenuOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
          </button>
          {userMenuOpen && (
            <div className="absolute top-full mt-1 dropdown-panel w-56" role="menu">
              <div className="px-3 py-2 border-b border-gray-100">
                <p className="text-xs text-gray-700 font-medium uppercase tracking-wider">{currentUser.email}</p>
              </div>
              <div className="border-t border-gray-100">
                <button
                  onClick={() => { navigate('/users'); setUserMenuOpen(false) }}
                  className="w-full text-left px-3 py-2 text-xs text-brand-600 hover:text-brand-700 hover:bg-gray-50 font-medium transition-colors"
                  role="menuitem"
                >
                  {t('Manage Users', 'إدارة المستخدمين')}
                </button>
              </div>
              <div className="border-t border-gray-100">
                <button
                  onClick={() => { signOut(); setUserMenuOpen(false) }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 font-medium transition-colors"
                  role="menuitem"
                >
                  <LogOut size={14} aria-hidden="true" />
                  {t('Log out', 'تسجيل الخروج')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Global Search Overlay */}
      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Notification Panel */}
      <NotificationPanel
        open={notifPanelOpen}
        onClose={() => setNotifPanelOpen(false)}
        onStateChange={() => {
          if (hookNotifications) {
            setUnreadCount(hookNotifications.filter((n: any) => !n.read).length)
          }
        }}
      />
    </header>
  )
}
