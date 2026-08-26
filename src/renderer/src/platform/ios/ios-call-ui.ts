import { BaseCallUi } from '../base/base-call-ui'

// PLACEHOLDER -- diisi pada Langkah 4 bersama CallUiPlugin.swift.
//
// Rencana implementasi:
//   start()            -> daftar listener plugin 'CallUi' (notifyListeners dari
//                         CXProviderDelegate: answered / declined / ended)
//   reportAnswered()   -> no-op; CallKit sudah tahu, dialah yang memberi tahu kita
//   reportConnected()  -> CXProvider.reportOutgoingCall(with:connectedAt:)
//   reportEnded()      -> CXProvider.reportCall(with:endedAt:reason:)
//   drain()            -> no-op; iOS berbasis delegate, tidak ada state pending
//
// CATATAN KERAS: reportNewIncomingCall WAJIB dipanggil dari sisi Swift dalam
// hitungan detik setelah VoIP push tiba. Kalau tidak, iOS mematikan aplikasi
// dan mencabut hak VoIP push-nya. Jadi pelaporan panggilan MASUK terjadi di
// Swift, bukan di sini -- lapisan TS hanya menerima hasilnya.
export class IosCallUi extends BaseCallUi {
  readonly platformName = 'ios'
  readonly supported = false
}
