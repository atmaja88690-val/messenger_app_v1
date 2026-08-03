import React, { useEffect, useRef } from 'react'
import { useCallStore } from '../../stores/call.store'

export default function CallOverlay(): React.JSX.Element | null {
  const phase = useCallStore((s) => s.phase)
  const peer = useCallStore((s) => s.peer)
  const callType = useCallStore((s) => s.callType)
  const localStream = useCallStore((s) => s.localStream)
  const remoteStream = useCallStore((s) => s.remoteStream)
  const micOn = useCallStore((s) => s.micOn)
  const camOn = useCallStore((s) => s.camOn)
  const error = useCallStore((s) => s.error)
  const accept = useCallStore((s) => s.accept)
  const reject = useCallStore((s) => s.reject)
  const hangup = useCallStore((s) => s.hangup)
  const toggleMic = useCallStore((s) => s.toggleMic)
  const toggleCam = useCallStore((s) => s.toggleCam)

  const localRef = useRef<HTMLVideoElement>(null)
  const remoteRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (localRef.current !== null && localStream !== null) {
      localRef.current.srcObject = localStream
    }
  }, [localStream])

  useEffect(() => {
    if (remoteRef.current !== null && remoteStream !== null) {
      remoteRef.current.srcObject = remoteStream
    }
  }, [remoteStream])

  if (phase === 'idle') return null

  const isVideo = callType === 'VIDEO'
  const name = peer?.displayName ?? 'Pengguna'

  const label =
    phase === 'calling' ? 'Memanggil...'
      : phase === 'ringing' ? (isVideo ? 'Panggilan video masuk' : 'Panggilan suara masuk')
      : phase === 'active' ? 'Tersambung'
      : 'Panggilan berakhir'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-[420px] max-w-[92vw] rounded-2xl bg-slate-800 p-6 text-white shadow-2xl">
        <div className="mb-4 text-center">
          <h3 className="text-xl font-semibold">{name}</h3>
          <p className="text-sm text-slate-300">{label}</p>
        </div>

        {isVideo && (phase === 'active' || phase === 'calling') && (
          <div className="relative mb-4 overflow-hidden rounded-xl bg-black" style={{ aspectRatio: '4 / 3' }}>
            <video ref={remoteRef} autoPlay playsInline className="h-full w-full object-cover" />
            <video
              ref={localRef}
              autoPlay
              playsInline
              muted
              className="absolute bottom-2 right-2 h-24 w-32 rounded-lg border border-slate-600 object-cover"
            />
          </div>
        )}

        {isVideo === false && <video ref={remoteRef} autoPlay playsInline className="hidden" />}
        {isVideo === false && <video ref={localRef} autoPlay playsInline muted className="hidden" />}

        {error !== null && (
          <p className="mb-3 rounded-lg bg-red-900/60 p-2 text-center text-sm text-red-200">{error}</p>
        )}

        <div className="flex items-center justify-center gap-3">
          {phase === 'ringing' && (
            <>
              <button
                type="button"
                onClick={() => { void accept() }}
                className="rounded-full bg-green-600 px-6 py-3 font-medium hover:bg-green-500"
              >
                Terima
              </button>
              <button
                type="button"
                onClick={reject}
                className="rounded-full bg-red-600 px-6 py-3 font-medium hover:bg-red-500"
              >
                Tolak
              </button>
            </>
          )}

          {(phase === 'calling' || phase === 'active') && (
            <>
              <button
                type="button"
                onClick={toggleMic}
                aria-label={micOn ? 'Matikan mikrofon' : 'Nyalakan mikrofon'}
                className={'rounded-full px-4 py-3 ' + (micOn ? 'bg-slate-600 hover:bg-slate-500' : 'bg-red-600 hover:bg-red-500')}
              >
                {micOn ? 'Mic' : 'Mic off'}
              </button>
              {isVideo && (
                <button
                  type="button"
                  onClick={toggleCam}
                  aria-label={camOn ? 'Matikan kamera' : 'Nyalakan kamera'}
                  className={'rounded-full px-4 py-3 ' + (camOn ? 'bg-slate-600 hover:bg-slate-500' : 'bg-red-600 hover:bg-red-500')}
                >
                  {camOn ? 'Cam' : 'Cam off'}
                </button>
              )}
              <button
                type="button"
                onClick={hangup}
                className="rounded-full bg-red-600 px-6 py-3 font-medium hover:bg-red-500"
              >
                Tutup
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
