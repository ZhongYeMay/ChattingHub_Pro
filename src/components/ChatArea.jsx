import React, { useRef } from 'react'

export default function ChatArea({
  currentRoom, myProfile, messages, resolveRoomMeta, messagesEndRef,
  newMessage, setNewMessage, sendMessage, isInviting, setIsInviting,
  inviteUsername, setInviteUsername, submitInviteMember, md3,
  uploadProgress, downloadProgress, incomingFile, setIncomingFile, handleSendFile, isPeerOnline
}) {
  const fileInputRef = useRef(null)
  const roomMeta = resolveRoomMeta(currentRoom)

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const triggerFileSelect = () => {
    if (uploadProgress !== null || downloadProgress !== null) return
    fileInputRef.current?.click()
  }

  const onFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      handleSendFile(file)
      e.target.value = ''
    }
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: md3.surface, position: 'relative' }}>
      {/* 1. 顶部状态栏 */}
      <div style={{ height: '56px', borderBottom: `1px solid ${md3.outline}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', backgroundColor: md3.surfaceContainerLow }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: isPeerOnline ? '#22c55e' : md3.primaryContainer, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', color: '#fff', boxShadow: isPeerOnline ? '0 0 12px #22c55e' : 'none' }}>
            {currentRoom?.is_group ? '👥' : '🔒'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: '600', color: md3.onSurface }}>{roomMeta.name}</span>
            <span style={{ fontSize: '10px', color: isPeerOnline ? '#22c55e' : '#888', fontWeight: '500' }}>
              {isPeerOnline ? 'P2P 加密通道已连接' : '对方已离线（通道未连接）'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. 消息流区域 */}
      <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {messages.map((msg) => {
          const isMe = msg.sender_id === myProfile?.id
          
          let isP2PFile = false
          let fileInfo = null
          try {
            if (msg.content && msg.content.trim().startsWith('{') && msg.content.includes('"type":"p2p-file"')) {
              fileInfo = JSON.parse(msg.content)
              if (fileInfo.type === 'p2p-file') isP2PFile = true
            }
          } catch (e) {}

          return (
            <div key={msg.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', opacity: msg.is_pending ? 0.6 : 1 }}>
              <div style={{ display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row', gap: '10px', maxWidth: '70%' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                  <span style={{ fontSize: '11px', opacity: 0.5, marginBottom: '2px', color: md3.onSurface }}>
                    {msg.profiles?.display_name || '未知用户'}
                  </span>
                  
                  {isP2PFile ? (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 16px', borderRadius: '12px',
                      background: isMe ? md3.primaryContainer : md3.surfaceContainerHigh,
                      color: isMe ? md3.onPrimaryContainer : md3.onSurface,
                      border: `1px solid ${md3.primary}`, boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
                    }}>
                      <div style={{ fontSize: '24px' }}>📄</div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '13px', fontWeight: '600' }}>{fileInfo.name}</span>
                        <span style={{ fontSize: '11px', opacity: 0.6, marginTop: '2px' }}>
                          {formatFileSize(fileInfo.size)} · {isMe ? '已发送' : '已接收元数据'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: '10px 14px', borderRadius: '12px', backgroundColor: isMe ? md3.primary : md3.surfaceContainerLow, color: isMe ? md3.onPrimary : md3.onSurface, fontSize: '13.5px', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                      {msg.content}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* 3. 接收端：本地内存缝合成功的 P2P 文件提取挂件 */}
      {incomingFile && (
        <div style={{ position: 'absolute', bottom: '80px', left: '20px', right: '20px', padding: '14px', background: 'rgba(34, 197, 94, 0.15)', backdropFilter: 'blur(10px)', borderRadius: '12px', border: '2px solid #22c55e', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 12px 40px rgba(0,0,0,0.2)', zIndex: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '28px' }}>💾</span>
            <div style={{ display: 'flex', flexDirection: 'column', color: md3.onSurface }}>
              <span style={{ fontSize: '13px', fontWeight: '700' }}>{incomingFile.name}</span>
              <span style={{ fontSize: '11px', opacity: 0.7 }}>{formatFileSize(incomingFile.size)} · 文件接收完毕</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <a href={incomingFile.url} download={incomingFile.name} onClick={() => setIncomingFile(null)} style={{ padding: '8px 16px', background: '#22c55e', color: '#fff', textDecoration: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '600' }}>
              下载文件
            </a>
            <button onClick={() => setIncomingFile(null)} style={{ padding: '8px 12px', background: 'none', border: '1px solid #ccc', color: md3.onSurface, borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}>取消</button>
          </div>
        </div>
      )}

      {/* 4. 双向实时传输进度条 */}
      {(uploadProgress !== null || downloadProgress !== null) && (
        <div style={{ position: 'absolute', bottom: '66px', left: '20px', right: '20px', padding: '10px 14px', background: md3.surfaceContainerHigh, borderRadius: '8px', border: `1px solid ${md3.primary}`, display: 'flex', flexDirection: 'column', gap: '6px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', zIndex: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', fontWeight: '600' }}>
            <span>{uploadProgress !== null ? '正在通过 P2P 通道发送文件...' : '正在通过 P2P 通道接收文件...'}</span>
            <span style={{ color: md3.primary }}>{uploadProgress !== null ? uploadProgress : downloadProgress}%</span>
          </div>
          <div style={{ width: '100%', height: '6px', background: '#e0e2ec', borderRadius: '100px', overflow: 'hidden' }}>
            <div style={{ width: `${uploadProgress !== null ? uploadProgress : downloadProgress}%`, height: '100%', background: md3.primary, transition: 'width 0.05s ease-out' }} />
          </div>
        </div>
      )}

      {/* 5. 底部表单 */}
      {currentRoom ? (
        <form onSubmit={sendMessage} style={{ height: '64px', borderTop: `1px solid ${md3.outline}`, display: 'flex', alignItems: 'center', padding: '0 16px', gap: '10px', backgroundColor: md3.surfaceContainerLow }}>
          <input type="file" ref={fileInputRef} onChange={onFileChange} style={{ display: 'none' }} />
          
          <button type="button" onClick={triggerFileSelect} disabled={!isPeerOnline || uploadProgress !== null || downloadProgress !== null} style={{ width: '38px', height: '38px', borderRadius: '50%', border: 'none', background: isPeerOnline ? md3.surfaceContainerHigh : 'rgba(0,0,0,0.05)', color: isPeerOnline ? md3.onSurface : '#aaa', fontSize: '18px', cursor: !isPeerOnline ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            📎
          </button>

          <input type="text" placeholder={isPeerOnline ? "输入消息，按回车发送..." : "对方已离线，文件通道已关闭，消息已暂存"} value={newMessage} onChange={(e) => setNewMessage(e.target.value)} style={{ flex: 1, height: '38px', borderRadius: '20px', border: `1px solid ${md3.outline}`, padding: '0 16px', outline: 'none', fontSize: '13px', backgroundColor: md3.surface, color: md3.onSurface }} />
          <button type="submit" style={{ padding: '8px 20px', background: md3.primary, color: md3.onPrimary, border: 'none', borderRadius: '20px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>发送</button>
        </form>
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: md3.onSurfaceVariant, fontSize: '14px', opacity: 0.6 }}>
          请选择一个聊天频道开始对话
        </div>
      )}
    </div>
  )
}