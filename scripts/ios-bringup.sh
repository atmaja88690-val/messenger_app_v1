#!/usr/bin/env bash
# Bring-up iOS. DIJALANKAN DI MAC, sekali saja, dari akar repo.
#
# Kenapa skrip ini ada: langkah tersulit di Mac bukan mengetik perintah,
# melainkan MENYALIN berkas Swift ke tempat yang benar dan memastikan
# ia benar-benar ikut di-compile. Berkas yang ada di disk tetapi tidak
# terdaftar di target Xcode akan tampak seperti "plugin tidak terdaftar"
# saat runtime -- tanpa satu pun galat kompilasi. Skrip ini menyalinnya;
# pendaftaran ke target tetap harus dilakukan sekali di Xcode.
set -euo pipefail

if [ ! -f capacitor.config.ts ]; then
  echo "GAGAL: jalankan dari akar repo (tempat capacitor.config.ts berada)."
  exit 1
fi
if [ "$(uname)" != "Darwin" ]; then
  echo "GAGAL: skrip ini hanya untuk macOS."
  exit 1
fi

echo "== 1/5 dependensi =="
npm install
npm i @capacitor/ios

echo "== 2/5 bangun web bundle (webDir = out/renderer) =="
npm run build

echo "== 3/5 tambahkan platform iOS =="
if [ -d ios ]; then
  echo "  folder ios/ sudah ada, melewati cap add"
else
  npx cap add ios
fi
npx cap sync ios

echo "== 4/5 salin plugin Swift =="
TUJUAN=ios/App/App
[ -d "$TUJUAN" ] || { echo "GAGAL: $TUJUAN tidak ada."; exit 1; }
for f in native/ios/*.swift; do
  cp -v "$f" "$TUJUAN/"
done
echo "  README sengaja TIDAK disalin (bukan kode)."

echo "== 5/5 daftar berkas yang harus di-Add to Target =="
ls -1 "$TUJUAN"/*.swift

cat <<'CATATAN'

================= YANG MASIH MANUAL DI XCODE =================
Buka:  npx cap open ios

1. Add Files to "App"...  pilih SEMUA .swift di ios/App/App/ yang
   baru disalin, dan PASTIKAN kotak target "App" tercentang.
   Berkas tanpa centang itu ada di disk tapi tidak ter-compile;
   gejalanya Capacitor.Plugins.CallUi === undefined saat runtime.

2. Signing & Capabilities -> tambahkan:
     - Push Notifications
     - Background Modes: Audio, Voice over IP, Remote notifications

3. Terapkan native/ios/README-INFOPLIST.md (entri Info.plist:
   izin mikrofon dan kamera) dan native/ios/README-CALLKIT.md
   (potongan AppDelegate untuk PushKit + APNs).
   Potongan AppDelegate sengaja disimpan sebagai .md, bukan .swift,
   supaya tidak bentrok dengan AppDelegate hasil `cap add ios`.

4. Bundle ID harus PERSIS com.bsi.messenger.
   Topic alert = com.bsi.messenger, topic VoIP = com.bsi.messenger.voip.

5. Verifikasi di Safari Web Inspector, satu per satu:
     Capacitor.Plugins.AudioRoute
     Capacitor.Plugins.CallUi
     Capacitor.Plugins.VoipPush
   Ketiganya tidak boleh undefined.

6. Backend: isi APNS_* di .env, lalu restart bsichat-api.
   APNS_PRODUCTION=false untuk build yang dijalankan langsung dari
   Xcode ke perangkat (sandbox). Build ad-hoc dan TestFlight memakai
   production -- salah pilih membuat SEMUA push ditolak BadDeviceToken
   tanpa petunjuk lain.
==============================================================
CATATAN
