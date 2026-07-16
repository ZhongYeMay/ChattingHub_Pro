import React, { useState } from 'react'

export default function Sidebar({ 
  myProfile, filteredRooms, currentRoom, setCurrentRoom, resolveRoomMeta, handleLogout,
  searchQuery, setSearchQuery, globalUsers, globalRooms, startPrivateChat, joinGroupRoom,
  submitCreateGroup, isCreatingGroup, setIsCreatingGroup, newGroupName, setNewGroupName,
  triggerToast, md3, setIsSettingsOpen // 💡 接入打开设置通道
}) {
  const [showPlusMenu, setShowPlusMenu] = useState(false)

  return (
    <div style={{ width: '300px', backgroundColor: md3.surfaceContainerLow, backdropFilter: md3.vibrancyLight, WebkitBackdropFilter: md3.vibrancyLight, display: 'flex', flexDirection: 'column', borderRight: `1px solid ${md3.separator}`, position: 'relative' }}>
      
      {/* 个人资料区 */}
      <div style={{ padding: '18px 16px 12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div onClick={() => window.location.href = './profile.html'} title="点击进入个人主页修改资料" style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', transition: 'opacity 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.opacity = '0.75'} onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}>
          <img src={myProfile?.avatar_url} alt="avatar" style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', border: `1px solid ${md3.outline}` }} />
          <div>
            <div style={{ fontWeight: '600', fontSize: '14px', color: md3.onSurface }}>{myProfile?.display_name}</div>
            <div style={{ fontSize: '11px', color: md3.onSurfaceVariant }}>@{myProfile?.username}</div>
          </div>
        </div>
        
        {/* 联动控制条：融入个性设置快捷按钮 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
          <button onClick={() => setIsSettingsOpen(prev => !prev)} title="个性化系统配置" style={{ padding: '6px', fontSize: '15px', background: 'none', border: 'none', cursor: 'pointer', opacity: 0.7, borderRadius: '6px' }} onMouseEnter={(e) => { e.currentTarget.style.opacity = 1; e.currentTarget.style.backgroundColor = md3.hover }} onMouseLeave={(e) => { e.currentTarget.style.opacity = 0.7; e.currentTarget.style.backgroundColor = 'transparent' }}>⚙️</button>
          <button onClick={handleLogout} style={{ padding: '5px 10px', fontSize: '12px', color: md3.primary, background: 'none', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = md3.hover} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>退出</button>
        </div>
      </div>

      {/* 搜索与二级菜单 */}
      <div style={{ padding: '0 14px 12px 14px', display: 'flex', gap: '8px', alignItems: 'center', position: 'relative' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <input type="text" placeholder="搜索用户或群组" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px 8px 30px', border: 'none', borderRadius: '8px', backgroundColor: md3.surfaceContainer, outline: 'none', fontSize: '12.5px', color: md3.onSurface }} />
          <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', opacity: 0.45, fontSize: '13px' }}>🔍</span>
          {searchQuery && <span onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', opacity: 0.6, fontSize: '11px', cursor: 'pointer' }}>✕</span>}
        </div>

        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowPlusMenu(!showPlusMenu)} style={{ width: '32px', height: '32px', borderRadius: '8px', background: showPlusMenu ? md3.primary : md3.surfaceContainer, color: showPlusMenu ? md3.onPrimary : md3.onSurface, border: 'none', cursor: 'pointer', fontSize: '16px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {showPlusMenu ? '✕' : '＋'}
          </button>

          {showPlusMenu && (
            <>
              <div onClick={() => setShowPlusMenu(false)} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 99 }} />
              <div style={{ position: 'absolute', top: '40px', right: 0, width: '160px', backgroundColor: md3.surfaceContainerHigh, backdropFilter: md3.vibrancy, WebkitBackdropFilter: md3.vibrancy, borderRadius: '12px', boxShadow: '0 12px 32px rgba(0,0,0,0.22)', border: `1px solid ${md3.outline}`, padding: '6px 0', zIndex: 100 }}>
                <div onClick={() => { setIsCreatingGroup(true); setShowPlusMenu(false); }} style={{ padding: '9px 16px', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', color: md3.onSurface }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = md3.hover} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>创建群组</div>
                <div onClick={() => { setShowPlusMenu(false); triggerToast('在 搜索框 中输入用户名（不包含 @ 符号）'); }} style={{ padding: '9px 16px', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', color: md3.onSurface }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = md3.hover} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>查找其他用户</div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 内嵌式建群组件 */}
      {isCreatingGroup && (
        <form onSubmit={submitCreateGroup} style={{ padding: '0 14px 12px 14px' }}>
          <div style={{ background: md3.surfaceContainerHigh, borderRadius: '12px', padding: '12px', border: `1px solid ${md3.outline}`, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: md3.primary }}>创建新的群组</div>
            <input type="text" placeholder="为该群组命名" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} autoFocus style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', borderRadius: '8px', border: 'none', backgroundColor: md3.surfaceContainer, fontSize: '12px', outline: 'none', color: md3.onSurface }} />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="submit" style={{ flex: 1, padding: '6px', background: md3.primary, color: md3.onPrimary, border: 'none', borderRadius: '8px', fontSize: '11.5px', fontWeight: '600', cursor: 'pointer' }}>建立</button>
              <button type="button" onClick={() => { setIsCreatingGroup(false); setNewGroupName(''); }} style={{ flex: 1, padding: '6px', background: md3.surfaceContainer, color: md3.onSurface, border: 'none', borderRadius: '8px', fontSize: '11.5px', fontWeight: '600', cursor: 'pointer' }}>取消</button>
            </div>
          </div>
        </form>
      )}

      {/* 对话列表及全网搜 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px 16px 8px' }}>
        <div>
          {searchQuery && <div style={{ fontSize: '11px', fontWeight: '700', color: md3.onSurfaceVariant, padding: '4px 14px 6px 14px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>已绑定的对话 ({filteredRooms.length})</div>}
          {filteredRooms.map((room) => {
            const isActive = currentRoom?.id === room.id
            const meta = resolveRoomMeta(room)
            return (
              <div key={room.id} onClick={() => { setCurrentRoom(room); if(searchQuery) setSearchQuery(''); }} style={{ padding: '9px 12px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', backgroundColor: isActive ? md3.primary : 'transparent', borderRadius: '10px', marginBottom: '3px', color: isActive ? md3.onPrimary : md3.onSurface }} onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = md3.hover }} onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', overflow: 'hidden', backgroundColor: isActive ? 'rgba(255,255,255,0.22)' : md3.surfaceContainer, color: isActive ? md3.onPrimary : md3.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px' }}>
                  {!room.is_group && meta.avatar ? <img src={meta.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (room.is_group ? '👥' : '👤')}
                </div>
                <div style={{ fontWeight: isActive ? '600' : '500', fontSize: '13px' }}>{meta.name}</div>
              </div>
            )
          })}
        </div>

        {searchQuery.trim() && (
          <div style={{ marginTop: '16px', borderTop: `1px solid ${md3.separator}`, paddingTop: '12px' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: md3.onSurfaceVariant, padding: '0 14px 8px 14px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>在 ChattingHub 上搜索</div>
            {globalUsers.map(user => (
              <div key={user.id} onClick={() => startPrivateChat(user)} style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', borderRadius: '10px', marginBottom: '3px', backgroundColor: 'transparent', color: md3.onSurface }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = md3.hover} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img src={user.avatar_url} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                  <div>
                    <div style={{ fontSize: '12.5px', fontWeight: '600' }}>{user.display_name}</div>
                    <div style={{ fontSize: '10.5px', color: md3.onSurfaceVariant }}>@{user.username}</div>
                  </div>
                </div>
                <span style={{ fontSize: '11px', color: md3.onPrimary, fontWeight: '600', padding: '4px 10px', backgroundColor: md3.primary, borderRadius: '100px' }}>私信</span>
              </div>
            ))}
            {globalRooms.map(room => {
              const alreadyIn = filteredRooms.some(r => r.id === room.id)
              return (
                <div key={room.id} onClick={() => joinGroupRoom(room)} style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', borderRadius: '10px', marginBottom: '3px', backgroundColor: 'transparent', color: md3.onSurface }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = md3.hover} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: md3.surfaceContainer, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>👥</div>
                    <div style={{ fontSize: '12.5px', fontWeight: '600' }}>{room.name}</div>
                  </div>
                  <span style={{ fontSize: '11px', color: alreadyIn ? md3.onSurfaceVariant : md3.onPrimary, fontWeight: '600', padding: '4px 10px', backgroundColor: alreadyIn ? md3.surfaceContainer : md3.primary, borderRadius: '100px' }}>{alreadyIn ? '进入' : '加入群'}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}