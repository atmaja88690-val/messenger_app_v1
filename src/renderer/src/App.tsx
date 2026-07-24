import { useEffect, useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useAuthStore } from './stores/auth.store'
import Sidebar from './components/chat/Sidebar'
import ChatArea from './components/chat/ChatArea'
import ContactInfoPanel from './components/chat/ContactInfoPanel'
import InboxSection from './components/inbox/InboxSection'
import BroadcastSection from './components/broadcast/BroadcastSection'
import TemplatesSection from './components/templates/TemplatesSection'
import AnalyticsSection from './components/analytics/AnalyticsSection'
import NewUserDialog from './components/users/NewUserDialog'
import SettingsDialog from './components/settings/SettingsDialog'
import UserProfileDialog from './components/users/UserProfileDialog'
import AboutDialog from './components/settings/AboutDialog'

type Section = 'chats' | 'inbox' | 'broadcast' | 'templates' | 'analytics'

const SECTIONS: { id: Section; label: string }[] = [
  { id: 'chats', label: 'Chats' },
  { id: 'inbox', label: 'Inbox' },
  { id: 'broadcast', label: 'Broadcast' },
  { id: 'templates', label: 'Templates' },
  { id: 'analytics', label: 'Analytics' }
]

function App() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const bootstrapped = useRef(false)
  const [showNewUser, setShowNewUser] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showAbout, setShowAbout] = useState(false)
  const [activeSection, setActiveSection] = useState<Section>('chats')
  // Mobile (<md): tampilkan SATU view bergantian (daftar <-> ruang chat).
  // Desktop abaikan ini (kolom tampil berdampingan lewat breakpoint md:).
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list')
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const [showPanel, setShowPanel] = useState(true)
  const [isNarrow, setIsNarrow] = useState(() => window.innerWidth < 1100)

  // Panel kanan auto-hide saat window sempit (<1100px) supaya 3 kolom tidak
  // memaksa scroll horizontal. Listener di-cleanup agar tidak menumpuk saat HMR.
  useEffect(() => {
    const onResize = () => setIsNarrow(window.innerWidth < 1100)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    if (!menuOpen) return
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [menuOpen])

  useEffect(() => {
    if (bootstrapped.current) return
    bootstrapped.current = true
    const s = useAuthStore.getState()
    if (!s.isAuthenticated && !s.user && localStorage.getItem('bsi_access_token')) {
      s.loadMe()
    }
  }, [])

  // Listener menu native (main process) → buka dialog New User.
  // onNewUser mengembalikan fungsi unsubscribe — wajib di-cleanup agar
  // listener tidak menumpuk saat HMR (pola sama dengan ws.service).
  useEffect(() => {
    const unsubscribe = window.api?.onNewUser?.(() => setShowNewUser(true))
    return () => unsubscribe?.()
  }, [])

  useEffect(() => {
    const unsubscribe = window.api?.onSettings?.(() => setShowSettings(true))
    return () => unsubscribe?.()
  }, [])

  useEffect(() => {
    const unsubscribe = window.api?.onMyProfile?.(() => setShowProfile(true))
    return () => unsubscribe?.()
  }, [])

  useEffect(() => {
    const unsubscribe = window.api?.onAbout?.(() => setShowAbout(true))
    return () => unsubscribe?.()
  }, [])

  useEffect(() => {
    const unsubscribe = window.api?.onLogout?.(() => {
      handleLogout()
    })
    return () => unsubscribe?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleLogout = async () => {
    await logout()
    navigate({ to: '/login' })
  }

  return (
    <div className="flex flex-col w-full h-full bg-gray-900 text-white">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-700 flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          {/* Menu section (hamburger) -- menggantikan dropdown select */}
          <div ref={menuRef} className="relative flex-shrink-0">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Menu"
              className="p-1.5 rounded-md hover:bg-gray-700 text-gray-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6h16" /><path d="M4 12h16" /><path d="M4 18h16" /></svg>
            </button>
            {menuOpen && (
              <div className="absolute left-0 top-full mt-1 w-44 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-30 py-1">
                {SECTIONS.map((sec) => (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => { setActiveSection(sec.id); setMenuOpen(false) }}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                      activeSection === sec.id ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    {sec.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <span className="font-semibold truncate">BSI Messenger</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400 flex-shrink-0">
          {user?.accountType === 'ADMIN' && (
            <button
              onClick={() => navigate({ to: '/admin' })}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-md text-white"
            >
              Admin
            </button>
          )}
          <span className="hidden sm:inline truncate max-w-[10rem]">
            {user?.displayName ?? user?.username ?? '...'}
          </span>
          <button
            onClick={handleLogout}
            aria-label="Log out"
            title="Log out"
            className="p-1.5 rounded-md bg-gray-700 hover:bg-gray-600 text-white flex-shrink-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m16 17 5-5-5-5" /><path d="M21 12H9" /><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /></svg>
          </button>
        </div>
      </div>
      <div className="flex-1 flex min-h-0">
        {activeSection === 'chats' ? (
          <>
            <Sidebar
              onOpenSettings={() => setShowSettings(true)}
              mobileHidden={mobileView === 'chat'}
              onSelectConversation={() => setMobileView('chat')}
            />
            <ChatArea
              onOpenPanel={() => setShowPanel(true)}
              panelOpen={showPanel || isNarrow}
              mobileHidden={mobileView === 'list'}
              onBackToList={() => setMobileView('list')}
            />
            {showPanel && !isNarrow && <ContactInfoPanel onClose={() => setShowPanel(false)} />}
          </>
        ) : activeSection === 'inbox' ? (
          <InboxSection />
        ) : activeSection === 'broadcast' ? (
          <BroadcastSection />
        ) : activeSection === 'templates' ? (
          <TemplatesSection />
        ) : (
          <AnalyticsSection />
        )}
      </div>

      {showNewUser && <NewUserDialog onClose={() => setShowNewUser(false)} />}
      {showSettings && <SettingsDialog onClose={() => setShowSettings(false)} />}
      {showProfile && <UserProfileDialog onClose={() => setShowProfile(false)} />}
      {showAbout && <AboutDialog onClose={() => setShowAbout(false)} />}
    </div>
  )
}

export default App
