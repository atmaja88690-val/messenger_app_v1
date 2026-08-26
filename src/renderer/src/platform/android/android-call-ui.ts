import { registerPlugin } from '@capacitor/core'
import { BaseCallUi } from '../base/base-call-ui'
import type { CallEndReason, IncomingCallDescriptor } from '../contracts/call-ui.contract'

interface IncomingCallResult {
  pending: boolean
  callId?: string
  callType?: string
  conversationId?: string
  callerId?: string
  callerName?: string
}

interface IncomingCallNative {
  consumePendingCall(): Promise<IncomingCallResult>
  consumePendingOpenConversation(): Promise<{ pending: boolean; conversationId?: string }>
  consumePendingRingingCall(): Promise<IncomingCallResult>
  stopIncomingRing(): Promise<void>
  addListener(
    eventName: 'answerNow',
    listenerFunc: () => void
  ): Promise<{ remove: () => Promise<void> }>
}

const Native = registerPlugin<IncomingCallNative>('IncomingCall')

function toDescriptor(r: IncomingCallResult): IncomingCallDescriptor | null {
  if (!r.pending || !r.callId || !r.callType || !r.conversationId || !r.callerId) return null
  return {
    callId: r.callId,
    callType: r.callType === 'VIDEO' ? 'VIDEO' : 'AUDIO',
    conversationId: r.conversationId,
    callerId: r.callerId,
    callerName: r.callerName ?? 'Someone'
  }
}

// Menerjemahkan model Android (state pending disimpan native, JS mem-polling)
// menjadi aliran peristiwa. Plugin Java TIDAK diubah sama sekali -- adapter ini
// hanya membungkus IncomingCallPlugin yang sudah terbukti bekerja.
export class AndroidCallUi extends BaseCallUi {
  readonly platformName = 'android'
  readonly supported = true

  private answerHandle: { remove: () => Promise<void> } | null = null

  private handleVisibility = (): void => {
    if (document.visibilityState === 'visible') void this.drain()
  }

  async start(): Promise<void> {
    // Tiga pemicu yang sama dengan sebelum refactor, jangan dikurangi:
    // (1) event native 'answerNow' saat app sudah hidup (onNewIntent tidak
    //     memicu ulang useEffect), (2) visibilitychange sebagai jaring pengaman
    //     yang lebih andal di OEM tertentu, (3) satu drain saat start (cold start).
    try {
      this.answerHandle = await Native.addListener('answerNow', () => { void this.drain() })
    } catch (err) {
      console.error('[android-call-ui] addListener answerNow gagal', err)
    }
    document.addEventListener('visibilitychange', this.handleVisibility)
    await this.drain()
  }

  async stop(): Promise<void> {
    document.removeEventListener('visibilitychange', this.handleVisibility)
    if (this.answerHandle !== null) {
      try { await this.answerHandle.remove() } catch { /* diam */ }
      this.answerHandle = null
    }
  }

  // URUTAN WAJIB DIPERTAHANKAN: answered -> openConversation -> ringing.
  // Sama persis dengan urutan useEffect lama di App.tsx. Tiap consume* bersifat
  // one-shot di sisi Java (dikosongkan setelah dibaca), jadi memanggil dua kali
  // aman; yang tidak aman adalah menukar urutannya.
  async drain(): Promise<void> {
    try {
      const answered = toDescriptor(await Native.consumePendingCall())
      if (answered !== null) this.emit({ kind: 'answered', call: answered })
    } catch (err) {
      console.error('[android-call-ui] consumePendingCall gagal', err)
    }

    try {
      const open = await Native.consumePendingOpenConversation()
      if (open.pending && open.conversationId) {
        this.emit({ kind: 'openConversation', conversationId: open.conversationId })
      }
    } catch (err) {
      console.error('[android-call-ui] consumePendingOpenConversation gagal', err)
    }

    try {
      const ringing = toDescriptor(await Native.consumePendingRingingCall())
      if (ringing !== null) this.emit({ kind: 'ringing', call: ringing })
    } catch (err) {
      console.error('[android-call-ui] consumePendingRingingCall gagal', err)
    }
  }

  // Android: "melapor sudah dijawab" berarti hentikan dering foreground service.
  async reportAnswered(_callId: string): Promise<void> {
    await this.silence()
  }

  async reportEnded(_callId: string, _reason: CallEndReason): Promise<void> {
    await this.silence()
  }

  private async silence(): Promise<void> {
    try {
      await Native.stopIncomingRing()
    } catch (err) {
      console.error('[android-call-ui] stopIncomingRing gagal', err)
    }
  }
}
