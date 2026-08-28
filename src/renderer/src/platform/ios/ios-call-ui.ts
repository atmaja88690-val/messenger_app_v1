import { registerPlugin } from '@capacitor/core'
import { BaseCallUi } from '../base/base-call-ui'
import type {
  CallEndReason,
  IncomingCallDescriptor,
  OutgoingCallDescriptor
} from '../contracts/call-ui.contract'

interface NativeCallEvent {
  kind: string
  callId?: string
  callType?: string
  conversationId?: string
  callerId?: string
  callerName?: string
  reason?: string
  muted?: boolean
}

interface CallUiNative {
  // Antrean peristiwa yang tiba saat WebView belum ada (aplikasi mati total).
  consumePending(): Promise<{ events: NativeCallEvent[] }>
  reportAnswered(o: { callId: string }): Promise<void>
  reportConnected(o: { callId: string }): Promise<void>
  reportCallFinished(o: { callId: string; reason: string }): Promise<void>
  startOutgoing(o: { callId: string; calleeName: string; hasVideo: boolean }): Promise<void>
  setMuted(o: { callId: string; muted: boolean }): Promise<void>
  addListener(
    eventName: 'callUiEvent',
    fn: (e: NativeCallEvent) => void
  ): Promise<{ remove: () => Promise<void> }>
  addListener(
    eventName: 'audioSessionActive',
    fn: () => void
  ): Promise<{ remove: () => Promise<void> }>
}

const Native = registerPlugin<CallUiNative>('CallUi')

// Katup pengaman penahanan dua syarat. Panggilan tanpa suara masih bisa
// diperbaiki pengguna; panggilan yang menggantung selamanya tidak.
const AUDIO_GUARD_MS = 1500

function toDescriptor(e: NativeCallEvent): IncomingCallDescriptor | null {
  if (!e.callId || !e.conversationId || !e.callerId) return null
  return {
    callId: e.callId,
    callType: e.callType === 'VIDEO' ? 'VIDEO' : 'AUDIO',
    conversationId: e.conversationId,
    callerId: e.callerId,
    callerName: e.callerName ?? 'Seseorang'
  }
}

function toReason(r?: string): CallEndReason {
  if (r === 'local' || r === 'remote' || r === 'declined' || r === 'timeout' || r === 'failed') {
    return r
  }
  return 'remote'
}

// Adapter CallKit. Arah kendalinya TERBALIK dibanding Android: berkas ini tidak
// pernah melaporkan panggilan MASUK -- pelaporan terjadi di Swift saat VoIP push
// tiba, karena batas waktunya diukur dalam detik dan WebView belum tentu ada.
// Lapisan ini hanya menerima hasilnya lalu menerjemahkannya jadi peristiwa.
export class IosCallUi extends BaseCallUi {
  readonly platformName = 'ios'
  readonly supported = true

  private eventHandle: { remove: () => Promise<void> } | null = null
  private audioHandle: { remove: () => Promise<void> } | null = null

  // Penahanan dua syarat: 'answered' menunggu CXAnswerCallAction DAN didActivate.
  private pendingAnswered: IncomingCallDescriptor | null = null
  private audioSessionActive = false
  private guardTimer: ReturnType<typeof setTimeout> | null = null

  async start(): Promise<void> {
    try {
      this.eventHandle = await Native.addListener('callUiEvent', (e) => { this.onNative(e) })
    } catch (err) {
      console.error('[ios-call-ui] addListener callUiEvent gagal', err)
    }
    try {
      this.audioHandle = await Native.addListener('audioSessionActive', () => {
        this.audioSessionActive = true
        this.flushAnswered()
      })
    } catch (err) {
      console.error('[ios-call-ui] addListener audioSessionActive gagal', err)
    }
    // Cold start: peristiwa yang tiba saat WebView belum ada menunggu di antrean.
    await this.drain()
  }

  async stop(): Promise<void> {
    this.clearGuard()
    if (this.eventHandle !== null) {
      try { await this.eventHandle.remove() } catch { /* diam */ }
      this.eventHandle = null
    }
    if (this.audioHandle !== null) {
      try { await this.audioHandle.remove() } catch { /* diam */ }
      this.audioHandle = null
    }
  }

  async drain(): Promise<void> {
    try {
      const res = await Native.consumePending()
      for (const e of res.events ?? []) this.onNative(e)
    } catch (err) {
      console.error('[ios-call-ui] consumePending gagal', err)
    }
  }

  private onNative(e: NativeCallEvent): void {
    if (e.kind === 'answered') {
      const call = toDescriptor(e)
      if (call === null) return
      this.pendingAnswered = call
      this.flushAnswered()
      return
    }
    if (e.kind === 'ringing') {
      const call = toDescriptor(e)
      if (call !== null) this.emit({ kind: 'ringing', call })
      return
    }
    if (e.kind === 'openConversation') {
      if (e.conversationId) this.emit({ kind: 'openConversation', conversationId: e.conversationId })
      return
    }
    if (e.kind === 'declined') {
      this.resetGate()
      this.emit({ kind: 'declined', callId: e.callId ?? '' })
      return
    }
    if (e.kind === 'ended') {
      this.resetGate()
      this.emit({ kind: 'ended', callId: e.callId ?? '', reason: toReason(e.reason) })
      return
    }
    if (e.kind === 'muteRequested') {
      this.emit({ kind: 'muteRequested', callId: e.callId ?? '', muted: e.muted === true })
      return
    }
    console.warn('[ios-call-ui] peristiwa native tidak dikenal:', e.kind)
  }

  // Audio BSIM mengalir lewat WebRTC di dalam WKWebView, bukan SDK LiveKit
  // native. Kalau getUserMedia berjalan SEBELUM CallKit mengaktifkan sesi audio,
  // gejala khasnya: panggilan tersambung tapi tidak ada suara, atau suara keluar
  // dari speaker meski rute sudah disetel. Karena itu 'answered' ditahan sampai
  // provider(_:didActivate:) tiba -- baru setelah itu React join room.
  private flushAnswered(): void {
    const call = this.pendingAnswered
    if (call === null) return

    if (this.audioSessionActive) {
      this.clearGuard()
      this.pendingAnswered = null
      this.emit({ kind: 'answered', call })
      return
    }

    if (this.guardTimer !== null) return
    this.guardTimer = setTimeout(() => {
      this.guardTimer = null
      const held = this.pendingAnswered
      if (held === null) return
      this.pendingAnswered = null
      console.warn('[ios-call-ui] didActivate tidak tiba dalam ' + AUDIO_GUARD_MS + 'ms -- lanjut tanpa menunggu')
      this.emit({ kind: 'answered', call: held })
    }, AUDIO_GUARD_MS)
  }

  private clearGuard(): void {
    if (this.guardTimer !== null) {
      clearTimeout(this.guardTimer)
      this.guardTimer = null
    }
  }

  private resetGate(): void {
    this.clearGuard()
    this.pendingAnswered = null
    this.audioSessionActive = false
  }

  // CallKit sudah tahu panggilan dijawab -- dialah yang memberi tahu kita.
  // Tetap diteruskan supaya Swift bisa menyelaraskan state internalnya ketika
  // jawaban datang dari CallOverlay, bukan dari layar CallKit.
  async reportAnswered(callId: string): Promise<void> {
    try { await Native.reportAnswered({ callId }) } catch (err) {
      console.error('[ios-call-ui] reportAnswered gagal', err)
    }
  }

  // FR-20: panggilan KELUAR tersambung -> reportOutgoingCall(with:connectedAt:)
  async reportConnected(callId: string): Promise<void> {
    try { await Native.reportConnected({ callId }) } catch (err) {
      console.error('[ios-call-ui] reportConnected gagal', err)
    }
  }

  // reportEnded SENGAJA TIDAK di-override -- tetap no-op warisan BaseCallUi.
  // reject() memanggil reportEnded lalu reportCallFinished berurutan; kalau
  // keduanya diteruskan ke CallKit, panggilan diakhiri dua kali.

  // FR-18: satu-satunya jalur yang menutup UI panggilan sistem.
  async reportCallFinished(callId: string, reason: CallEndReason): Promise<void> {
    this.resetGate()
    try { await Native.reportCallFinished({ callId, reason }) } catch (err) {
      console.error('[ios-call-ui] reportCallFinished gagal', err)
    }
  }

  // FR-19: panggilan keluar tampil di UI sistem sehingga tetap berjalan saat
  // aplikasi di-background.
  async startOutgoing(desc: OutgoingCallDescriptor): Promise<void> {
    try {
      await Native.startOutgoing({
        callId: desc.callId,
        calleeName: desc.calleeName,
        hasVideo: desc.callType === 'VIDEO'
      })
    } catch (err) {
      console.error('[ios-call-ui] startOutgoing gagal', err)
    }
  }

  // FR-17 arah aplikasi -> sistem. Arah sebaliknya tiba sebagai 'muteRequested'.
  async setMuted(callId: string, muted: boolean): Promise<void> {
    try { await Native.setMuted({ callId, muted }) } catch (err) {
      console.error('[ios-call-ui] setMuted gagal', err)
    }
  }
}
