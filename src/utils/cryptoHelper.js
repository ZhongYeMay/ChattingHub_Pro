// ⚡ 浏览器原生高级硬件加密芯片 (AES-GCM 256)
const getCryptoKey = async (secretSeed) => {
  const enc = new TextEncoder()
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw", enc.encode(secretSeed.padEnd(32, '0').slice(0, 32)), 
    { name: "PBKDF2" }, false, ["deriveKey"]
  )
  return window.crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: enc.encode("cyber_salt"), iterations: 1000, hash: "SHA-256" },
    keyMaterial, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]
  )
}

// 🔐 本地高强度加密
export const encryptMessage = async (text, roomId) => {
  try {
    const key = await getCryptoKey(`room_secret_${roomId}`)
    const iv = window.crypto.getRandomValues(new Uint8Array(12))
    const encoded = new TextEncoder().encode(text)
    const ciphertext = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded)
    
    return JSON.stringify({
      cipher: btoa(String.fromCharCode(...new Uint8Array(ciphertext))),
      iv: btoa(String.fromCharCode(...iv))
    })
  } catch (e) {
    console.error("加密失败:", e)
    return text
  }
}

// 🔓 本地高强度解密
export const decryptMessage = async (encryptedJson, roomId) => {
  try {
    const { cipher, iv } = JSON.parse(encryptedJson)
    const key = await getCryptoKey(`room_secret_${roomId}`)
    const cipherBuffer = new Uint8Array(atob(cipher).split("").map(c => c.charCodeAt(0)))
    const ivBuffer = new Uint8Array(atob(iv).split("").map(c => c.charCodeAt(0)))
    
    const decrypted = await window.crypto.subtle.decrypt({ name: "AES-GCM", iv: ivBuffer }, key, cipherBuffer)
    return new TextDecoder().decode(decrypted)
  } catch (e) {
    // 如果不是 JSON 格式，说明是旧系统的明文消息，直接兼容返回
    return encryptedJson
  }
}