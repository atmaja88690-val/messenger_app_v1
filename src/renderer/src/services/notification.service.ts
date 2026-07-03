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

  try {
    const n = new Notification(title, {
      body: bodyTextFor(m),
      silent: !isEnabled(NOTIF_SOUND_KEY)
    })
    n.onclick = () => {
      window.api.focusWindow()
      useChatStore.getState().selectConversation(m.conversationId)
    }
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
