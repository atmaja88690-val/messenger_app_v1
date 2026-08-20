import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { usersApi } from '../../services/api.service'
import { useAuthStore } from '../../stores/auth.store'
import Avatar from '../chat/Avatar'

interface UserProfileDialogProps {
  onClose: () => void
}

// 7 field editable — PERSIS whitelist PATCH /users/me backend.
// maxLength disamakan dengan slice() backend agar tidak ada truncation senyap:
//   displayName/firstName/lastName/nickname = 64, phone = 32, jobTitle/jobDepartment = 128.
// status SENGAJA tidak ada di form -> tak pernah dirty -> tak pernah terkirim
//   -> tak memicu broadcast presence Redis. email/username read-only (backend membuangnya).
interface ProfileForm {
  displayName: string
  firstName: string
  lastName: string
  nickname: string
  phone: string
  jobTitle: string
  jobDepartment: string
}

const EMPTY_FORM: ProfileForm = {
  displayName: '',
  firstName: '',
  lastName: '',
  nickname: '',
  phone: '',
  jobTitle: '',
  jobDepartment: ''
}

const MAXLEN: Record<keyof ProfileForm, number> = {
  displayName: 64,
  firstName: 64,
  lastName: 64,
  nickname: 64,
  phone: 32,
  jobTitle: 128,
  jobDepartment: 128
}

const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_AVATAR_BYTES = 5 * 1024 * 1024

export default function UserProfileDialog({ onClose }: UserProfileDialogProps) {
  const me = useAuthStore((s) => s.user)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [avatarError, setAvatarError] = useState<string | null>(null)

  const [form, setForm] = useState<ProfileForm>(EMPTY_FORM)
  // initial disimpan terpisah untuk dirty-tracking: hanya field yang berbeda
  // dari initial yang dikirim ke PATCH. Field yang dikosongkan (isi -> '') juga
  // dianggap dirty dan dikirim sebagai '' -> backend meng-null-kan (trim().slice() || null).
  const [initial, setInitial] = useState<ProfileForm>(EMPTY_FORM)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // read-only, hanya untuk ditampilkan
  const [email, setEmail] = useState<string>('')
  const [username, setUsername] = useState<string>('')

  // login() TIDAK membawa field profil (firstName dst = undefined).
  // WAJIB fetch usersApi.me() saat mount.
  useEffect(() => {
    let cancelled = false
    usersApi
      .me()
      .then(({ data }) => {
        if (cancelled) return
        const u = data.user
        const loaded: ProfileForm = {
          displayName: u.displayName ?? '',
          firstName: u.firstName ?? '',
          lastName: u.lastName ?? '',
          nickname: u.nickname ?? '',
          phone: u.phone ?? '',
          jobTitle: u.jobTitle ?? '',
          jobDepartment: u.jobDepartment ?? ''
        }
        setForm(loaded)
        setInitial(loaded)
        setEmail(u.email ?? '')
        setUsername(u.username ?? '')
        setLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setError('Failed to load profile. Please close and reopen.')
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const setField = (key: keyof ProfileForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleAvatarChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    // Reset value supaya milih file yg SAMA lagi tetap memicu onChange.
    e.target.value = ''
    if (!file) return

    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      setAvatarError('Hanya JPEG, PNG, WebP, atau GIF yang diizinkan.')
      return
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setAvatarError('Ukuran foto maksimal 5MB.')
      return
    }

    setAvatarError(null)
    setUploadingAvatar(true)
    try {
      const { data } = await usersApi.uploadAvatar(file)
      // Update avatarVersion di store -> Avatar.tsx di SELURUH app (sidebar,
      // header, dll) otomatis refetch krn URL-nya berubah (query ?v= beda).
      useAuthStore.setState((st) => ({
        user: st.user ? { ...st.user, avatarVersion: data.avatarVersion } : st.user
      }))
    } catch {
      setAvatarError('Gagal mengunggah foto. Coba lagi.')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleSave = async () => {
    // Validasi klien seminimal backend: hanya displayName wajib.
    if (form.displayName.trim().length < 1) {
      setError('Display name cannot be empty.')
      return
    }

    // Dirty-tracking: kirim HANYA field yang berbeda dari initial.
    // '' yang berubah dari nilai berisi tetap dikirim -> backend null-kan.
    const payload: Partial<ProfileForm> = {}
    ;(Object.keys(form) as (keyof ProfileForm)[]).forEach((key) => {
      if (form[key] !== initial[key]) payload[key] = form[key]
    })

    if (Object.keys(payload).length === 0) {
      onClose()
      return
    }

    setSaving(true)
    setError(null)
    try {
      const { data } = await usersApi.updateMe(payload)
      // Update store dari response PATCH, TAPI pertahankan status presence.
      // loadMe() sengaja TIDAK dipakai: ia menimpa user.status dgn kolom DB
      // (basi -- presence asli di Redis) + memicu wsService.connect() ulang.
      useAuthStore.setState((st) => ({
        user: st.user ? { ...st.user, ...data.user, status: st.user.status } : data.user
      }))
      onClose()
    } catch {
      setSaving(false)
      setError('Failed to save. Check your connection and try again.')
    }
  }

  const fields: { key: keyof ProfileForm; label: string; required?: boolean }[] = [
    { key: 'displayName', label: 'Display Name', required: true },
    { key: 'firstName', label: 'First Name' },
    { key: 'lastName', label: 'Last Name' },
    { key: 'nickname', label: 'Nickname' },
    { key: 'phone', label: 'Phone' },
    { key: 'jobTitle', label: 'Job Title' },
    { key: 'jobDepartment', label: 'Department' }
  ]

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-[420px] flex flex-col gap-4 shadow-xl">
        <h2 className="text-white font-semibold text-lg">My User Profile</h2>

        <div className="flex flex-col items-center gap-2">
          <Avatar
            userId={me?.id ?? ''}
            name={me?.displayName ?? me?.username ?? 'User'}
            avatarVersion={me?.avatarVersion}
            className="w-20 h-20 rounded-full"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleAvatarChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={handleAvatarClick}
            disabled={uploadingAvatar}
            className="text-xs text-blue-400 hover:text-blue-300 disabled:opacity-50"
          >
            {uploadingAvatar ? 'Mengunggah...' : 'Ganti Foto'}
          </button>
          {avatarError && <p className="text-red-400 text-xs">{avatarError}</p>}
        </div>

        {loading ? (
          <p className="text-gray-400 text-sm">Loading...</p>
        ) : (
          <>
            <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-1">
              {fields.map(({ key, label, required }) => (
                <div key={key} className="flex flex-col gap-1">
                  <label className="text-gray-300 text-sm">
                    {label}
                    {required && <span className="text-red-400"> *</span>}
                  </label>
                  <input
                    value={form[key]}
                    maxLength={MAXLEN[key]}
                    onChange={(e) => setField(key, e.target.value)}
                    className="bg-gray-700 text-white text-sm rounded px-3 py-1.5 outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              ))}

              <div className="border-t border-gray-700 pt-3 flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-gray-400 text-sm">Username</label>
                  <input
                    readOnly
                    value={username}
                    className="bg-gray-900 text-gray-400 text-sm rounded px-3 py-1.5 outline-none cursor-not-allowed"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-gray-400 text-sm">Email</label>
                  <input
                    readOnly
                    value={email}
                    className="bg-gray-900 text-gray-400 text-sm rounded px-3 py-1.5 outline-none cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={onClose}
                className="px-4 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm rounded"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
