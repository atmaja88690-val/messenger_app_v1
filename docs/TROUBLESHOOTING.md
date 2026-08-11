# Troubleshooting Guide

## Common Issues and Solutions

This guide covers common problems encountered during development and deployment of BSI Messenger, along with their solutions.

---

## Development Issues

### 1. Dependencies Won't Install

**Symptom:**
```
npm ERR! code ERESOLVE
npm ERR! ERESOLVE unable to resolve dependency tree
```

**Solutions:**

**A. Clear npm cache:**
```bash
npm cache clean --force
Remove-Item -Recurse -Force node_modules, package-lock.json
npm install
```

**B. Use legacy peer deps (if necessary):**
```bash
npm install --legacy-peer-deps
```

**C. Check Node.js version:**
```bash
node --version  # Should be 20.x
npm --version   # Should be 10.x
```

**D. Use correct package manager:**
```bash
# This project uses npm, not yarn or pnpm
npm install
```

---

### 2. TypeScript Errors

**Symptom:**
```
error TS2304: Cannot find name 'Message'
error TS2345: Argument of type 'string' is not assignable to parameter of type 'User'
```

**Solutions:**

**A. Check imports:**
```typescript
// ❌ Wrong
import { Message } from './types'

// ✅ Correct
import type { Message } from '../types'
```

**B. Run type checking:**
```bash
npm run typecheck
```

**C. Restart TypeScript server in VS Code:**
- Press `Ctrl+Shift+P`
- Type "TypeScript: Restart TS Server"
- Press Enter

**D. Check tsconfig.json:**
```json
{
  "compilerOptions": {
    "strict": true,
    "skipLibCheck": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

---

### 3. Vite Dev Server Issues

**Symptom:**
```
Error: Failed to resolve entry for package "react"
```

**Solutions:**

**A. Clear Vite cache:**
```bash
Remove-Item -Recurse -Force node_modules\.vite
npm run dev
```

**B. Check vite.config.ts:**
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
  }
})
```

**C. Port already in use:**
```bash
# Check what's using port 5173
netstat -ano | findstr :5173

# Kill process (replace PID)
taskkill /PID <PID> /F

# Or change port in vite.config.ts
server: {
  port: 5174
}
```

---

### 4. Hot Module Replacement (HMR) Not Working

**Symptom:** Changes not reflected without full reload

**Solutions:**

**A. Check file extensions:**
```typescript
// Must be .tsx for components with JSX
export const MyComponent = () => <div>...</div>
```

**B. Restart dev server:**
```bash
# Ctrl+C to stop
npm run dev
```

**C. Check for syntax errors:**
- Open browser console
- Look for errors preventing HMR

---

## Backend Connection Issues

### 5. Cannot Connect to API

**Symptom:**
```
Error: Network Error
Error: connect ECONNREFUSED 127.0.0.1:4443
```

**Solutions:**

**A. Check backend is running:**
```bash
# Test API endpoint
curl https://chat.bsilongevity.com:4443/api/health

# Or in PowerShell
Invoke-WebRequest -Uri https://chat.bsilongevity.com:4443/api/health
```

**B. Check API URL configuration:**
```typescript
// src/renderer/src/config/index.ts
export const API_URL = import.meta.env.VITE_API_URL || 'https://chat.bsilongevity.com:4443/api'
```

**C. Check CORS configuration (backend):**
```javascript
// Backend should allow your origin
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}))
```

**D. SSL certificate issues:**
```typescript
// For development only - ignore SSL errors
import https from 'https'

const agent = new https.Agent({
  rejectUnauthorized: false
})

axios.create({
  httpsAgent: agent
})
```

---

### 6. WebSocket Connection Fails

**Symptom:**
```
WebSocket connection to 'wss://...' failed
```

**Solutions:**

**A. Check WebSocket URL:**
```typescript
// Should use wss:// for HTTPS, ws:// for HTTP
const WS_URL = 'wss://chat.bsilongevity.com:4443/ws'
```

**B. Check backend WebSocket server:**
```bash
# Test with wscat
npm install -g wscat
wscat -c wss://chat.bsilongevity.com:4443/ws
```

**C. Check firewall:**
- Ensure port 4443 is open
- Check Windows Firewall settings
- Check router/corporate firewall

**D. Check authentication:**
```typescript
// WebSocket may require auth token
const ws = new WebSocket(`${WS_URL}?userId=${userId}`)
```

---

## Electron Issues

### 7. Electron App Won't Start

**Symptom:**
```
Error: Electron failed to install correctly
```

**Solutions:**

**A. Reinstall Electron:**
```bash
Remove-Item -Recurse -Force node_modules\electron
npm install electron --save-dev
```

**B. Check Electron binary:**
```bash
.\node_modules\.bin\electron --version
```

**C. Run in development mode:**
```bash
npm run dev
# Then in another terminal:
npm run electron:dev
```

**D. Check for errors in main process:**
```bash
# Add console.log in src/main/index.ts
console.log('Main process starting...')
```

---

### 8. IPC Communication Not Working

**Symptom:** Renderer can't call main process functions

**Solutions:**

**A. Check preload script:**
```typescript
// src/main/preload.ts
import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electron', {
  sendMessage: (channel: string, data: any) => {
    ipcRenderer.send(channel, data)
  }
})
```

**B. Check main process handler:**
```typescript
// src/main/index.ts
import { ipcMain } from 'electron'

ipcMain.on('my-channel', (event, data) => {
  console.log('Received:', data)
})
```

**C. Use in renderer:**
```typescript
// Check window.electron exists
if (window.electron) {
  window.electron.sendMessage('my-channel', { test: true })
}
```

---

## Android Issues

### 9. APK Won't Install

**Symptom:**
```
App not installed
Installation failed
```

**Solutions:**

**A. Enable Unknown Sources:**
- Settings → Security
- Enable "Unknown sources" or "Install unknown apps"

**B. Check minimum SDK version:**
```gradle
// android/app/build.gradle
minSdkVersion 24  // Android 7.0+
```

**C. Check APK signature:**
```bash
jarsigner -verify -verbose android/app/build/outputs/apk/debug/app-debug.apk
```

**D. Uninstall old version:**
```bash
adb uninstall com.bsi.messenger
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

---

### 10. Push Notifications Not Working

**Symptom:** FCM notifications not received

**Solutions:**

**A. Check google-services.json:**
```bash
# File must exist at:
android/app/google-services.json

# Verify package name matches
cat android/app/google-services.json | grep package_name
```

**B. Check Firebase configuration:**
- Firebase Console → Project Settings
- Verify SHA-1/SHA-256 fingerprints added
- Check FCM API is enabled

**C. Get SHA-1 fingerprint:**
```bash
cd android
./gradlew signingReport
```

**D. Test FCM token generation:**
```typescript
import { PushNotifications } from '@capacitor/push-notifications'

PushNotifications.addListener('registration', (token) => {
  console.log('FCM Token:', token.value)
})
```

**E. Send test notification:**
- Firebase Console → Cloud Messaging
- Send test message
- Enter FCM token

---

### 11. WebView Shows Blank Screen

**Symptom:** Android app opens but shows white/blank screen

**Solutions:**

**A. Check assets copied:**
```bash
# Should contain index.html
ls android/app/src/main/assets/public/

# Re-sync if missing
npx cap sync android
```

**B. Check server URL in capacitor.config.ts:**
```typescript
// Should NOT have server.url in production
const config: CapacitorConfig = {
  appId: 'com.bsi.messenger',
  appName: 'BSI Messenger',
  webDir: 'dist/renderer',
  // Remove server.url for production!
}
```

**C. Check WebView console:**
```bash
# View WebView logs
adb logcat | grep chromium
```

**D. Enable WebView debugging:**
```java
// android/app/src/main/java/.../MainActivity.java
import android.webkit.WebView;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    WebView.setWebContentsDebuggingEnabled(true);
  }
}
```

Then open `chrome://inspect` in Chrome to debug.

---

## Build Issues

### 12. Electron Build Fails

**Symptom:**
```
Error: Application entry file "dist-electron/main.js" does not exist
```

**Solutions:**

**A. Build in correct order:**
```bash
# 1. Build web first
npm run build:web

# 2. Then build electron
npm run build:electron
```

**B. Check output directories:**
```bash
# Should exist:
ls dist/              # Web assets
ls dist-electron/     # Electron main process
```

**C. Clean build:**
```bash
Remove-Item -Recurse -Force dist, dist-electron
npm run build
```

---

### 13. Android Build Fails

**Symptom:**
```
Execution failed for task ':app:mergeReleaseResources'
```

**Solutions:**

**A. Clean Gradle cache:**
```bash
cd android
./gradlew clean
./gradlew assembleRelease --stacktrace
```

**B. Check Java version:**
```bash
java -version  # Should be Java 17
```

**C. Update Gradle:**
```bash
# android/gradle/wrapper/gradle-wrapper.properties
distributionUrl=https\://services.gradle.org/distributions/gradle-8.0-all.zip
```

**D. Check for resource conflicts:**
```bash
# Look for duplicate resource IDs in error logs
# Remove conflicting resources
```

---

## Performance Issues

### 14. App Feels Slow/Laggy

**Solutions:**

**A. Check React DevTools Profiler:**
- Install React DevTools extension
- Record a profile
- Look for slow components

**B. Optimize re-renders:**
```typescript
// Use React.memo for expensive components
export const MessageList = React.memo(({ messages }) => {
  return <div>...</div>
}, (prev, next) => {
  // Custom comparison
  return prev.messages.length === next.messages.length
})
```

**C. Virtualize long lists:**
```typescript
import { Virtuoso } from 'react-virtuoso'

<Virtuoso
  data={messages}
  itemContent={(index, message) => <MessageItem message={message} />}
/>
```

**D. Debounce expensive operations:**
```typescript
import { useDebouncedCallback } from 'use-debounce'

const handleSearch = useDebouncedCallback((query) => {
  // Expensive search
}, 300)
```

---

### 15. High Memory Usage

**Solutions:**

**A. Check for memory leaks:**
```typescript
// Cleanup subscriptions
useEffect(() => {
  const subscription = api.subscribe(...)
  
  return () => {
    subscription.unsubscribe()
  }
}, [])
```

**B. Limit stored messages:**
```typescript
// In messages store
const MAX_MESSAGES = 100

addMessage: (message) => set((state) => {
  const messages = [...state.messages, message]
  return {
    messages: messages.slice(-MAX_MESSAGES)
  }
})
```

**C. Clear unused assets:**
```typescript
// Revoke object URLs when done
URL.revokeObjectURL(imageUrl)
```

---

## Database Issues

### 16. Database Connection Errors (Backend)

**Symptom:**
```
Error: connect ECONNREFUSED ::1:5432
```

**Solutions:**

**A. Check PostgreSQL is running:**
```bash
# Windows (run as admin)
Get-Service -Name postgresql*
Start-Service postgresql-x64-14
```

**B. Check connection string:**
```bash
# .env file
DATABASE_URL=postgresql://user:password@localhost:5432/bsi_messenger
```

**C. Test connection:**
```bash
psql -U postgres -d bsi_messenger
```

---

## Getting Additional Help

### Debug Tools

**1. Browser DevTools:**
- Console: Check for errors
- Network: Monitor API calls
- Application: Check localStorage/cookies

**2. React DevTools:**
- Components: Inspect component tree
- Profiler: Analyze performance

**3. Redux DevTools (if using Redux):**
- Monitor state changes
- Time-travel debugging

### Log Locations

**Electron:**
```
Windows: %APPDATA%\bsi-messenger\logs\
macOS: ~/Library/Logs/bsi-messenger/
Linux: ~/.config/bsi-messenger/logs/
```

**Android:**
```bash
adb logcat | grep BSIMessenger
```

### Support Channels

1. Check documentation (this folder)
2. Search GitHub Issues
3. Ask team on Slack/Discord
4. Create GitHub Issue with:
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots/logs
   - Environment details

---

*Keep this document updated with new issues and solutions as they are discovered.*
