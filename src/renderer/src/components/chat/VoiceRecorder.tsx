import { useEffect, useRef, useState } from 'react'
import { useChatStore } from '../../stores/chat.store'

const MAX_MS = 5 * 60 * 1000
const PEAK_COUNT = 64
const MIN_MS = 700
const METER_BARS = 28
const METER_FLOOR = 0.08
const METER_FPS_MS = 50

function fmt(ms: number): string {
  const total = Math.floor(ms / 1000)
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}

function audioCtor(): typeof AudioContext | undefined {
  return (
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  )
}

/**
 * Puncak gelombang dihitung DI SINI, bukan di server.
 * Server sudah membayar ongkos transcode; membaca ulang berkas yang sama
 * hanya untuk menggambar 64 batang adalah pekerjaan kedua tanpa alasan.
 * Gagal menghitung BUKAN kegagalan kirim -- kembalikan array kosong dan
 * biarkan bubble menggambar batang rata.
 */
async function computePeaks(blob: Blob): Promise<number[]> {
  try {
    const Ctor = audioCtor()
    if (!Ctor) return []
    const ctx = new Ctor()
    const buf = await ctx.decodeAudioData(await blob.arrayBuffer())
    const data = buf.getChannelData(0)
    ctx.close().catch(() => {})
    const step = Math.floor(data.length / PEAK_COUNT) || 1
    const raw: number[] = []
    for (let i = 0; i < PEAK_COUNT; i++) {
      let max = 0
      for (let j = i * step; j < (i + 1) * step && j < data.length; j++) {
        const v = Math.abs(data[j])
        if (v > max) max = v
      }
      raw.push(max)
    }
    const loudest = Math.max(...raw)
    if (loudest < 0.01) return raw.map(() => 0)
    // Dinormalisasi: rekaman pelan tetap terlihat berbentuk, bukan garis datar.
    return raw.map((v) => Math.min(1, Number((v / loudest).toFixed(3))))
  } catch {
    return []
  }
}

interface PreviewState {
  blob: Blob
  url: string
  durationMs: number
  peaks: number[]
}

interface Props {
  onActiveChange: (active: boolean) => void
  showSend: boolean
  onSend: () => void
}

type Phase = 'idle' | 'recording' | 'preview'

const MicIcon = (): React.JSX.Element => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="2" width="6" height="12" rx="3" />
    <path d="M5 11a7 7 0 0 0 14 0" />
    <line x1="12" y1="18" x2="12" y2="22" />
  </svg>
)

const SendIcon = (): React.JSX.Element => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M3.4 20.4l17.45-7.48a1 1 0 0 0 0-1.84L3.4 3.6a.99.99 0 0 0-1.39.91L2 9.12c0 .5.37.93.87.99L17 12 2.87 13.88c-.5.07-.87.5-.87 1l.01 4.61c0 .71.73 1.2 1.39.91z" />
  </svg>
)

const TrashIcon = (): React.JSX.Element => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
  </svg>
)

export default function VoiceRecorder({ onActiveChange, showSend, onSend }: Props): React.JSX.Element {
  const sendVoice = useChatStore((s) => s.sendVoice)
  const [phase, setPhase] = useState<Phase>('idle')
  const [elapsed, setElapsed] = useState(0)
  const [sending, setSending] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [meter, setMeter] = useState<number[]>(Array(METER_BARS).fill(METER_FLOOR))
  const [preview, setPreview] = useState<PreviewState | null>(null)

  const recRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const startedAtRef = useRef(0)
  const timerRef = useRef<number | null>(null)
  const cancelledRef = useRef(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const ctxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    onActiveChange(phase !== 'idle')
  }, [phase, onActiveChange])

  const stopTracks = (): void => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    analyserRef.current = null
    ctxRef.current?.close().catch(() => {})
    ctxRef.current = null
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  useEffect(() => {
    return () => {
      stopTracks()
      if (preview) URL.revokeObjectURL(preview.url)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const finish = async (): Promise<void> => {
    const ms = Date.now() - startedAtRef.current
    stopTracks()
    const chunks = chunksRef.current
    chunksRef.current = []
    if (cancelledRef.current) {
      setPhase('idle')
      return
    }
    const type = recRef.current?.mimeType || 'audio/webm'
    const blob = new Blob(chunks, { type })
    // Di bawah 0,7 detik hampir selalu tap tidak sengaja, bukan pesan.
    if (blob.size === 0 || ms < MIN_MS) {
      setPhase('idle')
      return
    }
    const peaks = await computePeaks(blob)
    setPreview({ blob, url: URL.createObjectURL(blob), durationMs: ms, peaks })
    setPhase('preview')
  }

  const start = async (): Promise<void> => {
    if (phase !== 'idle') return
    try {
      // getUserMedia HARUS jadi panggilan pertama di dalam handler tap.
      // WKWebView (iOS) hanya mengizinkan mikrofon selama gestur pengguna masih
      // hidup; await apa pun sebelum baris ini membatalkannya tanpa pesan galat.
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      // Meter memakai amplitudo NYATA dari mikrofon. Batang yang beranimasi
      // sendiri akan tetap bergoyang walau mikrofon mati atau dibisukan --
      // dan pengguna baru sadar rekamannya kosong setelah menekan kirim.
      const Ctor = audioCtor()
      if (Ctor) {
        const actx = new Ctor()
        const analyser = actx.createAnalyser()
        analyser.fftSize = 512
        actx.createMediaStreamSource(stream).connect(analyser)
        ctxRef.current = actx
        analyserRef.current = analyser
        const buf = new Uint8Array(analyser.frequencyBinCount)
        let last = 0
        const tick = (now: number): void => {
          const a = analyserRef.current
          if (!a) return
          if (now - last >= METER_FPS_MS) {
            last = now
            a.getByteTimeDomainData(buf)
            let peak = 0
            for (let i = 0; i < buf.length; i++) {
              const v = Math.abs(buf[i] - 128) / 128
              if (v > peak) peak = v
            }
            const h = Math.min(1, Math.max(METER_FLOOR, peak * 2.4))
            setMeter((prev) => [...prev.slice(1), h])
          }
          rafRef.current = requestAnimationFrame(tick)
        }
        rafRef.current = requestAnimationFrame(tick)
      }

      const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : ''
      const rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream)
      chunksRef.current = []
      cancelledRef.current = false
      rec.ondataavailable = (e): void => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      rec.onstop = (): void => {
        void finish()
      }
      recRef.current = rec
      startedAtRef.current = Date.now()
      setElapsed(0)
      setMeter(Array(METER_BARS).fill(METER_FLOOR))
      rec.start()
      setPhase('recording')
      timerRef.current = window.setInterval(() => {
        const ms = Date.now() - startedAtRef.current
        setElapsed(ms)
        if (ms >= MAX_MS) stopRecording()
      }, 200)
    } catch (e) {
      const err = e as { name?: string }
      alert(
        err?.name === 'NotAllowedError'
          ? 'Microphone permission denied. Enable microphone access for NNI Messenger.'
          : 'Microphone is not available.'
      )
      stopTracks()
      setPhase('idle')
    }
  }

  const stopRecording = (): void => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
    const rec = recRef.current
    if (rec && rec.state !== 'inactive') rec.stop()
    else {
      stopTracks()
      setPhase('idle')
    }
  }

  const cancelRecording = (): void => {
    cancelledRef.current = true
    stopRecording()
  }

  const discard = (): void => {
    audioRef.current?.pause()
    setPlaying(false)
    if (preview) URL.revokeObjectURL(preview.url)
    setPreview(null)
    setPhase('idle')
  }

  const togglePreview = (): void => {
    const el = audioRef.current
    if (!el) return
    if (playing) el.pause()
    else void el.play()
  }

  const send = async (): Promise<void> => {
    if (!preview || sending) return
    setSending(true)
    try {
      await sendVoice(preview.blob, preview.durationMs, preview.peaks)
      discard()
    } finally {
      setSending(false)
    }
  }

  // ---------- IDLE: satu slot, dua peran ----------
  // Ikon ditumpuk di dalam SATU tombol, bukan dua tombol yang saling
  // disembunyikan -- supaya lebar composer tidak melompat saat pengguna
  // mengetik huruf pertama, dan pergantiannya bisa dianimasikan.
  if (phase === 'idle') {
    return (
      <button
        onClick={showSend ? onSend : start}
        title={showSend ? 'Send' : 'Record voice message'}
        aria-label={showSend ? 'Send' : 'Record voice message'}
        className="w-11 h-11 flex-shrink-0 flex items-center justify-center rounded-full bg-[#4aa3df] hover:bg-[#3a92ce] active:scale-90 text-white shadow-sm transition-all duration-150"
      >
        <span className="relative block w-5 h-5">
          <span
            className={`absolute inset-0 flex items-center justify-center transition-all duration-200 ${
              showSend ? 'opacity-0 scale-50 rotate-45' : 'opacity-100 scale-100 rotate-0'
            }`}
          >
            <MicIcon />
          </span>
          <span
            className={`absolute inset-0 flex items-center justify-center transition-all duration-200 ${
              showSend ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-50 -rotate-45'
            }`}
          >
            <SendIcon />
          </span>
        </span>
      </button>
    )
  }

  // ---------- RECORDING ----------
  if (phase === 'recording') {
    const nearLimit = elapsed > MAX_MS - 30_000
    return (
      <div className="flex-1 min-w-0 flex items-center gap-3 pl-4 pr-1.5 py-1.5 bg-white rounded-full border border-red-200 shadow-sm">
        <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
          <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
        </span>
        <span className={`text-sm font-medium tabular-nums flex-shrink-0 ${nearLimit ? 'text-red-600' : 'text-gray-800'}`}>
          {fmt(elapsed)}
        </span>
        <div className="flex-1 min-w-0 flex items-center justify-end gap-[2px] h-7 overflow-hidden">
          {meter.map((h, i) => (
            <div
              key={i}
              className="w-[3px] flex-shrink-0 rounded-full bg-red-400/70 transition-[height] duration-75"
              style={{ height: `${h * 100}%` }}
            />
          ))}
        </div>
        <button
          onClick={cancelRecording}
          title="Cancel"
          aria-label="Cancel recording"
          className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
        >
          <TrashIcon />
        </button>
        <button
          onClick={stopRecording}
          title="Stop recording"
          aria-label="Stop recording"
          className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-full bg-[#4aa3df] hover:bg-[#3a92ce] active:scale-90 text-white transition-all duration-150"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <rect x="5" y="5" width="14" height="14" rx="3" />
          </svg>
        </button>
      </div>
    )
  }

  // ---------- PREVIEW ----------
  return (
    <div className="flex-1 min-w-0 flex items-center gap-2 px-1.5 py-1.5 bg-white rounded-full border border-gray-200 shadow-sm">
      <audio
        ref={audioRef}
        src={preview?.url}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        className="hidden"
      />
      <button
        onClick={togglePreview}
        aria-label={playing ? 'Pause' : 'Play'}
        className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
      >
        {playing ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1.5" /><rect x="14" y="4" width="4" height="16" rx="1.5" /></svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4l14 8-14 8z" /></svg>
        )}
      </button>
      <div className="flex-1 min-w-0 flex items-center gap-[2px] h-7 overflow-hidden">
        {(preview?.peaks.length ? preview.peaks : Array(40).fill(0.3)).map((p: number, i: number) => (
          <div key={i} className="flex-1 min-w-[2px] rounded-full bg-gray-300" style={{ height: `${Math.max(12, p * 100)}%` }} />
        ))}
      </div>
      <span className="text-xs text-gray-500 tabular-nums flex-shrink-0">{fmt(preview?.durationMs ?? 0)}</span>
      <button
        onClick={discard}
        title="Delete recording"
        aria-label="Delete recording"
        className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
      >
        <TrashIcon />
      </button>
      <button
        onClick={send}
        disabled={sending}
        title="Send"
        aria-label="Send voice message"
        className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-full bg-[#4aa3df] hover:bg-[#3a92ce] disabled:bg-gray-300 active:scale-90 text-white transition-all duration-150"
      >
        {sending ? (
          <span className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
        ) : (
          <SendIcon />
        )}
      </button>
    </div>
  )
}
