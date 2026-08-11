import React, { useEffect, useRef } from 'react'
import { useCallStore } from '../../stores/call.store'
import { IconMic, IconMicOff, IconVideo, IconVideoOff, IconPhoneOff } from './CallIcons'

export default function CallOverlay(): React.JSX.Element | null {
  const phase = useCallStore((s) => s.phase)
  const peer = useCallStore((s) => s.peer)
  const callType = useCallStore((s) => s.callType)
  const localStream = useCallStore((s) => s.localStream)
  const remoteStream = useCallStore((s) => s.remoteStream)
  const micOn = useCallStore((s) => s.micOn)
  const camOn = useCallStore((s) => s.camOn)
  const error = useCallStore((s) => s.error)
  const reconnecting = useCallStore((s) => s.reconnecting)
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
  }, [localStream, phase])

  useEffect(() => {
    if (remoteRef.current !== null && remoteStream !== null) {
      remoteRef.current.srcObject = remoteStream
    }
  }, [remoteStream, phase])

  if (phase === 'idle') return null

  const isVideo = callType === 'VIDEO'
  const name = peer?.displayName ?? 'User'
  const isActiveOrCalling = phase === 'calling' || phase === 'active'

  const label =
    phase === 'calling' ? 'Calling...'
      : phase === 'ringing' ? (isVideo ? 'Incoming video call' : 'Incoming voice call')
      : phase === 'active' ? (reconnecting ? 'Reconnecting...' : 'Connected')
      : 'Call ended'

  // Video yang sudah/sedang berjalan -> layar penuh. Ringing (video/voice) dan voice call -> kartu.
  const useFullscreenVideo = isVideo && isActiveOrCalling

  if (useFullscreenVideo) {
    return (
      <div className="fixed inset-0 z-50 bg-black">
        <video ref={remoteRef} autoPlay playsInline className="h-full w-full object-cover" />
        <video
          ref={localRef}
          autoPlay
          playsInline
          muted
          className="absolute right-4 top-4 h-32 w-24 rounded-lg border border-white/20 object-cover shadow-lg sm:h-40 sm:w-28"
        />

        <div className="absolute left-0 right-0 top-0 flex flex-col items-center gap-1 bg-gradient-to-b from-black/70 to-transparent px-4 pb-8 pt-4 text-white">
          <h3 className="text-lg font-semibold">{name}</h3>
          <p className="text-sm text-slate-200">{label}</p>
          {reconnecting && (
            <span className="mt-1 flex items-center gap-1.5 rounded-full bg-amber-600/90 px-3 py-1 text-xs font-medium">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
              Reconnecting...
            </span>
          )}
        </div>

        {error !== null && (
          <p className="absolute left-1/2 top-24 -translate-x-1/2 rounded-lg bg-red-900/80 px-3 py-2 text-center text-sm text-red-100">
            {error}
          </p>
        )}

        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-4 bg-gradient-to-t from-black/70 to-transparent px-4 pb-8 pt-10">
          <button
            type="button"
            onClick={toggleMic}
            aria-label={micOn ? 'Mute microphone' : 'Unmute microphone'}
            className={'flex h-14 w-14 items-center justify-center rounded-full text-white ' + (micOn ? 'bg-white/20 hover:bg-white/30' : 'bg-red-600 hover:bg-red-500')}
          >
            {micOn ? <IconMic /> : <IconMicOff />}
          </button>
          <button
            type="button"
            onClick={toggleCam}
            aria-label={camOn ? 'Turn off camera' : 'Turn on camera'}
            className={'flex h-14 w-14 items-center justify-center rounded-full text-white ' + (camOn ? 'bg-white/20 hover:bg-white/30' : 'bg-red-600 hover:bg-red-500')}
          >
            {camOn ? <IconVideo /> : <IconVideoOff />}
          </button>
          <button
            type="button"
            onClick={hangup}
            aria-label="End call"
            className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600 text-white hover:bg-red-500"
          >
            <IconPhoneOff />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-[420px] max-w-[92vw] rounded-2xl bg-slate-800 p-6 text-white shadow-2xl">
        <div className="mb-4 text-center">
          <h3 className="text-xl font-semibold">{name}</h3>
          <p className="text-sm text-slate-300">{label}</p>
          {reconnecting && phase === 'active' && (
            <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-amber-600/90 px-3 py-1 text-xs font-medium">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
              Reconnecting...
            </span>
          )}
        </div>

        <video ref={remoteRef} autoPlay playsInline className="hidden" />
        <video ref={localRef} autoPlay playsInline muted className="hidden" />

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
                Accept
              </button>
              <button
                type="button"
                onClick={reject}
                className="rounded-full bg-red-600 px-6 py-3 font-medium hover:bg-red-500"
              >
                Decline
              </button>
            </>
          )}

          {isActiveOrCalling && (
            <>
              <button
                type="button"
                onClick={toggleMic}
                aria-label={micOn ? 'Mute microphone' : 'Unmute microphone'}
                className={'rounded-full px-4 py-3 ' + (micOn ? 'bg-slate-600 hover:bg-slate-500' : 'bg-red-600 hover:bg-red-500')}
              >
                {micOn ? <IconMic /> : <IconMicOff />}
              </button>
              <button
                type="button"
                onClick={hangup}
                className="rounded-full bg-red-600 px-6 py-3 font-medium hover:bg-red-500"
              >
                <IconPhoneOff />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
