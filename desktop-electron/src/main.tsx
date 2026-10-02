import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { isDesktop } from './lib/desktop'

// Inside Electron the window has a native frame and menu, so the in-app title
// bar must not act as a drag region.
if (isDesktop()) document.documentElement.classList.add('native-shell')

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
