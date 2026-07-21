import ChannelEmptyState from '../common/ChannelEmptyState'

// Section Inbox omnichannel. Saat ini empty-state (Meta belum terhubung).
// Nanti: sidebar tiket + thread + reply, diisi saat backend/channel siap.
export default function InboxSection() {
  return (
    <ChannelEmptyState
      icon={
        <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 12h-6l-2 3h-4l-2-3H2" />
          <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
        </svg>
      }
      title="Inbox omnichannel"
      description="Percakapan WhatsApp, Instagram, dan webchat akan muncul di sini. Hubungkan akun WhatsApp Business untuk mulai menerima pesan."
      ctaLabel="Hubungkan WhatsApp Business"
      onCta={() => {}}
      ctaDisabled
    />
  )
}
