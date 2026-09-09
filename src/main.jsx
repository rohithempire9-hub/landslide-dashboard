import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import LiveWeatherNetwork from './LiveWeatherNetwork.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <LiveWeatherNetwork />
  </StrictMode>,
)
