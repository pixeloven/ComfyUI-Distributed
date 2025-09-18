import 'public/locales'
import ReactDOM from 'react-dom/client'

import { PULSE_ANIMATION_CSS } from '@/utils/constants'

import App from './App'

// Inject CSS styles
const style = document.createElement('style')
style.textContent = PULSE_ANIMATION_CSS
document.head.appendChild(style)

// Mount the React app
const container = document.getElementById('distributed-ui-root')
if (container) {
  const root = ReactDOM.createRoot(container)
  root.render(<App />)
}
