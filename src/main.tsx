import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import App from './App'
import { PortfolioProvider } from './portfolio'
import './styles.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <PortfolioProvider>
          <App />
        </PortfolioProvider>
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>,
)
