import ChannelEmptyState from '../common/ChannelEmptyState'

// Section Templates (pesan template Meta). Empty-state sampai WABA siap.
export default function TemplatesSection() {
  return (
    <ChannelEmptyState
      icon={
        <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
          <path d="M14 2v6h6" />
          <path d="M8 13h8" />
          <path d="M8 17h5" />
        </svg>
      }
      title="Template Pesan"
      description="Kelola template pesan WhatsApp yang disetujui Meta (UTILITY, MARKETING, AUTHENTICATION). Template diperlukan untuk pesan keluar di luar jendela 24 jam."
      ctaLabel="Hubungkan WhatsApp Business"
      onCta={() => {}}
      ctaDisabled
    />
  )
}
