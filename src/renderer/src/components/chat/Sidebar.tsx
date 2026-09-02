import { useEffect, useState, useRef, useLayoutEffect } from 'react'
import { useChatStore } from '../../stores/chat.store'
import { useAuthStore } from '../../stores/auth.store'
import type { Conversation, ConversationMember } from '../../types'
import Avatar from './Avatar'
import NewChatDialog from './NewChatDialog'

function convName(c: Conversation, myId?: string): string {
  if (c.title) return c.title
  const other = c.members.find((m) => m.userId !== myId)
  return other?.user.displayName ?? other?.user.username ?? 'Conversation'
}

function otherMember(c: Conversation, myId?: string): ConversationMember | undefined {
  return c.members.find((m) => m.userId !== myId)
}

function initials(name: string): string {
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
}

const DOT: Record<string, string> = {
  AVAILABLE: 'bg-green-500',
  AWAY: 'bg-yellow-500',
  DND: 'bg-red-500',
  OFFLINE: 'bg-gray-400'
}
const LABEL: Record<string, string> = {
  AVAILABLE: 'Available',
  AWAY: 'Away',
  DND: 'Do not disturb',
  OFFLINE: 'Offline'
}

// seq bersifat per-percakapan dan naik satu tiap pesan, dan lastReadSeq adalah
// posisi baca kita sendiri di deret yang sama -- jadi selisihnya SUDAH jumlah
// pesan belum dibaca. Tidak ada yang perlu ditambahkan di backend untuk ini.
// Pesan terakhir dari diri sendiri tidak pernah dihitung: kursor baca kita
// belum tentu ikut maju saat kita yang mengirim, dan badge di percakapan
// sendiri adalah kesalahan yang paling cepat merusak kepercayaan pada badge.
// mutedUntil adalah WAKTU, bukan sakelar -- jadi bisu bisa kedaluwarsa
// sendiri tanpa ada yang perlu membatalkannya.
function isMuted(c: Conversation): boolean {
  return !!c.mutedUntil && new Date(c.mutedUntil).getTime() > Date.now()
}

const MUTE_OPTIONS: Array<{ label: string; hours: number }> = [
  { label: 'Mute 8 hours', hours: 8 },
  { label: 'Mute 1 week', hours: 24 * 7 },
  { label: 'Mute always', hours: 24 * 365 * 10 }
]

function ConvContextMenu({
  x, y, conv, onClose, onSet
}: {
  x: number
  y: number
  conv: Conversation
  onClose: () => void
  onSet: (patch: { favorite?: boolean; mutedUntil?: string | null }) => void
}): React.JSX.Element {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ left: x, top: y, ready: false })
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const m = 8
    let left = x
    let top = y
    if (left + r.width + m > window.innerWidth) left = window.innerWidth - r.width - m
    if (top + r.height + m > window.innerHeight) top = window.innerHeight - r.height - m
    setPos({ left: Math.max(m, left), top: Math.max(m, top), ready: true })
  }, [x, y])
  const muted = isMuted(conv)
  const item =
    'w-full flex items-center gap-2.5 px-3 py-2 text-left text-gray-200 hover:bg-gray-700 transition-colors'
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        ref={ref}
        className="fixed z-50 w-56 bg-gray-800 rounded-xl shadow-xl border border-gray-700 py-1 text-sm"
        style={{ left: pos.left, top: pos.top, visibility: pos.ready ? 'visible' : 'hidden' }}
      >
        <button
          onClick={() => { onSet({ favorite: !conv.favorite }); onClose() }}
          className={item}
        >
          {conv.favorite ? '⭐ Remove from favorites' : '⭐ Add to favorites'}
        </button>
        <div className="border-t border-gray-700 my-1" />
        {muted ? (
          <button onClick={() => { onSet({ mutedUntil: null }); onClose() }} className={item}>
            🔔 Unmute
          </button>
        ) : (
          MUTE_OPTIONS.map((o) => (
            <button
              key={o.label}
              onClick={() => {
                const until = new Date(Date.now() + o.hours * 3600 * 1000).toISOString()
                onSet({ mutedUntil: until })
                onClose()
              }}
              className={item}
            >
              🔇 {o.label}
            </button>
          ))
        )}
      </div>
    </>
  )
}

function unreadOf(c: Conversation, myId?: string): number {
  const last = c.lastMessage
  if (!last || last.senderId === myId) return 0
  const seq = Number(last.seq ?? 0)
  const read = Number(c.lastReadSeq ?? 0)
  if (!Number.isFinite(seq) || !Number.isFinite(read)) return 0
  return Math.max(0, seq - read)
}

// Pesan suara, foto, dan berkas tidak punya body -- tanpa ini barisnya kosong
// melompong dan daftar tampak seperti percakapan yang tidak pernah dipakai.
function previewOf(c: Conversation): string {
  const m = c.lastMessage
  if (!m) return 'No messages yet'
  if (m.body) return m.body
  if (m.type === 'AUDIO') return '🎤 Voice message'
  if (m.type === 'IMAGE') return '📷 Photo'
  if (m.type === 'FILE') return '📎 File'
  if (m.type === 'CALL') return '📞 Call'
  return 'Message'
}

function shortTime(iso?: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const now = new Date()
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  const kemarin = new Date(now)
  kemarin.setDate(now.getDate() - 1)
  if (d.toDateString() === kemarin.toDateString()) return 'Yesterday'
  return d.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: '2-digit' })
}

export default function Sidebar({
  onOpenSettings,
  mobileHidden,
  onSelectConversation
}: {
  onOpenSettings?: () => void
  mobileHidden?: boolean
  onSelectConversation?: () => void
}) {
  const { conversations, activeId, loadConversations, selectConversation, loadingConvos, setConvSettings } = useChatStore()
  const myId = useAuthStore((s) => s.user?.id)
  const me = useAuthStore((s) => s.user)
  const [query, setQuery] = useState('')
  const [filterMode, setFilterMode] = useState<'all' | 'unread' | 'fav'>('all')
  const [convMenu, setConvMenu] = useState<{ x: number; y: number; id: string } | null>(null)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [newChatOpen, setNewChatOpen] = useState(false)
  const historyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadConversations()
  }, [])

  useEffect(() => {
    if (!historyOpen) return
    const onDocClick = (e: MouseEvent) => {
      if (historyRef.current && !historyRef.current.contains(e.target as Node)) {
        setHistoryOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [historyOpen])

  const q = query.trim().toLowerCase()
  const byName = q
    ? conversations.filter((c) => convName(c, myId).toLowerCase().includes(q))
    : conversations
  const filtered =
    filterMode === 'unread'
      ? byName.filter((c) => unreadOf(c, myId) > 0)
      : filterMode === 'fav'
        ? byName.filter((c) => c.favorite)
        : byName
  const unreadTotal = conversations.filter((c) => unreadOf(c, myId) > 0).length
  const favTotal = conversations.filter((c) => c.favorite).length
  const directConvos = filtered.filter((c) => c.type === 'DIRECT')
  const groupConvos = filtered.filter((c) => c.type !== 'DIRECT')
  const recentRooms = conversations.slice(0, 6)

  const meStatus = me?.status ?? 'AVAILABLE'

  const renderItem = (c: Conversation) => {
    const name = convName(c, myId)
    const active = c.id === activeId
    const otherM = c.type === 'DIRECT' ? otherMember(c, myId) : undefined
    const unread = unreadOf(c, myId)
    const muted = isMuted(c)
    return (
      <button
        key={c.id}
        onClick={() => { selectConversation(c.id); onSelectConversation?.() }}
        onContextMenu={(e) => {
          e.preventDefault()
          setConvMenu({ x: e.clientX, y: e.clientY, id: c.id })
        }}
        className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors border-l-[3px] ${
          active ? 'bg-[#f0f7fc] border-[#4aa3df]' : 'border-transparent hover:bg-gray-50'
        }`}
      >
        {otherM ? (
          <Avatar userId={otherM.userId} name={name} avatarVersion={otherM.user?.avatarVersion} className="w-10 h-10 rounded-full flex-shrink-0" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-[#4aa3df] flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
            {initials(name)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className={`text-gray-900 text-sm truncate ${unread > 0 ? 'font-semibold' : 'font-medium'}`}>{name}</div>
          <div className={`text-xs truncate ${unread > 0 ? 'text-gray-700' : 'text-gray-500'}`}>
            {previewOf(c)}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0 self-start pt-0.5">
          <span className={`text-[11px] leading-none ${unread > 0 ? 'text-[#0b93f6] font-semibold' : 'text-gray-400'}`}>
            {shortTime(c.lastMessageAt ?? c.lastMessage?.createdAt)}
          </span>
          {muted && (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              <path d="M18.63 13A17.9 17.9 0 0 1 18 8" />
              <path d="M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-3 9-3 9h14" />
              <path d="M18 8a6 6 0 0 0-9.33-5" />
              <line x1="2" y1="2" x2="22" y2="22" />
            </svg>
          )}
          {unread > 0 && (
            <span className={`min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full text-white text-[11px] font-semibold tabular-nums ${
              muted ? 'bg-gray-400' : 'bg-[#0b93f6]'
            }`}>
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </div>
      </button>
    )
  }

  return (
    <div
      className={`w-full md:w-72 flex-shrink-0 border-r border-gray-200 bg-white flex-col ${
        mobileHidden ? 'hidden md:flex' : 'flex'
      }`}
    >
      <div className="px-3 py-3 border-b border-gray-100 flex items-center gap-3">
        <div className="relative flex-shrink-0">
          {me?.id ? (
            <Avatar userId={me.id} name={me.displayName || me.username || 'Saya'} avatarVersion={me.avatarVersion} className="w-9 h-9 rounded-full flex-shrink-0" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-[#4aa3df] flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
              {initials(me?.displayName || me?.username || 'S')}
            </div>
          )}
          <span className={`absolute -right-0.5 -bottom-0.5 w-3 h-3 rounded-full border-2 border-white ${DOT[meStatus] ?? 'bg-gray-400'}`} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-gray-900 text-sm font-medium truncate">{me?.displayName || me?.username || 'Saya'}</div>
          <div className="text-gray-500 text-xs truncate">{LABEL[meStatus] ?? meStatus}</div>
        </div>
      </div>

      <div className="pl-3 pr-2 py-2 flex items-center gap-1.5">
        <div className="flex-1 flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1.5">
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 flex-shrink-0"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none min-w-0"
          />
        </div>
        <div ref={historyRef} className="relative flex items-center gap-1 text-gray-400">
          <button type="button" onClick={() => setNewChatOpen(true)} aria-label="Chat baru" className="hover:text-gray-700 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14" /><path d="M5 12h14" /></svg>
          </button>
          <button type="button" onClick={() => onOpenSettings?.()} aria-label="Settings" className="hover:text-gray-700 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
          </button>
          <button type="button" onClick={() => setHistoryOpen((v) => !v)} aria-label="Room history" className="hover:text-gray-700 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v5h5" /><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" /><path d="M12 7v5l4 2" /></svg>
          </button>
          {historyOpen && (
            <div className="absolute right-0 top-full mt-1 w-52 max-w-[calc(100vw-1rem)] max-h-80 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg z-30 py-1">
              <div className="px-3 py-1.5 text-xs font-medium text-gray-400 uppercase tracking-wide">recent rooms</div>
              {recentRooms.length === 0 && (
                <div className="px-3 py-2 text-gray-400 text-sm">No rooms yet</div>
              )}
              {recentRooms.map((c) => {
                const name = convName(c, myId)
                const otherM = c.type === 'DIRECT' ? otherMember(c, myId) : undefined
                return (
                  <button
                    key={c.id}
                    onClick={() => { selectConversation(c.id); setHistoryOpen(false); onSelectConversation?.() }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-gray-50 transition-colors"
                  >
                    {otherM ? (
                      <Avatar userId={otherM.userId} name={name} avatarVersion={otherM.user?.avatarVersion} className="w-7 h-7 rounded-full flex-shrink-0" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-[#4aa3df] flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                        {initials(name)}
                      </div>
                    )}
                    <span className="text-gray-800 text-sm truncate">{name}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* DIRECT dan GROUP sudah terpisah lewat judul bagian di bawah, jadi tab
          "Grup" hanya akan memindahkan hal yang sama ke tempat lain. Tiga ini
          menyaring hal yang tidak bisa dilihat dari judul bagian mana pun. */}
      <div className="px-3 pb-2 flex items-center gap-1.5">
        {([
          ['all', 'All', 0],
          ['unread', 'Unread', unreadTotal],
          ['fav', 'Favorites', favTotal]
        ] as Array<['all' | 'unread' | 'fav', string, number]>).map(([mode, label, n]) => (
          <button
            key={mode}
            type="button"
            onClick={() => setFilterMode(mode)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              filterMode === mode ? 'bg-[#4aa3df] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {label}{n > 0 ? ' ' + n : ''}
          </button>
        ))}
      </div>
      {convMenu && (() => {
        const c = conversations.find((x) => x.id === convMenu.id)
        if (!c) return null
        return (
          <ConvContextMenu
            x={convMenu.x}
            y={convMenu.y}
            conv={c}
            onClose={() => setConvMenu(null)}
            onSet={(patch) => { void setConvSettings(c.id, patch) }}
          />
        )
      })()}
      <div className="flex-1 overflow-y-auto">
        {loadingConvos && <div className="p-4 text-gray-400 text-sm">Loading...</div>}
        {!loadingConvos && conversations.length === 0 && <ConvosEmptyState />}
        {!loadingConvos && conversations.length > 0 && filtered.length === 0 && (
          <div className="p-4 text-gray-400 text-sm">
            {filterMode === 'unread' ? 'Nothing unread' : filterMode === 'fav' ? 'No favorites yet' : 'No matches'}
          </div>
        )}
        {!loadingConvos && conversations.length > 0 && filtered.length === 0 && (
          <div className="p-4 text-gray-400 text-sm">No matches</div>
        )}
        {directConvos.length > 0 && (
          <div className="flex items-center gap-1 px-3 pt-3 pb-1 text-xs font-medium text-gray-400 uppercase tracking-wide">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
            private
          </div>
        )}
        {directConvos.map(renderItem)}
        {groupConvos.length > 0 && (
          <div className="flex items-center gap-1 px-3 pt-3 pb-1 text-xs font-medium text-gray-400 uppercase tracking-wide">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
            groups
          </div>
        )}
        {groupConvos.map(renderItem)}
      </div>
      {newChatOpen && <NewChatDialog onClose={() => setNewChatOpen(false)} />}
    </div>
  )
}


// Keadaan kosong punya DUA sebab yang sangat berbeda: memang belum ada
// percakapan, atau pemuatannya gagal. Menampilkan keduanya dengan kalimat
// yang sama membuat kegagalan terbaca sebagai keadaan normal -- pengguna
// menyimpulkan sesinya rusak, padahal cukup dimuat ulang.
function ConvosEmptyState(): React.JSX.Element {
  const err = useChatStore((s) => s.convosError)
  const reload = useChatStore((s) => s.loadConversations)
  if (!err) {
    return <div className="p-4 text-gray-400 text-sm">No conversations yet</div>
  }
  return (
    <div className="p-4 text-sm">
      <div className="text-red-600 font-medium">Could not load conversations</div>
      <div className="text-gray-500 text-xs mt-1 break-words">{err}</div>
      <button
        onClick={() => { void reload() }}
        className="mt-2 px-3 py-1.5 rounded-full bg-[#4aa3df] hover:bg-[#3a92ce] text-white text-xs font-medium"
      >
        Retry
      </button>
    </div>
  )
}