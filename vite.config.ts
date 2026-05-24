import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    port: 8090,
    watch: {
      // 使用轮询模式，彻底绕过 fs.watch / inotify，解决 EMFILE 问题
      usePolling: true,
      interval: 500,
      ignored: ['**/node_modules/**'],
    },
    proxy: {
      // 添加跨域代理配置
      '/pconline-api': {
        target: 'https://whois.pconline.com.cn', // 目标真实域名
        changeOrigin: true, // 必须开启，欺骗服务器这是同源请求
        rewrite: (path) => path.replace(/^\/pconline-api/, '') // 发送真实请求前，抹掉这个自定义前缀
      }
    }
  }
})