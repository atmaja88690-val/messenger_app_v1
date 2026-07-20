import Avatar from './Avatar'
import type { User } from '../../types'

interface PartnerProfileDialogProps {
  partner: User
  onClose: () => void
}

const STATUS_LABEL: Record<string, string> = {
  AVAILABLE: 'Available',
  AWAY: 'Away',
  DND: 'Do not disturb',
  OFFLINE: 'Offline'
}
const STATUS_DOT: Record<string, string> = {
  AVAILABLE: 'bg-green-500',
  AWAY: 'bg-yellow-500',
  DND: 'bg-red-500',
  OFFLINE: 'bg-gray-400'
}

// Modal read-only detail user lain. Hanya field yang pasti ada:
// displayName, username, status, avatar. Data dari partner (member.user).
export default function PartnerProfileDialog({ partner, onClose }: PartnerProfileDialogProps) {
  const name = partner.displayName || partner.username || 'User'
  const status = partner.status

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-lg p-6 w-[320px] flex flex-col items-center gap-3 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative">
          <Avatar
            userId={partner.id}
            name={name}
            avatarKey={partner.avatarKey}
            className="w-20 h-20 rounded-full flex-shrink-0"
          />
          {status && (
            <span className={`absolute right-1 bottom-1 w-4 h-4 rounded-full border-2 border-white ${STATUS_DOT[status] ?? 'bg-gray-400'}`} />
          )}
        </div>

        <div className="text-gray-900 text-lg font-medium text-center">{name}</div>
        <div className="text-gray-500 text-sm">@{partner.username}</div>

        {status && (
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <span className={`w-2 h-2 rounded-full ${STATUS_DOT[status] ?? 'bg-gray-400'}`} />
            {STATUS_LABEL[status] ?? status}
          </div>
        )}

        <button
          onClick={onClose}
          className="mt-2 px-5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded"
        >
          Close
        </button>
      </div>
    </div>
  )
}
