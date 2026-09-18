import { useState, useEffect, type ReactNode } from 'react'
import { useAuth } from './useAuth'
import { AppContext } from './AppContextValue'

export function AppProvider({ children }: { children: ReactNode }) {
  const { user: authUser } = useAuth()
  const [currentUser, setCurrentUser] = useState({
    id: authUser?.id || '',
    name: authUser?.displayName || authUser?.email || '',
    email: authUser?.email || '',
    role: authUser?.isSystemAdmin ? 'admin' : 'user',
  })
  const [notificationsPanelOpen, setNotificationsPanelOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)

  // Sync with auth user when it changes
  useEffect(() => {
    if (authUser) {
      setCurrentUser({
        id: authUser.id,
        name: authUser.displayName || authUser.email,
        email: authUser.email,
        role: authUser.isSystemAdmin ? 'admin' : 'user',
      })
    }
  }, [authUser])

  return (
    <AppContext.Provider value={{
      currentUser,
      notificationsPanelOpen, setNotificationsPanelOpen,
      searchOpen, setSearchOpen,
      commandPaletteOpen, setCommandPaletteOpen,
    }}>
      {children}
    </AppContext.Provider>
  )
}
