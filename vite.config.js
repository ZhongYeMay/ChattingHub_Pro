import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/ChattingHub_Pro/', // 保持生产环境 GitHub Pages 的子路径基准
  plugins: [
    react(),
    {
      name: 'profile-html-rewrite',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const url = req.url.split('?')[0] // 剥离可能存在的 URL 参数
          
          // 1. 只有当请求路径正确包含基准前缀，且以 .html 结尾时才进入拦截视窗
          if (url.startsWith('/ChattingHub_Pro/') && url.endsWith('.html')) {
            
            // 2. 提取出剥离了基准前缀后的相对 HTML 文件路径进行安全比对
            const relativeUrl = url.replace('/ChattingHub_Pro', '')
            
            // 3. 如果不是系统核心内置的静态网页，则判定为虚拟用户名路径
            if (!['/index.html', '/chat.html', '/profile.html', '/'].includes(relativeUrl)) {
              
              // 核心修复：重写后的目标路径必须重新焊上 '/ChattingHub_Pro' 前缀，彻底消除 Vite 基准路径校验冲突
              req.url = '/ChattingHub_Pro/profile.html' + req.url.slice(url.length)
            }
          }
          next()
        })
      }
    }
  ]
})