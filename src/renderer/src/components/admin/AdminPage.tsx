import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { adminApi } from '../../services/api.service'
import { useAuthStore } from '../../stores/auth.store'
import type { User } from '../../types'

interface AdminUser extends User {
  _count?: { sessions: number; messages: number }
}
interface Stats {
  totalUsers?: number
  activeUsers?: number
  totalMessages?: number
  totalConversations?: number
  activeSessions?: number
}

const PAGE_SIZE = 20
const STATUS_DOT: Record<string, string> = {
  AVAILABLE: 'bg-green-500',
  AWAY: 'bg-yellow-500',
  DND: 'bg-red-500',
  OFFLINE: 'bg-gray-400'
}

function errMsg(e: any, fallback: string): string {
  const d = e?.response?.data?.error
  if (typeof d === 'string') return d
  if (d?.formErrors?.length) return d.formErrors[0]
  if (d?.fieldErrors) {
    const first = Object.entries(d.fieldErrors)[0]
    if (first) return `${first[0]}: ${(first[1] as string[])[0]}`
  }
  return fallback
}

export default function AdminPage() {
  const navigate = useNavigate()
  const me = useAuthStore((s) => s.user)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [stats, setStats] = useState<Stats>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const [showCreate, setShowCreate] = useState(false)
  const [cUsername, setCUsername] = useState('')
  const [cDisplayName, setCDisplayName] = useState('')
  const [cPassword, setCPassword] = useState('')
  const [cEmail, setCEmail] = useState('')

  const [editUser, setEditUser] = useState<AdminUser | null>(null)
  const [eUsername, setEUsername] = useState('')
  const [eDisplayName, setEDisplayName] = useState('')
  const [eEmail, setEEmail] = useState('')

  const [delUser, setDelUser] = useState<AdminUser | null>(null)
  const [delConfirm, setDelConfirm] = useState('')

  const [saving, setSaving] = useState(false)
  const isAdmin = me?.accountType === 'ADMIN'

  const load = async () => {
    setLoading(true); setError(null)
    try {
      const { data } = await adminApi.listUsers({ page, limit: PAGE_SIZE, search: search || undefined })
      setUsers(data.users ?? []); setTotal(data.total ?? 0)
    } catch { setError('Gagal memuat daftar user') } finally { setLoading(false) }
  }
  const loadStats = async () => {
    try { const { data } = await adminApi.stats(); setStats(data ?? {}) } catch { /* opsional */ }
  }

  useEffect(() => { if (isAdmin) load() /* eslint-disable-next-line */ }, [page, isAdmin])
  useEffect(() => { if (isAdmin) loadStats() }, [isAdmin])

  const refresh = async () => { await load(); await loadStats() }

  const onSearch = () => { setPage(1); load() }

  const toggleActive = async (u: AdminUser) => {
    if (u.id === me?.id) return
    if (u.isActive && !confirm(`Nonaktifkan ${u.displayName}? Ia tidak akan bisa login.`)) return
    setBusyId(u.id)
    try {
      if (u.isActive) await adminApi.deactivate(u.id); else await adminApi.activate(u.id)
      await refresh()
    } catch (e) { setError(errMsg(e, 'Aksi gagal')) } finally { setBusyId(null) }
  }

  const toggleAdmin = async (u: AdminUser) => {
    if (u.id === me?.id) return
    const makeAdmin = u.accountType !== 'ADMIN'
    if (!confirm(makeAdmin ? `Jadikan ${u.displayName} administrator?` : `Cabut hak administrator dari ${u.displayName}?`)) return
    setBusyId(u.id)
    try { await adminApi.setAdmin(u.id, makeAdmin); await refresh() }
    catch (e) { setError(errMsg(e, 'Aksi gagal')) } finally { setBusyId(null) }
  }

  const submitCreate = async () => {
    setSaving(true); setError(null)
    try {
      await adminApi.createUser({
        username: cUsername.trim(),
        displayName: cDisplayName.trim(),
        password: cPassword,
        ...(cEmail.trim() ? { email: cEmail.trim() } : {})
      })
      setShowCreate(false)
      setCUsername(''); setCDisplayName(''); setCPassword(''); setCEmail('')
      await refresh()
    } catch (e) { setError(errMsg(e, 'Gagal membuat user')) } finally { setSaving(false) }
  }

  const openEdit = (u: AdminUser) => {
    setEditUser(u); setEUsername(u.username); setEDisplayName(u.displayName); setEEmail(u.email ?? '')
    setError(null)
  }

  const submitEdit = async () => {
    if (!editUser) return
    setSaving(true); setError(null)
    const payload: { displayName?: string; username?: string; email?: string | null } = {}
    if (eDisplayName.trim() !== editUser.displayName) payload.displayName = eDisplayName.trim()
    if (eUsername.trim() !== editUser.username) payload.username = eUsername.trim()
    const newEmail = eEmail.trim() ? eEmail.trim() : null
    if (newEmail !== (editUser.email ?? null)) payload.email = newEmail
    if (Object.keys(payload).length === 0) { setEditUser(null); setSaving(false); return }
    try {
      await adminApi.updateUser(editUser.id, payload)
      setEditUser(null); await refresh()
    } catch (e) { setError(errMsg(e, 'Gagal menyimpan')) } finally { setSaving(false) }
  }

  const submitDelete = async () => {
    if (!delUser || delConfirm !== delUser.username) return
    setSaving(true); setError(null)
    try {
      await adminApi.deleteUser(delUser.id)
      setDelUser(null); setDelConfirm(''); await refresh()
    } catch (e) { setError(errMsg(e, 'Gagal menghapus')) } finally { setSaving(false) }
  }

  if (!isAdmin) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 gap-3">
        <div className="text-gray-900 text-lg font-medium">Access denied</div>
        <div className="text-gray-500 text-sm">Halaman ini hanya untuk administrator.</div>
        <button onClick={() => navigate({ to: '/' })} className="mt-2 px-4 py-2 bg-[#4aa3df] text-white rounded-lg text-sm">Kembali ke chat</button>
      </div>
    )
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const inputCls = 'w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#4aa3df]'

  return (
    <div className="w-full h-full overflow-y-auto bg-gray-50">
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
        <h1 className="text-lg font-semibold text-gray-900">Admin Dashboard</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => { setShowCreate(true); setError(null) }} className="px-3 py-1.5 text-sm bg-[#4aa3df] hover:bg-[#3a92ce] text-white rounded-lg">+ Tambah user</button>
          <button onClick={() => navigate({ to: '/' })} className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg">Kembali ke chat</button>
        </div>
      </div>

      <div className="px-6 py-4 grid grid-cols-2 md:grid-cols-5 gap-3">
        {[['Total user', stats.totalUsers], ['User aktif', stats.activeUsers], ['Total pesan', stats.totalMessages], ['Percakapan', stats.totalConversations], ['Sesi aktif', stats.activeSessions]].map(([label, val]) => (
          <div key={String(label)} className="bg-white border border-gray-200 rounded-xl px-4 py-3">
            <div className="text-xs text-gray-500">{label}</div>
            <div className="text-xl font-semibold text-gray-900">{val ?? '—'}</div>
          </div>
        ))}
      </div>

      <div className="px-6 pb-6">
        <div className="flex items-center gap-2 mb-3">
          <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && onSearch()} placeholder="Cari username atau nama..." className={`max-w-sm ${inputCls}`} />
          <button onClick={onSearch} className="px-4 py-2 bg-[#4aa3df] hover:bg-[#3a92ce] text-white rounded-lg text-sm">Cari</button>
        </div>

        {error && <div className="mb-3 px-3 py-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>}

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium">Nama</th>
                <th className="text-left px-4 py-2.5 font-medium">Username</th>
                <th className="text-left px-4 py-2.5 font-medium">Email</th>
                <th className="text-left px-4 py-2.5 font-medium">Role</th>
                <th className="text-left px-4 py-2.5 font-medium">Status</th>
                <th className="text-right px-4 py-2.5 font-medium">Pesan</th>
                <th className="text-right px-4 py-2.5 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={7} className="px-4 py-6 text-center text-gray-400">Memuat...</td></tr>}
              {!loading && users.length === 0 && <tr><td colSpan={7} className="px-4 py-6 text-center text-gray-400">Tidak ada user</td></tr>}
              {!loading && users.map((u) => {
                const self = u.id === me?.id
                const deleted = u.username.startsWith('deleted_')
                return (
                  <tr key={u.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-2.5 text-gray-900">
                      {u.displayName}
                      {self && <span className="ml-2 text-xs text-gray-400">(Anda)</span>}
                    </td>
                    <td className="px-4 py-2.5 text-gray-600">{u.username}</td>
                    <td className="px-4 py-2.5 text-gray-600">{u.email ?? '—'}</td>
                    <td className="px-4 py-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${u.accountType === 'ADMIN' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>{u.accountType ?? 'USER'}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${STATUS_DOT[u.status] ?? 'bg-gray-400'}`} />
                        <span className={u.isActive ? 'text-gray-600' : 'text-red-600'}>{u.isActive ? 'Aktif' : 'Nonaktif'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right text-gray-500">{u._count?.messages ?? '—'}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-end gap-1.5">
                        <button disabled={self || deleted || busyId === u.id} onClick={() => openEdit(u)} className="px-2.5 py-1 text-xs border border-gray-200 rounded-md text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed">Edit</button>
                        <button disabled={self || deleted || busyId === u.id} onClick={() => toggleActive(u)} className="px-2.5 py-1 text-xs border border-gray-200 rounded-md text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed">{u.isActive ? 'Nonaktifkan' : 'Aktifkan'}</button>
                        <button disabled={self || deleted || busyId === u.id} onClick={() => toggleAdmin(u)} className="px-2.5 py-1 text-xs border border-gray-200 rounded-md text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed">{u.accountType === 'ADMIN' ? 'Cabut admin' : 'Jadikan admin'}</button>
                        <button disabled={self || deleted || busyId === u.id} onClick={() => { setDelUser(u); setDelConfirm(''); setError(null) }} className="px-2.5 py-1 text-xs border border-red-200 rounded-md text-red-600 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed">Hapus</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between mt-3 text-sm text-gray-500">
          <div>Total {total} user</div>
          <div className="flex items-center gap-2">
            <button disabled={page <= 1 || loading} onClick={() => setPage((p) => Math.max(1, p - 1))} className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white">Sebelumnya</button>
            <span>Hal {page} / {totalPages}</span>
            <button disabled={page >= totalPages || loading} onClick={() => setPage((p) => p + 1)} className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white">Berikutnya</button>
          </div>
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => !saving && setShowCreate(false)}>
          <div className="bg-white rounded-xl w-96 p-5" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-base font-semibold text-gray-900 mb-4">Tambah user</h2>
            <div className="flex flex-col gap-3">
              <div><label className="text-xs text-gray-500">Nama tampilan</label><input value={cDisplayName} onChange={(e) => setCDisplayName(e.target.value)} className={inputCls} /></div>
              <div><label className="text-xs text-gray-500">Username (min 3)</label><input value={cUsername} onChange={(e) => setCUsername(e.target.value)} className={inputCls} /></div>
              <div><label className="text-xs text-gray-500">Password (min 8)</label><input type="password" value={cPassword} onChange={(e) => setCPassword(e.target.value)} className={inputCls} /></div>
              <div><label className="text-xs text-gray-500">Email (opsional)</label><input value={cEmail} onChange={(e) => setCEmail(e.target.value)} className={inputCls} /></div>
            </div>
            {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
            <div className="flex justify-end gap-2 mt-5">
              <button disabled={saving} onClick={() => setShowCreate(false)} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg text-gray-600">Batal</button>
              <button disabled={saving || !cUsername.trim() || !cDisplayName.trim() || cPassword.length < 8} onClick={submitCreate} className="px-4 py-1.5 text-sm bg-[#4aa3df] hover:bg-[#3a92ce] text-white rounded-lg disabled:opacity-40">{saving ? 'Menyimpan...' : 'Simpan'}</button>
            </div>
          </div>
        </div>
      )}

      {editUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => !saving && setEditUser(null)}>
          <div className="bg-white rounded-xl w-96 p-5" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-base font-semibold text-gray-900 mb-4">Edit {editUser.displayName}</h2>
            <div className="flex flex-col gap-3">
              <div><label className="text-xs text-gray-500">Nama tampilan</label><input value={eDisplayName} onChange={(e) => setEDisplayName(e.target.value)} className={inputCls} /></div>
              <div><label className="text-xs text-gray-500">Username</label><input value={eUsername} onChange={(e) => setEUsername(e.target.value)} className={inputCls} /></div>
              <div><label className="text-xs text-gray-500">Email (kosongkan untuk menghapus)</label><input value={eEmail} onChange={(e) => setEEmail(e.target.value)} className={inputCls} /></div>
            </div>
            {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
            <div className="flex justify-end gap-2 mt-5">
              <button disabled={saving} onClick={() => setEditUser(null)} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg text-gray-600">Batal</button>
              <button disabled={saving} onClick={submitEdit} className="px-4 py-1.5 text-sm bg-[#4aa3df] hover:bg-[#3a92ce] text-white rounded-lg disabled:opacity-40">{saving ? 'Menyimpan...' : 'Simpan'}</button>
            </div>
          </div>
        </div>
      )}

      {delUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => !saving && setDelUser(null)}>
          <div className="bg-white rounded-xl w-96 p-5" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-base font-semibold text-gray-900 mb-2">Hapus user</h2>
            <p className="text-sm text-gray-600 mb-3">
              Identitas <b>{delUser.displayName}</b> akan dimusnahkan permanen dan semua sesinya dicabut.
              Riwayat pesan tetap ada, tampil sebagai &quot;User dihapus&quot;. Tindakan ini <b>tidak bisa dibatalkan</b>.
            </p>
            <label className="text-xs text-gray-500">Ketik <b>{delUser.username}</b> untuk konfirmasi</label>
            <input value={delConfirm} onChange={(e) => setDelConfirm(e.target.value)} className={inputCls} />
            {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
            <div className="flex justify-end gap-2 mt-5">
              <button disabled={saving} onClick={() => setDelUser(null)} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg text-gray-600">Batal</button>
              <button disabled={saving || delConfirm !== delUser.username} onClick={submitDelete} className="px-4 py-1.5 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-40">{saving ? 'Menghapus...' : 'Hapus permanen'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
