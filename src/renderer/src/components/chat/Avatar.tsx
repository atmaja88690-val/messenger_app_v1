import { useEffect, useState } from 'react'
import { attachmentsApi } from '../../services/api.service'

interface AvatarProps {
  userId: string
  name: string
  className?: string
  // null  = server sudah bilang user ini TIDAK punya avatar -> jangan fetch.
  // undefined = pemanggil tidak tahu -> fetch seperti biasa (perilaku lama).
  avatarKey?: string | null
}

function initials(name: string): string {
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
}

// Avatar user tunggal (R3: blob-fetch + auth lewat attachmentsApi.getAvatar).
// SENGAJA TIDAK memakai cache permanen seperti blobCache di AttachmentImage.tsx --
// avatarKey backend deterministik per-user (avatars/{userId}.{ext}), jadi cache
// permanen bisa menyajikan foto basi setelah user ganti avatar. Di-fetch ulang
// tiap mount, blob URL di-revoke saat unmount ATAU saat userId berganti.
export default function Avatar({ userId, name, className, avatarKey }: AvatarProps) {
  const [src, setSrc] = useState<string | null>(null)

  useEffect(() => {
    // Skip fetch kalau sudah pasti tidak ada avatar: hemat request dan
    // menghilangkan 404 yang mengotori console (menyamarkan error sungguhan).
    if (avatarKey === null) {
      setSrc(null)
      return
    }

    let cancelled = false
    let objectUrl: string | null = null

    attachmentsApi
      .getAvatar(userId)
      .then((url) => {
        if (cancelled) {
          if (url) URL.revokeObjectURL(url)
          return
        }
        objectUrl = url
        setSrc(url)
      })
      .catch(() => {
        // getAvatar sudah menangani 404 -> null secara internal.
        // Error di sini berarti network/lain -- diamkan, fallback ke inisial.
      })

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
      // Reset src saat userId berganti supaya tidak sekilas tampil avatar lama
      // sebelum fetch avatar baru selesai.
      setSrc(null)
    }
  }, [userId, avatarKey])

  const base = className ?? 'w-10 h-10 rounded-full flex-shrink-0'

  if (src) {
    return <img src={src} alt={name} className={`${base} object-cover`} />
  }

  return (
    <div className={`${base} bg-blue-600 flex items-center justify-center text-white text-sm font-semibold`}>
      {initials(name)}
    </div>
  )
}
