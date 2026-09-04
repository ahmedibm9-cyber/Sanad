import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { LanguageProvider } from './contexts/LanguageContext'
import { CompanyProvider } from './contexts/CompanyContext'
import { AppProvider } from './contexts/AppContext'
import './styles/globals.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <CompanyProvider>
          <AppProvider>
            <App />
          </AppProvider>
        </CompanyProvider>
      </LanguageProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
