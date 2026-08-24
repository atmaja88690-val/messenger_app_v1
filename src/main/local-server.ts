import { createServer as createHttpServer, type IncomingMessage, type ServerResponse } from 'http'
import { createReadStream, existsSync, statSync } from 'fs'
import { join, extname } from 'path'
import httpProxy from 'http-proxy'

// Backend chat sesungguhnya -- sama seperti target proxy Vite dev server
// di electron.vite.config.ts, supaya perilaku prod meniru dev yang sudah terbukti jalan.
const BACKEND_ORIGIN = 'https://chat.bsilongevity.com:4443'
const BACKEND_WS_ORIGIN = 'wss://chat.bsilongevity.com:4443'
// Port TETAP (bukan acak): origin http://127.0.0.1:<port> harus stabil antar-restart
// supaya localStorage (token sesi) tidak hangus tiap app dibuka ulang -> tetap login.
const LOCAL_PORT = 39271

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.map': 'application/json; charset=utf-8'
}

// Server HTTP lokal (127.0.0.1 SAJA) yang menyajikan renderer statis DAN
// meneruskan /api + /ws ke backend asli. Tujuannya: window Electron loadURL
// ke http://127.0.0.1:<port> (origin normal), bukan file:// (origin null yang
// rawan ditolak CORS backend). Dari sudut pandang browser, /api dan /ws jadi
// SAME-ORIGIN -- CORS sama sekali tidak relevan lagi, persis seperti kondisi
// dev (Vite proxy) yang sudah terbukti berfungsi.
export function startLocalServer(rendererRoot: string): Promise<string> {
  const proxy = httpProxy.createProxyServer({
    changeOrigin: true,
    secure: true // cert backend valid (sudah dikonfirmasi via curl), tidak perlu abaikan validasi TLS
  })

  proxy.on('error', (err, _req, res) => {
    console.error('[local-server] proxy error:', err.message)
    if (res && 'writeHead' in res && !res.headersSent) {
      res.writeHead(502, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Bad Gateway', message: err.message }))
    } else if (res && 'destroy' in res) {
      // kasus WS upgrade -- res di sini sebenarnya socket, bukan HTTP response
      res.destroy()
    }
  })

  const server = createHttpServer((req: IncomingMessage, res: ServerResponse) => {
    const url = req.url ?? '/'

    if (url.startsWith('/api')) {
      proxy.web(req, res, { target: BACKEND_ORIGIN })
      return
    }

    // Static file serving + fallback SPA (TanStack Router client-side routing:
    // path seperti /settings harus tetap sajikan index.html, bukan 404).
    const urlPath = url.split('?')[0]
    let filePath = join(rendererRoot, decodeURIComponent(urlPath))
    if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
      filePath = join(rendererRoot, 'index.html')
    }
    const ext = extname(filePath)
    res.writeHead(200, { 'Content-Type': MIME[ext] ?? 'application/octet-stream' })
    createReadStream(filePath).pipe(res)
  })

  server.on('upgrade', (req, socket, head) => {
    const url = req.url ?? ''
    if (url.startsWith('/ws')) {
      proxy.ws(req, socket, head, { target: BACKEND_WS_ORIGIN })
    } else {
      socket.destroy()
    }
  })

  return new Promise((resolve, reject) => {
    const onListen = (): void => {
      const addr = server.address()
      if (addr === null || typeof addr === 'string') {
        reject(new Error('Local server: alamat tidak valid setelah listen()'))
        return
      }
      resolve(`http://127.0.0.1:${addr.port}`)
    }
    server.on('error', (err: NodeJS.ErrnoException) => {
      // Port TETAP sibuk (mis. instance lama belum lepas soket). Fallback ke port
      // acak supaya app tetap terbuka; single-instance lock di main membuat tabrakan
      // dengan diri sendiri praktis mustahil, jadi ini hanya jaring pengaman.
      if (err.code === 'EADDRINUSE') {
        console.warn('[local-server] LOCAL_PORT sibuk -> fallback port acak (sesi login bisa tak persist sekali ini)')
        server.listen(0, '127.0.0.1', onListen)
        return
      }
      reject(err)
    })
    // 127.0.0.1 SAJA + port TETAP (LOCAL_PORT): origin stabil antar-restart supaya
    // localStorage (token sesi) awet -> tetap login. JANGAN 0.0.0.0 (tak ter-ekspos LAN).
    server.listen(LOCAL_PORT, '127.0.0.1', onListen)
  })
}
