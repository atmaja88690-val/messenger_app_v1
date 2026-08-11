# Changelog

All notable changes to BSI Messenger will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Inbox omnichannel (WhatsApp, Instagram, webchat)
- Broadcast messaging for WhatsApp Business
- Message templates management
- Analytics and reporting dashboard
- Group video calls (3+ participants)
- Message editing
- Message search functionality
- File preview for documents
- Voice messages
- Desktop notifications customization

---

## [1.0.0] - 2026-08-10

### Added

**Core Messaging:**
- Direct messaging (1-on-1) with real-time delivery
- Group chat with multiple participants
- Text messages with full Unicode support
- Image attachments with inline preview
- File attachments (documents, PDFs, etc.)
- Reply-to-message threading
- Message deletion (soft delete)
- Typing indicators
- Read receipts with sequence tracking
- Optimistic UI for instant feedback

**Audio/Video Calls:**
- Audio-only calls (1-on-1)
- Video calls with camera toggle
- LiveKit SFU architecture for reliable media streaming
- Mic mute/unmute control
- Call signaling via WebSocket
- Incoming call notifications
- Missed call detection
- Call history tracking

**User Management:**
- User authentication with JWT tokens
- Automatic token refresh (proactive & reactive)
- User profiles with avatars
- User status (Available, Away, DND, Offline)
- Profile fields: name, email, phone, job title, department
- Avatar upload and display
- User directory for starting conversations

**Admin Features:**
- Admin panel for user management
- User list with pagination and search
- Create new users with initial password
- Edit user information
- Activate/deactivate user accounts
- Set admin privileges
- Reset user passwords
- Delete user accounts
- System statistics dashboard
- User session tracking
- Message count per user

**Desktop Application (Electron):**
- Cross-platform support (Windows, macOS, Linux)
- System tray integration
- Native application menu
- Keyboard shortcuts
- Desktop notifications
- Settings persistence
- Open at login option
- Download directory configuration
- Window state management (minimize to tray)
- Local HTTP proxy for same-origin requests

**Mobile Application (Android):**
- Android app via Capacitor
- Push notifications via Firebase Cloud Messaging
- Responsive mobile UI
- File system access for downloads
- Share functionality
- Native device integration

**Technical Features:**
- Real-time WebSocket communication
- Automatic reconnection with exponential backoff
- Ping/pong heartbeat mechanism
- Offline message queue
- Token-based authentication
- Session management with revocation
- HTTPS/WSS secure connections
- PostgreSQL database backend
- MinIO object storage for files
- LiveKit media server integration

**User Experience:**
- Dark theme UI
- Responsive design (mobile, tablet, desktop)
- Avatar fallback to initials
- Status indicators
- Last seen timestamps
- Message timestamps with smart formatting
- Conversation search
- New chat dialog (DM and Group)
- Settings dialog
- User profile dialog
- About dialog
- Loading states
- Error messages
- Empty states

### Changed
- N/A (initial release)

### Deprecated
- N/A (initial release)

### Removed
- N/A (initial release)

### Fixed
- N/A (initial release)

### Security
- JWT access tokens (short-lived, 15-30 minutes)
- Refresh tokens for session persistence
- Proactive token refresh (60s before expiry)
- Reactive token refresh on 401 errors
- Session revocation on logout
- Secure WebSocket connections (WSS)
- HTTPS-only API communication
- Input validation on all forms
- XSS protection via React
- CSRF protection via token-based auth
- Password hashing with bcrypt (backend)

---

## Version History Summary

- **1.0.0** (2026-08-10) - Initial production release
  - Core messaging functionality
  - Audio/video calls
  - User management
  - Admin panel
  - Desktop application (Windows, macOS, Linux)
  - Mobile application (Android)

---

## How to Update

### Desktop Application

**Auto-Update (When Implemented):**
1. Application will notify when update is available
2. Click "Update" to download in background
3. Restart application to install update
4. Settings and data are preserved

**Manual Update:**
1. Download latest installer from distribution site
2. Run installer (existing installation will be upgraded)
3. Launch updated application
4. Login with existing credentials

### Android Application

**Via Google Play (When Published):**
1. Open Google Play Store
2. Go to "My apps & games"
3. Find "BSI Messenger"
4. Tap "Update"

**Manual APK Install:**
1. Download latest APK
2. Enable "Install from unknown sources" in settings
3. Install APK
4. Open updated application

---

## Migration Notes

### From Alpha/Beta to 1.0.0

No migration required. Fresh install recommended.

### Database Schema

Current schema version: 1.0.0
- No migrations required for initial release
- Future schema changes will be documented here
- Backup database before major version upgrades

---

## Support

**Reporting Issues:**
- GitHub Issues (internal): https://github.com/your-org/bsi-messenger/issues
- Email: support@bsilongevity.com
- Internal Chat: BSI Messenger support channel

**Documentation:**
- User Guide: `docs/USER_GUIDE.md` (if created)
- API Reference: `docs/API.md`
- Developer Setup: `docs/SETUP.md`
- Architecture: `docs/ARCHITECTURE.md`

---

## Contributors

**Core Team:**
- Development Team
- QA Team
- Product Team
- Design Team

**Special Thanks:**
- All beta testers
- Early adopters
- Feedback providers

---

*For detailed technical documentation, see the `docs/` directory.*