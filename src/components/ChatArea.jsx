import { useRef, useState, useEffect } from 'react'

export default function ChatArea({
  currentRoom,
  myProfile,
  messages,
  resolveRoomMeta,
  messagesEndRef,
  newMessage,
  setNewMessage,
  sendMessage,
  isInviting,
  setIsInviting,
  inviteUsername,
  setInviteUsername,
  submitInviteMember,
  md3,
  uploadProgress,
  downloadProgress,
  incomingFile,
  setIncomingFile,
  handleSendFile,
  isPeerOnline
}) {
  const fileInputRef = useRef(null)

  // 1. 💫 气泡功能专属状态集
  const [hoveredMsgId, setHoveredMsgId] = useState(null)          // 当前悬停的消息 ID
  const [contextMenu, setContextMenu] = useState(null)            // 右键菜单位置及消息对象 { x, y, msg }
  const [reactions, setReactions] = useState({})                  // 消息快捷表态本地映射表 { [msgId]: '❤️' }
  const [localToast, setLocalToast] = useState(null)              // 独立于父级的内聚轻量提示框

  // 2. 自闭环通知提示器
  const triggerLocalToast = (text) => {
    setLocalToast(text)
    setTimeout(() => setLocalToast(null), 2200)
  }

  // 监听点击自动关闭右键菜单
  useEffect(() => {
    const closeMenu = () => setContextMenu(null)
    window.addEventListener('click', closeMenu)
    return () => window.removeEventListener('click', closeMenu)
  }, [])

  // 3. 🕒 顶部/分割线级时间格式化
  const formatTime = (isoString) => {
    if (!isoString) return ''
    const date = new Date(isoString)
    const now = new Date()
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const isToday = date.toDateString() === now.toDateString()
    
    const tempYesterday = new Date()
    tempYesterday.setDate(now.getDate() - 1)
    const isYesterday = date.toDateString() === tempYesterday.toDateString()
    
    if (isToday) return `${hours}:${minutes}`
    if (isYesterday) return `昨天 ${hours}:${minutes}`
    
    return `${date.getMonth() + 1}/${date.getDate()} ${hours}:${minutes}`
  }

  // ⏳ 气泡内部极简时间格式化
  const formatShortTime = (isoString) => {
    if (!isoString) return ''
    const date = new Date(isoString)
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  }

  const roomMeta = resolveRoomMeta(currentRoom)

  // P2P 选取本地文件
  const onFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) handleSendFile(file)
  }

  // ==========================================
  // ⚡ 气泡业务功能处理器
  // ==========================================
  
  // 复制消息文本
  const copyToClipboard = (text) => {
    if (typeof text !== 'string') return
    navigator.clipboard.writeText(text)
    triggerLocalToast('📋 消息已成功复制到剪贴板')
  }

  // 双击或点击快捷添加爱心表态
  const toggleReaction = (msgId) => {
    setReactions(prev => ({
      ...prev,
      [msgId]: prev[msgId] ? null : '❤️'
    }))
  }

  // 引用并回复该条消息
  const handleReply = (msg) => {
    const senderName = msg.profiles?.display_name || msg.profiles?.username || '匿名'
    const cleanContent = typeof msg.content === 'string' ? msg.content : '[文件/媒体数据]'
    const truncated = cleanContent.length > 18 ? cleanContent.slice(0, 18) + '...' : cleanContent
    
    // 生成格式化的回复引用文本
    const quoteText = `「回复 @${senderName}：${truncated}」\n`
    setNewMessage(prev => quoteText + prev)
    triggerLocalToast('💬 已将引用放入输入框')
  }

  // 触发自定义右键菜单
  const handleContextMenu = (e, msg) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      msg
    })
  }

  if (!currentRoom) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: md3.onSurfaceVariant, backgroundColor: md3.surfaceContainerLow }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>💬</div>
        <h3 style={{ margin: 0, fontWeight: '600' }}>开启端到端安全加密对话</h3>
        <p style={{ margin: '8px 0 0 0', fontSize: '13px', opacity: 0.7 }}>选择左侧的联系人或群组，或者搜索添加新朋友</p>
      </div>
    )
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: md3.surfaceContainerLow, position: 'relative', height: '100%' }}>
      
      {/* 1. 顶部群组/联系人元数据栏 */}
      <div style={{ height: '64px', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${md3.outline}`, backgroundColor: md3.surfaceContainerHigh, zIndex: 5 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {roomMeta.avatar ? (
            <img src={roomMeta.avatar} alt="Avatar" style={{ width: '40px', height: '40px', borderRadius: '20px', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '40px', height: '40px', borderRadius: '20px', backgroundColor: md3.primary, color: md3.onPrimary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '16px' }}>
              {roomMeta.name ? roomMeta.name.replace('@', '').slice(0, 1).toUpperCase() : 'G'}
            </div>
          )}

          <div>
            <div style={{ fontWeight: '600', color: md3.onSurface, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {roomMeta.name}
              {!currentRoom.is_group && (
                <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: isPeerOnline ? '#22c55e' : '#94a3b8' }} />
              )}
            </div>
            <div style={{ fontSize: '11px', color: md3.onSurfaceVariant, opacity: 0.8 }}>
              {currentRoom.is_group ? `群聊成员：${currentRoom.room_members?.length || 0} 人` : (isPeerOnline ? 'P2P 加密通道已建立 (在线)' : '端到端离线加密状态 (离线暂存)')}
            </div>
          </div>
        </div>

        {currentRoom.is_group && (
          <button onClick={() => setIsInviting(!isInviting)} style={{ padding: '6px 12px', background: md3.primary, color: md3.onPrimary, border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
            👥 邀请成员
          </button>
        )}
      </div>

      {/* 邀请模态框 */}
      {isInviting && (
        <div style={{ position: 'absolute', top: '70px', right: '20px', width: '280px', padding: '16px', borderRadius: '12px', backgroundColor: md3.surfaceContainerHigh, boxShadow: '0 8px 32px rgba(0,0,0,0.15)', border: `1px solid ${md3.outline}`, zIndex: 50 }}>
          <form onSubmit={submitInviteMember} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: md3.onSurface }}>输入邀请的用户名 (@username)</span>
            <input type="text" value={inviteUsername} onChange={(e) => setInviteUsername(e.target.value)} placeholder="例如: akihiro" style={{ padding: '8px 12px', borderRadius: '8px', border: `1px solid ${md3.outline}`, outline: 'none', fontSize: '13px', backgroundColor: md3.surface }} />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setIsInviting(false)} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: 'transparent', color: md3.onSurface, fontSize: '12px', cursor: 'pointer' }}>取消</button>
              <button type="submit" style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: md3.primary, color: md3.onPrimary, fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>添加</button>
            </div>
          </form>
        </div>
      )}

      {/* 3. 消息流滚动渲染区域 */}
      <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {messages.map((msg, index) => {
          const isMe = msg.sender_id === myProfile?.id
          const msgId = msg.id || `local-${index}`
          const isPending = msg.is_pending

          const showTimeDivider = index === 0 || (() => {
            const prevMsg = messages[index - 1]
            if (!prevMsg || !prevMsg.created_at || !msg.created_at) return false
            return (new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime()) > 5 * 60 * 1000 
          })()

          return (
            <div key={msgId} style={{ display: 'flex', flexDirection: 'column' }}>
              
              {/* 📅 时间分割线 */}
              {showTimeDivider && (
                <div style={{ alignSelf: 'center', margin: '12px 0 16px 0', padding: '4px 10px', borderRadius: '100px', backgroundColor: md3.outline, color: md3.onSurface, fontSize: '11px', fontWeight: '500', opacity: 0.7 }}>
                  {formatTime(msg.created_at)}
                </div>
              )}

              {/* 💬 气泡承载盒 */}
              <div 
                style={{ 
                  display: 'flex', 
                  gap: '10px', 
                  flexDirection: isMe ? 'row-reverse' : 'row', 
                  alignItems: 'flex-start', 
                  maxWidth: '80%', 
                  alignSelf: isMe ? 'flex-end' : 'flex-start',
                  position: 'relative'
                }}
                onMouseEnter={() => setHoveredMsgId(msgId)}
                onMouseLeave={() => setHoveredMsgId(null)}
              >
                {/* 头像 */}
                <img src={msg.profiles?.avatar_url || 'https://api.dicebear.com/7.x/identicon/svg'} alt="Avatar" style={{ width: '36px', height: '36px', borderRadius: '18px', backgroundColor: '#fff', border: `1px solid ${md3.outline}` }} />

                {/* 气泡外围 */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', position: 'relative' }}>
                  {!isMe && (
                    <span style={{ fontSize: '11px', color: md3.onSurfaceVariant, marginBottom: '4px', paddingLeft: '4px' }}>
                      {msg.profiles?.display_name || msg.profiles?.username}
                    </span>
                  )}

                  <div style={{ position: 'relative' }}>
                    
                    {/* ✨ 功能 A: 悬停快捷小工具条（Hover Quick Action Bar） */}
                    {hoveredMsgId === msgId && !isPending && (
                      <div style={{
                        position: 'absolute',
                        top: '-32px',
                        [isMe ? 'left' : 'right']: '0',
                        display: 'flex',
                        gap: '6px',
                        backgroundColor: md3.surfaceContainerHigh,
                        border: `1px solid ${md3.outline}`,
                        borderRadius: '20px',
                        padding: '2px 8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                        zIndex: 20,
                        animation: 'fadeIn 0.15s ease'
                      }}>
                        <button onClick={() => toggleReaction(msgId)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', fontSize: '13px' }} title="快捷表态 ❤️">❤️</button>
                        <button onClick={() => handleReply(msg)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', fontSize: '13px' }} title="引用回复">💬</button>
                        <button onClick={() => copyToClipboard(msg.content)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', fontSize: '13px' }} title="复制消息">📋</button>
                      </div>
                    )}

                    {/* ✨ 消息实体气泡（增加双击、右键事件） */}
                    <div 
                      onDoubleClick={() => toggleReaction(msgId)}
                      onContextMenu={(e) => handleContextMenu(e, msg)}
                      style={{ 
                        padding: '10px 14px', 
                        borderRadius: isMe ? '16px 4px 16px 16px' : '4px 16px 16px 16px', 
                        backgroundColor: isMe ? md3.primary : md3.surfaceContainer, 
                        color: isMe ? md3.onPrimary : md3.onSurface, 
                        fontSize: '13.5px', 
                        lineHeight: '1.5', 
                        boxShadow: '0 2px 6px rgba(0,0,0,0.06)', 
                        wordBreak: 'break-all',
                        cursor: 'pointer',
                        userSelect: 'text',
                        transition: 'transform 0.1s ease',
                        position: 'relative'
                      }}
                      onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.98)' }}
                      onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
                    >
                      {/* 渲染 P2P 提示卡片 */}
                      {typeof msg.content === 'string' && msg.content.includes('"type":"p2p-file"') ? (() => {
                        try {
                          const fileData = JSON.parse(msg.content)
                          return (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '4px 0' }}>
                              <span style={{ fontSize: '24px' }}>📂</span>
                              <div>
                                <div style={{ fontWeight: '600', fontSize: '13px' }}>{fileData.name}</div>
                                <div style={{ fontSize: '11px', opacity: 0.8 }}>P2P文件 ({Math.round(fileData.size / 1024)} KB)</div>
                              </div>
                            </div>
                          )
                        } catch (e) { return msg.content }
                      })() : (
                        msg.content
                      )}

                      {/* 气泡右下角微标时间 */}
                      <span style={{ display: 'block', fontSize: '9px', opacity: 0.6, textAlign: 'right', marginTop: '4px', userSelect: 'none', marginLeft: '12px' }}>
                        {formatShortTime(msg.created_at)} {isPending && ' (待同步)'}
                      </span>
                    </div>

                    {/* ✨ 功能 B: 表态挂件 badge */}
                    {reactions[msgId] && (
                      <div 
                        onClick={() => toggleReaction(msgId)}
                        style={{
                          position: 'absolute',
                          bottom: '-12px',
                          [isMe ? 'left' : 'right']: '12px',
                          backgroundColor: md3.surfaceContainerHigh,
                          border: `1px solid ${md3.outline}`,
                          borderRadius: '20px',
                          padding: '2px 6px',
                          fontSize: '11px',
                          cursor: 'pointer',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '2px',
                          zIndex: 10,
                          userSelect: 'none'
                        }}
                      >
                        {reactions[msgId]} <span style={{ fontSize: '10px', opacity: 0.7, fontWeight: 'bold' }}>1</span>
                      </div>
                    )}

                  </div>
                </div>
              </div>

            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* 🛠️ 功能 C: 自定义右键上下文弹出菜单 */}
      {contextMenu && (
        <div style={{
          position: 'fixed',
          top: `${contextMenu.y}px`,
          left: `${contextMenu.x}px`,
          backgroundColor: md3.surfaceContainerHigh,
          border: `1px solid ${md3.outline}`,
          borderRadius: '10px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.18)',
          zIndex: 1000,
          padding: '4px 0',
          display: 'flex',
          flexDirection: 'column',
          minWidth: '120px',
          animation: 'scaleIn 0.12s ease-out'
        }} onClick={(e) => e.stopPropagation()}>
          <button onClick={() => { copyToClipboard(contextMenu.msg.content); setContextMenu(null) }} style={{ background: 'none', border: 'none', padding: '10px 14px', textAlign: 'left', cursor: 'pointer', color: md3.onSurface, fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📋</span> 复制文本
          </button>
          <button onClick={() => { handleReply(contextMenu.msg); setContextMenu(null) }} style={{ background: 'none', border: 'none', padding: '10px 14px', textAlign: 'left', cursor: 'pointer', color: md3.onSurface, fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>💬</span> 引用回复
          </button>
          <button onClick={() => { toggleReaction(contextMenu.msg.id || contextMenu.msg.created_at); setContextMenu(null) }} style={{ background: 'none', border: 'none', padding: '10px 14px', textAlign: 'left', cursor: 'pointer', color: md3.onSurface, fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>❤️</span> 爱心表态
          </button>
        </div>
      )}

      {/* 4. 自闭环内聚提示层 */}
      {localToast && (
        <div style={{
          position: 'absolute',
          top: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          color: '#fff',
          padding: '8px 16px',
          borderRadius: '100px',
          fontSize: '12px',
          fontWeight: '500',
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          zIndex: 9999,
          pointerEvents: 'none',
          animation: 'fadeIn 0.2s'
        }}>
          {localToast}
        </div>
      )}

      {/* 5. P2P 管道数据流状态面板 */}
      {(uploadProgress !== null || downloadProgress !== null || incomingFile) && (
        <div style={{ position: 'absolute', bottom: '80px', left: '20px', right: '20px', padding: '14px', borderRadius: '12px', backgroundColor: md3.surfaceContainerHigh, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', border: `1px solid ${md3.outline}`, display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 40 }}>
          {uploadProgress !== null && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: md3.onSurface, fontWeight: '600', marginBottom: '4px' }}>
                <span>📤 正在通过 P2P 管道极速上传文件...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div style={{ width: '100%', height: '6px', backgroundColor: md3.outline, borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${uploadProgress}%`, height: '100%', backgroundColor: md3.primary, transition: 'width 0.1s' }} />
              </div>
            </div>
          )}

          {downloadProgress !== null && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: md3.onSurface, fontWeight: '600', marginBottom: '4px' }}>
                <span>📥 正在接收 P2P 加密文件数据包...</span>
                <span>{downloadProgress}%</span>
              </div>
              <div style={{ width: '100%', height: '6px', backgroundColor: md3.outline, borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${downloadProgress}%`, height: '100%', backgroundColor: md3.primary, transition: 'width 0.1s' }} />
              </div>
            </div>
          )}

          {incomingFile && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>🎁</span>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: md3.onSurface }}>文件安全接收完毕</div>
                  <div style={{ fontSize: '10px', color: md3.onSurfaceVariant }}>{incomingFile.name} ({Math.round(incomingFile.size / 1024)} KB)</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setIncomingFile(null)} style={{ padding: '6px 12px', border: 'none', background: 'transparent', color: md3.onSurface, fontSize: '12px', cursor: 'pointer' }}>忽略</button>
                <a href={incomingFile.url} download={incomingFile.name} onClick={() => setIncomingFile(null)} style={{ padding: '6px 14px', background: md3.primary, color: md3.onPrimary, borderRadius: '6px', fontSize: '12px', fontWeight: '600', textDecoration: 'none', display: 'inline-block' }}>立即保存</a>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 6. 底部输入控制台 */}
      <div style={{ padding: '16px 20px', borderTop: `1px solid ${md3.outline}`, backgroundColor: md3.surfaceContainerHigh, zIndex: 5 }}>
        <form onSubmit={sendMessage} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          
          <button type="button" onClick={() => fileInputRef.current?.click()} title="通过 P2P 极速安全发送本地文件" style={{ padding: '10px', border: 'none', background: md3.surfaceContainer, borderRadius: '12px', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            📎
          </button>
          <input type="file" ref={fileInputRef} onChange={onFileChange} style={{ display: 'none' }} />

          <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder={isPeerOnline ? "键入安全的端到端加密消息..." : "对方不在线，消息将加密暂存至本地..."} style={{ flex: 1, padding: '12px 16px', borderRadius: '14px', border: `1px solid ${md3.outline}`, outline: 'none', fontSize: '13.5px', backgroundColor: md3.surface, color: md3.onSurface }} />

          <button type="submit" style={{ padding: '10px 20px', background: md3.primary, color: md3.onPrimary, border: 'none', borderRadius: '14px', fontSize: '13.5px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,97,164,0.15)' }}>
            发送
          </button>

        </form>
      </div>

      {/* 注入动画样式 */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translate(-50%, 10px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.92); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>

    </div>
  )
}