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

// Panggilan KELUAR. Hanya dipakai platform yang punya UI panggilan sistem
// (iOS/CallKit). Android & Desktop tidak menyentuhnya.
export interface OutgoingCallDescriptor {
  callId: string
  callType: CallTypeLite
  conversationId: string
  calleeName: string
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
  // Hanya iOS: user menekan Bisu di UI panggilan sistem (CXSetMutedCallAction).
  // Android & Desktop tidak pernah memancarkannya -- konsumen WAJIB punya
  // cabang default supaya varian ini tidak memecah build.
  | { kind: 'muteRequested'; callId: string; muted: boolean }

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

  // --- OPSIONAL. Default no-op di BaseCallUi. Android & Desktop TIDAK
  // meng-override-nya, jadi perilaku keduanya tidak berubah sama sekali.
  //
  // reportCallFinished SENGAJA terpisah dari reportEnded: di Android
  // reportEnded punya perilaku nyata (menghentikan dering native), sehingga
  // memanggilnya dari hangup() akan MENGUBAH perilaku Android. Metode
  // tersendiri menjaga Android benar-benar tak tersentuh.
  reportCallFinished?(callId: string, reason: CallEndReason): Promise<void>
  // Daftarkan panggilan KELUAR ke UI panggilan sistem (CXStartCallAction).
  startOutgoing?(desc: OutgoingCallDescriptor): Promise<void>
  // Selaraskan status bisu dari aplikasi ke UI panggilan sistem.
  setMuted?(callId: string, muted: boolean): Promise<void>

  on(listener: CallUiListener): () => void
}
