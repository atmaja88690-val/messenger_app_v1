/**
 * SessionBanner
 *
 * Muncul HANYA ketika refresh token setelah penolakan WS 4001 gagal -- yaitu
 * ketika sesi benar-benar tidak bisa dipulihkan diam-diam. Spanduk ini tidak
 * menghapus token dan tidak logout sendiri; pengguna yang memutuskan.
 *
 * Kegagalan jaringan TIDAK pernah menampilkannya. Kalau spanduk ini terlihat,
 * artinya server benar-benar menolak kredensial, bukan internet yang putus.
 */
import { useAuthStore } from '../../stores/auth.store'

export default function SessionBanner({ onSignIn }: { onSignIn: () => void }) {
  const sesiDitolak = useAuthStore((s) => s.sesiDitolak)
  if (!sesiDitolak) return null

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2 bg-amber-600 text-white text-sm flex-shrink-0">
      <span>Session expired &mdash; please sign in again.</span>
      <button
        onClick={onSignIn}
        className="px-3 py-1 rounded-md bg-white/20 hover:bg-white/30 font-medium flex-shrink-0"
      >
        Sign in
      </button>
    </div>
  )
}
