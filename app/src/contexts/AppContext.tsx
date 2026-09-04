import { createContext, useContext, useState, type ReactNode } from 'react'

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
  currentUser: { id: 'user-1', name: 'Mohamed Al-Hassan', email: 'mohamed@sanad-app.com', role: 'admin' },
  setCurrentUser: () => {},
  notificationsPanelOpen: false,
  setNotificationsPanelOpen: () => {},
  searchOpen: false,
  setSearchOpen: () => {},
  commandPaletteOpen: false,
  setCommandPaletteOpen: () => {},
})

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState({ id: 'user-1', name: 'Mohamed Al-Hassan', email: 'mohamed@sanad-app.com', role: 'admin' })
  const [notificationsPanelOpen, setNotificationsPanelOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)

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
