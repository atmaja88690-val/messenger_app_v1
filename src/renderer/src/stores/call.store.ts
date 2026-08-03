import { create } from 'zustand'
import { callService } from '../services/call.service'
import { wsService } from '../services/ws.service'
import type {
  CallType,
  CallPeer,
  WsCallIncomingPayload,
  WsCallAcceptedPayload,
  WsCallEndedPayload,
} from '../types'

export type CallPhase = 'idle' | 'calling' | 'ringing' | 'active' | 'ended'

interface CallStore {
  phase: CallPhase
  callId: string | null
  callType: CallType | null
  peer: CallPeer | null
  conversationId: string | null
  localStream: MediaStream | null
  remoteStream: MediaStream | null
  micOn: boolean
  camOn: boolean
  error: string | null

  startCall: (conversationId: string, callType: CallType, peer: CallPeer) => Promise<void>
  incoming: (p: WsCallIncomingPayload) => void
  accept: () => Promise<void>
  reject: () => void
  hangup: () => void
  onAccepted: (p: WsCallAcceptedPayload) => Promise<void>
  onEnded: (p: WsCallEndedPayload, missed: boolean) => void
  toggleMic: () => void
  toggleCam: () => void
  reset: () => void
  setError: (msg: string) => void
}

const initial = {
  phase: 'idle' as CallPhase,
  callId: null,
  callType: null,
  peer: null,
  conversationId: null,
  localStream: null,
  remoteStream: null,
  micOn: true,
  camOn: true,
  error: null,
}

export const useCallStore = create<CallStore>((set, get) => ({
  ...initial,

  setError: (msg) => set({ error: msg }),

  startCall: async (conversationId, callType, peer) => {
    set({ phase: 'calling', callType, peer, conversationId, error: null })
    try {
      await callService.startCall(conversationId, callType)
    } catch (err) {
      set({ phase: 'idle', error: (err as Error).message })
      callService.cleanup()
    }
  },

  incoming: (p) => {
    // Sudah ada panggilan aktif -- tolak otomatis, jangan tumpuk.
    if (get().phase !== 'idle') {
      wsService.send('call_reject', { callId: p.callId })
      return
    }
    set({
      phase: 'ringing',
      callId: p.callId,
      callType: p.callType,
      peer: p.from,
      conversationId: p.conversationId,
      error: null,
    })
    // Simpan payload untuk dipakai accept()
    pendingIncoming = p
  },

  accept: async () => {
    if (pendingIncoming === null) return
    try {
      await callService.acceptCall(pendingIncoming)
      set({ phase: 'active' })
    } catch (err) {
      set({ phase: 'idle', error: (err as Error).message })
      wsService.send('call_reject', { callId: pendingIncoming.callId })
      callService.cleanup()
      pendingIncoming = null
    }
  },

  reject: () => {
    const id = get().callId
    if (id !== null) wsService.send('call_reject', { callId: id })
    callService.cleanup()
    pendingIncoming = null
    set({ ...initial })
  },

  hangup: () => {
    const id = get().callId ?? callService.getCallId()
    if (id !== null) wsService.send('call_end', { callId: id })
    callService.cleanup()
    pendingIncoming = null
    set({ ...initial })
  },

  onAccepted: async (p) => {
    callService.setCallId(p.callId)
    await callService.onAccepted(p)
    set({ phase: 'active', callId: p.callId })
  },

  onEnded: (_p, missed) => {
    callService.cleanup()
    pendingIncoming = null
    set({ ...initial, phase: 'ended', error: missed ? 'Panggilan tidak dijawab' : null })
    setTimeout(() => {
      if (useCallStore.getState().phase === 'ended') useCallStore.getState().reset()
    }, 2000)
  },

  toggleMic: () => {
    const next = get().micOn === false
    callService.toggleMic(next)
    set({ micOn: next })
  },

  toggleCam: () => {
    const next = get().camOn === false
    callService.toggleCam(next)
    set({ camOn: next })
  },

  reset: () => {
    callService.cleanup()
    pendingIncoming = null
    set({ ...initial })
  },
}))

// Payload panggilan masuk disimpan di luar store: berisi SDP mentah yang
// tidak perlu memicu re-render React.
let pendingIncoming: WsCallIncomingPayload | null = null

// Jembatan WS -> store + stream dari callService.
export function initCallBridge(): void {
  callService.setCallbacks({
    onLocalStream: (s) => useCallStore.setState({ localStream: s }),
    onRemoteStream: (s) => useCallStore.setState({ remoteStream: s }),
    onConnectionState: (st) => {
      if (st === 'connected') useCallStore.setState({ phase: 'active' })
    },
    onError: (msg) => useCallStore.setState({ error: msg }),
  })

  wsService.on<WsCallIncomingPayload>('call_incoming', (p) => useCallStore.getState().incoming(p))
  wsService.on<WsCallAcceptedPayload>('call_accepted', (p) => { void useCallStore.getState().onAccepted(p) })
  wsService.on<WsCallEndedPayload>('call_rejected', (p) => useCallStore.getState().onEnded(p, true))
  wsService.on<WsCallEndedPayload>('call_ended', (p) => useCallStore.getState().onEnded(p, false))
  wsService.on<{ callId: string; candidate: RTCIceCandidateInit }>('call_ice', (p) => { void callService.onIce(p) })
}
