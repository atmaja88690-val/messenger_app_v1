/**
 * token-scheduler.service.ts  (BSIM) — Virola-grade resilience
 *
 * Lapis pertahanan:
 * 1. Proaktif terjadwal di 80% lifetime (single-flight + retry-backoff).
 * 2. Wake/online/focus recovery: saat app bangun dari sleep ATAU internet
 *    balik, cek expiry token — kalau sudah/hampir expired, refresh SEGERA.
 *    Ini menutup celah setTimeout yang mati saat laptop sleep.
 * 3. Tidak logout saat network gagal (itu tugas api.service membedakannya).
 */

let scheduledTimer: ReturnType<typeof setTimeout> | null = null
let isRefreshing = false

// Simpan token + callback aktif agar wake/online recovery bisa pakai ulang
let currentToken: string | null = null
let currentCallback: (() => Promise<void>) | null = null

const PROACTIVE_REFRESH_RATIO = 0.8
const MIN_SCHEDULE_DELAY_MS = 2000
const MAX_RETRIES = 3
const BACKOFF_BASE_MS = 1000
// Kalau sisa umur token < ambang ini saat wake/online → refresh segera
const WAKE_REFRESH_THRESHOLD_MS = 120_000 // 2 menit

function decodeJwtExp(token: string): number | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
    const payload = JSON.parse(atob(padded))
    if (typeof payload.exp !== 'number') return null
    return payload.exp
  } catch {
    return null
  }
}

export function clearProactiveRefresh(): void {
  if (scheduledTimer !== null) {
    clearTimeout(scheduledTimer)
    scheduledTimer = null
  }
  currentToken = null
  currentCallback = null
}

export function setRefreshing(value: boolean): void {
  isRefreshing = value
}

export function isRefreshInFlight(): boolean {
  return isRefreshing
}

// Jalankan refresh dengan retry-backoff. Dipakai proaktif maupun wake/online.
async function runRefreshWithRetry(cb: () => Promise<void>): Promise<void> {
  if (isRefreshing) {
    console.warn('[token-scheduler] Refresh sedang in-flight, lewati.')
    return
  }
  isRefreshing = true
  let attempt = 0
  while (attempt <= MAX_RETRIES) {
    try {
      await cb()
      break
    } catch {
      attempt++
      if (attempt > MAX_RETRIES) {
        console.error(`[token-scheduler] Refresh gagal setelah ${MAX_RETRIES} retry (kemungkinan offline). Akan dicoba lagi saat online/wake.`)
        break
      }
      const backoffMs = BACKOFF_BASE_MS * Math.pow(2, attempt - 1)
      console.warn(`[token-scheduler] Retry ${attempt}/${MAX_RETRIES} dalam ${backoffMs}ms`)
      await new Promise((res) => setTimeout(res, backoffMs))
    }
  }
  isRefreshing = false
}

export function scheduleProactiveRefresh(
  accessToken: string,
  onRefreshDue: () => Promise<void>
): void {
  clearProactiveRefresh()
  currentToken = accessToken
  currentCallback = onRefreshDue

  const exp = decodeJwtExp(accessToken)
  if (exp === null) {
    console.warn('[token-scheduler] Tidak bisa decode exp, proaktif dilewati.')
    return
  }

  const lifetimeMs = exp * 1000 - Date.now()
  if (lifetimeMs <= 0) {
    // Token sudah expired (mis. dijadwalkan tepat setelah wake) → refresh sekarang
    console.warn('[token-scheduler] Token sudah expired saat dijadwalkan — refresh segera.')
    void runRefreshWithRetry(onRefreshDue)
    return
  }

  const delayMs = Math.floor(lifetimeMs * PROACTIVE_REFRESH_RATIO)
  if (delayMs < MIN_SCHEDULE_DELAY_MS) {
    console.warn(`[token-scheduler] Sisa singkat (${delayMs}ms) — refresh segera.`)
    void runRefreshWithRetry(onRefreshDue)
    return
  }

  scheduledTimer = setTimeout(() => {
    scheduledTimer = null
    void runRefreshWithRetry(onRefreshDue)
  }, delayMs)

  console.info(`[token-scheduler] Proaktif terjadwal dalam ${Math.round(delayMs / 1000)}s`)
}

// --- Wake / online / focus recovery (kunci kekokohan ala Virola) ---
// Saat app bangun dari sleep atau internet balik, cek apakah token sudah/
// hampir expired. Kalau ya → refresh segera (jangan tunggu timer yang
// mungkin sudah mati selama sleep).
function checkAndRecover(reason: string): void {
  if (!currentToken || !currentCallback) return
  if (isRefreshing) return
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return // masih offline, tunggu 'online'

  const exp = decodeJwtExp(currentToken)
  if (exp === null) return
  const remainingMs = exp * 1000 - Date.now()

  if (remainingMs < WAKE_REFRESH_THRESHOLD_MS) {
    console.info(`[token-scheduler] Recovery (${reason}): token sisa ${Math.round(remainingMs / 1000)}s → refresh segera.`)
    void runRefreshWithRetry(currentCallback)
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => checkAndRecover('online'))
  window.addEventListener('focus', () => checkAndRecover('focus'))
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') checkAndRecover('visible')
  })
}

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    clearProactiveRefresh()
    isRefreshing = false
  })
}
