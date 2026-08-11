# Configuration Reference

## Overview

This document describes all configuration files in BSI Messenger and their purposes.

---

## Project Configuration

### package.json

**Location:** `package.json`  
**Purpose:** Project metadata, dependencies, scripts

```json
{
  "name": "bsi-messenger",
  "version": "1.0.0",
  "description": "Real-time messaging application",
  "main": "dist-electron/main.js",
  
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "build:electron": "electron-builder",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src --ext .ts,.tsx",
    "format": "prettier --write \"src/**/*.{ts,tsx,css,md}\""
  },
  
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@tanstack/react-router": "^1.103.3",
    "@tanstack/react-query": "^5.64.2",
    "zustand": "^5.0.2",
    "axios": "^1.7.9",
    "livekit-client": "^2.10.0",
    "tailwindcss": "^4.1.0"
  },
  
  "devDependencies": {
    "@types/react": "^19.0.6",
    "@types/react-dom": "^19.0.2",
    "typescript": "^5.9.0",
    "vite": "^6.0.0",
    "@vitejs/plugin-react": "^4.3.4",
    "electron": "^39.0.0",
    "electron-builder": "^25.1.8"
  }
}
```

**Key Fields:**
- `main`: Entry point for Electron
- `scripts`: Commands to run (`npm run dev`, etc.)
- `dependencies`: Runtime dependencies
- `devDependencies`: Development-only dependencies

---

## TypeScript Configuration

### tsconfig.json

**Location:** `tsconfig.json`  
**Purpose:** TypeScript compiler settings

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true,

    /* Path Aliases */
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/renderer/src/*"]
    }
  },
  "include": ["src/renderer/src", "src/main"],
  "exclude": ["node_modules", "dist", "dist-electron"]
}
```

**Important Options:**
- `strict: true` - Enables all strict type checking
- `noEmit: true` - Type checking only, no JS output (Vite handles build)
- `paths` - Import aliases (`@/components` → `src/renderer/src/components`)
- `jsx: "react-jsx"` - Use new JSX transform

---

### tsconfig.node.json

**Location:** `tsconfig.node.json`  
**Purpose:** TypeScript config for Node.js files (Vite config, etc.)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "noEmit": true
  },
  "include": ["vite.config.ts", "electron.vite.config.ts"]
}
```

---

## Build Configuration

### vite.config.ts

**Location:** `vite.config.ts`  
**Purpose:** Vite bundler configuration (web assets)

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src/renderer/src')
    }
  },
  
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://chat.bsilongevity.com:4443',
        changeOrigin: true,
        secure: false
      },
      '/ws': {
        target: 'wss://chat.bsilongevity.com:4443',
        ws: true,
        changeOrigin: true
      }
    }
  },
  
  build: {
    outDir: 'dist/renderer',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-router': ['@tanstack/react-router'],
          'vendor-query': ['@tanstack/react-query'],
          'livekit': ['livekit-client']
        }
      }
    }
  }
})
```

**Key Sections:**
- `plugins` - Vite plugins (React fast refresh, etc.)
- `resolve.alias` - Path aliases for imports
- `server.proxy` - Dev server proxy for API requests
- `build.outDir` - Output directory
- `build.rollupOptions.manualChunks` - Code splitting strategy

---

### electron-builder.yml

**Location:** `electron-builder.yml`  
**Purpose:** Electron Builder configuration (desktop app packaging)

```yaml
appId: com.bsi.messenger
productName: BSI Messenger
copyright: Copyright © 2024 BSI

directories:
  output: dist-electron
  buildResources: build

files:
  - dist/**/*
  - dist-electron/**/*
  - node_modules/**/*
  - package.json

win:
  target:
    - target: nsis
      arch:
        - x64
        - ia32
  icon: build/icon.ico
  artifactName: ${productName}-Setup-${version}.${ext}

mac:
  target:
    - dmg
    - zip
  icon: build/icon.icns
  category: public.app-category.productivity
  hardenedRuntime: true
  gatekeeperAssess: false
  entitlements: build/entitlements.mac.plist
  entitlementsInherit: build/entitlements.mac.plist

linux:
  target:
    - AppImage
    - deb
  icon: build/icon.png
  category: Chat

publish:
  provider: github
  owner: your-org
  repo: bsi-messenger
```

**Platform-Specific:**
- `win` - Windows installer (NSIS)
- `mac` - macOS DMG and ZIP
- `linux` - AppImage and .deb
- `publish` - Auto-update server configuration

---

## Mobile Configuration

### capacitor.config.ts

**Location:** `capacitor.config.ts`  
**Purpose:** Capacitor configuration (mobile apps)

```typescript
import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.bsi.messenger',
  appName: 'BSI Messenger',
  webDir: 'dist/renderer',
  
  server: {
    androidScheme: 'https',
    cleartext: false
  },
  
  android: {
    buildOptions: {
      keystorePath: process.env.KEYSTORE_FILE,
      keystorePassword: process.env.KEYSTORE_PASSWORD,
      keystoreAlias: process.env.KEY_ALIAS,
      keystoreAliasPassword: process.env.KEY_PASSWORD
    }
  },
  
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#1a202c',
      showSpinner: false,
      androidSpinnerStyle: 'small',
      splashFullScreen: true,
      splashImmersive: true
    }
  }
}

export default config
```

**Key Sections:**
- `appId` - Unique package identifier
- `webDir` - Built web assets location
- `server` - Server configuration
- `android.buildOptions` - Signing configuration
- `plugins` - Plugin-specific settings

---

### android/app/build.gradle

**Location:** `android/app/build.gradle`  
**Purpose:** Android build configuration

```gradle
android {
    namespace "com.bsi.messenger"
    compileSdkVersion 34
    
    defaultConfig {
        applicationId "com.bsi.messenger"
        minSdkVersion 24
        targetSdkVersion 34
        versionCode 1
        versionName "1.0.0"
    }
    
    buildTypes {
        release {
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
            signingConfig signingConfigs.release
        }
    }
    
    signingConfigs {
        release {
            storeFile file(System.getenv("KEYSTORE_FILE") ?: "release.keystore")
            storePassword System.getenv("KEYSTORE_PASSWORD")
            keyAlias System.getenv("KEY_ALIAS")
            keyPassword System.getenv("KEY_PASSWORD")
        }
    }
}

dependencies {
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'com.google.firebase:firebase-messaging:23.1.0'
    implementation project(':capacitor-android')
    // ... other dependencies
}
```

**Key Sections:**
- `defaultConfig` - App ID, version, SDK versions
- `buildTypes` - Debug/release configurations
- `signingConfigs` - Code signing setup
- `dependencies` - Android libraries

---

## Styling Configuration

### tailwind.config.js

**Location:** `tailwind.config.js`  
**Purpose:** TailwindCSS configuration

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/renderer/src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          900: '#1e3a8a'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
}
```

**Key Sections:**
- `content` - Files to scan for classes
- `theme.extend` - Custom colors, fonts, etc.
- `plugins` - TailwindCSS plugins

---

### postcss.config.js

**Location:** `postcss.config.js`  
**Purpose:** PostCSS configuration (CSS processing)

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
}
```

---

## Code Quality

### .eslintrc.json

**Location:** `.eslintrc.json`  
**Purpose:** ESLint configuration (code linting)

```json
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:jsx-a11y/recommended"
  ],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": 2020,
    "sourceType": "module",
    "ecmaFeatures": {
      "jsx": true
    }
  },
  "rules": {
    "react/react-in-jsx-scope": "off",
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "no-console": ["warn", { "allow": ["warn", "error"] }]
  },
  "settings": {
    "react": {
      "version": "detect"
    }
  }
}
```

**Key Sections:**
- `extends` - Base rulesets
- `parser` - TypeScript parser
- `rules` - Custom rule overrides
- `settings` - Plugin settings

---

### .prettierrc.yaml

**Location:** `.prettierrc.yaml`  
**Purpose:** Prettier configuration (code formatting)

```yaml
semi: false
singleQuote: true
trailingComma: none
printWidth: 100
tabWidth: 2
arrowParens: always
```

**Options:**
- `semi: false` - No semicolons
- `singleQuote: true` - Use single quotes
- `trailingComma: none` - No trailing commas
- `printWidth: 100` - Max line length
- `arrowParens: always` - `(x) => x` not `x => x`

---

### .prettierignore

**Location:** `.prettierignore`  
**Purpose:** Files to exclude from Prettier

```
node_modules
dist
dist-electron
android/build
ios/build
*.min.js
package-lock.json
```

---

## Editor Configuration

### .editorconfig

**Location:** `.editorconfig`  
**Purpose:** Editor settings (consistent across IDEs)

```ini
root = true

[*]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true

[*.md]
trim_trailing_whitespace = false
```

**Settings:**
- `indent_size = 2` - Use 2 spaces
- `end_of_line = lf` - Unix line endings
- `trim_trailing_whitespace = true` - Remove trailing spaces

---

## Git Configuration

### .gitignore

**Location:** `.gitignore`  
**Purpose:** Files to exclude from Git

```gitignore
# Dependencies
node_modules/

# Build outputs
dist/
dist-electron/
android/app/build/
ios/App/build/

# Environment
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*

# Keystore (never commit!)
*.keystore
*.jks
```

---

### .gitattributes

**Location:** `.gitattributes`  
**Purpose:** Git file handling rules

```gitattributes
* text=auto
*.js text eol=lf
*.ts text eol=lf
*.tsx text eol=lf
*.json text eol=lf
*.md text eol=lf

*.png binary
*.jpg binary
*.jpeg binary
*.gif binary
*.ico binary
*.ttf binary
*.woff binary
*.woff2 binary
```

---

## Environment Variables

### .env (Development)

**Location:** `.env` (not committed to Git!)  
**Purpose:** Environment-specific configuration

```bash
# API Configuration
VITE_API_URL=https://chat.bsilongevity.com:4443/api
VITE_WS_URL=wss://chat.bsilongevity.com:4443/ws
VITE_LIVEKIT_URL=wss://chat.bsilongevity.com:7880

# Feature Flags
VITE_ENABLE_CALLS=true
VITE_ENABLE_PUSH=true

# Analytics (optional)
VITE_SENTRY_DSN=https://...
VITE_GA_TRACKING_ID=UA-...

# Android Build (set in CI/CD)
KEYSTORE_FILE=/path/to/keystore.jks
KEYSTORE_PASSWORD=your_password
KEY_ALIAS=key_alias
KEY_PASSWORD=key_password
```

**Usage in Code:**
```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4443/api'
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:4443/ws'
```

---

## CI/CD Configuration

### .github/workflows/build.yml

**Location:** `.github/workflows/build.yml`  
**Purpose:** GitHub Actions CI/CD pipeline

```yaml
name: Build and Release

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20
      - run: npm ci
      - run: npm run typecheck
      - run: npm run lint
      - run: npm run build

  build-desktop:
    needs: test
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [windows-latest, macos-latest, ubuntu-latest]
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build
      - run: npm run build:electron
```

---

## Configuration Best Practices

### 1. Never Commit Secrets

```bash
# ❌ Never commit these files
.env
.env.local
*.keystore
*.jks
google-services.json (with real keys)
```

### 2. Use Environment Variables

```typescript
// ❌ Bad: Hardcoded
const API_URL = 'https://api.example.com'

// ✅ Good: Configurable
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4443/api'
```

### 3. Document Required Variables

Create `.env.example`:
```bash
# Required for development
VITE_API_URL=https://chat.bsilongevity.com:4443/api
VITE_WS_URL=wss://chat.bsilongevity.com:4443/ws

# Optional
VITE_ENABLE_CALLS=true
```

### 4. Validate Configuration on Startup

```typescript
// src/renderer/src/config/index.ts
const requiredEnvVars = ['VITE_API_URL', 'VITE_WS_URL']

for (const varName of requiredEnvVars) {
  if (!import.meta.env[varName]) {
    throw new Error(`Missing required environment variable: ${varName}`)
  }
}

export const config = {
  apiUrl: import.meta.env.VITE_API_URL,
  wsUrl: import.meta.env.VITE_WS_URL,
  livekitUrl: import.meta.env.VITE_LIVEKIT_URL
}
```

---

## Troubleshooting Configuration

### Issue: Path aliases not working

**Solution:** Check `tsconfig.json` and `vite.config.ts` match:
```typescript
// tsconfig.json
"paths": { "@/*": ["./src/renderer/src/*"] }

// vite.config.ts
alias: { '@': path.resolve(__dirname, './src/renderer/src') }
```

### Issue: Environment variables undefined

**Solution:** Prefix with `VITE_` for Vite to expose:
```bash
# ❌ Won't work
API_URL=...

# ✅ Works
VITE_API_URL=...
```

### Issue: TypeScript errors after config change

**Solution:** Restart TypeScript server (VS Code):
- `Ctrl+Shift+P` → "TypeScript: Restart TS Server"

---

*Keep configuration files up to date and documented as the project evolves.*
