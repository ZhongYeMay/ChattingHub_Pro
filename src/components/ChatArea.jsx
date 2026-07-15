import { useRef, useState, useEffect } from 'react'
import { t } from '../utils/i18n' // 👈 导入多语言翻译词条[cite: 2]

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
  isPeerOnline,
  recallMessage,
  lang,      // 👈 接收当前语言状态[cite: 2]
  setLang    // 👈 接收切换语言的方法[cite: 2]
}) {
  const fileInputRef = useRef(null)

  // 💫 气泡功能与多 Emoji 专属状态集
  const [hoveredMsgId, setHoveredMsgId] = useState(null)          
  const [contextMenu, setContextMenu] = useState(null)            
  const [reactions, setReactions] = useState({})                  
  const [localToast, setLocalToast] = useState(null)              

  const EMOJI_POOL = ['👍', '❤️', '😂', '😮', '😢', '🙏']

  const triggerLocalToast = (text) => {
    setLocalToast(text)
    setTimeout(() => setLocalToast(null), 2200)
  }

  useEffect(() => {
    const closeMenu = () => setContextMenu(null)
    window.addEventListener('click', closeMenu)
    return () => window.removeEventListener('click', closeMenu)
  }, [])

  // 🕒 顶部/分割线级时间格式化（已完美集成多国语言“昨天”词条）[cite: 2]
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
    if (isYesterday) return `${t(lang, 'yesterday')} ${hours}:${minutes}` // 👈 翻译[cite: 2]
    
    return `${date.getMonth() + 1}/${date.getDate()} ${hours}:${minutes}`
  }

  const formatShortTime = (isoString) => {
    if (!isoString) return ''
    const date = new Date(isoString)
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  }

  const roomMeta = resolveRoomMeta(currentRoom)

  const onFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) handleSendFile(file)
  }

  // ↩️ 限时撤回判断
  const canRecallMessage = (msg) => {
    if (msg.sender_id !== myProfile?.id) return false 
    if (!msg.created_at) return true 
    
    const msgTime = new Date(msg.created_at).getTime()
    const now = new Date().getTime()
    return (now - msgTime) < 2 * 60 * 1000 
  }

  const handleRecall = (msg) => {
    if (recallMessage) {
      recallMessage(msg.id)
      triggerLocalToast(t(lang, 'recallSuccessToast')) // 👈 翻译[cite: 2]
    } else {
      triggerLocalToast(t(lang, 'recallFailToast')) // 👈 翻译[cite: 2]
    }
  }

  const copyToClipboard = (text) => {
    if (typeof text !== 'string') return
    navigator.clipboard.writeText(text)
    triggerLocalToast(t(lang, 'copiedToast')) // 👈 翻译[cite: 2]
  }

  const toggleReaction = (msgId, emoji) => {
    setReactions(prev => {
      const msgReactions = prev[msgId] || {}
      return {
        ...prev,
        [msgId]: { ...msgReactions, [emoji]: !msgReactions[emoji] }
      }
    })
  }

  const handleReply = (msg) => {
    const senderName = msg.profiles?.display_name || msg.profiles?.username || '匿名'
    const cleanContent = typeof msg.content === 'string' ? msg.content : '[File/Media]'
    const truncated = cleanContent.length > 18 ? cleanContent.slice(0, 18) + '...' : cleanContent
    
    const quoteText = `「回复 @${senderName}：${truncated}」\n`
    setNewMessage(prev => quoteText + prev)
    triggerLocalToast(t(lang, 'quotedToast')) // 👈 翻译[cite: 2]
  }

  const handleContextMenu = (e, msg) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({ x: e.clientX, y: e.clientY, msg })
  }

  if (!currentRoom) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: md3.onSurfaceVariant, backgroundColor: md3.surfaceContainerLow }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>💬</div>
        <h3 style={{ margin: 0, fontWeight: '600' }}>{t(lang, 'e2eTitle')}</h3> {/* 👈 翻译[cite: 2] */}
        <p style={{ margin: '8px 0 0 0', fontSize: '13px', opacity: 0.7 }}>{t(lang, 'e2eSubtitle')}</p> {/* 👈 翻译[cite: 2] */}
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
              {/* 💡 翻译词条与动态参数注入[cite: 2] */}
              {currentRoom.is_group 
                ? t(lang, 'groupCount', { count: currentRoom.room_members?.length || 0 }) 
                : (isPeerOnline ? t(lang, 'p2pOnline') : t(lang, 'p2pOffline'))}
            </div>
          </div>
        </div>

        {/* 右侧控制栏：融合多语言选择下拉框和成员邀请按键 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <select 
            value={lang} 
            onChange={e => setLang(e.target.value)}
            style={{
              padding: '6px 10px',
              borderRadius: '8px',
              border: `1px solid ${md3.outline}`,
              backgroundColor: md3.surfaceContainer,
              color: md3.onSurface,
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="zh-CN">简体中文</option>
            <option value="zh-TW">繁體中文</option>
            <option value="en">English</option>
            <option value="ja">日本語</option>
          </select>

          {currentRoom.is_group && (
            <button onClick={() => setIsInviting(!isInviting)} style={{ padding: '6px 12px', background: md3.primary, color: md3.onPrimary, border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
              {t(lang, 'inviteBtn')} {/* 👈 翻译[cite: 2] */}
            </button>
          )}
        </div>
      </div>

      {/* 邀请模态框 */}
      {isInviting && (
        <div style={{ position: 'absolute', top: '70px', right: '20px', width: '280px', padding: '16px', borderRadius: '12px', backgroundColor: md3.surfaceContainerHigh, boxShadow: '0 8px 32px rgba(0,0,0,0.15)', border: `1px solid ${md3.outline}`, zIndex: 50 }}>
          <form onSubmit={submitInviteMember} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: md3.onSurface }}>{t(lang, 'invitePlh')}</span> {/* 👈 翻译[cite: 2] */}
            <input type="text" value={inviteUsername} onChange={(e) => setInviteUsername(e.target.value)} placeholder={t(lang, 'inviteHint')} style={{ padding: '8px 12px', borderRadius: '8px', border: `1px solid ${md3.outline}`, outline: 'none', fontSize: '13px', backgroundColor: md3.surface }} /> {/* 👈 翻译[cite: 2] */}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setIsInviting(false)} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: 'transparent', color: md3.onSurface, fontSize: '12px', cursor: 'pointer' }}>{t(lang, 'cancel')}</button> {/* 👈 翻译[cite: 2] */}
              <button type="submit" style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: md3.primary, color: md3.onPrimary, fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>{t(lang, 'add')}</button> {/* 👈 翻译[cite: 2] */}
            </div>
          </form>
        </div>
      )}

      {/* 2. 消息流 */}
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

          const activeEmojis = Object.keys(reactions[msgId] || {}).filter(emoji => reactions[msgId][emoji])

          return (
            <div key={msgId} style={{ display: 'flex', flexDirection: 'column' }}>
              
              {/* 📅 时间分割线 */}
              {showTimeDivider && (
                <div style={{ alignSelf: 'center', margin: '12px 0 16px 0', padding: '4px 10px', borderRadius: '100px', backgroundColor: md3.outline, color: md3.onSurface, fontSize: '11px', fontWeight: '500', opacity: 0.7 }}>
                  {formatTime(msg.created_at)}
                </div>
              )}

              {/* 💬 气泡 */}
              <div 
                style={{ 
                  display: 'flex', 
                  gap: '10px', 
                  flexDirection: isMe ? 'row-reverse' : 'row', 
                  alignItems: 'flex-start', 
                  maxWidth: '85%', 
                  alignSelf: isMe ? 'flex-end' : 'flex-start',
                  position: 'relative'
                }}
                onMouseEnter={() => setHoveredMsgId(msgId)}
                onMouseLeave={() => setHoveredMsgId(null)}
              >
                <img src={msg.profiles?.avatar_url || 'https://api.dicebear.com/7.x/identicon/svg'} alt="Avatar" style={{ width: '36px', height: '36px', borderRadius: '18px', backgroundColor: '#fff', border: `1px solid ${md3.outline}` }} />

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', position: 'relative' }}>
                  {!isMe && (
                    <span style={{ fontSize: '11px', color: md3.onSurfaceVariant, marginBottom: '4px', paddingLeft: '4px' }}>
                      {msg.profiles?.display_name || msg.profiles?.username}
                    </span>
                  )}

                  <div style={{ position: 'relative' }}>
                    
                    {/* 悬停表情+工具栏 */}
                    {hoveredMsgId === msgId && !isPending && (
                      <div style={{
                        position: 'absolute',
                        top: '-36px',
                        [isMe ? 'left' : '0']: '0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        backgroundColor: md3.surfaceContainerHigh,
                        border: `1px solid ${md3.outline}`,
                        borderRadius: '24px',
                        padding: '3px 10px',
                        boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
                        zIndex: 20,
                        animation: 'fadeIn 0.15s ease'
                      }}>
                        <div style={{ display: 'flex', gap: '5px', borderRight: `1px solid ${md3.outline}`, paddingRight: '8px' }}>
                          {EMOJI_POOL.map(emoji => (
                            <span
                              key={emoji}
                              onClick={() => toggleReaction(msgId, emoji)}
                              style={{ cursor: 'pointer', fontSize: '15px', transition: 'transform 0.1s ease', userSelect: 'none', display: 'inline-block' }}
                              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.3)'}
                              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            >
                              {emoji}
                            </span>
                          ))}
                        </div>

                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <button onClick={() => handleReply(msg)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', fontSize: '13px' }} title={t(lang, 'reply')}>💬</button> {/* 👈 翻译[cite: 2] */}
                          <button onClick={() => copyToClipboard(msg.content)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', fontSize: '13px' }} title={t(lang, 'copyText')}>📋</button> {/* 👈 翻译[cite: 2] */}
                          {canRecallMessage(msg) && (
                            <button onClick={() => handleRecall(msg)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', fontSize: '13px', color: md3.error || '#ff4d4f' }} title={t(lang, 'recall')}>↩️</button> {/* 👈 翻译[cite: 2] */}
                          )}
                        </div>
                      </div>
                    )}

                    {/* 消息实体 */}
                    <div 
                      onDoubleClick={() => toggleReaction(msgId, '❤️')} 
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
                      {typeof msg.content === 'string' && msg.content.includes('"type":"p2p-file"') ? (() => {
                        try {
                          const fileData = JSON.parse(msg.content)
                          return (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '4px 0' }}>
                              <span style={{ fontSize: '24px' }}>📂</span>
                              <div>
                                <div style={{ fontWeight: '600', fontSize: '13px' }}>{fileData.name}</div>
                                <div style={{ fontSize: '11px', opacity: 0.8 }}>P2P ({Math.round(fileData.size / 1024)} KB)</div>
                              </div>
                            </div>
                          )
                        } catch (e) { return msg.content }
                      })() : (
                        msg.content
                      )}

                      <span style={{ display: 'block', fontSize: '9px', opacity: 0.6, textAlign: 'right', marginTop: '4px', userSelect: 'none', marginLeft: '12px' }}>
                        {formatShortTime(msg.created_at)} {isPending && ` (${t(lang, 'pending')})`} {/* 👈 翻译[cite: 2] */}
                      </span>
                    </div>

                    {/* 表态徽章 */}
                    {activeEmojis.length > 0 && (
                      <div style={{ position: 'absolute', bottom: '-14px', [isMe ? 'left' : 'right']: '12px', display: 'flex', gap: '4px', zIndex: 10 }}>
                        {activeEmojis.map(emoji => (
                          <div 
                            key={emoji}
                            onClick={() => toggleReaction(msgId, emoji)}
                            style={{
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
                              userSelect: 'none',
                              animation: 'scaleIn 0.12s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                            }}
                          >
                            {emoji} <span style={{ fontSize: '9px', opacity: 0.7, fontWeight: 'bold' }}>1</span>
                          </div>
                        ))}
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

      {/* 右键上下文菜单 */}
      {contextMenu && (
        <div style={{
          position: 'fixed',
          top: `${contextMenu.y}px`,
          left: `${contextMenu.x}px`,
          backgroundColor: md3.surfaceContainerHigh,
          border: `1px solid ${md3.outline}`,
          borderRadius: '12px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.18)',
          zIndex: 1000,
          padding: '8px 0',
          display: 'flex',
          flexDirection: 'column',
          minWidth: '160px',
          animation: 'scaleIn 0.12s ease-out'
        }} onClick={(e) => e.stopPropagation()}>
          
          <div style={{ display: 'flex', justifyContent: 'space-around', padding: '4px 10px 8px 10px', borderBottom: `1px solid ${md3.outline}`, marginBottom: '4px' }}>
            {EMOJI_POOL.map(emoji => (
              <span
                key={emoji}
                onClick={() => { 
                  const targetId = contextMenu.msg.id || `local-${messages.indexOf(contextMenu.msg)}`
                  toggleReaction(targetId, emoji)
                  setContextMenu(null)
                }}
                style={{ fontSize: '16px', cursor: 'pointer', transition: 'transform 0.1s', padding: '2px', display: 'inline-block' }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.35)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                {emoji}
              </span>
            ))}
          </div>

          <button onClick={() => { copyToClipboard(contextMenu.msg.content); setContextMenu(null) }} style={{ background: 'none', border: 'none', padding: '8px 14px', textAlign: 'left', cursor: 'pointer', color: md3.onSurface, fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📋</span> {t(lang, 'copyText')} {/* 👈 翻译[cite: 2] */}
          </button>
          <button onClick={() => { handleReply(contextMenu.msg); setContextMenu(null) }} style={{ background: 'none', border: 'none', padding: '8px 14px', textAlign: 'left', cursor: 'pointer', color: md3.onSurface, fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>💬</span> {t(lang, 'reply')} {/* 👈 翻译[cite: 2] */}
          </button>

          {canRecallMessage(contextMenu.msg) && (
            <button 
              onClick={() => { handleRecall(contextMenu.msg); setContextMenu(null) }} 
              style={{ 
                background: 'none', 
                border: 'none', 
                padding: '8px 14px', 
                textAlign: 'left', 
                cursor: 'pointer', 
                color: md3.error || '#ff4d4f', 
                fontSize: '12.5px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                borderTop: `1px solid ${md3.outline}`,
                fontWeight: '600'
              }}
            >
              <span>↩️</span> {t(lang, 'recall')} {/* 👈 翻译[cite: 2] */}
            </button>
          )}
        </div>
      )}

      {/* 4. 轻通知气泡 */}
      {localToast && (
        <div style={{ position: 'absolute', top: '80px', left: '50%', transform: 'translateX(-50%)', backgroundColor: 'rgba(0, 0, 0, 0.85)', color: '#fff', padding: '8px 16px', borderRadius: '100px', fontSize: '12px', fontWeight: '500', boxShadow: '0 4px 16px rgba(0,0,0,0.2)', zIndex: 9999, pointerEvents: 'none', animation: 'fadeIn 0.2s' }}>
          {localToast}
        </div>
      )}

      {/* 5. P2P 文件传输 */}
      {(uploadProgress !== null || downloadProgress !== null || incomingFile) && (
        <div style={{ position: 'absolute', bottom: '80px', left: '20px', right: '20px', padding: '14px', borderRadius: '12px', backgroundColor: md3.surfaceContainerHigh, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', border: `1px solid ${md3.outline}`, display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 40 }}>
          {uploadProgress !== null && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: md3.onSurface, fontWeight: '600', marginBottom: '4px' }}>
                <span>{t(lang, 'uploading')}</span> {/* 👈 翻译[cite: 2] */}
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
                <span>{t(lang, 'receiving')}</span> {/* 👈 翻译[cite: 2] */}
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
                  <div style={{ fontSize: '12px', fontWeight: '600', color: md3.onSurface }}>{t(lang, 'receivedComplete')}</div> {/* 👈 翻译[cite: 2] */}
                  <div style={{ fontSize: '10px', color: md3.onSurfaceVariant }}>{incomingFile.name} ({Math.round(incomingFile.size / 1024)} KB)</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setIncomingFile(null)} style={{ padding: '6px 12px', border: 'none', background: 'transparent', color: md3.onSurface, fontSize: '12px', cursor: 'pointer' }}>{t(lang, 'ignore')}</button> {/* 👈 翻译[cite: 2] */}
                <a href={incomingFile.url} download={incomingFile.name} onClick={() => setIncomingFile(null)} style={{ padding: '6px 14px', background: md3.primary, color: md3.onPrimary, borderRadius: '6px', fontSize: '12px', fontWeight: '600', textDecoration: 'none', display: 'inline-block' }}>{t(lang, 'saveNow')}</a> {/* 👈 翻译[cite: 2] */}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 6. 底部消息输入 */}
      <div style={{ padding: '16px 20px', borderTop: `1px solid ${md3.outline}`, backgroundColor: md3.surfaceContainerHigh, zIndex: 5 }}>
        <form onSubmit={sendMessage} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          
          <button type="button" onClick={() => fileInputRef.current?.click()} title="P2P File Transfer" style={{ padding: '10px', border: 'none', background: md3.surfaceContainer, borderRadius: '12px', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            📎
          </button>
          <input type="file" ref={fileInputRef} onChange={onFileChange} style={{ display: 'none' }} />

          {/* 💡 动态切换 P2P 在线/离线暂存占位符 */}
          <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder={isPeerOnline ? t(lang, 'typeEncMessage') : t(lang, 'peerOfflineMessage')} style={{ flex: 1, padding: '12px 16px', borderRadius: '14px', border: `1px solid ${md3.outline}`, outline: 'none', fontSize: '13.5px', backgroundColor: md3.surface, color: md3.onSurface }} /> {/* 👈 翻译[cite: 2] */}

          <button type="submit" style={{ padding: '10px 20px', background: md3.primary, color: md3.onPrimary, border: 'none', borderRadius: '14px', fontSize: '13.5px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,97,164,0.15)' }}>
            {t(lang, 'send')} {/* 👈 翻译[cite: 2] */}
          </button>

        </form>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translate(-50%, 10px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.85); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>

    </div>
  )
}