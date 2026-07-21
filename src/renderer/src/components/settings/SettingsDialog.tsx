import { useEffect, useState } from 'react'
import { isEnabled } from '../../services/notification.service'
import { NOTIF_ENABLED_KEY, NOTIF_SOUND_KEY, SERVER_URL } from '../../config/constants'
import { authApi } from '../../services/api.service'

interface Settings {
  downloadDir: string | null
  openAtLogin: boolean
}

interface SettingsDialogProps {
  onClose: () => void
}

type Tab = 'general' | 'startup' | 'notifications' | 'account'

const TABS: { id: Tab; label: string }[] = [
  { id: 'general', label: 'General' },
  { id: 'startup', label: 'Startup' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'account', label: 'Account' }
]

export default function SettingsDialog({ onClose }: SettingsDialogProps) {
  const [settings, setSettings] = useState<Settings>({ downloadDir: null, openAtLogin: false })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notifEnabled, setNotifEnabled] = useState(() => isEnabled(NOTIF_ENABLED_KEY))
  const [notifSound, setNotifSound] = useState(() => isEnabled(NOTIF_SOUND_KEY))
  const [activeTab, setActiveTab] = useState<Tab>('general')
  const [newPass, setNewPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [pwError, setPwError] = useState<string | null>(null)
  const [pwSuccess, setPwSuccess] = useState(false)

  useEffect(() => {
    window.api.getSettings().then((s) => {
      setSettings(s)
      setLoading(false)
    })
  }, [])

  const handlePickFolder = async () => {
    const result = await window.api.pickDownloadFolder()
    if (result.canceled === false) {
      setSettings((prev) => ({ ...prev, downloadDir: result.path }))
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    localStorage.setItem(NOTIF_ENABLED_KEY, String(notifEnabled))
    localStorage.setItem(NOTIF_SOUND_KEY, String(notifSound))
    const result = await window.api.setSettings({ ...settings, downloadDir: settings.downloadDir ?? undefined })
    setSaving(false)
    if (result.ok) {
      onClose()
    } else {
      setError(result.error)
    }
  }

  const handleChangePassword = async () => {
    setPwError(null)
    setPwSuccess(false)
    if (newPass.length < 8) {
      setPwError('Password minimal 8 karakter.')
      return
    }
    if (newPass !== confirmPass) {
      setPwError('Konfirmasi password tidak cocok.')
      return
    }
    setPwSaving(true)
    try {
      await authApi.changePassword(newPass)
      setPwSuccess(true)
      setNewPass('')
      setConfirmPass('')
    } catch {
      setPwError('Gagal mengubah password. Coba lagi.')
    } finally {
      setPwSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg w-[640px] h-[420px] flex flex-col shadow-xl overflow-hidden">
        <div className="px-6 pt-5 pb-3 border-b border-gray-700">
          <h2 className="text-white font-semibold text-lg">Settings</h2>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-400 text-sm">Loading...</p>
          </div>
        ) : (
          <>
            <div className="flex-1 flex min-h-0">
              {/* Sidebar navigasi kategori */}
              <nav className="w-40 flex-shrink-0 border-r border-gray-700 py-3 flex flex-col gap-1">
                {TABS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveTab(t.id)}
                    className={`text-left px-4 py-2 text-sm transition-colors ${
                      activeTab === t.id
                        ? 'bg-gray-700 text-white border-l-2 border-blue-500'
                        : 'text-gray-400 hover:text-white hover:bg-gray-700'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </nav>

              {/* Panel konten sesuai tab aktif */}
              <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
                {activeTab === 'general' && (
                  <>
                    <div className="flex flex-col gap-1">
                      <label className="text-gray-300 text-sm">Server</label>
                      <input
                        readOnly
                        value={SERVER_URL}
                        className="bg-gray-900 text-gray-400 text-sm rounded px-3 py-1.5 outline-none cursor-not-allowed"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-gray-300 text-sm">Download Folder</label>
                      <div className="flex gap-2">
                        <input
                          readOnly
                          value={settings.downloadDir ?? '(default)'}
                          className="flex-1 bg-gray-700 text-white text-sm rounded px-3 py-1.5 outline-none"
                        />
                        <button
                          onClick={handlePickFolder}
                          className="px-3 py-1.5 bg-gray-600 hover:bg-gray-500 text-white text-sm rounded"
                        >
                          Browse
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {activeTab === 'startup' && (
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="openAtLogin"
                      checked={settings.openAtLogin}
                      onChange={(e) => setSettings((prev) => ({ ...prev, openAtLogin: e.target.checked }))}
                      className="w-4 h-4 accent-blue-500"
                    />
                    <label htmlFor="openAtLogin" className="text-gray-300 text-sm">
                      Open at login
                    </label>
                  </div>
                )}

                {activeTab === 'notifications' && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="notifEnabled"
                        checked={notifEnabled}
                        onChange={(e) => setNotifEnabled(e.target.checked)}
                        className="w-4 h-4 accent-blue-500"
                      />
                      <label htmlFor="notifEnabled" className="text-gray-300 text-sm">
                        Show notifications for new messages
                      </label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="notifSound"
                        checked={notifSound}
                        disabled={!notifEnabled}
                        onChange={(e) => setNotifSound(e.target.checked)}
                        className="w-4 h-4 accent-blue-500 disabled:opacity-40"
                      />
                      <label htmlFor="notifSound" className="text-gray-300 text-sm">
                        Play sound
                      </label>
                    </div>
                  </div>
                )}

                {activeTab === 'account' && (
                  <div className="flex flex-col gap-3 max-w-sm">
                    <p className="text-gray-400 text-xs">
                      Ubah password login Anda. Minimal 8 karakter.
                    </p>
                    <div className="flex flex-col gap-1">
                      <label className="text-gray-300 text-sm">New Password</label>
                      <input
                        type="password"
                        value={newPass}
                        maxLength={128}
                        onChange={(e) => setNewPass(e.target.value)}
                        className="bg-gray-700 text-white text-sm rounded px-3 py-1.5 outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-gray-300 text-sm">Confirm Password</label>
                      <input
                        type="password"
                        value={confirmPass}
                        maxLength={128}
                        onChange={(e) => setConfirmPass(e.target.value)}
                        className="bg-gray-700 text-white text-sm rounded px-3 py-1.5 outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    {pwError && <p className="text-red-400 text-sm">{pwError}</p>}
                    {pwSuccess && <p className="text-green-400 text-sm">Password berhasil diubah.</p>}
                    <button
                      onClick={handleChangePassword}
                      disabled={pwSaving}
                      className="self-start px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm rounded"
                    >
                      {pwSaving ? 'Changing...' : 'Change Password'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Footer global */}
            <div className="px-6 py-3 border-t border-gray-700 flex items-center justify-end gap-2">
              {error && <p className="text-red-400 text-sm mr-auto">{error}</p>}
              <button
                onClick={onClose}
                className="px-4 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm rounded"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
