import { Capacitor } from '@capacitor/core'

// Dev: path relatif → lewat Vite proxy (same-origin, no CORS, backend tak disentuh).
// Prod (.exe terpaket): absolut ke backend langsung.

const IS_NATIVE = Capacitor.isNativePlatform()
const NATIVE_BACKEND = 'https://chat.bsilongevity.com:4443'

// Native (Android/iOS Capacitor): tak ada proxy lokal, wajib absolut ke backend.
// Desktop (Electron) & dev: relatif lewat local-server / Vite proxy.
export const API_URL = IS_NATIVE ? `${NATIVE_BACKEND}/api` : '/api'
export const WS_URL = IS_NATIVE
  ? 'wss://chat.bsilongevity.com:4443/ws'
  : `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`

export const TOKEN_KEY = 'bsi_access_token'
export const REFRESH_KEY = 'bsi_refresh_token'

// UTANG TEKNIS: avatar lewat path /minio/ (bug SignatureDoesNotMatch yg sama).
// Wajib blob-fetch + auth, jangan <img src> langsung. Tangani saat avatar dikerjakan.
export const AVATAR_BASE = 'https://chat.bsilongevity.com/minio/bsichat-avatars'

// Notifikasi (fitur Options — panel Notifications): toggle disimpan renderer-only,
// tidak ada pihak main process yang butuh tahu nilainya (beda dgn downloadDir/openAtLogin).
export const NOTIF_ENABLED_KEY = 'bsi_notif_enabled'
export const NOTIF_SOUND_KEY = 'bsi_notif_sound'

// === App info (About dialog) — EDIT DI SINI saat rilis versi baru ===
export const APP_NAME = 'NNI Messenger'
// DIISI SAAT BUILD dari package.json lewat define di electron.vite.config.ts.
// JANGAN pernah menulis angka versi di sini lagi -- satu-satunya sumber
// kebenaran adalah package.json, yang juga menamai installer dan APK.
declare const __APP_VERSION__: string
export const APP_VERSION = __APP_VERSION__
export const APP_COPYRIGHT = `© ${new Date().getFullYear()} Nuraline Nutraceuticals Interagency. All rights reserved.`

// URL server penuh untuk ditampilkan (read-only) di Settings.
// Selalu location.origin -- API selalu same-origin sekarang (relatif), baik dev maupun prod.
export const SERVER_URL = IS_NATIVE ? NATIVE_BACKEND : location.origin
