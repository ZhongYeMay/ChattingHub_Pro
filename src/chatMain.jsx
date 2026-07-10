import React from 'react'
import ReactDOM from 'react-dom/client'
import ChatApp from './ChatApp.jsx'
import './windows-native.css'

ReactDOM.createRoot(document.getElementById('chat-root')).render(
  <React.StrictMode>
    <ChatApp />
  </React.StrictMode>,
)
