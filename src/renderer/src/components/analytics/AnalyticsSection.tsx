import ChannelEmptyState from '../common/ChannelEmptyState'

// Section Analytics. Empty-state sampai ada data channel/campaign.
export default function AnalyticsSection() {
  return (
    <ChannelEmptyState
      icon={
        <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 3v18h18" />
          <path d="M18 17V9" />
          <path d="M13 17V5" />
          <path d="M8 17v-3" />
        </svg>
      }
      title="Analytics & Laporan"
      description="Track open rate, reply rate, agent performance, and broadcast campaign results. Data appears once a channel is connected and there is activity."
      ctaLabel="Connect WhatsApp Business"
      onCta={() => {}}
      ctaDisabled
    />
  )
}
