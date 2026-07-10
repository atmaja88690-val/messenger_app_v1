import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import { API_URL, TOKEN_KEY, REFRESH_KEY } from '../config/constants'
import type { LoginResponse, AuthTokens, UserStatus, User } from '../types'
import {
  scheduleProactiveRefresh,
  clearProactiveRefresh,
  setRefreshing
} from './token-scheduler.service'

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let isReactiveRefreshing = false
let refreshQueue: Array<(token: string | null) => void> = []

function drainQueue(token: string | null) {
  refreshQueue.forEach((cb) => cb(token))
  refreshQueue = []
}

// Bedakan: apakah error refresh karena SERVER menolak (401/403 = token invalid)
// atau karena NETWORK (gak ada response = offline/timeout/DNS).
function isAuthRejection(err: unknown): boolean {
  const status = (err as { response?: { status?: number } })?.response?.status
  return status === 401 || status === 403
}

function hardLogout() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_KEY)
  clearProactiveRefresh()
  window.dispatchEvent(new Event('bsi:logout'))
}

/**
 * Refresh token.
 * - Sukses → simpan token baru, jadwalkan proaktif, return token.
 * - Gagal NETWORK → THROW (token DIPERTAHANKAN; akan dicoba lagi saat online/wake).
 * - Gagal AUTH (401/403) → hardLogout + return null (refresh token beneran invalid).
 */
async function performTokenRefresh(): Promise<string | null> {
  const storedRefresh = localStorage.getItem(REFRESH_KEY)
  if (!storedRefresh) {
    hardLogout()
    return null
  }

  try {
    const { data } = await axios.post<AuthTokens>(
      `${API_URL}/auth/refresh`,
      { refreshToken: storedRefresh },
      { timeout: 15000 }
    )
    localStorage.setItem(TOKEN_KEY, data.accessToken)
    localStorage.setItem(REFRESH_KEY, data.refreshToken)

    scheduleProactiveRefresh(data.accessToken, async () => {
      const newToken = await performTokenRefresh()
      if (newToken) {
        import('./ws.service').then(({ wsService }) => {
          wsService.reconnectNow()
        })
      }
    })

    return data.accessToken
  } catch (err) {
    if (isAuthRejection(err)) {
      // Server bilang refresh token invalid → logout beneran
      hardLogout()
      return null
    }
    // NETWORK error (offline/timeout/DNS) → JANGAN logout. Token dipertahankan.
    // Lempar ke pemanggil; token-scheduler akan retry saat online/wake.
    console.warn('[api] Refresh gagal karena network — token dipertahankan, akan dicoba lagi saat online.')
    throw err
  }
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config

    const isAuthEndpoint =
      original?.url?.includes('/auth/refresh') ||
      original?.url?.includes('/auth/logout')

    if (error.response?.status !== 401 || original._retry || isAuthEndpoint) {
      return Promise.reject(error)
    }

    const storedRefresh = localStorage.getItem(REFRESH_KEY)
    if (!storedRefresh) {
      hardLogout()
      return Promise.reject(error)
    }

    original._retry = true

    if (isReactiveRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push((token: string | null) => {
          if (!token) return reject(error)
          original.headers.Authorization = `Bearer ${token}`
          resolve(api(original))
        })
      })
    }

    isReactiveRefreshing = true
    setRefreshing(true)

    try {
      const newToken = await performTokenRefresh()
      if (!newToken) {
        drainQueue(null)
        return Promise.reject(error)
      }
      drainQueue(newToken)
      import('./ws.service').then(({ wsService }) => {
        wsService.reconnectNow()
      })
      original.headers.Authorization = `Bearer ${newToken}`
      return api(original)
    } catch (err) {
      // performTokenRefresh throw HANYA untuk network error.
      // Network → JANGAN logout; biarkan request gagal, app tetap login,
      // token-scheduler akan refresh saat online/wake.
      drainQueue(null)
      console.warn('[api] 401 + refresh gagal network — tetap login, menunggu online.')
      return Promise.reject(err)
    } finally {
      isReactiveRefreshing = false
      setRefreshing(false)
    }
  }
)

// Auth
export const authApi = {
  login: (username: string, password: string) =>
    api.post<LoginResponse>('/auth/login', { username, password }),
  logout: () =>
    axios.post(
      `${API_URL}/auth/logout`,
      {},
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY) ?? ''}`,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      }
    ).catch(() => {}),
  refresh: (refreshToken: string) =>
    api.post<AuthTokens>('/auth/refresh', { refreshToken })
}

// Users
export const usersApi = {
  me: () => api.get<{ user: User }>('/users/me'),
  // Field PERSIS sesuai PATCH /users/me backend (Zod-style validation di
  // users.routes.ts) -- BUKAN mengikuti interface User frontend yang lebih luas.
  // email SENGAJA TIDAK ADA -- backend tidak menerimanya di endpoint ini.
  // String kosong pada field opsional akan MENGHAPUS nilai (backend: trim().slice() || null).
  updateMe: (data: Partial<{
    displayName: string
    status: UserStatus
    firstName: string
    lastName: string
    nickname: string
    phone: string
    jobTitle: string
    jobDepartment: string
  }>) => api.patch('/users/me', data),
  uploadAvatar: (file: File) => {
    const form = new FormData()
    form.append('avatar', file)
    return api.post('/attachments/avatar', form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  }
}

// Admin — semua route di-guard requireAdmin() di backend.
// Frontend guard hanya untuk UX; backend tetap penentu keamanan.
export const adminApi = {
  listUsers: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get('/admin/users', { params }),
  stats: () => api.get('/admin/stats'),
  activate: (id: string) => api.patch(`/admin/users/${id}/activate`),
  deactivate: (id: string) => api.patch(`/admin/users/${id}/deactivate`),
  setAdmin: (id: string, isAdmin: boolean) =>
    api.patch(`/admin/users/${id}/set-admin`, { isAdmin }),
  createUser: (data: { username: string; displayName: string; password: string; email?: string }) =>
    api.post('/admin/users', data),
  updateUser: (
    id: string,
    data: { displayName?: string; username?: string; email?: string | null }
  ) => api.patch(`/admin/users/${id}`, data),
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),
  setPassword: (id: string, password: string) =>
    api.patch(`/admin/users/${id}/password`, { password })
}

// Direktori user untuk memulai percakapan (bukan admin-only).
// Backend hanya mengirim: id, username, displayName, avatarKey, status.
export const directoryApi = {
  list: (search?: string) =>
    api.get('/users', { params: search ? { search } : undefined })
}


// Conversations
export const conversationsApi = {
  list: () => api.get('/conversations'),
  // Kontrak backend (conversations.routes.ts): { targetUserId } dan { title, memberIds }.
  // Nama field lama ({ userId }, { name, userIds }) tidak cocok -> selalu 400.
  createDm: (targetUserId: string) => api.post('/conversations/dm', { targetUserId }),
  createGroup: (title: string, memberIds: string[]) =>
    api.post('/conversations/group', { title, memberIds })
}

// Messages
export interface AttachmentInput {
  storageKey: string
  fileName: string
  mimeType: string
  sizeBytes: number
  width?: number
  height?: number
}

export const messagesApi = {
  list: (convId: string, before?: string) =>
    api.get(`/messages/${convId}`, { params: before ? { before } : {} }),
  send: (
    convId: string,
    content: string,
    clientMsgId: string,
    opts?: { type?: 'TEXT' | 'IMAGE' | 'FILE' | 'AUDIO'; attachments?: AttachmentInput[] }
  ) =>
    api.post(`/messages/${convId}`, {
      content,
      clientMsgId,
      type: opts?.type ?? 'TEXT',
      ...(opts?.attachments ? { attachments: opts.attachments } : {})
    }),
  delete: (convId: string, messageId: string) =>
    api.delete(`/messages/${convId}/${messageId}`)
}

// Attachments — R3: stream via backend (BUKAN presigned URL)
export const attachmentsApi = {
  getFile: async (attachmentId: string): Promise<string> => {
    const res = await api.get(`/attachments/file/${attachmentId}`, {
      responseType: 'blob'
    })
    return URL.createObjectURL(res.data)
  },
  // Avatar -- R3 sama seperti getFile, tapi 404 (user belum punya avatar) BUKAN error;
  // dikembalikan sebagai null supaya pemanggil bisa fallback ke inisial huruf tanpa try/catch.
  // JANGAN di-cache global seperti blobCache di AttachmentImage.tsx -- avatarKey backend
  // deterministik per-user (avatars/{userId}.{ext}), jadi cache permanen bisa sajikan
  // avatar basi setelah user ganti foto. Cleanup blob URL jadi tanggung jawab komponen.
  getAvatar: async (userId: string): Promise<string | null> => {
    try {
      const res = await api.get(`/attachments/avatar/${userId}`, {
        responseType: 'blob'
      })
      return URL.createObjectURL(res.data)
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status
      if (status === 404) return null
      throw err
    }
  },
  // Upload file mentah ke conversation tertentu — balikan dipakai sebagai
  // entri attachments[] saat kirim pesan (messagesApi.send).
  upload: async (conversationId: string, file: File): Promise<AttachmentInput> => {
    const form = new FormData()
    form.append('file', file)
    const res = await api.post(`/attachments/upload/${conversationId}`, form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return res.data
  }
}

export default api

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    isReactiveRefreshing = false
    refreshQueue = []
  })
}
