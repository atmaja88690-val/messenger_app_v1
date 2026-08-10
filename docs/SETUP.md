# BSI Messenger Developer Setup Guide

## Overview

This guide will help you set up your development environment for BSI Messenger in approximately 30 minutes. The application supports desktop (Windows, macOS, Linux) and mobile (Android) development.

## Prerequisites

### Required Software

| Software | Version | Purpose | Download |
|----------|---------|---------|----------|
| **Node.js** | 20.x or 22.x LTS | JavaScript runtime | https://nodejs.org/ |
| **npm** | 10.x+ | Package manager | Included with Node.js |
| **Git** | Latest | Version control | https://git-scm.com/ |
| **Code Editor** | Latest | VSCode recommended | https://code.visualstudio.com/ |

### Optional Software

| Software | Version | Purpose | Required For |
|----------|---------|---------|--------------|
| **Android Studio** | Latest | Mobile development | Android builds only |
| **JDK** | 17+ | Android compilation | Android builds only |
| **PostgreSQL Client** | 16.x | Database inspection | Backend development |

---

## Quick Start

### 1. Clone Repository

```bash
# Clone the repository
git clone https://github.com/your-org/bsi-messenger.git
cd bsi-messenger

# Or if using SSH
git clone git@github.com:your-org/bsi-messenger.git
cd bsi-messenger
```

### 2. Install Dependencies

```bash
# Install all dependencies
npm install

# This installs:
# - Electron and Vite build tools
# - React and UI libraries
# - Development tools (ESLint, Prettier, TypeScript)
```

**Expected Output:**
```
added 1247 packages in 45s
```

### 3. Configure Backend Connection

The application connects to `chat.bsilongevity.com:4443` by default. No configuration needed for development.

**Backend Configuration:**
- **Development:** Uses Vite proxy → `https://chat.bsilongevity.com:4443`
- **Production (Desktop):** Uses local proxy → `https://chat.bsilongevity.com:4443`
- **Production (Android):** Direct connection → `https://chat.bsilongevity.com:4443`

**To use a different backend:**

Edit `src/renderer/src/config/constants.ts`:
```typescript
const NATIVE_BACKEND = 'https://your-backend-server.com:port'
```

### 4. Start Development Server

```bash
# Start Electron desktop app with HMR
npm run dev

# The application will open automatically
# Changes to code will hot-reload instantly
```

**Expected Output:**
```
vite v7.2.6 dev server running at:

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose

ready in 324 ms.
```

### 5. Login to Application

**Test Credentials:**
- **Username:** (get from your administrator)
- **Password:** (get from your administrator)

---

## Project Structure

```
bsi-messenger/
├── src/
│   ├── main/                    # Electron main process
│   │   ├── index.ts            # Application entry point
│   │   └── local-server.ts     # HTTP proxy server
│   ├── preload/                 # Preload scripts (IPC bridge)
│   │   ├── index.ts
│   │   └── index.d.ts          # Type definitions
│   ├── renderer/                # React application
│   │   ├── src/
│   │   │   ├── App.tsx         # Main app component
│   │   │   ├── main.tsx        # React entry point
│   │   │   ├── components/     # React components
│   │   │   ├── stores/         # Zustand state management
│   │   │   ├── services/       # API & WebSocket services
│   │   │   ├── config/         # Configuration files
│   │   │   ├── types/          # TypeScript types
│   │   │   └── assets/         # CSS and static assets
│   │   └── index.html          # HTML template
│   └── types/                   # Global type definitions
├── android/                     # Capacitor Android project
│   ├── app/
│   │   ├── src/
│   │   └── build.gradle
│   └── capacitor.config.ts
├── resources/                   # App icons and assets
├── build/                       # Build resources
├── docs/                        # Documentation
├── dist/                        # Build output (generated)
├── out/                         # Electron Builder output (generated)
├── electron.vite.config.ts     # Vite configuration
├── electron-builder.yml         # Electron Builder config
├── capacitor.config.ts          # Capacitor configuration
├── package.json                 # Dependencies and scripts
├── tsconfig.json                # TypeScript config (base)
├── tsconfig.web.json            # Renderer TypeScript config
├── tsconfig.node.json           # Main/Preload TypeScript config
├── tailwind.config.js           # Tailwind CSS config
├── eslint.config.mjs            # ESLint configuration
└── .prettierrc.yaml             # Prettier configuration
```

---

## Development Scripts

### Desktop Development

```bash
# Start development server (Electron + HMR)
npm run dev

# Build for production (current platform)
npm run build

# Build for specific platforms
npm run build:win    # Windows
npm run build:mac    # macOS
npm run build:linux  # Linux

# Build without packaging (faster for testing)
npm run build:dir
```

### Android Development

```bash
# Sync web assets to Android project
npx cap sync android

# Open in Android Studio
npx cap open android

# Run on connected device/emulator (from Android Studio)
# Or use:
cd android && ./gradlew assembleDebug
```

### Code Quality

```bash
# Lint code
npm run lint

# Format code
npm run format

# Type check
npm run typecheck

# Type check and watch for changes
npm run typecheck:watch
```

---

## IDE Setup (VSCode)

### Recommended Extensions

Install these VSCode extensions for the best development experience:

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",           // ESLint integration
    "esbenp.prettier-vscode",           // Prettier formatting
    "bradlc.vscode-tailwindcss",        // Tailwind CSS IntelliSense
    "ms-vscode.vscode-typescript-next", // TypeScript support
    "mxsdev.typescript-explorer",       // TypeScript explorer
    "styled-components.vscode-styled-components", // CSS-in-JS support
    "usernamehw.errorlens",             // Inline error display
    "christian-kohler.path-intellisense" // Path autocomplete
  ]
}
```

### VSCode Settings

Create `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "tailwindCSS.experimental.classRegex": [
    ["cn\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]
  ],
  "files.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/out": true,
    "**/.git": true
  }
}
```

### Debug Configuration

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Electron Main",
      "type": "node",
      "request": "launch",
      "cwd": "${workspaceRoot}",
      "runtimeExecutable": "${workspaceRoot}/node_modules/.bin/electron",
      "windows": {
        "runtimeExecutable": "${workspaceRoot}/node_modules/.bin/electron.cmd"
      },
      "args": ["."],
      "outputCapture": "std",
      "sourceMaps": true
    },
    {
      "name": "Debug Electron Renderer",
      "type": "chrome",
      "request": "attach",
      "port": 9222,
      "webRoot": "${workspaceFolder}/src/renderer",
      "timeout": 30000
    }
  ]
}
```

---

## Environment Configuration

### Development vs Production

**Development Mode:**
- Hot Module Replacement (HMR) enabled
- Source maps for debugging
- DevTools open by default
- Vite proxy handles CORS
- Verbose logging

**Production Mode:**
- Minified and optimized code
- No source maps
- DevTools disabled
- Local HTTP proxy for same-origin
- Error logging only

### Environment Variables

**Not Required** - All configuration is in code files.

Optional environment variables:
```bash
# Skip type checking during build (faster, not recommended)
SKIP_TYPE_CHECK=true npm run build

# Electron debugging
ELECTRON_ENABLE_LOGGING=true npm run dev
```

---

## Backend Setup (Optional)

### For Backend Developers

If you need to run the backend locally:

**Prerequisites:**
- PostgreSQL 16.x
- Node.js 20.x+
- Redis 7.x (for sessions)
- MinIO (for file storage)

**Backend Repository:**
```bash
git clone https://github.com/your-org/bsi-messenger-backend.git
cd bsi-messenger-backend
npm install
```

**Database Setup:**
```bash
# Create database
createdb bsichat_db

# Run migrations
npm run migrate

# Seed test data
npm run seed
```

**Start Backend:**
```bash
# Development mode
npm run dev

# Backend will run on http://localhost:4000
```

**Update Frontend to Use Local Backend:**

Edit `electron.vite.config.ts`:
```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:4000', // Local backend
      changeOrigin: true
    },
    '/ws': {
      target: 'ws://localhost:4000',
      ws: true
    }
  }
}
```

---

## Android Setup

### Prerequisites

1. **Install Android Studio:**
   - Download from https://developer.android.com/studio
   - Install Android SDK (API 33+)
   - Configure ANDROID_HOME environment variable

2. **Install JDK 17+:**
   ```bash
   # Windows (using Chocolatey)
   choco install openjdk17

   # macOS (using Homebrew)
   brew install openjdk@17

   # Linux (Ubuntu/Debian)
   sudo apt-get install openjdk-17-jdk
   ```

3. **Verify Installation:**
   ```bash
   java -version
   # Should show: openjdk version "17.x.x"

   echo $ANDROID_HOME
   # Should show: /path/to/Android/Sdk
   ```

### Initial Android Setup

```bash
# 1. Install Capacitor CLI globally (optional)
npm install -g @capacitor/cli

# 2. Sync web assets to Android
npx cap sync android

# 3. Open in Android Studio
npx cap open android

# 4. Connect device or start emulator
# 5. Click Run button in Android Studio
```

### Firebase Configuration (Push Notifications)

1. **Get google-services.json:**
   - From Firebase Console: Project Settings > General
   - Download `google-services.json`
   - Place in `android/app/`

2. **Update Configuration:**
   ```bash
   # File is already configured in:
   # android/app/build.gradle
   # android/app/google-services.json
   ```

---

## Troubleshooting

### Common Setup Issues

#### 1. npm install fails

**Error:** `EACCES: permission denied`

**Solution:**
```bash
# Don't use sudo! Fix npm permissions:
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
# Add to ~/.bashrc or ~/.zshrc:
export PATH=~/.npm-global/bin:$PATH
```

#### 2. Electron won't start

**Error:** `Error: Electron failed to install correctly`

**Solution:**
```bash
# Rebuild Electron
cd node_modules/electron
node install.js

# Or reinstall
npm install electron --force
```

#### 3. TypeScript errors

**Error:** `Cannot find module '@/components/...'`

**Solution:**
```bash
# Restart TypeScript server in VSCode
# Cmd+Shift+P > TypeScript: Restart TS Server

# Or rebuild
npm run typecheck
```

#### 4. Port already in use

**Error:** `Port 5173 is already in use`

**Solution:**
```bash
# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:5173 | xargs kill -9
```

#### 5. Android build fails

**Error:** `SDK location not found`

**Solution:**
```bash
# Set ANDROID_HOME environment variable
# Windows:
setx ANDROID_HOME "C:\Users\YourName\AppData\Local\Android\Sdk"

# macOS/Linux:
export ANDROID_HOME=$HOME/Library/Android/sdk

# Add to local.properties:
echo "sdk.dir=/path/to/Android/Sdk" > android/local.properties
```

### Getting Help

**Resources:**
- **Documentation:** `docs/` folder
- **API Reference:** `docs/API.md`
- **Architecture:** `docs/ARCHITECTURE.md`
- **Issues:** GitHub Issues (internal)
- **Team Chat:** BSI Messenger internal channel

**Common Commands:**
```bash
# Clear all caches
rm -rf node_modules dist out .vite
npm install

# Reset git state
git clean -fdx
git reset --hard

# Check for dependency issues
npm audit
npm outdated
```

---

## Next Steps

After setup is complete:

1. **Read Documentation:**
   - [ ] Review [ARCHITECTURE.md](./ARCHITECTURE.md)
   - [ ] Understand [STATE_MANAGEMENT.md](./STATE_MANAGEMENT.md)
   - [ ] Study [COMPONENTS.md](./COMPONENTS.md)

2. **Explore Codebase:**
   - [ ] Run application and test features
   - [ ] Browse component hierarchy
   - [ ] Inspect state stores in DevTools

3. **Make First Contribution:**
   - [ ] Pick a small bug or feature
   - [ ] Create feature branch
   - [ ] Submit pull request

4. **Join Team:**
   - [ ] Attend team standup
   - [ ] Introduce yourself in chat
   - [ ] Ask questions!

---

## Development Best Practices

### Code Style

- **Follow ESLint rules:** `npm run lint`
- **Format with Prettier:** `npm run format`
- **TypeScript strict mode:** No `any` types
- **Component naming:** PascalCase for files and components
- **Function naming:** camelCase

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Push and create PR
git push origin feature/your-feature-name
```

**Commit Message Format:**
- `feat: add new feature`
- `fix: resolve bug`
- `docs: update documentation`
- `style: format code`
- `refactor: restructure code`
- `test: add tests`
- `chore: update dependencies`

### Testing

```bash
# Run tests (when implemented)
npm test

# Test specific file
npm test -- path/to/test.spec.ts

# Watch mode
npm test -- --watch
```

---

*You're now ready to start developing BSI Messenger! If you encounter any issues not covered in this guide, please refer to the troubleshooting section or reach out to the team.*