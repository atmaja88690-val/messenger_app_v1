import { useMemo, useRef, useState } from 'react'
import { attachmentsApi } from '../../services/api.service'
import type { Attachment } from '../../types'

const blobCache = new Map<string, string>()
const BARS = 40

function fmt(ms: number): string {
  const t = Math.round(ms / 1000)
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`
}

// Diambil PUNCAK tertinggi tiap kelompok, bukan sampel pertama -- memotong
// begitu saja akan menghilangkan hentakan suara dan membuat semua rekaman
// terlihat rata. 40 batang cukup untuk lebar bubble di HP tersempit.
function resample(src: number[], n: number): number[] {
  if (!src || src.length === 0) return Array(n).fill(0.25)
  const out: number[] = []
  for (let i = 0; i < n; i++) {
    const a = Math.floor((i * src.length) / n)
    const b = Math.max(a + 1, Math.floor(((i + 1) * src.length) / n))
    let m = 0
    for (let j = a; j < b && j < src.length; j++) if (src[j] > m) m = src[j]
    out.push(m)
  }
  return out
}

interface Props {
  attachment: Attachment & { _localUrl?: string }
  mine?: boolean
}

export default function VoiceBubble({ attachment, mine = false }: Props): React.JSX.Element {
  const [src, setSrc] = useState<string | null>(blobCache.get(attachment.id) ?? null)
  const [loading, setLoading] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [posMs, setPosMs] = useState(0)
  const [err, setErr] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const triedRef = useRef(false)

  const bars = useMemo(() => resample(attachment.waveformPeaks ?? [], BARS), [attachment.waveformPeaks])
  const durationMs = attachment.durationMs ?? 0

  const fromServer = async (): Promise<string> => {
    triedRef.current = true
    const url = await attachmentsApi.getFile(attachment.id)
    blobCache.set(attachment.id, url)
    setSrc(url)
    return url
  }

  const toggle = async (): Promise<void> => {
    const el = audioRef.current
    if (!el) return
    if (playing) { el.pause(); return }
    setErr(false)
    try {
      let url = src
      if (!url) { setLoading(true); url = await fromServer(); setLoading(false) }
      if (el.src !== url) el.src = url
      await el.play()
    } catch {
      if (!triedRef.current) {
        try {
          setLoading(true)
          const url = await fromServer()
          el.src = url
          await el.play()
          setLoading(false)
          return
        } catch { /* jatuh ke galat di bawah */ }
      }
      setLoading(false)
      setErr(true)
    }
  }

  const seek = (e: React.MouseEvent<HTMLDivElement>): void => {
    const el = audioRef.current
    if (!el || !Number.isFinite(el.duration) || el.duration === 0) return
    const r = e.currentTarget.getBoundingClientRect()
    const f = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width))
    el.currentTime = f * el.duration
    setProgress(f)
  }

  const played = mine ? 'bg-[#3d7a3d]' : 'bg-[#4aa3df]'
  const rest = mine ? 'bg-black/20' : 'bg-gray-300'

  return (
    // max-w-full WAJIB: bubble induk dibatasi 70% lebar layar, dan tanpa ini
    // isinya meluber keluar kotak di HP.
    <div className="flex items-center gap-2 w-full">
      <audio
        ref={audioRef}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => { setPlaying(false); setProgress(0); setPosMs(0) }}
        onTimeUpdate={(e) => {
          const el = e.currentTarget
          setPosMs(el.currentTime * 1000)
          if (Number.isFinite(el.duration) && el.duration > 0) setProgress(el.currentTime / el.duration)
        }}
        className="hidden"
      />
      <button
        onClick={toggle}
        disabled={loading}
        aria-label={playing ? 'Pause' : 'Play'}
        className={`w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full transition-transform active:scale-90 ${
          mine ? 'bg-white/70 text-gray-800' : 'bg-[#4aa3df] text-white'
        }`}
      >
        {loading ? (
          <span className="w-3 h-3 rounded-full border-2 border-gray-300 border-t-gray-600 animate-spin" />
        ) : err ? (
          <span className="text-xs font-bold">!</span>
        ) : playing ? (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1.5" /><rect x="14" y="4" width="4" height="16" rx="1.5" /></svg>
        ) : (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4l14 8-14 8z" /></svg>
        )}
      </button>

      {/* Tanpa min-width pada batang: 40 x min-w 2px + celah sudah melebihi
          lebar bubble di HP, dan min-width tidak bisa dikompresi flexbox. */}
      <div className="flex-1 min-w-0 flex items-center gap-[2px] h-7 cursor-pointer" onClick={seek}>
        {bars.map((p, i) => (
          <div
            key={i}
            className={`flex-1 min-w-0 rounded-sm ${i / BARS < progress ? played : rest}`}
            style={{ height: `${Math.max(15, p * 100)}%` }}
          />
        ))}
      </div>

      <span className={`text-[11px] tabular-nums flex-shrink-0 w-8 text-right ${mine ? 'text-gray-600' : 'text-gray-500'}`}>
        {err ? '!' : playing || posMs > 0 ? fmt(posMs) : fmt(durationMs)}
      </span>
    </div>
  )
}
