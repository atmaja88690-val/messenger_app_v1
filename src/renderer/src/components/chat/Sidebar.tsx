import { useEffect } from 'react'
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

export default function Sidebar() {
  const { conversations, activeId, loadConversations, selectConversation, loadingConvos } = useChatStore()
  const myId = useAuthStore((s) => s.user?.id)
  const me = useAuthStore((s) => s.user)

  useEffect(() => {
    loadConversations()
  }, [])

  return (
    <div className="w-72 flex-shrink-0 border-r border-gray-700 bg-gray-800 flex flex-col">
      <div className="px-3 py-3 border-b border-gray-700 flex items-center gap-3">
        <div className="relative flex-shrink-0">
          <Avatar userId={me?.id ?? ''} name={me?.displayName || me?.username || 'Saya'} className="w-9 h-9 rounded-full flex-shrink-0" />
          <span className={`absolute -right-0.5 -bottom-0.5 w-3 h-3 rounded-full border-2 border-gray-800 ${
            (me?.status ?? 'AVAILABLE') === 'AVAILABLE' ? 'bg-green-500'
            : (me?.status === 'AWAY' ? 'bg-yellow-500'
            : (me?.status === 'DND' ? 'bg-red-500' : 'bg-gray-500'))
          }`} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-white text-sm font-medium truncate">{me?.displayName || me?.username || 'Saya'}</div>
          <div className="text-gray-400 text-xs truncate">{
            (me?.status ?? 'AVAILABLE') === 'AVAILABLE' ? 'Available'
            : (me?.status === 'AWAY' ? 'Away'
            : (me?.status === 'DND' ? 'Do not disturb' : 'Offline'))
          }</div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {loadingConvos && <div className="p-4 text-gray-500 text-sm">Loading...</div>}
        {!loadingConvos && conversations.length === 0 && (
          <div className="p-4 text-gray-500 text-sm">No conversations yet</div>
        )}
        {conversations.map((c) => {
          const name = convName(c, myId)
          const active = c.id === activeId
          const otherM = c.type === 'DIRECT' ? otherMember(c, myId) : undefined
          return (
            <button
              key={c.id}
              onClick={() => selectConversation(c.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-700/50 transition-colors ${
                active ? 'bg-gray-700' : ''
              }`}
            >
              {otherM ? (
                <Avatar userId={otherM.userId} name={name} className="w-10 h-10 rounded-full flex-shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                  {initials(name)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="text-white text-sm font-medium truncate">{name}</div>
                <div className="text-gray-400 text-xs truncate">
                  {c.lastMessage?.body ?? 'No messages yet'}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
