import { Capacitor, registerPlugin } from '@capacitor/core'
import { Preferences } from '@capacitor/preferences'

// Minta pengecualian battery optimization sekali seumur install -- OEM agresif
// (TECNO/Transsion dkk) membersihkan notifikasi & proses app di background;
// dialog sistem ini me-whitelist app dari Doze/App Standby. NO-OP di
// Electron/web (guard native), dan NO-OP kalau sudah pernah diminta (flag
// Preferences) -- tidak boleh nagging tiap buka app.
interface BatteryOptimizationPlugin {
  isIgnoringBatteryOptimizations(): Promise<{ ignoring: boolean }>
  requestIgnoreBatteryOptimizations(): Promise<void>
}

const BatteryOptimization = registerPlugin<BatteryOptimizationPlugin>('BatteryOptimization')
const ASKED_KEY = 'battery_opt_asked'

let requested = false

export async function requestBatteryOptimizationExemption(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return
  if (requested) return
  requested = true
  try {
    const { value } = await Preferences.get({ key: ASKED_KEY })
    if (value === '1') return // sudah pernah diminta -- jangan nagging

    const { ignoring } = await BatteryOptimization.isIgnoringBatteryOptimizations()
    if (!ignoring) {
      await BatteryOptimization.requestIgnoreBatteryOptimizations()
    }
    await Preferences.set({ key: ASKED_KEY, value: '1' })
  } catch (err) {
    console.error('[BatteryOptimization] gagal:', err)
    // Flag ASKED_KEY sengaja tidak diset di sini -- kalau gagal karena error
    // (bukan user menolak dialog), boleh dicoba lagi sesi berikutnya.
  }
}
