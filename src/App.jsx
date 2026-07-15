import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { t } from './utils/i18n' // 👈 导入多语言引擎[cite: 1]

export default function App() {
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('') 
  const [avatarFile, setAvatarFile] = useState(null)  
  const [msg, setMsg] = useState({ text: '', type: '' })

  // 💡 初始化及监听本地语言偏好
  const [lang, setLang] = useState(() => localStorage.getItem('cyber_lang') || 'zh-CN')[cite: 1]
  useEffect(() => {
    localStorage.setItem('cyber_lang', lang)[cite: 1]
  }, [lang])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        const params = new URLSearchParams(window.location.search);
        const redirectUrl = params.get('redirect');
        window.location.replace(redirectUrl ? `./${redirectUrl}` : './chat.html');
      }
    })
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    setMsg({ text: t(lang, 'loggingIn'), type: 'info' }) // 👈 翻译提示[cite: 1]
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setMsg({ text: `${t(lang, 'loginBtn')}${t(lang, 'inviteFail')}${error.message}`, type: 'error' })[cite: 1]
    } else if (data.session) {
      window.location.replace('./chat.html')
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    if (!username.trim()) return setMsg({ text: t(lang, 'enterUsernamePlh'), type: 'error' })[cite: 1]
    setMsg({ text: t(lang, 'registering'), type: 'info' }) // 👈 翻译提示[cite: 1]

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
        setMsg({ text: `Profiles Init Failed: ${profileError.message}`, type: 'error' })
      } else {
        setMsg({ text: '🎉 Account created successfully!', type: 'success' })
        setIsRegister(false)
      }
    }
  }

  const md3 = {
    primary: '#0061a4',
    onPrimaryContainer: '#001d36',
    onSurface: '#1a1c1e',          
    onSurfaceVariant: '#43474e',   
    outline: 'rgba(116, 117, 127, 0.4)' 
  }

  return (
    <div style={{ 
      backgroundImage: "url('https://bing.img.run/uhd.php')", 
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

      <div style={{ 
        maxWidth: '440px', 
        width: '90%',
        padding: '36px', 
        backgroundColor: 'rgba(242, 243, 247, 0.65)', 
        backdropFilter: 'blur(20px)', 
        WebkitBackdropFilter: 'blur(20px)', 
        borderRadius: '28px', 
        border: '1px solid rgba(255, 255, 255, 0.45)', 
        boxShadow: '0 12px 40px 0 rgba(0, 0, 0, 0.15)',
        fontFamily: '"Roboto", sans-serif', 
        color: md3.onSurface,
        boxSizing: 'border-box',
        position: 'relative'
      }}>
        
        {/* 🌐 精致的语言切换下拉框 */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px', marginTop: '-12px' }}>
          <select 
            value={lang} 
            onChange={e => setLang(e.target.value)}
            style={{
              padding: '6px 12px',
              borderRadius: '20px',
              border: `1px solid ${md3.outline}`,
              backgroundColor: 'rgba(255, 255, 255, 0.7)',
              backdropFilter: 'blur(10px)',
              color: md3.onSurface,
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              outline: 'none',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
            }}
          >
            <option value="zh-CN">简体中文</option>
            <option value="zh-TW">繁體中文</option>
            <option value="en">English</option>
            <option value="ja">日本語</option>
          </select>
        </div>
        
        <h2 style={{ textAlign: 'center', fontWeight: '500', marginBottom: '24px', color: md3.onSurface, marginTop: 0, letterSpacing: '0.5px' }}>
          {isRegister ? t(lang, 'joinTitle') : t(lang, 'secureLogin')} {/* 👈 翻译词条[cite: 1] */}
        </h2>
        
        {msg.text && (
          <p style={{ padding: '12px 16px', borderRadius: '12px', fontSize: '14px', textAlign: 'center', backgroundColor: msg.type === 'error' ? 'rgba(255, 242, 240, 0.85)' : 'rgba(209, 228, 255, 0.85)', color: msg.type === 'error' ? '#ff4d4f' : '#001d36', marginBottom: '20px', fontWeight: '500' }}>
            {msg.text}
          </p>
        )}

        <form onSubmit={isRegister ? handleRegister : handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {isRegister && (
            <>
              <input type="text" placeholder={t(lang, 'displayNamePlh')} required value={displayName} onChange={e => setDisplayName(e.target.value)} style={{ padding: '16px', borderRadius: '14px', border: `1px solid ${md3.outline}`, outline: 'none', fontSize: '14px', backgroundColor: 'rgba(255, 255, 255, 0.7)', color: md3.onSurface }} /> {/* 👈 翻译词条[cite: 1] */}
              <input type="text" placeholder={t(lang, 'usernamePlh')} required value={username} onChange={e => setUsername(e.target.value)} style={{ padding: '16px', borderRadius: '14px', border: `1px solid ${md3.outline}`, outline: 'none', fontSize: '14px', backgroundColor: 'rgba(255, 255, 255, 0.7)', color: md3.onSurface }} /> {/* 👈 翻译词条[cite: 1] */}
              
              <div style={{ border: `1px dashed ${md3.outline}`, borderRadius: '14px', padding: '12px', backgroundColor: 'rgba(255, 255, 255, 0.5)', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: md3.onSurfaceVariant, fontWeight: '500' }}>{t(lang, 'uploadAvatar')}</span> {/* 👈 翻译词条[cite: 1] */}
                <input type="file" accept="image/*" onChange={e => setAvatarFile(e.target.files[0])} style={{ fontSize: '12px', color: md3.onSurface }} />
              </div>
            </>
          )}
          
          <input type="email" placeholder={t(lang, 'emailPlh')} required value={email} onChange={e => setEmail(e.target.value)} style={{ padding: '16px', borderRadius: '14px', border: `1px solid ${md3.outline}`, outline: 'none', fontSize: '14px', backgroundColor: 'rgba(255, 255, 255, 0.7)', color: md3.onSurface }} /> {/* 👈 翻译词条[cite: 1] */}
          <input type="password" placeholder={t(lang, 'passwordPlh')} required value={password} onChange={e => setPassword(e.target.value)} style={{ padding: '16px', borderRadius: '14px', border: `1px solid ${md3.outline}`, outline: 'none', fontSize: '14px', backgroundColor: 'rgba(255, 255, 255, 0.7)', color: md3.onSurface }} /> {/* 👈 翻译词条[cite: 1] */}
          
          <button type="submit" style={{ padding: '14px', background: md3.primary, color: '#fff', border: 'none', borderRadius: '100px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', marginTop: '8px', boxShadow: '0 4px 12px rgba(0, 97, 164, 0.3)' }}>
            {isRegister ? t(lang, 'submitRegister') : t(lang, 'loginBtn')} {/* 👈 翻译词条[cite: 1] */}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: md3.onSurfaceVariant, marginBottom: 0 }}>
          {isRegister ? t(lang, 'hasAccount') : t(lang, 'noAccount')}{' '} {/* 👈 翻译词条[cite: 1] */}
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
            {isRegister ? t(lang, 'loginNow') : t(lang, 'registerNow')} {/* 👈 翻译词条[cite: 1] */}
          </span>
        </p>
      </div>

    </div>
  )
}