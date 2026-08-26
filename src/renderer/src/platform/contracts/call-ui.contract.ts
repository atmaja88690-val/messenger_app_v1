// ABSTRAKSI. Berkas ini tidak boleh memuat kode platform apa pun -- hanya makna.
//
// Kenapa berbentuk LAPOR + AMATI, bukan perintah seperti stopIncomingRing():
// di Android kita yang membunyikan dering dan kita yang menghentikannya, tapi
// di iOS layar panggilan masuk milik CallKit. Saat user menekan Jawab di sana,
// yang tereksekusi adalah delegate CXAnswerCallAction di Swift -- BUKAN tombol
// di CallOverlay. Bentuk imperatif tidak punya isi untuk ditulis di cabang iOS.
// Dengan bentuk ini, tombol notif Android, tombol CallOverlay, dan tombol hijau
// CallKit sama-sama tiba sebagai satu peristiwa: 'answered'.

export type CallTypeLite = 'AUDIO' | 'VIDEO'

export interface IncomingCallDescriptor {
  callId: string
  callType: CallTypeLite
  conversationId: string
  callerId: string
  callerName: string
}

export type CallEndReason = 'local' | 'remote' | 'declined' | 'timeout' | 'failed'

export type CallUiEvent =
  // Panggilan HARUS langsung dijawab (user menekan Jawab dari notif/CallKit).
  | { kind: 'answered'; call: IncomingCallDescriptor }
  // Panggilan berdering; tampilkan layar Accept/Decline, JANGAN auto-accept.
  | { kind: 'ringing'; call: IncomingCallDescriptor }
  // Bukan call: user menekan notifikasi PESAN, buka percakapannya.
  | { kind: 'openConversation'; conversationId: string }
  // Belum diemisikan Android (butuh Tolak-native fase 2). CallKit akan mengisi.
  | { kind: 'declined'; callId: string }
  | { kind: 'ended'; callId: string; reason: CallEndReason }

export type CallUiListener = (event: CallUiEvent) => void

export interface CallUiPort {
  readonly platformName: string
  readonly supported: boolean

  start(): Promise<void>
  stop(): Promise<void>
  // Paksa periksa panggilan tertunda. Android memakainya karena state pending
  // disimpan native dan hanya bisa dibaca dengan polling; iOS tidak butuh.
  drain(): Promise<void>

  reportAnswered(callId: string): Promise<void>
  reportConnected(callId: string): Promise<void>
  reportEnded(callId: string, reason: CallEndReason): Promise<void>

  on(listener: CallUiListener): () => void
}
