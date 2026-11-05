import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AppProvider } from './context/AppContext.jsx'
import { AdminProvider } from './context/AdminContext.jsx'
import App from './App.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AppProvider>
        <AdminProvider>
          <App />
        </AdminProvider>
      </AppProvider>
    </BrowserRouter>
  </StrictMode>,
)
