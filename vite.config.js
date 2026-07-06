import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/ChattingHub_Pro/', // 1. 确保线上部署的静态资源路径完全正确
  plugins: [
    react(),
    // 自定义开发环境拦截插件
    {
      name: 'profile-html-rewrite',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const url = req.url.split('?')[0] // 剥离参数
          
          // 如果访问的是伪造的用户名.html，动态映射到本地的 profile.html
          if (url.endsWith('.html') && !['/index.html', '/chat.html', '/profile.html', '/'].includes(url)) {
            req.url = '/profile.html' + req.url.slice(url.length)
          }
          next()
        })
      }
    }
  ],
  build: {
    // 2. 🧱 核心修复芯片：显式声明多入口文件，强制打包器编译所有 HTML 页面
    rollupOptions: {
      input: {
        main: 'index.html',
        chat: 'chat.html',
        profile: 'profile.html'
      }
    }
  }
})