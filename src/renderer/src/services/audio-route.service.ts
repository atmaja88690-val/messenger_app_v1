import { Capacitor, registerPlugin } from '@capacitor/core'

// Jembatan ke AudioRoutePlugin (Android). Di Electron/web tidak ada padanannya:
// semua fungsi jadi no-op yang mengembalikan nilai yang diminta, supaya
// pemanggil tidak perlu bercabang per platform.
interface AudioRouteNative {
  startCall(o: { speaker: boolean }): Promise<{ speaker: boolean }>
  setSpeaker(o: { speaker: boolean }): Promise<{ speaker: boolean }>
  stopCall(): Promise<void>
}

const Native = registerPlugin<AudioRouteNative>('AudioRoute')
const isNative = Capacitor.isNativePlatform()

export const audioRoute = {
  isSupported: isNative,

  // speaker=false -> earpiece (voice call). speaker=true -> loudspeaker (video call).
  // Balikan = rute yang BENAR-BENAR dipakai (bisa beda: headset terpasang,
  // atau tablet tanpa earpiece).
  async start(speaker: boolean): Promise<boolean> {
    if (!isNative) return speaker
    try {
      const r = await Native.startCall({ speaker })
      return r.speaker
    } catch (e) {
      console.warn('[audio-route] startCall gagal', e)
      return speaker
    }
  },

  async setSpeaker(speaker: boolean): Promise<boolean> {
    if (!isNative) return speaker
    try {
      const r = await Native.setSpeaker({ speaker })
      return r.speaker
    } catch (e) {
      console.warn('[audio-route] setSpeaker gagal', e)
      return speaker
    }
  },

  async stop(): Promise<void> {
    if (!isNative) return
    try {
      await Native.stopCall()
    } catch (e) {
      console.warn('[audio-route] stopCall gagal', e)
    }
  }
}
