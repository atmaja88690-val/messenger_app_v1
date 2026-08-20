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
import AppMenu from './components/AppMenu'
import { Capacitor, registerPlugin } from '@capacitor/core'
import { registerPushAndroid } from './services/push-android.service'
import { requestBatteryOptimizationExemption } from './services/battery-optimization.service'
import { useChatStore } from './stores/chat.store'
import { initCallBridge, useCallStore } from './stores/call.store'
import type { CallType, WsCallIncomingPayload } from './types'

// Listener call didaftarkan sekali di level modul, SEBELUM WS tersambung.
// Di dalam komponen akan terdaftar ulang tiap remount/HMR.
initCallBridge()

interface IncomingCallResult {
  pending: boolean
  callId?: string
  callType?: string
  conversationId?: string
  callerId?: string
  callerName?: string
}
interface IncomingCallPlugin {
  consumePendingCall(): Promise<IncomingCallResult>
  consumePendingOpenConversation(): Promise<{ pending: boolean; conversationId?: string }>
  consumePendingRingingCall(): Promise<IncomingCallResult>
  stopIncomingRing(): Promise<void>
  addListener(
    eventName: 'answerNow',
    listenerFunc: () => void
  ): Promise<{ remove: () => Promise<void> }>
}
const IncomingCall = registerPlugin<IncomingCallPlugin>('IncomingCall')

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

  useEffect(() => {
    if (bootstrapped.current) return
    bootstrapped.current = true
    const s = useAuthStore.getState()
    if (!s.isAuthenticated && !s.user && localStorage.getItem('bsi_access_token')) {
      s.loadMe()
    }
  }, [])

  // Register FCM push (Android saja; NO-OP di Electron via guard di service).
  useEffect(() => {
    if (user) {
      registerPushAndroid()
      requestBatteryOptimizationExemption()
    }
  }, [user])

  // Fase B: app dibuka dari full-screen intent notif call (BsimMessagingService)
  // - baik cold start maupun dari lockscreen. Sekali per user-loaded (gate auth,
  // pola sama dgn registerPushAndroid di atas), baca data call tertunda dari
  // native lalu sintesis payload persis bentuk WsCallIncomingPayload (sdp dummy,
  // TAK dipakai di SFU - lihat call.service.ts onAccepted), pakai infra call yg
  // SUDAH ADA (incoming+accept), bukan jalur baru.
  useEffect(() => {
    if (!user || !Capacitor.isNativePlatform()) return
    IncomingCall.consumePendingCall()
      .then(async (r) => {
        if (!r.pending || !r.callId || !r.callType || !r.conversationId || !r.callerId) return
        const payload: WsCallIncomingPayload = {
          callId: r.callId,
          conversationId: r.conversationId,
          callType: r.callType as CallType,
          sdp: {} as RTCSessionDescriptionInit,
          from: { id: r.callerId, displayName: r.callerName ?? 'Someone' }
        }
        // Buka percakapan pemanggil + tampilkan area chat DULU supaya CallOverlay
        // (dirender di dalam ChatArea) terlihat. Di mobile, view 'list'
        // menyembunyikan ChatArea -> call UI tak tampak walau sudah tersambung.
        useChatStore.getState().selectConversation(r.conversationId)
        setMobileView('chat')
        await useCallStore.getState().acceptIncoming(payload)
      })
      .catch((err) => console.error('[IncomingCall] consumePendingCall gagal:', err))
  }, [user])

  useEffect(() => {
    if (!user || !Capacitor.isNativePlatform()) return
    IncomingCall.consumePendingOpenConversation()
      .then((r) => {
        if (!r.pending || !r.conversationId) return
        useChatStore.getState().selectConversation(r.conversationId)
        setMobileView('chat')
      })
      .catch((err) => console.error('[IncomingCall] consumePendingOpenConversation gagal:', err))
  }, [user])

  // Full-screen intent (HP terkunci) -> tampilkan layar DERING (Accept/Decline),
  // BUKAN auto-accept. Dering native tetap jalan sampai user tekan Accept/Decline
  // (call.store memanggil stopIncomingRing lewat plugin).
  useEffect(() => {
    if (!user || !Capacitor.isNativePlatform()) return
    IncomingCall.consumePendingRingingCall()
      .then((r) => {
        if (!r.pending || !r.callId || !r.callType || !r.conversationId || !r.callerId) return
        const payload: WsCallIncomingPayload = {
          callId: r.callId,
          conversationId: r.conversationId,
          callType: r.callType as CallType,
          sdp: {} as RTCSessionDescriptionInit,
          from: { id: r.callerId, displayName: r.callerName ?? 'Someone' }
        }
        useCallStore.getState().incoming(payload)
      })
      .catch((err) => console.error('[IncomingCall] consumePendingRingingCall gagal:', err))
  }, [user])

  // Notif "Jawab" ditekan saat app SUDAH hidup (onNewIntent tak memicu ulang
  // useEffect consumePendingCall) -> event native 'answerNow' memaksa auto-accept
  // langsung, tanpa perlu tekan Accept lagi di dialog dering.
  useEffect(() => {
    if (!user || !Capacitor.isNativePlatform()) return
    const handlePromise = IncomingCall.addListener('answerNow', async () => {
      const r = await IncomingCall.consumePendingCall()
      if (!r.pending || !r.callId || !r.callType || !r.conversationId || !r.callerId) return
      const payload: WsCallIncomingPayload = {
        callId: r.callId,
        conversationId: r.conversationId,
        callType: r.callType as CallType,
        sdp: {} as RTCSessionDescriptionInit,
        from: { id: r.callerId, displayName: r.callerName ?? 'Someone' }
      }
      useChatStore.getState().selectConversation(r.conversationId)
      setMobileView('chat')
      await useCallStore.getState().acceptIncoming(payload)
    })
    return () => {
      void handlePromise.then((h) => h.remove())
    }
  }, [user])

  // ROBUST: begitu app kembali tampil ke layar (mis. user tekan "Jawab" di notif
  // -> app dibuka), cek ulang panggilan tertunda lalu auto-accept. Lebih andal
  // daripada event native yang bisa telat/hilang saat cold start di OEM tertentu.
  useEffect(() => {
    if (!user || !Capacitor.isNativePlatform()) return
    const onVisible = (): void => {
      if (document.visibilityState !== 'visible') return
      IncomingCall.consumePendingCall()
        .then(async (r) => {
          if (!r.pending || !r.callId || !r.callType || !r.conversationId || !r.callerId) return
          const payload: WsCallIncomingPayload = {
            callId: r.callId,
            conversationId: r.conversationId,
            callType: r.callType as CallType,
            sdp: {} as RTCSessionDescriptionInit,
            from: { id: r.callerId, displayName: r.callerName ?? 'Someone' }
          }
          useChatStore.getState().selectConversation(r.conversationId)
          setMobileView('chat')
          await useCallStore.getState().acceptIncoming(payload)
        })
        .catch((err) => console.error('[IncomingCall] visibility answer gagal:', err))
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
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
