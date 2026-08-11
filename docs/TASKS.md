# Development Task Checklist
## BSI Messenger - AI Agent Build Guide

**Version:** 1.0.0 | **Updated:** Aug 10, 2026  
**Purpose:** Complete task checklist for building BSI Messenger

**Legend:** ✅ DONE | 🚧 IN PROGRESS | ⏳ PENDING | ❌ BLOCKED

---

## PHASE 1: PROJECT SETUP (Est: 4 hours)

### 1.1 Initialize Project [Critical]
- [ ] Create Git repo + npm project + `.gitignore`
- [ ] Install: React 19, TypeScript 5.9, Vite 6, TailwindCSS 4
- [ ] Configure TypeScript (strict mode, path aliases)
- [ ] Set up Vite config (React plugin, aliases, proxy)
- [ ] Configure TailwindCSS + PostCSS
- [ ] Set up ESLint + Prettier
- [ ] Verify `npm run dev` works

**Docs:** [SETUP.md](./SETUP.md) | **Time:** 2h

### 1.2 Project Structure [Critical]
- [ ] Create folder structure: `src/renderer/src/` for React app
- [ ] Create folder: `src/main/` for Electron (later)
- [ ] Create: `components/`, `pages/`, `services/`, `stores/`, `types/`, `styles/`
- [ ] Create `src/renderer/src/types/index.ts` (define all TypeScript types)
- [ ] Create `src/renderer/src/config/index.ts` (API URLs, constants)
- [ ] Create `src/renderer/src/styles/globals.css` (TailwindCSS imports)

**Docs:** [ARCHITECTURE.md](./ARCHITECTURE.md) | **Time:** 1h

### 1.3 Additional Dependencies [High]
- [ ] Install state management: `zustand@5`
- [ ] Install routing: `@tanstack/react-router@1`
- [ ] Install data fetching: `@tanstack/react-query@5`
- [ ] Install HTTP client: `axios@1`
- [ ] Install UI utilities: `clsx`, `tailwind-merge`, `lucide-react`
- [ ] Install date utilities: `date-fns`

**Docs:** [SERVICES.md](./SERVICES.md), [STATE_MANAGEMENT.md](./STATE_MANAGEMENT.md) | **Time:** 30min

---

## PHASE 2: CORE TYPES & SERVICES (Est: 3 hours)

### 2.1 Define TypeScript Types [Critical]
- [ ] `User` type (id, username, displayName, email, avatarKey, status, accountType)
- [ ] `Message` type (id, conversationId, senderId, type, body, attachments, seq)
- [ ] `Conversation` type (id, type, title, members, lastMessage, lastReadSeq)
- [ ] `Attachment` type (id, messageId, storageKey, fileName, mimeType, size)
- [ ] `WsEvent` types (new_message, message_ack, typing, presence, call_*)
- [ ] Auth types (LoginResponse, AuthTokens)

**Docs:** [TYPES.md](./TYPES.md) | **Time:** 1h

### 2.2 Create API Service [Critical]
- [ ] Create `src/renderer/src/services/api.service.ts`
- [ ] Initialize Axios instance with baseURL, withCredentials
- [ ] Add response interceptor for 401 errors (logout)
- [ ] Export `api` object

**Docs:** [SERVICES.md](./SERVICES.md#api-service) | **Time:** 30min

### 2.3 Create Auth Service [Critical]
- [ ] Create `src/renderer/src/services/auth.service.ts`
- [ ] Implement `login(email, password)`
- [ ] Implement `register(email, password, displayName)`
- [ ] Implement `logout()`
- [ ] Implement `getCurrentUser()`

**Docs:** [AUTHENTICATION.md](./AUTHENTICATION.md) | **Time:** 45min

### 2.4 Create WebSocket Service [Critical]
- [ ] Create `src/renderer/src/services/websocket.service.ts`
- [ ] Implement `connect(userId)` with auto-reconnect
- [ ] Implement `disconnect()`
- [ ] Implement `send(type, data)`
- [ ] Handle incoming messages (new_message, message_ack, typing, presence)
- [ ] Implement heartbeat (ping/pong every 30s)

**Docs:** [REALTIME.md](./REALTIME.md) | **Time:** 1h

---

## PHASE 3: STATE MANAGEMENT (Est: 3 hours)

### 3.1 Auth Store [Critical]
- [ ] Create `src/renderer/src/stores/auth.store.ts`
- [ ] State: `user`, `isAuthenticated`, `isLoading`
- [ ] Actions: `setUser`, `clearUser`, `setLoading`
- [ ] Persist user in localStorage (Zustand persist middleware)

**Docs:** [STATE_MANAGEMENT.md](./STATE_MANAGEMENT.md#auth-store) | **Time:** 30min

### 3.2 Messages Store [Critical]
- [ ] Create `src/renderer/src/stores/messages.store.ts`
- [ ] State: `messages: Record<conversationId, Message[]>`
- [ ] Actions: `addMessage`, `updateMessage`, `removeMessage`, `setMessages`
- [ ] Limit messages per conversation (max 100, ring buffer)

**Docs:** [STATE_MANAGEMENT.md](./STATE_MANAGEMENT.md#messages-store) | **Time:** 45min

### 3.3 Conversations Store [Critical]
- [ ] Create `src/renderer/src/stores/conversations.store.ts`
- [ ] State: `conversations: Conversation[]`, `activeConversationId`
- [ ] Actions: `setConversations`, `addConversation`, `updateConversation`, `setActive`
- [ ] Computed: `activeConversation`, `sortedConversations` (by lastMessageAt)

**Docs:** [STATE_MANAGEMENT.md](./STATE_MANAGEMENT.md#conversations-store) | **Time:** 45min

### 3.4 Presence Store [High]
- [ ] Create `src/renderer/src/stores/presence.store.ts`
- [ ] State: `statuses: Record<userId, UserStatus>`, `typing: Record<convId, Set<userId>>`
- [ ] Actions: `updatePresence`, `setTyping`

**Docs:** [STATE_MANAGEMENT.md](./STATE_MANAGEMENT.md) | **Time:** 30min

---

## PHASE 4: UI COMPONENTS (Est: 8 hours)

### 4.1 Auth Pages [Critical]
- [ ] Create `src/renderer/src/pages/LoginPage.tsx`
  - Email input, password input, login button
  - Call `authService.login()`, store user, redirect to /chat
- [ ] Create `src/renderer/src/pages/RegisterPage.tsx`
  - Email, password, displayName inputs, register button
- [ ] Style with TailwindCSS

**Docs:** [AUTHENTICATION.md](./AUTHENTICATION.md), [DESIGN.md](./DESIGN.md) | **Time:** 1.5h

### 4.2 Layout Components [High]
- [ ] Create `src/renderer/src/components/Sidebar.tsx` (desktop only)
  - User profile section, status dropdown, new chat button
- [ ] Create `src/renderer/src/components/ConversationList.tsx`
  - Search input, conversation items, sorted by lastMessageAt
- [ ] Create `src/renderer/src/components/ConversationItem.tsx`
  - Avatar, name, last message preview, timestamp, unread badge

**Docs:** [COMPONENTS.md](./COMPONENTS.md), [DESIGN.md](./DESIGN.md) | **Time:** 2h

### 4.3 Chat Components [Critical]
- [ ] Create `src/renderer/src/components/ChatHeader.tsx`
  - Conversation title, members count, call buttons
- [ ] Create `src/renderer/src/components/MessageList.tsx`
  - Virtualized list (react-virtuoso), auto-scroll to bottom
- [ ] Create `src/renderer/src/components/MessageItem.tsx`
  - Text messages, image attachments, file attachments
  - Own messages (right, blue) vs others (left, gray)
  - Timestamps, read receipts, edit/delete actions
- [ ] Create `src/renderer/src/components/MessageInput.tsx`
  - Textarea (auto-expand), attach button, emoji button, send button
  - Enter to send, Shift+Enter for new line

**Docs:** [COMPONENTS.md](./COMPONENTS.md), [DESIGN.md](./DESIGN.md) | **Time:** 3h

### 4.4 Shared Components [Medium]
- [ ] Create `src/renderer/src/components/Avatar.tsx` (with initials fallback)
- [ ] Create `src/renderer/src/components/Button.tsx` (variants: primary, secondary, outline)
- [ ] Create `src/renderer/src/components/Modal.tsx` (backdrop, close on ESC)
- [ ] Create `src/renderer/src/components/Toast.tsx` (success, error, info)

**Docs:** [COMPONENTS.md](./COMPONENTS.md), [DESIGN.md](./DESIGN.md) | **Time:** 1.5h

---

## PHASE 5: ROUTING & INTEGRATION (Est: 2 hours)

### 5.1 Set Up Routing [Critical]
- [ ] Create `src/renderer/src/App.tsx` with TanStack Router
- [ ] Define routes: `/login`, `/register`, `/chat`, `/chat/:conversationId`
- [ ] Implement route guards (redirect to /login if not authenticated)
- [ ] Connect WebSocket on authentication

**Docs:** [ARCHITECTURE.md](./ARCHITECTURE.md) | **Time:** 1h

### 5.2 Connect WebSocket to Stores [Critical]
- [ ] In WebSocket service, on `new_message` → call `messagesStore.addMessage()`
- [ ] On `message_ack` → update temp message with real ID and seq
- [ ] On `typing` → call `presenceStore.setTyping()`
- [ ] On `presence` → call `presenceStore.updatePresence()`

**Docs:** [REALTIME.md](./REALTIME.md) | **Time:** 1h

---

## PHASE 6: MESSAGING FEATURES (Est: 4 hours)

### 6.1 Send Text Messages [Critical]
- [ ] In MessageInput: on Enter/Send click → create optimistic message
- [ ] Generate `clientMsgId`, add to store with status 'sending'
- [ ] Send via WebSocket: `{ type: 'message:send', data: {...} }`
- [ ] On ACK: replace temp message with real message (id, seq)

**Docs:** [ADDING_FEATURES.md](./ADDING_FEATURES.md) | **Time:** 1h

### 6.2 File Uploads [High]
- [ ] Create upload service: `POST /upload` with FormData
- [ ] Show upload progress bar
- [ ] On complete: get storageKey, send message with attachment
- [ ] Display image thumbnails, file icons with download link

**Docs:** [API.md](./API.md#file-upload) | **Time:** 1.5h

### 6.3 Message Actions [Medium]
- [ ] Implement Edit: Show input with existing text, PATCH /messages/:id
- [ ] Implement Delete: Confirmation dialog, DELETE /messages/:id
- [ ] Implement Reply: Show quote, send with replyToId

**Docs:** [ADDING_FEATURES.md](./ADDING_FEATURES.md) | **Time:** 1.5h

---

## PHASE 7: CONVERSATIONS (Est: 3 hours)

### 7.1 Create Conversations [Critical]
- [ ] Create modal: Search users, select user/users
- [ ] For 1:1: Check existing, or POST /conversations {type:'DIRECT', members}
- [ ] For group: POST /conversations {type:'GROUP', title, members}
- [ ] Navigate to new conversation

**Docs:** [API.md](./API.md#conversations) | **Time:** 1.5h

### 7.2 Conversation Management [Medium]
- [ ] Group settings modal: Edit title, add/remove members
- [ ] Leave group: DELETE /conversations/:id/members/me
- [ ] Update conversation list on WebSocket events

**Docs:** [ADDING_FEATURES.md](./ADDING_FEATURES.md) | **Time:** 1.5h

---

## PHASE 8: ELECTRON DESKTOP APP (Est: 6 hours)

### 8.1 Electron Setup [High]
- [ ] Install: `electron@39`, `electron-builder@25`
- [ ] Create `src/main/index.ts` (main process)
- [ ] Create window, load dev server or built files
- [ ] Implement IPC handlers (if needed)
- [ ] Set up local proxy server (API and WebSocket)

**Docs:** [ELECTRON.md](./ELECTRON.md) | **Time:** 2h

### 8.2 Electron Features [Medium]
- [ ] System tray integration
- [ ] Desktop notifications
- [ ] Auto-update (electron-updater)
- [ ] Multiple windows support

**Docs:** [ELECTRON.md](./ELECTRON.md) | **Time:** 2h

### 8.3 Build & Package [High]
- [ ] Configure `electron-builder.yml`
- [ ] Test build for Windows, macOS, Linux
- [ ] Code signing (Windows .pfx, macOS certificate)
- [ ] Create installers

**Docs:** [DEPLOYMENT.md](./DEPLOYMENT.md) | **Time:** 2h

---

## PHASE 9: MOBILE APP (ANDROID) (Est: 8 hours)

### 9.1 Capacitor Setup [High]
- [ ] Install: `@capacitor/core@8`, `@capacitor/cli@8`, `@capacitor/android@8`
- [ ] Init Capacitor: `npx cap init`
- [ ] Add Android platform: `npx cap add android`
- [ ] Configure `capacitor.config.ts`

**Docs:** [MOBILE.md](./MOBILE.md) | **Time:** 1h

### 9.2 Platform Detection [High]
- [ ] Use `Capacitor.isNativePlatform()` to detect mobile
- [ ] Adjust API URLs (direct connection on mobile)
- [ ] Adjust UI (show back button, hide desktop sidebar)

**Docs:** [MOBILE.md](./MOBILE.md) | **Time:** 1h

### 9.3 Push Notifications [High]
- [ ] Set up Firebase project, download `google-services.json`
- [ ] Install `@capacitor/push-notifications`
- [ ] Create `push-android.service.ts`
- [ ] Register FCM token with backend
- [ ] Handle notification taps (open conversation)

**Docs:** [MOBILE.md](./MOBILE.md#push-notifications) | **Time:** 2h

### 9.4 Mobile-Specific Features [Medium]
- [ ] File downloads (Filesystem plugin)
- [ ] Share functionality (Share plugin)
- [ ] Splash screen
- [ ] Status bar styling

**Docs:** [MOBILE.md](./MOBILE.md) | **Time:** 2h

### 9.5 Build & Deploy [High]
- [ ] Generate keystore, configure signing
- [ ] Build APK: `cd android && ./gradlew assembleRelease`
- [ ] Build AAB for Play Store: `./gradlew bundleRelease`
- [ ] Test on physical device

**Docs:** [DEPLOYMENT.md](./DEPLOYMENT.md#android-deployment) | **Time:** 2h

---

## PHASE 10: VOICE/VIDEO CALLS (Est: 6 hours)

### 10.1 LiveKit Integration [High]
- [ ] Install: `livekit-client@2`
- [ ] Create `src/renderer/src/services/livekit.service.ts`
- [ ] Implement `joinCall(roomName, token)`
- [ ] Implement `leaveCall()`, `toggleMicrophone()`, `toggleCamera()`

**Docs:** [REALTIME.md](./REALTIME.md#livekit-integration) | **Time:** 2h

### 10.2 Call UI [High]
- [ ] Create `CallWindow.tsx` component
- [ ] Local video preview
- [ ] Remote video display
- [ ] Call controls (mute, camera, end call)
- [ ] Screen sharing button

**Docs:** [COMPONENTS.md](./COMPONENTS.md) | **Time:** 2h

### 10.3 Call Signaling [High]
- [ ] Initiate call: POST /calls, get LiveKit token
- [ ] Send WebSocket: `call:start`
- [ ] Handle incoming: `call:incoming` → show notification
- [ ] Accept/reject call
- [ ] End call cleanup

**Docs:** [REALTIME.MD](./REALTIME.md) | **Time:** 2h

---

## PHASE 11: POLISH & OPTIMIZATION (Est: 4 hours)

### 11.1 Performance [Medium]
- [ ] Virtualize message list (react-virtuoso)
- [ ] Memoize expensive components (React.memo)
- [ ] Optimize re-renders (selective Zustand subscriptions)
- [ ] Lazy load routes and heavy components
- [ ] Analyze bundle size, code split

**Docs:** [PERFORMANCE.md](./PERFORMANCE.md) | **Time:** 2h

### 11.2 Error Handling [Medium]
- [ ] Add error boundaries
- [ ] Show error toasts for failed operations
- [ ] Implement retry logic for failed messages
- [ ] Handle WebSocket reconnection gracefully
- [ ] Offline indicator

**Docs:** [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) | **Time:** 1h

### 11.3 Accessibility [Low]
- [ ] Add keyboard shortcuts
- [ ] Focus management
- [ ] ARIA labels
- [ ] Test with screen reader

**Docs:** [DESIGN.md](./DESIGN.md#accessibility) | **Time:** 1h

---

## PHASE 12: TESTING & QA (Est: 6 hours)

### 12.1 Manual Testing [Critical]
- [ ] Authentication flow (login, register, logout)
- [ ] Send/receive messages (text, files, images)
- [ ] Real-time features (typing, presence, WebSocket reconnect)
- [ ] Create conversations (1:1, group)
- [ ] Voice/video calls
- [ ] Cross-platform (Desktop: Win/Mac/Linux, Mobile: Android)

**Docs:** [TESTING.md](./TESTING.md#manual-testing-checklist) | **Time:** 4h

### 12.2 Bug Fixes [High]
- [ ] Fix identified issues from testing
- [ ] Test edge cases (network loss, large files, etc.)
- [ ] Verify error handling

**Time:** 2h

---

## PHASE 13: DEPLOYMENT & RELEASE (Est: 4 hours)

### 13.1 Desktop Release [High]
- [ ] Build for all platforms
- [ ] Code sign executables
- [ ] Create installers
- [ ] Upload to distribution server or GitHub Releases
- [ ] Test installers on clean machines

**Docs:** [DEPLOYMENT.md](./DEPLOYMENT.md#desktop-deployment) | **Time:** 2h

### 13.2 Android Release [High]
- [ ] Build signed APK/AAB
- [ ] Upload to Google Play Console (or distribute APK)
- [ ] Fill in store listing (screenshots, description)
- [ ] Submit for review (if Play Store)

**Docs:** [DEPLOYMENT.md](./DEPLOYMENT.md#android-deployment) | **Time:** 2h

---

## TOTAL ESTIMATE: 61 hours (~2 weeks for 1 developer, ~1 week for 2 developers)

---

## Quick Reference Checklist

### MVP Features (Must Have)
- [x] User authentication (login, register, logout)
- [x] Real-time text messaging
- [x] File attachments
- [x] 1:1 conversations
- [x] Group conversations
- [x] Desktop app (Windows, macOS, Linux)
- [x] Android app
- [x] Push notifications (Android)
- [x] Voice/video calls

### Nice to Have (Post-MVP)
- [ ] Message reactions
- [ ] Message search
- [ ] Rich text formatting
- [ ] Voice messages
- [ ] iOS app
- [ ] End-to-end encryption
- [ ] Group video calls

---

## Documentation References

**Start Here:**
- [REQUIREMENTS.md](./REQUIREMENTS.md) - Complete requirements
- [DESIGN.md](./DESIGN.md) - UI/UX specifications
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture

**Development:**
- [SETUP.md](./SETUP.md) - Environment setup
- [CODING_GUIDELINES.md](./CODING_GUIDELINES.md) - Code standards
- [ADDING_FEATURES.md](./ADDING_FEATURES.md) - Feature implementation guide
- [TYPES.md](./TYPES.md) - TypeScript types
- [COMPONENTS.md](./COMPONENTS.md) - Component catalog
- [SERVICES.md](./SERVICES.md) - Service layer
- [STATE_MANAGEMENT.md](./STATE_MANAGEMENT.md) - Zustand stores

**Platform-Specific:**
- [ELECTRON.md](./ELECTRON.md) - Desktop development
- [MOBILE.md](./MOBILE.md) - Android development

**Operations:**
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Build & deploy
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Common issues
- [PERFORMANCE.md](./PERFORMANCE.md) - Optimization
- [TESTING.md](./TESTING.md) - Testing strategy

---

## For AI Agents: Execution Tips

**Sequential Execution:**
1. Complete Phase 1-3 first (foundation)
2. Then Phase 4-7 (core features)
3. Then Phase 8-9 (platform-specific)
4. Finally Phase 10-13 (advanced features + release)

**Parallel Execution (if multiple agents):**
- Agent 1: Phases 1-7 (core web app)
- Agent 2: Phase 8 (Electron)
- Agent 3: Phase 9 (Android)
- Agent 4: Phase 10 (Calls)

**Verification:**
- After each phase, verify all checkboxes completed
- Run app and test implemented features
- Check no TypeScript errors (`npm run typecheck`)
- Check no linting errors (`npm run lint`)

**Communication:**
- Update this file with completion status
- Document any blockers or deviations
- Reference issue/PR numbers for traceability

---

*This checklist provides a complete roadmap for building BSI Messenger. Follow sequentially or adapt based on team structure and priorities.*
