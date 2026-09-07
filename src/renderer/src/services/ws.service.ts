import { WS_URL, TOKEN_KEY } from '../config/constants'
import type { WsEvent, WsEventType } from '../types'
import { isRefreshInFlight } from './token-scheduler.service'

type WsHandler<T = unknown> = (payload: T) => void

const PING_INTERVAL_MS = 30_000
const PONG_TIMEOUT_MS = 70_000
const REFRESH_WAIT_MS = 1000 // saat token lagi di-refresh, cek lagi tiap 1s

class WsService {
  private ws: WebSocket | null = null
  private handlers = new Map<WsEventType, Set<WsHandler>>()
  private pingInterval: ReturnType<typeof setInterval> | null = null
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null
  private pongWatchdog: ReturnType<typeof setTimeout> | null = null
  private shouldReconnect = true
  private reconnectDelay = 1000
  private lastPongAt = 0
  private offlineQueue: Array<{ type: string; payload: unknown }> = []

  connect() {
    if (
      this.ws &&
      (this.ws.readyState === WebSocket.OPEN ||
        this.ws.readyState === WebSocket.CONNECTING)
    ) return

    // JANGAN konek pakai token yang mungkin expired saat refresh in-flight.
    // Tunda sampai refresh selesai → konek sekali dengan token segar.
    if (isRefreshInFlight()) {
      console.debug('[WS] Refresh in-flight, tunda connect...')
      this.scheduleReconnect(REFRESH_WAIT_MS)
      return
    }

    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) return

    this.shouldReconnect = true
    this.ws = new WebSocket(`${WS_URL}?token=${token}`)

    this.ws.onopen = () => {
      console.log('[WS] Connected')
      this.reconnectDelay = 1000 // reset backoff setelah sukses
      this.lastPongAt = Date.now()
      this.startPing()
      this.drainQueue()
    }

    this.ws.onmessage = (e) => {
      try {
        const event: WsEvent = JSON.parse(e.data)
        // Watchdog di-reset oleh pesan APA PUN, bukan hanya pong. Koneksi yang
        // sedang mengalirkan pesan jelas hidup; menutupnya paksa hanya karena
        // satu pong hilang justru menambah jeda reconnect -- dan selama soket
        // mati, TIDAK ADA notifikasi desktop sama sekali.
        this.lastPongAt = Date.now()
        this.resetPongWatchdog()
        const set = this.handlers.get(event.type as WsEventType)
        if (set) set.forEach((fn) => fn(event.payload))
      } catch {
        console.warn('[WS] Invalid message', e.data)
      }
    }

    this.ws.onerror = (e) => console.error('[WS] Error', e)

    this.ws.onclose = () => {
      console.log('[WS] Disconnected')
      this.stopPing()
      this.clearPongWatchdog()
      this.ws = null
      if (this.shouldReconnect) {
        // Kalau sedang refresh, tunggu sebentar (jangan naikkan backoff).
        // Kalau bukan, naikkan backoff normal.
        if (isRefreshInFlight()) {
          this.scheduleReconnect(REFRESH_WAIT_MS)
        } else {
          this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30_000)
          this.scheduleReconnect(this.reconnectDelay)
        }
      }
    }
  }

  private scheduleReconnect(delayMs: number) {
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout)
    // Jitter mencegah seluruh kantor menyambung ulang pada milidetik yang
    // sama setelah gangguan jaringan bersama -- itu membanjiri server tepat
    // ketika ia paling rapuh.
    const jitter = Math.round(delayMs * (0.8 + Math.random() * 0.4))
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null
      console.log(`[WS] Reconnecting...`)
      this.connect()
    }, jitter)
  }

  // Dipanggil token-scheduler setelah refresh sukses: konek sekali, token segar.
  reconnectNow() {
    this.reconnectDelay = 1000
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return // sudah konek/menyambung, biarkan
    }
    this.connect()
  }

  disconnect() {
    this.shouldReconnect = false
    this.stopPing()
    this.clearPongWatchdog()
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }
    this.ws?.close()
    this.ws = null
    this.offlineQueue = []
  }

  // Beri tahu server bahwa user sudah membaca sampai seq tertentu di conversation ini.
  // Server akan update lastReadSeq + broadcast 'receipt' ke member lain (kecuali diri sendiri).
  markRead(conversationId: string, seq: string | number) {
    this.send('mark_read', { conversationId, seq: String(seq) })
  }

  send(type: string, payload: unknown = {}) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }))
    } else {
      this.offlineQueue.push({ type, payload })
      console.debug(`[WS] Queued offline message: ${type} (queue=${this.offlineQueue.length})`)
    }
  }

  on<T = unknown>(event: WsEventType, handler: WsHandler<T>) {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set())
    this.handlers.get(event)!.add(handler as WsHandler)
  }

  off<T = unknown>(event: WsEventType, handler: WsHandler<T>) {
    this.handlers.get(event)?.delete(handler as WsHandler)
  }

  get isConnected() {
    return this.ws?.readyState === WebSocket.OPEN
  }

  private drainQueue() {
    const queued = this.offlineQueue.splice(0)
    if (queued.length > 0) {
      console.debug(`[WS] Draining ${queued.length} queued messages`)
      queued.forEach(({ type, payload }) => this.send(type, payload))
    }
  }

  private startPing() {
    this.stopPing()
    this.resetPongWatchdog()
    this.pingInterval = setInterval(() => {
      this.send('ping', {})
    }, PING_INTERVAL_MS)
  }

  private stopPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval)
      this.pingInterval = null
    }
  }

  private resetPongWatchdog() {
    this.clearPongWatchdog()
    this.pongWatchdog = setTimeout(() => {
      const silentMs = Date.now() - this.lastPongAt
      console.warn(`[WS] Pong timeout (silent ${silentMs}ms) — force reconnect`)
      this.ws?.close()
    }, PONG_TIMEOUT_MS)
  }

  private clearPongWatchdog() {
    if (this.pongWatchdog) {
      clearTimeout(this.pongWatchdog)
      this.pongWatchdog = null
    }
  }
}

export const wsService = new WsService()

// Menunggu backoff saat jaringan JELAS sudah kembali adalah menunggu tanpa
// alasan. Notifikasi desktop hanya lahir dari NEW_MESSAGE di soket ini, jadi
// setiap detik soket mati adalah detik tanpa notifikasi -- yang selama ini
// terasa sebagai "notif PC lambat", padahal servernya sudah mengirim.
if (typeof window !== 'undefined') {
  const bangun = (alasan: string): void => {
    if (wsService.isConnected) return
    console.debug(`[WS] Bangun (${alasan}) -- sambung ulang segera`)
    wsService.reconnectNow()
  }
  window.addEventListener('online', () => bangun('online'))
  window.addEventListener('focus', () => bangun('focus'))
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') bangun('visible')
  })
}

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    wsService.disconnect()
  })
}
