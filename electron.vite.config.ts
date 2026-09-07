import { resolve } from 'path'
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'fs'

// Versi diambil dari package.json SAAT BUILD. Sebelumnya APP_VERSION ditulis
// tangan di constants.ts, dan sekali terlupa akibatnya tidak kelihatan sampai
// terlambat: v1.3.4 sudah terpasang di laptop karyawan sementara dialog About
// menyebut 1.3.3, sehingga tidak ada cara memastikan versi mana yang beredar.
const pkg = JSON.parse(readFileSync(resolve('package.json'), 'utf8')) as { version: string }

export default defineConfig({
  main: {},
  preload: {},
  renderer: {
    resolve: {
      alias: { '@renderer': resolve('src/renderer/src') }
    },
    define: { __APP_VERSION__: JSON.stringify(pkg.version) },
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
