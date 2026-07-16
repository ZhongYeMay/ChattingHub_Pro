import React from 'react'

export default function Toast({ toast, md3 }) {
  if (!toast.text) return null
  return (
    <div style={{
      position: 'absolute', top: '12px', left: '50%', transform: 'translateX(-50%)',
      backgroundColor: toast.type === 'error' ? (md3.isDark ? 'rgba(255,69,58,0.9)' : '#ff453a') : (toast.type === 'success' ? (md3.isDark ? 'rgba(50,215,75,0.9)' : '#34c759') : md3.primary),
      color: '#ffffff',
      padding: '10px 24px', borderRadius: '100px', fontSize: '13px', fontWeight: '600',
      boxShadow: '0 10px 30px rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.25)',
      backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
      zIndex: 999, animation: 'fadeIn 0.2s ease-out', display: 'flex', alignItems: 'center', gap: '8px'
    }}>
      <span>{toast.type === 'error' ? '⚠️' : '⚡'}</span>
      {toast.text}
    </div>
  )
}