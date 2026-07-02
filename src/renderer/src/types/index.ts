// ============================================================
// AUTH — verified vs DB + API 29 Juni 2026
// ============================================================
export type UserStatus = 'AVAILABLE' | 'AWAY' | 'DND' | 'OFFLINE'
export type AccountType = 'USER' | 'ADMIN' | 'SYSTEM'

export interface User {
  id: string
  username: string
  displayName: string
  email?: string
  avatarKey?: string | null
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
  avatarKey?: string | null
  lastMessageAt?: string | null
  lastReadSeq?: string         // STRING
  lastMessage?: Message | null
  members: ConversationMember[]
}

// ============================================================
// WEBSOCKET
// ============================================================
export type WsEventType =
  | 'connected' | 'new_message' | 'message_ack' | 'typing' | 'presence' | 'pong' | 'receipt'

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
