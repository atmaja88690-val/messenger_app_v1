import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Capacitor, registerPlugin } from '@capacitor/core'
import { Filesystem, Directory } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { attachmentsApi } from '../../services/api.service'
import { useChatStore } from '../../stores/chat.store'
import type { Attachment } from '../../types'

interface ClipboardImagePlugin {
  copyUri(options: { uri: string }): Promise<void>
}
const ClipboardImage = registerPlugin<ClipboardImagePlugin>('ClipboardImage')

const blobCache = new Map<string, string>()

type AttachmentWithLocal = Attachment & { _localUrl?: string }

function formatBytes(bytes: number): string {
  if (!bytes) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

// Clipboard Electron (nativeImage) HANYA paham PNG/JPEG - WebP/AVIF ditolak
// dgn "Format gambar tidak didukung clipboard". Transcode lewat canvas:
// kalau Chromium bisa MERENDER gambarnya, pasti bisa di-encode ulang.
async function toPngBytes(blobUrl: string): Promise<Uint8Array> {
  const blob = await (await fetch(blobUrl)).blob()
  const bitmap = await createImageBitmap(blob)
  const canvas = document.createElement('canvas')
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  const ctx = canvas.getContext('2d')
  if (ctx === null) throw new Error('Canvas 2D tidak tersedia')
  ctx.drawImage(bitmap, 0, 0)
  bitmap.close()
  const png = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (png === null) throw new Error('Gagal encode PNG')
  return new Uint8Array(await png.arrayBuffer())
}

interface Props {
  attachment: AttachmentWithLocal
  messageId: string
  conversationId: string
  canDelete: boolean
}

export default function AttachmentImage({ attachment, messageId, conversationId, canDelete }: Props) {
  const deleteMessage = useChatStore((s) => s.deleteMessage)
  const [src, setSrc] = useState<string | null>(attachment._localUrl ?? blobCache.get(attachment.id) ?? null)
  const [error, setError] = useState(false)
  const [errDetail, setErrDetail] = useState<string>('')
  const [reloadKey, setReloadKey] = useState(0)
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null)
  const [infoOpen, setInfoOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const [menuPos, setMenuPos] = useState<{ left: number; top: number; ready: boolean } | null>(null)

  useLayoutEffect(() => {
    if (!menu) {
      setMenuPos(null)
      return
    }
    const el = menuRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const margin = 8
    let left = menu.x
    let top = menu.y
    if (left + rect.width + margin > window.innerWidth) {
      left = window.innerWidth - rect.width - margin
    }
    if (top + rect.height + margin > window.innerHeight) {
      top = window.innerHeight - rect.height - margin
    }
    left = Math.max(margin, left)
    top = Math.max(margin, top)
    setMenuPos({ left, top, ready: true })
  }, [menu])

  useEffect(() => {
    if (attachment._localUrl || blobCache.has(attachment.id)) return
    // Lampiran optimistic (belum ter-upload) sudah dilayani _localUrl di atas
    // dan ditandai storageKey kosong. JANGAN pakai id.includes('-'): id server
    // = cuid (tak pernah ada '-'), sedangkan id optimistic = nanoid yang HANYA
    // kadang mengandung '-' -> guard lama lolos/menahan secara acak.
    if (!attachment.id) return
    if (attachment.storageKey === '') return

    let cancelled = false
    attachmentsApi
      .getFile(attachment.id)
      .then((url) => {
        if (cancelled) return
        blobCache.set(attachment.id, url)
        setSrc(url)
      })
        .catch((err) => {
          if (cancelled) return
          // Tanpa detail ini, bug attachment di Android mustahil didiagnosa
          // tanpa kabel USB. Tampilkan status/kode aslinya di layar.
          const status = (err as { response?: { status?: number } })?.response?.status
          const code = (err as { code?: string })?.code
          const msg = (err as { message?: string })?.message
          const detail = status != null ? ('HTTP ' + status) : (code ?? msg ?? 'unknown error')
          console.error('[AttachmentImage] getFile gagal', attachment.id, detail, err)
          setErrDetail(detail)
          setError(true)
        })

    return () => {
      cancelled = true
    }
  }, [attachment.id, reloadKey])

  const openMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setMenu({ x: e.clientX, y: e.clientY })
  }
  const closeMenu = () => setMenu(null)

  const handleSaveAs = async () => {
    if (!src) return
    closeMenu()
    try {
      // src adalah blob URL (dari getFile()); ambil byte-nya lalu serahkan ke
      // main process untuk ditulis lewat dialog OS asli (bukan auto-download browser).
      const buf = await (await fetch(src)).arrayBuffer()
      const res = await window.api!.saveFileAs(
        attachment.fileName || 'image',
        new Uint8Array(buf)
      )
      if (!res.ok) {
        console.error('[AttachmentImage] saveFileAs gagal', res.error)
        alert('Failed to save file.')
      }
    } catch (e) {
      console.error('[AttachmentImage] saveFileAs error', e)
      alert('Failed to save file.')
    }
  }

  // Android: clipboard gambar tidak didukung (hanya menempel base64 sbg teks).
  // Pola baku Android = Share sheet: tulis ke cache -> ambil URI -> bagikan.
  const shareImageAndroid = async (): Promise<void> => {
    if (!src) return
    try {
      const blob = await (await fetch(src)).blob()
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader()
        r.onloadend = () => resolve(String(r.result))
        r.onerror = () => reject(new Error('Failed to read image'))
        r.readAsDataURL(blob)
      })
      const name = attachment.fileName || `image-${Date.now()}.png`
      await Filesystem.writeFile({ path: name, data: dataUrl, directory: Directory.Cache })
      const { uri } = await Filesystem.getUri({ directory: Directory.Cache, path: name })
      await Share.share({ title: name, url: uri })
    } catch (e) {
      console.error('[AttachmentImage] shareImageAndroid error', e)
      alert('Failed to share image.')
    }
  }


  // Copy Image SUNGGUHAN ke clipboard sistem Android (bukan Share sheet).
  // Duplikasi kecil dari shareImageAndroid (tulis cache -> FileProvider URI) -
  // sengaja tidak direfactor jadi shared function, supaya Share Image yang
  // sudah teruji tetap utuh tak tersentuh.
  const handleCopyImageToClipboard = async () => {
    if (!src) return
    closeMenu()
    try {
      const blob = await (await fetch(src)).blob()
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader()
        r.onloadend = () => resolve(String(r.result))
        r.onerror = () => reject(new Error('Failed to read image'))
        r.readAsDataURL(blob)
      })
      const name = attachment.fileName || `image-${Date.now()}.png`
      await Filesystem.writeFile({ path: name, data: dataUrl, directory: Directory.Cache })
      const { uri } = await Filesystem.getUri({ directory: Directory.Cache, path: name })
      await ClipboardImage.copyUri({ uri })
    } catch (e) {
      console.error('[AttachmentImage] handleCopyImageToClipboard error', e)
      const msg = e instanceof Error ? e.message : String(e)
      alert(`Failed to copy image: ${msg}`)
    }
  }

  const handleCopyImage = async () => {
    if (!src) return
    closeMenu()
    // window.api hanya ada di Electron; di Android (WebView) undefined.
    if (Capacitor.isNativePlatform()) {
      await shareImageAndroid()
      return
    }
    if (!window.api?.copyImage) return
    try {
        const bytes = await toPngBytes(src)
        const res = await window.api.copyImage(bytes)
      if (!res.ok) {
        console.error('[AttachmentImage] copyImage gagal', res.error)
        alert(`Failed to copy image: ${res.error}`)
      }
    } catch (e) {
      console.error('[AttachmentImage] copyImage error', e)
      alert('Failed to copy image.')
    }
  }

  const handleDelete = async () => {
    closeMenu()
    if (!window.confirm('Delete this message? This cannot be undone.')) return
    try {
      await deleteMessage(conversationId, messageId)
    } catch (e) {
      console.error('[AttachmentImage] delete gagal', e)
      alert('Failed to delete message.')
    }
  }

  if (error) {
    return (
      <button
        type="button"
        onClick={() => { setError(false); setErrDetail(''); setReloadKey((k) => k + 1) }}
        className="w-48 h-32 flex flex-col items-center justify-center gap-1 bg-gray-800 rounded-lg text-gray-400 text-xs px-2 text-center"
        title="Tap to retry"
      >
        <span>Failed to load image</span>
        {errDetail !== '' && <span className="text-[10px] text-red-400 break-all">{errDetail}</span>}
        <span className="text-[10px] text-gray-500">Tap to retry</span>
      </button>
    )
  }

  if (!src) {
    return (
      <div className="w-48 h-32 flex items-center justify-center bg-gray-800 rounded-lg animate-pulse text-gray-500 text-xs">
        Loading...
      </div>
    )
  }

  return (
    <>
      <img
        src={src}
        alt={attachment.fileName}
        onContextMenu={openMenu}
        className="max-w-[280px] max-h-[280px] rounded-lg object-cover cursor-pointer"
        onClick={() => setPreviewOpen(true)}
      />

      {menu && (
        <>
          <div className="fixed inset-0 z-40" onClick={closeMenu} />
          <div
            ref={menuRef}
            className="fixed z-50 w-52 bg-gray-800 rounded-xl shadow-xl border border-gray-700 py-1 text-sm"
            style={{
              left: menuPos?.left ?? menu.x,
              top: menuPos?.top ?? menu.y,
              visibility: menuPos?.ready ? 'visible' : 'hidden'
            }}
          >
            {!Capacitor.isNativePlatform() && (
            <button
              onClick={handleSaveAs}
              className="w-full flex items-center gap-2 px-3 py-2 text-left text-gray-200 hover:bg-gray-700"
            >
              💾 Save File As...
            </button>
            )}
            <button
              onClick={handleCopyImage}
              className="w-full flex items-center gap-2 px-3 py-2 text-left text-gray-200 hover:bg-gray-700"
            >
              {Capacitor.isNativePlatform() ? '📤 Share Image' : '📋 Copy Image'}
            </button>
              {Capacitor.isNativePlatform() && (
              <button
                onClick={handleCopyImageToClipboard}
                className="w-full flex items-center gap-2 px-3 py-2 text-left text-gray-200 hover:bg-gray-700"
              >
                📋 Copy Image
              </button>
              )}
            <button
              onClick={() => { setInfoOpen(true); closeMenu() }}
              className="w-full flex items-center gap-2 px-3 py-2 text-left text-gray-200 hover:bg-gray-700"
            >
              ℹ️ Attachment Info
            </button>
            {canDelete && (
              <>
                <div className="border-t border-gray-700 my-1" />
                <button
                  onClick={handleDelete}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-red-400 hover:bg-gray-700"
                >
                  🗑️ Delete Message
                </button>
              </>
            )}
          </div>
        </>
      )}

      {previewOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 outline-none"
          onClick={() => setPreviewOpen(false)}
          onKeyDown={(e) => { if (e.key === 'Escape') setPreviewOpen(false) }}
          tabIndex={-1}
          ref={(el) => el?.focus()}
        >
          <button
            onClick={() => setPreviewOpen(false)}
            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-gray-800/80 text-white text-xl hover:bg-gray-700"
            aria-label="Close preview"
          >
            ✕
          </button>
          <img
            src={src}
            alt={attachment.fileName}
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {infoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setInfoOpen(false)}>
          <div
            className="bg-gray-800 rounded-xl shadow-xl p-5 w-80 text-sm text-gray-200"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold text-white mb-3">Attachment Info</h3>
            <div className="space-y-1.5">
              <div><span className="text-gray-400">File name:</span> {attachment.fileName}</div>
              <div><span className="text-gray-400">Type:</span> {attachment.mimeType}</div>
              <div><span className="text-gray-400">Size:</span> {formatBytes(attachment.size)}</div>
              <div><span className="text-gray-400">Uploaded:</span> {new Date(attachment.createdAt).toLocaleString('en-US')}</div>
            </div>
            <button
              onClick={() => setInfoOpen(false)}
              className="mt-4 w-full py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  )
}
