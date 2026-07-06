import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

export default function App() {
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('') 
  const [avatarFile, setAvatarFile] = useState(null)  
  const [msg, setMsg] = useState({ text: '', type: '' })

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        const params = new URLSearchParams(window.location.search);
        const redirectUrl = params.get('redirect');
        // 如果有好友引流网址，登录成功后先送去引流网页完成自动加好友，否则去主页
        window.location.replace(redirectUrl ? `./${redirectUrl}` : './chat.html');
      }
    })
  }, [])
  const handleLogin = async (e) => {
    e.preventDefault()
    setMsg({ text: '正在登录...', type: 'info' })
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setMsg({ text: `登录失败: ${error.message}`, type: 'error' })
    } else if (data.session) {
      window.location.replace('./chat.html')
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    if (!username.trim()) return setMsg({ text: '请输入@用户名！', type: 'error' })
    setMsg({ text: '正在创建账号并上传头像...', type: 'info' })

    const { data, error: authError } = await supabase.auth.signUp({ email, password })
    if (authError) return setMsg({ text: authError.message, type: 'error' })
    
    const user = data.user
    if (user) {
      let finalAvatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${username}` 

      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop()
        const fileName = `${user.id}-${Date.now()}.${fileExt}` 
        
        const { error: uploadErr } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatarFile)

        if (!uploadErr) {
          const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName)
          finalAvatarUrl = publicUrl
        }
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert([{ 
          id: user.id, 
          username: username.trim().toLowerCase(), 
          display_name: displayName.trim() || username.trim(), 
          avatar_url: finalAvatarUrl 
        }], { onConflict: 'id' })

      if (profileError) {
        setMsg({ text: `账号创建成功，但资料初始化失败: ${profileError.message}`, type: 'error' })
      } else {
        setMsg({ text: '🎉 注册成功！现在可以直接切换到登录。', type: 'success' })
        setIsRegister(false)
      }
    }
  }

  // MD3 规范基础色
  const md3 = {
    primary: '#0061a4',
    onPrimaryContainer: '#001d36',
    onSurface: '#1a1c1e',          // 保持深色文字以确保在毛玻璃上的高清晰度
    onSurfaceVariant: '#43474e',   
    outline: 'rgba(116, 117, 127, 0.4)' // 弱化描边，使其更贴合玻璃质感
  }

  return (
    /* 外层全屏容器：负责拉取并铺满 Bing 每日高清壁纸 */
    <div style={{ 
      backgroundImage: "url('https://bing.img.run/uhd.php')", // 自动同步全流 4K/UHD 必应每日壁纸
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      width: '100vw',
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: 0,
      padding: 0,
      overflow: 'hidden'
    }}>

      {/* 核心卡片：MD3 大圆角 + Aero 毛玻璃特效 */}
      <div style={{ 
        maxWidth: '440px', 
        width: '90%',
        padding: '36px', 
        // 1. 使用带有 alpha 通道的浅色底，作为毛玻璃基层
        backgroundColor: 'rgba(242, 243, 247, 0.65)', 
        // 2. Aero 特效灵魂：高强度像素模糊
        backdropFilter: 'blur(20px)', 
        WebkitBackdropFilter: 'blur(20px)', // 兼容苹果 Safari 浏览器
        // 3. MD3 标准大圆角
        borderRadius: '28px', 
        // 4. 玻璃拟态的高光微描边
        border: '1px solid rgba(255, 255, 255, 0.45)', 
        // 5. 大范围柔和阴影，增加大厂特有的悬浮层级感
        boxShadow: '0 12px 40px 0 rgba(0, 0, 0, 0.15)',
        fontFamily: '"Roboto", sans-serif', 
        color: md3.onSurface,
        boxSizing: 'border-box'
      }}>
        
        <h2 style={{ textAlign: 'center', fontWeight: '500', marginBottom: '24px', color: md3.onSurface, marginTop: 0, letterSpacing: '0.5px' }}>
          {isRegister ? '加入 ChattingHub Pro' : '安全登录'}
        </h2>
        
        {msg.text && (
          <p style={{ padding: '12px 16px', borderRadius: '12px', fontSize: '14px', textAlign: 'center', backgroundColor: msg.type === 'error' ? 'rgba(255, 242, 240, 0.85)' : 'rgba(209, 228, 255, 0.85)', color: msg.type === 'error' ? '#ff4d4f' : '#001d36', marginBottom: '20px', fontWeight: '500' }}>
            {msg.text}
          </p>
        )}

        <form onSubmit={isRegister ? handleRegister : handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {isRegister && (
            <>
              <input type="text" placeholder="显示名称 / 昵称 (例如: 牢大)" required value={displayName} onChange={e => setDisplayName(e.target.value)} style={{ padding: '16px', borderRadius: '14px', border: `1px solid ${md3.outline}`, outline: 'none', fontSize: '14px', backgroundColor: 'rgba(255, 255, 255, 0.7)', color: md3.onSurface }} />
              <input type="text" placeholder="个性 @用户名 (例如: akihiro)" required value={username} onChange={e => setUsername(e.target.value)} style={{ padding: '16px', borderRadius: '14px', border: `1px solid ${md3.outline}`, outline: 'none', fontSize: '14px', backgroundColor: 'rgba(255, 255, 255, 0.7)', color: md3.onSurface }} />
              
              {/* 头像上传框也加入半透明玻璃感 */}
              <div style={{ border: `1px dashed ${md3.outline}`, borderRadius: '14px', padding: '12px', backgroundColor: 'rgba(255, 255, 255, 0.5)', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: md3.onSurfaceVariant, fontWeight: '500' }}>🖼️ 上传你的专属头像</span>
                <input type="file" accept="image/*" onChange={e => setAvatarFile(e.target.files[0])} style={{ fontSize: '12px', color: md3.onSurface }} />
              </div>
            </>
          )}
          
          <input type="email" placeholder="电子邮箱" required value={email} onChange={e => setEmail(e.target.value)} style={{ padding: '16px', borderRadius: '14px', border: `1px solid ${md3.outline}`, outline: 'none', fontSize: '14px', backgroundColor: 'rgba(255, 255, 255, 0.7)', color: md3.onSurface }} />
          <input type="password" placeholder="密码" required value={password} onChange={e => setPassword(e.target.value)} style={{ padding: '16px', borderRadius: '14px', border: `1px solid ${md3.outline}`, outline: 'none', fontSize: '14px', backgroundColor: 'rgba(255, 255, 255, 0.7)', color: md3.onSurface }} />
          
          <button type="submit" style={{ padding: '14px', background: md3.primary, color: '#fff', border: 'none', borderRadius: '100px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', marginTop: '8px', boxShadow: '0 4px 12px rgba(0, 97, 164, 0.3)' }}>
            {isRegister ? '提交注册' : '登 录'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: md3.onSurfaceVariant, marginBottom: 0 }}>
          {isRegister ? '已有账号？' : '还没有账号？'}{' '}
          <span 
            onClick={() => { 
              setIsRegister(!isRegister); 
              setMsg({ text: '', type: '' }); 
            }} 
            style={{ 
              color: md3.primary, 
              cursor: 'pointer', 
              fontWeight: '700', 
              textDecoration: 'underline',
              display: 'inline-block',
              padding: '4px 8px',
              userSelect: 'none'
            }}
          >
            {isRegister ? '立即登录' : '注册新账号'}
          </span>
        </p>
      </div>

    </div>
  )
}