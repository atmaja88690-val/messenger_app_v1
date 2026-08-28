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
import { TOKEN_KEY, REFRESH_KEY } from '../config/constants'
import { authApi, usersApi } from '../services/api.service'
import { wsService } from '../services/ws.service'
import { unregisterPushAndroid } from '../services/push-android.service'
import {
  scheduleProactiveRefresh,
  clearProactiveRefresh
} from '../services/token-scheduler.service'
import { Preferences } from '@capacitor/preferences'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
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
  scheduleProactiveRefresh(accessToken, async (): Promise<void> => {
    const refreshToken = localStorage.getItem(REFRESH_KEY)
    if (!refreshToken) return

    try {
      const { data } = await authApi.refresh(refreshToken)
      localStorage.setItem(TOKEN_KEY, data.accessToken)
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
  if (localStorage.getItem(TOKEN_KEY)) return
  try {
    const [{ value: access }, { value: refresh }] = await Promise.all([
      Preferences.get({ key: TOKEN_KEY }),
      Preferences.get({ key: REFRESH_KEY })
    ])
    if (access) localStorage.setItem(TOKEN_KEY, access)
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh)
  } catch (e) {
    console.error('[auth.store] Gagal restore token dari Preferences:', e)
  }
}

// HMR-safe: module-level ref agar listener lama tidak menumpuk saat hot-replace
let _bsiLogoutHandler: (() => void) | null = null

export const useAuthStore = create<AuthState>((set) => {
  // bsi:logout: diemit api.service.ts saat reactive refresh final fail (refresh token expired/invalid)
  if (typeof window !== 'undefined') {
    if (_bsiLogoutHandler) {
      window.removeEventListener('bsi:logout', _bsiLogoutHandler)
    }
    _bsiLogoutHandler = () => {
      clearProactiveRefresh()
      wsService.disconnect()
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(REFRESH_KEY)
      Preferences.remove({ key: TOKEN_KEY }).catch(() => {})
      Preferences.remove({ key: REFRESH_KEY }).catch(() => {})
      set({ user: null, isAuthenticated: false, error: null, isLoading: false })
    }
    window.addEventListener('bsi:logout', _bsiLogoutHandler)
  }

  return {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,

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
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(REFRESH_KEY)
      }

      wsService.disconnect()
      set({ isLoading: true, error: null })

      try {
        const { data } = await authApi.login(username, password)
        localStorage.setItem(TOKEN_KEY, data.accessToken)
        Preferences.set({ key: TOKEN_KEY, value: data.accessToken }).catch(() => {})
        localStorage.setItem(REFRESH_KEY, data.refreshToken)
        Preferences.set({ key: REFRESH_KEY, value: data.refreshToken }).catch(() => {})
        set({ user: data.user, isAuthenticated: true, isLoading: false })
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
      await unregisterPushAndroid()
      try {
        await authApi.logout()
      } catch {
        // Network gagal saat logout — tetap lanjut local cleanup
      }
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(REFRESH_KEY)
      Preferences.remove({ key: TOKEN_KEY }).catch(() => {})
      Preferences.remove({ key: REFRESH_KEY }).catch(() => {})
      set({ user: null, isAuthenticated: false, error: null })
    },

    loadMe: async () => {
      const token = localStorage.getItem(TOKEN_KEY)
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
        set({ user: data.user, isAuthenticated: true, isLoading: false })
        startProactiveRefreshCycle(token)
      } catch {
        wsService.disconnect()
        clearProactiveRefresh()
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(REFRESH_KEY)
        Preferences.remove({ key: TOKEN_KEY }).catch(() => {})
        Preferences.remove({ key: REFRESH_KEY }).catch(() => {})
        set({ user: null, isAuthenticated: false, isLoading: false })
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
    clearProactiveRefresh()
  })
}
