# CallKit + PushKit — langkah Xcode

Berlaku setelah `npm i @capacitor/ios && npx cap add ios && npx cap sync ios`.

## 1. Salin berkas Swift

Salin **hanya berkas `.swift`** dari `native/ios/` ke `ios/App/App/`, lalu
*Add Files to "App"* dengan target **App** dicentang.

> Berkas yang tidak masuk target ada di disk tetapi **tidak ter-compile**, dan
> gejalanya menyesatkan: plugin tampak "tidak terdaftar" saat runtime tanpa
> satu pun error saat build.

Berkas `.md` di folder ini **jangan** disalin. Potongan AppDelegate sengaja
disimpan sebagai Markdown supaya tidak bentrok dengan `AppDelegate.swift` asli.

## 2. Potongan AppDelegate

Tambahkan ke `ios/App/App/AppDelegate.swift`, di dalam
`application(_:didFinishLaunchingWithOptions:)`, **sebelum** `return true`:

```swift
// PushKit WAJIB didaftarkan saat peluncuran, bukan saat WebView memuat.
// Panggilan yang tiba ketika aplikasi mati total sampai lebih dulu daripada
// plugin Capacitor mana pun.
VoipPushService.shared.start()
```

Tidak ada yang lain. `CallKitCoordinator` menginisialisasi diri sendiri saat
pertama kali disentuh, dan plugin Capacitor memasang callback-nya di `load()`.

## 3. Info.plist

Selain entri di `README-INFOPLIST.md`, pastikan `UIBackgroundModes` memuat
ketiganya:

```xml
<key>UIBackgroundModes</key>
<array>
  <string>audio</string>
  <string>voip</string>
  <string>remote-notification</string>
</array>
```

Tanpa `voip`, PushKit tidak akan pernah mengirim push ke aplikasi.

## 4. Signing & Capabilities

- **Push Notifications**
- **Background Modes**: Audio, Voice over IP, Remote notifications

Bundle ID: `com.bsi.messenger` (sama dengan Android — namespace Apple dan
Google terpisah, tidak ada tabrakan). Topic APNs = `com.bsi.messenger`,
topic VoIP = `com.bsi.messenger.voip` (topic turunan pada App ID yang sama,
**tidak perlu** mendaftarkan App ID kedua).

## 5. Urutan bring-up, dari yang paling murah dibuktikan

1. Safari Web Inspector: `Capacitor.Plugins.CallUi` dan
   `Capacitor.Plugins.VoipPush` **bukan** `undefined`. Ini uji tunggal yang
   membuktikan registrasi plugin benar.
2. Tabel `PushToken` menunjukkan **tepat dua baris** untuk iPhone itu:
   satu `IOS`, satu `IOS_VOIP`.
3. Notifikasi pesan sampai saat aplikasi tertutup.
4. VoIP push tiba dan CallKit muncul saat aplikasi di latar depan.
5. CallKit muncul saat aplikasi ditutup total, lalu di lock screen.
6. Jawab menyambungkan audio dua arah.
7. Tolak: pemanggil segera tahu.
8. Pembatalan dering saat aplikasi tertutup.
9. Panggilan keluar, kendali saat panggilan, diakhiri lawan.

## 6. Jebakan yang sudah diketahui

**`APNS_PRODUCTION` bukan soal "sudah rilis atau belum".** Build yang
dijalankan langsung dari Xcode ke perangkat memakai **sandbox**; build ad-hoc
dan TestFlight memakai **production** — meski keduanya belum di App Store.
Salah pilih menghasilkan `BadDeviceToken` untuk semua kiriman, tanpa petunjuk
lain. `apns.ts` mencetak environment yang dipakai saat init.

**Namespace UUID di `CallUuid.swift` tidak boleh diubah setelah rilis.**
Mengubahnya membuat push pembatalan menghitung UUID berbeda dari panggilan yang
sedang berdering, sehingga deringnya tidak bisa dihentikan.

**Jangan menambahkan `setActive(true)` di mana pun.** Aktivasi sesi audio milik
CallKit. Lihat `AudioSessionCoordinator.swift`.
