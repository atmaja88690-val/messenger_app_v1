# Entri Info.plist & Xcode untuk BSIM iOS

Disalin ke `ios/App/App/Info.plist` SETELAH `npx cap add ios` dijalankan di Mac.

## Izin (wajib, app ditolak/crash tanpa ini)
```xml
<key>NSMicrophoneUsageDescription</key>
<string>BSI Messenger memerlukan mikrofon untuk panggilan suara dan video.</string>
<key>NSCameraUsageDescription</key>
<string>BSI Messenger memerlukan kamera untuk panggilan video.</string>
<key>NSPhotoLibraryAddUsageDescription</key>
<string>BSI Messenger menyimpan gambar dari percakapan ke galeri Anda.</string>
```

## Background modes
```xml
<key>UIBackgroundModes</key>
<array>
  <string>audio</string>              <!-- panggilan lanjut saat layar terkunci -->
  <string>voip</string>               <!-- PushKit; WAJIB untuk panggilan masuk -->
  <string>remote-notification</string><!-- APNs untuk notifikasi pesan -->
</array>
```

## Capability di Xcode (Signing & Capabilities)
- Push Notifications          -> butuh Apple Developer Program berbayar
- Background Modes            -> centang Audio, Voice over IP, Remote notifications

## Menambahkan berkas Swift ke proyek
Salin isi `native/ios/*.swift` ke `ios/App/App/`, lalu di Xcode:
File > Add Files to "App"..., centang **Copy items if needed** dan target **App**.
Tanpa langkah ini berkas ada di disk tapi TIDAK ikut ter-compile -- plugin
akan tampak "tidak terdaftar" saat runtime, gejala yang membingungkan.

## Verifikasi plugin termuat
Di Safari Web Inspector (Mac tersambung ke iPhone), jalankan:
`Capacitor.Plugins.AudioRoute` -- harus mengembalikan objek, bukan undefined.
