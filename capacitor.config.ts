import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bsi.messenger',
  appName: 'BSI Messenger',
  webDir: 'out/renderer',

  // Blok iOS TIDAK berpengaruh ke Android sama sekali -- Capacitor membaca
  // kunci per platform saat sync platform yang bersangkutan.
  ios: {
    // 'never' = WebView tidak menyisipkan inset otomatis. Aplikasi chat ini
    // full-bleed (header dan input bar menempel tepi), jadi area notch dan
    // home indicator diatur sendiri lewat CSS env(safe-area-inset-*).
    // Membiarkan iOS yang mengatur justru menghasilkan celah ganda.
    contentInset: 'never',
    // Warna di balik WebView saat memuat dan saat bounce-scroll. Disamakan
    // dengan bg-gray-900 yang dipakai App.tsx supaya tidak ada kedip putih.
    backgroundColor: '#111827'
  }
};

export default config;
