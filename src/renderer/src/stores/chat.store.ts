import { create } from 'zustand'
import { nanoid } from 'nanoid'
import type { Conversation, Message, Attachment } from '../types'
import { conversationsApi, messagesApi, attachmentsApi } from '../services/api.service'
import { wsService } from '../services/ws.service'
import { useAuthStore } from './auth.store'

interface ChatState {
  conversations: Conversation[]
  activeId: string | null
  messages: Record<string, Message[]>   // keyed by conversationId
  loadingConvos: boolean
  loadingMsgs: boolean

  loadConversations: () => Promise<void>
  selectConversation: (id: string) => Promise<void>
  sendText: (body: string) => Promise<void>
  sendImage: (file: File, caption?: string) => Promise<void>
  deleteMessage: (conversationId: string, messageId: string) => Promise<void>
  markRead: (conversationId: string, seq: string | number) => void
  readCursors: Record<string, string>  // conversationId -> seq terakhir yg dibaca LAWAN bicara
  _onReceipt: (p: { userId: string; seq: string; conversationId: string }) => void
  _onNewMessage: (m: Message) => void
  _onAck: (p: { clientMsgId: string; id: string; seq: string; conversationId: string }) => void
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeId: null,
  messages: {},
  loadingConvos: false,
  loadingMsgs: false,
  readCursors: {},

  loadConversations: async () => {
    set({ loadingConvos: true })
    try {
      const { data } = await conversationsApi.list()
      // Respons: { conversations: [...] }
      const list: Conversation[] = data.conversations ?? data ?? []
      set({ conversations: list, loadingConvos: false })
    } catch (e) {
      console.error('[chat] loadConversations gagal', e)
      set({ loadingConvos: false })
    }
  },

  selectConversation: async (id) => {
    set({ activeId: id, loadingMsgs: true })
    try {
      const { data } = await messagesApi.list(id)
      // Bentuk respons /messages belum 100% diverifikasi — coba beberapa
      const msgs: Message[] = data.messages ?? data.data ?? data ?? []
      set((s) => ({ messages: { ...s.messages, [id]: msgs }, loadingMsgs: false }))
    } catch (e) {
      console.error('[chat] load messages gagal', e)
      set({ loadingMsgs: false })
    }
  },

  sendText: async (body) => {
    const convId = get().activeId
    if (!convId || !body.trim()) return
    const me = useAuthStore.getState().user
    const clientMsgId = nanoid()

    // Optimistic: tampil dulu sebelum server balas
    const optimistic: Message = {
      id: clientMsgId,
      conversationId: convId,
      senderId: me?.id ?? '',
      sender: me ?? undefined,
      type: 'TEXT',
      body,
      clientMsgId,
      createdAt: new Date().toISOString()
    }
    set((s) => ({
      messages: { ...s.messages, [convId]: [...(s.messages[convId] ?? []), optimistic] }
    }))

    try {
      await messagesApi.send(convId, body, clientMsgId)
      // ack via WS akan replace id+seq (lihat _onAck)
    } catch (e) {
      console.error('[chat] sendText gagal', e)
    }
  },

  sendImage: async (file, caption) => {
    const convId = get().activeId
    if (!convId) return
    const me = useAuthStore.getState().user
    const clientMsgId = nanoid()

    // Optimistic: tampilkan placeholder lokal (blob URL) sebelum upload selesai —
    // mirip pola Telegram: gambar langsung kelihatan, status "mengirim" implisit.
    const localUrl = URL.createObjectURL(file)
    const optimistic: Message = {
      id: clientMsgId,
      conversationId: convId,
      senderId: me?.id ?? '',
      sender: me ?? undefined,
      type: 'IMAGE',
      body: caption ?? '',
      clientMsgId,
      createdAt: new Date().toISOString(),
      attachments: [{
        id: clientMsgId,
        messageId: clientMsgId,
        storageKey: '',
        fileName: file.name,
        mimeType: file.type,
        size: file.size,
        createdAt: new Date().toISOString(),
        // field tambahan non-standar untuk preview lokal, dibaca komponen AttachmentImage
        // sebelum attachment asli (dgn id server) tersedia
        _localUrl: localUrl
      } as Attachment & { _localUrl?: string }]
    }
    set((s) => ({
      messages: { ...s.messages, [convId]: [...(s.messages[convId] ?? []), optimistic] }
    }))

    try {
      const uploaded = await attachmentsApi.upload(convId, file)
      await messagesApi.send(convId, caption ?? '', clientMsgId, {
        type: 'IMAGE',
        attachments: [uploaded]
      })
      // Pesan asli akan masuk via WS new_message/ack; revoke blob lokal setelah delay
      // singkat agar tidak revoke sebelum re-render sempat pindah ke URL asli.
      setTimeout(() => URL.revokeObjectURL(localUrl), 5000)
    } catch (e) {
      console.error('[chat] sendImage gagal', e)
    }
  },

  markRead: (conversationId, seq) => {
    wsService.markRead(conversationId, seq)
  },

  _onReceipt: (p) => {
    set((s) => ({
      readCursors: { ...s.readCursors, [p.conversationId]: p.seq }
    }))
  },

  deleteMessage: async (conversationId, messageId) => {
    await messagesApi.delete(conversationId, messageId)
    set((s) => ({
      messages: {
        ...s.messages,
        [conversationId]: (s.messages[conversationId] ?? []).filter((m) => m.id !== messageId)
      }
    }))
  },

  _onNewMessage: (m) => {
    set((s) => {
      const existing = s.messages[m.conversationId] ?? []
      // Hindari duplikat: kalau clientMsgId sudah ada (pesan sendiri), skip
      if (m.clientMsgId && existing.some((x) => x.clientMsgId === m.clientMsgId)) return s
      if (existing.some((x) => x.id === m.id)) return s
      return { messages: { ...s.messages, [m.conversationId]: [...existing, m] } }
    })
  },

  _onAck: (p) => {
    let wasImage = false
    set((s) => {
      const list = s.messages[p.conversationId] ?? []
      const updated = list.map((m) => {
        if (m.clientMsgId !== p.clientMsgId) return m
        // Pesan dgn attachment optimistic (id UUID lokal, BUKAN cuid server)
        // butuh re-fetch agar attachment.id jadi valid utk endpoint R3.
        if (m.attachments && m.attachments.length > 0) wasImage = true
        return { ...m, id: p.id, seq: p.seq }
      })
      return { messages: { ...s.messages, [p.conversationId]: updated } }
    })

    // Pesan teks biasa: cukup id+seq di atas, tidak perlu re-fetch (murah, cepat).
    // Pesan ber-attachment: id+seq pesan sudah benar, TAPI attachments[] masih
    // bawa entri optimistic (id UUID lokal + _localUrl blob yang akan invalid
    // setelah reload). Re-fetch list sekali untuk dapat attachments[] asli
    // dari server (id cuid() valid utk endpoint R3 /attachments/file/:id).
    if (wasImage) {
      messagesApi.list(p.conversationId).then(({ data }) => {
        const fresh: Message[] = data.messages ?? data.data ?? data ?? []
        set((s) => {
          const current = s.messages[p.conversationId] ?? []
          const merged = current.map((m) => {
            if (m.id !== p.id) return m
            const serverVersion = fresh.find((f) => f.id === p.id)
            return serverVersion ?? m
          })
          return { messages: { ...s.messages, [p.conversationId]: merged } }
        })
      }).catch((e) => console.error('[chat] re-fetch setelah ack gambar gagal', e))
    }
  }
}))

// Wire WS events sekali (modul-level)
wsService.on('new_message', (p) => useChatStore.getState()._onNewMessage(p as Message))
wsService.on('message_ack', (p) =>
  useChatStore.getState()._onAck(p as { clientMsgId: string; id: string; seq: string; conversationId: string })
)
wsService.on('receipt', (p) =>
  useChatStore.getState()._onReceipt(p as { userId: string; seq: string; conversationId: string })
)
