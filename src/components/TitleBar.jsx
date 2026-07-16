import React, { useState } from 'react'
import { TRAFFIC_LIGHTS } from '../utils/macTheme'

export default function TitleBar({ windowState, setWindowState, onMouseDown, onDoubleClick }) {
  const [hoverBtn, setHoverBtn] = useState(null)

  // 🍎 macOS 红黄绿交通灯控制键
  const lightStyle = (type) => ({
    width: '12px', height: '12px', borderRadius: '50%', border: 'none', padding: 0,
    background: TRAFFIC_LIGHTS[type], cursor: 'pointer', position: 'relative',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: 'inset 0 0 0 0.5px rgba(0,0,0,0.18)',
    transition: 'filter 0.1s', filter: hoverBtn === type ? 'brightness(0.92)' : 'none',
  })

  const glyph = (type) => ({
    fontSize: '9px', lineHeight: 1, color: 'rgba(0,0,0,0.55)', fontWeight: '700',
    opacity: hoverBtn === type ? 1 : 0, transition: 'opacity 0.1s', pointerEvents: 'none',
  })

  return (
    <div
      onMouseDown={onMouseDown}
      onDoubleClick={onDoubleClick}
      style={{
        height: '40px', backgroundColor: 'rgba(246, 246, 248, 0.55)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: '16px', paddingRight: '12px',
        cursor: windowState === 'maximized' ? 'default' : 'move',
      }}
    >
      {/* 左侧交通灯 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button title="关闭" onClick={() => setWindowState('closed')} style={lightStyle('close')} onMouseEnter={() => setHoverBtn('close')} onMouseLeave={() => setHoverBtn(null)}><span style={glyph('close')}>×</span></button>
        <button title="最小化" onClick={() => setWindowState('minimized')} style={lightStyle('minimize')} onMouseEnter={() => setHoverBtn('minimize')} onMouseLeave={() => setHoverBtn(null)}><span style={glyph('minimize')}>−</span></button>
        <button title={windowState === 'maximized' ? '向下还原' : '最大化'} onClick={() => setWindowState(windowState === 'maximized' ? 'normal' : 'maximized')} style={lightStyle('maximize')} onMouseEnter={() => setHoverBtn('maximize')} onMouseLeave={() => setHoverBtn(null)}><span style={glyph('maximize')}>＋</span></button>
      </div>

      {/* 居中标题 */}
      <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', fontSize: '13px', fontWeight: '600', color: '#1d1d1f', letterSpacing: '0.2px', pointerEvents: 'none' }}>
        Chatting Hub Pro
      </div>

      {/* 右侧占位，保持标题居中 */}
      <div style={{ width: '52px' }} />
    </div>
  )
}
