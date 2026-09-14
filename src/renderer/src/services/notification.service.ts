import { wsService } from './ws.service'
import { useAuthStore } from '../stores/auth.store'
import { useChatStore } from '../stores/chat.store'
import { NOTIF_ENABLED_KEY, NOTIF_SOUND_KEY } from '../config/constants'
import type { Message } from '../types'

// Dedup: server (terbukti dari guard chat.store.ts) bisa kirim ulang new_message yang sama.
// Set dibatasi ukurannya supaya tidak bocor memori di sesi yang lama berjalan.
const seenMessageIds = new Set<string>()
const MAX_SEEN = 500

function markSeen(id: string): boolean {
  if (seenMessageIds.has(id)) return true
  seenMessageIds.add(id)
  if (seenMessageIds.size > MAX_SEEN) {
    const first = seenMessageIds.values().next().value
    if (first) seenMessageIds.delete(first)
  }
  return false
}

export function isEnabled(key: string): boolean {
  const v = localStorage.getItem(key)
  return v === null ? true : v === 'true' // default ON kalau belum pernah di-set
}

function bodyTextFor(m: Message): string {
  if (m.type === 'TEXT') return m.body ?? ''
  if (m.type === 'IMAGE') return 'Sent a photo'
  if (m.type === 'FILE') return 'Sent a file'
  if (m.type === 'AUDIO') return 'Sent a voice message'
  return m.body ?? 'New message'
}

function senderNameFor(m: Message): string {
  const conv = useChatStore.getState().conversations.find((c) => c.id === m.conversationId)
  const member = conv?.members.find((mm) => mm.userId === m.senderId)
  return member?.user.displayName ?? member?.user.username ?? m.sender?.displayName ?? 'Someone'
}

function shouldNotify(m: Message): boolean {
  const myId = useAuthStore.getState().user?.id
  if (!myId || m.senderId === myId) return false // pesan dari diri sendiri

  const activeId = useChatStore.getState().activeId
  const isViewingThisConvo = activeId === m.conversationId
  const windowFocused = document.hasFocus()
  if (isViewingThisConvo && windowFocused) return false // sedang dilihat, tak perlu toast

  return true
}

function showNotification(m: Message): void {
  if (!isEnabled(NOTIF_ENABLED_KEY)) return
  if (typeof Notification === 'undefined') return

  const conv = useChatStore.getState().conversations.find((c) => c.id === m.conversationId)
  const sender = senderNameFor(m)
  const title = conv && conv.type === 'GROUP' && conv.title ? `${sender} (${conv.title})` : sender

  const body = bodyTextFor(m)
  const silent = !isEnabled(NOTIF_SOUND_KEY)
  const openConvo = (): void => {
    window.api?.focusWindow?.()
    useChatStore.getState().selectConversation(m.conversationId)
  }

  // Desktop (Electron): lewat main process supaya toast bertahan sampai ditutup user.
  // Web Notification API tidak punya timeoutType -- toast selalu hilang sendiri.
  if (window.api?.showNotification) {
    window.api
      .showNotification({ title, body, silent })
      .then((result) => {
        if (result === 'clicked') openConvo()
      })
      .catch((err) => console.warn('[Notification] IPC gagal:', err))
    return
  }

  // Fallback: Android/Capacitor atau browser -- tidak ada main process.
  try {
    const n = new Notification(title, { body, silent })
    n.onclick = openConvo
  } catch (err) {
    console.warn('[Notification] Failed to show:', err)
  }
}

// Registrasi level-modul, meniru pola chat.store.ts (subscribe wsService.on di luar
// komponen React). Cukup di-import sekali (main.tsx) supaya listener terpasang.
wsService.on('new_message', (p) => {
  const m = p as Message
  if (markSeen(m.id)) return // duplikat, sudah pernah diproses
  if (!shouldNotify(m)) return
  showNotification(m)
})

// ── Colek (nudge) ─────────────────────────────────────────────────────────
// Sengaja TIDAK lewat markSeen/shouldNotify seperti new_message: colek selalu
// ditujukan langsung ke penerima oleh server (sendToUser, bukan siaran), jadi
// tidak ada duplikat untuk disaring dan tidak ada aturan "jangan ganggu kalau
// percakapannya sedang dibuka" -- justru itu intinya.
function bunyiColek(): void {
  try {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new AC()
    const now = ctx.currentTime
    const nada: [number, number][] = [
      [0, 880],
      [0.14, 660]
    ]
    for (const [mulai, freq] of nada) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.0001, now + mulai)
      gain.gain.exponentialRampToValueAtTime(0.25, now + mulai + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + mulai + 0.12)
      osc.connect(gain).connect(ctx.destination)
      osc.start(now + mulai)
      osc.stop(now + mulai + 0.13)
    }
    setTimeout(() => void ctx.close(), 600)
  } catch {
    // Bunyi gagal bukan alasan colek batal -- jendela tetap harus bergoyang.
  }
}

wsService.on('nudge', (p) => {
  const n = p as { fromName?: string }
  const nama = n.fromName || 'Seseorang'
  void window.api?.nudgeWindow?.()
  bunyiColek()
  // silent: true -- bunyinya sudah kita mainkan sendiri di atas.
  void window.api?.showNotification?.({ title: nama, body: 'nudged you', silent: true })
})
