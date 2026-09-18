import { useContext } from 'react'
import { AppContext } from './AppContextValue'

export function useApp() {
  return useContext(AppContext)
}
