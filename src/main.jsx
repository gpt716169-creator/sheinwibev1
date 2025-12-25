import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { AppContextProvider } from './context/AppContext'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashRouter>
      <AppContextProvider>
        <App />
      </AppContextProvider>
    </HashRouter>
  </StrictMode>,
)
