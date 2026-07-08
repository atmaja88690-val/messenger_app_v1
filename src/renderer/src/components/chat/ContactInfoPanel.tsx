import { useState } from 'react'
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

interface Props {
  onClose?: () => void
}

export default function ContactInfoPanel({ onClose }: Props) {
  const { conversations, activeId } = useChatStore()
  const myId = useAuthStore((s) => s.user?.id)
  const active = conversations.find((c) => c.id === activeId)
  const [nudgeHint, setNudgeHint] = useState(false)

  if (!active) {
    return (
      <div className="w-72 flex-shrink-0 border-l border-gray-800 bg-[#0f1621] flex items-center justify-center p-4">
        <span className="text-gray-500 text-sm text-center">Select a conversation</span>
      </div>
    )
  }

  const isDirect = active.type === 'DIRECT'
  const partner = isDirect ? partnerOf(active, myId) : undefined
  const name = active.title || partner?.displayName || partner?.username || 'Conversation'
  const status = partner?.status
  const avatarUserId = partner?.id
  const accountType = partner?.accountType

  const handleNudge = () => {
    setNudgeHint(true)
    setTimeout(() => setNudgeHint(false), 2200)
  }

  return (
    <div className="w-72 flex-shrink-0 border-l border-gray-800 bg-[#0f1621] flex flex-col overflow-y-auto">
      <div className="flex justify-end p-3">
        <button
          type="button"
          onClick={() => onClose?.()}
          aria-label="Close panel"
          className="text-gray-500 hover:text-white transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18" /><path d="m6 6 12 12" />
          </svg>
        </button>
      </div>

      <div className="flex flex-col items-center px-5 pb-4">
        <div className="relative mb-3">
          {isDirect && avatarUserId ? (
            <Avatar userId={avatarUserId} name={name} className="w-24 h-24 rounded-full flex-shrink-0" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center text-white text-3xl font-semibold flex-shrink-0">
              {initials(name)}
            </div>
          )}
          {isDirect && status && (
            <span className={`absolute right-1.5 bottom-1.5 w-4 h-4 rounded-full border-2 border-[#0f1621] ${STATUS_DOT[status] ?? 'bg-gray-500'}`} />
          )}
        </div>
        <div className="text-white text-lg font-medium text-center truncate max-w-full">{name}</div>
        {isDirect && status && (
          <div className="text-gray-400 text-sm">{STATUS_LABEL[status] ?? status}</div>
        )}
      </div>

      <div className="px-4 py-3 border-t border-gray-800 flex flex-col gap-1">
        <button type="button" className="flex items-center gap-3 px-2 py-2.5 rounded-lg text-gray-200 hover:bg-gray-800/60 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
          </svg>
          <span className="text-sm">User profile</span>
        </button>
        <button type="button" onClick={handleNudge} className="flex items-center gap-3 px-2 py-2.5 rounded-lg text-gray-200 hover:bg-gray-800/60 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
          </svg>
          <span className="text-sm">Send nudge</span>
        </button>
        {nudgeHint && (
          <div className="px-2 text-xs text-gray-500">Nudge segera hadir</div>
        )}
      </div>

      <div className="px-6 py-4 border-t border-gray-800 flex flex-col gap-4">
        {isDirect && status && (
          <div>
            <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-1.5">Status</div>
            <div className="flex items-center gap-2 text-sm text-gray-200">
              <span className={`w-2 h-2 rounded-full ${STATUS_DOT[status] ?? 'bg-gray-500'}`} />
              {STATUS_LABEL[status] ?? status}
            </div>
          </div>
        )}
        {isDirect && accountType && (
          <div>
            <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-1.5">Tipe akun</div>
            <div className="text-sm text-gray-200">{accountType}</div>
          </div>
        )}
        {isDirect && partner?.jobTitle && (
          <div>
            <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-1.5">Jabatan</div>
            <div className="text-sm text-gray-200">{partner.jobTitle}</div>
            {partner.jobDepartment && <div className="text-xs text-gray-500">{partner.jobDepartment}</div>}
          </div>
        )}
      </div>
    </div>
  )
}
