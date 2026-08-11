# Product Requirements Document (PRD)
## BSI Messenger - Real-time Communication Platform

**Version:** 1.0.0  
**Last Updated:** August 10, 2026  
**Status:** Reference Implementation Complete

---

## Executive Summary

BSI Messenger is a modern, real-time communication platform designed for both personal and enterprise use. It supports text messaging, file sharing, voice/video calls, and operates across desktop (Windows, macOS, Linux) and mobile (Android) platforms.

**Target Users:**
- Individual users for personal communication
- Teams for internal collaboration
- Customer support agents for client communication
- Enterprises needing secure messaging platform

**Key Differentiators:**
- Multi-platform support (Desktop + Mobile)
- Real-time synchronization across devices
- Built-in voice/video calling (WebRTC)
- Self-hostable for data sovereignty
- Modern tech stack (React 19, TypeScript, Electron)

---

## Business Requirements

### BR-1: User Management
**Priority:** Critical  
**Status:** ✅ Implemented

**Requirements:**
- BR-1.1: Users must be able to create accounts with email/password
- BR-1.2: Users must be able to log in securely with JWT tokens
- BR-1.3: Users must be able to update their profile (display name, avatar)
- BR-1.4: System must support multiple account types (USER, ADMIN, AGENT, SUPERVISOR)
- BR-1.5: Users must be able to set presence status (Available, Away, DND, Offline)

**Success Metrics:**
- Account creation success rate > 95%
- Login time < 2 seconds
- Session persistence across app restarts

---

### BR-2: Messaging
**Priority:** Critical  
**Status:** ✅ Implemented

**Requirements:**
- BR-2.1: Users must be able to send text messages in real-time
- BR-2.2: Messages must be delivered within 200ms under normal conditions
- BR-2.3: Users must be able to send file attachments (images, documents, audio)
- BR-2.4: Maximum file size: 50MB per attachment
- BR-2.5: Users must be able to edit sent messages within 15 minutes
- BR-2.6: Users must be able to delete messages for all users
- BR-2.7: Users must be able to reply to specific messages
- BR-2.8: System must show typing indicators in real-time
- BR-2.9: System must track read receipts (last read sequence per user)
- BR-2.10: Messages must persist in database and sync across devices

**Success Metrics:**
- Message delivery success rate > 99.9%
- P95 message latency < 300ms
- File upload success rate > 98%

---

### BR-3: Conversations
**Priority:** Critical  
**Status:** ✅ Implemented

**Requirements:**
- BR-3.1: Users must be able to create 1-on-1 direct conversations
- BR-3.2: Users must be able to create group conversations (3+ members)
- BR-3.3: Group creators must be able to set group name and avatar
- BR-3.4: Group admins must be able to add/remove members
- BR-3.5: Users must be able to leave groups
- BR-3.6: Conversation list must show last message preview
- BR-3.7: System must display unread message count per conversation
- BR-3.8: Conversations must be sorted by last activity (most recent first)

**Success Metrics:**
- Conversation creation time < 1 second
- Conversation list load time < 500ms
- Member management operations < 1 second

---

### BR-4: Real-time Communication
**Priority:** Critical  
**Status:** ✅ Implemented

**Requirements:**
- BR-4.1: System must use WebSocket for real-time message delivery
- BR-4.2: WebSocket must auto-reconnect on connection loss
- BR-4.3: System must support voice calls (1-on-1)
- BR-4.4: System must support video calls (1-on-1)
- BR-4.5: Calls must use WebRTC via LiveKit SFU
- BR-4.6: Users must be able to mute/unmute microphone
- BR-4.7: Users must be able to enable/disable camera
- BR-4.8: Users must be able to share screen during calls
- BR-4.9: Call quality must adapt to network conditions

**Success Metrics:**
- WebSocket uptime > 99.5%
- Reconnection time < 2 seconds
- Call connection success rate > 95%
- Call audio/video quality score > 4/5

---

### BR-5: Multi-Platform Support
**Priority:** High  
**Status:** ✅ Implemented (Desktop + Android)

**Requirements:**
- BR-5.1: Application must run on Windows 10/11
- BR-5.2: Application must run on macOS 12+
- BR-5.3: Application must run on Linux (Ubuntu, Fedora)
- BR-5.4: Application must run on Android 7.0+ (API 24+)
- BR-5.5: Single codebase for web UI (React)
- BR-5.6: Native wrappers for desktop (Electron) and mobile (Capacitor)
- BR-5.7: All features must work consistently across platforms

**Success Metrics:**
- Feature parity: 100% across desktop platforms
- Feature parity: 95% mobile vs desktop
- Platform-specific bugs < 5% of total bugs

---

### BR-6: Push Notifications (Mobile)
**Priority:** High  
**Status:** ✅ Implemented (Android)

**Requirements:**
- BR-6.1: Users must receive push notifications for new messages
- BR-6.2: Notifications must show sender name and message preview
- BR-6.3: Tapping notification must open relevant conversation
- BR-6.4: Users must be able to enable/disable notifications per conversation
- BR-6.5: System must use Firebase Cloud Messaging (FCM)

**Success Metrics:**
- Notification delivery rate > 95%
- Notification latency < 5 seconds
- Notification click-through rate > 60%

---

### BR-7: Data Security
**Priority:** Critical  
**Status:** ✅ Implemented

**Requirements:**
- BR-7.1: All API communication must use HTTPS
- BR-7.2: All WebSocket communication must use WSS
- BR-7.3: Passwords must be hashed with bcrypt (backend)
- BR-7.4: JWT tokens must be stored in HTTP-only cookies
- BR-7.5: Tokens must expire after 7 days
- BR-7.6: User input must be validated on client and server
- BR-7.7: File uploads must be scanned for malware (backend)
- BR-7.8: SQL injection prevention via parameterized queries (backend)
- BR-7.9: XSS prevention via input sanitization

**Success Metrics:**
- Zero critical security vulnerabilities
- Security audit score > 90%
- No data breaches

---

### BR-8: Performance
**Priority:** High  
**Status:** ✅ Optimized

**Requirements:**
- BR-8.1: Application must load in < 3 seconds
- BR-8.2: Message list must scroll at 60 FPS
- BR-8.3: Desktop app memory usage < 200MB (idle)
- BR-8.4: Mobile app memory usage < 100MB (idle)
- BR-8.5: Desktop installer size < 150MB
- BR-8.6: Mobile APK size < 30MB
- BR-8.7: API response time P95 < 200ms
- BR-8.8: Database queries must use proper indexes

**Success Metrics:**
- Lighthouse performance score > 90
- User-perceived performance rating > 4/5
- Crash rate < 1%

---

### BR-9: Offline Support
**Priority:** Medium  
**Status:** ⚠️ Partial (messages cached in-memory)

**Requirements:**
- BR-9.1: Recent messages must be available offline
- BR-9.2: Unsent messages must be queued and sent when online
- BR-9.3: UI must indicate offline status
- BR-9.4: App must gracefully handle network interruptions

**Success Metrics:**
- Offline message cache: 100 most recent messages per conversation
- Message send retry success rate > 90%

---

### BR-10: Auto-Update
**Priority:** Medium  
**Status:** ✅ Implemented (Desktop)

**Requirements:**
- BR-10.1: Desktop app must check for updates on startup
- BR-10.2: Users must be notified of available updates
- BR-10.3: Updates must be downloaded in background
- BR-10.4: Updates must be applied after user confirmation
- BR-10.5: Mobile app updates via Google Play Store

**Success Metrics:**
- Update adoption rate > 80% within 1 week
- Update failure rate < 5%

---

## Functional Requirements

### FR-1: Authentication & Authorization

#### FR-1.1: User Registration
**Input:**
- Email (valid format, unique)
- Password (min 8 chars, 1 uppercase, 1 number)
- Display Name (min 2 chars, max 50 chars)

**Process:**
1. Validate input on client
2. Send POST /auth/register to backend
3. Backend creates user in database
4. Backend returns JWT token + user object
5. Client stores token in HTTP-only cookie
6. Client stores user in Zustand store
7. Redirect to chat interface

**Output:**
- User account created
- User automatically logged in

#### FR-1.2: User Login
**Input:**
- Email
- Password

**Process:**
1. Validate input on client
2. Send POST /auth/login to backend
3. Backend verifies credentials
4. Backend returns JWT token + user object
5. Client stores token in HTTP-only cookie
6. Client stores user in Zustand store
7. Client connects WebSocket
8. Redirect to chat interface

**Output:**
- User logged in
- WebSocket connected

#### FR-1.3: User Logout
**Process:**
1. Client sends POST /auth/logout
2. Backend invalidates token
3. Client disconnects WebSocket
4. Client clears auth store
5. Client clears localStorage
6. Redirect to login page

**Output:**
- User logged out
- All state cleared

---

### FR-2: Messaging

#### FR-2.1: Send Text Message
**Input:**
- Conversation ID
- Message body (text, max 10,000 chars)

**Process:**
1. User types in message input
2. Client generates temporary clientMsgId
3. Client creates optimistic message object
4. Client adds to messages store (status: 'sending')
5. Client sends via WebSocket: { type: 'message:send', data: {...} }
6. Backend validates and saves message
7. Backend broadcasts to conversation members
8. Backend sends ACK: { type: 'message_ack', payload: { clientMsgId, id, seq } }
9. Client replaces temp message with real message

**Output:**
- Message delivered to all conversation members
- Real-time update in UI

#### FR-2.2: Send File Attachment
**Input:**
- Conversation ID
- File (max 50MB)

**Process:**
1. User selects file via file picker
2. Client validates file size and type
3. Client uploads via POST /upload with multipart/form-data
4. Client shows upload progress bar
5. Backend saves file to storage (S3-compatible)
6. Backend returns storageKey and metadata
7. Client sends message with attachment reference
8. Backend creates message with attachment record
9. Backend broadcasts to conversation members

**Output:**
- File uploaded and attached to message
- Downloadable by all conversation members

#### FR-2.3: Edit Message
**Input:**
- Message ID
- New body text

**Process:**
1. User clicks edit on own message
2. Client shows edit UI
3. User modifies text
4. Client sends PATCH /messages/:id
5. Backend validates user owns message
6. Backend updates message body and editedAt timestamp
7. Backend broadcasts update via WebSocket
8. All clients update message in UI

**Output:**
- Message updated with '(edited)' indicator

#### FR-2.4: Delete Message
**Input:**
- Message ID

**Process:**
1. User clicks delete on own message
2. Client shows confirmation dialog
3. User confirms
4. Client sends DELETE /messages/:id
5. Backend validates user owns message or is admin
6. Backend sets deletedAt timestamp
7. Backend broadcasts deletion via WebSocket
8. All clients remove message from UI

**Output:**
- Message deleted for all users

---

### FR-3: Conversations

#### FR-3.1: Create Direct Conversation
**Input:**
- Target user ID

**Process:**
1. User searches for user
2. User selects user from search results
3. Client checks if conversation already exists (GET /conversations?userId=...)
4. If exists: navigate to existing conversation
5. If not: Client sends POST /conversations { type: 'DIRECT', members: [userId] }
6. Backend creates conversation
7. Backend adds both users as members
8. Backend returns conversation object
9. Client navigates to new conversation

**Output:**
- Direct conversation created (or existing one opened)

#### FR-3.2: Create Group Conversation
**Input:**
- Group title
- Member user IDs (min 2, excluding creator)

**Process:**
1. User clicks "New Group"
2. User enters group name
3. User selects members from contact list
4. Client sends POST /conversations { type: 'GROUP', title, members }
5. Backend creates conversation
6. Backend adds creator as OWNER
7. Backend adds selected users as MEMBERs
8. Backend broadcasts to all members
9. All members see new conversation in list

**Output:**
- Group conversation created
- All members notified

#### FR-3.3: Add Member to Group
**Input:**
- Conversation ID
- User ID to add

**Requirements:**
- Requester must be OWNER or ADMIN

**Process:**
1. Admin opens group settings
2. Admin clicks "Add Member"
3. Admin selects user
4. Client sends POST /conversations/:id/members { userId }
5. Backend validates admin permission
6. Backend adds user as MEMBER
7. Backend broadcasts update to all members
8. New member sees conversation appear

**Output:**
- Member added to group
- All members notified

---

### FR-4: Real-time Features

#### FR-4.1: Typing Indicator
**Input:**
- User starts typing

**Process:**
1. Client detects input in message field
2. Client sends WebSocket: { type: 'typing:start', data: { conversationId } }
3. Backend broadcasts to other conversation members
4. Other clients show "User is typing..."
5. After 2 seconds of no input, client sends 'typing:stop'
6. Other clients hide typing indicator

**Output:**
- Other users see typing indicator in real-time

#### FR-4.2: Presence Status
**Input:**
- User changes status (Available, Away, DND)

**Process:**
1. User selects status from dropdown
2. Client sends PATCH /users/me { status }
3. Backend updates user status
4. Backend broadcasts via WebSocket to all relevant users
5. All clients update user status indicator

**Automatic Status:**
- Away: Set after 5 minutes of inactivity
- Offline: Set on WebSocket disconnect

**Output:**
- User status updated for all other users

#### FR-4.3: Voice/Video Call
**Input:**
- Conversation ID
- Call type (AUDIO or VIDEO)

**Process:**
1. User clicks call button
2. Client sends POST /calls { conversationId, type }
3. Backend creates call record
4. Backend returns LiveKit token
5. Client connects to LiveKit room
6. Backend sends WebSocket to recipients: { type: 'call_incoming', ... }
7. Recipients see incoming call UI
8. Recipient accepts or rejects
9. If accepted: Recipient gets LiveKit token and joins room
10. WebRTC connection established via LiveKit SFU
11. Audio/video streams exchanged

**Output:**
- Real-time audio/video call established

---

### FR-5: Search

#### FR-5.1: Search Conversations
**Input:**
- Search query (min 2 chars)

**Process:**
1. User types in search bar
2. Client debounces input (300ms)
3. Client filters conversations by title or member names
4. Client displays filtered results

**Output:**
- Matching conversations shown

#### FR-5.2: Search Users
**Input:**
- Search query (min 2 chars)

**Process:**
1. User types in "New Chat" search
2. Client sends GET /users?search=query
3. Backend searches users by displayName, username, email
4. Backend returns matching users (max 20)
5. Client displays results

**Output:**
- Matching users shown for selection

---

## Non-Functional Requirements

### NFR-1: Scalability
- System must support 10,000 concurrent users
- Database must handle 1M+ messages
- WebSocket server must handle 10,000 concurrent connections
- File storage must scale to 1TB+

### NFR-2: Reliability
- System uptime: 99.9% (max 8.76 hours downtime/year)
- Data durability: 99.999999999% (11 nines via S3)
- Message delivery guarantee: At-least-once
- Automatic failover for critical services

### NFR-3: Usability
- User can send first message within 2 minutes of signup
- UI must follow platform conventions (Windows, macOS, Android)
- Touch targets must be min 44x44px (mobile)
- Color contrast must meet WCAG AA standards
- Error messages must be clear and actionable

### NFR-4: Maintainability
- Code must follow TypeScript strict mode
- All components must be documented
- Code coverage target: 70%+ (when tests added)
- All APIs must have OpenAPI documentation
- Semantic versioning for releases

### NFR-5: Compatibility
- Desktop: Windows 10+, macOS 12+, Ubuntu 20.04+
- Mobile: Android 7.0+ (API 24+)
- Browsers (dev): Chrome 90+, Firefox 88+, Safari 14+
- Node.js: 20.x or 22.x LTS

### NFR-6: Accessibility
- Keyboard navigation for all features
- Screen reader support
- High contrast mode support
- Configurable font sizes
- Focus indicators visible

---

## Technical Requirements

### TR-1: Frontend Technology Stack
**Requirements:**
- React 19.x (UI framework)
- TypeScript 5.9.x (type safety)
- TailwindCSS 4.x (styling)
- Zustand 5.x (state management)
- TanStack Router 1.x (routing)
- TanStack Query 5.x (data fetching)
- Vite 6.x (build tool)
- Axios 1.x (HTTP client)

### TR-2: Desktop Technology
**Requirements:**
- Electron 39.x (desktop wrapper)
- electron-builder 25.x (packaging)
- IPC for main-renderer communication
- Local proxy server for API/WebSocket

### TR-3: Mobile Technology
**Requirements:**
- Capacitor 8.x (mobile wrapper)
- Android SDK 34 (target)
- Android SDK 24 (minimum)
- Firebase Cloud Messaging (push notifications)
- Native plugins: Push Notifications, Filesystem, Share, Splash Screen

### TR-4: Backend Technology (Reference)
**Requirements:**
- Node.js 20.x + Express.js OR
- Python + FastAPI OR
- Go + Gin (implementation flexible)
- PostgreSQL 15+ (database)
- WebSocket (Socket.io or native)
- LiveKit (WebRTC SFU)
- S3-compatible storage (files)
- Redis (optional: caching, pub/sub)

### TR-5: DevOps Requirements
**Requirements:**
- Git version control
- GitHub for code hosting
- GitHub Actions for CI/CD
- Docker for containerization (backend)
- Environment-based configuration
- Automated testing (future)
- Monitoring and logging (future)

---

## User Stories

### Epic: Messaging

**US-1:** As a user, I want to send text messages so I can communicate with others.  
**US-2:** As a user, I want to send images so I can share visual content.  
**US-3:** As a user, I want to edit my messages so I can fix mistakes.  
**US-4:** As a user, I want to delete messages so I can remove unwanted content.  
**US-5:** As a user, I want to see when others are typing so I know they're responding.  
**US-6:** As a user, I want to see read receipts so I know if my message was seen.  

### Epic: Conversations

**US-7:** As a user, I want to create 1-on-1 chats so I can talk privately.  
**US-8:** As a user, I want to create group chats so I can talk with multiple people.  
**US-9:** As a user, I want to add people to groups so I can expand conversations.  
**US-10:** As a user, I want to leave groups I don't want to be in anymore.  

### Epic: Calls

**US-11:** As a user, I want to make voice calls so I can talk instead of typing.  
**US-12:** As a user, I want to make video calls so I can see who I'm talking to.  
**US-13:** As a user, I want to screen share so I can show my screen to others.  

### Epic: Mobile

**US-14:** As a mobile user, I want push notifications so I don't miss messages.  
**US-15:** As a mobile user, I want to download files so I can save attachments.  
**US-16:** As a mobile user, I want to share messages so I can forward content.  

---

## Constraints

### Technical Constraints
- Must use JavaScript/TypeScript ecosystem
- Must use PostgreSQL for relational data
- Must support self-hosting (no vendor lock-in)
- Must work behind corporate firewalls (standard ports)

### Business Constraints
- Initial release: Desktop + Android only (iOS later)
- Budget: Open source / minimal infrastructure costs
- Timeline: Reference implementation complete
- Team: Small team (1-5 developers)

### Legal Constraints
- Must comply with GDPR (if EU users)
- Must comply with CCPA (if CA users)
- Must have Privacy Policy and Terms of Service
- Must allow users to export their data
- Must allow users to delete their account

---

## Success Criteria

### MVP Success (v1.0.0)
- [x] 1000+ messages sent successfully
- [x] 100+ users registered
- [x] 50+ active daily users
- [x] <1% crash rate
- [x] 4+ star rating from users
- [x] Zero critical security vulnerabilities

### Long-term Success (v2.0.0+)
- [ ] 10,000+ active users
- [ ] 1M+ messages sent
- [ ] iOS support launched
- [ ] Enterprise customers onboarded
- [ ] 99.9% uptime achieved
- [ ] End-to-end encryption implemented

---

## Out of Scope (for v1.0.0)

The following features are **NOT** included in the initial release:

- ❌ Message reactions (planned v1.1)
- ❌ Message search (planned v1.2)
- ❌ Rich text formatting (planned v1.2)
- ❌ Voice messages (planned v1.2)
- ❌ Group video calls (planned v2.0)
- ❌ End-to-end encryption (planned v2.0)
- ❌ iOS support (planned v2.0)
- ❌ Web app (desktop only for now)
- ❌ Message forwarding
- ❌ Polls
- ❌ Bots/integrations
- ❌ Custom emoji
- ❌ Stickers

---

## Appendix

### Terminology
- **Conversation:** A chat between 2+ users (direct or group)
- **Message:** A text or file sent in a conversation
- **Attachment:** A file attached to a message
- **Presence:** User's online status (Available, Away, DND, Offline)
- **WebSocket:** Real-time bidirectional communication protocol
- **WebRTC:** Peer-to-peer audio/video communication
- **SFU:** Selective Forwarding Unit (LiveKit) for video routing
- **JWT:** JSON Web Token for authentication
- **FCM:** Firebase Cloud Messaging for push notifications

### References
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System design
- [API.md](./API.md) - API specification
- [DATABASE.md](./DATABASE.md) - Database schema
- [DESIGN.md](./DESIGN.md) - UI/UX design specifications

---

*This PRD serves as the source of truth for BSI Messenger requirements. All implementations must align with these specifications.*
