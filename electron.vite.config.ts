import { resolve } from 'path'
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {},
  preload: {},
  renderer: {
    resolve: {
      alias: { '@renderer': resolve('src/renderer/src') }
    },
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: 'https://chat.bsilongevity.com:4443',
          changeOrigin: true,
          secure: false,
          configure: (proxy) => {
            proxy.on('proxyReq', (_req, req) => {
              console.log('[proxy →]', req.method, req.url)
            })
            proxy.on('proxyRes', (proxyRes, req) => {
              console.log('[proxy ←]', proxyRes.statusCode, req.url)
            })
            proxy.on('error', (err, req) => {
              console.log('[proxy ✗]', req.url, err.message)
            })
          }
        },
        '/ws': {
          target: 'wss://chat.bsilongevity.com:4443',
          ws: true,
          changeOrigin: true,
          secure: false
        }
      }
    }
  }
})
