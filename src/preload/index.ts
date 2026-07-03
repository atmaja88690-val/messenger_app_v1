import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer — jembatan menu native (main) → React (renderer).
// Tiap on* mengembalikan unsubscribe function untuk dipanggil di useEffect cleanup,
// supaya tidak ada listener menumpuk saat komponen unmount/remount (HMR-safe).
const api = {
  onNewUser: (callback: () => void) => {
    const handler = (): void => callback()
    ipcRenderer.on('menu:new-user', handler)
    return () => ipcRenderer.removeListener('menu:new-user', handler)
  },
  onLogout: (callback: () => void) => {
    const handler = (): void => callback()
    ipcRenderer.on('menu:logout', handler)
    return () => ipcRenderer.removeListener('menu:logout', handler)
  },
  onSettings: (callback: () => void) => {
    const handler = (): void => callback()
    ipcRenderer.on('menu:settings', handler)
    return () => ipcRenderer.removeListener('menu:settings', handler)
  },
  onMyProfile: (callback: () => void) => {
    const handler = (): void => callback()
    ipcRenderer.on('menu:my-profile', handler)
    return () => ipcRenderer.removeListener('menu:my-profile', handler)
  },
  onAbout: (callback: () => void) => {
    const handler = (): void => callback()
    ipcRenderer.on('menu:about', handler)
    return () => ipcRenderer.removeListener('menu:about', handler)
  },
  // Request-response ke main: simpan file lewat dialog OS asli.
  // Tipe balikan dideklarasikan di index.d.ts (MenuBridge.saveFileAs).
  saveFileAs: (fileName: string, data: Uint8Array) =>
    ipcRenderer.invoke('file:saveAs', fileName, data),
  // Settings (fitur Options): get/set + pilih folder download.
  // Pola invoke, handler di main/index.ts (settings:get/set/pickFolder).
  getSettings: () => ipcRenderer.invoke('settings:get'),
  setSettings: (patch: { downloadDir?: string; openAtLogin?: boolean }) =>
    ipcRenderer.invoke('settings:set', patch),
  pickDownloadFolder: () => ipcRenderer.invoke('settings:pickFolder'),
  // Dipanggil dari notification.service.ts saat toast diklik: fokuskan window OS.
  focusWindow: () => ipcRenderer.invoke('window:focus')
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
