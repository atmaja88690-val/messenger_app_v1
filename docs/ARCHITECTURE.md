# BSI Messenger Architecture Documentation

## Overview

BSI Messenger is a cross-platform communication application built with modern web technologies, supporting real-time messaging, audio/video calls, and comprehensive user management. The application follows a 3-tier architecture with clear separation of concerns.

## System Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        Desktop[Desktop App<br/>Electron 39]
        Mobile[Mobile App<br/>Capacitor 8 Android]
        Browser[Browser<br/>Future Web Support]
    end
    
    subgraph "Presentation Layer"
        React[React 19 + TypeScript 5.9]
        Router[TanStack Router]
        UI[TailwindCSS UI Components]
    end
    
    subgraph "State Management"
        Zustand[Zustand Stores<br/>auth, chat, call]
        ReactQuery[TanStack React Query<br/>Server State Caching]
        LocalState[Component Local State]
    end
    
    subgraph "Business Logic Layer"
        Services[Service Layer]
        API[API Service<br/>HTTP Client]
        WS[WebSocket Service<br/>Real-time Events]
        Call[Call Service<br/>LiveKit Integration]
        Token[Token Scheduler<br/>Proactive Refresh]
        Notif[Notification Service<br/>Push + Desktop]
    end
    
    subgraph "Platform Layer"
        ElectronMain[Electron Main Process<br/>IPC, Tray, Menus]
        LocalProxy[Local HTTP Proxy<br/>Same-Origin Requests]
        CapacitorPlugins[Capacitor Plugins<br/>FCM, FileSystem, Share]
    end
    
    subgraph "Backend Services"
        RestAPI[REST API Server<br/>Express.js]
        WSServer[WebSocket Server<br/>Real-time Events]
        LiveKit[LiveKit SFU Server<br/>Media Streaming]
        Database[(PostgreSQL<br/>User Data + Messages)]
        Storage[(MinIO<br/>File Storage)]
        Redis[(Redis<br/>Sessions + Cache)]
    end
    
    Desktop --> React
    Mobile --> React
    Browser --> React
    
    React --> Router
    React --> UI
    React --> Zustand
    React --> ReactQuery
    React --> LocalState
    
    Zustand --> Services
    ReactQuery --> Services
    Services --> API
    Services --> WS
    Services --> Call
    Services --> Token
    Services --> Notif
    
    Desktop --> ElectronMain
    Desktop --> LocalProxy
    Mobile --> CapacitorPlugins
    
    LocalProxy --> RestAPI
    LocalProxy --> WSServer
    API --> RestAPI
    WS --> WSServer
    Call --> LiveKit
    
    RestAPI --> Database
    RestAPI --> Storage
    WSServer --> Database
    WSServer --> Redis
    LiveKit --> Storage
    
    style Desktop fill:#2d3748,stroke:#4a5568,color:#fff
    style Mobile fill:#2d3748,stroke:#4a5568,color:#fff
    style React fill:#61dafb,stroke:#21d4fd,color:#000
    style Zustand fill:#ff6b35,stroke:#e55100,color:#fff
    style Services fill:#4caf50,stroke:#388e3c,color:#fff
    style Database fill:#336791,stroke:#1e3a8a,color:#fff
```

## Technology Stack

### Frontend Technologies

| Technology | Version | Purpose | Justification |
|------------|---------|---------|---------------|
| React | 19.2.1 | UI Framework | Latest stable with concurrent features, excellent ecosystem |
| TypeScript | 5.9.3 | Type Safety | Compile-time error detection, better developer experience |
| TailwindCSS | 3.4.19 | Styling | Utility-first approach, consistent design system |
| TanStack Router | 1.170.16 | Routing | Type-safe routing with file-based structure |
| TanStack React Query | 5.101.2 | Server State | Caching, background updates, optimistic updates |
| Zustand | 5.0.14 | Client State | Simple, boilerplate-free state management |
| Axios | 1.18.1 | HTTP Client | Request/response interceptors, automatic retries |
| React Virtuoso | 4.18.10 | List Virtualization | Performance for large message lists |

### Desktop Technologies

| Technology | Version | Purpose | Justification |
|------------|---------|---------|---------------|
| Electron | 39.2.6 | Desktop Runtime | Cross-platform native capabilities |
| Electron Vite | 5.0.0 | Build Tool | Fast development, optimized bundling |
| Electron Builder | 26.0.12 | Packaging | Multi-platform distribution |

### Mobile Technologies

| Technology | Version | Purpose | Justification |
|------------|---------|---------|---------------|
| Capacitor | 8.4.2 | Mobile Runtime | Native functionality without complex setup |
| Capacitor Push Notifications | 8.1.2 | Push Notifications | FCM integration for Android |
| Capacitor Filesystem | 8.1.2 | File Access | Download and share attachments |
| Capacitor Share | 8.0.1 | Share API | Share content to other apps |

### Real-time & Media

| Technology | Version | Purpose | Justification |
|------------|---------|---------|---------------|
| WebSocket | Native | Real-time Events | Low-latency bidirectional communication |
| LiveKit Client | 2.21.0 | Audio/Video Calls | SFU architecture, handles NAT traversal |

### Build & Development

| Technology | Version | Purpose | Justification |
|------------|---------|---------|---------------|
| Vite | 7.2.6 | Development Server | Lightning-fast HMR, optimized builds |
| ESLint | 9.39.1 | Code Linting | Code quality, consistent style |
| Prettier | 3.7.4 | Code Formatting | Automated formatting, team consistency |

## Component Architecture

```mermaid
graph TD
    App[App.tsx<br/>Main Layout & Routing]
    
    subgraph "Section Components"
        ChatSection[Chat Section]
        InboxSection[Inbox Section - Placeholder]
        BroadcastSection[Broadcast Section - Placeholder]
        TemplatesSection[Templates Section - Placeholder]
        AnalyticsSection[Analytics Section - Placeholder]
        AdminSection[Admin Section]
    end
    
    subgraph "Chat Components"
        Sidebar[Sidebar<br/>Conversation List]
        ChatArea[ChatArea<br/>Message Display]
        ContactInfo[ContactInfoPanel<br/>User Details]
        NewChat[NewChatDialog<br/>Start Conversation]
        CallOverlay[CallOverlay<br/>Audio/Video UI]
    end
    
    subgraph "Admin Components"
        AdminPage[AdminPage<br/>User Management]
        UserTable[User Table]
        StatsCards[Statistics Dashboard]
        UserDialogs[User CRUD Dialogs]
    end
    
    subgraph "Common Components"
        Avatar[Avatar<br/>User Photos]
        AttachImg[AttachmentImage<br/>Media Preview]
        EmptyState[ChannelEmptyState<br/>Placeholder UI]
        Dialogs[Modal Dialogs<br/>Settings, Profile, About]
    end
    
    subgraph "Auth Components"
        LoginPage[LoginPage<br/>Authentication]
    end
    
    App --> ChatSection
    App --> InboxSection
    App --> BroadcastSection
    App --> TemplatesSection
    App --> AnalyticsSection
    App --> AdminSection
    App --> LoginPage
    
    ChatSection --> Sidebar
    ChatSection --> ChatArea
    ChatSection --> ContactInfo
    ChatSection --> NewChat
    ChatSection --> CallOverlay
    
    AdminSection --> AdminPage
    AdminPage --> UserTable
    AdminPage --> StatsCards
    AdminPage --> UserDialogs
    
    Sidebar --> Avatar
    ChatArea --> Avatar
    ChatArea --> AttachImg
    ContactInfo --> Avatar
    
    InboxSection --> EmptyState
    BroadcastSection --> EmptyState
    TemplatesSection --> EmptyState
    AnalyticsSection --> EmptyState
    
    App --> Dialogs
    
    style App fill:#e53e3e,stroke:#c53030,color:#fff
    style ChatSection fill:#48bb78,stroke:#38a169,color:#fff
    style AdminSection fill:#ed8936,stroke:#dd6b20,color:#fff
    style EmptyState fill:#edf2f7,stroke:#cbd5e0,color:#2d3748
```

## Data Flow Architecture

### Message Sending Flow

```mermaid
sequenceDiagram
    participant User
    participant UI as ChatArea
    participant Store as chat.store
    participant Service as messagesApi
    participant API as Backend API
    participant WS as WebSocket
    participant OtherClients as Other Users
    
    User->>UI: Type & send message
    UI->>Store: sendText(body, replyToId?)
    
    Note over Store: Optimistic Update
    Store->>Store: Add message with clientMsgId
    Store->>UI: Re-render with new message
    
    Store->>Service: messagesApi.send(convId, body, clientMsgId)
    Service->>API: POST /messages/:convId
    API->>API: Validate & store message
    API->>WS: Publish message_ack
    
    WS->>Store: _onAck({clientMsgId, id, seq})
    Store->>Store: Replace clientMsgId with server ID
    Store->>UI: Update message with server data
    
    API->>WS: Broadcast new_message to conversation
    WS->>OtherClients: new_message event
    Note over OtherClients: Update their UI
```

### Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant UI as LoginPage
    participant AuthStore as auth.store
    participant API as authApi
    participant TokenScheduler as token-scheduler
    participant WS as WebSocket
    
    User->>UI: Enter credentials
    UI->>AuthStore: login(username, password)
    
    Note over AuthStore: Session Revocation (if existing)
    AuthStore->>API: authApi.logout() (cleanup old session)
    
    AuthStore->>API: authApi.login(username, password)
    API->>API: Validate credentials
    API-->>AuthStore: {user, accessToken, refreshToken}
    
    AuthStore->>AuthStore: Store tokens in localStorage
    AuthStore->>AuthStore: Set user & isAuthenticated = true
    AuthStore->>WS: wsService.connect()
    AuthStore->>TokenScheduler: scheduleProactiveRefresh()
    
    AuthStore->>UI: Redirect to main app
    
    Note over TokenScheduler: Proactive Refresh (60s before expiry)
    TokenScheduler->>API: authApi.refresh(refreshToken)
    API-->>TokenScheduler: {accessToken, refreshToken}
    TokenScheduler->>WS: Reconnect with new token
```

### Call Flow (Audio/Video)

```mermaid
sequenceDiagram
    participant CallerUI as Caller UI
    participant CallStore as call.store
    participant CallService as call.service
    participant WS as WebSocket
    participant LiveKit as LiveKit SFU
    participant CalleeUI as Callee UI
    
    CallerUI->>CallStore: startCall(convId, callType, peer)
    CallStore->>CallService: startCall()
    CallService->>WS: call_invite event
    
    WS->>CallStore: call_created({callId, callType})
    CallStore->>CallService: onCreated(callId, callType)
    CallService->>CallService: getUserMedia()
    CallService->>LiveKit: Connect to room
    
    WS->>CalleeUI: call_incoming event
    CalleeUI->>CallStore: incoming(payload)
    CallStore->>CallStore: Set phase = 'ringing'
    
    CalleeUI->>CallStore: accept()
    CallStore->>CallService: acceptCall()
    CallService->>LiveKit: Connect to same room
    CallService->>WS: call_answer event
    
    WS->>CallStore: call_accepted event
    CallStore->>CallStore: Set phase = 'active'
    
    LiveKit->>CallService: Track subscribed (remote media)
    CallService->>CallStore: Update remoteStream
    CallStore->>CallerUI: Display remote video/audio
    
    Note over CallerUI,CalleeUI: Active call with media streams
    
    CallerUI->>CallStore: hangup()
    CallStore->>WS: call_end event
    CallService->>LiveKit: Disconnect & cleanup
    WS->>CalleeUI: call_ended event
```

## State Management Pattern

### Store Responsibilities

| Store | Purpose | Key State | Integration Points |
|-------|---------|-----------|-------------------|
| **auth.store** | User session management | user, isAuthenticated, tokens | • API interceptor<br/>• WebSocket connection<br/>• Token scheduler<br/>• Window bsi:logout event |
| **chat.store** | Conversations & messages | conversations, activeId, messages, readCursors | • WebSocket events<br/>• API services<br/>• Optimistic updates |
| **call.store** | Audio/video call state | phase, peer, streams, controls | • CallService callbacks<br/>• WebSocket signaling<br/>• LiveKit events |

### State Synchronization Strategy

```mermaid
graph LR
    subgraph "Server State (React Query)"
        ServerCache[Server Data Cache<br/>• User lists<br/>• Admin stats<br/>• File uploads]
    end
    
    subgraph "Real-time State (Zustand + WebSocket)"
        AuthStore[auth.store<br/>• User session<br/>• Login state]
        ChatStore[chat.store<br/>• Messages<br/>• Conversations<br/>• Presence]
        CallStore[call.store<br/>• Call state<br/>• Media streams]
    end
    
    subgraph "Local UI State"
        ComponentState[React useState<br/>• Form inputs<br/>• Modal visibility<br/>• Loading states]
    end
    
    WebSocket[WebSocket Events] --> ChatStore
    WebSocket --> AuthStore
    WebSocket --> CallStore
    
    APIInterceptor[API Interceptor] --> AuthStore
    TokenScheduler[Token Scheduler] --> AuthStore
    
    ServerCache --> ComponentState
    AuthStore --> ComponentState
    ChatStore --> ComponentState
    CallStore --> ComponentState
    
    style ServerCache fill:#3182ce,stroke:#2c5282,color:#fff
    style AuthStore fill:#e53e3e,stroke:#c53030,color:#fff
    style ChatStore fill:#48bb78,stroke:#38a169,color:#fff
    style CallStore fill:#ed8936,stroke:#dd6b20,color:#fff
    style ComponentState fill:#805ad5,stroke:#6b46c1,color:#fff
```

## Design Patterns & Principles

### 1. Separation of Concerns

**Presentation Layer:** React components handle only UI rendering and user interactions.

**Business Logic Layer:** Zustand stores and service classes contain all business logic.

**Data Layer:** API services abstract backend communication, WebSocket service handles real-time events.

### 2. Event-Driven Architecture

**WebSocket Events:** Real-time updates flow through type-safe event handlers.

**Store Events:** Zustand subscriptions trigger UI re-renders automatically.

**IPC Events:** Electron main process communicates with renderer via IPC events.

### 3. Optimistic UI Pattern

**Message Sending:** Messages appear instantly with clientMsgId, updated when server confirms.

**Image Upload:** Local blob URLs provide immediate preview during upload.

**Call Actions:** UI updates immediately, with error rollback if needed.

### 4. Error Boundaries & Graceful Degradation

**Network Errors:** Maintain offline queue, retry with exponential backoff.

**Auth Errors:** Distinguish network failures from auth rejection for appropriate handling.

**Media Errors:** Provide user-friendly error messages for device permission issues.

### 5. HMR-Safe Architecture

**Service Cleanup:** All services clean up listeners/timers on hot reload.

**Store Persistence:** Critical state survives hot reloads via localStorage.

**Event Handler Management:** Prevent duplicate listeners during development.

## Platform-Specific Architecture

### Electron Desktop

```mermaid
graph TB
    subgraph "Electron Main Process"
        MainJS[main/index.ts<br/>App Lifecycle]
        LocalServer[main/local-server.ts<br/>HTTP Proxy]
        Tray[System Tray]
        Menu[Native Menu]
        IPC[IPC Handlers]
        Settings[Settings Persistence]
    end
    
    subgraph "Electron Renderer Process"
        ReactApp[React Application]
        PreloadScript[Preload Scripts<br/>Secure IPC Bridge]
    end
    
    subgraph "External Services"
        Backend[Backend API<br/>chat.bsilongevity.com]
        WSBackend[WebSocket Server]
    end
    
    MainJS --> LocalServer
    MainJS --> Tray
    MainJS --> Menu
    MainJS --> IPC
    MainJS --> Settings
    MainJS --> ReactApp
    
    ReactApp --> PreloadScript
    PreloadScript --> IPC
    
    LocalServer --> Backend
    LocalServer --> WSBackend
    ReactApp --> LocalServer
    
    Tray -.-> ReactApp
    Menu -.-> ReactApp
```

**Local Proxy Server Benefits:**
- **Same-Origin Policy:** Avoids CORS issues by making all requests appear same-origin
- **File Protocol Issues:** Eliminates `file://` protocol limitations
- **Transparent Proxy:** No code changes needed between dev and production

### Capacitor Android

```mermaid
graph TB
    subgraph "Android Native Layer"
        MainActivity[MainActivity.java<br/>Capacitor Bridge]
        FCMService[FCM Push Service]
        FileSystem[Native File System]
        ShareAPI[Native Share API]
    end
    
    subgraph "Capacitor WebView"
        ReactApp[React Application]
        CapacitorPlugins[Capacitor Plugins<br/>JS Bridge]
    end
    
    subgraph "External Services"
        Backend[Backend API<br/>HTTPS Direct]
        WSBackend[WebSocket Server<br/>WSS Direct]
        FCMServer[Firebase Cloud Messaging]
    end
    
    MainActivity --> ReactApp
    ReactApp --> CapacitorPlugins
    CapacitorPlugins --> FCMService
    CapacitorPlugins --> FileSystem
    CapacitorPlugins --> ShareAPI
    
    ReactApp --> Backend
    ReactApp --> WSBackend
    FCMServer --> FCMService
    
    style MainActivity fill:#3ddc84,stroke:#0f9d58,color:#fff
    style ReactApp fill:#61dafb,stroke:#21d4fd,color:#000
    style Backend fill:#ff6b35,stroke:#e55100,color:#fff
```

**Platform Detection Pattern:**
```typescript
import { Capacitor } from '@capacitor/core'

const IS_NATIVE = Capacitor.isNativePlatform()
const API_URL = IS_NATIVE ? 'https://chat.bsilongevity.com:4443/api' : '/api'
const WS_URL = IS_NATIVE ? 'wss://chat.bsilongevity.com:4443/ws' : `ws://${location.host}/ws`
```

## Security Architecture

### Token Management

**Access Token:** Short-lived JWT (typically 15-30 minutes)
**Refresh Token:** Long-lived token for obtaining new access tokens
**Proactive Refresh:** Automatic renewal 60 seconds before expiry
**Reactive Refresh:** 401 interceptor handles expired tokens gracefully

### WebSocket Security

**Token Authentication:** Token passed via query parameter on connection
**Origin Validation:** Server validates request origin
**Rate Limiting:** Server-side protection against spam/abuse

### Data Security

**Local Storage:** Tokens stored securely in browser localStorage
**Transport Security:** HTTPS/WSS only in production
**Input Validation:** All user inputs validated on both client and server

## Performance Optimizations

### React Performance

**React.memo:** Prevent unnecessary re-renders of expensive components
**useMemo/useCallback:** Memoize expensive calculations and callback functions
**Component Lazy Loading:** Split code and load components on demand

### List Virtualization

**React Virtuoso:** Handle thousands of messages/conversations efficiently
**Dynamic Heights:** Support variable message heights with attachments
**Smooth Scrolling:** Maintain scroll position during real-time updates

### Network Performance

**React Query Caching:** 30-second stale time, background refetch
**Image Optimization:** Lazy loading, blob URL caching with cleanup
**WebSocket Optimization:** Batch events, throttle typing indicators
**Bundle Splitting:** Separate vendor chunks, route-based code splitting

### Real-time Performance

**Optimistic Updates:** Instant UI feedback before server confirmation
**Event Debouncing:** Limit typing indicator frequency
**Connection Pooling:** Reuse WebSocket connection across components
**Offline Queue:** Store messages when disconnected, send when reconnected

## Scalability Considerations

### Frontend Scalability

**Modular Architecture:** Easy to add new sections/features
**Component Composition:** Reusable components reduce duplication
**Service Layer:** Abstract backend changes from UI components
**Type Safety:** TypeScript prevents runtime errors as codebase grows

### Real-time Scalability

**LiveKit SFU:** Scales better than P2P for video calls (handles NAT/firewall)
**WebSocket Events:** Efficient binary protocol for high-frequency updates
**State Normalization:** Flat state structure for efficient updates

### Platform Scalability

**Cross-Platform Code:** 95%+ code sharing between desktop and mobile
**Platform Abstraction:** Clean separation of platform-specific code
**Progressive Enhancement:** Graceful degradation when features unavailable

## Development Workflow

### Hot Module Replacement (HMR)

**Vite Integration:** Lightning-fast updates during development
**State Preservation:** Zustand stores maintain state across reloads
**Service Cleanup:** Prevent memory leaks from duplicate listeners
**Error Recovery:** Graceful error boundaries with retry mechanisms

### Build Process

**Development:** `npm run dev` - Electron + Vite dev server
**Production Desktop:** `npm run build:win|mac|linux` - Electron Builder
**Production Mobile:** Capacitor sync + Android Studio build
**Type Checking:** Separate processes for main/renderer TypeScript

---

*This architecture documentation serves as the foundation for understanding BSI Messenger's design decisions, patterns, and technical implementation. For specific implementation details, refer to the other documentation files in this suite.*