import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

export default function ProfileApp() {
  // 1. 核心状态管理
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isOwner, setIsOwner] = useState(false) // 判定当前访问的是否为登录者自己的主页
  const [isSaving, setIsSaving] = useState(false)
  const [errorNotice, setErrorNotice] = useState(null)

  // 2. 表单输入状态机
  const [displayName, setDisplayName] = useState('')
  const [handleUsername, setHandleUsername] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [bio, setBio] = useState('')

  // 3. 提示通知状态
  const [toast, setToast] = useState({ text: '', type: '' })

  const triggerToast = (text, type = 'info') => {
    setToast({ text, type })
    setTimeout(() => setToast({ text: '', type: '' }), 3000)
  }

  useEffect(() => {
    fetchProfileData()
  }, [])

  // 核心数据流控制芯片
  const fetchProfileData = async () => {
    try {
      setLoading(true)
      setErrorNotice(null)

      //核心修复点：采用路径分割防空算法，精准剥离 '/ChattingHub_Pro/' 等任何二级目录前缀
      const fileName = window.location.pathname.split('/').pop()
      const targetUsername = fileName ? fileName.replace('.html', '').toLowerCase().trim() : ''

      if (!targetUsername || targetUsername === 'profile') {
        // 如果直接访问 profile.html 且未带用户名，则默认尝试拉取当前登录用户
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          window.location.replace('./index.html')
          return
        }
        const { data: myProfile } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle()
        if (myProfile) {
          setupForm(myProfile, true)
        } else {
          setErrorNotice('未找到您的个人档案，请重新登录。')
        }
        return
      }

      //  拿着精准解析出的用户名去数据库检索目标档案
      const { data: targetProfile, error: fetchErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', targetUsername)
        .maybeSingle()

      if (fetchErr) throw fetchErr

      if (!targetProfile) {
        // 对应截图中的异常触发：未能匹配到正确的用户名
        setErrorNotice('未找到该用户的个人主页，链接可能已失效')
        setupForm({ display_name: '未设置昵称', username: '', avatar_url: '', bio: '' }, false)
        return
      }

      //  校验当前登录用户是否为该主页的拥有者
      const { data: { session } } = await supabase.auth.getSession()
      const isMyPage = session ? session.user.id === targetProfile.id : false
      
      setupForm(targetProfile, isMyPage)

    } catch (err) {
      console.error('检索用户档案异常:', err)
      setErrorNotice('服务器通讯链路异常，请刷新重试。')
    } finally {
      setLoading(false)
    }
  }

  // 表单状态注入分配器
  const setupForm = (data, isMyPage) => {
    setProfile(data)
    setIsOwner(isMyPage)
    setDisplayName(data.display_name || '')
    setHandleUsername(data.username || '')
    setAvatarUrl(data.avatar_url || '')
    setBio(data.bio || '')
  }

  //  头像文件本地转换处理芯片（不占用云端服务器存储空间）
  const handleAvatarFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      return triggerToast('Error：头像文件不能超过 2MB。', 'error')
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setAvatarUrl(reader.result) // 转换为 Base64 本地编码或转存数据流
        triggerToast('头像本地加载成功，保存后将同步。', 'success')
      }
    }
    reader.readAsDataURL(file)
  }

  //  保存主页修改提交器
  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    if (!isOwner) return triggerToast('安全拦截：您无权修改他人的个人主页。', 'error')
    if (!displayName.trim() || !handleUsername.trim()) return triggerToast('昵称和用户名不能为空。', 'error')

    setIsSaving(true)
    try {
      const formattedUsername = handleUsername.trim().toLowerCase().replace(/\s+/g, '')

      const { error: updateErr } = await supabase
        .from('profiles')
        .update({
          display_name: displayName.trim(),
          username: formattedUsername,
          avatar_url: avatarUrl,
          bio: bio.trim()
        })
        .eq('id', profile.id)

      if (updateErr) {
        if (updateErr.code === '23505') {
          triggerToast('该用户名已被其他用户占用。', 'error')
        } else {
          throw updateErr
        }
      } else {
        triggerToast('个人主页配置更新成功。', 'success')
        // 如果用户修改了唯一句柄用户名，动态更新当前的浏览器地址栏防止404
        const newPath = window.location.pathname.replace(/[^\/]+\.html$/, `${formattedUsername}.html`)
        window.history.replaceState(null, '', newPath)
      }
    } catch (err) {
      triggerToast('数据同步失败: ' + err.message, 'error')
    } finally {
      setIsSaving(false)
    }
  }

  //  一键复制专属主页链接
  const handleCopyLink = () => {
    if (!handleUsername) return triggerToast('无法生成链接，用户名为空。', 'error')
    const currentOrigin = window.location.origin
    const repoBase = '/ChattingHub_Pro/' // 与 GitHub Pages 路径保持绝对对齐
    const fullLink = `${currentOrigin}${repoBase}${handleUsername}.html`
    
    navigator.clipboard.writeText(fullLink)
      .then(() => triggerToast('专属主页链接已成功复制至剪贴板。', 'success'))
      .catch(() => triggerToast('复制失败，请手动选择地址栏复制。', 'error'))
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundImage: 'url(https://bing.img.run/uhd.php)', backgroundSize: 'cover', color: '#fff', fontFamily: 'sans-serif' }}>
        正在载入用户配置文件...
      </div>
    )
  }

  // 动态主题调色板（保持与大盘风格一致）
  const theme = {
    surface: 'rgba(255, 255, 255, 0.85)',
    onSurface: '#1a1c1e',
    primary: '#0061a4',
    onPrimary: '#ffffff',
    errorContainer: '#ffeede',
    onError: '#ba1a1a'
  }

  return (
    <div style={{ width: '100vw', height: '100vh', backgroundImage: 'url(https://bing.img.run/uhd.php)', backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
      
      {/* Toast 提示容器 */}
      {toast.text && (
        <div style={{ position: 'absolute', top: '20px', padding: '10px 20px', borderRadius: '8px', background: toast.type === 'error' ? '#ffdad9' : toast.type === 'success' ? '#d6f5d6' : '#d1e4ff', color: toast.type === 'error' ? theme.onError : '#1a1c1e', fontSize: '13px', fontWeight: '600', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', zIndex: 1000, transition: 'all 0.2s' }}>
          {toast.text}
        </div>
      )}

      {/* 仿真毛玻璃主控卡片 */}
      <div style={{ width: '420px', padding: '30px 24px', backgroundColor: theme.surface, backdropFilter: 'blur(30px)', borderRadius: '24px', boxShadow: '0 24px 60px rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.4)', display: 'flex', flexDirection: 'column', alignItems: 'center', color: theme.onSurface }}>
        
        {/* 头像预览模块 */}
        <div style={{ position: 'relative', marginBottom: '16px' }}>
          <img src={avatarUrl || 'https://api.dicebear.com/7.x/identicon/svg'} alt="User Avatar" style={{ width: '110px', height: '110px', borderRadius: '55px', objectFit: 'cover', backgroundColor: '#e0e2ec', border: `3px solid ${theme.primary}` }} />
        </div>

        {/* 昵称及 Handle 展示 */}
        <h2 style={{ margin: '0 0 4px 0', fontSize: '22px', fontWeight: '700' }}>{displayName || '未设置昵称'}</h2>
        <span style={{ fontSize: '14px', opacity: 0.6, marginBottom: '16px' }}>@{handleUsername || '无'}</span>

        {/* 🚨 警报容器：当路径匹配查无此人时，渲染此专业化提示框 */}
        {errorNotice && (
          <div style={{ width: '100%', boxSizing: 'border-box', padding: '12px 16px', background: 'rgba(186, 26, 26, 0.08)', borderRadius: '12px', border: '1px solid rgba(186, 26, 26, 0.2)', color: theme.onError, fontSize: '13px', fontWeight: '500', textAlign: 'center', marginBottom: '16px' }}>
            !! {errorNotice} [我早已麻痹]
          </div>
        )}

        {/* 核心配置表单 */}
        <form onSubmit={handleUpdateProfile} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '600', opacity: 0.8, display: 'block', marginBottom: '4px' }}>显示名称 / 昵称</label>
            <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} disabled={!isOwner} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '10px', border: '1px solid #ccc', backgroundColor: isOwner ? '#fff' : 'rgba(0,0,0,0.04)', color: theme.onSurface, outline: 'none', fontSize: '13.5px' }} />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: '600', opacity: 0.8, display: 'block', marginBottom: '4px' }}>个性 @用户名 (唯一)</label>
            <input type="text" value={handleUsername} onChange={(e) => setHandleUsername(e.target.value)} disabled={!isOwner} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '10px', border: '1px solid #ccc', backgroundColor: isOwner ? '#fff' : 'rgba(0,0,0,0.04)', color: theme.onSurface, outline: 'none', fontSize: '13.5px' }} />
          </div>

          {isOwner && (
            <div style={{ padding: '12px', border: '1px dashed #ccc', borderRadius: '12px', backgroundColor: 'rgba(0,0,0,0.01)' }}>
              <span style={{ fontSize: '12px', fontWeight: '600', opacity: 0.8, display: 'block', marginBottom: '6px' }}>📷 更换全新的高清头像文件</span>
              <input type="file" accept="image/*" onChange={handleAvatarFileChange} style={{ fontSize: '12px' }} />
            </div>
          )}

          {isOwner && (
            <button type="submit" disabled={isSaving} style={{ width: '100%', padding: '12px', background: theme.primary, color: theme.onPrimary, border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(0,97,164,0.25)', transition: 'background 0.2s' }}>
               {isSaving ? '正在同步数据...' : '保存主页修改'}
            </button>
          )}
        </form>

        {/* 底部控制按钮组 */}
        <div style={{ width: '100%', display: 'flex', gap: '10px', marginTop: '16px' }}>
          <button onClick={handleCopyLink} style={{ flex: 2, padding: '10px', background: '#d1e4ff', color: '#001d36', border: 'none', borderRadius: '12px', fontSize: '12.5px', fontWeight: '600', cursor: 'pointer', transition: 'background 0.2s' }}>
            复制链接
          </button>
          <button onClick={() => window.location.replace('./chat.html')} style={{ flex: 1, padding: '10px', background: '#e0e2ec', color: '#1a1c1e', border: 'none', borderRadius: '12px', fontSize: '12.5px', fontWeight: '600', cursor: 'pointer' }}>
            返回聊天室
          </button>
        </div>

      </div>
    </div>
  )
}