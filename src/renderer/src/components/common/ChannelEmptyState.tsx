interface ChannelEmptyStateProps {
  icon: React.ReactNode
  title: string
  description: string
  ctaLabel?: string
  onCta?: () => void
  ctaDisabled?: boolean
}

// Empty-state generik untuk section omnichannel yang belum terhubung ke Meta.
// Dipakai Inbox, Broadcast, Templates, Analytics saat kredensial Meta belum ada.
export default function ChannelEmptyState({
  icon,
  title,
  description,
  ctaLabel,
  onCta,
  ctaDisabled
}: ChannelEmptyStateProps) {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="flex flex-col items-center text-center gap-4 max-w-sm">
        <div className="w-16 h-16 rounded-2xl bg-gray-800 flex items-center justify-center text-gray-500">
          {icon}
        </div>
        <h2 className="text-white text-lg font-semibold">{title}</h2>
        <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
        {ctaLabel && (
          <button
            onClick={onCta}
            disabled={ctaDisabled}
            className="mt-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm rounded-lg"
          >
            {ctaLabel}
          </button>
        )}
        {ctaDisabled && (
          <p className="text-gray-600 text-xs">Fitur aktif setelah WhatsApp Business terhubung.</p>
        )}
      </div>
    </div>
  )
}
