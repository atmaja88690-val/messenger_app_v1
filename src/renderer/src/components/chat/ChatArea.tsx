import { useState, useEffect, useLayoutEffect, useRef, useMemo } from 'react'
import { useChatStore } from '../../stores/chat.store'
import { useAuthStore } from '../../stores/auth.store'
import AttachmentImage from './AttachmentImage'
import VoiceRecorder from './VoiceRecorder'
import VoiceBubble from './VoiceBubble'
import Avatar from './Avatar'
import chatPattern from '../../assets/chat-pattern.svg'
import type { Message } from '../../types'
import { useCallStore } from '../../stores/call.store'
import CallOverlay from './CallOverlay'

function formatDateSeparator(iso: string): string {
  const d = new Date(iso)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  if (sameDay(d, today)) return 'Today'
  if (sameDay(d, yesterday)) return 'Yesterday'
  return d.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

function dayKey(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

const MAX_IMAGE_MB = 20
// Cermin dari EDIT_WINDOW_MS di backend. Diduplikasi dengan sengaja: klien
// memakainya untuk MENYEMBUNYIKAN butir menu yang pasti ditolak, server
// tetap satu-satunya yang menegakkannya.
const EDIT_WINDOW_MS = 15 * 60 * 1000

// Ceklis ala Telegram: abu (terkirim) -> biru (sudah dibaca lawan bicara).
// Dibandingkan via cursor lastReadSeq (bukan per-pesan), jadi cocok utk DM.
// Pesan optimistic (belum punya seq asli dari server) selalu tampil abu dulu.
function ReadTicks({ message, readUpToSeq }: { message: Message; readUpToSeq?: string }) {
  const seqNum = message.seq !== undefined ? Number(message.seq) : null
  const cursorNum = readUpToSeq !== undefined ? Number(readUpToSeq) : null
  const isRead = seqNum !== null && cursorNum !== null && seqNum <= cursorNum
  // Dua centang digambar sebagai SATU svg, bukan dua karakter teks. Sebagai
  // teks, jaraknya ditentukan letter-spacing font dan selalu renggang -- tidak
  // ada properti CSS yang merapatkannya tanpa merusak baris lain. Sebagai path,
  // jaraknya kita yang tentukan: 4.6 unit dalam kotak 16 unit, serapat WhatsApp.
  return (
    <svg
      viewBox="0 0 16 11"
      width="16"
      height="11"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`flex-shrink-0 ${isRead ? 'text-[#53bdeb]' : 'text-gray-400'}`}
    >
      <title>{isRead ? 'Read' : 'Sent'}</title>
      {isRead && <path d="M1 6.2 L4 9.2 L10.4 1.6" />}
      <path d={isRead ? 'M5.6 6.2 L8.6 9.2 L15 1.6' : 'M3.4 6.2 L6.4 9.2 L12.8 1.6'} />
    </svg>
  )
}

// Context menu untuk bubble TEKS (klik kanan). Saat dibuka, isi pesan
// otomatis ter-select (mirip "Select Text" Virola, tapi langsung aktif
// tanpa langkah tambahan). Menu: Copy as Text, Select Text, Delete (jika milik sendiri).
const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏']

// Menu konteks bubble. Bar reaksi cepat diletakkan DI ATAS daftar, bukan di
// dalamnya: reaksi adalah tindakan sekali sentuh yang paling sering dipakai,
// dan mengubur satu emoji di antara butir teks membuatnya sama mahalnya
// dengan Delete. Pemosisian tetap sama seperti sebelumnya.
function TextContextMenu({
  x, y, body, canDelete, onClose, onDelete, onReply, onReact, canEdit, onEdit, isPinned, onPin, isStarred, onStar
}: {
  x: number; y: number; body: string; canDelete: boolean; onClose: () => void; onDelete: () => void
  onReply: () => void
  onReact: (emoji: string) => void
  canEdit: boolean
  onEdit: () => void
  isPinned: boolean
  onPin: () => void
  isStarred: boolean
  onStar: () => void
}) {
  const menuRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ left: number; top: number; ready: boolean }>({ left: x, top: y, ready: false })
  useLayoutEffect(() => {
    const el = menuRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const margin = 8
    let left = x
    let top = y
    if (left + rect.width + margin > window.innerWidth) left = window.innerWidth - rect.width - margin
    if (top + rect.height + margin > window.innerHeight) top = window.innerHeight - rect.height - margin
    left = Math.max(margin, left)
    top = Math.max(margin, top)
    setPos({ left, top, ready: true })
  }, [x, y])
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(body)
    } catch (e) {
      console.error('[ChatArea] copy gagal', e)
    }
    onClose()
  }
  const item =
    'w-full flex items-center gap-2.5 px-3 py-2 text-left text-gray-200 hover:bg-gray-700 transition-colors'
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        ref={menuRef}
        className="fixed z-50 w-max"
        style={{ left: pos.left, top: pos.top, visibility: pos.ready ? 'visible' : 'hidden' }}
      >
        <div className="mb-1.5 flex items-center gap-0.5 bg-gray-800 rounded-full shadow-xl border border-gray-700 px-1.5 py-1">
          {QUICK_REACTIONS.map((e) => (
            <button
              key={e}
              onClick={() => { onReact(e); onClose() }}
              className="w-8 h-8 flex items-center justify-center rounded-full text-lg leading-none hover:bg-gray-700 active:scale-90 transition-transform"
            >
              {e}
            </button>
          ))}
        </div>
        <div className="w-52 bg-gray-800 rounded-xl shadow-xl border border-gray-700 py-1 text-sm">
          <button onClick={() => { onReply(); onClose() }} className={item}>
            ↩️ Reply
          </button>
          <button onClick={handleCopy} className={item}>
            📄 Copy as Text
          </button>
          <button onClick={onClose} className={item}>
            🔲 Select Text
          </button>
          <button onClick={() => { onStar(); onClose() }} className={item}>
            {isStarred ? '⭐ Unstar Message' : '⭐ Star Message'}
          </button>
          <button onClick={() => { onPin(); onClose() }} className={item}>
            {isPinned ? '\u{1F4CC} Unpin Message' : '\u{1F4CC} Pin Message'}
          </button>
          {canEdit && (
            <button onClick={() => { onEdit(); onClose() }} className={item}>
              ✏️ Edit Message
            </button>
          )}
          {canDelete && (
            <>
              <div className="border-t border-gray-700 my-1" />
              <button
                onClick={() => { onDelete(); onClose() }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-red-400 hover:bg-gray-700 transition-colors"
              >
                🗑️ Delete Message
              </button>
            </>
          )}
        </div>
      </div>
    </>
  )
}

// Menyunting adalah tindakan modal: selama berlangsung, mengirim pesan baru
// tidak masuk akal. Banner tipis di atas kolom teks tidak menyampaikan itu --
// Enter tetap bisa ditekan dan pengguna tidak tahu mana yang terjadi. Kotak
// di tengah layar menutup pilihan lain sampai suntingan selesai atau batal.
function EditMessageDialog({
  message, onClose, onSave
}: {
  message: Message
  onClose: () => void
  onSave: (text: string) => Promise<void>
}) {
  const [draft, setDraft] = useState(message.body ?? '')
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])
  const simpan = async (): Promise<void> => {
    const t = draft.trim()
    if (!t || saving) return
    // Suntingan yang tidak mengubah apa pun tidak dikirim: menempelkan
    // label "Edited" pada teks yang identik hanya menimbulkan kecurigaan.
    if (t === (message.body ?? '')) { onClose(); return }
    setSaving(true)
    try {
      await onSave(t)
      onClose()
    } finally {
      setSaving(false)
    }
  }
  return (
    <div
      className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
          >
            ✕
          </button>
          <div className="text-gray-900 font-medium">Edit message</div>
        </div>
        <div className="px-4 py-5 bg-[#eef2f5] flex justify-end">
          <div className="max-w-[75%] px-3 py-2 rounded-2xl bg-[#e5fbd0] text-gray-900 text-sm break-words">
            {message.body}
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-3">
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void simpan()
              else if (e.key === 'Escape') onClose()
            }}
            className="flex-1 min-w-0 px-4 py-2.5 bg-gray-100 rounded-full text-gray-900 focus:outline-none focus:bg-white border border-transparent focus:border-[#4aa3df]"
          />
          <button
            onClick={() => void simpan()}
            disabled={saving || draft.trim().length === 0}
            aria-label="Save"
            className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full bg-[#4aa3df] text-white hover:bg-[#3a92ce] disabled:opacity-40 transition-colors"
          >
            {saving ? (
              <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ChatArea({
  onOpenPanel,
  panelOpen,
  mobileHidden,
  onBackToList
}: {
  onOpenPanel?: () => void
  panelOpen?: boolean
  mobileHidden?: boolean
  onBackToList?: () => void
}) {
  const { conversations, activeId, messages, sendText, sendImage, loadingMsgs, markRead, readCursors, deleteMessage, toggleReaction, editMessage, togglePin, loadPinned, pinnedMsg, toggleStar } = useChatStore()
  const myId = useAuthStore((s) => s.user?.id)
  const [text, setText] = useState('')
  // Saat merekam atau meninjau, kolom teks dan tombol Send disembunyikan:
  // satu baris composer, satu maksud. Tanpa ini keduanya berebut ruang
  // dan di layar HP tombol Kirim rekaman terdorong keluar layar.
  const [voiceActive, setVoiceActive] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; messageId: string; body: string; mine: boolean } | null>(null)
  const bubbleRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const pinned = activeId ? (pinnedMsg[activeId] ?? null) : null
  // Pesan yang disematkan bisa berada jauh di atas riwayat dan belum ikut
  // termuat, jadi ia diambil lewat rutenya sendiri -- bukan dicari di daftar
  // pesan yang kebetulan ada di layar.
  useEffect(() => {
    if (activeId) void loadPinned(activeId)
  }, [activeId])

  const raw = activeId ? messages[activeId] ?? [] : []
  const list = useMemo(
    () => [...raw].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [raw]
  )

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [list.length])

  // Menandai terbaca HANYA saat jendela benar-benar terlihat. Kalau aplikasi
  // diminimalkan sementara percakapan ini terbuka, pesan yang masuk tetap
  // dihitung belum dibaca -- kalau tidak, pengguna menerima notifikasi,
  // membuka aplikasi, dan tidak ada satu pun penanda yang menuntunnya ke
  // pesan itu. Pendengar visibility dan focus membuatnya menyusul begitu
  // jendela kembali dilihat, tanpa perlu percakapan dibuka ulang.
  useEffect(() => {
    if (!activeId || list.length === 0) return
    const tandaiBila = (): void => {
      if (document.visibilityState !== 'visible') return
      const lastMsg = list[list.length - 1]
      if (lastMsg.seq !== undefined) markRead(activeId, lastMsg.seq)
    }
    tandaiBila()
    document.addEventListener('visibilitychange', tandaiBila)
    window.addEventListener('focus', tandaiBila)
    return () => {
      document.removeEventListener('visibilitychange', tandaiBila)
      window.removeEventListener('focus', tandaiBila)
    }
  }, [activeId, list.length])

  // Pesan yang sedang dibalas (null = tidak sedang membalas).
  const [replyTo, setReplyTo] = useState<Message | null>(null)
  const [editing, setEditing] = useState<Message | null>(null)

  // Cari pesan asli dari daftar yang sudah dimuat. Bisa null kalau pesan
  // aslinya sudah ter-scroll jauh dan belum dimuat -> tampilkan fallback.
  const findMessage = (id: string): Message | undefined =>
    raw.find((x) => x.id === id)

  // Gambar yang menunggu konfirmasi kirim (dari paste atau tombol lampiran).
  const [pendingImage, setPendingImage] = useState<File | null>(null)
  const [pendingUrl, setPendingUrl] = useState<string | null>(null)

  const clearPending = (): void => {
    setPendingUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })
    setPendingImage(null)
  }

  const handleSend = async () => {
    const t = text.trim()
    if (pendingImage) {
      const file = pendingImage
      clearPending()
      setText('')
      await sendImage(file, t || undefined)
      return
    }
    if (!t) return
    const rid = replyTo?.id
    setReplyTo(null)
    setText('')
    await sendText(t, rid)
  }

  const handlePickFile = () => fileInputRef.current?.click()

  // Validasi dipakai bersama oleh tombol lampiran dan paste dari clipboard,
  // supaya aturannya tidak pernah menyimpang di antara dua jalur.
  const validateAndSendImage = async (file: File): Promise<void> => {
    if (!file.type.startsWith('image/')) {
      alert('Only image files are supported for now.')
      return
    }
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      alert(`Ukuran gambar maksimal ${MAX_IMAGE_MB}MB.`)
      return
    }
    setPendingImage(file)
    setPendingUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return URL.createObjectURL(file)
    })
  }

  // Paste gambar dari clipboard OS langsung ke chat (Ctrl+V di kolom pesan).
  // Teks biasa dibiarkan lewat ke perilaku bawaan input.
  const handlePaste = async (e: React.ClipboardEvent<HTMLInputElement>): Promise<void> => {
    const items = e.clipboardData?.items
    if (!items) return
    for (const item of Array.from(items)) {
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        const file = item.getAsFile()
        if (!file) continue
        e.preventDefault()
        await validateAndSendImage(file)
        return
      }
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    await validateAndSendImage(file)
  }

  const openTextMenu = (e: React.MouseEvent, m: Message) => {
    e.preventDefault()
    if (!m.body) return // bubble gambar tanpa caption -> tidak ada teks utk menu ini
    setCtxMenu({ x: e.clientX, y: e.clientY, messageId: m.id, body: m.body, mine: m.senderId === myId })
    // Auto-select isi bubble (mirip "Select Text" Virola tapi langsung aktif)
    const el = bubbleRefs.current.get(m.id)
    if (el) {
      requestAnimationFrame(() => {
        const range = document.createRange()
        range.selectNodeContents(el)
        const sel = window.getSelection()
        sel?.removeAllRanges()
        sel?.addRange(range)
      })
    }
  }

  const handleDeleteText = async () => {
    if (!ctxMenu || !activeId) return
    if (!window.confirm('Delete this message? This cannot be undone.')) return
    try {
      await deleteMessage(activeId, ctxMenu.messageId)
    } catch (e) {
      console.error('[ChatArea] delete gagal', e)
      alert('Failed to delete message.')
    }
  }

  if (!activeId) {
    return (
      <div
        className={`flex-1 items-center justify-center text-gray-500 ${
          mobileHidden ? 'hidden md:flex' : 'flex'
        }`}
      >
        Select a conversation to start
      </div>
    )
  }

  let lastDay = ''
  const activeConv = conversations.find((c) => c.id === activeId)
  const headPartner = activeConv && activeConv.type === 'DIRECT'
    ? activeConv.members.find((m) => m.userId !== myId)?.user
    : undefined
  const headName = activeConv?.title || headPartner?.displayName || headPartner?.username || 'Conversation'
  const headStatus = headPartner?.status

  // Panggilan 1:1 saja -- headPartner undefined untuk GROUP, tombol otomatis tersembunyi.
  const startCall = useCallStore.getState().startCall
  const canCall = activeId !== null && headPartner?.id !== undefined
  const startVoiceCall = () => {
    if (canCall && headPartner?.id !== undefined) {
      void startCall(activeId, 'AUDIO', { id: headPartner.id, displayName: headName })
    }
  }
  const startVideoCall = () => {
    if (canCall && headPartner?.id !== undefined) {
      void startCall(activeId, 'VIDEO', { id: headPartner.id, displayName: headName })
    }
  }
  const headOnline = headStatus === 'AVAILABLE'

  return (
    <div
      className={`flex-1 flex-col bg-white min-h-0 min-w-0 ${mobileHidden ? 'hidden md:flex' : 'flex'}`}
    >
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 bg-white flex-shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Tombol kembali ke daftar chat -- hanya tampil di mobile (<md). */}
          <button
            type="button"
            onClick={() => onBackToList?.()}
            aria-label="Kembali ke daftar chat"
            className="md:hidden -ml-1 mr-0.5 p-1 text-gray-500 hover:text-gray-700 flex-shrink-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
          </button>
          {headPartner?.id ? (
            <Avatar userId={headPartner.id} name={headName} avatarVersion={headPartner.avatarVersion} className="w-8 h-8 rounded-full flex-shrink-0" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
              {headName.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <div className="text-gray-900 text-sm font-medium truncate">{headName}</div>
            {headStatus && (
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <span className={`w-1.5 h-1.5 rounded-full ${headOnline ? 'bg-green-500' : 'bg-gray-500'}`} />
                {headOnline ? 'Online' : 'Offline'}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4 text-gray-500">
          {/* Kamera (video call) & grid view disembunyikan sesuai revisi UI -- kode dipertahankan untuk dikembalikan nanti
          <svg className="opacity-40 cursor-default" xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m22 8-6 4 6 4V8Z" /><rect width="14" height="12" x="2" y="6" rx="2" /></svg>
          <svg className="opacity-40 cursor-default" xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect width="7" height="7" x="3" y="3" rx="1" /><rect width="7" height="7" x="14" y="3" rx="1" /><rect width="7" height="7" x="14" y="14" rx="1" /><rect width="7" height="7" x="3" y="14" rx="1" /></svg>
          */}
          <button type="button" onClick={() => startVoiceCall()} aria-label="Voice call" title="Voice call" className="hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.68 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.32 1.85.55 2.81.68A2 2 0 0 1 22 16.92z" /></svg>
          </button>
          <button type="button" onClick={() => startVideoCall()} aria-label="Video call" title="Video call" className="hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 8-6 4 6 4V8Z" /><rect width="14" height="12" x="2" y="6" rx="2" /></svg>
          </button>
          {!panelOpen && (
            <button type="button" onClick={() => onOpenPanel?.()} aria-label="Show contact info" className="hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 4-6 8-6s8 2 8 6" /></svg>
            </button>
          )}
        </div>
      </div>
      <div
        className="flex-1 overflow-y-auto p-4 space-y-1.5"
        style={{ backgroundColor: '#d6e0ea', backgroundImage: `url(${chatPattern})`, backgroundRepeat: 'repeat' }}
      >
        {/* Menempel di atas daftar, bukan di header: ia milik percakapan yang
            sedang digulir, dan ikut hilang begitu percakapan lain dibuka. */}
        {pinned && (
          <div className="sticky top-0 z-10 mb-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-white/95 backdrop-blur border border-gray-200 shadow-sm">
            <button
              onClick={() => {
                const el = bubbleRefs.current.get(pinned.id)
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
              }}
              className="flex items-center gap-2 min-w-0 flex-1 text-left"
            >
              <span className="text-sm flex-shrink-0">📌</span>
              <span className="min-w-0 flex-1">
                <span className="block text-[11px] font-medium text-[#4aa3df]">Pinned message</span>
                <span className="block text-xs text-gray-700 truncate">
                  {pinned.body ||
                    (pinned.type === 'AUDIO'
                      ? '\u{1F3A4} Voice message'
                      : pinned.type === 'IMAGE'
                        ? '\u{1F4F7} Photo'
                        : 'Message')}
                </span>
              </span>
            </button>
            <button
              onClick={() => { if (activeId) void togglePin(activeId, pinned.id) }}
              title="Unpin"
              className="w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-200"
            >
              ✕
            </button>
          </div>
        )}
        {loadingMsgs && <div className="text-gray-500 text-sm">Loading messages...</div>}
        {list.map((m: Message) => {
          const mine = m.senderId === myId
          const k = dayKey(m.createdAt)
          const showDate = k !== lastDay
          lastDay = k
          const hasImage = m.type === 'IMAGE' && m.attachments && m.attachments.length > 0
          const hasVoice = m.type === 'AUDIO' && m.attachments && m.attachments.length > 0
          return (
            <div key={m.id}>
              {showDate && (
                <div className="flex justify-center my-3">
                  <span className="px-3 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">
                    {formatDateSeparator(m.createdAt)}
                  </span>
                </div>
              )}
              <div className={`group flex items-center gap-1 ${mine ? 'justify-end' : 'justify-start'}`}>
                {mine && (
                  <button
                    onClick={() => setReplyTo(m)}
                    title="Reply"
                    className="opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 text-xs"
                  >
                    ↩
                  </button>
                )}
                <div
                  className={`max-w-[70%] ${hasImage ? 'p-1.5' : hasVoice ? 'w-[260px] px-2 py-1.5' : 'px-3 py-2'} rounded-2xl ${mine ? 'bg-[#e5fbd0] text-gray-900' : 'bg-white text-gray-900 border border-gray-200'}`}
                  onContextMenu={(e) => openTextMenu(e, m)}
                >
                  {m.replyToId && (
                    <div className="mb-1 border-l-4 border-[#4aa3df] bg-black/5 rounded px-2 py-1">
                      <div className="text-[11px] font-medium text-[#4aa3df]">
                        {findMessage(m.replyToId)?.sender?.displayName ?? 'User'}
                      </div>
                      <div className="text-[11px] text-gray-600 truncate">
                        {findMessage(m.replyToId)?.body || 'Message'}
                      </div>
                    </div>
                  )}
                  {/* Waveform dan durasi digambar dari kolom basis data, jadi bubble sudah
                      lengkap sebelum satu byte audio pun diunduh. Berkasnya baru diambil
                      saat tombol putar ditekan. */}
                  {hasVoice && (
                    <VoiceBubble attachment={m.attachments![0]} mine={mine} />
                  )}
                  {hasImage && (
                    <div className="mb-1">
                      <AttachmentImage
                        attachment={m.attachments![0]}
                        messageId={m.id}
                        conversationId={activeId!}
                        canDelete={mine}
                      />
                    </div>
                  )}
                  {m.body && (
                    <div
                      ref={(el) => { if (el) bubbleRefs.current.set(m.id, el) }}
                      className={`text-sm break-words select-text ${hasImage ? 'px-1.5' : ''}`}
                    >
                      {m.body}
                    </div>
                  )}
                  <div className={`text-[10px] mt-0.5 flex items-center justify-end gap-1 ${hasImage ? 'px-1.5 pb-0.5' : ''} ${mine ? 'text-green-700' : 'text-gray-400'}`}>
                    {m.stars && m.stars.length > 0 && (
                      <span title="Starred" className="opacity-80">⭐</span>
                    )}
                    {m.editedAt && <span className="opacity-70">Edited</span>}
                    {formatTime(m.createdAt)}
                    {mine && <ReadTicks message={m} readUpToSeq={activeId ? readCursors[activeId] : undefined} />}
                  </div>
                  {/* Dikelompokkan per emoji, bukan satu chip per baris reaksi: sepuluh
                      jempol harus terbaca sebagai satu jempol dengan angka 10. */}
                  {m.reactions && m.reactions.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {Object.entries(
                        m.reactions.reduce<Record<string, { n: number; mine: boolean }>>((acc, r) => {
                          const cur = acc[r.emoji] ?? { n: 0, mine: false }
                          acc[r.emoji] = { n: cur.n + 1, mine: cur.mine || r.userId === myId }
                          return acc
                        }, {})
                      ).map(([emoji, info]) => (
                        <button
                          key={emoji}
                          onClick={() => { if (activeId && myId) void toggleReaction(activeId, m.id, emoji, myId) }}
                          className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[11px] border transition-colors ${
                            info.mine ? 'bg-[#4aa3df]/20 border-[#4aa3df]' : 'bg-black/5 border-transparent hover:bg-black/10'
                          }`}
                        >
                          <span className="text-[13px] leading-none">{emoji}</span>
                          {info.n > 1 && <span className="text-gray-600 tabular-nums">{info.n}</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {!mine && (
                  <button
                    onClick={() => setReplyTo(m)}
                    title="Reply"
                    className="opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 text-xs"
                  >
                    ↩
                  </button>
                )}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {editing && (
        <EditMessageDialog
          message={editing}
          onClose={() => setEditing(null)}
          onSave={async (t) => {
            try {
              await editMessage(editing.conversationId, editing.id, t)
            } catch (e) {
              // Penolakan paling mungkin: jendela 15 menit sudah lewat. Alasan
              // dari server lebih berguna daripada kalimat generik, dan galat
              // dilempar ulang supaya dialog tetap terbuka dengan teks utuh.
              const ax = e as { response?: { data?: { error?: string } } }
              alert(ax.response?.data?.error ?? 'Failed to edit message')
              throw e
            }
          }}
        />
      )}
      {ctxMenu && (
        <TextContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          body={ctxMenu.body}
          canDelete={ctxMenu.mine}
          onClose={() => setCtxMenu(null)}
          onDelete={handleDeleteText}
          isPinned={findMessage(ctxMenu.messageId)?.pinnedAt != null}
          isStarred={(findMessage(ctxMenu.messageId)?.stars?.length ?? 0) > 0}
          onStar={() => {
            if (activeId) void toggleStar(activeId, ctxMenu.messageId)
          }}
          onPin={() => {
            if (activeId) void togglePin(activeId, ctxMenu.messageId)
          }}
          canEdit={(() => {
            const m = findMessage(ctxMenu.messageId)
            if (!m || m.senderId !== myId || m.deletedAt) return false
            if (m.type !== 'TEXT') return false
            // Tanpa seq, pesan ini belum dikonfirmasi server dan id-nya masih
            // sementara. Menyunting sekarang pasti dijawab 404.
            if (m.seq === undefined || m.seq === null) return false
            return Date.now() - new Date(m.createdAt).getTime() < EDIT_WINDOW_MS
          })()}
          onEdit={() => {
            const m = findMessage(ctxMenu.messageId)
            if (m) setEditing(m)
          }}
          onReact={(emoji) => {
            if (activeId && myId) void toggleReaction(activeId, ctxMenu.messageId, emoji, myId)
          }}
          onReply={() => {
            const m = findMessage(ctxMenu.messageId)
            if (m) setReplyTo(m)
          }}
        />
      )}

      <div className="p-3 border-t border-gray-200 bg-white flex-shrink-0">
        {pendingUrl && (
          <div className="mb-2 inline-flex relative">
            <img src={pendingUrl} alt="preview" className="h-20 w-20 object-cover rounded-lg border border-gray-300" />
            <button
              onClick={clearPending}
              title="Cancel"
              className="absolute -top-2 -right-2 w-6 h-6 flex items-center justify-center rounded-full bg-gray-700 text-white text-xs hover:bg-gray-800"
            >
              ✕
            </button>
          </div>
        )}
        {replyTo && (
          <div className="mb-2 flex items-start gap-2 bg-gray-100 border-l-4 border-[#4aa3df] rounded px-3 py-2">
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-[#4aa3df]">
                {replyTo.senderId === myId ? 'You' : replyTo.sender?.displayName ?? 'User'}
              </div>
              <div className="text-xs text-gray-600 truncate">
                {replyTo.body || '📎 Attachment'}
              </div>
            </div>
            <button
              onClick={() => setReplyTo(null)}
              title="Cancel reply"
              className="w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-200"
            >
              ✕
            </button>
          </div>
        )}
        <div className="flex gap-2 items-center">
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          {/* Lampiran pindah KE DALAM pil input. Di luar, ia menjadi kontrol
              keempat yang bersaing perhatian dengan mic, teks, dan kirim --
              padahal pada satu saat hanya satu tindakan yang masuk akal. */}
          {!voiceActive && (
            <div className="flex-1 min-w-0 flex items-center bg-gray-100 rounded-full border border-transparent focus-within:border-[#4aa3df] focus-within:bg-white transition-colors">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                onPaste={handlePaste}
                placeholder="Type a message..."
                className="flex-1 min-w-0 px-4 py-2.5 bg-transparent text-gray-900 rounded-full focus:outline-none placeholder-gray-400"
              />
              <button
                onClick={handlePickFile}
                title="Attach image"
                aria-label="Attach image"
                className="w-9 h-9 mr-1 flex-shrink-0 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                </svg>
              </button>
            </div>
          )}
          <VoiceRecorder
            onActiveChange={setVoiceActive}
            showSend={text.trim().length > 0 || pendingImage !== null}
            onSend={handleSend}
          />
        </div>
      </div>
      <CallOverlay />
    </div>
  )
}
