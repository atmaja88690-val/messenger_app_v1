import { create } from 'zustand'
import { nanoid } from 'nanoid'
import type { Conversation, Message, Attachment, UserStatus } from '../types'
import { conversationsApi, messagesApi, attachmentsApi } from '../services/api.service'
import { waitForServer } from '../services/server-breath.service'
import { wsService } from '../services/ws.service'
import { useAuthStore } from './auth.store'

interface ChatState {
  conversations: Conversation[]
  activeId: string | null
  messages: Record<string, Message[]>   // keyed by conversationId
  loadingConvos: boolean
  // null = tidak ada kegagalan. Dibedakan dari daftar kosong: gagal memuat
  // dan benar-benar belum punya percakapan tampak identik tanpa ini.
  convosError: string | null
  loadingMsgs: boolean

  loadConversations: () => Promise<void>
  selectConversation: (id: string) => Promise<void>
  sendText: (body: string, replyToId?: string) => Promise<void>
  sendImage: (file: File, caption?: string) => Promise<void>
  sendVoice: (blob: Blob, durationMs: number, peaks: number[]) => Promise<void>
  deleteMessage: (conversationId: string, messageId: string) => Promise<void>
  // myId dioper dari komponen, bukan diambil dari auth store, supaya store
  // percakapan tidak perlu bergantung pada store autentikasi.
  setConvSettings: (
    conversationId: string,
    patch: { favorite?: boolean; mutedUntil?: string | null }
  ) => Promise<void>
  editMessage: (conversationId: string, messageId: string, content: string) => Promise<void>
  toggleReaction: (conversationId: string, messageId: string, emoji: string, myId: string) => Promise<void>
  markRead: (conversationId: string, seq: string | number) => void
  readCursors: Record<string, string>  // conversationId -> seq terakhir yg dibaca LAWAN bicara
  _onReceipt: (p: { userId: string; seq: string; conversationId: string }) => void
  _onNewMessage: (m: Message) => void
  _onPresence: (p: { userId: string; status: UserStatus }) => void
  _onAck: (p: { clientMsgId: string; id: string; seq: string; conversationId: string }) => void
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeId: null,
  messages: {},
  loadingConvos: false,
  convosError: null,
  loadingMsgs: false,
  readCursors: {},

  // Kegagalan SEMENTARA tidak ditunggu dengan jeda tebakan -- klien bertanya
  // pada napas server kapan ia siap, lalu mencoba sekali lagi. Galat seperti
  // 403 atau 404 ditampilkan seketika: mengulangnya tidak mengubah apa pun.
  loadConversations: async () => {
    const TRANSIENT = [408, 429, 500, 502, 503, 504]
    const MAX = 3
    set({ loadingConvos: true, convosError: null })
    for (let attempt = 1; attempt <= MAX; attempt++) {
      try {
        const { data } = await conversationsApi.list()
        const list: Conversation[] = data.conversations ?? data ?? []
        set({ conversations: list, loadingConvos: false, convosError: null })
        return
      } catch (err) {
        const ax = err as { response?: { status?: number; data?: { error?: string } }; message?: string }
        const status = ax.response?.status
        // undefined = tidak ada respons sama sekali (offline/DNS/timeout).
        const transient = status === undefined || TRANSIENT.includes(status)
        if (!transient || attempt === MAX) {
          console.error('[chat] loadConversations gagal', err)
          set({
            loadingConvos: false,
            convosError: ax.response?.data?.error ?? ax.message ?? 'Unknown error'
          })
          return
        }
        console.warn(`[chat] muat percakapan gagal (${status ?? 'tanpa respons'}), menunggu napas server`)
        await waitForServer()
      }
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

  sendText: async (body, replyToId) => {
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
      replyToId: replyToId ?? null,
      createdAt: new Date().toISOString()
    }
    set((s) => ({
      messages: { ...s.messages, [convId]: [...(s.messages[convId] ?? []), optimistic] }
    }))

    try {
      const res = await messagesApi.send(
        convId,
        body,
        clientMsgId,
        replyToId ? { replyToId } : undefined
      )
      // Jawaban HTTP SUDAH memuat pesan lengkap berikut id dan seq dari server.
      // Sebelumnya id asli hanya ditunggu dari ack WebSocket, dan bila soket
      // berkedip di antara kirim dan ack, bubble menyimpan id sementara buatan
      // klien SELAMANYA -- setiap tindakan yang memakai id itu (sunting, hapus)
      // lalu dijawab 404 oleh server. Ack tetap dibiarkan: ia menulis nilai
      // yang sama, jadi idempoten.
      const saved = res.data?.message as Message | undefined
      if (saved) {
        set((s) => ({
          messages: {
            ...s.messages,
            [convId]: (s.messages[convId] ?? []).map((m) =>
              m.clientMsgId === clientMsgId ? { ...m, ...saved } : m
            )
          }
        }))
      }
    } catch (e) {
      console.error('[chat] sendText gagal', e)
    }
  },

  // Sengaja meniru sendImage baris demi baris, bukan menyatukan keduanya:
  // pesan optimistis, clientMsgId, dan pembuangan saat gagal sudah terbukti
  // di jalur gambar. Menyatukannya sekarang berarti mempertaruhkan jalur
  // yang sudah dipakai karyawan demi kerapian yang belum tentu terpakai.
  sendVoice: async (blob, durationMs, peaks) => {
    const convId = get().activeId
    if (!convId) return
    const me = useAuthStore.getState().user
    const clientMsgId = nanoid()
    const optimistic: Message = {
      id: clientMsgId,
      conversationId: convId,
      senderId: me?.id ?? '',
      sender: me ?? undefined,
      type: 'AUDIO',
      body: '',
      clientMsgId,
      createdAt: new Date().toISOString(),
      attachments: [{
        id: clientMsgId,
        messageId: clientMsgId,
        storageKey: '',
        fileName: 'voice.webm',
        mimeType: blob.type || 'audio/webm',
        size: blob.size,
        durationMs,
        waveformPeaks: peaks,
        createdAt: new Date().toISOString(),
      } as Attachment & { _localUrl?: string }]
    }
    set((s) => ({
      messages: { ...s.messages, [convId]: [...(s.messages[convId] ?? []), optimistic] }
    }))
    try {
      const uploaded = await attachmentsApi.uploadVoice(convId, blob)
      // peaks TIDAK datang dari server -- server hanya mengembalikan durasi.
      // Peaks dihitung saat merekam dan hanya ada di sini.
      await messagesApi.send(convId, '', clientMsgId, {
        type: 'AUDIO',
        attachments: [{ ...uploaded, waveformPeaks: peaks }]
      })
    } catch (e) {
      console.error('[chat] sendVoice gagal', e)
      set((s) => ({
        messages: {
          ...s.messages,
          [convId]: (s.messages[convId] ?? []).filter((m) => m.clientMsgId !== clientMsgId)
        }
      }))
      const ax = e as { response?: { data?: { error?: string } }; message?: string }
      const detail = ax.response?.data?.error ?? ax.message ?? 'Unknown error'
      alert(`Failed to send voice message: ${detail}`)
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
      // Unggahan gagal -> BUANG pesan optimistisnya. Kalau dibiarkan, pengirim
      // melihat gambar lengkap dengan centang dan yakin terkirim, padahal
      // penerima tidak pernah menerimanya. Kegagalan yang menyamar sebagai
      // keberhasilan lebih buruk daripada kegagalan yang terang-terangan.
      URL.revokeObjectURL(localUrl)
      set((s) => ({
        messages: {
          ...s.messages,
          [convId]: (s.messages[convId] ?? []).filter((m) => m.clientMsgId !== clientMsgId)
        }
      }))
      // Tampilkan alasan dari server (mis. MIME ditolak), bukan pesan generik --
      // pengguna perlu tahu apakah ini soal format, ukuran, atau jaringan.
      const ax = e as { response?: { data?: { error?: string } }; message?: string }
      const detail = ax.response?.data?.error ?? ax.message ?? 'Unknown error'
      alert(`Failed to send image: ${detail}`)
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

  // Tanpa optimistik, dan itu disengaja: server yang memutuskan apakah
  // jendela 15 menit masih terbuka. Menampilkan teks baru lebih dulu lalu
  // menariknya kembali saat server menolak jauh lebih membingungkan
  // daripada jeda seperseratus detik.
  editMessage: async (conversationId, messageId, content) => {
    const res = await messagesApi.edit(conversationId, messageId, content)
    const updated = res.data.message as Message
    set((s) => ({
      messages: {
        ...s.messages,
        [conversationId]: (s.messages[conversationId] ?? []).map((m) =>
          m.id === messageId ? { ...m, ...updated } : m
        )
      },
      conversations: s.conversations.map((c) =>
        c.lastMessage && c.lastMessage.id === messageId
          ? { ...c, lastMessage: { ...c.lastMessage, ...updated } }
          : c
      )
    }))
  },

  // Optimistik: bisu dan favorit tidak mengubah data siapa pun selain kita,
  // jadi menunggu server hanya menambah jeda tanpa menambah keamanan.
  setConvSettings: async (conversationId, patch) => {
    let sebelum: Conversation[] = []
    set((s) => {
      sebelum = s.conversations
      return {
        conversations: s.conversations.map((c) =>
          c.id === conversationId ? { ...c, ...patch } : c
        )
      }
    })
    try {
      await conversationsApi.updateSettings(conversationId, patch)
    } catch (e) {
      console.error('[chat] setelan percakapan gagal', e)
      set({ conversations: sebelum })
    }
  },

  // Toggle optimistik. Reaksi terlalu sering dipakai untuk menunggu satu
  // perjalanan jaringan tiap kali, jadi emoji menyala seketika dan keadaan
  // lama disimpan supaya bisa dikembalikan bila permintaannya gagal.
  toggleReaction: async (conversationId, messageId, emoji, myId) => {
    const apply = (list: Message[]): Message[] =>
      list.map((m) => {
        if (m.id !== messageId) return m
        const rs = m.reactions ?? []
        const punyaku = rs.find((r) => r.userId === myId && r.emoji === emoji)
        return {
          ...m,
          reactions: punyaku
            ? rs.filter((r) => r !== punyaku)
            : [
                ...rs,
                { id: 'tmp-' + Date.now(), messageId, userId: myId, emoji, createdAt: new Date().toISOString() }
              ]
        }
      })
    let sebelum: Message[] = []
    set((s) => {
      sebelum = s.messages[conversationId] ?? []
      return { messages: { ...s.messages, [conversationId]: apply(sebelum) } }
    })
    try {
      await messagesApi.react(conversationId, messageId, emoji)
    } catch (e) {
      console.error('[chat] reaksi gagal, dikembalikan', e)
      set((s) => ({ messages: { ...s.messages, [conversationId]: sebelum } }))
    }
  },

  _onNewMessage: (m) => {
    set((s) => {
      const existing = s.messages[m.conversationId] ?? []
      const idx = existing.findIndex(
        (x) => x.id === m.id || (!!m.clientMsgId && x.clientMsgId === m.clientMsgId)
      )
      if (idx !== -1) {
        // Pesan ini SUDAH ada. Dulu di sini state dikembalikan apa adanya,
        // yang benar untuk duplikat -- tapi juga membuang satu-satunya jalur
        // yang dipakai hasil SUNTINGAN, sehingga teks baru tidak pernah
        // sampai ke layar penerima sampai ia memuat ulang percakapan.
        // Sekarang isinya diperbarui di tempat, dan percakapannya sengaja
        // TIDAK dinaikkan ke atas: menyunting pesan lama bukan aktivitas baru.
        const lama = existing[idx]
        if (lama.body === m.body && lama.editedAt === m.editedAt) return s
        const updated = [...existing]
        updated[idx] = { ...lama, ...m }
        return {
          messages: { ...s.messages, [m.conversationId]: updated },
          conversations: s.conversations.map((c) =>
            c.lastMessage && c.lastMessage.id === m.id
              ? { ...c, lastMessage: { ...c.lastMessage, ...m } }
              : c
          )
        }
      }

      // Preview sidebar: set lastMessage + naikkan percakapan ke atas,
      // supaya daftar ikut hidup tanpa reload (perilaku Telegram).
      const i = s.conversations.findIndex((c) => c.id === m.conversationId)
      let convos = s.conversations
      if (i !== -1) {
        const naik = { ...convos[i], lastMessage: m }
        convos = [naik, ...convos.slice(0, i), ...convos.slice(i + 1)]
      }

      return {
        messages: { ...s.messages, [m.conversationId]: [...existing, m] },
        conversations: convos
      }
    })
  },

  // Presence: backend publish { userId, status } ke channel 'presence' saat
  // WS connect / set-status / disconnect. Update status partner di daftar
  // percakapan; kalau yang berubah diri sendiri, update juga auth store.
  _onPresence: (p) => {
    set((s) => ({
      conversations: s.conversations.map((c) => ({
        ...c,
        members: c.members.map((mem) =>
          mem.userId === p.userId ? { ...mem, user: { ...mem.user, status: p.status } } : mem
        )
      }))
    }))
    const auth = useAuthStore.getState()
    if (auth.user?.id === p.userId) {
      useAuthStore.setState({ user: { ...auth.user, status: p.status } })
    }
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
wsService.on('presence', (p) =>
  useChatStore.getState()._onPresence(p as { userId: string; status: UserStatus })
)
wsService.on('message_ack', (p) =>
  useChatStore.getState()._onAck(p as { clientMsgId: string; id: string; seq: string; conversationId: string })
)
wsService.on('receipt', (p) =>
  useChatStore.getState()._onReceipt(p as { userId: string; seq: string; conversationId: string })
)
