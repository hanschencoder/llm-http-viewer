import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { applyTheme, DEFAULT_THEME } from './utils/themes'
import './index.css'
import App from './App.tsx'

applyTheme(DEFAULT_THEME);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
