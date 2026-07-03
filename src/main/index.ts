import { app, shell, BrowserWindow, ipcMain, Menu, dialog, type MenuItemConstructorOptions } from 'electron'
import { join } from 'path'
import { readFile, writeFile } from 'fs/promises'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

let mainWindow: BrowserWindow | null = null

// Settings persisten (fitur Options, Fase 1): settings.json di userData, milik main process.
// Hanya downloadDir disimpan di JSON -- openAtLogin sumber kebenarannya OS
// (app.get/setLoginItemSettings), supaya tidak ada drift dua sumber kebenaran.
interface AppSettings {
  downloadDir?: string
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
          label: 'New User',
          accelerator: 'CmdOrCtrl+Shift+N',
          click: () => {
            mainWindow?.webContents.send('menu:new-user')
          }
        },
        { type: 'separator' },
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
          label: 'About BSI Messenger',
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
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.bsi.messenger')

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

  // window:focus -- dipanggil renderer saat toast notifikasi diklik.
  // Restore dulu kalau minimized, baru show+focus (urutan ini wajib di Windows).
  ipcMain.handle('window:focus', () => {
    if (!mainWindow) return
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.show()
    mainWindow.focus()
  })

  buildMenu()
  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
