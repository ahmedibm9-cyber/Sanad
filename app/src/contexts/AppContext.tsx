import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { useAuth } from './AuthContext'

interface AppContextType {
  currentUser: { id: string; name: string; email: string; role: string }
  setCurrentUser: (user: { id: string; name: string; email: string; role: string }) => void
  notificationsPanelOpen: boolean
  setNotificationsPanelOpen: (open: boolean) => void
  searchOpen: boolean
  setSearchOpen: (open: boolean) => void
  commandPaletteOpen: boolean
  setCommandPaletteOpen: (open: boolean) => void
}

const AppContext = createContext<AppContextType>({
  currentUser: { id: '', name: '', email: '', role: 'admin' },
  setCurrentUser: () => {},
  notificationsPanelOpen: false,
  setNotificationsPanelOpen: () => {},
  searchOpen: false,
  setSearchOpen: () => {},
  commandPaletteOpen: false,
  setCommandPaletteOpen: () => {},
})

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
      currentUser, setCurrentUser,
      notificationsPanelOpen, setNotificationsPanelOpen,
      searchOpen, setSearchOpen,
      commandPaletteOpen, setCommandPaletteOpen,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  return useContext(AppContext)
}
