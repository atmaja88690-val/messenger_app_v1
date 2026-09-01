import React, { useEffect, useRef, useState } from 'react'

interface AppMenuItem {
  label: string
  onClick: () => void
  divider?: boolean
}

interface AppMenuProps {
  onSettings: () => void
  onProfile: () => void
  onAbout: () => void
  onLogout: () => void
}

// Menu aplikasi (hamburger) — menggantikan menu native File/View/Tools/Help.
// Aksi memakai handler yang sudah ada di App; DevTools hanya saat dev.
export default function AppMenu({ onSettings, onProfile, onAbout, onLogout }: AppMenuProps): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent): void => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const run = (fn: () => void) => () => {
    setOpen(false)
    fn()
  }

  const items: AppMenuItem[] = [
    { label: 'Settings', onClick: run(onSettings) },
    { label: 'My User Profile', onClick: run(onProfile) },
    { label: 'Reload', onClick: run(() => window.location.reload()), divider: true },
    { label: 'About NNI Messenger', onClick: run(onAbout), divider: true },
    { label: 'Logout', onClick: run(onLogout), divider: true }
  ]

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Menu"
        className="p-1.5 rounded-md hover:bg-gray-700 text-gray-200"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6h16" /><path d="M4 12h16" /><path d="M4 18h16" /></svg>
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 w-52 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-30 py-1">
          {items.map((it) => (
            <div key={it.label}>
              {it.divider && <div className="my-1 border-t border-gray-700" />}
              <button
                type="button"
                onClick={it.onClick}
                className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors"
              >
                {it.label}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
