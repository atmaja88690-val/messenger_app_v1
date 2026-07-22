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

function App() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const bootstrapped = useRef(false)
  const [showNewUser, setShowNewUser] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showAbout, setShowAbout] = useState(false)
  const [activeSection, setActiveSection] = useState<'chats' | 'inbox' | 'broadcast' | 'templates' | 'analytics'>('chats')
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
    const unsubscribe = window.api.onNewUser(() => setShowNewUser(true))
    return unsubscribe
  }, [])

  useEffect(() => {
    const unsubscribe = window.api.onSettings(() => setShowSettings(true))
    return unsubscribe
  }, [])

  useEffect(() => {
    const unsubscribe = window.api.onMyProfile(() => setShowProfile(true))
    return unsubscribe
  }, [])

  useEffect(() => {
    const unsubscribe = window.api.onAbout(() => setShowAbout(true))
    return unsubscribe
  }, [])

  useEffect(() => {
    const unsubscribe = window.api.onLogout(() => {
      handleLogout()
    })
    return unsubscribe
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleLogout = async () => {
    await logout()
    navigate({ to: '/login' })
  }

  return (
    <div className="flex flex-col w-full h-full bg-gray-900 text-white">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-700 flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-semibold">BSI Messenger</span>
          <select
            value={activeSection}
            onChange={(e) => setActiveSection(e.target.value as typeof activeSection)}
            className="bg-gray-700 text-white text-sm rounded-md px-2 py-1 outline-none cursor-pointer hover:bg-gray-600"
          >
            <option value="chats">Chats</option>
            <option value="inbox">Inbox</option>
            <option value="broadcast">Broadcast</option>
            <option value="templates">Templates</option>
            <option value="analytics">Analytics</option>
          </select>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-400">
          {user?.accountType === 'ADMIN' && (
            <button
              onClick={() => navigate({ to: '/admin' })}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-md text-white"
            >
              Admin
            </button>
          )}
          <span>{user?.displayName ?? user?.username ?? '...'}</span>
          <button onClick={handleLogout} className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-md text-white">
            Log out
          </button>
        </div>
      </div>
      <div className="flex-1 flex min-h-0">
        {activeSection === 'chats' ? (
          <>
            <Sidebar onOpenSettings={() => setShowSettings(true)} />
            <ChatArea onOpenPanel={() => setShowPanel(true)} panelOpen={showPanel || isNarrow} />
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
