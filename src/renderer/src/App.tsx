import { useEffect, useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useAuthStore, restoreAuthTokensFromPreferences } from './stores/auth.store'
import { waitForServer } from './services/server-breath.service'
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
import AppMenu from './components/AppMenu'
import { callUi } from './platform'
import type { CallUiEvent, IncomingCallDescriptor } from './platform'
import { registerPushAndroid } from './services/push-android.service'
import { requestBatteryOptimizationExemption } from './services/battery-optimization.service'
import { useChatStore } from './stores/chat.store'
import { initCallBridge, useCallStore } from './stores/call.store'
import type { CallType, WsCallIncomingPayload } from './types'

// Listener call didaftarkan sekali di level modul, SEBELUM WS tersambung.
// Di dalam komponen akan terdaftar ulang tiap remount/HMR.
initCallBridge()

// Adapter memberi bentuk netral platform; infra call yang SUDAH ADA menerima
// WsCallIncomingPayload. sdp kosong disengaja -- SFU tidak memakainya (lihat
// call.service.ts onAccepted), dipertahankan agar kontrak store tidak berubah.
function toWsPayload(call: IncomingCallDescriptor): WsCallIncomingPayload {
  return {
    callId: call.callId,
    conversationId: call.conversationId,
    callType: call.callType as CallType,
    sdp: {} as RTCSessionDescriptionInit,
    from: { id: call.callerId, displayName: call.callerName }
  }
}

type Section = 'chats' | 'inbox' | 'broadcast' | 'templates' | 'analytics'


function App() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const bootstrapped = useRef(false)
  const [showNewUser, setShowNewUser] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showAbout, setShowAbout] = useState(false)
  const [activeSection] = useState<Section>('chats')
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

  // Urutannya disengaja: token dipulihkan dulu, lalu TUNGGU server menyatakan
  // dirinya terjangkau, baru minta data. Tanpa gerbang ini, permintaan pertama
  // menabrak proxy lokal yang belum bisa menjangkau hulunya dan dijawab 502 --
  // lalu layar terkunci sampai ada yang menekan Retry.
  useEffect(() => {
    if (bootstrapped.current) return
    bootstrapped.current = true
  
    const boot = async (): Promise<void> => {
      await restoreAuthTokensFromPreferences()
      if (!localStorage.getItem('bsi_access_token')) return
      if (useAuthStore.getState().user) return
      await waitForServer((n, d) =>
        console.warn(`[napas] server belum menjawab, ulang ${d}ms (ke-${n})`)
      )
      await useAuthStore.getState().loadMe()
    }
    void boot()
  
    // Windows melaporkan jaringan kembali -> jangan tunggu jeda berikutnya.
    const onOnline = (): void => {
      void boot()
      const c = useChatStore.getState()
      if (c.convosError) void c.loadConversations()
    }
    window.addEventListener('online', onOnline)
    return () => window.removeEventListener('online', onOnline)
  }, [])

  // Register FCM push (Android saja; NO-OP di Electron via guard di service).
  useEffect(() => {
    if (user) {
      registerPushAndroid()
      requestBatteryOptimizationExemption()
    }
  }, [user])

  // SATU pintu masuk untuk semua peristiwa UI panggilan. Menggantikan LIMA
  // useEffect terpisah yang sebelumnya menduplikasi blok yang sama tiga kali
  // (bangun payload -> selectConversation -> setMobileView -> acceptIncoming).
  // Komponen ini tidak lagi tahu-menahu soal plugin native; adapter platform
  // yang menerjemahkan mekanisme tiap OS menjadi peristiwa yang sama.
  useEffect(() => {
    if (!user || !callUi.supported) return

    const off = callUi.on((e: CallUiEvent) => {
      if (e.kind === 'answered') {
        // Buka percakapan pemanggil + tampilkan area chat DULU supaya CallOverlay
        // (dirender di dalam ChatArea) terlihat. Di mobile, view 'list'
        // menyembunyikan ChatArea -> call UI tak tampak walau sudah tersambung.
        useChatStore.getState().selectConversation(e.call.conversationId)
        setMobileView('chat')
        void useCallStore.getState().acceptIncoming(toWsPayload(e.call))
        return
      }
      if (e.kind === 'ringing') {
        // Tampilkan layar DERING (Accept/Decline), BUKAN auto-accept.
        useCallStore.getState().incoming(toWsPayload(e.call))
        return
      }
      if (e.kind === 'openConversation') {
        useChatStore.getState().selectConversation(e.conversationId)
        setMobileView('chat')
        return
      }
      if (e.kind === 'muteRequested') {
        // CallKit mengirim nilai ABSOLUT, sedangkan store hanya punya toggle.
        // Bandingkan dulu supaya keadaan yang sudah benar tidak ikut dibalik.
        const st = useCallStore.getState()
        if (st.micOn === !e.muted) return
        st.toggleMic()
        return
      }
      // 'declined' dan 'ended' BELUM diemisikan adapter Android -- keduanya
      // disiapkan untuk CallKit, yang memberitahu kita lewat delegate.
      if (e.kind === 'declined') useCallStore.getState().reject()
      if (e.kind === 'ended') useCallStore.getState().hangup()
    })

    void callUi.start()
    return () => {
      off()
      void callUi.stop()
    }
  }, [user])





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
          {/* Menu aplikasi (hamburger) — File/View/Tools/Help */}
          <AppMenu
            onSettings={() => setShowSettings(true)}
            onProfile={() => setShowProfile(true)}
            onAbout={() => setShowAbout(true)}
            onLogout={handleLogout}
          />
          <span className="font-semibold truncate">BSI Messenger</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400 flex-shrink-0">
          {(user?.accountType === 'ADMIN' || user?.accountType === 'MODERATOR') && (
            <button
              onClick={() => navigate({ to: '/admin' })}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-md text-white"
            >
              Admin
            </button>
          )}
          {user?.accountType === 'MODERATOR' && (
            <button
              onClick={() => navigate({ to: '/dbadmin' })}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-md text-white"
            >
              DB Admin
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
