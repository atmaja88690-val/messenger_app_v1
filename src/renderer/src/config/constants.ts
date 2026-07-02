// Dev: path relatif → lewat Vite proxy (same-origin, no CORS, backend tak disentuh).
// Prod (.exe terpaket): absolut ke backend langsung.
const DEV = import.meta.env.DEV

export const API_URL = DEV ? '/api' : 'https://chat.bsilongevity.com:4443/api'
export const WS_URL = DEV
  ? `ws://${location.host}/ws`
  : 'wss://chat.bsilongevity.com:4443/ws'

export const TOKEN_KEY = 'bsi_access_token'
export const REFRESH_KEY = 'bsi_refresh_token'

// UTANG TEKNIS: avatar lewat path /minio/ (bug SignatureDoesNotMatch yg sama).
// Wajib blob-fetch + auth, jangan <img src> langsung. Tangani saat avatar dikerjakan.
export const AVATAR_BASE = 'https://chat.bsilongevity.com/minio/bsichat-avatars'
