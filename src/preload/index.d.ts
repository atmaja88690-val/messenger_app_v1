import { ElectronAPI } from '@electron-toolkit/preload'

interface MenuBridge {
  onNewUser: (callback: () => void) => () => void
  onLogout: (callback: () => void) => () => void
  onSettings: (callback: () => void) => () => void
  onMyProfile: (callback: () => void) => () => void
  onAbout: (callback: () => void) => () => void
  saveFileAs: (
    fileName: string,
    data: Uint8Array
  ) => Promise<{ ok: true; canceled: boolean } | { ok: false; error: string }>
  getSettings: () => Promise<{ downloadDir: string | null; openAtLogin: boolean }>
  setSettings: (patch: { downloadDir?: string; openAtLogin?: boolean }) => Promise<{ ok: true; downloadDir: string | null; openAtLogin: boolean } | { ok: false; error: string }>
  pickDownloadFolder: () => Promise<{ canceled: true } | { canceled: false; path: string }>
  focusWindow: () => Promise<void>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: MenuBridge
  }
}
