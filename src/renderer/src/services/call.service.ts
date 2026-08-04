import { wsService } from './ws.service'
import api from './api.service'
import type {
  CallType,
  WsCallIncomingPayload,
  WsCallAcceptedPayload,
  WsCallIcePayload,
} from '../types'

// WebRTC P2P 1:1. Media mengalir langsung antar perangkat -- server hanya relay SDP/ICE.
// ICE servers diambil dari backend (STUN + TURN coturn BSIM, kredensial ephemeral).
// Fallback STUN publik hanya kalau endpoint gagal -- call di jaringan sama tetap jalan.
const FALLBACK_ICE: RTCIceServer[] = [{ urls: 'stun:stun.l.google.com:19302' }]

// Cache per sesi: kredensial TURN berlaku 12 jam, satu fetch cukup.
let cachedIce: RTCIceServer[] | null = null

async function getIceServers(): Promise<RTCIceServer[]> {
  if (cachedIce !== null) return cachedIce
  try {
    const { data } = await api.get('/turn/credentials')
    const servers = data?.iceServers as RTCIceServer[] | undefined
    if (servers !== undefined && servers.length > 0) {
      cachedIce = servers
      console.log('[call] ICE dari server, turnEnabled =', data?.turnEnabled)
      return servers
    }
  } catch (err) {
    console.warn('[call] Gagal ambil ICE dari server, pakai fallback', err)
  }
  return FALLBACK_ICE
}

export interface CallCallbacks {
  onRemoteStream: (stream: MediaStream) => void
  onLocalStream: (stream: MediaStream) => void
  onConnectionState: (state: RTCPeerConnectionState) => void
  onError: (message: string) => void
}

class CallService {
  private pc: RTCPeerConnection | null = null
  private localStream: MediaStream | null = null
  private callId: string | null = null
  private cb: CallCallbacks | null = null
  // ICE bisa tiba sebelum remote description terpasang -- antre dulu, pasang belakangan.
  private pendingIce: RTCIceCandidateInit[] = []

  setCallbacks(cb: CallCallbacks) {
    this.cb = cb
  }

  private async getMedia(callType: CallType): Promise<MediaStream> {
    try {
      return await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callType === 'VIDEO',
      })
    } catch (err) {
      const name = (err as { name?: string })?.name
      if (name === 'NotAllowedError') {
        throw new Error('Izin kamera/mikrofon ditolak. Buka Windows Settings > Privacy > Camera & Microphone, izinkan BSI Messenger.')
      }
      if (name === 'NotFoundError') {
        throw new Error('Kamera atau mikrofon tidak ditemukan di perangkat ini.')
      }
      if (name === 'NotReadableError') {
        throw new Error('Kamera/mikrofon sedang dipakai aplikasi lain.')
      }
      throw new Error('Gagal mengakses kamera/mikrofon: ' + String(name ?? err))
    }
  }

  private buildPc(callId: string, iceServers: RTCIceServer[]): RTCPeerConnection {
    const pc = new RTCPeerConnection({ iceServers })

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        wsService.send('call_ice', { callId, candidate: e.candidate.toJSON() })
      }
    }

    pc.ontrack = (e) => {
      if (e.streams[0]) this.cb?.onRemoteStream(e.streams[0])
    }

    pc.onconnectionstatechange = () => {
      this.cb?.onConnectionState(pc.connectionState)
      if (pc.connectionState === 'failed') {
        this.cb?.onError('Koneksi gagal. Jaringan mungkin memblokir P2P (butuh TURN).')
      }
    }

    return pc
  }

  // Caller: buat offer, kirim call_invite.
  async startCall(conversationId: string, callType: CallType): Promise<void> {
    this.localStream = await this.getMedia(callType)
    this.cb?.onLocalStream(this.localStream)

    // callId belum ada sampai server balas -- pakai placeholder, diganti saat call_accepted.
    const ice = await getIceServers()
    this.pc = this.buildPc('pending', ice)
    this.localStream.getTracks().forEach((t) => this.pc?.addTrack(t, this.localStream as MediaStream))

    const offer = await this.pc.createOffer()
    await this.pc.setLocalDescription(offer)
    wsService.send('call_invite', { conversationId, sdp: offer, callType })
  }

  // Callee: terima offer, buat answer, kirim call_answer.
  async acceptCall(payload: WsCallIncomingPayload): Promise<void> {
    this.callId = payload.callId
    this.localStream = await this.getMedia(payload.callType)
    this.cb?.onLocalStream(this.localStream)

    const ice = await getIceServers()
    this.pc = this.buildPc(payload.callId, ice)
    this.localStream.getTracks().forEach((t) => this.pc?.addTrack(t, this.localStream as MediaStream))

    await this.pc.setRemoteDescription(payload.sdp)
    await this.drainIce()

    const answer = await this.pc.createAnswer()
    await this.pc.setLocalDescription(answer)
    wsService.send('call_answer', { callId: payload.callId, sdp: answer })
  }

  // Caller: terima answer dari callee.
  async onAccepted(payload: WsCallAcceptedPayload): Promise<void> {
    this.callId = payload.callId
    if (this.pc === null) return
    await this.pc.setRemoteDescription(payload.sdp)
    await this.drainIce()
  }

  async onIce(payload: WsCallIcePayload): Promise<void> {
    if (this.pc === null) return
    if (this.pc.remoteDescription === null) {
      this.pendingIce.push(payload.candidate)
      return
    }
    try {
      await this.pc.addIceCandidate(payload.candidate)
    } catch {
      // Kandidat tidak valid bukan kegagalan fatal -- ICE punya banyak kandidat.
    }
  }

  private async drainIce(): Promise<void> {
    const queued = this.pendingIce.splice(0)
    for (const cand of queued) {
      try {
        await this.pc?.addIceCandidate(cand)
      } catch {
        // sama seperti onIce
      }
    }
  }

  getCallId(): string | null {
    return this.callId
  }

  setCallId(id: string): void {
    this.callId = id
  }

  toggleMic(enabled: boolean): void {
    this.localStream?.getAudioTracks().forEach((t) => { t.enabled = enabled })
  }

  toggleCam(enabled: boolean): void {
    this.localStream?.getVideoTracks().forEach((t) => { t.enabled = enabled })
  }

  // Bersihkan semua. WAJIB dipanggil -- track yang tidak di-stop menahan lampu kamera menyala.
  cleanup(): void {
    this.localStream?.getTracks().forEach((t) => t.stop())
    this.localStream = null
    this.pc?.close()
    this.pc = null
    this.callId = null
    this.pendingIce = []
  }
}

export const callService = new CallService()
