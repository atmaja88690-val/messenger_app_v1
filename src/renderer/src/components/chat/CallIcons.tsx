import React from 'react'

const C = 'h-6 w-6'
const P = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, className: C, 'aria-hidden': true }

export function IconMic(): React.JSX.Element {
  return (
    <svg {...P}>
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  )
}

export function IconMicOff(): React.JSX.Element {
  return (
    <svg {...P}>
      <line x1="2" x2="22" y1="2" y2="22" />
      <path d="M18.9 13.2A7 7 0 0 0 19 12v-2" />
      <path d="M5 10v2a7 7 0 0 0 12 5" />
      <path d="M15 9.3V5a3 3 0 0 0-5.7-1.3" />
      <path d="M9 9v3a3 3 0 0 0 5.1 2.1" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  )
}

export function IconVideo(): React.JSX.Element {
  return (
    <svg {...P}>
      <path d="m22 8-6 4 6 4V8Z" />
      <rect width="14" height="12" x="2" y="6" rx="2" ry="2" />
    </svg>
  )
}

export function IconVideoOff(): React.JSX.Element {
  return (
    <svg {...P}>
      <path d="M10.7 6H14a2 2 0 0 1 2 2v2.3l1 1L22 8v8" />
      <path d="M16 16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2l10 10Z" />
      <line x1="2" x2="22" y1="2" y2="22" />
    </svg>
  )
}

export function IconPhoneOff(): React.JSX.Element {
  return (
    <svg {...P}>
      <path d="M11 13a16 16 0 0 0 3.4 2.6l1.3-1.3a2 2 0 0 1 2.1-.4 13 13 0 0 0 2.8.7 2 2 0 0 1 1.7 2v3a2 2 0 0 1-2.2 2A20 20 0 0 1 4.6 8.5 2 2 0 0 1 6.6 6h3a2 2 0 0 1 2 1.7 13 13 0 0 0 .7 2.8 2 2 0 0 1-.5 2.1L11 13Z" />
      <line x1="2" x2="22" y1="2" y2="22" />
    </svg>
  )
}

export function IconSpeaker(): React.JSX.Element {
  return (
    <svg {...P}>
      <path d="M11 5 6 9H2v6h4l5 4V5Z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7" />
      <path d="M18.5 5.5a9 9 0 0 1 0 13" />
    </svg>
  )
}

export function IconEarpiece(): React.JSX.Element {
  return (
    <svg {...P}>
      <path d="M11 5 6 9H2v6h4l5 4V5Z" />
      <line x1="22" x2="16" y1="9" y2="15" />
      <line x1="16" x2="22" y1="9" y2="15" />
    </svg>
  )
}
