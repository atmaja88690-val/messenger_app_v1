Baik, saya sudah menganalisa aplikasi BSI Messenger. Ini adalah aplikasi messaging/chat internal yang dibangun dengan Electron + React + TypeScript, dengan dukungan untuk platform Android melalui Capacitor.

Ringkasan Aplikasi:
Aplikasi ini adalah BSI Messenger - platform komunikasi internal perusahaan dengan fitur chat real-time menggunakan WebSocket, panggilan audio/video (LiveKit), dan rencana ekspansi untuk omnichannel messaging (WhatsApp Business, Instagram, webchat). Saat ini fokus utama pada internal chat, sementara fitur omnichannel masih dalam tahap placeholder.

Teknologi Stack:

Frontend: React 19, TypeScript, TailwindCSS, Tanstack Router
Desktop: Electron dengan local proxy server
Mobile: Capacitor (Android)
Real-time: WebSocket + LiveKit untuk audio/video call
State Management: Zustand
API: Axios dengan token refresh mechanism
Sebelum saya membuat requirements lengkap, desain, dan task breakdown, saya ingin klarifikasi beberapa hal:

[1]: Apa tujuan utama dari permintaan analisa ini? a. Dokumentasi - Anda ingin dokumentasi lengkap tentang aplikasi yang sudah ada b. Perencanaan fitur baru - Anda ingin menambahkan fitur baru tertentu (sebutkan) c. Refactoring - Anda ingin merencanakan perbaikan atau restrukturisasi kode d. Migrasi - Anda ingin merencanakan migrasi teknologi atau platform e. Other - Tujuan lain (sebutkan)

[2]: Fitur-fitur yang belum diimplementasi (Inbox/Broadcast/Templates/Analytics) - apa status prioritasnya? a. Prioritas tinggi - Perlu diimplementasikan segera b. Prioritas rendah - Masih dalam roadmap jangka panjang c. Tidak relevan - Fokus hanya pada fitur chat internal yang sudah ada d. Other - Penjelasan lain

[3]: Apakah ada area spesifik yang ingin difokuskan dalam analisa? a. Arsitektur & struktur kode - Analisa mendalam tentang pola desain dan organisasi b. Keamanan & performa - Audit keamanan dan optimasi performa c. User experience - Analisa flow dan UX aplikasi d. Semua aspek - Analisa menyeluruh dari semua sisi e. Other - Area spesifik tertentu (sebutkan)

(Gunakan chat untuk menjawab, misalnya: "1=b, 2=a, 3=d")

Est. Credits Used: 1.8
Elapsed time: 2m 34s


Checkpoint
Restore
1=a, 2=d, 3=d

Kiro
Baik, saya akan membuat dokumentasi lengkap dengan analisa menyeluruh dari semua aspek. Fitur Inbox/Broadcast/Templates/Analytics tidak akan dibahas secara detail karena masih placeholder.

Mari saya lanjutkan membaca beberapa file kunci lainnya untuk melengkapi analisa:


8 tool calls
Read Files

chat.store.ts

auth.store.ts

call.store.ts
Read Files

ws.service.ts

call.service.ts
Read File

local-server.ts
List Directory
Melihat file routes untuk memahami struktur routing
Read File

main.tsx
File Search
Mencari file konfigurasi router
Read File

router.tsx
Read File

bsichat_backup_20260701_1218.sql
Sempurna! Saya sudah mengumpulkan informasi lengkap. Sekarang saya akan menyusun dokumentasi lengkap dengan requirements, desain, dan task breakdown.

Dokumentasi Lengkap - BSI Messenger Application
Problem Statement
Organisasi membutuhkan platform komunikasi internal yang aman, real-time, dan mudah diakses untuk meningkatkan kolaborasi tim. Platform harus mendukung desktop (Windows, macOS, Linux) dan mobile (Android), dengan kemampuan chat teks, berbagi media, panggilan audio/video, serta manajemen pengguna terpusat.

Requirements
1. Functional Requirements
A. Autentikasi & Manajemen Pengguna
FR-1.1: Sistem login dengan username dan password
FR-1.2: Token-based authentication dengan automatic refresh mechanism
FR-1.3: Session management dengan revoke saat login baru
FR-1.4: User profile management (display name, avatar, status, job info)
FR-1.5: User status (AVAILABLE, AWAY, DND, OFFLINE) dengan real-time sync
FR-1.6: Proactive & reactive token refresh untuk mencegah session expiry
FR-1.7: Automatic logout handling saat token invalid atau expired
B. Chat & Messaging
FR-2.1: Direct messaging 1-on-1
FR-2.2: Group messaging dengan multiple participants
FR-2.3: Real-time message delivery via WebSocket
FR-2.4: Message types: TEXT, IMAGE, FILE, AUDIO, SYSTEM, CALL
FR-2.5: Optimistic UI untuk pengiriman pesan
FR-2.6: Message acknowledgment dengan clientMsgId tracking
FR-2.7: Message sequence number untuk ordering dan read receipts
FR-2.8: Read receipts dengan cursor tracking per conversation
FR-2.9: Reply-to-message (threading)
FR-2.10: Message deletion
FR-2.11: Typing indicators
FR-2.12: Attachment upload dan download (gambar, file)
FR-2.13: Message history pagination dengan "load more"
FR-2.14: Last message preview di conversation list
C. Voice & Video Calls
FR-3.1: Audio-only calls 1-on-1
FR-3.2: Video calls 1-on-1
FR-3.3: Call signaling via WebSocket
FR-3.4: Media streaming via LiveKit SFU architecture
FR-3.5: Call status: idle, calling, ringing, active, ended
FR-3.6: Incoming call notification dengan accept/reject
FR-3.7: Mic mute/unmute control
FR-3.8: Camera on/off control
FR-3.9: Call reconnection handling
FR-3.10: Missed call detection
FR-3.11: Call history tracking (stored in messages as CALL type)
D. Admin Panel
FR-4.1: User management dashboard
FR-4.2: Create new users dengan initial password
FR-4.3: Edit user information (username, email, display name)
FR-4.4: Activate/deactivate user accounts
FR-4.5: Set admin privileges
FR-4.6: Reset user passwords
FR-4.7: Delete user accounts
FR-4.8: System statistics (users, messages, conversations, sessions)
FR-4.9: User search dengan pagination
FR-4.10: Role-based access control (USER, ADMIN, AGENT, SUPERVISOR, MODERATOR)
E. Desktop Features (Electron)
FR-5.1: System tray integration dengan show/hide window
FR-5.2: Native notifications untuk new messages dan calls
FR-5.3: Application menu (File, Edit, View, Help)
FR-5.4: Local proxy server untuk same-origin API access
FR-5.5: Settings persistence (download directory, notifications)
FR-5.6: Open at login option
FR-5.7: Window state management (minimize to tray)
FR-5.8: Deep linking support
F. Mobile Features (Capacitor Android)
FR-6.1: Push notifications via FCM
FR-6.2: Share functionality untuk konten eksternal
FR-6.3: File system access untuk attachment downloads
FR-6.4: Responsive mobile UI dengan sidebar/chat view toggle
G. UI/UX Features
FR-7.1: Multi-section navigation (Chats, Inbox, Broadcast, Templates, Analytics)
FR-7.2: Sidebar conversation list dengan search
FR-7.3: Chat area dengan message bubbles
FR-7.4: Contact info panel dengan user details
FR-7.5: New chat dialog (DM dan Group)
FR-7.6: Settings dialog dengan server info dan options
FR-7.7: About dialog dengan app version
FR-7.8: User profile dialog untuk edit profile
FR-7.9: Partner profile dialog untuk view contact details
FR-7.10: Avatar display dengan fallback initials
FR-7.11: Responsive design (mobile, tablet, desktop breakpoints)
FR-7.12: Dark theme default
FR-7.13: Auto-hide panel pada viewport sempit (<1100px)
H. Planned Features (Currently Placeholder)
FR-8.1: Inbox omnichannel untuk WhatsApp, Instagram, webchat
FR-8.2: Broadcast messaging untuk WhatsApp Business
FR-8.3: Message templates management (Meta-approved)
FR-8.4: Analytics & reporting dashboard
2. Non-Functional Requirements
A. Performance
NFR-1.1: Message latency < 500ms dalam kondisi normal
NFR-1.2: WebSocket reconnection dalam 3 detik (backoff up to 30s)
NFR-1.3: Optimistic UI untuk instant feedback
NFR-1.4: Image lazy loading dengan blob URL caching
NFR-1.5: Virtualized list rendering untuk banyak conversations
NFR-1.6: React Query caching dengan 30s stale time
B. Security
NFR-2.1: JWT access token (short-lived)
NFR-2.2: Refresh token untuk long-lived sessions
NFR-2.3: Token auto-refresh sebelum expiry (proactive)
NFR-2.4: Secure WebSocket (wss://) di production
NFR-2.5: HTTPS only untuk API calls
NFR-2.6: Backend validation untuk semua admin actions
NFR-2.7: Session revoke saat logout atau login baru
NFR-2.8: Local storage untuk token persistence
NFR-2.9: Same-origin policy via local proxy server (Electron)
C. Reliability
NFR-3.1: Automatic reconnection untuk WebSocket
NFR-3.2: Offline message queue
NFR-3.3: Ping/pong heartbeat (30s interval, 70s timeout)
NFR-3.4: Error handling untuk network failures
NFR-3.5: Graceful degradation saat backend unavailable
NFR-3.6: HMR-safe service cleanup untuk development
D. Usability
NFR-4.1: Intuitive UI mirip modern messaging apps (Telegram, WhatsApp)
NFR-4.2: Keyboard shortcuts (CmdOrCtrl+Shift+N untuk new user)
NFR-4.3: Visual feedback untuk loading states
NFR-4.4: Error messages yang informatif
NFR-4.5: Mobile-first responsive design
E. Maintainability
NFR-5.1: TypeScript strict mode untuk type safety
NFR-5.2: Modular architecture dengan separation of concerns
NFR-5.3: Zustand untuk state management (simple, tidak boilerplate)
NFR-5.4: Service layer untuk API abstraction
NFR-5.5: Component composition dengan reusable parts
NFR-5.6: ESLint + Prettier untuk code consistency
F. Compatibility
NFR-6.1: Desktop: Windows, macOS, Linux
NFR-6.2: Mobile: Android (via Capacitor)
NFR-6.3: Backend: PostgreSQL database
NFR-6.4: Media server: LiveKit SFU (separate instance dari plugNmeet)
NFR-6.5: Push: Firebase Cloud Messaging (Android)
Background
Technology Stack
Frontend
React 19: Latest React dengan concurrent features
TypeScript 5.9: Strict type checking
TailwindCSS 3.4: Utility-first CSS framework
Tanstack Router 1.x: File-based routing dengan type safety
Tanstack React Query 5.x: Server state management & caching
Zustand 5.x: Client state management (auth, chat, call)
Axios 1.x: HTTP client dengan interceptors
React Virtuoso 4.x: Virtualized lists untuk performance
Desktop
Electron 39: Cross-platform desktop app framework
Electron Vite 5: Fast bundler untuk Electron
Electron Builder 26: Packaging & distribution
Mobile
Capacitor 8: Native mobile runtime
Capacitor Filesystem: File access
Capacitor Push Notifications: FCM integration
Capacitor Share: Share API
Real-time & Media
WebSocket: Custom WS protocol untuk chat events
LiveKit Client 2.x: WebRTC SFU untuk audio/video calls
Build Tools
Vite 7: Lightning-fast dev server
PostCSS & Autoprefixer: CSS processing
ESLint 9: Code linting
Prettier 3: Code formatting
Architecture Overview

┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND LAYER                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Electron   │  │ Capacitor    │  │   Browser    │      │
│  │   (Desktop)  │  │  (Android)   │  │   (Future)   │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │               │
│         └──────────────────┴──────────────────┘               │
│                            │                                  │
│                  ┌─────────▼──────────┐                      │
│                  │   React App        │                      │
│                  │   (Renderer)       │                      │
│                  └─────────┬──────────┘                      │
│                            │                                  │
│         ┌──────────────────┼──────────────────┐              │
│         │                  │                  │              │
│    ┌────▼────┐      ┌──────▼──────┐    ┌─────▼─────┐       │
│    │ Zustand │      │   Services  │    │Components │       │
│    │ Stores  │      │   Layer     │    │   Layer   │       │
│    │         │      │             │    │           │       │
│    │ • auth  │      │ • api       │    │ • chat    │       │
│    │ • chat  │      │ • ws        │    │ • admin   │       │
│    │ • call  │      │ • call      │    │ • auth    │       │
│    └─────────┘      │ • token     │    │ • common  │       │
│                     │ • notif     │    └───────────┘       │
│                     └─────────────┘                         │
│                                                               │
└───────────────────────┬───────────────────────────────────────┘
                        │
          ┌─────────────┼─────────────┐
          │             │             │
    ┌─────▼─────┐  ┌────▼────┐  ┌────▼─────┐
    │   HTTPS   │  │   WSS   │  │ LiveKit  │
    │  REST API │  │WebSocket│  │   SFU    │
    └───────────┘  └─────────┘  └──────────┘
          │             │             │
          └─────────────┼─────────────┘
                        │
         ┌──────────────▼──────────────┐
         │      BACKEND LAYER          │
         │  (chat.bsilongevity.com)    │
         │                              │
         │  • Express.js API Server    │
         │  • WebSocket Server         │
         │  • PostgreSQL Database      │
         │  • MinIO Object Storage     │
         │  • LiveKit RTC Server       │
         │  • Redis (sessions/cache)   │
         └──────────────────────────────┘
Key Design Decisions
1. State Management Strategy
Zustand dipilih untuk kesederhanaan vs Redux (no boilerplate, hooks-based)
React Query untuk server state caching dan invalidation
Separation: Server state (React Query) vs Client state (Zustand)
Store structure:
auth.store: User session, login/logout
chat.store: Conversations, messages, real-time events
call.store: Voice/video call state machine
2. Real-time Communication
Custom WebSocket protocol (bukan Socket.io) untuk lightweight control
Event-driven architecture: Type-safe event handlers via Zustand
Reconnection strategy: Exponential backoff (3s → 30s max)
Ping/pong heartbeat: 30s interval, 70s timeout
Token refresh coordination: WS tunda connect saat refresh in-flight
3. Authentication Flow

Login → Store tokens → Connect WS → Schedule proactive refresh
                                         ↓
                                   Token expires soon
                                         ↓
                                   Proactive refresh
                                         ↓
                                   Success → Reconnect WS
                                         ↓
                                   Fallback: Reactive refresh
                                         ↓
                                   401 → Interceptor → Retry
                                         ↓
                                   Final fail → Logout
4. Optimistic UI Pattern
Messages: Tampil instant dengan clientMsgId sebelum ACK server
Images: Preview lokal via blob URL selama upload
ACK handling: Replace clientMsgId dengan server ID+seq
Re-fetch strategy: Gambar re-fetch untuk dapat attachment ID valid
5. Call Architecture (LiveKit SFU)
SFU vs P2P: LiveKit SFU untuk menghindari CGNAT issues
Separate instance: bsichat-rtc BUKAN plugNmeet (port & key berbeda)
Token-based: Backend issue LiveKit token per call
Room-based: Setiap call = 1 room dengan 2 participants
Reconnection: LiveKit handle automatic reconnection
Media tracks: Single MediaStream untuk semua remote tracks
6. Electron-Specific
Local proxy server: HTTP 127.0.0.1 untuk same-origin (no CORS)
Static + proxy: Serve renderer files + forward /api dan /ws
Random port: listen(0) untuk avoid port conflicts
Tray integration: Minimize to tray, not close app
Menu bridge: IPC untuk menu actions ke renderer
7. Cross-Platform Strategy
Electron: Desktop (Windows, macOS, Linux)
Capacitor: Mobile (Android, iOS future)
Conditional logic: Capacitor.isNativePlatform() untuk platform checks
API URL:
Native: Absolute URL ke backend
Desktop/dev: Relative URL via proxy/Vite
8. Error Handling Philosophy
Network errors: TIDAK logout, retry dengan backoff
Auth rejection (401/403): Logout only jika refresh token invalid
Optimistic rollback: Tidak rollback, biarkan pesan stuck (UX tradeoff)
User-facing errors: Informative messages dengan recovery hints
Proposed Solution
High-Level Architecture
Aplikasi menggunakan 3-tier architecture dengan:

Presentation Layer: React components dengan responsive UI
Business Logic Layer: Zustand stores + Service layer
Data Layer: REST API + WebSocket + LiveKit
Core Modules
Module 1: Authentication & User Management
Auth Store mengelola user session dan tokens
Token Scheduler handle proactive refresh
API Interceptor handle reactive refresh (401)
Session revoke saat login baru untuk keamanan
Module 2: Chat & Messaging
Chat Store mengelola conversations dan messages
WebSocket Service handle real-time events
Optimistic UI untuk instant feedback
Message types support text, image, file, audio, system, call
Module 3: Voice & Video Calls
Call Store state machine untuk call phases
Call Service integrate LiveKit SFU
WebSocket signaling untuk call events
Media handling untuk local/remote streams
Module 4: Admin Dashboard
Admin Page untuk user management
Backend guards untuk role-based access
Stats dashboard untuk monitoring
Module 5: Platform-Specific
Electron Main Process:
Local proxy server
System tray
Native menus
Settings persistence
Capacitor Android:
Push notifications (FCM)
File system access
Share functionality
Data Flow Diagrams
Message Sending Flow

User types → Submit
     ↓
Optimistic add (clientMsgId)
     ↓
POST /messages/{convId}
     ↓
Server validates → Broadcast
     ↓
WS event: message_ack
     ↓
Update clientMsgId → server ID+seq
     ↓
Other clients: WS new_message
     ↓
Update their chat store
Call Flow

User clicks Call
     ↓
WS: call_invite
     ↓
Server creates call → Broadcast
     ↓
Caller: call_created → Join room (LiveKit)
     ↓
Callee: call_incoming → Ring
     ↓
Callee accepts → WS: call_answer
     ↓
Server: call_accepted → Both join room
     ↓
LiveKit: Media streams established
     ↓
Active call (mic/cam controls)
     ↓
Hangup → WS: call_end → Cleanup
Token Refresh Flow

Login → Store access + refresh tokens
     ↓
Proactive: Schedule refresh (before expiry)
     ↓
Success → Update tokens → Reconnect WS
     ↓
Fail (network) → Keep token → Retry later
     ↓
Fail (auth) → Logout
     ↓
Reactive: API call → 401
     ↓
Interceptor → Refresh token
     ↓
Success → Retry original request
     ↓
Fail → Logout
Database Schema (Reference)
Berdasarkan SQL dump, struktur database:


Users
├── id (PK)
├── username (unique)
├── displayName
├── email
├── password (hashed)
├── avatarKey
├── status (AVAILABLE, AWAY, DND, OFFLINE)
├── accountType (USER, ADMIN, AGENT, SUPERVISOR, MODERATOR)
├── isActive
├── firstName, lastName, nickname, phone
├── jobTitle, jobDepartment
└── createdAt, updatedAt, lastSeenAt

Conversations
├── id (PK)
├── type (DIRECT, GROUP)
├── title
├── avatarKey
├── lastMessageAt
└── createdAt, updatedAt

ConversationMembers
├── conversationId (FK)
├── userId (FK)
├── role (OWNER, ADMIN, MEMBER)
├── lastReadSeq
└── joinedAt

Messages
├── id (PK)
├── conversationId (FK)
├── senderId (FK)
├── seq (BigInt, auto-increment per conversation)
├── clientMsgId
├── type (TEXT, IMAGE, FILE, AUDIO, SYSTEM, CALL)
├── body
├── replyToId (FK)
├── editedAt, deletedAt
└── createdAt

Attachments
├── id (PK)
├── messageId (FK)
├── storageKey (MinIO)
├── fileName
├── mimeType
├── size
└── createdAt

Calls
├── id (PK)
├── conversationId (FK)
├── callerId (FK)
├── callType (AUDIO, VIDEO)
├── state (RINGING, ACTIVE, ENDED, MISSED)
├── startedAt, endedAt
└── duration
Task Breakdown
Berdasarkan analisa kode yang ada, berikut adalah **task-Baik, saya sudah mengumpulkan informasi yang cukup. Sekarang saya akan membuat dokumentasi lengkap dengan requirements, desain arsitektur, dan task breakdown.

Dokumentasi Aplikasi BSI Messenger
Problem Statement
BSI Messenger adalah aplikasi komunikasi internal perusahaan yang menyediakan layanan chat real-time, panggilan audio/video, dan manajemen pengguna. Aplikasi ini perlu didokumentasikan secara menyeluruh untuk memudahkan pemeliharaan, pengembangan fitur baru, dan onboarding developer baru.

Requirements
Functional Requirements
1. Authentication & Authorization
 Login dengan username/password
 Token-based authentication (JWT)
 Automatic token refresh (proactive & reactive)
 Session management dengan logout
 Role-based access control (USER, ADMIN, AGENT, SUPERVISOR, MODERATOR)
 Password change functionality
 Persistent session (localStorage)
 Auto-logout pada token invalid/expired
2. User Management
 User profile dengan avatar
 User status (AVAILABLE, AWAY, DND, OFFLINE)
 Profile fields: displayName, firstName, lastName, nickname, phone, jobTitle, jobDepartment
 Avatar upload dan display
 User directory/search untuk memulai chat
 Real-time presence updates via WebSocket
3. Chat/Messaging
 Direct messaging (1-on-1)
 Group chat
 Text messages
 Image attachments dengan preview
 File attachments
 Audio messages
 Message reply/threading
 Message deletion
 Read receipts (last read sequence tracking)
 Typing indicators
 Optimistic UI updates
 Message history pagination
 Real-time message delivery via WebSocket
 Offline message queuing
4. Audio/Video Calls
 Audio-only calls
 Video calls
 Call invite/accept/reject/end
 Mic toggle
 Camera toggle
 LiveKit SFU architecture (bukan P2P)
 ICE candidate exchange via WebSocket
 Call state management (idle, calling, ringing, active, ended)
 Missed call detection
 Connection reconnection handling
5. Admin Features
 User list dengan pagination dan search
 User statistics (total users, active users, messages, conversations)
 Create new user
 Edit user details
 Delete user
 Activate/deactivate user
 Set admin role
 Reset user password
 View user session count dan message count
6. Desktop Application (Electron)
 System tray integration
 Native notifications
 Application menu (File, Edit, View, Window, Help)
 Keyboard shortcuts
 Auto-start on login (configurable)
 Download directory settings
 Window state persistence
 Local HTTP proxy server (menghindari file:// CORS issues)
7. Mobile Application (Android via Capacitor)
 Push notifications (FCM)
 File sharing
 Filesystem access
 Adaptive UI untuk mobile
8. Settings & Preferences
 Notification toggle (enable/disable)
 Notification sound toggle
 Download directory selection (desktop)
 Open at login toggle (desktop)
 Server URL display
 About dialog dengan app info
Non-Functional Requirements
1. Performance
WebSocket connection dengan auto-reconnect
Token refresh 60 detik sebelum expired (proactive)
Reactive refresh pada 401 error
Image lazy loading dengan blob caching
Virtualized message list untuk performance
Optimistic UI untuk responsiveness
2. Security
JWT token stored di localStorage
Authorization header pada setiap API request
HTTPS/WSS untuk production
Token expiry handling
Session revocation on logout
No plaintext passwords in logs/errors
3. Reliability
Offline message queue
WebSocket reconnection dengan exponential backoff
Token refresh retry mechanism
Error boundaries dan error handling
Graceful degradation
4. Scalability
LiveKit SFU untuk scalable video calls
Backend API separation
Stateless frontend architecture
5. Usability
Responsive design (mobile & desktop)
Dark theme UI
Keyboard shortcuts
Native desktop integration
Real-time updates tanpa manual refresh
6. Maintainability
TypeScript untuk type safety
Modular architecture (stores, services, components)
Clear separation of concerns
Consistent code style (ESLint, Prettier)
HMR-safe code (cleanup listeners)
Technology Stack
Frontend
Framework: React 19.2.1
Language: TypeScript 5.9.3
Build Tool: Vite 7.2.6 + Electron Vite 5.0.0
Routing: TanStack Router 1.170.16
State Management: Zustand 5.0.14
Data Fetching: TanStack React Query 5.101.2 + Axios 1.18.1
Styling: TailwindCSS 3.4.19
Icons: Inline SVG (Lucide-style)
Desktop
Runtime: Electron 39.2.6
Packaging: Electron Builder 26.0.12
Local Server: HTTP Proxy 1.18.1
Mobile
Framework: Capacitor 8.4.2
Platform: Android
Push Notifications: Capacitor Push Notifications 8.1.2
Real-time Communication
WebSocket: Native WebSocket API
Video/Audio: LiveKit Client 2.21.0
Development Tools
Linter: ESLint 9.39.1
Formatter: Prettier 3.7.4
Type Checking: TypeScript Compiler
Architecture Overview
mermaid

graph TB
    subgraph "Frontend (React + TypeScript)"
        UI[UI Components]
        Router[TanStack Router]
        Stores[Zustand Stores]
        Services[Services Layer]

        UI --> Router
        UI --> Stores
        Stores --> Services
    end

    subgraph "Electron Main Process"
        Main[Main Process]
        Tray[System Tray]
        Menu[Native Menu]
        Notif[Notifications]
        LocalServer[Local HTTP Server]

        Main --> Tray
        Main --> Menu
        Main --> Notif
        Main --> LocalServer
    end

    subgraph "Backend Services"
        API[REST API]
        WS[WebSocket Server]
        RTC[LiveKit SFU]
        Storage[File Storage]
        DB[(PostgreSQL)]

        API --> DB
        WS --> DB
        RTC -.Media Stream.-> Storage
        API --> Storage
    end

    LocalServer -->|Proxy /api| API
    LocalServer -->|Proxy /ws| WS
    Services -->|HTTP| LocalServer
    Services -->|WebSocket| WS
    Services -->|LiveKit| RTC

    Main -.IPC.-> UI

    style Frontend fill:#2d3748,stroke:#4a5568,color:#fff
    style Electron fill:#1a202c,stroke:#2d3748,color:#fff
    style Backend fill:#1a365d,stroke:#2c5282,color:#fff
Component Architecture
mermaid

graph LR
    subgraph "Application Sections"
        Chats[Chats Section]
        Inbox[Inbox Section]
        Broadcast[Broadcast Section]
        Templates[Templates Section]
        Analytics[Analytics Section]
        Admin[Admin Panel]
    end

    subgraph "Chat Components"
        Sidebar[Chat Sidebar]
        ChatArea[Chat Area]
        ContactInfo[Contact Info Panel]
        NewChat[New Chat Dialog]
    end

    subgraph "Common Components"
        Avatar[Avatar]
        AttachImg[Attachment Image]
        CallOverlay[Call Overlay]
        Dialogs[Various Dialogs]
    end

    Chats --> Sidebar
    Chats --> ChatArea
    Chats --> ContactInfo

    ChatArea --> AttachImg
    ChatArea --> Avatar
    ChatArea --> CallOverlay

    Sidebar --> NewChat
    Sidebar --> Avatar

    style Chats fill:#48bb78,stroke:#38a169,color:#fff
    style Inbox fill:#edf2f7,stroke:#cbd5e0,color:#2d3748
    style Broadcast fill:#edf2f7,stroke:#cbd5e0,color:#2d3748
    style Templates fill:#edf2f7,stroke:#cbd5e0,color:#2d3748
    style Analytics fill:#edf2f7,stroke:#cbd5e0,color:#2d3748
    style Admin fill:#f56565,stroke:#e53e3e,color:#fff
Data Flow Architecture
mermaid

sequenceDiagram
    participant User
    participant UI
    participant Store
    participant Service
    participant API
    participant WS
    participant Backend

    User->>UI: Send Message
    UI->>Store: useChatStore.sendText()
    Store->>Store: Optimistic Update
    Store->>UI: Re-render dengan message baru
    Store->>Service: messagesApi.send()
    Service->>API: POST /messages/:convId
    API->>Backend: HTTP Request
    Backend->>WS: Publish message_ack
    WS->>Store: _onAck()
    Store->>Store: Update message ID & seq
    Store->>UI: Re-render final state

    Backend->>WS: Broadcast new_message
    WS->>Store: _onNewMessage()
    Store->>UI: Update conversation list
Detailed Design
1. State Management (Zustand Stores)
auth.store.ts
Tanggung jawab:

User authentication state
Login/logout operations
Token management
Proactive token refresh scheduling
User profile data
Key State:

typescript

{
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}
Key Actions:

login(username, password) - Session revocation + login baru
logout() - Revoke di server + cleanup lokal
loadMe() - Load user profile (bootstrap)
clearError() - Clear error messages
Integration Points:

WebSocket service (connect/disconnect pada login/logout)
Token scheduler service (proactive refresh)
API service (reactive refresh via interceptor)
Window event listener (bsi:logout untuk forced logout)
chat.store.ts
Tanggung jawab:

Conversation list management
Message history per conversation
Active conversation selection
Send/delete messages
Read receipts tracking
Real-time updates (WebSocket events)
Key State:

typescript

{
  conversations: Conversation[]
  activeId: string | null
  messages: Record<string, Message[]>
  loadingConvos: boolean
  loadingMsgs: boolean
  readCursors: Record<string, string>
}
Key Actions:

loadConversations() - Fetch conversation list
selectConversation(id) - Load messages
sendText(body, replyToId?) - Send text dengan optimistic update
sendImage(file, caption?) - Upload + send dengan local preview
deleteMessage(convId, msgId) - Delete message
markRead(convId, seq) - Send read receipt via WS
WebSocket Event Handlers:

_onNewMessage(msg) - Append message + update conversation preview
_onAck(payload) - Update optimistic message dengan ID server
_onPresence(payload) - Update user status di conversation members
_onReceipt(payload) - Update read cursor partner
call.store.ts
Tanggung jawab:

Call state management (phase, peer info)
Media stream management (local & remote)
Call controls (mic, camera toggle)
LiveKit integration coordination
Key State:

typescript

{
  phase: 'idle' | 'calling' | 'ringing' | 'active' | 'ended'
  callId: string | null
  callType: 'AUDIO' | 'VIDEO' | null
  peer: CallPeer | null
  conversationId: string | null
  localStream: MediaStream | null
  remoteStream: MediaStream | null
  micOn: boolean
  camOn: boolean
  error: string | null
  reconnecting: boolean
}
Key Actions:

startCall(convId, type, peer) - Initiate call
incoming(payload) - Handle incoming call
accept() - Accept incoming call
reject() - Reject incoming call
hangup() - End active call
toggleMic() / toggleCam() - Media controls
Integration Points:

CallService (LiveKit SDK wrapper)
WebSocket service (signaling: call_created, call_incoming, call_accepted, call_ended)
2. Services Layer
api.service.ts
Tanggung jawab:

HTTP client configuration (Axios)
Request/response interceptors
Token injection ke headers
Reactive token refresh (401 interceptor)
API endpoint definitions
Key Features:

Token Injection: Automatic Authorization: Bearer header
Reactive Refresh: Interceptor menangkap 401, refresh token, retry request
Refresh Queue: Queue requests during refresh untuk menghindari race condition
Hard Logout: Logout paksa saat refresh token invalid (401/403)
Network Error Handling: Bedakan network error vs auth rejection
HMR Safe: Cleanup state pada hot reload
API Modules:

authApi - login, logout, refresh, changePassword
usersApi - me, updateMe, uploadAvatar
adminApi - listUsers, stats, activate, deactivate, createUser, updateUser, deleteUser, setPassword
directoryApi - list (user search)
conversationsApi - list, createDm, createGroup
messagesApi - list, send, delete
attachmentsApi - getFile, getAvatar, upload
ws.service.ts
Tanggung jawab:

WebSocket connection management
Event-driven message handling
Auto-reconnect dengan exponential backoff
Ping/pong heartbeat
Offline message queue
Token refresh coordination
Key Features:

Event System: on(event, handler) / off(event, handler) / send(event, payload)
Ping/Pong: 30s ping interval, 70s pong timeout
Reconnect Logic: Exponential backoff (max 30s), pause saat token refresh
Offline Queue: Queue messages saat disconnect, drain saat reconnect
HMR Safe: Cleanup intervals/timeouts pada dispose
Event Types:

connected, new_message, message_ack, typing, presence, pong, receipt, error
Call signaling: call_invite, call_answer, call_reject, call_ice, call_end, call_created, call_incoming, call_accepted, call_rejected, call_ended
call.service.ts
Tanggung jawab:

LiveKit SDK wrapper
Media device access (getUserMedia)
Room connection management
Track subscription/unsubscription
Media controls (toggle mic/cam)
Key Features:

SFU Architecture: Klien <-> LiveKit server (bukan P2P)
Single Remote Stream: Satu MediaStream untuk semua remote tracks (menghindari bug audio/video saling timpa)
Device Permission Handling: Friendly error messages untuk NotAllowedError, NotFoundError, NotReadableError
Callback-based: Service emit events via callbacks ke store
onLocalStream, onRemoteStream, onConnectionState, onPeerJoined, onPeerLeft, onReconnecting, onError
Integration:

Fetch token via API: GET /call/:callId/token
Room connection: room.connect(url, token)
Track publishing: room.localParticipant.publishTrack(track)
Track subscription: Event TrackSubscribed / TrackUnsubscribed
token-scheduler.service.ts
Tanggung jawab:

Proactive token refresh scheduling (60s sebelum expired)
Online/offline detection
System wake detection
Refresh in-flight locking
Key Features:

JWT Decode: Extract expiry dari token payload
Proactive Schedule: Timeout 60s sebelum token expired
Retry on Online: Network reconnect trigger immediate refresh
Retry on Wake: System sleep/wake trigger immediate refresh
isRefreshInFlight Flag: Shared dengan ws.service untuk pause reconnect selama refresh
notification.service.ts
Tanggung jawab:

Desktop notifications (Electron API)
Native platform notifications (Capacitor)
Notification settings (enable/disable, sound)
Message preview dalam notification
Key Features:

Platform Detection: Electron vs Capacitor
Permission Request: Handle permission denied gracefully
Settings Integration: Check NOTIF_ENABLED_KEY dan NOTIF_SOUND_KEY
WebSocket Integration: Listen new_message event
push-android.service.ts
Tanggung jawab:

FCM registration (Android only)
Push token submission ke backend
Push notification handling
Key Features:

Platform Guard: NO-OP di Electron
Permission Request: Android 13+ notification permission
Token Sync: POST /push/register dengan FCM token
3. Component Design
App.tsx (Main Layout)
Struktur:

Top bar: Section menu (hamburger), app title, admin button, user display, logout
Content area: Dynamic section rendering
Modals: NewUserDialog, SettingsDialog, UserProfileDialog, AboutDialog
Section Management:

activeSection state: 'chats' | 'inbox' | 'broadcast' | 'templates' | 'analytics'
Section components: InboxSection, BroadcastSection, TemplatesSection, AnalyticsSection (placeholder empty states)
Responsive Behavior:

Mobile (<md): mobileView state toggle antara 'list' dan 'chat'
Desktop (md+): Side-by-side columns
Window width < 1100px: Auto-hide ContactInfoPanel
Native Menu Integration:

IPC listeners: onNewUser, onSettings, onMyProfile, onAbout, onLogout
Cleanup listeners dengan unsubscribe pada unmount
Chat Section Components
Sidebar.tsx
Tanggung jawab:

Conversation list
Search conversations
New chat button
Settings button
Features:

Avatar dengan status indicator
Last message preview
Timestamp formatting
Unread indicator (belum implemented)
Click handler → selectConversation + switch mobile view
ChatArea.tsx
Tanggung jawab:

Message list (virtualized via react-virtuoso)
Message input dengan file upload
Typing indicators
Reply UI
Message actions (delete)
Features:

Virtualized List: Performance untuk ribuan messages
Message Grouping: Group by sender + timestamp
Attachment Preview: Image inline, file sebagai download link
Reply Threading: Show replied-to message context
Optimistic UI: Message langsung muncul sebelum server response
ContactInfoPanel.tsx
Tanggung jawab:

Show conversation details
Member list untuk group
Partner profile untuk DM
Call buttons (audio/video)
Features:

Avatar display
Member avatars dalam group
Status indicator
Call initiation
CallOverlay.tsx
Tanggung jawab:

Full-screen call UI
Video/audio stream rendering
Call controls
Call state display
Features:

Local video preview (small)
Remote video (full)
Mic/cam toggle buttons
Hangup button
Phase-based UI (calling, ringing, active, ended)
Reconnecting indicator
Admin Components
AdminPage.tsx
Tanggung jawab:

User list dengan pagination
Search users
Statistics dashboard
User management actions
Features:

User Table: Avatar, name, username, email, role, status, actions
Context Menu: Activate, Deactivate, Set Admin, Edit, Delete, Set Password
Create User: Form dialog
Edit User: Form dialog
Stats Cards: Total users, active users, messages, conversations
Common Components
Avatar.tsx
Fetch avatar via attachmentsApi.getAvatar(userId)
Fallback ke initial huruf jika 404
Cleanup blob URL pada unmount
Status indicator dot
AttachmentImage.tsx
Blob caching untuk image attachments
Local blob URL untuk optimistic uploads
Lazy loading dengan error handling
Full-screen modal pada click
ChannelEmptyState.tsx
Generic empty state untuk unimplemented sections
Icon + title + description + CTA button
4. Electron Main Process
index.ts
Tanggung jawab:

Application lifecycle
Window management
System tray
Native menu
Settings persistence
IPC communication
Key Features:

Local Server: Start local-server.ts sebelum window dibuat
Tray Icon: Hide to tray on close (bukan quit)
Application Menu: File, Edit, View, Window, Help
IPC Handlers:
select-download-dir - Dialog folder picker
get-settings / set-settings - Settings CRUD
get-open-at-login / set-open-at-login - OS login item settings
copy-to-clipboard - Clipboard API
show-notification - Native notification
Menu Triggers: Send IPC ke renderer (menu:new-user, menu:logout, dll)
local-server.ts
Tanggung jawab:

HTTP server di 127.0.0.1 (random port)
Serve static renderer files
Proxy /api ke backend
Proxy /ws (upgrade) ke backend WebSocket
Why?

Electron loadURL('file://...') → origin null → CORS masalah
Local server → origin http://127.0.0.1:<port> → same-origin dengan proxy
Proxy membuat /api dan /ws jadi same-origin → CORS tidak relevan
5. Database Schema (PostgreSQL)
Berdasarkan bsichat_backup_20260701_1218.sql:

Tables:

User - id, username, displayName, email, avatarKey, status, accountType, isActive, lastSeenAt, timestamps
Conversation - id, type (DIRECT/GROUP), title, avatarKey, lastMessageAt, timestamps
ConversationMember - userId, conversationId, role (OWNER/ADMIN/MEMBER), lastReadSeq
Message - id, conversationId, senderId, seq (BigInt), clientMsgId, type, body, replyToId, editedAt, deletedAt, timestamps
Attachment - id, messageId, storageKey, fileName, mimeType, size, timestamps
Session - id, userId, refreshToken, expiresAt, lastActiveAt, timestamps
Call - id, conversationId, type (AUDIO/VIDEO), state (RINGING/ACTIVE/ENDED/MISSED), startedAt, endedAt, timestamps
CallParticipant - callId, userId, joinedAt, leftAt
Enums:

AccountType: USER, ADMIN (SQL menunjukkan hanya 2, tapi TypeScript punya AGENT, SUPERVISOR, MODERATOR)
UserStatus: AVAILABLE, AWAY, DND, OFFLINE
ConvType: DIRECT, GROUP
MemberRole: OWNER, ADMIN, MEMBER
MessageType: TEXT, IMAGE, FILE, AUDIO, SYSTEM, CALL
CallType: AUDIO, VIDEO
CallState: RINGING, ACTIVE, ENDED, MISSED
6. API Endpoints
Auth:

POST /auth/login - Body: { username, password } → { user, accessToken, refreshToken }
POST /auth/logout - Revoke session
POST /auth/refresh - Body: { refreshToken } → { accessToken, refreshToken }
POST /auth/change-password - Body: { password } → { ok }
Users:

GET /users/me → { user }
PATCH /users/me - Body: { displayName?, status?, firstName?, lastName?, nickname?, phone?, jobTitle?, jobDepartment? } → { user }
GET /users - Query: ?search=xxx → { users: [...] }
POST /attachments/avatar - Multipart form { avatar: File }
Admin:

GET /admin/users - Query: ?page=1&limit=20&search=xxx → { users: [...], total: N }
GET /admin/stats → { totalUsers, activeUsers, totalMessages, totalConversations, activeSessions }
PATCH /admin/users/:id/activate → { user }
PATCH /admin/users/:id/deactivate → { user }
PATCH /admin/users/:id/set-admin - Body: { isAdmin } → { user }
POST /admin/users - Body: { username, displayName, password, email? } → { user }
PATCH /admin/users/:id - Body: { displayName?, username?, email? } → { user }
DELETE /admin/users/:id → { ok }
PATCH /admin/users/:id/password - Body: { password } → { ok }
Conversations:

GET /conversations → { conversations: [...] }
POST /conversations/dm - Body: { targetUserId } → { conversation }
POST /conversations/group - Body: { title, memberIds } → { conversation }
Messages:

GET /messages/:convId - Query: ?before=seq → { messages: [...] }
POST /messages/:convId - Body: { content, clientMsgId, type?, attachments?, replyToId? } → { message }
DELETE /messages/:convId/:msgId → { ok }
Attachments:

GET /attachments/file/:attachmentId → Blob (stream)
GET /attachments/avatar/:userId → Blob (stream) atau 404
POST /attachments/upload/:convId - Multipart form { file: File } → { storageKey, fileName, mimeType, sizeBytes, width?, height? }
Call:

GET /call/:callId/token → { url, token, room }
Push:

POST /push/register - Body: { token, platform } → { ok }
7. WebSocket Events
Client → Server:

ping - Heartbeat
typing - { conversationId, typing: boolean }
read - { conversationId, seq }
call_invite - { conversationId, callType, sdp }
call_answer - { callId, sdp }
call_reject - { callId }
call_ice - { callId, candidate }
call_end - { callId }
Server → Client:

connected - Connection established
pong - Heartbeat response
new_message - Message object
message_ack - { clientMsgId, id, seq, conversationId }
typing - { userId, displayName, typing }
presence - { userId, status }
receipt - { userId, seq, conversationId }
error - { message }
Call signaling:
call_created - { callId, conversationId, callType }
call_incoming - { callId, conversationId, callType, sdp, from: { id, displayName } }
call_accepted - { callId, sdp, by: { id, displayName } }
call_rejected - { callId, by: { id, displayName } }
call_ended - { callId, by: { id, displayName } }
call_ice - { callId, candidate }
Proposed Solution
Aplikasi sudah fully functional dengan arsitektur yang solid. Dokumentasi ini menyediakan:

Arsitektur Overview - High-level system design
Component Catalog - Inventarisasi semua komponen dengan tanggung jawabnya
Data Flow - Bagaimana data mengalir dari UI → Store → Service → Backend
Integration Points - Bagaimana setiap layer berinteraksi
API Contract - Semua endpoint dan WebSocket events
Database Schema - Model data di backend
Task Breakdown
Berikut adalah task-task untuk mendokumentasikan aplikasi secara lengkap dalam bentuk file dokumentasi yang terstruktur:

Task 1: Create Architecture Documentation
Objective: Membuat dokumen arsitektur sistem lengkap

Implementation Guidance:

Buat file 
ARCHITECTURE.md
Include mermaid diagrams untuk:
System architecture overview
Component hierarchy
Data flow sequences
State management flow
Dokumentasikan technology stack dengan justifikasi pemilihan
Jelaskan pattern dan principles yang digunakan (separation of concerns, event-driven, optimistic UI)
Demo: File 
ARCHITECTURE.md
 berisi diagram dan penjelasan arsitektur yang mudah dipahami oleh developer baru

Task 2: Create API Documentation
Objective: Dokumentasikan semua REST API endpoints dan WebSocket events

Implementation Guidance:

Buat file 
API.md
Format setiap endpoint dengan:
Method + Path
Headers required
Request body schema (TypeScript interface)
Response schema
Example curl command
Error responses
Dokumentasikan WebSocket events dengan format yang sama
Group endpoints by domain (Auth, Users, Admin, Conversations, Messages, Attachments, Call, Push)
Demo: File 
API.md
 yang bisa digunakan sebagai API reference manual

Task 3: Create Component Documentation
Objective: Katalog semua React components dengan props, state, dan usage examples

Implementation Guidance:

Buat file 
COMPONENTS.md
Untuk setiap component, dokumentasikan:
Purpose/responsibility
Props interface
Internal state
Key methods/callbacks
Dependencies (stores, services)
Usage example code
Group components by category (Layout, Chat, Admin, Common, Auth, Settings, Users)
Include screenshot atau wireframe jika memungkinkan
Demo: File 
COMPONENTS.md
 sebagai reference guide untuk menggunakan atau memodifikasi komponen

Task 4: Create State Management Documentation
Objective: Dokumentasikan semua Zustand stores dan state flow

Implementation Guidance:

Buat file `docs/STATE_MANAGEMENT.md
Est. Credits Used: 2.28
Elapsed time: 5m 1s


Checkpoint
Restore
llanjutkan

Kiro
Baik, saya lanjutkan task breakdown-nya:

Task 4: Create State Management Documentation
Objective: Dokumentasikan semua Zustand stores dan state flow

Implementation Guidance:

Buat file 
STATE_MANAGEMENT.md
Dokumentasikan setiap store:
auth.store.ts: State schema, actions, side effects, integration dengan token scheduler
chat.store.ts: State schema, actions, WebSocket event handlers, optimistic update pattern
call.store.ts: State machine diagram, transitions, LiveKit integration
Jelaskan state synchronization antara stores
Dokumentasikan kapan menggunakan local state vs Zustand vs React Query
Include sequence diagrams untuk complex flows (login flow, message send flow, call flow)
Demo: File 
STATE_MANAGEMENT.md
 yang menjelaskan cara state dikelola dan flow data dalam aplikasi

Task 5: Create Service Layer Documentation
Objective: Dokumentasikan semua services dan utility functions

Implementation Guidance:

Buat file 
SERVICES.md
Dokumentasikan setiap service:
api.service.ts: HTTP client, interceptors, error handling, API modules
ws.service.ts: Connection management, event system, reconnection logic
call.service.ts: LiveKit integration, media handling, callbacks
token-scheduler.service.ts: Proactive refresh logic, online/wake detection
notification.service.ts: Platform-specific notification handling
push-android.service.ts: FCM integration
Include best practices untuk menggunakan services
Dokumentasikan error handling patterns
Demo: File 
SERVICES.md
 sebagai reference untuk service layer architecture

Task 6: Create Database Schema Documentation
Objective: Dokumentasikan database schema dengan relationships dan constraints

Implementation Guidance:

Buat file 
DATABASE.md
Generate ERD (Entity Relationship Diagram) menggunakan mermaid
Dokumentasikan setiap tabel:
Columns dengan types
Primary keys, foreign keys
Indexes
Constraints
Business rules
Dokumentasikan enums dan custom types
Include sample queries untuk common operations
Demo: File 
DATABASE.md
 dengan ERD dan schema reference lengkap

Task 7: Create Electron/Desktop Documentation
Objective: Dokumentasikan Electron-specific features dan main process architecture

Implementation Guidance:

Buat file 
ELECTRON.md
Dokumentasikan:
Main process architecture (
index.ts
)
Local proxy server (
local-server.ts
) - purpose dan implementation
IPC communication patterns
System tray integration
Native menu structure
Settings persistence mechanism
Window state management
Notification system
Include build dan packaging instructions
Dokumentasikan platform-specific considerations (Windows, macOS, Linux)
Demo: File 
ELECTRON.md
 sebagai guide untuk desktop-specific development

Task 8: Create Mobile/Capacitor Documentation
Objective: Dokumentasikan mobile-specific features dan Capacitor integration

Implementation Guidance:

Buat file 
MOBILE.md
Dokumentasikan:
Capacitor configuration (capacitor.config.ts)
Android-specific setup
Push notifications (FCM) implementation
File system access
Share functionality
Platform detection patterns
Include build instructions untuk Android
Dokumentasikan responsive UI considerations untuk mobile
Known limitations atau platform differences
Demo: File 
MOBILE.md
 sebagai guide untuk mobile development

Task 9: Create Authentication & Security Documentation
Objective: Dokumentasikan authentication flow dan security measures

Implementation Guidance:

Buat file 
AUTHENTICATION.md
Dokumentasikan:
Complete authentication flow (login → token storage → API calls → refresh → logout)
Token lifecycle: proactive vs reactive refresh
Session management
Security best practices yang diimplementasikan
Error scenarios dan handling
Include sequence diagrams untuk:
Login flow
Proactive refresh flow
Reactive refresh flow (401 interceptor)
Logout flow
Forced logout (token invalid)
Dokumentasikan WebSocket authentication (token in query param)
Demo: File 
AUTHENTICATION.md
 dengan complete security documentation

Task 10: Create Real-time Communication Documentation
Objective: Dokumentasikan WebSocket dan LiveKit implementation details

Implementation Guidance:

Buat file 
REALTIME.md
Dokumentasikan WebSocket:
Connection lifecycle
Event types dan payload schemas
Reconnection strategy
Heartbeat mechanism
Offline queue
Integration dengan stores
Dokumentasikan LiveKit (Audio/Video Calls):
SFU architecture vs P2P
Call signaling flow via WebSocket
Media track management
Connection quality handling
Error scenarios
Include sequence diagrams untuk call flow (outgoing & incoming)
Demo: File 
REALTIME.md
 yang menjelaskan real-time communication mechanisms

Task 11: Create Developer Setup Guide
Objective: Membuat comprehensive setup guide untuk developer baru

Implementation Guidance:

Buat file 
SETUP.md
Include:
Prerequisites (Node.js version, tools)
Installation steps
Environment configuration
Backend setup instructions (URL, credentials)
Running development server
Running tests (jika ada)
Building untuk production (Windows, macOS, Linux, Android)
Troubleshooting common issues
IDE setup recommendations (VSCode extensions, settings)
Demo: File 
SETUP.md
 yang memungkinkan developer baru setup environment dalam 30 menit

Task 12: Create Coding Guidelines & Best Practices
Objective: Dokumentasikan coding standards dan best practices yang digunakan

Implementation Guidance:

Buat file 
CODING_GUIDELINES.md
Dokumentasikan:
TypeScript conventions (interfaces vs types, naming)
Component patterns (functional components, hooks usage)
State management guidelines (kapan pakai local state, Zustand, React Query)
Error handling patterns
Async/await best practices
HMR-safe code patterns (cleanup listeners)
File naming conventions
Import/export patterns
Comment guidelines
Git commit message conventions
Include code examples (good vs bad)
Demo: File 
CODING_GUIDELINES.md
 sebagai reference untuk maintaining code quality

Task 13: Create Feature Implementation Guide
Objective: Dokumentasikan cara menambahkan fitur baru ke aplikasi

Implementation Guidance:

Buat file 
ADDING_FEATURES.md
Dokumentasikan step-by-step:
Adding new API endpoint
Adding new WebSocket event
Adding new store
Adding new component
Adding new route
Adding new Electron IPC handler
Adding new database table (referensi backend)
Include decision trees (kapan butuh store baru, kapan cukup local state, dll)
Template boilerplate code untuk common tasks
Demo: File 
ADDING_FEATURES.md
 yang memudahkan developer menambah fitur baru secara konsisten

Task 14: Create TypeScript Types Documentation
Objective: Dokumentasikan semua TypeScript interfaces dan types

Implementation Guidance:

Buat file 
TYPES.md
Dokumentasikan types dari 
index.ts
:
User types (User, UserStatus, AccountType)
Message types (Message, MessageType, Attachment)
Conversation types (Conversation, ConvType, ConversationMember)
WebSocket types (WsEvent, WsEventType, payloads)
Call types (CallType, CallState, CallPeer)
Include relationship diagram antara types
Dokumentasikan type guards atau utility types (jika ada)
Demo: File 
TYPES.md
 sebagai reference untuk TypeScript type system

Task 15: Create Deployment Documentation
Objective: Dokumentasikan deployment process untuk production

Implementation Guidance:

Buat file 
DEPLOYMENT.md
Dokumentasikan:
Build process untuk setiap platform
Electron Builder configuration
Code signing (Windows, macOS)
Auto-update setup (jika ada)
Android APK/AAB generation
Release checklist
Version bumping strategy
Backend deployment requirements
Environment variables configuration
Include CI/CD recommendations
Demo: File 
DEPLOYMENT.md
 dengan complete deployment runbook

Task 16: Create Troubleshooting Guide
Objective: Dokumentasikan common issues dan solutions

Implementation Guidance:

Buat file 
TROUBLESHOOTING.md
Dokumentasikan common issues:
Connection issues (WebSocket, API)
Authentication failures
Token refresh loops
Call connection failures
Media device permissions
Notification issues
Build errors
Platform-specific issues
Include diagnostic steps dan log interpretation
Known bugs/limitations dengan workarounds
Demo: File 
TROUBLESHOOTING.md
 sebagai first reference saat ada masalah

Task 17: Create Performance Optimization Documentation
Objective: Dokumentasikan optimization strategies yang digunakan

Implementation Guidance:

Buat file 
PERFORMANCE.md
Dokumentasikan:
React optimization (React.memo, useMemo, useCallback)
List virtualization (react-virtuoso)
Image optimization (lazy loading, blob caching)
WebSocket optimization (event batching, throttling)
Bundle optimization (code splitting, lazy imports)
React Query caching strategy
Performance monitoring recommendations
Include performance benchmarks atau metrics
Demo: File 
PERFORMANCE.md
 dengan optimization guidelines

Task 18: Create Testing Strategy Documentation
Objective: Dokumentasikan testing approach (jika ada tests, atau roadmap jika belum ada)

Implementation Guidance:

Buat file 
TESTING.md
Dokumentasikan:
Testing philosophy
Unit testing guidelines
Integration testing approach
E2E testing strategy
Testing tools (Jest, React Testing Library, Playwright)
Mock patterns (API, WebSocket, Electron APIs)
Test coverage goals
CI/CD integration
Jika belum ada tests, buat roadmap dan recommendations
Demo: File 
TESTING.md
 sebagai testing strategy reference

Task 19: Create Roadmap & Future Features Documentation
Objective: Dokumentasikan planned features dan technical debt

Implementation Guidance:

Buat file 
ROADMAP.md
Dokumentasikan:
Placeholder features (Inbox, Broadcast, Templates, Analytics) - requirements dan technical approach
Known technical debt (TODO comments di code)
Performance improvements planned
Security enhancements planned
Scalability considerations
Breaking changes yang akan datang
Prioritize features (High, Medium, Low)
Estimate effort untuk major items
Demo: File 
ROADMAP.md
 dengan product dan technical roadmap

Task 20: Create Main README Update
Objective: Update main README.md dengan links ke semua dokumentasi

Implementation Guidance:

Update README.md di root
Include:
Project overview dan purpose
Quick start guide
Technology stack summary
Documentation index dengan links ke semua docs
Contribution guidelines
License information
Contact/support information
Tambahkan badges (jika ada CI/CD, test coverage, dll)
Demo: README.md yang professional dan comprehensive sebagai entry point dokumentasi

Task 21: Create Visual Documentation
Objective: Membuat visual assets untuk dokumentasi

Implementation Guidance:

Buat folder docs/images/ atau docs/diagrams/
Generate atau capture:
Application screenshots (main screens)
UI flow diagrams
System architecture diagrams (export dari mermaid)
Component hierarchy tree
Data flow diagrams
Embed images ke dokumentasi yang relevan
Ensure consistency dalam style diagram
Demo: Dokumentasi dengan visual aids yang memudahkan pemahaman

Task 22: Create Configuration Reference
Objective: Dokumentasikan semua configuration files

Implementation Guidance:

Buat file 
CONFIGURATION.md
Dokumentasikan:
package.json - scripts, dependencies explanation
tsconfig.json, tsconfig.web.json, tsconfig.node.json - compiler options
electron.vite.config.ts - build configuration
electron-builder.yml - packaging configuration
capacitor.config.ts - mobile configuration
tailwind.config.js - styling configuration
eslint.config.mjs - linting rules
.prettierrc.yaml - formatting rules

constants.ts
 - app constants
Include when dan why to modify each config
Demo: File 
CONFIGURATION.md
 sebagai configuration reference

Task 23: Create Glossary & Terminology
Objective: Definisikan semua terms dan acronyms yang digunakan

Implementation Guidance:

Buat file 
GLOSSARY.md
Definisikan:
Domain terms (conversation, message, attachment, call, presence, receipt, etc)
Technical terms (optimistic UI, SFU, P2P, HMR, proactive/reactive refresh, etc)
Acronyms (WS, FCM, JWT, IPC, etc)
Backend-specific terms (seq, clientMsgId, storageKey, etc)
Alphabetical order
Cross-reference dengan relevant documentation
Demo: File 
GLOSSARY.md
 untuk quick reference istilah teknis

Task 24: Create Change Log Template
Objective: Setup changelog structure untuk tracking changes

Implementation Guidance:

Buat file CHANGELOG.md di root
Setup structure berdasarkan Keep a Changelog
Categories: Added, Changed, Deprecated, Removed, Fixed, Security
Include version 1.0.0 dengan fitur-fitur yang sudah ada
Template untuk future versions
Demo: CHANGELOG.md dengan version history yang terstruktur

Task 25: Create Documentation Index & Navigation
Objective: Membuat central index untuk mudah navigasi semua dokumentasi

Implementation Guidance:

Buat file 
INDEX.md
 atau update 
README.md
Organize documentation by category:
Getting Started: SETUP.md, ARCHITECTURE.md
Development: CODING_GUIDELINES.md, ADDING_FEATURES.md, TESTING.md
Architecture & Design: STATE_MANAGEMENT.md, SERVICES.md, COMPONENTS.md, DATABASE.md
Platform-Specific: ELECTRON.md, MOBILE.md
Security: AUTHENTICATION.md
Real-time Features: REALTIME.md
Reference: API.md, TYPES.md, CONFIGURATION.md, GLOSSARY.md
Operations: DEPLOYMENT.md, TROUBLESHOOTING.md, PERFORMANCE.md
Planning: ROADMAP.md, CHANGELOG.md
Include quick links untuk common tasks
Add search tips atau documentation conventions
Demo: Central documentation hub yang mudah dinavigasi

Summary
Total 25 tasks untuk dokumentasi lengkap aplikasi BSI Messenger, organized sebagai berikut:

Phase 1: Core Documentation (Tasks 1-6)

Architecture, API, Components, State Management, Services, Database
Phase 2: Platform-Specific (Tasks 7-8)

Electron/Desktop, Mobile/Capacitor
Phase 3: Deep Dives (Tasks 9-10)

Authentication & Security, Real-time Communication
Phase 4: Developer Experience (Tasks 11-13)

Setup Guide, Coding Guidelines, Feature Implementation Guide
Phase 5: Reference Documentation (Tasks 14-15)

TypeScript Types, Deployment
Phase 6: Operational Documentation (Tasks 16-18)

Troubleshooting, Performance, Testing
Phase 7: Planning & Metadata (Tasks 19-20)

Roadmap, README Update
Phase 8: Polish (Tasks 21-25)

Visual Documentation, Configuration Reference, Glossary, Changelog, Documentation Index
Setiap task menghasilkan deliverable berupa file markdown yang dapat langsung digunakan oleh team development.

Apakah plan dokumentasi ini sudah sesuai, atau ada yang ingin Anda adjust?

Est. Credits Used: 0.84
Elapsed time: 1m 10s


Checkpoint
Restore
sudah sesuai

Kiro
Sempurna! Saya akan merangkum seluruh plan dokumentasi yang sudah kita buat. Apakah Anda ingin saya proceed untuk hand off plan ini ke execution agent?

Berikut ringkasan lengkap yang akan saya pass:

Implementation Plan - BSI Messenger Documentation
Problem Statement:
BSI Messenger adalah aplikasi komunikasi internal perusahaan yang sudah fully functional (Electron desktop + Capacitor Android) dengan fitur chat real-time, audio/video calls, dan admin panel. Aplikasi perlu dokumentasi lengkap untuk memudahkan maintenance, development, dan onboarding developer baru.

Requirements:
Dokumentasi arsitektur sistem (high-level + detail)
API reference lengkap (REST + WebSocket)
Component catalog dengan usage guide
State management documentation
Service layer documentation
Database schema reference
Platform-specific guides (Electron & Mobile)
Authentication & security documentation
Real-time communication guide
Developer setup guide
Coding guidelines & best practices
Feature implementation guide
TypeScript types reference
Deployment documentation
Troubleshooting guide
Performance optimization guide
Testing strategy
Roadmap & technical debt tracking
Configuration reference
Glossary & terminology
Changelog setup
Documentation index & navigation
Background:
Tech Stack:

Frontend: React 19 + TypeScript 5.9 + TailwindCSS 3.4
State: Zustand 5 + TanStack React Query 5
Desktop: Electron 39 + Electron Vite 5
Mobile: Capacitor 8 (Android)
Real-time: WebSocket + LiveKit Client 2.x (SFU)
Build: Vite 7 + Electron Builder 26
Current State:

Aplikasi production-ready dengan fitur core completed
Architecture: 3-tier (Presentation, Business Logic, Data)
Stores: auth.store, chat.store, call.store
Services: api, ws, call, token-scheduler, notification, push-android
Platform: Windows/macOS/Linux desktop + Android mobile
Proposed Solution:
Create comprehensive documentation suite dengan 25 files terorganisir dalam folder docs/, covering semua aspek dari setup hingga deployment.

Task Breakdown:
Task 1: Create Architecture Documentation Create 
ARCHITECTURE.md
 dengan system diagrams, technology stack, component hierarchy, data flow sequences, dan design patterns yang digunakan. Demo: File berisi mermaid diagrams dan penjelasan arsitektur yang mudah dipahami

Task 2: Create API Documentation Create 
API.md
 dengan complete REST endpoint reference dan WebSocket event schemas, including request/response examples dan curl commands. Demo: API reference manual yang comprehensive

Task 3: Create Component Documentation Create 
COMPONENTS.md
 dengan catalog semua React components (props, state, methods, dependencies, usage examples), grouped by category. Demo: Component reference guide

Task 4: Create State Management Documentation Create 
STATE_MANAGEMENT.md
 documenting Zustand stores (schema, actions, event handlers, integration points) dengan sequence diagrams untuk complex flows. Demo: State management guide dengan flow diagrams

Task 5: Create Service Layer Documentation Create 
SERVICES.md
 documenting semua services (api, ws, call, token-scheduler, notification, push-android) dengan architecture dan best practices. Demo: Service layer reference

Task 6: Create Database Schema Documentation Create 
DATABASE.md
 dengan ERD, table schemas, relationships, constraints, dan sample queries. Demo: Database reference dengan ERD

Task 7: Create Electron/Desktop Documentation Create 
ELECTRON.md
 documenting main process architecture, local proxy server, IPC patterns, system tray, native menus, dan platform-specific considerations. Demo: Desktop development guide

Task 8: Create Mobile/Capacitor Documentation Create 
MOBILE.md
 documenting Capacitor configuration, FCM push notifications, file system access, share functionality, dan Android build instructions. Demo: Mobile development guide

Task 9: Create Authentication & Security Documentation Create 
AUTHENTICATION.md
 documenting complete auth flow (login, token lifecycle, proactive/reactive refresh, session management) dengan sequence diagrams. Demo: Security documentation

Task 10: Create Real-time Communication Documentation Create 
REALTIME.md
 documenting WebSocket (connection lifecycle, events, reconnection) dan LiveKit (SFU architecture, call signaling, media handling). Demo: Real-time communication guide

Task 11: Create Developer Setup Guide Create 
SETUP.md
 dengan step-by-step installation, environment configuration, running dev server, building for production, dan troubleshooting. Demo: Setup guide untuk onboarding developer baru dalam 30 menit

Task 12: Create Coding Guidelines & Best Practices Create 
CODING_GUIDELINES.md
 documenting TypeScript conventions, component patterns, state management guidelines, error handling, naming conventions, dengan code examples. Demo: Coding standards reference

Task 13: Create Feature Implementation Guide Create 
ADDING_FEATURES.md
 dengan step-by-step guide untuk adding new endpoints, components, stores, routes, IPC handlers, dan decision trees. Demo: Feature development guide

Task 14: Create TypeScript Types Documentation Create 
TYPES.md
 documenting semua interfaces dan types dari 
index.ts
 dengan relationship diagrams. Demo: TypeScript type system reference

Task 15: Create Deployment Documentation Create 
DEPLOYMENT.md
 documenting build process, Electron Builder config, code signing, Android APK generation, release checklist, dan CI/CD recommendations. Demo: Deployment runbook

Task 16: Create Troubleshooting Guide Create 
TROUBLESHOOTING.md
 documenting common issues (connection, auth, calls, notifications, build errors) dengan diagnostic steps dan solutions. Demo: Troubleshooting reference

Task 17: Create Performance Optimization Documentation Create 
PERFORMANCE.md
 documenting optimization strategies (React optimization, virtualization, caching, bundle optimization) dengan benchmarks. Demo: Performance guidelines

Task 18: Create Testing Strategy Documentation Create 
TESTING.md
 documenting testing philosophy, unit/integration/E2E approaches, mock patterns, coverage goals, dan roadmap jika belum ada tests. Demo: Testing strategy reference

Task 19: Create Roadmap & Future Features Documentation Create 
ROADMAP.md
 documenting planned features (Inbox, Broadcast, Templates, Analytics), technical debt, priorities, dan estimates. Demo: Product dan technical roadmap

Task 20: Create Main README Update Update root README.md dengan project overview, quick start, tech stack summary, documentation index dengan links, dan contribution guidelines. Demo: Professional README sebagai documentation entry point

Task 21: Create Visual Documentation Create docs/images/ atau docs/diagrams/ dengan screenshots, UI flows, architecture diagrams, component hierarchy, embedded ke relevant docs. Demo: Visual aids dalam dokumentasi

Task 22: Create Configuration Reference Create 
CONFIGURATION.md
 documenting semua config files (package.json, tsconfig, vite config, electron-builder, capacitor, tailwind, eslint, prettier, constants). Demo: Configuration reference

Task 23: Create Glossary & Terminology Create 
GLOSSARY.md
 dengan definisi domain terms, technical terms, acronyms, alphabetically ordered dengan cross-references. Demo: Terminology quick reference

Task 24: Create Change Log Template Create root CHANGELOG.md dengan Keep a Changelog structure, version 1.0.0 entry, dan template untuk future versions. Demo: Structured version history

Task 25: Create Documentation Index & Navigation Create 
INDEX.md
 atau update 
README.md
 dengan organized documentation catalog by category, quick links, dan navigation guide. Demo: Central documentation hub