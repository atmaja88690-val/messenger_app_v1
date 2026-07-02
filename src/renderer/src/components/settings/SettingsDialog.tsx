import { useEffect, useState } from 'react'

interface Settings {
  downloadDir: string | null
  openAtLogin: boolean
}

interface SettingsDialogProps {
  onClose: () => void
}

export default function SettingsDialog({ onClose }: SettingsDialogProps) {
  const [settings, setSettings] = useState<Settings>({ downloadDir: null, openAtLogin: false })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
    const result = await window.api.setSettings({ ...settings, downloadDir: settings.downloadDir ?? undefined })
    setSaving(false)
    if (result.ok) {
      onClose()
    } else {
      setError(result.error)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-[420px] flex flex-col gap-4 shadow-xl">
        <h2 className="text-white font-semibold text-lg">Settings</h2>

        {loading ? (
          <p className="text-gray-400 text-sm">Loading...</p>
        ) : (
          <>
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

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <div className="flex justify-end gap-2 pt-2">
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
