import { useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { Filesystem, Directory } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { attachmentsApi } from '../../services/api.service'
import type { Attachment } from '../../types'

// Bubble untuk lampiran BUKAN gambar: dokumen, lembar kerja, arsip.
//
// Berbeda dari AttachmentImage, berkasnya SENGAJA TIDAK diunduh saat bubble
// muncul -- hanya saat tombol ditekan. Gambar memang harus tampil, dokumen
// tidak. Percakapan berisi dua puluh lampiran Excel tidak boleh menarik dua
// puluh berkas dari server hanya untuk di-scroll lewat.

function formatBytes(bytes: number): string {
  if (!bytes) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function iconFor(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? ''
  if (ext === 'pdf') return '📕'
  if (ext === 'txt') return '📄'
  if (ext === 'apk') return '📦'
  if (['xls', 'xlsx', 'csv'].includes(ext)) return '📊'
  if (['doc', 'docx'].includes(ext)) return '📝'
  if (['ppt', 'pptx'].includes(ext)) return '📽️'
  if (['zip', 'rar', '7z'].includes(ext)) return '🗜️'
  return '📎'
}

interface Props {
  attachment: Attachment
  mine: boolean
}

export default function AttachmentFile({ attachment, mine }: Props) {
  const [busy, setBusy] = useState(false)
  const [errDetail, setErrDetail] = useState('')

  const handleDownload = async (): Promise<void> => {
    if (busy) return
    setBusy(true)
    setErrDetail('')
    try {
      const url = await attachmentsApi.getFile(attachment.id)
      const name = attachment.fileName || `file-${Date.now()}`

      if (Capacitor.isNativePlatform()) {
        // Jalur yang sama dengan Share Image di AttachmentImage: tulis ke
        // cache, ambil URI lewat FileProvider, serahkan ke Share sheet.
        const blob = await (await fetch(url)).blob()
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const r = new FileReader()
          r.onloadend = () => resolve(String(r.result))
          r.onerror = () => reject(new Error('Failed to read file'))
          r.readAsDataURL(blob)
        })
        await Filesystem.writeFile({ path: name, data: dataUrl, directory: Directory.Cache })
        const { uri } = await Filesystem.getUri({ directory: Directory.Cache, path: name })
        await Share.share({ title: name, url: uri })
      } else {
        const a = document.createElement('a')
        a.href = url
        a.download = name
        document.body.appendChild(a)
        a.click()
        a.remove()
      }
    } catch (err) {
      // Detail aslinya ditampilkan, bukan pesan generik -- tanpa ini bug
      // lampiran di Android mustahil didiagnosa tanpa kabel USB.
      const status = (err as { response?: { status?: number } })?.response?.status
      const code = (err as { code?: string })?.code
      const msg = (err as { message?: string })?.message
      const detail = status != null ? `HTTP ${status}` : (code ?? msg ?? 'unknown error')
      console.error('[AttachmentFile] download gagal', attachment.id, detail, err)
      setErrDetail(detail)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mb-1">
      <button
        onClick={handleDownload}
        disabled={busy}
        title={busy ? 'Downloading...' : 'Download'}
        className={`w-full max-w-[17rem] flex items-center gap-2.5 px-2.5 py-2 rounded-lg border text-left transition-colors ${
          mine ? 'bg-white/60 border-green-200 hover:bg-white' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
        } ${busy ? 'opacity-60 cursor-wait' : ''}`}
      >
        <span className="text-2xl flex-shrink-0 leading-none">{iconFor(attachment.fileName)}</span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm text-gray-800 truncate">{attachment.fileName}</span>
          <span className="block text-[11px] text-gray-500">
            {busy ? 'Downloading...' : formatBytes(attachment.sizeBytes)}
          </span>
        </span>
        <span className="text-gray-400 flex-shrink-0 text-sm">⬇</span>
      </button>
      {errDetail !== '' && (
        <div className="mt-1 text-[11px] text-red-600">Download failed: {errDetail}</div>
      )}
    </div>
  )
}
