import { BaseCallUi } from '../base/base-call-ui'

// Desktop (Electron) tidak punya UI panggilan tingkat sistem: CallOverlay
// in-app sudah menangani seluruhnya, dan window selalu bisa ditampilkan.
// Semua metode mewarisi no-op dari BaseCallUi -- ini BUKAN kekurangan,
// melainkan jawaban yang benar untuk platform ini.
export class DesktopCallUi extends BaseCallUi {
  readonly platformName = 'desktop'
  readonly supported = false
}
