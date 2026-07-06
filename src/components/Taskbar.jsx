import React, { useState, useEffect } from 'react'

export default function Taskbar({ windowState, setWindowState, taskbarPosition, taskbarContent, md3 }) {
  const [timeStr, setTimeStr] = useState('')

  // 驱动数字时钟秒级跳动
  useEffect(() => {
    const updateClock = () => {
      const now = new Date()
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    }
    updateClock()
    const interval = setInterval(updateClock, 1000)
    return () => clearInterval(interval)
  }, [])

  // 动态渲染任务栏物理常驻样式
  const barStyle = {
    position: 'absolute',
    left: 0,
    width: '100vw',
    height: '48px',
    backgroundColor: 'rgba(243, 243, 243, 0.65)',
    backdropFilter: 'blur(20px)',
    zIndex: 20,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 20px',
    boxSizing: 'border-box',
    // 💡 几何位置突变：根据个性化配置无缝靠顶或靠底
    top: taskbarPosition === 'top' ? 0 : 'auto',
    bottom: taskbarPosition === 'bottom' ? 0 : 'auto',
    borderTop: taskbarPosition === 'bottom' ? '1px solid rgba(0,0,0,0.08)' : 'none',
    borderBottom: taskbarPosition === 'top' ? '1px solid rgba(0,0,0,0.08)' : 'none',
  }

  return (
    <div style={barStyle}>
      {/* 左侧：系统就绪状态指示器 */}
      <div style={{ minWidth: '60px', fontSize: '11px', color: md3.onSurfaceVariant, fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
        {taskbarContent.showStatus && (
          <>
            <span style={{ display: 'inline-block', width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#107c41', animation: 'pulse 2s infinite' }} />
            <span>已连接至 [Server:Tokyo, Japan]</span>
          </>
        )}
      </div>

      {/* 中间：应用激活药丸 */}
      <div 
        onClick={() => setWindowState(windowState === 'minimized' ? 'normal' : 'minimized')}
        style={{ 
          height: '40px', padding: '0 16px', borderRadius: '6px', 
          backgroundColor: windowState !== 'closed' ? 'rgba(255,255,255,0.65)' : 'transparent',
          boxShadow: windowState !== 'closed' ? '0 2px 6px rgba(0,0,0,0.05)' : 'none',
          display: 'flex', alignItems: 'center', cursor: 'pointer', transition: 'background 0.2s', position: 'relative'
        }}
      >
        <span style={{ fontSize: '22px' }}>⌀</span>
        {windowState !== 'closed' && (
          <div style={{ 
            position: 'absolute', bottom: '2px', left: '50%', transform: 'translateX(-50%)', 
            width: windowState === 'minimized' ? '6px' : '16px', height: '3px', 
            backgroundColor: md3.primary, borderRadius: '2px', transition: 'width 0.2s'
          }} />
        )}
      </div>

      {/* 右侧：动态数字时钟 */}
      <div style={{ minWidth: '120px', textAlign: 'right', fontSize: '12px', fontWeight: '500', color: '#202020', fontFamily: 'Cascadia Mono' }}>
        {taskbarContent.showTime && timeStr}
      </div>
    </div>
  )
}