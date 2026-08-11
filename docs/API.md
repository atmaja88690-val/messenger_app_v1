# BSI Messenger API Documentation

## Overview

BSI Messenger uses a RESTful HTTP API for data operations and WebSocket for real-time communication. All API endpoints require authentication except for login and refresh token operations.

## Base URLs

| Environment | HTTP API | WebSocket |
|-------------|----------|-----------|
| **Production (Native)** | `https://chat.bsilongevity.com:4443/api` | `wss://chat.bsilongevity.com:4443/ws` |
| **Development/Desktop** | `/api` (via local proxy) | `ws://localhost:port/ws` |

## Authentication

### Headers

All authenticated requests require an Authorization header:

```
Authorization: Bearer <access_token>
```

### Token Lifecycle

- **Access Token:** Short-lived (15-30 minutes), used for API requests
- **Refresh Token:** Long-lived, used to obtain new access tokens
- **Proactive Refresh:** Automatic renewal 60 seconds before expiry
- **Reactive Refresh:** 401 interceptor handles expired tokens

---

## REST API Endpoints

### Authentication

#### Login

```http
POST /auth/login
Content-Type: application/json

{
  "username": "string",
  "password": "string"
}
```

**Response (200):**
```json
{
  "user": {
    "id": "string",
    "username": "string", 
    "displayName": "string",
    "email": "string?",
    "avatarKey": "string?",
    "status": "AVAILABLE" | "AWAY" | "DND" | "OFFLINE",
    "accountType": "USER" | "ADMIN" | "AGENT" | "SUPERVISOR" | "MODERATOR",
    "isActive": true,
    "firstName": "string?",
    "lastName": "string?",
    "nickname": "string?",
    "phone": "string?",
    "jobTitle": "string?",
    "jobDepartment": "string?",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "lastSeenAt": "2024-01-01T00:00:00.000Z"
  },
  "accessToken": "jwt_token_string",
  "refreshToken": "refresh_token_string"
}
```

**Example:**
```bash
curl -X POST https://chat.bsilongevity.com:4443/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"johndoe","password":"securepass123"}'
```

**Error Responses:**
- `400` - Invalid request body
- `401` - Invalid credentials
- `429` - Rate limit exceeded

#### Refresh Token

```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "string"
}
```

**Response (200):**
```json
{
  "accessToken": "new_jwt_token_string",
  "refreshToken": "new_refresh_token_string"
}
```

**Example:**
```bash
curl -X POST https://chat.bsilongevity.com:4443/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"your_refresh_token"}'
```

**Error Responses:**
- `401` - Invalid or expired refresh token
- `403` - Refresh token revoked

#### Logout

```http
POST /auth/logout
Authorization: Bearer <access_token>
```

**Response (200):** `{}`

**Example:**
```bash
curl -X POST https://chat.bsilongevity.com:4443/api/auth/logout \
  -H "Authorization: Bearer your_access_token"
```

#### Change Password

```http
POST /auth/change-password
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "password": "string"
}
```

**Response (200):**
```json
{
  "ok": true
}
```

---

### Users

#### Get Current User

```http
GET /users/me
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "user": {
    "id": "string",
    "username": "string",
    "displayName": "string",
    "email": "string?",
    "avatarKey": "string?",
    "status": "AVAILABLE" | "AWAY" | "DND" | "OFFLINE",
    "accountType": "USER" | "ADMIN" | "AGENT" | "SUPERVISOR" | "MODERATOR",
    "isActive": true,
    "firstName": "string?",
    "lastName": "string?", 
    "nickname": "string?",
    "phone": "string?",
    "jobTitle": "string?",
    "jobDepartment": "string?",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "lastSeenAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Update Current User

```http
PATCH /users/me
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "displayName": "string?",
  "status": "AVAILABLE" | "AWAY" | "DND" | "OFFLINE",
  "firstName": "string?",
  "lastName": "string?",
  "nickname": "string?",
  "phone": "string?",
  "jobTitle": "string?",
  "jobDepartment": "string?"
}
```

**Response (200):**
```json
{
  "user": {
    // Updated user object
  }
}
```

**Example:**
```bash
curl -X PATCH https://chat.bsilongevity.com:4443/api/users/me \
  -H "Authorization: Bearer your_token" \
  -H "Content-Type: application/json" \
  -d '{"displayName":"John Doe Updated","status":"AWAY"}'
```

#### Upload Avatar

```http
POST /attachments/avatar
Authorization: Bearer <access_token>
Content-Type: multipart/form-data

avatar: File
```

**Response (200):**
```json
{
  "avatarKey": "string"
}
```

**Example:**
```bash
curl -X POST https://chat.bsilongevity.com:4443/api/attachments/avatar \
  -H "Authorization: Bearer your_token" \
  -F "avatar=@/path/to/image.jpg"
```

#### List Users (Directory)

```http
GET /users?search=query
Authorization: Bearer <access_token>
```

**Parameters:**
- `search` (optional): Search term for username/displayName

**Response (200):**
```json
{
  "users": [
    {
      "id": "string",
      "username": "string",
      "displayName": "string",
      "avatarKey": "string?",
      "status": "AVAILABLE" | "AWAY" | "DND" | "OFFLINE"
    }
  ]
}
```

---

### Admin Endpoints

**Note:** All admin endpoints require `ADMIN` or `MODERATOR` account type.

#### List All Users

```http
GET /admin/users?page=1&limit=20&search=query
Authorization: Bearer <access_token>
```

**Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `search` (optional): Search term

**Response (200):**
```json
{
  "users": [
    {
      "id": "string",
      "username": "string",
      "displayName": "string",
      "email": "string?",
      "avatarKey": "string?",
      "status": "AVAILABLE" | "AWAY" | "DND" | "OFFLINE",
      "accountType": "USER" | "ADMIN" | "AGENT" | "SUPERVISOR" | "MODERATOR",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "lastSeenAt": "2024-01-01T00:00:00.000Z",
      "_count": {
        "sessions": 2,
        "messages": 150
      }
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 20
}
```

#### Get System Statistics

```http
GET /admin/stats
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "totalUsers": 100,
  "activeUsers": 45,
  "totalMessages": 15000,
  "totalConversations": 250,
  "activeSessions": 32
}
```

#### Create User

```http
POST /admin/users
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "username": "string",
  "displayName": "string",
  "password": "string",
  "email": "string?"
}
```

**Response (201):**
```json
{
  "user": {
    // New user object
  }
}
```

#### Update User

```http
PATCH /admin/users/:id
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "displayName": "string?",
  "username": "string?",
  "email": "string?"
}
```

#### Delete User

```http
DELETE /admin/users/:id
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "ok": true
}
```

#### Activate/Deactivate User

```http
PATCH /admin/users/:id/activate
PATCH /admin/users/:id/deactivate
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "user": {
    // Updated user object with isActive changed
  }
}
```

#### Set Admin Role

```http
PATCH /admin/users/:id/set-admin
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "isAdmin": true
}
```

#### Reset User Password

```http
PATCH /admin/users/:id/password
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "password": "string"
}
```

**Response (200):**
```json
{
  "ok": true
}
```

---

### Conversations

#### List Conversations

```http
GET /conversations
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "conversations": [
    {
      "id": "string",
      "type": "DIRECT" | "GROUP",
      "title": "string?",
      "avatarKey": "string?",
      "lastMessageAt": "2024-01-01T00:00:00.000Z?",
      "lastReadSeq": "string",
      "lastMessage": {
        "id": "string",
        "senderId": "string",
        "sender": {
          "id": "string",
          "displayName": "string",
          "avatarKey": "string?"
        },
        "type": "TEXT" | "IMAGE" | "FILE" | "AUDIO" | "SYSTEM" | "CALL",
        "body": "string?",
        "createdAt": "2024-01-01T00:00:00.000Z"
      },
      "members": [
        {
          "userId": "string",
          "role": "OWNER" | "ADMIN" | "MEMBER",
          "user": {
            "id": "string",
            "username": "string",
            "displayName": "string",
            "avatarKey": "string?",
            "status": "AVAILABLE" | "AWAY" | "DND" | "OFFLINE"
          }
        }
      ]
    }
  ]
}
```

#### Create Direct Message

```http
POST /conversations/dm
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "targetUserId": "string"
}
```

**Response (201):**
```json
{
  "conversation": {
    // New conversation object
  }
}
```

#### Create Group Chat

```http
POST /conversations/group
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "title": "string",
  "memberIds": ["string", "string"]
}
```

**Response (201):**
```json
{
  "conversation": {
    // New group conversation object
  }
}
```

---

### Messages

#### List Messages

```http
GET /messages/:conversationId?before=seq
Authorization: Bearer <access_token>
```

**Parameters:**
- `before` (optional): Load messages before this sequence number (pagination)

**Response (200):**
```json
{
  "messages": [
    {
      "id": "string",
      "conversationId": "string", 
      "senderId": "string",
      "sender": {
        "id": "string",
        "username": "string",
        "displayName": "string",
        "avatarKey": "string?"
      },
      "seq": "string",
      "clientMsgId": "string?",
      "type": "TEXT" | "IMAGE" | "FILE" | "AUDIO" | "SYSTEM" | "CALL",
      "body": "string?",
      "replyToId": "string?",
      "editedAt": "2024-01-01T00:00:00.000Z?",
      "deletedAt": "2024-01-01T00:00:00.000Z?",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "attachments": [
        {
          "id": "string",
          "messageId": "string",
          "storageKey": "string",
          "fileName": "string",
          "mimeType": "string",
          "size": 1024,
          "createdAt": "2024-01-01T00:00:00.000Z"
        }
      ]
    }
  ]
}
```

#### Send Message

```http
POST /messages/:conversationId
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "content": "string",
  "clientMsgId": "string",
  "type": "TEXT" | "IMAGE" | "FILE" | "AUDIO",
  "attachments": [
    {
      "storageKey": "string",
      "fileName": "string", 
      "mimeType": "string",
      "sizeBytes": 1024,
      "width": 800,
      "height": 600
    }
  ],
  "replyToId": "string?"
}
```

**Response (201):**
```json
{
  "message": {
    // New message object with server-assigned id and seq
  }
}
```

#### Delete Message

```http
DELETE /messages/:conversationId/:messageId
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "ok": true
}
```

---

### Attachments

#### Upload File

```http
POST /attachments/upload/:conversationId
Authorization: Bearer <access_token>
Content-Type: multipart/form-data

file: File
```

**Response (200):**
```json
{
  "storageKey": "string",
  "fileName": "string",
  "mimeType": "string", 
  "sizeBytes": 1024,
  "width": 800,
  "height": 600
}
```

**Example:**
```bash
curl -X POST https://chat.bsilongevity.com:4443/api/attachments/upload/conv_123 \
  -H "Authorization: Bearer your_token" \
  -F "file=@/path/to/document.pdf"
```

#### Download File

```http
GET /attachments/file/:attachmentId
Authorization: Bearer <access_token>
```

**Response (200):** Binary file stream

**Example:**
```bash
curl -X GET https://chat.bsilongevity.com:4443/api/attachments/file/att_123 \
  -H "Authorization: Bearer your_token" \
  -o downloaded_file.pdf
```

#### Get User Avatar

```http
GET /attachments/avatar/:userId
Authorization: Bearer <access_token>
```

**Response (200):** Image binary stream
**Response (404):** User has no avatar

---

### Call Endpoints

#### Get Call Token

```http
GET /call/:callId/token
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "url": "wss://livekit-server.com",
  "token": "livekit_jwt_token",
  "room": "room_name"
}
```

---

### Push Notifications

#### Register Push Token

```http
POST /push/register
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "token": "fcm_token_string",
  "platform": "android" | "ios"
}
```

**Response (200):**
```json
{
  "ok": true
}
```

---

## WebSocket Events

### Connection

Connect to WebSocket with token authentication:

```
ws://localhost:port/ws?token=<access_token>
wss://chat.bsilongevity.com:4443/ws?token=<access_token>
```

### Client to Server Events

#### Heartbeat

```json
{
  "type": "ping",
  "payload": {}
}
```

#### Typing Indicator

```json
{
  "type": "typing", 
  "payload": {
    "conversationId": "string",
    "typing": true
  }
}
```

#### Mark Read

```json
{
  "type": "read",
  "payload": {
    "conversationId": "string",
    "seq": "string"
  }
}
```

#### Call Signaling

**Call Invite:**
```json
{
  "type": "call_invite",
  "payload": {
    "conversationId": "string",
    "callType": "AUDIO" | "VIDEO",
    "sdp": {
      "type": "offer",
      "sdp": "sdp_string"
    }
  }
}
```

**Call Answer:**
```json
{
  "type": "call_answer",
  "payload": {
    "callId": "string",
    "sdp": {
      "type": "answer", 
      "sdp": "sdp_string"
    }
  }
}
```

**Call Reject:**
```json
{
  "type": "call_reject",
  "payload": {
    "callId": "string"
  }
}
```

**ICE Candidate:**
```json
{
  "type": "call_ice",
  "payload": {
    "callId": "string",
    "candidate": {
      "candidate": "ice_string",
      "sdpMLineIndex": 0,
      "sdpMid": "string"
    }
  }
}
```

**Call End:**
```json
{
  "type": "call_end",
  "payload": {
    "callId": "string"
  }
}
```

### Server to Client Events

#### Connection Established

```json
{
  "type": "connected",
  "payload": {
    "message": "WebSocket connected"
  }
}
```

#### Heartbeat Response

```json
{
  "type": "pong",
  "payload": {}
}
```

#### New Message

```json
{
  "type": "new_message",
  "payload": {
    "id": "string",
    "conversationId": "string",
    "senderId": "string", 
    "sender": {
      "id": "string",
      "displayName": "string",
      "avatarKey": "string?"
    },
    "seq": "string",
    "type": "TEXT" | "IMAGE" | "FILE" | "AUDIO" | "SYSTEM" | "CALL",
    "body": "string?",
    "replyToId": "string?",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "attachments": []
  }
}
```

#### Message Acknowledgment

```json
{
  "type": "message_ack",
  "payload": {
    "clientMsgId": "string",
    "id": "string",
    "seq": "string", 
    "conversationId": "string"
  }
}
```

#### Typing Indicator

```json
{
  "type": "typing",
  "payload": {
    "userId": "string",
    "displayName": "string",
    "typing": true
  }
}
```

#### Presence Update

```json
{
  "type": "presence",
  "payload": {
    "userId": "string",
    "status": "AVAILABLE" | "AWAY" | "DND" | "OFFLINE"
  }
}
```

#### Read Receipt

```json
{
  "type": "receipt",
  "payload": {
    "userId": "string",
    "seq": "string",
    "conversationId": "string"
  }
}
```

#### Error

```json
{
  "type": "error",
  "payload": {
    "message": "string",
    "code": "string?"
  }
}
```

#### Call Events

**Call Created:**
```json
{
  "type": "call_created",
  "payload": {
    "callId": "string",
    "conversationId": "string", 
    "callType": "AUDIO" | "VIDEO"
  }
}
```

**Call Incoming:**
```json
{
  "type": "call_incoming",
  "payload": {
    "callId": "string",
    "conversationId": "string",
    "callType": "AUDIO" | "VIDEO",
    "sdp": {
      "type": "offer",
      "sdp": "sdp_string"
    },
    "from": {
      "id": "string",
      "displayName": "string"
    }
  }
}
```

**Call Accepted:**
```json
{
  "type": "call_accepted",
  "payload": {
    "callId": "string",
    "sdp": {
      "type": "answer",
      "sdp": "sdp_string"
    },
    "by": {
      "id": "string",
      "displayName": "string"
    }
  }
}
```

**Call Rejected:**
```json
{
  "type": "call_rejected", 
  "payload": {
    "callId": "string",
    "by": {
      "id": "string",
      "displayName": "string"
    }
  }
}
```

**Call Ended:**
```json
{
  "type": "call_ended",
  "payload": {
    "callId": "string",
    "by": {
      "id": "string", 
      "displayName": "string"
    }
  }
}
```

**ICE Candidate:**
```json
{
  "type": "call_ice",
  "payload": {
    "callId": "string",
    "candidate": {
      "candidate": "ice_string",
      "sdpMLineIndex": 0,
      "sdpMid": "string"
    }
  }
}
```

---

## Error Handling

### HTTP Error Responses

All endpoints may return these common error responses:

**400 Bad Request:**
```json
{
  "error": {
    "message": "Validation failed",
    "formErrors": ["Invalid request format"],
    "fieldErrors": {
      "username": ["Username is required"],
      "password": ["Password must be at least 8 characters"]
    }
  }
}
```

**401 Unauthorized:**
```json
{
  "error": {
    "message": "Access token expired or invalid"
  }
}
```

**403 Forbidden:**
```json
{
  "error": {
    "message": "Insufficient permissions"
  }
}
```

**404 Not Found:**
```json
{
  "error": {
    "message": "Resource not found"
  }
}
```

**429 Too Many Requests:**
```json
{
  "error": {
    "message": "Rate limit exceeded. Try again in 60 seconds."
  }
}
```

**500 Internal Server Error:**
```json
{
  "error": {
    "message": "Internal server error"
  }
}
```

### WebSocket Error Events

```json
{
  "type": "error",
  "payload": {
    "message": "Authentication failed",
    "code": "AUTH_ERROR"
  }
}
```

---

## Rate Limiting

| Endpoint Category | Limit | Window |
|-------------------|-------|--------|
| Authentication | 5 requests | 1 minute |
| Message sending | 60 messages | 1 minute |
| File uploads | 10 uploads | 1 minute |
| Admin operations | 100 requests | 1 minute |
| General API | 1000 requests | 1 minute |

---

## API Client Examples

### JavaScript/TypeScript

```typescript
// Using Axios with interceptors
import axios from 'axios'

const api = axios.create({
  baseURL: 'https://chat.bsilongevity.com:4443/api',
  timeout: 15000
})

// Add auth token to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('bsi_access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Implement token refresh logic
    }
    return Promise.reject(error)
  }
)

// Usage examples
const loginUser = async (username: string, password: string) => {
  const response = await api.post('/auth/login', { username, password })
  return response.data
}

const getConversations = async () => {
  const response = await api.get('/conversations')
  return response.data.conversations
}

const sendMessage = async (conversationId: string, content: string) => {
  const response = await api.post(`/messages/${conversationId}`, {
    content,
    clientMsgId: crypto.randomUUID(),
    type: 'TEXT'
  })
  return response.data.message
}
```

### WebSocket Client

```typescript
class WebSocketService {
  private ws: WebSocket | null = null
  private handlers = new Map<string, Function[]>()

  connect(token: string) {
    this.ws = new WebSocket(`wss://chat.bsilongevity.com:4443/ws?token=${token}`)
    
    this.ws.onmessage = (event) => {
      const { type, payload } = JSON.parse(event.data)
      const handlers = this.handlers.get(type) || []
      handlers.forEach(handler => handler(payload))
    }
  }

  on(eventType: string, handler: Function) {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, [])
    }
    this.handlers.get(eventType)!.push(handler)
  }

  send(type: string, payload: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }))
    }
  }
}

// Usage
const ws = new WebSocketService()
ws.connect('your_access_token')

ws.on('new_message', (message) => {
  console.log('New message received:', message)
})

ws.on('call_incoming', (callData) => {
  console.log('Incoming call from:', callData.from.displayName)
})

// Send typing indicator
ws.send('typing', { 
  conversationId: 'conv_123', 
  typing: true 
})
```

---

*This API documentation covers all current endpoints and WebSocket events in BSI Messenger. For implementation details and usage examples within the application context, refer to the Services documentation.*