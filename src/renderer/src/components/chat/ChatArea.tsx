import { useState, useEffect, useLayoutEffect, useRef, useMemo } from 'react'
import { useChatStore } from '../../stores/chat.store'
import { useAuthStore } from '../../stores/auth.store'
import AttachmentImage from './AttachmentImage'
import Avatar from './Avatar'
import chatPattern from '../../assets/chat-pattern.svg'
import type { Message } from '../../types'

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

// Ceklis ala Telegram: abu (terkirim) -> biru (sudah dibaca lawan bicara).
// Dibandingkan via cursor lastReadSeq (bukan per-pesan), jadi cocok utk DM.
// Pesan optimistic (belum punya seq asli dari server) selalu tampil abu dulu.
function ReadTicks({ message, readUpToSeq }: { message: Message; readUpToSeq?: string }) {
  const seqNum = message.seq !== undefined ? Number(message.seq) : null
  const cursorNum = readUpToSeq !== undefined ? Number(readUpToSeq) : null
  const isRead = seqNum !== null && cursorNum !== null && seqNum <= cursorNum
  return (
    <span className={isRead ? 'text-sky-300' : 'text-blue-300/60'} title={isRead ? 'Read' : 'Sent'}>
      {isRead ? '✓✓' : '✓'}
    </span>
  )
}

// Context menu untuk bubble TEKS (klik kanan). Saat dibuka, isi pesan
// otomatis ter-select (mirip "Select Text" Virola, tapi langsung aktif
// tanpa langkah tambahan). Menu: Copy as Text, Select Text, Delete (jika milik sendiri).
function TextContextMenu({
  x, y, body, canDelete, onClose, onDelete
}: {
  x: number; y: number; body: string; canDelete: boolean; onClose: () => void; onDelete: () => void
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
    if (left + rect.width + margin > window.innerWidth) {
      left = window.innerWidth - rect.width - margin
    }
    if (top + rect.height + margin > window.innerHeight) {
      top = window.innerHeight - rect.height - margin
    }
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
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        ref={menuRef}
        className="fixed z-50 w-52 bg-gray-800 rounded-xl shadow-xl border border-gray-700 py-1 text-sm"
        style={{ left: pos.left, top: pos.top, visibility: pos.ready ? 'visible' : 'hidden' }}
      >
        <button onClick={handleCopy} className="w-full flex items-center gap-2 px-3 py-2 text-left text-gray-200 hover:bg-gray-700">
          📄 Copy as Text
        </button>
        <button onClick={onClose} className="w-full flex items-center gap-2 px-3 py-2 text-left text-gray-200 hover:bg-gray-700">
          🔲 Select Text
        </button>
        {canDelete && (
          <>
            <div className="border-t border-gray-700 my-1" />
            <button
              onClick={() => { onDelete(); onClose() }}
              className="w-full flex items-center gap-2 px-3 py-2 text-left text-red-400 hover:bg-gray-700"
            >
              🗑️ Delete Message
            </button>
          </>
        )}
      </div>
    </>
  )
}

export default function ChatArea({ onOpenPanel, panelOpen }: { onOpenPanel?: () => void; panelOpen?: boolean }) {
  const { conversations, activeId, messages, sendText, sendImage, loadingMsgs, markRead, readCursors, deleteMessage } = useChatStore()
  const myId = useAuthStore((s) => s.user?.id)
  const [text, setText] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; messageId: string; body: string; mine: boolean } | null>(null)
  const bubbleRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  const raw = activeId ? messages[activeId] ?? [] : []
  const list = useMemo(
    () => [...raw].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [raw]
  )

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [list.length])

  useEffect(() => {
    if (!activeId || list.length === 0) return
    const lastMsg = list[list.length - 1]
    if (lastMsg.seq !== undefined) {
      markRead(activeId, lastMsg.seq)
    }
  }, [activeId, list.length])

  const handleSend = async () => {
    const t = text.trim()
    if (!t) return
    setText('')
    await sendText(t)
  }

  const handlePickFile = () => fileInputRef.current?.click()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      alert('Hanya file gambar yang didukung saat ini.')
      return
    }
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      alert(`Ukuran gambar maksimal ${MAX_IMAGE_MB}MB.`)
      return
    }
    await sendImage(file)
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
    return <div className="flex-1 flex items-center justify-center text-gray-500">Select a conversation to start</div>
  }

  let lastDay = ''
  const activeConv = conversations.find((c) => c.id === activeId)
  const headPartner = activeConv && activeConv.type === 'DIRECT'
    ? activeConv.members.find((m) => m.userId !== myId)?.user
    : undefined
  const headName = activeConv?.title || headPartner?.displayName || headPartner?.username || 'Conversation'
  const headStatus = headPartner?.status
  const headOnline = headStatus === 'AVAILABLE'

  return (
    <div className="flex-1 flex flex-col bg-white min-h-0">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 bg-white flex-shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          {headPartner?.id ? (
            <Avatar userId={headPartner.id} name={headName} className="w-8 h-8 rounded-full flex-shrink-0" />
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
          <svg className="opacity-40 cursor-default" xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m22 8-6 4 6 4V8Z" /><rect width="14" height="12" x="2" y="6" rx="2" /></svg>
          <svg className="opacity-40 cursor-default" xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 3h6v6" /><path d="M9 21H3v-6" /><path d="M21 3l-7 7" /><path d="M3 21l7-7" /></svg>
          <svg className="opacity-40 cursor-default" xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect width="7" height="7" x="3" y="3" rx="1" /><rect width="7" height="7" x="14" y="3" rx="1" /><rect width="7" height="7" x="14" y="14" rx="1" /><rect width="7" height="7" x="3" y="14" rx="1" /></svg>
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
        {loadingMsgs && <div className="text-gray-500 text-sm">Loading messages...</div>}
        {list.map((m: Message) => {
          const mine = m.senderId === myId
          const k = dayKey(m.createdAt)
          const showDate = k !== lastDay
          lastDay = k
          const hasImage = m.type === 'IMAGE' && m.attachments && m.attachments.length > 0
          return (
            <div key={m.id}>
              {showDate && (
                <div className="flex justify-center my-3">
                  <span className="px-3 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">
                    {formatDateSeparator(m.createdAt)}
                  </span>
                </div>
              )}
              <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[70%] ${hasImage ? 'p-1.5' : 'px-3 py-2'} rounded-2xl ${mine ? 'bg-[#e5fbd0] text-gray-900' : 'bg-white text-gray-900 border border-gray-200'}`}
                  onContextMenu={(e) => openTextMenu(e, m)}
                >
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
                    {formatTime(m.createdAt)}
                    {mine && <ReadTicks message={m} readUpToSeq={activeId ? readCursors[activeId] : undefined} />}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {ctxMenu && (
        <TextContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          body={ctxMenu.body}
          canDelete={ctxMenu.mine}
          onClose={() => setCtxMenu(null)}
          onDelete={handleDeleteText}
        />
      )}

      <div className="p-3 border-t border-gray-200 bg-white flex gap-2 flex-shrink-0 items-center">
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        <button
          onClick={handlePickFile}
          title="Send image"
          className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"
        >
          📎
        </button>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-900 rounded-full border border-transparent focus:outline-none focus:border-[#4aa3df] focus:bg-white placeholder-gray-400"
        />
        <button
          onClick={handleSend}
          disabled={!text.trim()}
          className="px-5 py-2.5 bg-[#4aa3df] hover:bg-[#3a92ce] disabled:bg-gray-200 disabled:text-gray-400 text-white font-medium rounded-full transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  )
}
