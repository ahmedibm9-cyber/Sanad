import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './contexts/AuthContext'
import { LanguageProvider } from './contexts/LanguageContext'
import { CompanyProvider } from './contexts/CompanyContext'
import { AppProvider } from './contexts/AppContext'
import { configureLogger } from './lib/logger'
import './styles/globals.css'

if (import.meta.env.VITE_TELEMETRY_URL) {
  configureLogger({ enableRemote: true })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <LanguageProvider>
          <CompanyProvider>
            <AppProvider>
              <App />
            </AppProvider>
          </CompanyProvider>
        </LanguageProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason)
  event.preventDefault()
})

window.addEventListener('error', (event) => {
  console.error('Uncaught error:', event.error)
})
