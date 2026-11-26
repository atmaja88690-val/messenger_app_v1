/**
 * stores/auth.store.ts  (BSIM)
 *
 * Ditingkatkan dari V3:
 * 1. bsi:logout listener — logout paksa dari api.service.ts (reactive refresh final fail)
 * 2. Session-revoke on login — revoke sesi lama di server sebelum buat sesi baru
 * 3. err: unknown — TS strict (V3 pakai any)
 * 4. startProactiveRefreshCycle: callback (): Promise<void> — explicit type annotation
 * 5. HMR-safe via module-level _bsiLogoutHandler ref
 */

import { create } from 'zustand'
import type { User } from '../types'
import { TOKEN_KEY, REFRESH_KEY, IS_WEB } from '../config/constants'
import { getAccessToken, setAccessToken, removeAccessToken } from '../services/auth-token'
import { authApi, usersApi } from '../services/api.service'
import { wsService } from '../services/ws.service'
import { unregisterPushAndroid } from '../services/push-android.service'
import {
  scheduleProactiveRefresh,
  clearProactiveRefresh,
  isRefreshInFlight,
  setRefreshing
} from '../services/token-scheduler.service'
import { Preferences } from '@capacitor/preferences'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  // true HANYA bila refresh setelah penolakan WS 4001 gagal. Bukan
  // penanda offline: kegagalan jaringan tidak pernah menyalakan ini.
  sesiDitolak: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  loadMe: () => Promise<void>
  clearError: () => void
}

/**
 * Proactive refresh cycle — dikelola auth.store (bukan api.service).
 * Callback eksplisit (): Promise<void> — matching token-scheduler BSIM.
 * Pola V3 dipertahankan: authApi.refresh() langsung, bukan performTokenRefresh.
 * token-scheduler wrap callback dgn isRefreshing lock — auth.store tidak perlu setRefreshing().
 */
function startProactiveRefreshCycle(accessToken: string): void {
  // WEB tidak punya refresh token; SERVER yang memperbarui token lewat WS.
  if (IS_WEB) return
  scheduleProactiveRefresh(accessToken, async (): Promise<void> => {
    const refreshToken = localStorage.getItem(REFRESH_KEY)
    if (!refreshToken) return

    try {
      const { data } = await authApi.refresh(refreshToken)
      setAccessToken(data.accessToken)
      Preferences.set({ key: TOKEN_KEY, value: data.accessToken }).catch(() => {})
      localStorage.setItem(REFRESH_KEY, data.refreshToken)
      Preferences.set({ key: REFRESH_KEY, value: data.refreshToken }).catch(() => {})

      wsService.disconnect()
      setTimeout(() => wsService.connect(), 300)

      startProactiveRefreshCycle(data.accessToken)
    } catch {
      // Proactive gagal → biarkan; reactive interceptor di api.service jadi fallback.
      // Tidak logout paksa — hindari dua jalur logout berebut untuk kegagalan yang sama.
      console.warn('[auth.store] Proactive refresh gagal, mengandalkan reactive sebagai fallback.')
    }
  })
}

/**
 * Restore token dari Capacitor Preferences (native, tahan app-kill) ke localStorage.
 * WebView Android bisa menghapus localStorage saat app di-kill sistem -- Preferences
 * tidak ikut terhapus. Dipanggil App.tsx SEBELUM loadMe() saat boot, HANYA kalau
 * localStorage kosong (tidak menimpa sesi localStorage yang masih hidup/lebih baru).
 * No-op aman di Electron (Preferences kosong kalau belum pernah di-set di situ).
 */
export async function restoreAuthTokensFromPreferences(): Promise<void> {
  // WEB: tidak ada token persisten. Sekaligus sapu sisa token era lama, saat
  // web masih memakai /login native (localStorage + cermin Preferences).
  if (IS_WEB) {
    const lama = window.localStorage
    lama.removeItem(TOKEN_KEY)
    lama.removeItem(REFRESH_KEY)
    Preferences.remove({ key: TOKEN_KEY }).catch(() => {})
    Preferences.remove({ key: REFRESH_KEY }).catch(() => {})
    return
  }
  if (getAccessToken()) return
  try {
    const [{ value: access }, { value: refresh }] = await Promise.all([
      Preferences.get({ key: TOKEN_KEY }),
      Preferences.get({ key: REFRESH_KEY })
    ])
    if (access) setAccessToken(access)
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh)
  } catch (e) {
    console.error('[auth.store] Gagal restore token dari Preferences:', e)
  }
}

/**
 * Refresh yang dipicu penolakan WS 4001 (native saja).
 *
 * Empat hasil, bukan dua. Dua di antaranya BUKAN sesi mati:
 *   'lewati'   refresh LAIN sedang berjalan (proaktif jalan tiap ~12 menit,
 *              tabrakan itu wajar) -- biarkan ia selesai.
 *   'jaringan' server tidak terjangkau. Hanya 401/403 yang berarti
 *              kredensial benar-benar ditolak; sisanya jaringan.
 * Spanduk HANYA menyala untuk 'gagal'.
 *
 * TIDAK menghapus token apa pun saat gagal. Kegagalan jaringan tidak boleh
 * terbaca sebagai sesi mati -- keputusan 21 September, masih berlaku.
 *
 * UTANG: empat baris penyimpanan token di bawah menggandakan yang ada di
 * startProactiveRefreshCycle. Digandakan dengan sengaja supaya jalur
 * proaktif yang sudah terbukti tidak disentuh dalam perbaikan ini.
 */
type HasilRefreshWs = 'pulih' | 'gagal' | 'jaringan' | 'lewati'

// Meniru isAuthRejection() di api.service.ts, sengaja dengan aturan yang
// sama persis: HANYA 401/403 yang berarti server benar-benar menolak
// kredensial. Timeout, DNS gagal, koneksi putus -- semuanya masalah
// jaringan, dan tidak boleh terbaca sebagai sesi mati.
function tolakanAuth(err: unknown): boolean {
  const status = (err as { response?: { status?: number } })?.response?.status
  return status === 401 || status === 403
}

async function refreshKarenaWsDitolak(): Promise<HasilRefreshWs> {
  if (IS_WEB) return 'lewati'
  if (isRefreshInFlight()) return 'lewati'
  const refreshToken = localStorage.getItem(REFRESH_KEY)
  if (!refreshToken) return 'gagal'

  setRefreshing(true)
  try {
    const { data } = await authApi.refresh(refreshToken)
    setAccessToken(data.accessToken)
    Preferences.set({ key: TOKEN_KEY, value: data.accessToken }).catch(() => {})
    localStorage.setItem(REFRESH_KEY, data.refreshToken)
    Preferences.set({ key: REFRESH_KEY, value: data.refreshToken }).catch(() => {})
    startProactiveRefreshCycle(data.accessToken)
    return 'pulih'
  } catch (err) {
    return tolakanAuth(err) ? 'gagal' : 'jaringan'
  } finally {
    setRefreshing(false)
  }
}

// Berapa kali boleh menunggu refresh lain selesai sebelum menyerah diam-diam.
// Terbatas supaya tidak ada perulangan tak berujung.
let _tungguRefreshLain = 0

// HMR-safe: module-level ref agar listener lama tidak menumpuk saat hot-replace
let _bsiLogoutHandler: (() => void) | null = null
let _bsiWsAuthHandler: (() => void) | null = null

export const useAuthStore = create<AuthState>((set) => {
  // bsi:logout: diemit api.service.ts saat reactive refresh final fail (refresh token expired/invalid)
  if (typeof window !== 'undefined') {
    if (_bsiLogoutHandler) {
      window.removeEventListener('bsi:logout', _bsiLogoutHandler)
    }
    _bsiLogoutHandler = () => {
      clearProactiveRefresh()
      wsService.disconnect()
      removeAccessToken()
      localStorage.removeItem(REFRESH_KEY)
      Preferences.remove({ key: TOKEN_KEY }).catch(() => {})
      Preferences.remove({ key: REFRESH_KEY }).catch(() => {})
      set({
        user: null,
        isAuthenticated: false,
        error: null,
        isLoading: false,
        sesiDitolak: false
      })
    }
    window.addEventListener('bsi:logout', _bsiLogoutHandler)

    // WS 4001 (native): server menolak token. Coba refresh SEKALI.
    // Sukses -> soket hidup lagi, pengguna tidak perlu tahu apa pun.
    // Gagal -> spanduk; pengguna yang memutuskan, bukan kode ini.
    if (_bsiWsAuthHandler) {
      window.removeEventListener('bsi:ws-auth-rejected', _bsiWsAuthHandler)
    }
    _bsiWsAuthHandler = () => {
      void (async () => {
        const hasil = await refreshKarenaWsDitolak()

        if (hasil === 'lewati') {
          // Refresh lain sedang berjalan. Jangan tuduh sesi mati. Beri waktu,
          // lalu periksa lagi: kalau soket masih mati, minta sekali lagi.
          if (_tungguRefreshLain >= 3) {
            console.warn('[auth.store] Refresh lain tak kunjung selesai; berhenti menunggu.')
            _tungguRefreshLain = 0
            return
          }
          _tungguRefreshLain++
          setTimeout(() => {
            if (!wsService.isConnected) {
              window.dispatchEvent(new Event('bsi:ws-auth-rejected'))
            }
          }, 5000)
          return
        }

        if (hasil === 'jaringan') {
          // Server tidak terjangkau. Itu BUKAN sesi mati, jadi spanduk tetap
          // padam. Coba lagi sebentar; jaring pengaman terakhirnya tetap
          // pendengar 'online'/'focus' yang sudah ada di ws.service.
          if (_tungguRefreshLain >= 3) {
            console.warn('[auth.store] Refresh 4001 gagal karena jaringan; menunggu online/focus.')
            _tungguRefreshLain = 0
            return
          }
          _tungguRefreshLain++
          setTimeout(() => {
            if (!wsService.isConnected) {
              window.dispatchEvent(new Event('bsi:ws-auth-rejected'))
            }
          }, 10_000)
          return
        }

        _tungguRefreshLain = 0
        if (hasil === 'pulih') {
          set({ sesiDitolak: false })
          wsService.reconnectNow()
          return
        }
        console.warn('[auth.store] Refresh setelah WS 4001 gagal -- spanduk sesi dinyalakan.')
        set({ sesiDitolak: true })
      })()
    }
    window.addEventListener('bsi:ws-auth-rejected', _bsiWsAuthHandler)
  }

  return {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    sesiDitolak: false,

    login: async (username, password) => {
      // Session-revoke: jika sesi aktif → revoke di server dulu sebelum login baru.
      // authApi.logout() pakai axios biasa (bukan api instance) → interceptor tidak jalan
      // → tidak ada risiko re-schedule proactive selama proses logout.
      // TOKEN_KEY belum dihapus saat logout dipanggil → header Authorization masih valid.
      const existingRefresh = localStorage.getItem(REFRESH_KEY)
      if (existingRefresh) {
        wsService.disconnect()
        await authApi.logout().catch(() => {})
        clearProactiveRefresh()
        removeAccessToken()
        localStorage.removeItem(REFRESH_KEY)
      }

      wsService.disconnect()
      set({ isLoading: true, error: null })

      try {
        const { data } = await authApi.login(username, password)
        setAccessToken(data.accessToken)
        // WEB: tidak ada refresh token dan tidak ada cermin Preferences
        // (di browser Preferences = localStorage, yang justru ingin dihindari).
        if (!IS_WEB) {
          Preferences.set({ key: TOKEN_KEY, value: data.accessToken }).catch(() => {})
          localStorage.setItem(REFRESH_KEY, data.refreshToken)
          Preferences.set({ key: REFRESH_KEY, value: data.refreshToken }).catch(() => {})
        }
        // Status presence hidup di Redis; kolom DB bisa basi (OFFLINE) padahal WS
        // sudah tersambung. Pertahankan status yang sudah ada, dan jangan pernah
        // menampilkan OFFLINE untuk diri sendiri saat sesi ini jelas hidup.
        set((s) => {
          const st = s.user?.status ?? (data.user.status === 'OFFLINE' ? 'AVAILABLE' : data.user.status)
          return { user: { ...data.user, status: st }, isAuthenticated: true, isLoading: false }
        })
        wsService.connect()
        startProactiveRefreshCycle(data.accessToken)
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          'Login failed. Please check your username/password.'
        set({ error: msg, isLoading: false })
      }
    },

    logout: async () => {
      // authApi.logout() dulu (TOKEN_KEY masih ada → header valid) → baru clear
      clearProactiveRefresh()
      wsService.disconnect()
      // Hapus token push di backend SEBELUM sesi dibersihkan -- endpoint
      // /push/unsubscribe butuh Authorization yang masih valid. Tanpa ini,
      // backend terus mengirim notifikasi ke perangkat yang sudah logout.
      // Dibatasi 3 detik. Logout yang SELALU selesai lebih penting daripada
      // token yang pasti terhapus -- token sisa tersapu sendiri saat login
      // berikutnya di perangkat yang sama (upsert berkunci token).
      await Promise.race([
        unregisterPushAndroid(),
        new Promise<void>((resolve) => setTimeout(resolve, 3000))
      ])
      try {
        await authApi.logout()
      } catch {
        // Network gagal saat logout — tetap lanjut local cleanup
      }
      removeAccessToken()
      localStorage.removeItem(REFRESH_KEY)
      Preferences.remove({ key: TOKEN_KEY }).catch(() => {})
      Preferences.remove({ key: REFRESH_KEY }).catch(() => {})
      set({ user: null, isAuthenticated: false, error: null, sesiDitolak: false })
    },

    loadMe: async () => {
      const token = getAccessToken()
      if (!token) return

      // WS dibuka SEGERA, paralel dgn /users/me -- token di localStorage sudah
      // cukup utk WS auth sendiri. Kalau /users/me gagal (token invalid), blok
      // catch di bawah men-disconnect lagi -- tak ada risiko identitas salah.
      wsService.connect()

      set({ isLoading: true })
      try {
        const { data } = await usersApi.me()
        // TODO (Langkah 8): verifikasi shape — data.user atau data langsung?
        // Konfirmasi: curl -H "Authorization: Bearer <token>" GET /api/users/me
        // Status presence hidup di Redis; kolom DB bisa basi (OFFLINE) padahal WS
        // sudah tersambung. Pertahankan status yang sudah ada, dan jangan pernah
        // menampilkan OFFLINE untuk diri sendiri saat sesi ini jelas hidup.
        set((s) => {
          const st = s.user?.status ?? (data.user.status === 'OFFLINE' ? 'AVAILABLE' : data.user.status)
          return { user: { ...data.user, status: st }, isAuthenticated: true, isLoading: false }
        })
        startProactiveRefreshCycle(token)
      } catch {
        wsService.disconnect()
        clearProactiveRefresh()
        removeAccessToken()
        localStorage.removeItem(REFRESH_KEY)
        Preferences.remove({ key: TOKEN_KEY }).catch(() => {})
        Preferences.remove({ key: REFRESH_KEY }).catch(() => {})
        set({ user: null, isAuthenticated: false, isLoading: false, sesiDitolak: false })
      }
    },

    clearError: () => set({ error: null })
  }
})

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    if (_bsiLogoutHandler) {
      window.removeEventListener('bsi:logout', _bsiLogoutHandler)
      _bsiLogoutHandler = null
    }
    if (_bsiWsAuthHandler) {
      window.removeEventListener('bsi:ws-auth-rejected', _bsiWsAuthHandler)
      _bsiWsAuthHandler = null
    }
    clearProactiveRefresh()
  })
}
