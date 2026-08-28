import type {
  CallEndReason, CallUiEvent, CallUiListener, CallUiPort, OutgoingCallDescriptor
} from '../contracts/call-ui.contract'

// WARISAN: menampung yang sama di semua platform (daftar listener) dan
// menyediakan default AMAN untuk kapabilitas yang absen. Platform yang tidak
// mendukung sesuatu cukup tidak meng-override -- tidak boleh melempar.
export abstract class BaseCallUi implements CallUiPort {
  abstract readonly platformName: string
  abstract readonly supported: boolean

  private listeners = new Set<CallUiListener>()

  on(listener: CallUiListener): () => void {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  // Satu listener yang melempar TIDAK BOLEH menjatuhkan yang lain -- jalur ini
  // membawa peristiwa "panggilan masuk", kegagalan diam jauh lebih baik
  // daripada panggilan yang tidak pernah sampai.
  protected emit(event: CallUiEvent): void {
    for (const listener of [...this.listeners]) {
      try {
        listener(event)
      } catch (err) {
        console.error(`[${this.platformName}-call-ui] listener error`, err)
      }
    }
  }

  async start(): Promise<void> {}
  async stop(): Promise<void> {}
  async drain(): Promise<void> {}
  async reportAnswered(_callId: string): Promise<void> {}
  async reportConnected(_callId: string): Promise<void> {}
  async reportEnded(_callId: string, _reason: CallEndReason): Promise<void> {}

  // Default no-op untuk kapabilitas UI panggilan sistem. Hanya iOS yang
  // meng-override; Android & Desktop mewarisi no-op ini apa adanya.
  async reportCallFinished(_callId: string, _reason: CallEndReason): Promise<void> {}
  async startOutgoing(_desc: OutgoingCallDescriptor): Promise<void> {}
  async setMuted(_callId: string, _muted: boolean): Promise<void> {}
}
