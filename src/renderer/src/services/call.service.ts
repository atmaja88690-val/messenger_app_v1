import api from './api.service'
import { wsService } from './ws.service'
import { Room, RoomEvent, Track, createLocalTracks } from 'livekit-client'
import type { LocalTrack, RemoteTrack, RemoteParticipant } from 'livekit-client'
import type { CallType, WsCallIncomingPayload, WsCallAcceptedPayload } from '../types'

// LiveKit SFU 1:1. Media mengalir klien <-> server (bsichat-rtc), BUKAN P2P.
// CGNAT seluler tidak jadi masalah: klien hanya perlu koneksi keluar.
// TERPISAH TOTAL dari LiveKit plugNmeet: instance, port, dan key sendiri.

export interface CallCallbacks {
  onRemoteStream: (stream: MediaStream) => void
  onLocalStream: (stream: MediaStream) => void
  onConnectionState: (state: RTCPeerConnectionState) => void
  onError: (message: string) => void
  onPeerJoined?: () => void
  onPeerLeft?: () => void
  onReconnecting?: () => void
}

interface TokenResponse {
  url: string
  token: string
  room: string
}

class CallService {
  private room: Room | null = null
  private localTracks: LocalTrack[] = []
  private callId: string | null = null
  private cb: CallCallbacks | null = null
  // SATU MediaStream untuk semua track remote. Membuat stream baru per track
  // membuat audio dan video saling menimpa -- bug yang membuat layar hitam
  // atau panggilan bisu secara acak, tergantung urutan kedatangan track.
  private remoteStream: MediaStream | null = null

  setCallbacks(cb: CallCallbacks): void {
    this.cb = cb
  }

  private mapMediaError(err: unknown): Error {
    const name = (err as { name?: string })?.name
    if (name === 'NotAllowedError') {
      return new Error('Izin kamera/mikrofon ditolak. Buka Settings > Privacy > Camera & Microphone, izinkan BSI Messenger.')
    }
    if (name === 'NotFoundError') {
      return new Error('Kamera atau mikrofon tidak ditemukan di perangkat ini.')
    }
    if (name === 'NotReadableError') {
      return new Error('Kamera/mikrofon sedang dipakai aplikasi lain.')
    }
    return new Error('Gagal mengakses kamera/mikrofon: ' + String(name ?? err))
  }

  private async fetchToken(callId: string): Promise<TokenResponse> {
    const { data } = await api.get('/call/' + callId + '/token')
    return data as TokenResponse
  }

  private attachRoomEvents(room: Room): void {
    room.on(RoomEvent.TrackSubscribed, (track: RemoteTrack) => {
      const mst = track.mediaStreamTrack
      if (mst === undefined) return
      if (this.remoteStream === null) this.remoteStream = new MediaStream()
      // Buang track lama dengan jenis sama (mis. video diganti saat republish).
      for (const old of this.remoteStream.getTracks()) {
        if (old.kind === mst.kind) this.remoteStream.removeTrack(old)
      }
      this.remoteStream.addTrack(mst)
      console.log('[call] remote track:', track.kind, '-> total', this.remoteStream.getTracks().length)
      this.cb?.onRemoteStream(this.remoteStream)
    })

    room.on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack) => {
      const mst = track.mediaStreamTrack
      if (mst !== undefined && this.remoteStream !== null) {
        this.remoteStream.removeTrack(mst)
      }
    })

    // Lawan bicara BERGABUNG -- ini penanda "Tersambung" yang benar.
    // Bukan koneksi kita sendiri ke server (itu terjadi jauh lebih awal).
    room.on(RoomEvent.ParticipantConnected, (p: RemoteParticipant) => {
      console.log('[call] peer joined:', p.identity)
      this.cb?.onPeerJoined?.()
    })

    room.on(RoomEvent.ParticipantDisconnected, (p: RemoteParticipant) => {
      console.log('[call] peer left:', p.identity)
      this.cb?.onPeerLeft?.()
    })

    room.on(RoomEvent.Connected, () => {
      console.log('[call] LiveKit connected, room =', room.name)
      this.cb?.onConnectionState('connected')
      // Peserta bisa SUDAH ada saat kita masuk (penerima join belakangan).
      if (room.remoteParticipants.size > 0) this.cb?.onPeerJoined?.()
    })

    room.on(RoomEvent.Reconnecting, () => {
      console.warn('[call] LiveKit reconnecting...')
      this.cb?.onReconnecting?.()
    })

    room.on(RoomEvent.Reconnected, () => {
      console.log('[call] LiveKit reconnected')
      this.cb?.onConnectionState('connected')
    })

    room.on(RoomEvent.Disconnected, (reason) => {
      console.log('[call] LiveKit disconnected', reason)
      this.cb?.onConnectionState('disconnected')
    })

    room.on(RoomEvent.MediaDevicesError, (e: Error) => {
      this.cb?.onError(this.mapMediaError(e).message)
    })
  }

  private async joinRoom(callId: string, callType: CallType): Promise<void> {
    this.callId = callId
    const { url, token } = await this.fetchToken(callId)

    let tracks: LocalTrack[]
    try {
      tracks = await createLocalTracks({ audio: true, video: callType === 'VIDEO' })
    } catch (err) {
      throw this.mapMediaError(err)
    }
    this.localTracks = tracks

    const localStream = new MediaStream()
    for (const t of tracks) {
      if (t.mediaStreamTrack !== undefined) localStream.addTrack(t.mediaStreamTrack)
    }
    this.cb?.onLocalStream(localStream)

    const room = new Room({ adaptiveStream: true, dynacast: true })
    this.attachRoomEvents(room)
    this.room = room

    await room.connect(url, token)
    for (const t of tracks) {
      await room.localParticipant.publishTrack(t)
    }
    console.log('[call] published', tracks.length, 'track(s)')
  }

  async startCall(conversationId: string, callType: CallType): Promise<void> {
    wsService.send('call_invite', { conversationId, callType })
  }

  async onCreated(callId: string, callType: CallType): Promise<void> {
    await this.joinRoom(callId, callType)
  }

  async acceptCall(payload: WsCallIncomingPayload): Promise<void> {
    await this.joinRoom(payload.callId, payload.callType)
    wsService.send('call_answer', { callId: payload.callId })
  }

  async onAccepted(_payload: WsCallAcceptedPayload): Promise<void> {
    // SFU: SDP tidak lewat signaling. Dipertahankan agar kontrak store tetap.
  }

  async onIce(_payload: unknown): Promise<void> {
    // SFU: ICE ditangani LiveKit.
  }

  getCallId(): string | null {
    return this.callId
  }

  setCallId(id: string): void {
    this.callId = id
  }

  // mute/unmute track yang SUDAH dipublish -- setCameraEnabled bisa membuat
  // track baru dan meninggalkan yang lama menyala.
  toggleMic(enabled: boolean): void {
    for (const t of this.localTracks) {
      if (t.kind === Track.Kind.Audio) {
        if (enabled) void t.unmute()
        else void t.mute()
      }
    }
  }

  toggleCam(enabled: boolean): void {
    for (const t of this.localTracks) {
      if (t.kind === Track.Kind.Video) {
        if (enabled) void t.unmute()
        else void t.mute()
      }
    }
  }

  // WAJIB -- track yang tidak di-stop menahan lampu kamera menyala.
  cleanup(): void {
    for (const t of this.localTracks) t.stop()
    this.localTracks = []
    this.remoteStream = null
    void this.room?.disconnect()
    this.room = null
    this.callId = null
  }
}

export const callService = new CallService()
