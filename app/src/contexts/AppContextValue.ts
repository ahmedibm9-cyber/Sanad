import { createContext } from 'react'

export interface AppContextType {
  currentUser: { id: string; name: string; email: string; role: string }
  notificationsPanelOpen: boolean
  setNotificationsPanelOpen: (open: boolean) => void
  searchOpen: boolean
  setSearchOpen: (open: boolean) => void
  commandPaletteOpen: boolean
  setCommandPaletteOpen: (open: boolean) => void
}

export const AppContext = createContext<AppContextType>({
  currentUser: { id: '', name: '', email: '', role: 'admin' },
  notificationsPanelOpen: false,
  setNotificationsPanelOpen: () => {},
  searchOpen: false,
  setSearchOpen: () => {},
  commandPaletteOpen: false,
  setCommandPaletteOpen: () => {},
})
