import { useRef } from 'react'

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

  // 🕒 1. 顶部/分割线级时间格式化（支持今天、昨天、跨天识别）
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
    
    if (isToday) {
      return `${hours}:${minutes}`
    } else if (isYesterday) {
      return `昨天 ${hours}:${minutes}`
    } else {
      const month = date.getMonth() + 1
      const day = date.getDate()
      return `${month}/${day} ${hours}:${minutes}`
    }
  }

  // ⏳ 2. 气泡内部极简时间格式化（仅显示时:分）
  const formatShortTime = (isoString) => {
    if (!isoString) return ''
    const date = new Date(isoString)
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${hours}:${minutes}`
  }

  const roomMeta = resolveRoomMeta(currentRoom)

  // 处理 P2P 本地文件输入
  const onFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      handleSendFile(file)
    }
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
      <div style={{ height: '64px', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${md3.outline}`, backgroundColor: md3.surfaceContainerHigh }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {roomMeta.avatar ? (
            <img src={roomMeta.avatar} alt="Room Avatar" style={{ width: '40px', height: '40px', borderRadius: '20px', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '40px', height: '40px', borderRadius: '20px', backgroundColor: md3.primary, color: md3.onPrimary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '16px' }}>
              {roomMeta.name ? roomMeta.name.replace('@', '').slice(0, 1).toUpperCase() : 'G'}
            </div>
          )}

          <div>
            <div style={{ fontWeight: '600', color: md3.onSurface, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {roomMeta.name}
              {!currentRoom.is_group && (
                <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: isPeerOnline ? '#22c55e' : '#94a3b8', title: isPeerOnline ? '在线' : '离线' }} />
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

      {/* 2. 消息流滚动渲染区域 */}
      <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {messages.map((msg, index) => {
          const isMe = msg.sender_id === myProfile?.id
          
          // 💡 智能合并算法：首条消息，或者与上一条消息相差 5 分钟以上时，渲染时间分割线
          const showTimeDivider = index === 0 || (() => {
            const prevMsg = messages[index - 1]
            if (!prevMsg || !prevMsg.created_at || !msg.created_at) return false
            const currentMsgTime = new Date(msg.created_at).getTime()
            const prevMsgTime = new Date(prevMsg.created_at).getTime()
            return (currentMsgTime - prevMsgTime) > 5 * 60 * 1000 
          })()

          return (
            <div key={msg.id || index} style={{ display: 'flex', flexDirection: 'column' }}>
              
              {/* 📅 居中时间线分割指示器 */}
              {showTimeDivider && (
                <div style={{ alignSelf: 'center', margin: '12px 0 16px 0', padding: '4px 10px', borderRadius: '100px', backgroundColor: md3.outline, color: md3.onSurface, fontSize: '11px', fontWeight: '500', opacity: 0.7 }}>
                  {formatTime(msg.created_at)}
                </div>
              )}

              {/* 消息气泡布局 */}
              <div style={{ display: 'flex', gap: '10px', flexDirection: isMe ? 'row-reverse' : 'row', alignItems: 'flex-start', maxWidth: '80%', alignSelf: isMe ? 'flex-end' : 'flex-start' }}>
                
                <img src={msg.profiles?.avatar_url || 'https://api.dicebear.com/7.x/identicon/svg'} alt="Avatar" style={{ width: '36px', height: '36px', borderRadius: '18px', backgroundColor: '#fff', border: `1px solid ${md3.outline}` }} />

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                  {!isMe && (
                    <span style={{ fontSize: '11px', color: md3.onSurfaceVariant, marginBottom: '4px', paddingLeft: '4px' }}>
                      {msg.profiles?.display_name || msg.profiles?.username}
                    </span>
                  )}

                  <div style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '10px 14px', borderRadius: isMe ? '16px 4px 16px 16px' : '4px 16px 16px 16px', backgroundColor: isMe ? md3.primary : md3.surfaceContainer, color: isMe ? md3.onPrimary : md3.onSurface, fontSize: '13.5px', lineHeight: '1.5', boxShadow: '0 2px 6px rgba(0,0,0,0.06)', wordBreak: 'break-all' }}>
                      
                      {/* P2P 提示卡片拦截渲染 */}
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
                        } catch (e) {
                          return msg.content
                        }
                      })() : (
                        msg.content
                      )}

                      {/* ⏳ 气泡右下角极简微标时间 */}
                      <span style={{ display: 'block', fontSize: '9px', opacity: 0.6, textAlign: 'right', marginTop: '4px', userSelect: 'none', marginLeft: '12px' }}>
                        {formatShortTime(msg.created_at)} {msg.is_pending && ' (待同步)'}
                      </span>

                    </div>
                  </div>
                </div>
              </div>

            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* 3. P2P 管道数据流状态控制面板 */}
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

      {/* 4. 底部输入控制台区域 */}
      <div style={{ padding: '16px 20px', borderTop: `1px solid ${md3.outline}`, backgroundColor: md3.surfaceContainerHigh }}>
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

    </div>
  )
}