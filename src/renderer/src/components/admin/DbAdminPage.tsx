import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { dbAdminApi } from '../../services/api.service'
import { useAuthStore } from '../../stores/auth.store'

interface BackupEntry {
  filename: string
  sizeBytes: number
  createdAt: string
}

interface RestoreStatus {
  status: 'none' | 'in_progress' | 'failed' | 'rolled_back' | 'success' | 'unknown'
  detail?: string
  filename?: string
  timestamp?: string
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export default function DbAdminPage() {
  const navigate = useNavigate()
  const me = useAuthStore((s) => s.user)
  const isModerator = me?.accountType === 'MODERATOR'

  const [backups, setBackups] = useState<BackupEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [backingUp, setBackingUp] = useState(false)

  const [confirmTarget, setConfirmTarget] = useState<BackupEntry | null>(null)
  const [confirmText, setConfirmText] = useState('')
  const [restoring, setRestoring] = useState(false)
  const [restorePhase, setRestorePhase] = useState<'idle' | 'waiting' | 'done'>('idle')
  const [restoreResult, setRestoreResult] = useState<RestoreStatus | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await dbAdminApi.listBackups()
      setBackups(data.backups)
    } catch {
      setError('Gagal memuat daftar backup.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isModerator) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isModerator])

  const handleBackupNow = async () => {
    setBackingUp(true)
    setError(null)
    try {
      await dbAdminApi.createBackup()
      await load()
    } catch {
      setError('Backup gagal. Coba lagi.')
    } finally {
      setBackingUp(false)
    }
  }

  const handleDownload = async (filename: string) => {
    try {
      const blob = await dbAdminApi.downloadBackup(filename)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch {
      setError('Gagal mengunduh file.')
    }
  }

  const openConfirm = (b: BackupEntry) => {
    setConfirmTarget(b)
    setConfirmText('')
  }

  const pollAfterRestore = () => {
    setRestorePhase('waiting')
    const start = Date.now()
    const interval = setInterval(async () => {
      try {
        await dbAdminApi.listBackups()
        clearInterval(interval)
        const { data } = await dbAdminApi.restoreStatus()
        setRestoreResult(data)
        setRestorePhase('done')
        setRestoring(false)
        load()
      } catch {
        if (Date.now() - start > 120000) {
          clearInterval(interval)
          setRestorePhase('done')
          setRestoring(false)
          setError('API tidak kembali hidup dalam 2 menit. Cek server secara manual.')
        }
      }
    }, 3000)
  }

  const handleConfirmRestore = async () => {
    if (!confirmTarget) return
    setRestoring(true)
    setRestoreResult(null)
    try {
      await dbAdminApi.triggerRestore(confirmTarget.filename)
    } catch {
      // Wajar -- API kemungkinan sudah/segera mati sbg bagian proses restore.
      // Tetap lanjut polling, jangan dianggap gagal di sini.
    }
    setConfirmTarget(null)
    pollAfterRestore()
  }

  if (!isModerator) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Halaman ini khusus untuk moderator.</p>
          <button onClick={() => navigate({ to: '/' })} className="mt-2 px-4 py-2 bg-[#4aa3df] text-white rounded-lg text-sm">Back to chat</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
        <h1 className="text-lg font-semibold text-gray-900">Database Admin</h1>
        <button onClick={() => navigate({ to: '/' })} className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg">Back to chat</button>
      </div>

      <div className="p-6 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">
            Backup terjadwal otomatis: mingguan (Minggu 03:00) & bulanan (tgl 1, 03:30).
          </p>
          <button
            onClick={handleBackupNow}
            disabled={backingUp}
            className="px-4 py-2 bg-[#4aa3df] hover:bg-[#3d8fc7] disabled:opacity-50 text-white rounded-lg text-sm flex-shrink-0"
          >
            {backingUp ? 'Membuat backup...' : '+ Backup sekarang'}
          </button>
        </div>

        {error && (
          <div className="mb-4 px-4 py-2 bg-red-50 text-red-700 text-sm rounded-lg">{error}</div>
        )}

        {loading ? (
          <p className="text-gray-400 text-sm">Memuat...</p>
        ) : backups.length === 0 ? (
          <p className="text-gray-400 text-sm">Belum ada backup.</p>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
            {backups.map((b) => (
              <div key={b.filename} className="flex items-center justify-between px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm text-gray-900 truncate">{b.filename}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(b.createdAt).toLocaleString('id-ID')} · {formatSize(b.sizeBytes)}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleDownload(b.filename)}
                    className="px-2.5 py-1 text-xs border border-gray-200 rounded-md text-gray-700 hover:bg-gray-100"
                  >
                    Unduh
                  </button>
                  <button
                    onClick={() => openConfirm(b)}
                    className="px-2.5 py-1 text-xs border border-red-200 rounded-md text-red-600 hover:bg-red-50"
                  >
                    Restore
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {confirmTarget && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[440px] flex flex-col gap-3 shadow-xl">
            <h2 className="text-gray-900 font-semibold text-lg">Konfirmasi Restore</h2>
            <p className="text-sm text-gray-600">
              Ini akan MENIMPA seluruh data saat ini dengan isi backup{' '}
              <span className="font-mono text-xs bg-gray-100 px-1 rounded">{confirmTarget.filename}</span>.
              API akan offline sebentar (biasanya di bawah 1 menit). Snapshot pengaman otomatis
              dibuat dulu, dan sistem akan mundur otomatis kalau restore gagal.
            </p>
            <p className="text-sm text-gray-600">
              Ketik <span className="font-mono font-semibold">RESTORE</span> untuk melanjutkan:
            </p>
            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1.5 text-sm"
              placeholder="RESTORE"
              autoFocus
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmTarget(null)}
                className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmRestore}
                disabled={confirmText !== 'RESTORE'}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm rounded"
              >
                Restore Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {restoring && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[440px] flex flex-col gap-3 shadow-xl text-center">
            {restorePhase === 'waiting' ? (
              <>
                <p className="text-gray-900 font-semibold">Restore sedang berjalan...</p>
                <p className="text-sm text-gray-600">
                  API sedang restart. Ini normal, biasanya selesai di bawah 1 menit.
                </p>
              </>
            ) : (
              <>
                {restoreResult?.status === 'success' && (
                  <p className="text-green-600 font-semibold">Restore sukses.</p>
                )}
                {restoreResult?.status === 'rolled_back' && (
                  <p className="text-amber-600 font-semibold">
                    Restore gagal, sistem sudah mundur otomatis ke snapshot pengaman.
                  </p>
                )}
                {restoreResult?.status === 'failed' && (
                  <p className="text-red-600 font-semibold">Restore gagal.</p>
                )}
                {restoreResult?.detail && (
                  <p className="text-xs text-gray-500">{restoreResult.detail}</p>
                )}
                <button
                  onClick={() => { setRestoring(false); setRestorePhase('idle') }}
                  className="mt-2 px-4 py-2 bg-[#4aa3df] text-white rounded-lg text-sm self-center"
                >
                  Tutup
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
