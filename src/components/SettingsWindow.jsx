import React, { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export default function SettingsWindow({
  isOpen, setIsOpen, wallpaper, setWallpaper, currentTheme, setCurrentTheme,
  taskbarPosition, setTaskbarPosition, myProfile, setMyProfile, triggerToast, md3,
  settingsDimensions, isSettingsDragging, settingsResizeType,
  onTitleMouseDown, onResizeMouseDown
}) {
  // 个人资料修改状态机
  const [localDisplayName, setLocalDisplayName] = useState('')
  const [localUsername, setLocalUsername] = useState('')
  const [localAvatarUrl, setLocalAvatarUrl] = useState('')
  const [localBio, setLocalBio] = useState('')
  const [isSavingProfile, setIsSavingProfile] = useState(false)

  useEffect(() => {
    if (myProfile) {
      setLocalDisplayName(myProfile.display_name || '')
      setLocalUsername(myProfile.username || '')
      setLocalAvatarUrl(myProfile.avatar_url || '')
      setLocalBio(myProfile.bio || '')
    }
  }, [myProfile])

  if (!isOpen) return null

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    if (!localDisplayName.trim() || !localUsername.trim()) {
      return triggerToast('昵称和用户名不能为空。', 'error')
    }

    setIsSavingProfile(true)
    
    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: localDisplayName.trim(),
        username: localUsername.trim().toLowerCase().replace(/\s+/g, ''),
        avatar_url: localAvatarUrl.trim(),
        bio: localBio.trim()
      })
      .eq('id', myProfile.id)

    setIsSavingProfile(false)

    if (error) {
      if (error.code === '23505') {
        triggerToast('该用户名已被占用，请尝试其他用户名。', 'error')
      } else {
        triggerToast('保存失败: ' + error.message, 'error')
      }
    } else {
      setMyProfile(prev => ({
        ...prev,
        display_name: localDisplayName.trim(),
        username: localUsername.trim().toLowerCase().replace(/\s+/g, ''),
        avatar_url: localAvatarUrl.trim(),
        bio: localBio.trim()
      }))
      triggerToast('个人资料更新成功。', 'success')
    }
  }

  const generateRandomAvatar = () => {
    const randomSeed = Math.random().toString(36).substring(7)
    const newAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${randomSeed}`
    setLocalAvatarUrl(newAvatar)
    triggerToast('已随机生成新头像。')
  }

  return (
    <div style={{
      position: 'absolute', 
      width: `${settingsDimensions.width}px`,
      height: `${settingsDimensions.height}px`,
      left: `${settingsDimensions.left}px`,
      top: `${settingsDimensions.top}px`,
      backgroundColor: currentTheme === 'dark' ? 'rgba(30, 30, 35, 0.85)' : 'rgba(255, 255, 255, 0.85)',
      backdropFilter: 'blur(25px)', 
      borderRadius: '16px',
      boxShadow: '0 24px 70px rgba(0,0,0,0.35)',
      border: currentTheme === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(255, 255, 255, 0.4)',
      zIndex: 500, 
      display: 'flex', 
      flexDirection: 'column', 
      overflow: 'hidden',
      fontFamily: 'sans-serif', 
      color: md3.onSurface,
      transition: (isSettingsDragging || settingsResizeType) ? 'none' : 'all 0.2s cubic-bezier(0.1, 0.9, 0.2, 1)'
    }}>
      
      {/* 标题栏 */}
      <div 
        onMouseDown={onTitleMouseDown}
        style={{ 
          height: '38px', 
          backgroundColor: currentTheme === 'dark' ? '#252529' : 'rgba(230, 230, 230, 0.9)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          padding: '0 14px', 
          borderBottom: currentTheme === 'dark' ? '1px solid #333' : '1px solid #dcdcdc',
          cursor: 'move'
        }}
      >
        <div style={{ fontSize: '12.5px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>⚙️</span> 设置中心
        </div>
        <button onClick={() => setIsOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '14px', color: md3.onSurfaceVariant }}>✕</button>
      </div>

      {/* 设置主表单区 */}
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', flex: 1, overflowY: 'auto' }}>
        
        {/* 个人资料设置 */}
        <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderBottom: `1px solid ${md3.outline}`, paddingBottom: '18px' }}>
          <div style={{ fontSize: '13.5px', fontWeight: '700', color: md3.primary, marginBottom: '4px' }}>个人资料设置</div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', backgroundColor: currentTheme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', padding: '10px', borderRadius: '12px' }}>
            <img src={localAvatarUrl || 'https://api.dicebear.com/7.x/identicon/svg'} alt="avatar-preview" style={{ width: '56px', height: '56px', borderRadius: '28px', objectFit: 'cover', backgroundColor: '#e0e2ec', border: `2px solid ${md3.primaryContainer}` }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '11px', opacity: 0.6 }}>头像预览</span>
              <button type="button" onClick={generateRandomAvatar} style={{ padding: '4px 10px', background: md3.primaryContainer, color: md3.onPrimaryContainer, border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', width: 'fit-content' }}>随机生成头像</button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '11.5px', opacity: 0.7, display: 'block', marginBottom: '4px' }}>显示昵称</label>
              <input type="text" value={localDisplayName} onChange={(e) => setLocalDisplayName(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', borderRadius: '8px', border: '1px solid #ccc', backgroundColor: currentTheme === 'dark' ? '#2e3038' : '#fff', color: md3.onSurface, outline: 'none', fontSize: '12.5px' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '11.5px', opacity: 0.7, display: 'block', marginBottom: '4px' }}>用户名</label>
              <input type="text" value={localUsername} onChange={(e) => setLocalUsername(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', borderRadius: '8px', border: '1px solid #ccc', backgroundColor: currentTheme === 'dark' ? '#2e3038' : '#fff', color: md3.onSurface, outline: 'none', fontSize: '12.5px' }} />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '11.5px', opacity: 0.7, display: 'block', marginBottom: '4px' }}>头像图片 URL</label>
            <input type="text" placeholder="请输入图片链接（以 https:// 开头）" value={localAvatarUrl} onChange={(e) => setLocalAvatarUrl(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', borderRadius: '8px', border: '1px solid #ccc', backgroundColor: currentTheme === 'dark' ? '#2e3038' : '#fff', color: md3.onSurface, outline: 'none', fontSize: '12.5px' }} />
          </div>

          <div>
            <label style={{ fontSize: '11.5px', opacity: 0.7, display: 'block', marginBottom: '4px' }}>个性签名</label>
            <textarea value={localBio} onChange={(e) => setLocalBio(e.target.value)} placeholder="请输入个人简介..." style={{ width: '100%', boxSizing: 'border-box', height: '48px', padding: '6px 10px', borderRadius: '8px', border: '1px solid #ccc', backgroundColor: currentTheme === 'dark' ? '#2e3038' : '#fff', color: md3.onSurface, outline: 'none', fontSize: '12.5px', resize: 'none' }} />
          </div>

          <button type="submit" disabled={isSavingProfile} style={{ width: '100%', padding: '8px', background: md3.primary, color: md3.onPrimary, border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', opacity: isSavingProfile ? 0.7 : 1, transition: 'background 0.2s' }}>
            {isSavingProfile ? '正在保存...' : '保存设置'}
          </button>
        </form>

        {/* 主题设置 */}
        <div style={{ borderBottom: `1px solid ${md3.outline}`, paddingBottom: '16px' }}>
          <div style={{ fontSize: '13.5px', fontWeight: '700', color: md3.primary, marginBottom: '8px' }}>主题设置</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['light', 'dark', 'sunset'].map(t => (
              <button key={t} onClick={() => setCurrentTheme(t)} style={{
                flex: 1, padding: '8px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                border: currentTheme === t ? `2px solid ${md3.primary}` : '1px solid #ccc',
                background: currentTheme === t ? md3.primaryContainer : (currentTheme === 'dark' ? '#2e3038' : '#fff'),
                color: currentTheme === t ? md3.onPrimaryContainer : md3.onSurface
              }}>
                {t === 'light' ? '浅色模式' : t === 'dark' ? '深色模式' : '暮色模式'}
              </button>
            ))}
          </div>
        </div>

        {/* 壁纸设置 */}
        <div style={{ borderBottom: `1px solid ${md3.outline}`, paddingBottom: '16px' }}>
          <div style={{ fontSize: '13.5px', fontWeight: '700', color: md3.primary, marginBottom: '6px' }}>壁纸设置</div>
          <input 
            type="text" 
            placeholder="粘贴自定义图片 URL 链接..." 
            value={wallpaper} 
            onChange={(e) => setWallpaper(e.target.value)}
            style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', borderRadius: '8px', border: '1px solid #ccc', backgroundColor: currentTheme === 'dark' ? '#2e3038' : '#fff', color: md3.onSurface, fontSize: '12px', outline: 'none', marginBottom: '6px' }}
          />
          <button onClick={() => setWallpaper('https://bing.img.run/uhd.php')} style={{ width: '100%', padding: '6px', background: currentTheme === 'dark' ? '#2e3038' : '#e0e2ec', color: md3.onSurface, border: 'none', borderRadius: '8px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>
            恢复默认壁纸 (Bing 每日壁纸)
          </button>
        </div>

        {/* 任务栏位置 */}
        <div>
          <div style={{ fontSize: '13.5px', fontWeight: '700', color: md3.primary, marginBottom: '6px' }}>任务栏位置</div>
          <div style={{ display: 'flex', gap: '16px' }}>
            {['bottom', 'top'].map(pos => (
              <label key={pos} style={{ fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                <input type="radio" name="tbPos" checked={taskbarPosition === pos} onChange={() => setTaskbarPosition(pos)} />
                {pos === 'bottom' ? '底部 (默认)' : '顶部'}
              </label>
            ))}
          </div>
        </div>

      </div>

      {/* 缩放把手 */}
      <div onMouseDown={(e) => onResizeMouseDown('right', e)} style={{ position: 'absolute', right: 0, top: 0, width: '6px', height: '100%', cursor: 'e-resize', zIndex: 100 }} />
      <div onMouseDown={(e) => onResizeMouseDown('bottom', e)} style={{ position: 'absolute', left: 0, bottom: 0, width: '100%', height: '6px', cursor: 's-resize', zIndex: 100 }} />
      <div onMouseDown={(e) => onResizeMouseDown('bottom-right', e)} style={{ position: 'absolute', right: 0, bottom: 0, width: '12px', height: '12px', cursor: 'se-resize', zIndex: 101 }} />
    
    </div>
  )
}