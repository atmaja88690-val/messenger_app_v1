import { useRef, useState } from 'react'
import { attachmentsApi } from '../../services/api.service'
import type { Attachment } from '../../types'

// Cache tingkat modul, sama seperti AttachmentImage: satu berkas suara yang
// sudah diunduh tidak perlu diunduh lagi saat komponen di-mount ulang.
const blobCache = new Map<string, string>()
const FLAT: number[] = Array(40).fill(0.3)

function fmt(ms: number): string {
  const total = Math.round(ms / 1000)
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}

interface Props {
  attachment: Attachment & { _localUrl?: string }
  mine?: boolean
}

export default function VoiceBubble({ attachment, mine = false }: Props): React.JSX.Element {
  // SENGAJA tidak memakai attachment._localUrl.
  //
  // Blob lokal hasil rekaman dicabut beberapa detik setelah kirim. Untuk gambar
  // itu aman karena komponennya sudah pindah ke URL asli jauh sebelum itu; untuk
  // audio tidak ada yang memaksa pindah sampai tombol putar ditekan -- dan itu
  // bisa dua menit kemudian, saat blob-nya sudah lama tiada
  // (net::ERR_FILE_NOT_FOUND). Jadi berkasnya SELALU diambil dari server.
  // Waveform dan durasi tetap tampil seketika karena keduanya dari basis data.
  const [src, setSrc] = useState<string | null>(blobCache.get(attachment.id) ?? null)
  const [loading, setLoading] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [posMs, setPosMs] = useState(0)
  const [err, setErr] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const triedServerRef = useRef(false)

  const peaks =
    attachment.waveformPeaks && attachment.waveformPeaks.length > 0
      ? attachment.waveformPeaks
      : FLAT

  // Durasi datang dari BASIS DATA (hasil ffprobe di server), bukan dari elemen
  // <audio>. Artinya angkanya sudah benar sebelum satu byte audio pun diunduh.
  const durationMs = attachment.durationMs ?? 0

  // Endpoint /attachments/file/:id butuh header Authorization, dan tag
  // <audio src> tidak pernah mengirimkannya. Jadi berkasnya diambil lewat
  // axios sebagai blob, persis seperti gambar.
  const fetchFromServer = async (): Promise<string> => {
    triedServerRef.current = true
    const url = await attachmentsApi.getFile(attachment.id)
    blobCache.set(attachment.id, url)
    setSrc(url)
    return url
  }

  const toggle = async (): Promise<void> => {
    const el = audioRef.current
    if (!el) return
    if (playing) {
      el.pause()
      return
    }
    setErr(false)
    try {
      let url = src
      if (!url) {
        setLoading(true)
        url = await fetchFromServer()
        setLoading(false)
      }
      if (el.src !== url) el.src = url
      await el.play()
    } catch {
      // URL yang ada bisa saja sudah tidak berlaku (blob dicabut, cache basi).
      // Coba sekali lagi dari server sebelum menyerah -- kegagalan yang bisa
      // dipulihkan sendiri tidak perlu jadi kegagalan yang dilihat pengguna.
      if (!triedServerRef.current) {
        try {
          setLoading(true)
          const url = await fetchFromServer()
          el.src = url
          await el.play()
          setLoading(false)
          return
        } catch {
          // jatuh ke penanganan galat di bawah
        }
      }
      setLoading(false)
      setErr(true)
    }
  }

  const seek = (e: React.MouseEvent<HTMLDivElement>): void => {
    const el = audioRef.current
    if (!el || !Number.isFinite(el.duration) || el.duration === 0) return
    const rect = e.currentTarget.getBoundingClientRect()
    const frac = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
    el.currentTime = frac * el.duration
    setProgress(frac)
  }

  const played = mine ? 'bg-[#3a7d3a]' : 'bg-[#4aa3df]'
  const rest = mine ? 'bg-black/15' : 'bg-gray-300'

  return (
    <div className="flex items-center gap-2.5 w-[240px] max-w-full py-0.5">
      <audio
        ref={audioRef}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false)
          setProgress(0)
          setPosMs(0)
        }}
        onTimeUpdate={(e) => {
          const el = e.currentTarget
          setPosMs(el.currentTime * 1000)
          if (Number.isFinite(el.duration) && el.duration > 0) {
            setProgress(el.currentTime / el.duration)
          }
        }}
        className="hidden"
      />
      <button
        onClick={toggle}
        disabled={loading}
        aria-label={playing ? 'Pause' : 'Play'}
        className={`w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-full transition-all duration-150 active:scale-90 ${
          mine ? 'bg-white/70 text-gray-800 hover:bg-white' : 'bg-[#4aa3df] text-white hover:bg-[#3a92ce]'
        }`}
      >
        {loading ? (
          <span className="w-3.5 h-3.5 rounded-full border-2 border-gray-300 border-t-gray-600 animate-spin" />
        ) : err ? (
          <span className="text-sm font-bold">!</span>
        ) : playing ? (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1.5" /><rect x="14" y="4" width="4" height="16" rx="1.5" /></svg>
        ) : (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4l14 8-14 8z" /></svg>
        )}
      </button>

      <div className="flex-1 min-w-0">
        <div
          className="flex items-center gap-[2px] h-7 cursor-pointer"
          onClick={seek}
          role="slider"
          aria-label="Seek"
          aria-valuenow={Math.round(progress * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
          tabIndex={0}
        >
          {peaks.map((p, i) => (
            <div
              key={i}
              className={`flex-1 min-w-[2px] rounded-full transition-colors duration-100 ${
                i / peaks.length < progress ? played : rest
              }`}
              style={{ height: `${Math.max(14, p * 100)}%` }}
            />
          ))}
        </div>
        {/* Saat diputar tampilkan posisi, saat diam tampilkan total -- sama
            seperti WhatsApp: satu angka saja, tidak dua yang bersaing. */}
        <div className={`text-[11px] tabular-nums mt-0.5 ${mine ? 'text-gray-600' : 'text-gray-500'}`}>
          {err ? 'Tap to retry' : playing || posMs > 0 ? fmt(posMs) : fmt(durationMs)}
        </div>
      </div>
    </div>
  )
}
