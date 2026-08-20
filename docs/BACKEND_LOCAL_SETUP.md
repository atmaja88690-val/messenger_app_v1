# Backend Local Setup Guide
## Menjalankan Backend BSI Messenger di Laptop Lokal

**Created:** August 10, 2026  
**Purpose:** Panduan lengkap untuk setup backend BSI Messenger di development environment lokal

---

## 📋 Analisis Backend Saat Ini

### Backend Architecture (Production)

**Server:** `chat.bsilongevity.com:4443`  
**Location:** Linux server dengan container Incus  
**Components:**
- REST API Server (Node.js/Express atau similar)
- WebSocket Server (real-time messaging)
- PostgreSQL Database
- MinIO Object Storage (untuk file attachments)
- LiveKit SFU Server (untuk audio/video calls) - Port 7880
- Redis (optional - untuk caching/sessions)

**Frontend Connection:**
```typescript
// Production Backend
const BACKEND_ORIGIN = 'https://chat.bsilongevity.com:4443'
const BACKEND_WS_ORIGIN = 'wss://chat.bsilongevity.com:4443'
```

---

## ✅ APAKAH BISA DI LAPTOP LOKAL?

### **Jawaban: YA, SANGAT BISA!**

Anda sudah punya infrastruktur yang tepat:
- ✅ **Laragon** - Web server local (Apache/Nginx)
- ✅ **PostgreSQL** - Database server
- ✅ **Windows** - OS yang kompatibel

**Yang masih perlu:**
1. Backend application code (Node.js/Express server)
2. MinIO server (untuk file storage)
3. LiveKit server (untuk video calls)
4. Redis (optional, untuk optimization)

---

## 🔧 Prerequisites yang Sudah Ada

### 1. Laragon ✅
**Fungsi:** Development environment manager  
**Includes:** 
- Apache/Nginx
- PHP (tidak digunakan untuk backend ini)
- MySQL (bisa diabaikan, kita pakai PostgreSQL)
- Node.js (bisa di-manage via Laragon)

**Status:** Sudah terinstall ✅

### 2. PostgreSQL ✅
**Fungsi:** Relational database  
**Port Default:** 5432  
**Status:** Sudah terinstall ✅

**Verifikasi:**
```powershell
# Check PostgreSQL service
Get-Service -Name postgresql*

# Test connection
psql -U postgres -h localhost
```

---

## 📦 Yang Perlu Diinstall

### 1. Node.js 20.x LTS (Critical)

**Mengapa?** Backend BSI Messenger kemungkinan besar menggunakan Node.js + Express

**Install via Laragon:**
```
1. Buka Laragon
2. Menu -> Tools -> Quick Add -> Node.js
3. Pilih versi 20.x LTS
4. Restart Laragon
```

**Atau manual download:**
- https://nodejs.org/ → Download LTS (v20.x)
- Install dengan pilihan "Add to PATH"

**Verifikasi:**
```powershell
node --version   # Should show v20.x.x
npm --version    # Should show v10.x.x
```

---

### 2. MinIO Server (Critical untuk File Upload)

**Fungsi:** S3-compatible object storage untuk attachments (images, files, audio)

**Download:**
```powershell
# Download MinIO Windows executable
Invoke-WebRequest -Uri "https://dl.min.io/server/minio/release/windows-amd64/minio.exe" -OutFile "C:\minio\minio.exe"

# Create data directory
New-Item -ItemType Directory -Path "C:\minio\data" -Force
```

**Konfigurasi:**
```powershell
# Create .env atau config
$env:MINIO_ROOT_USER="minioadmin"
$env:MINIO_ROOT_PASSWORD="minioadmin123"

# Run MinIO server
cd C:\minio
.\minio.exe server .\data --console-address ":9001"
```

**MinIO Console:** http://localhost:9001  
**API Endpoint:** http://localhost:9000

**Buat Bucket:**
```
1. Login ke http://localhost:9001
2. Username: minioadmin
3. Password: minioadmin123
4. Buat bucket: "bsi-chat-attachments"
5. Set policy: Public atau Private (sesuai kebutuhan)
```

---

### 3. LiveKit Server (Critical untuk Voice/Video Calls)

**Fungsi:** WebRTC SFU (Selective Forwarding Unit) untuk audio/video calls

**Download:**
```powershell
# Download LiveKit Windows executable (latest version)
# Visit: https://github.com/livekit/livekit/releases

# Extract ke folder
C:\livekit\livekit-server.exe
```

**Konfigurasi:**

Create `C:\livekit\config.yaml`:
```yaml
port: 7880
bind_addresses:
  - "0.0.0.0"

rtc:
  port_range_start: 50000
  port_range_end: 60000
  use_external_ip: false

keys:
  # Generate your own API key/secret
  devkey: APIseCretKeyForLocalDevelopment123

logging:
  level: info
```

**Generate API Key/Secret:**
```powershell
# Generate random strings (use PowerShell)
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

**Run LiveKit:**
```powershell
cd C:\livekit
.\livekit-server.exe --config config.yaml
```

**Verify:** http://localhost:7880 (should show LiveKit running)

---

### 4. Redis (Optional tapi Recommended)

**Fungsi:** 
- Session storage
- WebSocket connection tracking
- Message queue
- Rate limiting

**Install via Memurai (Redis for Windows):**
```powershell
# Download Memurai from https://www.memurai.com/get-memurai
# Or use Redis via WSL2

# Via Chocolatey (if installed)
choco install memurai-developer

# Default port: 6379
```

**Test Redis:**
```powershell
redis-cli ping
# Should respond: PONG
```

---

## 🏗️ Backend Application Setup

### Struktur Backend (Asumsi)

```
bsi-chat-backend/
├── src/
│   ├── index.ts/js          # Entry point
│   ├── routes/              # API routes
│   ├── controllers/         # Business logic
│   ├── services/            # External services (DB, MinIO, LiveKit)
│   ├── middleware/          # Auth, validation, error handling
│   ├── models/              # Database models
│   └── websocket/           # WebSocket handlers
├── .env                     # Environment variables
├── package.json
└── tsconfig.json
```

### Environment Variables (.env)

Create `.env` file di root backend:

```env
# Server
NODE_ENV=development
PORT=4443
HOST=localhost

# Database (PostgreSQL via Laragon)
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/bsi_messenger
# Or separate vars:
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_NAME=bsi_messenger

# JWT Secrets
JWT_SECRET=your_very_long_random_secret_key_change_this_in_production
JWT_REFRESH_SECRET=another_very_long_random_secret_key_for_refresh_tokens
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# MinIO (Object Storage)
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123
MINIO_BUCKET=bsi-chat-attachments

# LiveKit (WebRTC)
LIVEKIT_HOST=http://localhost:7880
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=APIseCretKeyForLocalDevelopment123

# Redis (Optional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# CORS
CORS_ORIGIN=http://localhost:5173,http://localhost:3000
```

### Database Setup

**1. Create Database:**
```sql
-- Connect to PostgreSQL
psql -U postgres -h localhost

-- Create database
CREATE DATABASE bsi_messenger;

-- Connect to database
\c bsi_messenger

-- Import schema (jika ada file SQL dump)
\i path/to/schema.sql
```

**2. Import Existing Data (Optional):**
Jika ada backup dari production:
```powershell
# Restore from backup
psql -U postgres -h localhost -d bsi_messenger < backup.sql
```

### Install Backend Dependencies

```powershell
cd path/to/bsi-chat-backend

# Install dependencies
npm install

# Or if using yarn
yarn install

# Install common backend packages (if needed)
npm install express cors helmet morgan compression
npm install jsonwebtoken bcryptjs
npm install ws socket.io  # For WebSocket
npm install pg pg-hstore  # PostgreSQL client
npm install minio  # MinIO SDK
npm install livekit-server-sdk  # LiveKit SDK
npm install ioredis  # Redis client (optional)
npm install dotenv  # Environment variables

# Development dependencies
npm install -D typescript @types/node @types/express
npm install -D ts-node nodemon
npm install -D eslint prettier
```

---

## 🚀 Running Backend Locally

### 1. Start All Services

**Terminal 1 - PostgreSQL (via Laragon):**
```powershell
# Laragon biasanya auto-start PostgreSQL
# Atau manual:
pg_ctl -D "C:\laragon\data\postgresql\13\data" start
```

**Terminal 2 - MinIO:**
```powershell
cd C:\minio
.\minio.exe server .\data --console-address ":9001"
```

**Terminal 3 - LiveKit:**
```powershell
cd C:\livekit
.\livekit-server.exe --config config.yaml
```

**Terminal 4 - Redis (Optional):**
```powershell
redis-server
# Or if using Memurai:
memurai
```

**Terminal 5 - Backend Application:**
```powershell
cd path/to/bsi-chat-backend

# Development mode with hot reload
npm run dev

# Or production mode
npm run build
npm start
```

### 2. Verify Backend is Running

**Test REST API:**
```powershell
curl http://localhost:4443/api/health
# Or
Invoke-WebRequest -Uri "http://localhost:4443/api/health"
```

**Test WebSocket:**
```javascript
// Browser console
const ws = new WebSocket('ws://localhost:4443/ws?userId=test')
ws.onopen = () => console.log('Connected')
ws.onmessage = (e) => console.log('Message:', e.data)
```

**Test MinIO:**
```powershell
curl http://localhost:9000/minio/health/live
```

**Test LiveKit:**
```powershell
curl http://localhost:7880
```

---

## 🔧 Frontend Configuration untuk Local Backend

### Update Frontend to Use Local Backend

**Option 1: Environment Variable (Recommended)**

Create `.env.local` di root frontend project:
```env
VITE_API_URL=http://localhost:4443/api
VITE_WS_URL=ws://localhost:4443/ws
VITE_LIVEKIT_URL=http://localhost:7880
```

**Option 2: Update Code Directly**

Edit `src/main/local-server.ts`:
```typescript
// Change from production to local
const BACKEND_ORIGIN = 'http://localhost:4443'
const BACKEND_WS_ORIGIN = 'ws://localhost:4443'
```

### Restart Frontend

```powershell
# Development mode
npm run dev

# Electron desktop app
npm run dev
# In another terminal:
npm run dev:electron
```

---

## 🧪 Testing Setup

### 1. Test Authentication
```powershell
# Register new user
curl -X POST http://localhost:4443/api/auth/register `
  -H "Content-Type: application/json" `
  -d '{"username":"testuser","password":"Test123!","displayName":"Test User"}'

# Login
curl -X POST http://localhost:4443/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{"username":"testuser","password":"Test123!"}'
```

### 2. Test File Upload
```powershell
# Upload attachment
curl -X POST http://localhost:4443/api/upload `
  -H "Authorization: Bearer YOUR_TOKEN" `
  -F "file=@C:\path\to\image.jpg"
```

### 3. Test WebSocket Connection
Open browser console and run:
```javascript
const ws = new WebSocket('ws://localhost:4443/ws?userId=YOUR_USER_ID')
ws.onopen = () => {
  console.log('WebSocket connected')
  ws.send(JSON.stringify({ type: 'ping' }))
}
ws.onmessage = (e) => console.log('Received:', e.data)
```

---

## 🐛 Troubleshooting

### Issue 1: PostgreSQL Connection Refused

**Symptom:**
```
Error: connect ECONNREFUSED ::1:5432
```

**Solution:**
```powershell
# Check if PostgreSQL is running
Get-Service -Name postgresql*

# Start if not running
Start-Service postgresql-x64-13  # Adjust version number

# Test connection
psql -U postgres -h localhost
```

### Issue 2: MinIO Access Denied

**Symptom:**
```
MinIO error: Access Denied
```

**Solution:**
1. Check credentials in `.env` match MinIO setup
2. Verify bucket exists and has correct permissions
3. Set bucket policy to public-read untuk testing:
```powershell
# Using MinIO Client (mc)
mc alias set local http://localhost:9000 minioadmin minioadmin123
mc policy set download local/bsi-chat-attachments
```

### Issue 3: LiveKit Connection Failed

**Symptom:**
```
LiveKit connection error
```

**Solution:**
1. Check LiveKit server is running: `http://localhost:7880`
2. Verify API key/secret in `.env` matches `config.yaml`
3. Check firewall allows port 7880
4. Verify RTC port range (50000-60000) is not blocked

### Issue 4: CORS Errors

**Symptom:**
```
Access to XMLHttpRequest blocked by CORS policy
```

**Solution:**

Add to backend CORS config:
```javascript
// backend/src/index.ts
app.use(cors({
  origin: [
    'http://localhost:5173',  // Vite dev server
    'http://localhost:3000',  // Alternative port
    'http://127.0.0.1:*'      // Electron local proxy
  ],
  credentials: true
}))
```

### Issue 5: Port Already in Use

**Symptom:**
```
Error: listen EADDRINUSE: address already in use :::4443
```

**Solution:**
```powershell
# Find process using port
netstat -ano | findstr :4443

# Kill process (replace PID)
taskkill /PID <PID> /F

# Or change port in .env
PORT=4444
```

---

## 📊 Service Status Checklist

Before starting development, verify all services:

- [ ] **PostgreSQL** - Running on port 5432
  ```powershell
  psql -U postgres -h localhost -c "SELECT version();"
  ```

- [ ] **MinIO** - Running on port 9000
  ```powershell
  curl http://localhost:9000/minio/health/live
  ```

- [ ] **LiveKit** - Running on port 7880
  ```powershell
  curl http://localhost:7880
  ```

- [ ] **Redis** (Optional) - Running on port 6379
  ```powershell
  redis-cli ping
  ```

- [ ] **Backend API** - Running on port 4443
  ```powershell
  curl http://localhost:4443/api/health
  ```

- [ ] **Frontend Dev** - Running on port 5173
  ```powershell
  curl http://localhost:5173
  ```

---

## 🔄 Development Workflow

### Daily Startup

**Option A: Manual Startup**
```powershell
# 1. Start Laragon (will start PostgreSQL automatically)
# Start-Laragon.exe

# 2. Start MinIO
cd C:\minio
.\minio.exe server .\data --console-address ":9001"

# 3. Start LiveKit
cd C:\livekit
.\livekit-server.exe --config config.yaml

# 4. Start Backend
cd path\to\bsi-chat-backend
npm run dev

# 5. Start Frontend
cd path\to\bsi-messenger
npm run dev
```

**Option B: Create Startup Script**

Create `start-dev.ps1`:
```powershell
# Start-Dev.ps1
Write-Host "Starting BSI Messenger Development Environment..." -ForegroundColor Green

# Start MinIO
Start-Process -FilePath "C:\minio\minio.exe" -ArgumentList "server", "C:\minio\data", "--console-address", ":9001"
Write-Host "✓ MinIO started" -ForegroundColor Green

# Start LiveKit
Start-Process -FilePath "C:\livekit\livekit-server.exe" -ArgumentList "--config", "config.yaml"
Write-Host "✓ LiveKit started" -ForegroundColor Green

# Start Backend
Start-Process PowerShell -ArgumentList "-NoExit", "-Command", "cd 'C:\path\to\backend'; npm run dev"
Write-Host "✓ Backend starting..." -ForegroundColor Green

# Start Frontend
Start-Sleep -Seconds 5
Start-Process PowerShell -ArgumentList "-NoExit", "-Command", "cd 'C:\path\to\frontend'; npm run dev"
Write-Host "✓ Frontend starting..." -ForegroundColor Green

Write-Host "`nAll services started! Check individual terminals for logs." -ForegroundColor Cyan
```

Run: `.\start-dev.ps1`

---

## 📝 Summary Checklist

### Yang Sudah Ada ✅
- [x] Laragon (web server environment)
- [x] PostgreSQL (database)
- [x] Windows OS

### Yang Perlu Diinstall 📦
- [ ] Node.js 20.x LTS (via Laragon atau standalone)
- [ ] MinIO Server (object storage untuk files)
- [ ] LiveKit Server (WebRTC untuk video calls)
- [ ] Redis (optional, untuk performance)
- [ ] Backend application code (dari repository)

### Setup Steps 🔧
1. [ ] Install Node.js 20.x
2. [ ] Download & configure MinIO
3. [ ] Download & configure LiveKit
4. [ ] Install Redis (optional)
5. [ ] Clone backend repository
6. [ ] Create `.env` file dengan config local
7. [ ] Install backend dependencies (`npm install`)
8. [ ] Create database di PostgreSQL
9. [ ] Import database schema
10. [ ] Start all services
11. [ ] Update frontend config untuk point ke localhost
12. [ ] Test connections

### Verification ✓
- [ ] PostgreSQL accessible (port 5432)
- [ ] MinIO console accessible (http://localhost:9001)
- [ ] LiveKit accessible (http://localhost:7880)
- [ ] Backend API responding (http://localhost:4443/api/health)
- [ ] WebSocket connecting (ws://localhost:4443/ws)
- [ ] Frontend dapat login
- [ ] Messages terkirim real-time
- [ ] File upload berhasil
- [ ] Voice/video call connect

---

## 💡 Pro Tips

1. **Use WSL2 for Better Performance** (Optional):
   - Install Ubuntu via WSL2
   - Run PostgreSQL, MinIO, LiveKit di Linux
   - Better performance dan compatibility

2. **Docker Compose** (Advanced):
   - Package semua services dalam Docker
   - One-command startup: `docker-compose up`
   - Easier to share setup dengan team

3. **VS Code Multi-Root Workspace**:
   - Buka backend dan frontend dalam satu workspace
   - Integrated terminal untuk semua services
   - Debugging frontend + backend simultaneous

4. **Database GUI Tools**:
   - **pgAdmin 4** - PostgreSQL management
   - **DBeaver** - Universal database tool
   - Easier untuk query dan inspect data

---

## 🆘 Getting Help

Jika mengalami kendala:

1. **Check Logs:**
   - Backend: `npm run dev` output
   - MinIO: Console at http://localhost:9001
   - LiveKit: Terminal output
   - Frontend: Browser DevTools Console

2. **Common Issues:**
   - Port conflicts → Change ports in config
   - Permission denied → Run as Administrator
   - Connection refused → Check service is running
   - CORS errors → Update backend CORS config

3. **Ask for Help:**
   - Include error messages
   - List all service statuses
   - Share relevant config files (without secrets!)

---

**KESIMPULAN: Backend BSI Messenger BISA dan MUDAH dijalankan di laptop lokal dengan Laragon + PostgreSQL yang sudah ada. Tinggal install Node.js, MinIO, LiveKit, dan configure backend code untuk development environment.** 🚀
