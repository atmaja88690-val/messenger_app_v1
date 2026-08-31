// ============================================================
// AUTH — verified vs DB + API 29 Juni 2026
// ============================================================
export type UserStatus = 'AVAILABLE' | 'AWAY' | 'DND' | 'OFFLINE'
export type AccountType = 'USER' | 'ADMIN' | 'AGENT' | 'SUPERVISOR' | 'MODERATOR'

export interface User {
  id: string
  username: string
  displayName: string
  email?: string
  avatarVersion?: number | null
  status: UserStatus
  accountType?: AccountType
  isActive?: boolean
  lastSeenAt?: string
  createdAt?: string
  updatedAt?: string
  firstName?: string
  lastName?: string
  nickname?: string
  phone?: string
  jobTitle?: string
  jobDepartment?: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}
export interface LoginResponse extends AuthTokens {
  user: User
}

// ============================================================
// MESSAGE — verified vs DB + API
// seq dikirim sbg STRING (BigInt di DB). lastMessage ringkas tanpa seq.
// ============================================================
export type MessageType = 'TEXT' | 'IMAGE' | 'FILE' | 'AUDIO' | 'SYSTEM' | 'CALL'

export interface Attachment {
  id: string
  messageId: string
  storageKey: string
  fileName: string
  mimeType: string
  size: number
  // Diisi HANYA untuk lampiran audio. Keduanya opsional karena seluruh
  // lampiran lama (gambar, berkas) tidak punya dan tidak akan pernah punya.
  durationMs?: number | null
  waveformPeaks?: number[] | null
  createdAt: string
}

export interface Message {
  id: string
  conversationId: string
  senderId: string
  sender?: User
  seq?: string | number        // STRING di lastMessage ringkas, NUMBER di respons penuh (serializeMessage)
  clientMsgId?: string
  type: MessageType
  body?: string | null
  replyToId?: string | null
  editedAt?: string | null
  deletedAt?: string | null
  createdAt: string
  attachments?: Attachment[]
}

// ============================================================
// CONVERSATION — verified vs API response 29 Juni 2026
// Respons dibungkus { conversations: [...] }. members[].user nested.
// ============================================================
export type ConvType = 'DIRECT' | 'GROUP'

export interface ConversationMember {
  userId: string
  role: 'OWNER' | 'ADMIN' | 'MEMBER'
  user: User
}

export interface Conversation {
  id: string
  type: ConvType
  title?: string | null
  avatarVersion?: number | null
  lastMessageAt?: string | null
  lastReadSeq?: string         // STRING
  lastMessage?: Message | null
  members: ConversationMember[]
}

// ============================================================
// WEBSOCKET
// ============================================================
export type WsEventType =
  | 'connected' | 'new_message' | 'message_ack' | 'typing' | 'presence' | 'pong' | 'receipt' | 'error'
  // Call signaling (WebRTC P2P 1:1) -- cermin WS_EVENTS backend
  | 'call_invite' | 'call_answer' | 'call_reject' | 'call_ice' | 'call_end'
  | 'call_created' | 'call_incoming' | 'call_accepted' | 'call_rejected' | 'call_ended'

export type CallType = 'AUDIO' | 'VIDEO'
export type CallState = 'RINGING' | 'ACTIVE' | 'ENDED' | 'MISSED'

export interface CallPeer {
  id: string
  displayName: string
}

export interface WsCallIncomingPayload {
  callId: string
  conversationId: string
  callType: CallType
  sdp: RTCSessionDescriptionInit
  from: CallPeer
}

export interface WsCallAcceptedPayload {
  callId: string
  sdp: RTCSessionDescriptionInit
  by: CallPeer
}

export interface WsCallIcePayload {
  callId: string
  candidate: RTCIceCandidateInit
}

export interface WsCallEndedPayload {
  callId: string
  by: CallPeer
}

export interface WsEvent<T = unknown> {
  type: WsEventType
  payload: T
}
export interface WsNewMessagePayload extends Message {}
export interface WsMessageAckPayload {
  clientMsgId: string
  id: string
  seq: string
  conversationId: string
}
export interface WsTypingPayload {
  userId: string
  displayName: string
  typing: boolean
}
export interface WsReceiptPayload {
  userId: string
  seq: string
  conversationId: string
}

export interface WsPresencePayload {
  userId: string
  status: UserStatus
}
