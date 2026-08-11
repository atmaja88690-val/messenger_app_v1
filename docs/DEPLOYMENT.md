# Deployment Guide

## Overview

BSI Messenger can be deployed as:
1. **Desktop Application** (Windows, macOS, Linux) via Electron
2. **Android Application** via Capacitor

This guide covers building, signing, and distributing both platforms.

---

## Desktop Deployment (Electron)

### Build Configuration

**File:** `electron-builder.yml`

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

### Build Commands

```json
{
  "scripts": {
    "build": "npm run build:web && npm run build:electron",
    "build:web": "vite build",
    "build:electron": "electron-builder build --config electron-builder.yml",
    "build:win": "electron-builder --win --x64",
    "build:mac": "electron-builder --mac --universal",
    "build:linux": "electron-builder --linux"
  }
}
```

### Build Process

**1. Install Dependencies**
```bash
npm install
```

**2. Build Web Assets**
```bash
npm run build:web
# Output: dist/ directory
```

**3. Build Electron Application**

**Windows:**
```bash
npm run build:win
# Output: dist-electron/BSI Messenger-Setup-1.0.0.exe
```

**macOS:**
```bash
npm run build:mac
# Output:
# - dist-electron/BSI Messenger-1.0.0.dmg
# - dist-electron/BSI Messenger-1.0.0-mac.zip
```

**Linux:**
```bash
npm run build:linux
# Output:
# - dist-electron/BSI Messenger-1.0.0.AppImage
# - dist-electron/BSI Messenger-1.0.0.deb
```

### Code Signing

#### Windows Code Signing

**Requirements:**
- Code signing certificate (.pfx or .p12)
- Certificate password

**Configuration:**
```yaml
# electron-builder.yml
win:
  certificateFile: path/to/certificate.pfx
  certificatePassword: ${WIN_CSC_PASSWORD}
  sign: ./build/sign.js
```

**Environment Variables:**
```bash
# Set before building
$env:WIN_CSC_PASSWORD="your-certificate-password"
```

**Custom Signing Script (build/sign.js):**
```javascript
const { execSync } = require('child_process')
const path = require('path')

exports.default = async function(configuration) {
  const { path: filePath } = configuration
  
  // Use signtool.exe on Windows
  execSync(`signtool sign /f certificate.pfx /p ${process.env.WIN_CSC_PASSWORD} /tr http://timestamp.digicert.com /td sha256 /fd sha256 "${filePath}"`)
}
```

#### macOS Code Signing

**Requirements:**
- Apple Developer account
- Developer ID Application certificate
- App-specific password for notarization

**Configuration:**
```yaml
# electron-builder.yml
mac:
  hardenedRuntime: true
  entitlements: build/entitlements.mac.plist
  entitlementsInherit: build/entitlements.mac.plist
```

**Entitlements File (build/entitlements.mac.plist):**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>com.apple.security.cs.allow-jit</key>
  <true/>
  <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
  <true/>
  <key>com.apple.security.cs.disable-library-validation</key>
  <true/>
</dict>
</plist>
```

**Environment Variables:**
```bash
export APPLE_ID="your-apple-id@email.com"
export APPLE_ID_PASSWORD="app-specific-password"
export APPLE_TEAM_ID="your-team-id"
```

**Notarization:**
```bash
# electron-builder handles notarization automatically if env vars are set
npm run build:mac
```

### Auto-Update Configuration

**Using electron-updater:**

```typescript
// src/main/updater.ts
import { autoUpdater } from 'electron-updater'
import { app } from 'electron'

export function initializeAutoUpdater() {
  // Check for updates on startup
  app.whenReady().then(() => {
    autoUpdater.checkForUpdatesAndNotify()
  })

  // Check every 4 hours
  setInterval(() => {
    autoUpdater.checkForUpdatesAndNotify()
  }, 4 * 60 * 60 * 1000)

  autoUpdater.on('update-available', (info) => {
    console.log('Update available:', info.version)
  })

  autoUpdater.on('update-downloaded', (info) => {
    // Prompt user to restart
    dialog.showMessageBox({
      type: 'info',
      title: 'Update Ready',
      message: `Version ${info.version} has been downloaded. Restart to apply?`,
      buttons: ['Restart', 'Later']
    }).then((result) => {
      if (result.response === 0) {
        autoUpdater.quitAndInstall()
      }
    })
  })
}
```

**Update Server Configuration:**
```yaml
# electron-builder.yml
publish:
  provider: github
  owner: your-org
  repo: bsi-messenger
  releaseType: release
```

---

## Android Deployment

### Build Configuration

**File:** `android/app/build.gradle`

```gradle
android {
    defaultConfig {
        applicationId "com.bsi.messenger"
        minSdkVersion 24
        targetSdkVersion 34
        versionCode 1
        versionName "1.0.0"
    }
    
    signingConfigs {
        release {
            storeFile file(System.getenv("KEYSTORE_FILE") ?: "release.keystore")
            storePassword System.getenv("KEYSTORE_PASSWORD")
            keyAlias System.getenv("KEY_ALIAS")
            keyPassword System.getenv("KEY_PASSWORD")
        }
    }
    
    buildTypes {
        release {
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
            signingConfig signingConfigs.release
        }
    }
}
```

### Keystore Generation

**Create keystore (one-time setup):**
```bash
keytool -genkey -v -keystore release.keystore -alias bsi-messenger -keyalg RSA -keysize 2048 -validity 10000

# Enter details when prompted:
# - Password: (save securely!)
# - Name, Organization, etc.
```

**Store keystore securely** (never commit to git!):
```bash
# Move to secure location
mv release.keystore ~/.android/bsi-messenger-release.keystore

# Set environment variables
export KEYSTORE_FILE=~/.android/bsi-messenger-release.keystore
export KEYSTORE_PASSWORD=your_keystore_password
export KEY_ALIAS=bsi-messenger
export KEY_PASSWORD=your_key_password
```

### Build Process

**1. Build Web Assets**
```bash
npm run build
# Output: dist/ directory
```

**2. Sync to Capacitor**
```bash
npx cap sync android
# Copies dist/ to android/app/src/main/assets/public/
```

**3. Build APK**

**Debug Build:**
```bash
cd android
./gradlew assembleDebug
# Output: android/app/build/outputs/apk/debug/app-debug.apk
```

**Release Build:**
```bash
cd android
./gradlew assembleRelease
# Output: android/app/build/outputs/apk/release/app-release.apk
```

**4. Build AAB (for Play Store)**
```bash
cd android
./gradlew bundleRelease
# Output: android/app/build/outputs/bundle/release/app-release.aab
```

### APK/AAB Verification

**Verify signing:**
```bash
# Check APK signature
jarsigner -verify -verbose -certs android/app/build/outputs/apk/release/app-release.apk

# Check AAB signature
jarsigner -verify -verbose -certs android/app/build/outputs/bundle/release/app-release.aab
```

**Check APK details:**
```bash
aapt dump badging android/app/build/outputs/apk/release/app-release.apk
```

### ProGuard Configuration

**File:** `android/app/proguard-rules.pro`

```pro
# Keep Capacitor classes
-keep class com.getcapacitor.** { *; }
-keepclassmembers class com.getcapacitor.** { *; }

# Keep WebView JavaScript Interface
-keepattributes JavascriptInterface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep Firebase
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }

# Keep LiveKit (if used)
-keep class org.webrtc.** { *; }
-keep class io.livekit.** { *; }
```

---

## Continuous Integration (CI/CD)

### GitHub Actions Workflow

**File:** `.github/workflows/build.yml`

```yaml
name: Build and Release

on:
  push:
    tags:
      - 'v*'

jobs:
  build-desktop:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [windows-latest, macos-latest, ubuntu-latest]
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 20
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build Web
        run: npm run build:web
      
      - name: Build Electron (Windows)
        if: matrix.os == 'windows-latest'
        env:
          WIN_CSC_PASSWORD: ${{ secrets.WIN_CSC_PASSWORD }}
        run: npm run build:win
      
      - name: Build Electron (macOS)
        if: matrix.os == 'macos-latest'
        env:
          APPLE_ID: ${{ secrets.APPLE_ID }}
          APPLE_ID_PASSWORD: ${{ secrets.APPLE_ID_PASSWORD }}
        run: npm run build:mac
      
      - name: Build Electron (Linux)
        if: matrix.os == 'ubuntu-latest'
        run: npm run build:linux
      
      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: ${{ matrix.os }}-artifacts
          path: dist-electron/*

  build-android:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 20
      
      - name: Setup Java
        uses: actions/setup-java@v3
        with:
          distribution: 'temurin'
          java-version: '17'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build Web
        run: npm run build
      
      - name: Sync Capacitor
        run: npx cap sync android
      
      - name: Build Android APK
        env:
          KEYSTORE_PASSWORD: ${{ secrets.KEYSTORE_PASSWORD }}
          KEY_PASSWORD: ${{ secrets.KEY_PASSWORD }}
        run: |
          cd android
          ./gradlew assembleRelease
      
      - name: Upload APK
        uses: actions/upload-artifact@v3
        with:
          name: android-apk
          path: android/app/build/outputs/apk/release/app-release.apk
```

---

## Release Checklist

### Pre-Release

- [ ] Update version in `package.json`
- [ ] Update `CHANGELOG.md`
- [ ] Run full test suite
- [ ] Test on all target platforms
- [ ] Verify API connectivity
- [ ] Check for console errors/warnings
- [ ] Test auto-update mechanism
- [ ] Review security settings

### Desktop Release

- [ ] Build all platforms (Windows, macOS, Linux)
- [ ] Sign executables
- [ ] Notarize macOS builds
- [ ] Test installers on clean machines
- [ ] Upload to distribution server
- [ ] Update auto-updater manifest
- [ ] Create GitHub release with binaries

### Android Release

- [ ] Build signed APK/AAB
- [ ] Test on multiple devices/Android versions
- [ ] Verify ProGuard doesn't break functionality
- [ ] Test push notifications
- [ ] Upload to Google Play Console
- [ ] Submit for review
- [ ] Monitor crash reports after release

### Post-Release

- [ ] Monitor error tracking (Sentry, etc.)
- [ ] Check user feedback
- [ ] Verify auto-update works
- [ ] Update documentation
- [ ] Announce release (email, social media, etc.)

---

## Version Numbering

**Semantic Versioning:** `MAJOR.MINOR.PATCH`

- **MAJOR:** Breaking changes
- **MINOR:** New features (backwards compatible)
- **PATCH:** Bug fixes

**Examples:**
- `1.0.0` - Initial release
- `1.1.0` - Added group chat feature
- `1.1.1` - Fixed notification bug
- `2.0.0` - Redesigned UI (breaking change)

---

## Distribution

### Desktop

**Windows:**
- Direct download (.exe installer)
- Microsoft Store (optional)
- Chocolatey package (optional)

**macOS:**
- Direct download (.dmg)
- Mac App Store (optional)
- Homebrew cask (optional)

**Linux:**
- AppImage (universal)
- .deb package (Debian/Ubuntu)
- Snap package (optional)
- Flatpak (optional)

### Android

**Google Play Store:**
1. Create app listing
2. Upload AAB
3. Fill store details (description, screenshots)
4. Set pricing & distribution
5. Submit for review

**Direct Distribution (APK):**
- Host on website
- Users enable "Unknown sources"
- Download and install APK

---

## Troubleshooting

### Build Fails on Windows

```bash
# Clear cache
Remove-Item -Recurse -Force node_modules, dist, dist-electron
npm install
npm run build
```

### macOS Notarization Fails

```bash
# Check notarization status
xcrun altool --notarization-history 0 -u "$APPLE_ID" -p "$APPLE_ID_PASSWORD"

# View logs
xcrun altool --notarization-info <request-uuid> -u "$APPLE_ID" -p "$APPLE_ID_PASSWORD"
```

### Android Build Fails

```bash
# Clean Android build
cd android
./gradlew clean

# Rebuild
./gradlew assembleRelease --stacktrace
```

---

*For backend deployment, refer to the backend repository documentation.*
