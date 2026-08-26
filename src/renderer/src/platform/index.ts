import { Capacitor } from '@capacitor/core'
import type { CallUiPort } from './contracts/call-ui.contract'
import { AndroidCallUi } from './android/android-call-ui'
import { IosCallUi } from './ios/ios-call-ui'
import { DesktopCallUi } from './desktop/desktop-call-ui'

// SATU-SATUNYA tempat di seluruh aplikasi yang boleh menanyakan platform.
// Kalau Anda menemukan Capacitor.getPlatform() atau window.api? di komponen
// untuk memilih perilaku call, itu tanda ada yang bocor keluar dari lapisan ini.
function createCallUi(): CallUiPort {
  const p = Capacitor.getPlatform()
  if (p === 'android') return new AndroidCallUi()
  if (p === 'ios') return new IosCallUi()
  return new DesktopCallUi()
}

export const callUi: CallUiPort = createCallUi()
export type { CallUiEvent, CallUiPort, IncomingCallDescriptor, CallEndReason } from './contracts/call-ui.contract'
