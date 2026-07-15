import { useEffect, useState, useRef } from 'react'
import { supabase } from './supabaseClient'
import Toast from './components/Toast'
import TitleBar from './components/TitleBar'
import Sidebar from './components/Sidebar'
import ChatArea from './components/ChatArea'
import Taskbar from './components/Taskbar'
import SettingsWindow from './components/SettingsWindow'
// 导入端到端加解密辅助函数
import { encryptMessage, decryptMessage } from './utils/cryptoHelper'

export default function ChatApp() {
  // 1. 核心数据与状态总线
  const [myProfile, setMyProfile] = useState(null)
  const [rooms, setRooms] = useState([])
  const [currentRoom, setCurrentRoom] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [networkError, setNetworkError] = useState(null)
  const messagesEndRef = useRef(null)

  // 对端用户实时在线状态监听器
  const [isPeerOnline, setIsPeerOnline] = useState(false)

  // WebRTC P2P 数据传输控制器
  const [uploadProgress, setUploadProgress] = useState(null) 
  const [downloadProgress, setDownloadProgress] = useState(null) 
  const [incomingFile, setIncomingFile] = useState(null) 
  
  const pcRef = useRef(null)         
  const dataChannelRef = useRef(null) 
  const signalingChannelRef = useRef(null) 
  const receivedChunks = useRef([])  
  const expectedFileInfo = useRef(null) 

  // 2. 窗口仿真与几何布局管理
  const [windowState, setWindowState] = useState('normal') 
  const [hoverBtn, setHoverBtn] = useState(null)
  const [dimensions, setDimensions] = useState({ width: 1120, height: 740, left: 100, top: 50 })
  const [isDragging, setIsDragging] = useState(false)               
  const dragStart = useRef({ x: 0, y: 0 })                         
  const windowStart = useRef({ left: 0, top: 0 })                       
  const [resizeType, setResizeType] = useState(null)
  const resizeStart = useRef({ width: 0, height: 0, x: 0, y: 0 })

  // 设置窗口独立的物理几何控制
  const [settingsDimensions, setSettingsDimensions] = useState({ width: 480, height: 580, left: 340, top: 80 })
  const [isSettingsDragging, setIsSettingsDragging] = useState(false)
  const [settingsResizeType, setSettingsResizeType] = useState(null)
  const settingsDragStart = useRef({ x: 0, y: 0 })
  const settingsWindowStart = useRef({ left: 0, top: 0 })
  const settingsResizeStart = useRef({ width: 0, height: 0, x: 0, y: 0 })

  // 3. 全局个性化配置管理
  const [wallpaper, setWallpaper] = useState(() => localStorage.getItem('cyber_wallpaper') || 'https://bing.img.run/uhd.php')
  const [currentTheme, setCurrentTheme] = useState(() => localStorage.getItem('cyber_theme') || 'light')
  const [taskbarPosition, setTaskbarPosition] = useState(() => localStorage.getItem('cyber_taskbar_pos') || 'bottom')
  const [taskbarContent] = useState({ showTime: true, showStatus: true })
  const [isSettingsOpen, setIsSettingsOpen] = useState(false) 

  // 4. 联合检索与全局交互状态
  const [searchQuery, setSearchQuery] = useState('')     
  const [globalUsers, setGlobalUsers] = useState([])     
  const [globalRooms, setGlobalRooms] = useState([])     
  const [toast, setToast] = useState({ text: '', type: '' })          
  const [isCreatingGroup, setIsCreatingGroup] = useState(false)       
  const [newGroupName, setNewGroupName] = useState('')                 
  const [isInviting, setIsInviting] = useState(false)                 
  const [inviteUsername, setInviteUsername] = useState('')             

  const triggerToast = (text, type = 'info') => {
    setToast({ text, type })
    setTimeout(() => setToast({ text: '', type: '' }), 3000)
  }

  // 配置持久化监听
  useEffect(() => { localStorage.setItem('cyber_wallpaper', wallpaper) }, [wallpaper])
  useEffect(() => { localStorage.setItem('cyber_theme', currentTheme) }, [currentTheme])
  useEffect(() => { localStorage.setItem('cyber_taskbar_pos', taskbarPosition) }, [taskbarPosition])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.replace('./')
  }

  useEffect(() => {
    window.supabase = supabase
    checkSessionAndInit()
  }, [])

  const checkSessionAndInit = () => {
    setLoading(true)
    setNetworkError(null)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) window.location.replace('./'); else initChatUser(session.user)
    }).catch(err => {
      setNetworkError('无法建立会话连接，请检查本地网络或代理设置。')
      setLoading(false)
    })
  }

  const initChatUser = async (user) => {
    try {
      let { data: profile } = await supabase.from('profiles').select('id, username, display_name, avatar_url, bio').eq('id', user.id).maybeSingle()
      const defaultName = user.email ? user.email.split('@')[0] : 'user_' + user.id.slice(0, 5)
      const defaultAvatar = `https://api.dicebear.com/7.x/identicon/svg?seed=${defaultName}`

      if (!profile || !profile.username || !profile.display_name || !profile.avatar_url) {
        const repairedFields = {
          id: user.id,
          username: profile?.username || defaultName,
          display_name: profile?.display_name || defaultName,
          avatar_url: profile?.avatar_url || defaultAvatar,
          bio: profile?.bio || ''
        }
        if (!profile) {
          const { data } = await supabase.from('profiles').insert([repairedFields]).select().single()
          profile = data
        } else {
          const { data } = await supabase.from('profiles').update(repairedFields).eq('id', user.id).select().single()
          profile = data
        }
      }
      setMyProfile(profile)
      await fetchRooms()
    } catch (err) {
      setNetworkError('系统环境初始化失败，请重试。')
    } finally {
      setLoading(false)
    }
    const iw = Math.min(1120, window.innerWidth * 0.9), ih = Math.min(740, window.innerHeight * 0.8)
    setDimensions({ width: iw, height: ih, left: (window.innerWidth - iw) / 2, top: (window.innerHeight - ih - 48) / 2 })
  }

  const fetchRooms = async () => {
    const { data } = await supabase.from('rooms').select('*, room_members(user_id, profiles(username, display_name, avatar_url, bio))').order('created_at', { ascending: false })
    if (data) setRooms(data)
  }

  // 离线暂存队列同步器
  const flushOfflineQueue = async (roomId) => {
    const queueKey = `offline_queue_${roomId}`
    const pendingMessages = JSON.parse(localStorage.getItem(queueKey) || '[]')
    if (pendingMessages.length === 0) return
    await supabase.from('messages').insert(pendingMessages.map(msg => ({ room_id: roomId, sender_id: myProfile.id, content: msg.encryptedContent, created_at: msg.timestamp })))
    localStorage.removeItem(queueKey)
    triggerToast('同步成功：本地缓存的离线加密记录已同步至云端。', 'success')
  }

  // =======================================================
  // 🛰️ WebRTC P2P 信令与传输内核逻辑
  // =======================================================
  const createPeerConnection = (roomId) => {
    if (pcRef.current) pcRef.current.close()

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    })

    pc.onicecandidate = (event) => {
      if (event.candidate && signalingChannelRef.current) {
        signalingChannelRef.current.send({
          type: 'broadcast',
          event: 'ice-candidate',
          payload: { candidate: event.candidate }
        })
      }
    }

    pc.ondatachannel = (event) => {
      const channel = event.channel
      if (channel.label === 'cyber-p2p-file') {
        dataChannelRef.current = channel
        setupDataChannelEvents(channel)
      }
    }

    pcRef.current = pc
    return pc
  }

  const setupDataChannelEvents = (channel) => {
    channel.binaryType = 'arraybuffer'
    receivedChunks.current = []

    channel.onmessage = (event) => {
      if (typeof event.data === 'string') {
        expectedFileInfo.current = JSON.parse(event.data)
        setDownloadProgress(0)
        setIncomingFile(null)
        return
      }

      receivedChunks.current.push(event.data)
      const currentBytes = receivedChunks.current.reduce((acc, chunk) => acc + chunk.byteLength, 0)
      const totalBytes = expectedFileInfo.current?.size || 1
      const percent = Math.min(100, Math.round((currentBytes / totalBytes) * 100))
      setDownloadProgress(percent)

      if (currentBytes >= totalBytes) {
        const fileBlob = new Blob(receivedChunks.current)
        setIncomingFile({
          blob: fileBlob,
          name: expectedFileInfo.current.name,
          url: URL.createObjectURL(fileBlob), 
          size: expectedFileInfo.current.size
        })
        setDownloadProgress(null)
        triggerToast(`成功通过 P2P 通道安全接收文件：${expectedFileInfo.current.name}`, 'success')
      }
    }
  }

  const handleSendFile = async (file) => {
    if (!currentRoom || !isPeerOnline) {
      return triggerToast('传输失败：目标用户不在线，无法建立 P2P 连接。', 'error')
    }

    triggerToast('正在建立 P2P 加密连接通道...', 'info')
    const pc = createPeerConnection(currentRoom.id)
    const channel = pc.createDataChannel('cyber-p2p-file')
    dataChannelRef.current = channel

    channel.onopen = async () => {
      setUploadProgress(0)
      channel.send(JSON.stringify({ name: file.name, size: file.size }))

      const chunkSize = 16384
      let offset = 0
      const reader = new FileReader()

      const readSlice = (n) => {
        const slice = file.slice(offset, n + chunkSize)
        reader.readAsArrayBuffer(slice)
      }

      reader.onload = (e) => {
        const buffer = e.target.result
        channel.send(buffer) 
        offset += buffer.byteLength
        
        const percent = Math.min(100, Math.round((offset / file.size) * 100))
        setUploadProgress(percent)

        if (offset < file.size) {
          if (channel.bufferedAmount > 8 * 1024 * 1024) {
            setTimeout(() => readSlice(offset), 10.5)
          } else {
            readSlice(offset)
          }
        } else {
          setUploadProgress(null)
          sendP2PMsgNotification(file.name, file.size)
        }
      }
      readSlice(0)
    }

    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)

    signalingChannelRef.current.send({
      type: 'broadcast',
      event: 'file-offer',
      payload: { offer, senderId: myProfile.id }
    })
  }

  const sendP2PMsgNotification = async (fileName, fileSize) => {
    const payload = { type: 'p2p-file', name: fileName, size: fileSize, sender: myProfile.display_name }
    const encryptedText = await encryptMessage(JSON.stringify(payload), currentRoom.id)
    await supabase.from('messages').insert([{ room_id: currentRoom.id, sender_id: myProfile.id, content: encryptedText }])
  }

  // 长连接与 Presence 状态同步管理
  useEffect(() => {
    if (!currentRoom || networkError || !myProfile) return
    setMessages([])
    setIncomingFile(null)

    supabase.from('messages').select('*, profiles(username, display_name, avatar_url)').eq('room_id', currentRoom.id).order('created_at', { ascending: true }).then(async ({ data }) => {
      if (data) {
        const decrypted = await Promise.all(data.map(async msg => ({ ...msg, content: await decryptMessage(msg.content, currentRoom.id) })))
        setMessages(decrypted)
      }
    })

    const presenceChannel = supabase.channel(`presence-${currentRoom.id}`)
    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState()
        const hasPeer = Object.values(state).flat().some(user => user.user_id !== myProfile?.id)
        setIsPeerOnline(hasPeer)
        if (hasPeer) flushOfflineQueue(currentRoom.id)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') await presenceChannel.track({ user_id: myProfile?.id, online_at: new Date().toISOString() })
      })

    const signalingChannel = supabase.channel(`sig-${currentRoom.id}`)
    signalingChannelRef.current = signalingChannel

    signalingChannel
      .on('broadcast', { event: 'file-offer' }, async ({ payload }) => {
        if (payload.senderId === myProfile.id) return 
        const pc = createPeerConnection(currentRoom.id)
        await pc.setRemoteDescription(new RTCSessionDescription(payload.offer))
        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)

        signalingChannel.send({
          type: 'broadcast',
          event: 'file-answer',
          payload: { answer, recipientId: payload.senderId }
        })
      })
      .on('broadcast', { event: 'file-answer' }, async ({ payload }) => {
        if (pcRef.current) {
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(payload.answer))
        }
      })
      .on('broadcast', { event: 'ice-candidate' }, async ({ payload }) => {
        if (pcRef.current && payload.candidate) {
          try { await pcRef.current.addIceCandidate(new RTCIceCandidate(payload.candidate)) } catch (e) {}
        }
      })
      .subscribe()

    // 💡 实时长连接更新：捕获 INSERT 以及新增的 DELETE 广播事件从而保持多端秒级同步
    const msgChannel = supabase.channel(`room-${currentRoom.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${currentRoom.id}` }, async (payload) => {
        const { data } = await supabase.from('profiles').select('username, display_name, avatar_url').eq('id', payload.new.sender_id).single()
        const clearText = await decryptMessage(payload.new.content, currentRoom.id)
        setMessages((prev) => [...prev.filter(m => !m.is_pending), { ...payload.new, content: clearText, profiles: data }])
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages', filter: `room_id=eq.${currentRoom.id}` }, (payload) => {
        // 当数据库记录被删除时（即有人发起了撤回），本地消息队列同步过滤隐藏该节点
        setMessages((prev) => prev.filter(m => m.id !== payload.old.id))
      })
      .subscribe()

    return () => {
      supabase.removeChannel(msgChannel)
      supabase.removeChannel(presenceChannel)
      supabase.removeChannel(signalingChannel)
      if (pcRef.current) pcRef.current.close()
    }
  }, [currentRoom, networkError, myProfile])

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  // 全局搜索触发器：联合检索 profiles 和 rooms 表
  useEffect(() => {
    if (!searchQuery.trim() || networkError || !myProfile) { setGlobalUsers([]); setGlobalRooms([]); return }
    const delayDebounce = setTimeout(async () => {
      const query = searchQuery.trim().toLowerCase()
      // 检索全局用户
      const { data: uData } = await supabase.from('profiles').select('*').or(`username.ilike.%${query}%,display_name.ilike.%${query}%`).neq('id', myProfile.id).limit(3)
      setGlobalUsers(uData || [])
      // 检索全局公开群组
      const { data: rData } = await supabase.from('rooms').select('*').eq('is_group', true).ilike('name', `%${query}%`).limit(3)
      setGlobalRooms(rData || [])
    }, 300)
    return () => clearTimeout(delayDebounce)
  }, [searchQuery, myProfile, networkError])

  // 物理视窗鼠标位置轨迹捕捉逻辑
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) {
        let nl = windowStart.current.left + (e.clientX - dragStart.current.x), nt = windowStart.current.top + (e.clientY - dragStart.current.y)
        nl = Math.max(0, Math.min(nl, window.innerWidth - dimensions.width)); nt = Math.max(0, Math.min(nt, window.innerHeight - dimensions.height - 48))
        setDimensions(prev => ({ ...prev, left: nl, top: nt }))
      } else if (resizeType) {
        let nw = resizeStart.current.width + (e.clientX - resizeStart.current.x), nh = resizeStart.current.height + (e.clientY - resizeStart.current.y)
        nw = Math.max(640, Math.min(nw, window.innerWidth - dimensions.left)); nh = Math.max(440, Math.min(nh, window.innerHeight - 48 - dimensions.top))
        setDimensions(prev => ({ ...prev, width: nw, height: nh }))
      } else if (isSettingsDragging) {
        let nl = settingsWindowStart.current.left + (e.clientX - settingsDragStart.current.x), nt = settingsWindowStart.current.top + (e.clientY - settingsDragStart.current.y)
        nl = Math.max(0, Math.min(nl, window.innerWidth - settingsDimensions.width)); nt = Math.max(0, Math.min(nt, window.innerHeight - settingsDimensions.height - 48))
        setSettingsDimensions(prev => ({ ...prev, left: nl, top: nt }))
      } else if (settingsResizeType) {
        let nw = settingsResizeStart.current.width + (e.clientX - settingsResizeStart.current.x), nh = settingsResizeStart.current.height + (e.clientY - settingsResizeStart.current.y)
        nw = Math.max(380, Math.min(nw, window.innerWidth - settingsDimensions.left)); nh = Math.max(320, Math.min(nh, window.innerHeight - 48 - settingsDimensions.top))
        setSettingsDimensions(prev => ({ ...prev, width: nw, height: nh }))
      }
    }
    const handleMouseUp = () => { setIsDragging(false); setResizeType(null); setIsSettingsDragging(false); setSettingsResizeType(null) }
    if (isDragging || resizeType || isSettingsDragging || settingsResizeType) {
      window.addEventListener('mousemove', handleMouseMove); window.addEventListener('mouseup', handleMouseUp)
    }
    return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp) }
  }, [isDragging, resizeType, dimensions, isSettingsDragging, settingsResizeType, settingsDimensions])

  const handleTitleMouseDown = (e) => {
    if (windowState === 'maximized' || e.target.tagName === 'BUTTON') return
    setIsDragging(true)
    dragStart.current = { x: e.clientX, y: e.clientY } 
    windowStart.current = { left: dimensions.left, top: dimensions.top }
  }

  const handleResizeMouseDown = (type, e) => {
    e.preventDefault(); e.stopPropagation()
    if (windowState === 'maximized') return
    setResizeType(type)
    resizeStart.current = { width: dimensions.width, height: dimensions.height, x: e.clientX, y: e.clientY }
  }

  const handleSettingsTitleMouseDown = (e) => {
    if (e.target.tagName === 'BUTTON') return
    setIsSettingsDragging(true)
    settingsDragStart.current = { x: e.clientX, y: e.clientY }
    settingsWindowStart.current = { left: settingsDimensions.left, top: settingsDimensions.top }
  }

  const handleSettingsResizeMouseDown = (type, e) => {
    e.preventDefault(); e.stopPropagation()
    setSettingsResizeType(type)
    settingsResizeStart.current = { width: settingsDimensions.width, height: settingsDimensions.height, x: e.clientX, y: e.clientY }
  }

  const submitCreateGroup = async (e) => {
    e.preventDefault()
    if (!newGroupName.trim()) return triggerToast('请输入群聊名称。', 'error')
    const name = newGroupName.trim(); setIsCreatingGroup(false); setNewGroupName('')
    const { data: room, error } = await supabase.from('rooms').insert([{ name: name, is_group: true }]).select().single()
    if (error) return triggerToast('创建群组失败: ' + error.message, 'error')
    
    // 创建群组后，自动将自己绑定为第一个成员
    if (room) { 
      await supabase.from('room_members').insert([{ room_id: room.id, user_id: myProfile.id }])
      fetchRooms() 
      triggerToast(`群组 [${name}] 创建成功。`, 'success') 
    }
  }

  // 修正成员邀请逻辑，精准捕获并提示数据库层抛出的真实错误
  const submitInviteMember = async (e) => {
    e.preventDefault()
    if (!inviteUsername.trim()) return triggerToast('请输入用户名。', 'error')
    const targetName = inviteUsername.trim().toLowerCase(); setIsInviting(false); setInviteUsername('')
    
    // 1. 检索是否存在该目标用户
    const { data: targetProfile, error } = await supabase.from('profiles').select('id, username, display_name').eq('username', targetName).maybeSingle()
    if (error || !targetProfile) return triggerToast('未找到该用户，请检查用户名是否正确。', 'error')
    
    // 2. 检查该用户是否已经在群里，防止重复添加
    const { data: alreadyMember } = await supabase.from('room_members').select('id').eq('room_id', currentRoom.id).eq('user_id', targetProfile.id).maybeSingle()
    if (alreadyMember) return triggerToast('该用户已是当前群聊成员。', 'info')

    // 3. 执行添加逻辑并捕获异常
    const { error: insertErr } = await supabase.from('room_members').insert([{ room_id: currentRoom.id, user_id: targetProfile.id }])
    if (insertErr) {
      console.error("添加成员失败日志:", insertErr)
      triggerToast(`添加失败: ${insertErr.message}`, 'error')
    } else { 
      triggerToast(`成功邀请成员 ${targetProfile.display_name} 加入群聊。`, 'success')
      fetchRooms() 
    }
  }

  // =======================================================
  // 📍 【 A 】: 全量消息撤回处理器芯片安放成功
  // =======================================================
  const recallMessage = async (messageId) => {
    if (!messageId) return

    try {
      // 1. 乐观更新：本地消息队列先瞬间抹掉，达成完美的 0 延迟秒撤视感
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId))

      // 2. 实体销毁：彻底在 Supabase 数据库中清除该行记录
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId)

      if (error) throw error
    } catch (err) {
      console.error('撤回逻辑执行报错，正尝试容错同步：', err.message)
    }
  }

  // 消息发送处理器
  const sendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !currentRoom) return
    const rawText = newMessage; setNewMessage('')
    const encryptedText = await encryptMessage(rawText, currentRoom.id)
    const timestamp = new Date().toISOString()

    if (isPeerOnline) {
      await supabase.from('messages').insert([{ room_id: currentRoom.id, sender_id: myProfile.id, content: encryptedText }])
    } else {
      const queueKey = `offline_queue_${currentRoom.id}`
      const currentQueue = JSON.parse(localStorage.getItem(queueKey) || '[]')
      localStorage.setItem(queueKey, JSON.stringify([...currentQueue, { encryptedContent: encryptedText, timestamp }]))
      triggerToast('提示：目标用户已离线，加密消息已暂存至本地缓存。', 'info')
      setMessages(prev => [...prev, { id: Math.random(), room_id: currentRoom.id, sender_id: myProfile.id, content: rawText, created_at: timestamp, is_pending: true, profiles: myProfile }])
    }
  }

  const startPrivateChat = async (tu) => {
    setSearchQuery('')
    const { data: mm } = await supabase.from('room_members').select('room_id').eq('user_id', myProfile.id)
    const ids = mm?.map(m => m.room_id) || []
    if (ids.length > 0) {
      const { data: ec } = await supabase.from('room_members').select('room_id, rooms!inner(id, name, is_group)').in('room_id', ids).eq('user_id', tu.id).eq('rooms.is_group', false).maybeSingle()
      if (ec?.rooms) { const fr = await fetchRooms(); setCurrentRoom(fr.find(r => r.id === ec.room_id) || ec.rooms); return }
    }
    const { data: nr } = await supabase.from('rooms').insert([{ name: tu.username || 'Private Chat', is_group: false }]).select().single()
    if (nr) {
      await supabase.from('room_members').insert([{ room_id: nr.id, user_id: myProfile.id }, { room_id: nr.id, user_id: tu.id }])
      await fetchRooms()
      const { data: pr } = await supabase.from('rooms').select('*, room_members(user_id, profiles(username, display_name, avatar_url, bio))').eq('id', nr.id).single()
      if (pr) setCurrentRoom(pr)
    }
  }

  const joinGroupRoom = async (tr) => {
    setSearchQuery('')
    const { data: im } = await supabase.from('room_members').select('id').eq('room_id', tr.id).eq('user_id', myProfile.id).maybeSingle()
    if (!im) await supabase.from('room_members').insert([{ room_id: tr.id, user_id: myProfile.id }])
    await fetchRooms()
    const { data: pr } = await supabase.from('rooms').select('*, room_members(user_id, profiles(username, display_name, avatar_url, bio))').eq('id', tr.id).single()
    if (pr) setCurrentRoom(pr)
  }

  const resolveRoomMeta = (room) => {
    if (!room) return { name: '', avatar: null }
    if (room.is_group) return { name: room.name || '未命名群组', avatar: null }
    const m = room.room_members || []
    const om = m.find(item => item.user_id !== myProfile?.id)
    if (om?.profiles) {
      const sn = om.profiles.display_name || om.profiles.username || '未知用户'
      return { name: sn.startsWith('@') ? sn : `@${sn}`, avatar: om.profiles.avatar_url }
    }
    return { name: room.name && room.name !== 'Private Chat' ? `@${room.name}` : '🔒 加密私信会话', avatar: null }
  }

  const filteredRooms = rooms.filter(room => {
    if (!searchQuery.trim()) return true
    const meta = resolveRoomMeta(room)
    const roomName = meta?.name ? String(meta.name).toLowerCase() : ''
    return roomName.includes(searchQuery.toLowerCase())
  })

  const md3 = (themesPalette => themesPalette[currentTheme] || themesPalette.light)({
    light: { primary: '#0061a4', onPrimary: '#ffffff', primaryContainer: '#d1e4ff', onPrimaryContainer: '#001d36', surface: '#fdfcff', surfaceContainerLow: '#f2f3f7', surfaceContainer: '#ebebeb', surfaceContainerHigh: '#ffffff', onSurface: '#1a1c1e', onSurfaceVariant: '#43474e', outline: 'rgba(116, 117, 127, 0.25)' },
    dark: { primary: '#a1caf1', onPrimary: '#003259', primaryContainer: '#00497e', onPrimaryContainer: '#d1e4ff', surface: '#111318', surfaceContainerLow: '#1a1c23', surfaceContainer: '#2e3038', surfaceContainerHigh: '#22242a', onSurface: '#e2e2e9', onSurfaceVariant: '#c3c6cf', outline: 'rgba(255, 255, 255, 0.15)' },
    sunset: { primary: '#9c4146', onPrimary: '#ffffff', primaryContainer: '#ffdad9', onPrimaryContainer: '#410006', surface: '#fffbfa', surfaceContainerLow: '#fbeee3', surfaceContainer: '#f4ddcc', surfaceContainerHigh: '#ffffff', onSurface: '#221a1a', onSurfaceVariant: '#534343', outline: 'rgba(156, 65, 70, 0.2)' }
  })

  const getWindowStyle = () => {
    if (windowState === 'maximized') return { width: '100vw', height: 'calc(100vh - 48px)', position: 'absolute', top: taskbarPosition === 'top' ? '48px' : 0, left: 0, backgroundColor: md3.surface, display: 'flex', flexDirection: 'column', zIndex: 10, transition: 'all 0.15s ease-out' }
    return { position: 'absolute', width: `${dimensions.width}px`, height: `${dimensions.height}px`, left: `${dimensions.left}px`, top: `${dimensions.top}px`, borderRadius: '12px', backgroundColor: md3.surface, boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)', border: '1px solid rgba(255, 255, 255, 0.35)', overflow: 'hidden', display: 'flex', flexDirection: 'column', zIndex: 10, transition: (isDragging || resizeType) ? 'none' : 'all 0.2s cubic-bezier(0.1, 0.9, 0.2, 1)' }
  }

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'sans-serif', backgroundImage: `url(${wallpaper})`, backgroundSize: 'cover', color: '#fff' }}>系统初始化中，请稍候...</div>

  return (
    <div style={{ width: '100vw', height: '100vh', backgroundImage: `url(${wallpaper})`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative', overflow: 'hidden', userSelect: 'none', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      
      {windowState === 'closed' && (
        <div onClick={() => setWindowState('normal')} style={{ position: 'absolute', top: '30px', left: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '12px', borderRadius: '8px', cursor: 'pointer', backgroundColor: hoverBtn === 'shortcut' ? 'rgba(255,255,255,0.2)' : 'transparent', border: hoverBtn === 'shortcut' ? '1px solid rgba(255,255,255,0.3)' : '1px solid transparent', width: '84px', transition: 'background 0.2s' }} onMouseEnter={() => setHoverBtn('shortcut')} onMouseLeave={() => setHoverBtn(null)}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: md3.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>💬</div>
          <span style={{ color: '#fff', fontSize: '12px', fontWeight: '500', textShadow: '0 1px 3px rgba(0,0,0,0.8)', textAlign: 'center' }}>Chatting Hub Pro</span>
        </div>
      )}

      {windowState !== 'closed' && windowState !== 'minimized' && (
        <div style={getWindowStyle()}>
          <TitleBar windowState={windowState} setWindowState={setWindowState} onMouseDown={handleTitleMouseDown} onDoubleClick={() => setWindowState(prev => prev === 'maximized' ? 'normal' : 'maximized')} />
          <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
            <Toast toast={toast} md3={md3} />
            
            {networkError ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '40px', backgroundColor: md3.surfaceContainerLow, color: md3.onSurface, textAlign: 'center' }}>
                <div style={{ fontSize: '54px' }}>Error</div>
                <h3 style={{ margin: 0, fontWeight: '700', fontSize: '18px', color: '#dc2626' }}>网络连接中断</h3>
                <p style={{ margin: 0, fontSize: '13px', maxWidth: '500px', opacity: 0.8 }}>{networkError}</p>
                <button onClick={checkSessionAndInit} style={{ padding: '10px 24px', background: md3.primary, color: '#fff', border: 'none', borderRadius: '100px', fontWeight: '600', cursor: 'pointer' }}>重新初始化连接</button>
              </div>
            ) : (
              <>
                <Sidebar 
                  myProfile={myProfile} filteredRooms={filteredRooms} currentRoom={currentRoom} 
                  setCurrentRoom={setCurrentRoom} resolveRoomMeta={resolveRoomMeta} handleLogout={handleLogout} 
                  searchQuery={searchQuery} setSearchQuery={setSearchQuery} globalUsers={globalUsers} 
                  globalRooms={globalRooms} startPrivateChat={startPrivateChat} joinGroupRoom={joinGroupRoom} 
                  submitCreateGroup={submitCreateGroup} isCreatingGroup={isCreatingGroup} 
                  setIsCreatingGroup={setIsCreatingGroup} newGroupName={newGroupName} 
                  setNewGroupName={setNewGroupName} triggerToast={triggerToast} md3={md3} 
                  setIsSettingsOpen={setIsSettingsOpen} 
                />
                
                {/* =======================================================
                    📍 【 B 】: 纽带完美系上，成功将撤回事件传递给子气泡组件
                    ======================================================= */}
                <ChatArea 
                  currentRoom={currentRoom} myProfile={myProfile} messages={messages} resolveRoomMeta={resolveRoomMeta} messagesEndRef={messagesEndRef} newMessage={newMessage} setNewMessage={setNewMessage} sendMessage={sendMessage} isInviting={isInviting} setIsInviting={setIsInviting} inviteUsername={inviteUsername} setInviteUsername={setInviteUsername} submitInviteMember={submitInviteMember} md3={md3} 
                  uploadProgress={uploadProgress} downloadProgress={downloadProgress} incomingFile={incomingFile} setIncomingFile={setIncomingFile} handleSendFile={handleSendFile} isPeerOnline={isPeerOnline}
                  
                  recallMessage={recallMessage} 
                />
              </>
            )}

            <SettingsWindow isOpen={isSettingsOpen} setIsOpen={setIsSettingsOpen} wallpaper={wallpaper} setWallpaper={setWallpaper} currentTheme={currentTheme} setCurrentTheme={setCurrentTheme} taskbarPosition={taskbarPosition} setTaskbarPosition={setTaskbarPosition} myProfile={myProfile} setMyProfile={setMyProfile} triggerToast={triggerToast} md3={md3} settingsDimensions={settingsDimensions} isSettingsDragging={isSettingsDragging} settingsResizeType={settingsResizeType} onTitleMouseDown={handleSettingsTitleMouseDown} onResizeMouseDown={handleSettingsResizeMouseDown} />
          </div>

          {windowState !== 'maximized' && (
            <>
              <div onMouseDown={(e) => handleResizeMouseDown('right', e)} style={{ position: 'absolute', right: 0, top: 0, width: '6px', height: '100%', cursor: 'e-resize', zIndex: 100 }} />
              <div onMouseDown={(e) => handleResizeMouseDown('bottom', e)} style={{ position: 'absolute', left: 0, bottom: 0, width: '100%', height: '6px', cursor: 's-resize', zIndex: 100 }} />
              <div onMouseDown={(e) => handleResizeMouseDown('bottom-right', e)} style={{ position: 'absolute', right: 0, bottom: 0, width: '12px', height: '12px', cursor: 'se-resize', zIndex: 101 }} />
            </>
          )}
        </div>
      )}

      <Taskbar windowState={windowState} setWindowState={setWindowState} taskbarPosition={taskbarPosition} taskbarContent={taskbarContent} md3={md3} />
    </div>
  )
}