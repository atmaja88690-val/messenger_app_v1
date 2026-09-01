import { app, shell, BrowserWindow, ipcMain, Menu, dialog, clipboard, nativeImage, Notification, Tray, type MenuItemConstructorOptions } from 'electron'
import { join } from 'path'
import { readFile, writeFile } from 'fs/promises'
import { existsSync, mkdirSync, readdirSync, cpSync, writeFileSync } from 'fs'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { startLocalServer } from './local-server'
import icon from '../../resources/icon.png?asset'

// ── Folder data pengguna ────────────────────────────────────────────────────
// Token login karyawan ada di dalam folder ini. Electron menurunkan namanya
// dari productName, jadi mengganti nama aplikasi memindahkannya diam-diam dan
// membuat SEMUA orang mendarat di halaman login.
//
// Dikunci ke 'nnim' -- pendek, tanpa spasi, aman untuk path dan skrip. Isi
// folder lama disalin sekali, ditandai berkas .migrated. Penanda itu yang
// diperiksa, BUKAN keberadaan foldernya, supaya penyalinan yang putus di tengah
// dicoba lagi alih-alih meninggalkan folder setengah jadi.
//
// Seluruhnya dibungkus try/catch yang jatuh kembali ke folder lama: kegagalan
// terburuknya adalah keadaan sebelum penggantian nama, bukan logout massal.
const USER_DATA_NEW = join(app.getPath('appData'), 'nnim')
const USER_DATA_OLD = join(app.getPath('appData'), 'bsim')
try {
  const marker = join(USER_DATA_NEW, '.migrated')
  if (!existsSync(marker) && existsSync(USER_DATA_OLD)) {
    // Cache tidak ikut: besar, dibuat ulang sendiri, tidak memuat sesi.
    const skip = new Set(['Cache', 'GPUCache', 'Code Cache', 'DawnCache',
      'DawnGraphiteCache', 'DawnWebGPUCache', 'Crashpad', 'logs', 'Partitions'])
    mkdirSync(USER_DATA_NEW, { recursive: true })
    for (const entry of readdirSync(USER_DATA_OLD)) {
      if (skip.has(entry)) continue
      cpSync(join(USER_DATA_OLD, entry), join(USER_DATA_NEW, entry), { recursive: true })
    }
    writeFileSync(marker, new Date().toISOString())
  }
  app.setPath('userData', USER_DATA_NEW)
} catch (err) {
  console.error('[userData] migrasi gagal — tetap memakai folder lama:', err)
  try { app.setPath('userData', USER_DATA_OLD) } catch { /* biarkan bawaan Electron */ }
}

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null
// Bedakan "user menutup window" (-> sembunyi ke tray) dari "app benar-benar keluar".
// Tanpa flag ini, menu Keluar di tray ikut tercegat dan app tidak pernah bisa ditutup.
let isQuitting = false
// URL server proxy lokal (127.0.0.1:<port>), diisi startLocalServer() sebelum createWindow().
let localServerUrl: string | null = null

function createTray(): void {
  if (tray) return
  // Ikon sumber besar (untuk installer); tray Windows butuh 16x16, kalau tidak buram.
  const trayIcon = nativeImage.createFromPath(icon).resize({ width: 16, height: 16 })
  tray = new Tray(trayIcon)
  tray.setToolTip('NNI Messenger')

  const showWindow = (): void => {
    if (!mainWindow) return
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.show()
    mainWindow.focus()
  }

  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: 'Buka NNI Messenger', click: showWindow },
      { type: 'separator' },
      {
        label: 'Keluar',
        click: () => {
          isQuitting = true
          app.quit()
        }
      }
    ])
  )

  // Klik kiri: toggle. Perilaku yang diharapkan pengguna Windows.
  tray.on('click', () => {
    if (mainWindow?.isVisible() && !mainWindow.isMinimized()) {
      mainWindow.hide()
    } else {
      showWindow()
    }
  })
}

// Settings persisten (fitur Options, Fase 1): settings.json di userData, milik main process.
// Hanya downloadDir disimpan di JSON -- openAtLogin sumber kebenarannya OS
// (app.get/setLoginItemSettings), supaya tidak ada drift dua sumber kebenaran.
interface AppSettings {
  downloadDir?: string
  openAtLoginInitialized?: boolean
}

const settingsPath = (): string => join(app.getPath('userData'), 'settings.json')

async function readSettings(): Promise<AppSettings> {
  try {
    const raw = await readFile(settingsPath(), 'utf-8')
    const parsed = JSON.parse(raw)
    return typeof parsed === 'object' && parsed !== null ? (parsed as AppSettings) : {}
  } catch {
    // File belum ada atau JSON korup -> anggap kosong; write berikutnya menimpa bersih.
    return {}
  }
}

async function writeSettings(patch: Partial<AppSettings>): Promise<AppSettings> {
  const current = await readSettings()
  const next = { ...current, ...patch }
  await writeFile(settingsPath(), JSON.stringify(next, null, 2), 'utf-8')
  return next
}

function buildMenu(): void {
  const isMac = process.platform === 'darwin'

  const template: MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Logout',
          click: () => {
            mainWindow?.webContents.send('menu:logout')
          }
        },
        { type: 'separator' },
        isMac ? { role: 'close', label: 'Close Window' } : { role: 'quit', label: 'Quit' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload', label: 'Reload' },
        { role: 'forceReload', label: 'Force Reload' },
        { role: 'toggleDevTools', label: 'Toggle DevTools' },
        { type: 'separator' },
        { role: 'resetZoom', label: 'Actual Size' },
        { role: 'zoomIn', label: 'Zoom In' },
        { role: 'zoomOut', label: 'Zoom Out' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Toggle Full Screen' }
      ]
    },
    {
      label: 'Tools',
      submenu: [
        {
          label: 'Settings',
          click: () => {
            mainWindow?.webContents.send('menu:settings')
          }
        },
        {
          label: 'My User Profile',
          click: () => {
            mainWindow?.webContents.send('menu:my-profile')
          }
        }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About NNI Messenger',
          click: () => {
            mainWindow?.webContents.send('menu:about')
          }
        }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 720,
    show: false,
    autoHideMenuBar: false, // WAJIB false — menu native (File/View/Tools/Help) harus tampil
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  // Close-to-tray: X menyembunyikan, tidak mematikan app -- supaya notifikasi
  // tetap jalan di latar (bersama openAtLogin). Keluar sungguhan lewat menu tray.
  mainWindow.on('close', (event) => {
    if (isQuitting) return
    event.preventDefault()
    mainWindow?.hide()
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // Context-menu native (Cut/Copy/Paste/Select All) untuk elemen editable (input/textarea).
  // Electron tidak menampilkan context-menu apapun secara default saat klik kanan.
  mainWindow.webContents.on('context-menu', (_event, params) => {
    if (!params.isEditable) return
    const editMenu = Menu.buildFromTemplate([
      { role: 'cut', enabled: params.editFlags.canCut },
      { role: 'copy', enabled: params.editFlags.canCopy },
      { role: 'paste', enabled: params.editFlags.canPaste },
      { type: 'separator' },
      { role: 'selectAll', enabled: params.editFlags.canSelectAll }
    ])
    editMenu.popup()
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else if (localServerUrl) {
    mainWindow.loadURL(localServerUrl)
  } else {
    // Fallback darurat -- proxy lokal gagal start. App tetap bisa dibuka untuk
    // debugging, tapi API/WS kemungkinan gagal karena origin file:// / CORS.
    console.error('[main] Proxy lokal gagal start -- fallback loadFile (API/WS berisiko gagal)')
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// Single-instance lock: cegah app jalan dobel. Instance kedua langsung quit,
// instance pertama memunculkan window-nya (klik ikon/relaunch = fokus). Wajib
// supaya LOCAL_PORT tetap tidak bentrok dengan diri sendiri.
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
}
app.on('second-instance', () => {
  if (!mainWindow) return
  if (mainWindow.isMinimized()) mainWindow.restore()
  mainWindow.show()
  mainWindow.focus()
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  if (!gotTheLock) return
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.bsi.messenger')
  // Virola-style: aktifkan auto-start saat login Windows secara DEFAULT, tapi
  // hanya SEKALI (saat pertama app dijalankan). Setelah itu hormati pilihan user
  // lewat Tools -> Settings (openAtLogin). Flag disimpan di settings.json.
  try {
    const s0 = await readSettings()
    if (!s0.openAtLoginInitialized) {
      app.setLoginItemSettings({ openAtLogin: true })
      await writeSettings({ openAtLoginInitialized: true })
    }
  } catch (e) {
    console.error('[main] gagal set openAtLogin default:', e)
  }

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  // Save File As native: renderer kirim nama file + byte (Uint8Array),
  // main buka dialog OS asli lalu tulis ke lokasi pilihan user.
  // Return: { ok: true, canceled?: boolean } atau { ok: false, error: string }.
  ipcMain.handle('file:saveAs', async (_event, fileName: string, data: Uint8Array) => {
    try {
      const settings = await readSettings()
      const baseName = fileName || 'download'
      const result = await dialog.showSaveDialog({
        defaultPath: settings.downloadDir ? join(settings.downloadDir, baseName) : baseName,
        title: 'Save File As'
      })
      if (result.canceled || !result.filePath) {
        return { ok: true, canceled: true }
      }
      await writeFile(result.filePath, Buffer.from(data))
      return { ok: true, canceled: false }
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) }
    }
  })

  // image:copy -- taruh gambar ke clipboard OS (bitmap), supaya bisa di-paste
  // ke Word/WordPerfect/aplikasi lain maupun kembali ke chat.
  // Pola return sama dengan file:saveAs.
  ipcMain.handle('image:copy', async (_event, data: Uint8Array) => {
    try {
      const img = nativeImage.createFromBuffer(Buffer.from(data))
      // createFromBuffer TIDAK throw untuk format tak didukung (WebP/GIF/SVG);
      // ia balik image kosong. Tanpa cek ini, clipboard terisi gambar kosong
      // dan user mengira copy berhasil.
      if (img.isEmpty()) {
        return { ok: false, error: 'Format gambar tidak didukung clipboard (hanya PNG/JPEG)' }
      }
      clipboard.writeImage(img)
      return { ok: true }
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) }
    }
  })

  // Settings IPC (pola invoke, sama dengan file:saveAs).
  // settings:get -- gabungan JSON (downloadDir) + OS (openAtLogin).
  ipcMain.handle('settings:get', async () => {
    const s = await readSettings()
    return {
      downloadDir: s.downloadDir ?? null,
      openAtLogin: app.getLoginItemSettings().openAtLogin
    }
  })

  // settings:set -- openAtLogin diteruskan ke OS, downloadDir ke JSON.
  // Return state gabungan terbaru supaya renderer tidak perlu get ulang.
  ipcMain.handle('settings:set', async (_event, patch: { downloadDir?: string; openAtLogin?: boolean }) => {
    try {
      if (typeof patch.openAtLogin === 'boolean') {
        app.setLoginItemSettings({ openAtLogin: patch.openAtLogin })
      }
      if (typeof patch.downloadDir === 'string' && patch.downloadDir.length > 0) {
        await writeSettings({ downloadDir: patch.downloadDir })
      }
      const s = await readSettings()
      return {
        ok: true,
        downloadDir: s.downloadDir ?? null,
        openAtLogin: app.getLoginItemSettings().openAtLogin
      }
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) }
    }
  })

  // settings:pickFolder -- dialog pilih folder SAJA, tidak menyimpan.
  // Penyimpanan tetap satu pintu lewat settings:set (dipanggil renderer).
  ipcMain.handle('settings:pickFolder', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Choose Download Folder',
      properties: ['openDirectory']
    })
    if (result.canceled || result.filePaths.length === 0) {
      return { canceled: true }
    }
    return { canceled: false, path: result.filePaths[0] }
  })

  // notify:show -- toast lewat main process, BUKAN Web Notification API di renderer.
  // Alasan: hanya Notification milik Electron yang punya timeoutType 'never', yang
  // membuat toast bertahan sampai ditutup user (Windows: scenario='reminder').
  ipcMain.handle('notify:show', async (_event, opts: { title: string; body: string; silent?: boolean }) => {
    if (!Notification.isSupported()) return 'unsupported'
    return await new Promise<string>((resolve) => {
      const n = new Notification({
        title: opts.title,
        body: opts.body,
        silent: opts.silent === true,
        timeoutType: 'never'
      })
      n.on('click', () => resolve('clicked'))
      n.on('close', () => resolve('closed'))
      n.on('failed', () => resolve('failed'))
      n.show()
    })
  })

  // window:focus -- dipanggil renderer saat toast notifikasi diklik.
  // Restore dulu kalau minimized, baru show+focus (urutan ini wajib di Windows).
  ipcMain.handle('window:focus', () => {
    if (!mainWindow) return
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.show()
    mainWindow.focus()
  })

  // Proxy lokal HANYA untuk production build -- dev sudah punya proxy Vite sendiri.
  if (!is.dev) {
    try {
      localServerUrl = await startLocalServer(join(__dirname, '../renderer'))
      console.log('[main] Proxy lokal aktif:', localServerUrl)
    } catch (err) {
      console.error('[main] Gagal start proxy lokal:', err)
    }
  }

  buildMenu()
  createWindow()
  createTray()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('before-quit', () => {
  isQuitting = true
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
