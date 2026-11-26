import { IS_WEB, TOKEN_KEY } from '../config/constants'

/**
 * Satu-satunya pintu baca/tulis ACCESS TOKEN.
 *
 * - Native (Android/Electron): localStorage -- PERSIS seperti sebelumnya,
 *   jadi auto-login APK/EXE tidak berubah sedikit pun.
 * - WEB (Safari iPhone): sessionStorage. Tidak ada refresh token sama sekali;
 *   token diperbarui SERVER lewat WebSocket (event token_renew) selama soket
 *   hidup. Tutup tab atau sesi dicabut server = login ulang (keputusan 2b).
 */
const tempat = (): Storage => (IS_WEB ? sessionStorage : localStorage)

export function getAccessToken(): string | null {
  try {
    return tempat().getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setAccessToken(token: string): void {
  try {
    tempat().setItem(TOKEN_KEY, token)
  } catch {
    /* penyimpanan diblokir (mode privat) -- sesi tetap jalan di memori soket */
  }
}

export function removeAccessToken(): void {
  try {
    tempat().removeItem(TOKEN_KEY)
  } catch {
    /* abaikan */
  }
}
