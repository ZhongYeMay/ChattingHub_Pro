import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  return {
    // 💡 核心魔法：仅在生产打包 (build) 时启用 GitHub Pages 的前缀；本地开发 (serve) 保持根目录 '/'
    // 这样在本地运行 npm run dev 时，就能直接正常访问 http://localhost:5173/，绝对不会再弹出烦人的警告拦截！
    base: command === 'build' ? '/ChattingHub_Pro/' : '/',
    
    plugins: [
      react(),
      // 开发环境本地调试拦截插件
      {
        name: 'profile-html-rewrite',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            const url = req.url.split('?')[0]
            if (url.endsWith('.html') && !['/index.html', '/chat.html', '/profile.html', '/'].includes(url)) {
              req.url = '/profile.html' + req.url.slice(url.length)
            }
            next()
          })
        }
      }
    ],
    build: {
      rollupOptions: {
        input: {
          main: 'index.html',
          chat: 'chat.html',
          profile: 'profile.html'
        }
      }
    }
  }
})