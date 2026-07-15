import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

// 1. 初始化 Supabase 实例凭证 (请将此处换为你 Supabase 的真实项目凭证)
const SUPABASE_URL = "https://your-project-id.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-key-here";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 2. DOM 缓存节点
const messageContainer = document.getElementById("message-container");
const msgInput = document.getElementById("msg-input");
const sendBtn = document.getElementById("send-btn");
const chatList = document.getElementById("chat-list");
const currentChatName = document.getElementById("current-chat-name");
const currentChatStatus = document.getElementById("current-chat-status");
const contextMenu = document.getElementById("custom-context-menu");
const menuActionRecall = document.getElementById("menu-action-recall");

// 3. 应用运行时全局状态
let currentUser = null;
let targetMessageIdPending = null; // 临时存储被右键点击的消息ID

// 4. 监听 Supabase 登录鉴权生命周期
supabase.auth.onAuthStateChange(async (event, session) => {
  if (session) {
    currentUser = session.user;
    
    // 从账户元数据（Metadata）中读取你的姓名 display_name
    const myName = currentUser.user_metadata?.display_name || "あきひろ";
    document.getElementById("my-username").innerText = myName;
    document.getElementById("my-avatar").innerText = myName.charAt(0).toUpperCase();

    // 启用输入模块
    msgInput.disabled = false;
    sendBtn.disabled = false;

    // 开始同步消息历史并打开 Realtime 通道
    await fetchInitialHistory();
    subscribeToRealtime();
    loadChannelsList();
  } else {
    console.log("未检测到登录会话。");
  }
});

// 5. 加载左侧 mock 会话
function loadChannelsList() {
  chatList.innerHTML = `
    <li class="chat-item active">
      <div class="chat-avatar">S</div>
      <div class="chat-details">
        <span class="chat-name">Sakura</span>
        <span class="chat-preview">实时同步通道已就绪</span>
      </div>
    </li>
  `;
  currentChatName.innerText = "Sakura";
  currentChatStatus.innerText = "在线";
}

// 6. 获取数据库中的初始历史消息
async function fetchInitialHistory() {
  const { data: messages, error } = await supabase
    .from("messages")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("历史记录获取失败：", error.message);
    return;
  }

  messageContainer.innerHTML = ""; // 清空加载骨架屏
  messages.forEach((msg) => {
    appendMessageToDOM(msg.id, msg);
  });
  scrollToBottom();
}

// 7. 核心：监听 Supabase 数据库级别的实时 Postgres 变更
function subscribeToRealtime() {
  supabase
    .channel("public:messages")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "messages" },
      (payload) => {
        const { eventType, new: newRecord, old: oldRecord } = payload;

        if (eventType === "INSERT") {
          appendMessageToDOM(newRecord.id, newRecord);
          scrollToBottom();
        } else if (eventType === "UPDATE") {
          // 关键漏洞修复：如果云端被更新（例如 is_recalled 为 true），瞬时同步给对应 DOM 元素
          updateMessageInDOM(newRecord.id, newRecord);
        }
      }
    )
    .subscribe();
}

// 8. 往轨道里渲染单条消息
function appendMessageToDOM(id, data) {
  if (document.querySelector(`[data-id="${id}"]`)) return; // 防重复

  const isMe = data.sender_id === currentUser.id;
  const msgDiv = document.createElement("div");
  msgDiv.className = `message ${isMe ? "message-sent" : "message-received"}`;
  msgDiv.setAttribute("data-id", id);
  msgDiv.setAttribute("data-sender-id", data.sender_id);

  if (data.is_recalled) {
    msgDiv.classList.add("recalled");
  }

  const initialAvatar = data.sender_name ? data.sender_name.charAt(0).toUpperCase() : "U";

  msgDiv.innerHTML = `
    <div class="msg-avatar">${initialAvatar}</div>
    <div class="msg-bubble">${data.is_recalled ? "重新组织语言中... 消息已撤回" : escapeHTML(data.text)}</div>
  `;

  // 精准判定：如果是自己发的消息，且之前没被撤回，绑定自定义右键菜单事件
  if (isMe && !data.is_recalled) {
    msgDiv.addEventListener("contextmenu", (e) => handleMessageContextMenu(e, id));
  }

  messageContainer.appendChild(msgDiv);
}

// 9. 更新 DOM 中的消息为“撤回”样式 (漏洞修复关键)
function updateMessageInDOM(id, data) {
  const msgDiv = document.querySelector(`[data-id="${id}"]`);
  if (!msgDiv) return;

  if (data.is_recalled) {
    msgDiv.classList.add("recalled");
    const bubble = msgDiv.querySelector(".msg-bubble");
    bubble.innerText = "重新组织语言中... 消息已撤回";

    // 安全撤防：撤回完成后，立即拔除该节点上的右键触发机制，防二次报错
    msgDiv.oncontextmenu = null;
  }
}

// 10. 执行消息发送流程
async function handleSendMessage() {
  const text = msgInput.value.trim();
  if (!text || !currentUser) return;

  msgInput.value = "";

  const myName = currentUser.user_metadata?.display_name || "あきひろ";

  // 向 Supabase 插入数据，触发实时消息广播
  const { error } = await supabase
    .from("messages")
    .insert([
      {
        text: text,
        sender_id: currentUser.id,
        sender_name: myName,
        is_recalled: false
      }
    ]);

  if (error) {
    console.error("消息发射失败：", error.message);
  }
}

sendBtn.addEventListener("click", handleSendMessage);
msgInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") handleSendMessage();
});

// ==========================================================================
// macOS 原生级右键交互系统
// ==========================================================================
function handleMessageContextMenu(e, messageId) {
  e.preventDefault(); // 屏蔽系统原始菜单

  targetMessageIdPending = messageId;

  // 定位 macOS 自定义操作框
  contextMenu.style.left = `${e.clientX}px`;
  contextMenu.style.top = `${e.clientY}px`;
  contextMenu.style.display = "block";
}

// 点击菜单上的“撤回消息”
menuActionRecall.addEventListener("click", async () => {
  if (!targetMessageIdPending || !currentUser) return;

  const targetId = targetMessageIdPending;
  hideMacContextMenu();

  // 更新数据库，利用 Row Level Security 安全策略鉴权
  const { error } = await supabase
    .from("messages")
    .update({ 
      is_recalled: true, 
      text: "此消息已被撤回" 
    })
    .eq("id", targetId);

  if (error) {
    console.error("更新（撤回）被 Supabase RLS 策略拒绝：", error.message);
  } else {
    console.log("Supabase 消息软删除撤回更新成功");
  }
});

function hideMacContextMenu() {
  contextMenu.style.display = "none";
  targetMessageIdPending = null;
}

// 自动滚动到底部函数
function scrollToBottom() {
  messageContainer.scrollTop = messageContainer.scrollHeight;
}

// 点击任意非菜单区域自动闭合 macOS 菜单
document.addEventListener("click", hideMacContextMenu);

// XSS 注入防护转义过滤工具
function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    (tag) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[tag] || tag)
  );
}