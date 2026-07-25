import { Capacitor } from '@capacitor/core'
import { PushNotifications } from '@capacitor/push-notifications'
import api from './api.service'

// FCM push untuk Android (Capacitor). NO-OP di Electron/web —
// desktop tetap pakai notification.service.ts (WS-based). Jangan campur.
//
// Alur: guard native -> minta izin -> register() -> event 'registration'
// memberi FCM token -> kirim ke backend POST /push/subscribe.
// Backend (push.routes.ts) JSON.stringify(subscription); cabang Android di
// push.ts JSON.parse balik. Maka subscription DIKIRIM sebagai string token polos.

let registered = false

export async function registerPushAndroid(): Promise<void> {
  // Guard: hanya di perangkat native (Android). Electron/web -> keluar diam-diam.
  if (!Capacitor.isNativePlatform()) return
  if (registered) return
  registered = true

  try {
    // Hapus listener lama (hindari dobel saat re-register/HMR)
    await PushNotifications.removeAllListeners()

    // Kirim token ke backend saat registrasi berhasil.
    await PushNotifications.addListener('registration', async (token) => {
      try {
        // token.value = FCM registration token (string polos).
        // subscription DIKIRIM sebagai string -> backend JSON.stringify -> JSON.parse balik.
        await api.post('/push/subscribe', {
          platform: 'ANDROID',
          subscription: token.value
        })
        console.log('[PushAndroid] token terdaftar ke backend')
      } catch (err) {
        console.error('[PushAndroid] gagal kirim token ke backend:', err)
        registered = false // izinkan retry di sesi berikutnya
      }
    })

    await PushNotifications.addListener('registrationError', (err) => {
      console.error('[PushAndroid] registrationError:', JSON.stringify(err))
      registered = false
    })

    // Minta izin notifikasi (Android 13+ wajib runtime permission).
    let perm = await PushNotifications.checkPermissions()
    if (perm.receive === 'prompt' || perm.receive === 'prompt-with-rationale') {
      perm = await PushNotifications.requestPermissions()
    }
    if (perm.receive !== 'granted') {
      console.warn('[PushAndroid] izin notifikasi tidak diberikan:', perm.receive)
      registered = false
      return
    }

    // Daftar ke FCM -> memicu event 'registration' di atas.
    await PushNotifications.register()
  } catch (err) {
    console.error('[PushAndroid] init gagal:', err)
    registered = false
  }
}

// Lepas token saat logout (opsional dipanggil dari auth.store logout).
export async function unregisterPushAndroid(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return
  try {
    await PushNotifications.removeAllListeners()
    registered = false
  } catch {
    // abaikan
  }
}
