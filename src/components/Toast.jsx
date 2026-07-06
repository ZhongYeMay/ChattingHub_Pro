import React from 'react'

export default function Toast({ toast, md3 }) {
  if (!toast.text) return null
  return (
    <div style={{
      position: 'absolute', top: '12px', left: '50%', transform: 'translateX(-50%)',
      backgroundColor: toast.type === 'error' ? '#fde2e2' : (toast.type === 'success' ? '#d1e7dd' : md3.primaryContainer),
      color: toast.type === 'error' ? '#dc2626' : (toast.type === 'success' ? '#0f5132' : md3.onPrimaryContainer),
      padding: '10px 24px', borderRadius: '20px', fontSize: '13px', fontWeight: '600',
      boxShadow: '0 8px 24px rgba(0,0,0,0.12)', border: '1px solid rgba(255,255,255,0.4)',
      zIndex: 999, animation: 'fadeIn 0.2s ease-out', display: 'flex', alignItems: 'center', gap: '8px'
    }}>
      <span>{toast.type === 'error' ? '⚠️' : '⚡'}</span>
      {toast.text}
    </div>
  )
}