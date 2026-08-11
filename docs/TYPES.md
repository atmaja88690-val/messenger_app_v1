# TypeScript Types Reference

## Overview

BSI Messenger uses a strongly-typed TypeScript architecture. All data structures are defined in `src/renderer/src/types/index.ts` and verified against the backend database schema and API responses.

**Last Verified:** June 29, 2026

---

## Core Types

### User

Represents a user account in the system.

```typescript
export type UserStatus = 'AVAILABLE' | 'AWAY' | 'DND' | 'OFFLINE'
export type AccountType = 'USER' | 'ADMIN' | 'AGENT' | 'SUPERVISOR' | 'MODERATOR'

export interface User {
  id: string                    // UUID
  username: string              // Unique username
  displayName: string           // Display name shown in UI
  email?: string                // Email address (optional)
  avatarKey?: string | null     // S3 storage key for avatar
  status: UserStatus            // Current presence status
  accountType?: AccountType     // Role/account type
  isActive?: boolean            // Account active status
  lastSeenAt?: string           // ISO timestamp
  createdAt?: string            // ISO timestamp
  updatedAt?: string            // ISO timestamp
  
  // Extended profile fields
  firstName?: string
  lastName?: string
  nickname?: string
  phone?: string
  jobTitle?: string
  jobDepartment?: string
}
```

**User Status:**
- `AVAILABLE` - Online and available
- `AWAY` - Online but inactive
- `DND` - Do Not Disturb
- `OFFLINE` - Not connected

**Account Types:**
- `USER` - Regular user
- `ADMIN` - Administrator
- `AGENT` - Customer service agent
- `SUPERVISOR` - Agent supervisor
- `MODERATOR` - Content moderator

---

### Authentication

```typescript
export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface LoginResponse extends AuthTokens {
  user: User
}
```

**Usage:**
```typescript
const response = await authService.login({ email, password })
// response: { accessToken, refreshToken, user }
```

---

### Message

Represents a chat message.

```typescript
export type MessageType = 'TEXT' | 'IMAGE' | 'FILE' | 'AUDIO' | 'SYSTEM' | 'CALL'

export interface Message {
  id: string                    // UUID
  conversationId: string        // Parent conversation ID
  senderId: string              // User ID of sender
  sender?: User                 // Populated sender object (optional)
  seq?: string | number         // Sequence number (STRING in summaries, NUMBER in full responses)
  clientMsgId?: string          // Client-generated temp ID (before ACK)
  type: MessageType             // Message content type
  body?: string | null          // Text content (null for non-text types)
  replyToId?: string | null     // ID of message being replied to
  editedAt?: string | null      // ISO timestamp (if edited)
  deletedAt?: string | null     // ISO timestamp (if deleted)
  createdAt: string             // ISO timestamp
  attachments?: Attachment[]    // File attachments
}
```

**Message Types:**
- `TEXT` - Plain text message
- `IMAGE` - Image attachment
- `FILE` - File attachment
- `AUDIO` - Audio/voice message
- `SYSTEM` - System notification (user joined, etc.)
- `CALL` - Call history entry

**Important Notes:**
- `seq` is a **STRING** when used in `lastMessage` (lightweight summary)
- `seq` is a **NUMBER** when returned in full message responses
- `clientMsgId` is temporary ID used before server ACK

---

### Attachment

File attachment metadata.

```typescript
export interface Attachment {
  id: string                    // UUID
  messageId: string             // Parent message ID
  storageKey: string            // S3 storage key
  fileName: string              // Original filename
  mimeType: string              // MIME type (e.g., 'image/png')
  size: number                  // File size in bytes
  createdAt: string             // ISO timestamp
}
```

**Common MIME Types:**
- Images: `image/png`, `image/jpeg`, `image/gif`
- Documents: `application/pdf`, `application/msword`
- Archives: `application/zip`
- Audio: `audio/mpeg`, `audio/wav`

---

### Conversation

Represents a chat conversation (direct or group).

```typescript
export type ConvType = 'DIRECT' | 'GROUP'

export interface Conversation {
  id: string                    // UUID
  type: ConvType                // Conversation type
  title?: string | null         // Group name (null for direct chats)
  avatarKey?: string | null     // S3 storage key for group avatar
  lastMessageAt?: string | null // ISO timestamp of last message
  lastReadSeq?: string          // Last read sequence number (STRING)
  lastMessage?: Message | null  // Last message preview
  members: ConversationMember[] // Conversation participants
}

export interface ConversationMember {
  userId: string                // User ID
  role: 'OWNER' | 'ADMIN' | 'MEMBER'
  user: User                    // Populated user object
}
```

**Conversation Types:**
- `DIRECT` - 1-on-1 conversation (always 2 members)
- `GROUP` - Group conversation (3+ members)

**Member Roles:**
- `OWNER` - Created the group (full permissions)
- `ADMIN` - Can manage members and settings
- `MEMBER` - Regular participant

**API Response Structure:**
```json
{
  "conversations": [
    {
      "id": "...",
      "type": "DIRECT",
      "members": [
        {
          "userId": "...",
          "role": "MEMBER",
          "user": { "id": "...", "displayName": "..." }
        }
      ]
    }
  ]
}
```

---

## WebSocket Events

### Base Event Structure

```typescript
export type WsEventType =
  // Connection
  | 'connected' | 'pong'
  
  // Messages
  | 'new_message' | 'message_ack' | 'receipt'
  
  // Presence
  | 'typing' | 'presence'
  
  // Calls (WebRTC P2P 1:1)
  | 'call_invite' | 'call_answer' | 'call_reject' | 'call_ice' | 'call_end'
  | 'call_created' | 'call_incoming' | 'call_accepted' | 'call_rejected' | 'call_ended'
  
  // Errors
  | 'error'

export interface WsEvent<T = unknown> {
  type: WsEventType
  payload: T
}
```

### Message Events

**New Message (Server → Client):**
```typescript
export interface WsNewMessagePayload extends Message {}

// Example:
{
  type: 'new_message',
  payload: {
    id: '123e4567-...',
    conversationId: 'abc-...',
    senderId: 'user-123',
    sender: { id: 'user-123', displayName: 'John' },
    type: 'TEXT',
    body: 'Hello!',
    createdAt: '2026-06-29T10:30:00Z'
  }
}
```

**Message Acknowledgment (Server → Client):**
```typescript
export interface WsMessageAckPayload {
  clientMsgId: string           // Temp ID from client
  id: string                    // Real ID assigned by server
  seq: string                   // Sequence number (STRING)
  conversationId: string
}

// Example:
{
  type: 'message_ack',
  payload: {
    clientMsgId: 'temp-1234567890',
    id: '123e4567-...',
    seq: '42',
    conversationId: 'abc-...'
  }
}
```

**Read Receipt (Client → Server, Server → Client):**
```typescript
export interface WsReceiptPayload {
  userId: string
  seq: string                   // Last read sequence (STRING)
  conversationId: string
}
```

### Presence Events

**Typing Indicator:**
```typescript
export interface WsTypingPayload {
  userId: string
  displayName: string
  typing: boolean               // true = started, false = stopped
}

// Example:
{
  type: 'typing',
  payload: {
    userId: 'user-123',
    displayName: 'John',
    typing: true
  }
}
```

**User Status Update:**
```typescript
export interface WsPresencePayload {
  userId: string
  status: UserStatus            // 'AVAILABLE' | 'AWAY' | 'DND' | 'OFFLINE'
}
```

### Call Events

**Call Types:**
```typescript
export type CallType = 'AUDIO' | 'VIDEO'
export type CallState = 'RINGING' | 'ACTIVE' | 'ENDED' | 'MISSED'

export interface CallPeer {
  id: string
  displayName: string
}
```

**Incoming Call:**
```typescript
export interface WsCallIncomingPayload {
  callId: string
  conversationId: string
  callType: CallType            // 'AUDIO' | 'VIDEO'
  sdp: RTCSessionDescriptionInit // WebRTC SDP offer
  from: CallPeer
}

// Example:
{
  type: 'call_incoming',
  payload: {
    callId: 'call-123',
    conversationId: 'conv-abc',
    callType: 'VIDEO',
    sdp: { type: 'offer', sdp: '...' },
    from: { id: 'user-123', displayName: 'John' }
  }
}
```

**Call Accepted:**
```typescript
export interface WsCallAcceptedPayload {
  callId: string
  sdp: RTCSessionDescriptionInit // WebRTC SDP answer
  by: CallPeer
}
```

**ICE Candidate:**
```typescript
export interface WsCallIcePayload {
  callId: string
  candidate: RTCIceCandidateInit
}
```

**Call Ended:**
```typescript
export interface WsCallEndedPayload {
  callId: string
  by: CallPeer
}
```

---

## Type Guards

Use type guards to safely check types at runtime.

```typescript
export const isTextMessage = (msg: Message): boolean => {
  return msg.type === 'TEXT' && typeof msg.body === 'string'
}

export const isImageMessage = (msg: Message): boolean => {
  return msg.type === 'IMAGE' && msg.attachments && msg.attachments.length > 0
}

export const isDirectConversation = (conv: Conversation): boolean => {
  return conv.type === 'DIRECT' && conv.members.length === 2
}

export const isGroupConversation = (conv: Conversation): boolean => {
  return conv.type === 'GROUP'
}

export const isUserOnline = (user: User): boolean => {
  return user.status !== 'OFFLINE'
}

export const isUserAvailable = (user: User): boolean => {
  return user.status === 'AVAILABLE'
}
```

**Usage:**
```typescript
if (isTextMessage(message)) {
  // TypeScript knows message.body is string
  const text = message.body.trim()
}
```

---

## Utility Types

### Partial Updates

```typescript
type UpdateUserProfile = Partial<Pick<User, 'displayName' | 'avatarKey' | 'status'>>

// Usage:
const update: UpdateUserProfile = {
  displayName: 'New Name'
}
```

### Required Fields

```typescript
type MessageCreate = Pick<Message, 'conversationId' | 'body' | 'type'>

// Usage:
const newMessage: MessageCreate = {
  conversationId: 'conv-123',
  body: 'Hello',
  type: 'TEXT'
}
```

### Omit System Fields

```typescript
type MessageInput = Omit<Message, 'id' | 'createdAt' | 'seq' | 'sender'>
```

---

## Best Practices

### 1. Never Use `any`

```typescript
// ❌ Bad
const handleMessage = (msg: any) => {
  console.log(msg.body)
}

// ✅ Good
const handleMessage = (msg: Message) => {
  console.log(msg.body)
}
```

### 2. Use Optional Chaining

```typescript
// Safe access to nested optional properties
const avatarUrl = user.avatarKey ? getImageUrl(user.avatarKey) : null
const lastMsg = conversation.lastMessage?.body ?? 'No messages'
```

### 3. Type API Responses

```typescript
// ❌ Bad
const response = await api.get('/users/me')
const user = response.data // unknown type

// ✅ Good
const response = await api.get<User>('/users/me')
const user = response.data // typed as User
```

### 4. Use Discriminated Unions

```typescript
type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string }

const handleResponse = (response: ApiResponse<User>) => {
  if (response.success) {
    // TypeScript knows response.data exists
    console.log(response.data.displayName)
  } else {
    // TypeScript knows response.error exists
    console.error(response.error)
  }
}
```

### 5. Export Types for Reuse

```typescript
// Export from types/index.ts
export type { User, Message, Conversation }

// Import where needed
import type { User, Message } from './types'
```

---

## Type Verification Checklist

When adding new types:

- [ ] Match backend database schema
- [ ] Match API response structure
- [ ] Export from `types/index.ts`
- [ ] Add JSDoc comments for complex types
- [ ] Create type guards if needed
- [ ] Update this documentation

---

## Related Documentation

- [API.md](./API.md) - API endpoints and response types
- [DATABASE.md](./DATABASE.md) - Database schema
- [STATE_MANAGEMENT.md](./STATE_MANAGEMENT.md) - Store type definitions

---

*Types are verified against backend as of June 29, 2026. Always check for schema changes when backend is updated.*
