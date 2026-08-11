# BSI Messenger

A modern, cross-platform communication application for internal team collaboration with real-time messaging, audio/video calls, and comprehensive user management.

![BSI Messenger](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux%20%7C%20Android-lightgrey.svg)
![License](https://img.shields.io/badge/license-Proprietary-red.svg)

## 🚀 Features

### Core Messaging
- **Real-time Chat:** Instant message delivery with WebSocket
- **Group Conversations:** Multi-user group chats with roles
- **Rich Media:** Send images, files, and attachments
- **Message Threading:** Reply to specific messages
- **Read Receipts:** Track message read status
- **Typing Indicators:** See when others are typing

### Audio & Video Calls
- **HD Voice Calls:** Crystal-clear audio communication
- **Video Conferencing:** Face-to-face video calls
- **LiveKit SFU:** Reliable media streaming architecture
- **Call Controls:** Mute/unmute mic, toggle camera
- **Missed Call Tracking:** Never miss important calls

### User Management
- **User Profiles:** Customizable profiles with avatars
- **Status Indicators:** Available, Away, DND, Offline
- **Admin Panel:** Comprehensive user management tools
- **Role-Based Access:** USER, ADMIN, AGENT, SUPERVISOR, MODERATOR
- **Directory Search:** Find and connect with colleagues

### Cross-Platform
- **Desktop:** Windows, macOS, Linux (Electron)
- **Mobile:** Android (Capacitor)
- **Responsive:** Seamless experience across devices

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [Technology Stack](#-technology-stack)
- [Project Structure](#-project-structure)
- [Development](#-development)
- [Building](#-building)
- [Documentation](#-documentation)
- [Contributing](#-contributing)
- [Support](#-support)
- [License](#-license)

## ⚡ Quick Start

### Prerequisites

- **Node.js** 20.x or 22.x LTS
- **npm** 10.x+
- **Git**

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/bsi-messenger.git
cd bsi-messenger

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will open automatically. For detailed setup instructions, see [docs/SETUP.md](./docs/SETUP.md).

## 🛠️ Technology Stack

### Frontend
- **React 19** - UI framework with concurrent features
- **TypeScript 5.9** - Type-safe JavaScript
- **TailwindCSS 3.4** - Utility-first CSS framework
- **TanStack Router** - Type-safe routing
- **TanStack React Query** - Server state management
- **Zustand 5** - Client state management

### Desktop
- **Electron 39** - Cross-platform desktop runtime
- **Electron Vite 5** - Fast build tool
- **Electron Builder 26** - Application packaging

### Mobile
- **Capacitor 8** - Native mobile runtime
- **FCM** - Push notifications (Android)

### Real-time & Media
- **WebSocket** - Bidirectional communication
- **LiveKit Client 2.x** - WebRTC SFU for calls

### Build Tools
- **Vite 7** - Lightning-fast dev server
- **TypeScript Compiler** - Type checking
- **ESLint 9** - Code linting
- **Prettier 3** - Code formatting

## 📁 Project Structure

```
bsi-messenger/
├── src/
│   ├── main/              # Electron main process
│   ├── preload/           # IPC bridge
│   └── renderer/          # React application
│       ├── components/    # React components
│       ├── stores/        # Zustand state stores
│       ├── services/      # API & WebSocket services
│       ├── config/        # Configuration
│       └── types/         # TypeScript types
├── android/               # Capacitor Android project
├── resources/             # App icons and assets
├── docs/                  # Comprehensive documentation
├── electron.vite.config.ts
├── electron-builder.yml
├── capacitor.config.ts
└── package.json
```

## 💻 Development

### Recommended IDE Setup

- [VSCode](https://code.visualstudio.com/)
- [ESLint Extension](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
- [Prettier Extension](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
- [TailwindCSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss)

### Development Commands

```bash
# Start Electron app with HMR
npm run dev

# Type checking
npm run typecheck
npm run typecheck:watch

# Linting
npm run lint

# Code formatting
npm run format

# Android development
npx cap sync android
npx cap open android
```

### Configuration

The application connects to `chat.bsilongevity.com:4443` by default. To use a different backend, edit `src/renderer/src/config/constants.ts`:

```typescript
const NATIVE_BACKEND = 'https://your-backend-server.com:port'
```

## 🏗️ Building

### Desktop

```bash
# Build for current platform
npm run build

# Build for specific platforms
npm run build:win      # Windows (x64, ia32)
npm run build:mac      # macOS (x64, arm64)
npm run build:linux    # Linux (AppImage, deb)

# Build without packaging (faster for testing)
npm run build:dir
```

**Output:** `dist/` directory contains installers and unpacked apps.

### Android

```bash
# Sync web assets
npx cap sync android

# Build APK
cd android && ./gradlew assembleDebug

# Build release APK (requires signing config)
cd android && ./gradlew assembleRelease
```

**Output:** `android/app/build/outputs/apk/`

## 📚 Documentation

Comprehensive documentation is available in the [`docs/`](./docs/) directory:

### Getting Started
- [**Setup Guide**](./docs/SETUP.md) - Development environment setup
- [**Architecture**](./docs/ARCHITECTURE.md) - System architecture overview
- [**Glossary**](./docs/GLOSSARY.md) - Terms and concepts

### Development
- [**Coding Guidelines**](./docs/CODING_GUIDELINES.md) - Code standards and best practices
- [**Adding Features**](./docs/ADDING_FEATURES.md) - Feature implementation guide
- [**Testing Strategy**](./docs/TESTING.md) - Testing approaches

### Architecture & Design
- [**State Management**](./docs/STATE_MANAGEMENT.md) - Zustand stores and data flow
- [**Services**](./docs/SERVICES.md) - Service layer documentation
- [**Components**](./docs/COMPONENTS.md) - React component catalog
- [**Database Schema**](./docs/DATABASE.md) - PostgreSQL database structure

### Platform-Specific
- [**Electron/Desktop**](./docs/ELECTRON.md) - Desktop application guide
- [**Mobile/Capacitor**](./docs/MOBILE.md) - Android app development

### Reference
- [**API Documentation**](./docs/API.md) - REST & WebSocket API reference
- [**Types Documentation**](./docs/TYPES.md) - TypeScript type definitions
- [**Configuration**](./docs/CONFIGURATION.md) - Config files reference

### Operations
- [**Deployment**](./docs/DEPLOYMENT.md) - Build and release process
- [**Troubleshooting**](./docs/TROUBLESHOOTING.md) - Common issues and solutions
- [**Performance**](./docs/PERFORMANCE.md) - Optimization strategies

📖 **[Complete Documentation Index](./docs/INDEX.md)**

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Read the Guidelines:** Review [CODING_GUIDELINES.md](./docs/CODING_GUIDELINES.md)
2. **Create a Branch:** `git checkout -b feature/your-feature-name`
3. **Make Changes:** Follow coding standards and add tests
4. **Commit:** Use [conventional commits](https://www.conventionalcommits.org/)
   ```bash
   git commit -m "feat: add new feature"
   git commit -m "fix: resolve bug"
   ```
5. **Push & PR:** Push your branch and create a pull request

### Code Review Process

All pull requests require:
- ✅ ESLint passing (`npm run lint`)
- ✅ TypeScript compiling (`npm run typecheck`)
- ✅ Code formatted (`npm run format`)
- ✅ Tests passing (when implemented)
- ✅ Documentation updated (if needed)
- ✅ Review approval from maintainer

## 🐛 Support

### Getting Help

1. **Documentation:** Check [docs/](./docs/) folder first
2. **Troubleshooting:** See [TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md)
3. **GitHub Issues:** Search existing issues
4. **Team Chat:** Ask in BSI Messenger internal channel
5. **Create Issue:** Submit detailed bug report or feature request

### Reporting Bugs

Please include:
- Operating system and version
- Node.js version
- Steps to reproduce
- Expected vs actual behavior
- Screenshots or error messages
- Relevant logs

### Feature Requests

Describe:
- Problem you're trying to solve
- Proposed solution
- Alternative approaches considered
- Impact on existing features

## 📜 License

Copyright © 2026 BSI International. All rights reserved.

This software is proprietary and confidential. Unauthorized copying, distribution, or use is strictly prohibited.

## 📞 Contact

- **Email:** support@bsilongevity.com
- **Website:** https://bsilongevity.com
- **Internal Chat:** BSI Messenger support channel

## 🙏 Acknowledgments

Built with:
- [Electron](https://www.electronjs.org/)
- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [TailwindCSS](https://tailwindcss.com/)
- [LiveKit](https://livekit.io/)
- [Capacitor](https://capacitorjs.com/)

Special thanks to all contributors and beta testers who helped shape BSI Messenger.

---

**Version:** 1.0.0  
**Last Updated:** August 10, 2026

For changelog and version history, see [CHANGELOG.md](./CHANGELOG.md)
