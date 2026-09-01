import { API_URL } from '../config/constants'

/**
 * Napas server.
 *
 * Aplikasi ini menyala otomatis saat Windows dinyalakan. Pada detik-detik itu
 * jaringan sering belum siap: proxy lokal Electron sudah mendengarkan, tapi
 * permintaan keluarnya gagal dan ia menjawab 502.
 *
 * Daripada menebak dengan mengulang endpoint mahal, klien BERTANYA pada satu
 * titik murah tanpa autentikasi. Selama belum dijawab, tidak ada permintaan
 * data sungguhan yang dikirim sama sekali -- balapan itu hilang di akarnya.
 *
 * fetch, BUKAN axios: instance axios membawa interceptor 401 dan mesin refresh
 * token. Sebuah pemeriksaan kesiapan tidak boleh bisa memicu logout.
 */
export async function pingServer(timeoutMs = 5000): Promise<boolean> {
  try {
    const ctl = new AbortController()
    const t = window.setTimeout(() => ctl.abort(), timeoutMs)
    const res = await fetch(`${API_URL}/health`, { signal: ctl.signal, cache: 'no-store' })
    window.clearTimeout(t)
    return res.ok
  } catch {
    return false
  }
}

// Satu penantian pada satu waktu. Tanpa ini, pemicu 'online' dan pemuatan
// percakapan bisa menjalankan dua putaran yang saling menimpa.
let inFlight: Promise<void> | null = null

export function waitForServer(onAttempt?: (n: number, delayMs: number) => void): Promise<void> {
  if (inFlight) return inFlight
  inFlight = (async () => {
    let n = 0
    for (;;) {
      if (await pingServer()) return
      n += 1
      const delay = Math.min(1000 * 2 ** (n - 1), 15000)
      onAttempt?.(n, delay)
      await new Promise((r) => window.setTimeout(r, delay))
    }
  })().finally(() => {
    inFlight = null
  })
  return inFlight
}
