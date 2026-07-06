import React, { useState } from 'react'

export default function TitleBar({ windowState, setWindowState, onMouseDown, onDoubleClick }) {
  const [hoverBtn, setHoverBtn] = useState(null)

  const titleBtnStyle = (type, baseColor = 'transparent') => ({
    width: '46px', height: '32px', border: 'none',
    background: hoverBtn === type ? (type === 'close' ? '#e81123' : 'rgba(0,0,0,0.08)') : baseColor,
    color: hoverBtn === type && type === 'close' ? '#fff' : '#5f5f5f',
    fontFamily: 'Marlett', fontSize: '12px', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'background-color 0.1s, color 0.1s', padding: 0, lineHeight: 1
  })

  return (
    <div 
      onMouseDown={onMouseDown}
      onDoubleClick={onDoubleClick} // ✨ 修复：移除了残留的 handleDoubleClick，只保留唯一正确的 prop 回调
      style={{ 
        height: '32px', backgroundColor: 'rgba(243, 243, 243, 0.88)', backdropFilter: 'blur(10px)',
        borderBottom: '1px solid #e5e5e5', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: '12px',
        cursor: windowState === 'maximized' ? 'default' : 'move'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '500', color: '#202020' }}>
        <span style={{ fontSize: '14px' }}>💬</span>
        <span>Chatting Hub Pro(Preview)</span>
      </div>
      <div style={{ display: 'flex' }}>
        <button title="最小化" onClick={() => setWindowState('minimized')} style={titleBtnStyle('minimize')} onMouseEnter={() => setHoverBtn('minimize')} onMouseLeave={() => setHoverBtn(null)}>0</button>
        <button title={windowState === 'maximized' ? '向下还原' : '最大化'} onClick={() => setWindowState(windowState === 'maximized' ? 'normal' : 'maximized')} style={titleBtnStyle('maximize')} onMouseEnter={() => setHoverBtn('maximize')} onMouseLeave={() => setHoverBtn(null)}>{windowState === 'maximized' ? '2' : '1'}</button>
        <button title="关闭重新打开" onClick={() => setWindowState('closed')} style={titleBtnStyle('close')} onMouseEnter={() => setHoverBtn('close')} onMouseLeave={() => setHoverBtn(null)}>r</button>
      </div>
    </div>
  )
}