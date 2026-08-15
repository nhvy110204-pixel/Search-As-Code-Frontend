import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

// Standard WOFF2 Variable Fonts
import './styles/fonts.css'

// 100% Core Design System & CSS Tokens
import './styles/base.css'
import './styles/design-platform.css'
import './styles/scrollbar.css'
import './styles/gradient-shadow-text.css'
import './styles/shiki.css'

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('Missing #root element')

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
