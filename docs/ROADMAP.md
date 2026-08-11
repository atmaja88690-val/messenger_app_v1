# Product Roadmap

## Overview

This roadmap outlines planned features, technical improvements, and long-term vision for BSI Messenger. Features are organized by priority and estimated timeline.

---

## Current Status (v1.0.0)

### ✅ Core Features Implemented

**Messaging:**
- Real-time text messaging
- File attachments (images, documents, audio)
- Message editing and deletion
- Reply to messages
- Typing indicators
- Read receipts

**Conversations:**
- 1:1 direct messaging
- Group chats
- Conversation search
- Member management

**Communication:**
- Voice calls (WebRTC via LiveKit)
- Video calls (WebRTC via LiveKit)
- Screen sharing

**User Features:**
- User authentication (JWT)
- User profiles
- Presence status (Available, Away, DND, Offline)
- Avatar uploads

**Platform Support:**
- Desktop application (Windows, macOS, Linux)
- Android mobile app
- Real-time sync across devices

---

## Short-term (Next 3 Months)

### 1. Message Reactions

**Priority:** High  
**Effort:** Medium

**Features:**
- React to messages with emojis
- Multiple reactions per message
- One reaction per user per message
- Real-time reaction updates
- Reaction picker UI

**Implementation:**
```sql
-- Database schema
CREATE TABLE reactions (
  id UUID PRIMARY KEY,
  message_id UUID REFERENCES messages(id),
  user_id UUID REFERENCES users(id),
  emoji VARCHAR(10),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji)
);
```

---

### 2. Message Search

**Priority:** High  
**Effort:** High

**Features:**
- Full-text search across all messages
- Filter by conversation
- Filter by sender
- Filter by date range
- Search in attachments (filename, type)

**Technical Approach:**
- PostgreSQL full-text search
- Backend: `/search?q=query&conversationId=...&from=...&to=...`
- Frontend: Search bar in header with results modal

---

### 3. Rich Text Formatting

**Priority:** Medium  
**Effort:** Medium

**Features:**
- **Bold**, *italic*, `code`, ~~strikethrough~~
- Code blocks with syntax highlighting
- Hyperlink detection and rendering
- Markdown support
- WYSIWYG editor (optional)

**Libraries:**
- Lexical (Meta's rich text editor)
- Or: Slate.js
- Syntax highlighting: Prism.js

---

### 4. Notification Settings

**Priority:** Medium  
**Effort:** Low

**Features:**
- Mute conversations (1 hour, 8 hours, 1 day, forever)
- Mute specific users
- Notification sound settings
- Do Not Disturb schedule
- Desktop notification preferences

**UI:**
- Settings page with toggles
- Per-conversation settings in conversation menu

---

## Mid-term (3-6 Months)

### 5. Message Inbox (Agent Dashboard)

**Priority:** High (for customer support use case)  
**Effort:** High

**Features:**
- Unified inbox for agents
- Conversation assignment to agents
- Conversation status (Open, Pending, Resolved)
- Conversation tags/labels
- Agent workload distribution
- Conversation routing rules

**User Roles:**
- `AGENT`: Can handle assigned conversations
- `SUPERVISOR`: Can view all conversations and reassign
- `ADMIN`: Full access

**Technical:**
- New table: `conversation_assignments`
- New table: `conversation_tags`
- New API endpoints: `/inbox`, `/assign`, `/resolve`

---

### 6. Broadcast Messages

**Priority:** Medium  
**Effort:** Medium

**Features:**
- Send message to multiple conversations at once
- Select recipients (individual or groups)
- Schedule broadcasts
- Track delivery and read status
- Broadcast templates

**Use Cases:**
- Company-wide announcements
- Marketing campaigns
- System notifications

---

### 7. Message Templates

**Priority:** Medium  
**Effort:** Low

**Features:**
- Save frequently used messages as templates
- Template variables (e.g., {name}, {date})
- Quick access to templates in composer
- Share templates with team
- Template categories

**UI:**
- Templates sidebar in chat
- `/template` slash command
- Template manager in settings

---

### 8. Voice Messages

**Priority:** Medium  
**Effort:** Medium

**Features:**
- Record audio messages in-app
- Playback controls (play, pause, speed)
- Waveform visualization
- Duration display
- Automatic speech-to-text (optional)

**Technical:**
- MediaRecorder API (browser)
- Capacitor Voice Recorder plugin (mobile)
- Store as audio/webm or audio/mp4
- Waveform: wavesurfer.js

---

## Long-term (6-12 Months)

### 9. iOS Support

**Priority:** High  
**Effort:** High

**Requirements:**
- Capacitor iOS project setup
- iOS-specific UI adjustments
- Apple Push Notification Service (APNS)
- App Store submission
- Code signing & provisioning profiles

**Challenges:**
- Requires macOS for development
- Apple Developer account ($99/year)
- App Store review process

---

### 10. End-to-End Encryption

**Priority:** High (for privacy-focused customers)  
**Effort:** Very High

**Features:**
- E2E encryption for messages
- Device key management
- Key verification between users
- Encrypted file attachments
- Encrypted voice/video calls (already encrypted via WebRTC)

**Technical Approach:**
- Signal Protocol (libsignal)
- Or: Matrix Olm/Megolm
- Requires significant architectural changes
- Backend cannot read message content

**Trade-offs:**
- Cannot search messages server-side
- Cannot sync message history to new devices (unless key backup)
- More complex implementation

---

### 11. Video Conferencing (Multi-party)

**Priority:** Medium  
**Effort:** High

**Features:**
- Group video calls (3+ participants)
- Screen sharing in group calls
- Meeting rooms (persistent rooms)
- Meeting scheduling
- Recording (optional)

**Technical:**
- Upgrade LiveKit configuration
- Handle more complex SFU scenarios
- Bandwidth optimization
- UI for grid/spotlight views

---

### 12. Integrations & Bots

**Priority:** Medium  
**Effort:** High

**Features:**
- Webhook integrations
- Bot API for automated messages
- Slash commands (e.g., `/giphy`, `/poll`)
- Integration with external tools (Jira, GitHub, etc.)
- Custom bot development

**Architecture:**
- Bot accounts (special account type)
- Webhook endpoints for incoming events
- Bot token authentication
- Command parser

---

### 13. Analytics Dashboard

**Priority:** Medium (for enterprise customers)  
**Effort:** High

**Features:**
- Message volume over time
- Active users
- Response times (for support use case)
- Conversation metrics
- User engagement
- Export reports

**Technical:**
- Time-series database (InfluxDB or TimescaleDB)
- Data aggregation jobs
- Dashboard UI (recharts or Chart.js)
- Admin-only access

---

### 14. Admin Panel

**Priority:** Low  
**Effort:** High

**Features:**
- User management (create, edit, delete, suspend)
- Conversation moderation
- System settings
- Usage statistics
- Audit logs
- Role management

**Implementation:**
- Separate admin web app
- Or: Admin section in main app (role-gated)
- Admin API endpoints

---

## Future Considerations

### User-Requested Features

**Low Priority / Future:**
- [ ] Polls in conversations
- [ ] GIF picker integration (Giphy, Tenor)
- [ ] Stickers
- [ ] Dark mode (already supported via TailwindCSS)
- [ ] Custom emoji
- [ ] Conversation folders
- [ ] Pin messages
- [ ] Conversation archive
- [ ] Multi-device logout
- [ ] Export conversation history
- [ ] Two-factor authentication (2FA)
- [ ] OAuth login (Google, Microsoft, GitHub)

---

## Technical Debt & Improvements

### High Priority
- [ ] Add automated testing (unit, integration, E2E)
- [ ] Implement error tracking (Sentry)
- [ ] Add performance monitoring
- [ ] Database query optimization
- [ ] Implement rate limiting
- [ ] Add request throttling
- [ ] Improve error handling

### Medium Priority
- [ ] Refactor large components
- [ ] Extract reusable hooks
- [ ] Improve TypeScript coverage
- [ ] Add API documentation (OpenAPI/Swagger)
- [ ] Implement caching strategy (Redis)
- [ ] Add database migrations system
- [ ] Improve WebSocket reconnection logic

### Low Priority
- [ ] Migrate to pnpm (faster installs)
- [ ] Upgrade to React 19 stable
- [ ] Evaluate state management alternatives
- [ ] Consider server-side rendering (SSR)
- [ ] Evaluate alternative UI libraries

---

## Infrastructure & DevOps

### Planned Improvements
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Automated deployment
- [ ] Docker containerization
- [ ] Kubernetes orchestration (if scaling needed)
- [ ] Load balancing
- [ ] Database replication
- [ ] Backup automation
- [ ] Monitoring & alerting (Prometheus, Grafana)
- [ ] Log aggregation (ELK stack)

---

## Version Milestones

### v1.1.0 (Target: +1 month)
- Message reactions
- Notification settings
- Bug fixes and stability improvements

### v1.2.0 (Target: +3 months)
- Message search
- Rich text formatting
- Voice messages

### v1.5.0 (Target: +6 months)
- Message inbox (agent dashboard)
- Broadcast messages
- Message templates

### v2.0.0 (Target: +12 months)
- iOS support
- End-to-end encryption
- Multi-party video conferencing
- Major UI refresh

---

## Contributing to Roadmap

**Have a feature request?**
1. Check if it's already listed here
2. Create a GitHub issue with:
   - Feature description
   - Use case / problem it solves
   - Priority (critical, high, medium, low)
   - Proposed implementation (optional)
3. Discuss with the team
4. Feature added to roadmap if approved

**Voting on features:**
- React to GitHub issues with 👍 to vote
- Features with most votes get higher priority

---

## Release Cadence

**Current plan:**
- **Patch releases (v1.0.x):** Weekly (bug fixes)
- **Minor releases (v1.x.0):** Monthly (new features)
- **Major releases (vX.0.0):** Yearly (breaking changes)

**Process:**
1. Feature development in feature branches
2. Merge to `develop` branch
3. Test in staging environment
4. Merge to `main` for release
5. Create GitHub release with changelog
6. Deploy to production

---

## Success Metrics

**Track these metrics to measure roadmap success:**

**User Engagement:**
- Daily Active Users (DAU)
- Monthly Active Users (MAU)
- Messages sent per user per day
- Session duration

**Performance:**
- Message delivery time (target: <200ms)
- App load time (target: <3s)
- Crash rate (target: <1%)
- App Store rating (target: >4.5)

**Business (if applicable):**
- User retention rate
- Conversion rate (free → paid, if freemium model)
- Customer satisfaction score
- Support ticket volume (should decrease with better features)

---

*This roadmap is a living document and will be updated based on user feedback, business priorities, and technical constraints.*
