import { Capacitor, registerPlugin } from '@capacitor/core'
import { PushNotifications } from '@capacitor/push-notifications'
import api from './api.service'

// Push notifikasi perangkat NATIVE (Capacitor). NO-OP di Electron/web —
// desktop tetap pakai notification.service.ts (WS-based). Jangan campur.
//
// CATATAN NAMA: berkas ini kini melayani Android DAN iOS. Namanya tidak diganti
// karena mengganti nama berkas mengubah impor di jalur yang dieksekusi Android,
// dan itu risiko tanpa imbalan. Utang teknis, bukan kelalaian.
//
// Satu iPhone menghasilkan DUA baris PushToken:
//   IOS      -> device token APNs, dipakai notifikasi PESAN (alert push)
//   IOS_VOIP -> token PushKit, dipakai PANGGILAN (VoIP push)
// Keduanya BERBEDA nilainya dan tidak bisa saling menggantikan.

interface VoipPushNative {
  register(): Promise<{ token?: string }>
  addListener(
    eventName: 'voipToken',
    fn: (d: { token: string }) => void
  ): Promise<{ remove: () => Promise<void> }>
  addListener(
    eventName: 'voipTokenInvalidated',
    fn: () => void
  ): Promise<{ remove: () => Promise<void> }>
}

// Plugin TERPISAH dari 'CallUi': yang ini hanya mengurus token PushKit.
// Hanya dipanggil di iOS -- di platform lain proxy-nya tidak pernah disentuh.
const VoipPush = registerPlugin<VoipPushNative>('VoipPush')

let registered = false
// Token disimpan supaya bisa dihapus saat logout: /push/unsubscribe menghapus
// berdasarkan token PERSIS, bukan berdasarkan user.
let deviceToken: string | null = null
let voipToken: string | null = null

async function postToken(platform: string, token: string): Promise<void> {
  await api.post('/push/subscribe', { platform, subscription: token })
}

async function deleteToken(token: string): Promise<void> {
  await api.delete('/push/unsubscribe', { data: { subscription: token } })
}

async function sendVoipToken(token: string): Promise<void> {
  try {
    await postToken('IOS_VOIP', token)
    voipToken = token
    console.log('[PushNative] token VoIP terdaftar')
  } catch (err) {
    console.error('[PushNative] gagal kirim token VoIP:', err)
  }
}

async function registerVoip(): Promise<void> {
  try {
    await VoipPush.addListener('voipToken', (d) => { void sendVoipToken(d.token) })
    await VoipPush.addListener('voipTokenInvalidated', () => {
      // PushKit mencabut token: hapus di backend supaya tidak jadi token hantu.
      const stale = voipToken
      voipToken = null
      if (stale !== null) void deleteToken(stale).catch(() => {})
    })
    const res = await VoipPush.register()
    if (res && res.token) await sendVoipToken(res.token)
  } catch (err) {
    // Plugin Swift belum ada sampai Tugas 8 -- ini TIDAK boleh menjatuhkan
    // registrasi push pesan yang sudah berhasil di atasnya.
    console.error('[PushNative] registrasi PushKit gagal:', err)
  }
}

export async function registerPushAndroid(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return
  if (registered) return
  registered = true

  const isIos = Capacitor.getPlatform() === 'ios'

  try {
    await PushNotifications.removeAllListeners()

    await PushNotifications.addListener('registration', async (token) => {
      try {
        // Android: token FCM. iOS: device token APNs. Keduanya string polos --
        // backend JSON.stringify lalu JSON.parse balik.
        deviceToken = token.value
        await postToken(isIos ? 'IOS' : 'ANDROID', token.value)
        console.log('[PushNative] token pesan terdaftar ke backend')
      } catch (err) {
        console.error('[PushNative] gagal kirim token ke backend:', err)
        registered = false
      }
    })

    await PushNotifications.addListener('registrationError', (err) => {
      console.error('[PushNative] registrationError:', JSON.stringify(err))
      registered = false
    })

    let perm = await PushNotifications.checkPermissions()
    if (perm.receive === 'prompt' || perm.receive === 'prompt-with-rationale') {
      perm = await PushNotifications.requestPermissions()
    }
    if (perm.receive !== 'granted') {
      console.warn('[PushNative] izin notifikasi tidak diberikan:', perm.receive)
      registered = false
      return
    }

    await PushNotifications.register()

    if (isIos) await registerVoip()
  } catch (err) {
    console.error('[PushNative] init gagal:', err)
    registered = false
  }
}

// Dipanggil dari auth.store logout, SEBELUM sesi dibersihkan -- endpoint
// /push/unsubscribe butuh header Authorization yang masih valid.
//
// Tanpa ini, baris PushToken tertinggal di basis data dan backend terus
// mengirim notifikasi pesan ke perangkat yang sudah logout: judul pesan dan
// nama pengirim terbaca di layar kunci oleh siapa pun yang memegang HP itu.
export async function unregisterPushAndroid(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return

  // Satu per satu: iPhone punya dua token, dan endpoint menghapus per token.
  for (const t of [deviceToken, voipToken]) {
    if (t === null) continue
    try {
      await deleteToken(t)
    } catch (err) {
      console.error('[PushNative] gagal hapus token di backend:', err)
    }
  }
  deviceToken = null
  voipToken = null

  try {
    await PushNotifications.removeAllListeners()
  } catch {
    // abaikan
  }
  registered = false
}
