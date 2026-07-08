import { useEffect, useState, useRef } from 'react'
import { useChatStore } from '../../stores/chat.store'
import { useAuthStore } from '../../stores/auth.store'
import type { Conversation, ConversationMember } from '../../types'
import Avatar from './Avatar'

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

export default function Sidebar({ onOpenSettings }: { onOpenSettings?: () => void }) {
  const { conversations, activeId, loadConversations, selectConversation, loadingConvos } = useChatStore()
  const myId = useAuthStore((s) => s.user?.id)
  const me = useAuthStore((s) => s.user)
  const [query, setQuery] = useState('')
  const [historyOpen, setHistoryOpen] = useState(false)
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
  const filtered = q
    ? conversations.filter((c) => convName(c, myId).toLowerCase().includes(q))
    : conversations
  const directConvos = filtered.filter((c) => c.type === 'DIRECT')
  const groupConvos = filtered.filter((c) => c.type !== 'DIRECT')
  const recentRooms = conversations.slice(0, 6)

  const meStatus = me?.status ?? 'AVAILABLE'

  const renderItem = (c: Conversation) => {
    const name = convName(c, myId)
    const active = c.id === activeId
    const otherM = c.type === 'DIRECT' ? otherMember(c, myId) : undefined
    return (
      <button
        key={c.id}
        onClick={() => selectConversation(c.id)}
        className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors border-l-[3px] ${
          active ? 'bg-[#f0f7fc] border-[#4aa3df]' : 'border-transparent hover:bg-gray-50'
        }`}
      >
        {otherM ? (
          <Avatar userId={otherM.userId} name={name} className="w-10 h-10 rounded-full flex-shrink-0" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-[#4aa3df] flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
            {initials(name)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="text-gray-900 text-sm font-medium truncate">{name}</div>
          <div className="text-gray-500 text-xs truncate">
            {c.lastMessage?.body ?? 'No messages yet'}
          </div>
        </div>
      </button>
    )
  }

  return (
    <div className="w-72 flex-shrink-0 border-r border-gray-200 bg-white flex flex-col">
      <div className="px-3 py-3 border-b border-gray-100 flex items-center gap-3">
        <div className="relative flex-shrink-0">
          {me?.id ? (
            <Avatar userId={me.id} name={me.displayName || me.username || 'Saya'} className="w-9 h-9 rounded-full flex-shrink-0" />
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

      <div className="px-3 py-2 flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1.5">
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 flex-shrink-0"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none min-w-0"
          />
        </div>
        <div ref={historyRef} className="relative flex items-center gap-3 text-gray-400">
          <button type="button" onClick={() => onOpenSettings?.()} aria-label="Settings" className="hover:text-gray-700 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
          </button>
          <button type="button" onClick={() => setHistoryOpen((v) => !v)} aria-label="Room history" className="hover:text-gray-700 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v5h5" /><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" /><path d="M12 7v5l4 2" /></svg>
          </button>
          {historyOpen && (
            <div className="absolute right-0 top-full mt-1 w-56 max-h-80 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
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
                    onClick={() => { selectConversation(c.id); setHistoryOpen(false) }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-gray-50 transition-colors"
                  >
                    {otherM ? (
                      <Avatar userId={otherM.userId} name={name} className="w-7 h-7 rounded-full flex-shrink-0" />
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

      <div className="flex-1 overflow-y-auto">
        {loadingConvos && <div className="p-4 text-gray-400 text-sm">Loading...</div>}
        {!loadingConvos && conversations.length === 0 && (
          <div className="p-4 text-gray-400 text-sm">No conversations yet</div>
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
    </div>
  )
}
