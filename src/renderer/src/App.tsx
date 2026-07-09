import { useEffect, useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useAuthStore } from './stores/auth.store'
import Sidebar from './components/chat/Sidebar'
import ChatArea from './components/chat/ChatArea'
import ContactInfoPanel from './components/chat/ContactInfoPanel'
import NewUserDialog from './components/users/NewUserDialog'
import SettingsDialog from './components/settings/SettingsDialog'

function App() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const bootstrapped = useRef(false)
  const [showNewUser, setShowNewUser] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
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
        <span className="font-semibold">BSI Messenger</span>
        <div className="flex items-center gap-3 text-sm text-gray-400">
          <span>{user?.displayName ?? user?.username ?? '...'}</span>
          <button onClick={handleLogout} className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-md text-white">
            Log out
          </button>
        </div>
      </div>
      <div className="flex-1 flex min-h-0">
        <Sidebar onOpenSettings={() => setShowSettings(true)} />
        <ChatArea onOpenPanel={() => setShowPanel(true)} panelOpen={showPanel || isNarrow} />
        {showPanel && !isNarrow && <ContactInfoPanel onClose={() => setShowPanel(false)} />}
      </div>

      {showNewUser && <NewUserDialog onClose={() => setShowNewUser(false)} />}
      {showSettings && <SettingsDialog onClose={() => setShowSettings(false)} />}
    </div>
  )
}

export default App
