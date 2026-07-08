import { useChatStore } from '../../stores/chat.store'
import { useAuthStore } from '../../stores/auth.store'
import type { Conversation } from '../../types'
import Avatar from './Avatar'

function initials(name: string): string {
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
}

function partnerOf(c: Conversation, myId?: string) {
  return c.members.find((m) => m.userId !== myId)?.user
}

const STATUS_DOT: Record<string, string> = {
  AVAILABLE: 'bg-green-500',
  AWAY: 'bg-yellow-500',
  DND: 'bg-red-500',
  OFFLINE: 'bg-gray-500'
}
const STATUS_LABEL: Record<string, string> = {
  AVAILABLE: 'Available',
  AWAY: 'Away',
  DND: 'Do not disturb',
  OFFLINE: 'Offline'
}

export default function ContactInfoPanel() {
  const { conversations, activeId } = useChatStore()
  const myId = useAuthStore((s) => s.user?.id)
  const active = conversations.find((c) => c.id === activeId)

  if (!active) {
    return (
      <div className="w-64 flex-shrink-0 border-l border-gray-700 bg-gray-800 flex items-center justify-center p-4">
        <span className="text-gray-500 text-sm text-center">Select a conversation</span>
      </div>
    )
  }

  const isDirect = active.type === 'DIRECT'
  const partner = isDirect ? partnerOf(active, myId) : undefined
  const name = active.title || partner?.displayName || partner?.username || 'Conversation'
  const status = partner?.status
  const avatarUserId = partner?.id

  return (
    <div className="w-64 flex-shrink-0 border-l border-gray-700 bg-gray-800 flex flex-col items-center p-5 overflow-y-auto">
      <div className="relative mb-3">
        {isDirect && avatarUserId ? (
          <Avatar userId={avatarUserId} name={name} className="w-20 h-20 rounded-full flex-shrink-0" />
        ) : (
          <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-semibold flex-shrink-0">
            {initials(name)}
          </div>
        )}
        {isDirect && status && (
          <span className={`absolute right-1 bottom-1 w-4 h-4 rounded-full border-2 border-gray-800 ${STATUS_DOT[status] ?? 'bg-gray-500'}`} />
        )}
      </div>

      <div className="text-white text-base font-medium text-center truncate max-w-full">{name}</div>
      {isDirect && status && (
        <div className="text-gray-400 text-sm mb-1">{STATUS_LABEL[status] ?? status}</div>
      )}

      {isDirect && partner?.jobTitle && (
        <div className="text-gray-300 text-sm mt-2 text-center">{partner.jobTitle}</div>
      )}
      {isDirect && partner?.jobDepartment && (
        <div className="text-gray-500 text-xs text-center">{partner.jobDepartment}</div>
      )}
    </div>
  )
}
