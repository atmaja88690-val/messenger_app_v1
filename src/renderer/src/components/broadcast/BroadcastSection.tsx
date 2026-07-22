import ChannelEmptyState from '../common/ChannelEmptyState'

// Section Broadcast. Empty-state sampai WABA + template Meta siap.
export default function BroadcastSection() {
  return (
    <ChannelEmptyState
      icon={
        <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="m3 11 18-5v12L3 14v-3z" />
          <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
        </svg>
      }
      title="Broadcast WhatsApp"
      description="Kirim pesan template resmi ke ribuan kontak secara bertahap dan aman. Hubungkan WhatsApp Business dan ajukan template untuk memulai campaign."
      ctaLabel="Hubungkan WhatsApp Business"
      onCta={() => {}}
      ctaDisabled
    />
  )
}
