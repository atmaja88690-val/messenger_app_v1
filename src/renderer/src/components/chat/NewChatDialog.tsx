import { useEffect, useState } from 'react'
import { directoryApi, conversationsApi } from '../../services/api.service'
import { useChatStore } from '../../stores/chat.store'
import Avatar from './Avatar'

interface DirUser {
  id: string
  username: string
  displayName: string
  avatarKey: string | null
  status: string
}

const DOT: Record<string, string> = {
  AVAILABLE: 'bg-green-500',
  AWAY: 'bg-yellow-500',
  DND: 'bg-red-500',
  OFFLINE: 'bg-gray-400'
}

function errMsg(e: any, fallback: string): string {
  const d = e?.response?.data?.error
  if (typeof d === 'string') return d
  if (d?.formErrors?.length) return d.formErrors[0]
  return fallback
}

export default function NewChatDialog({ onClose }: { onClose: () => void }) {
  const loadConversations = useChatStore((s) => s.loadConversations)
  const selectConversation = useChatStore((s) => s.selectConversation)

  const [tab, setTab] = useState<'dm' | 'group'>('dm')
  const [query, setQuery] = useState('')
  const [users, setUsers] = useState<DirUser[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [picked, setPicked] = useState<Set<string>>(new Set())
  const [title, setTitle] = useState('')

  useEffect(() => {
    let cancelled = false
    const t = setTimeout(async () => {
      setLoading(true)
      try {
        const { data } = await directoryApi.list(query.trim() || undefined)
        if (!cancelled) setUsers(data.users ?? [])
      } catch {
        if (!cancelled) setError('Gagal memuat daftar user')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }, 250)
    return () => { cancelled = true; clearTimeout(t) }
  }, [query])

  const openConversation = async (id: string) => {
    await loadConversations()
    await selectConversation(id)
    onClose()
  }

  const startDm = async (u: DirUser) => {
    setBusy(true); setError(null)
    try {
      const { data } = await conversationsApi.createDm(u.id)
      await openConversation(data.conversation.id)
    } catch (e) {
      setError(errMsg(e, 'Gagal memulai percakapan'))
    } finally { setBusy(false) }
  }

  const toggle = (id: string) => {
    setPicked((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const createGroup = async () => {
    if (!title.trim() || picked.size < 1) return
    setBusy(true); setError(null)
    try {
      const { data } = await conversationsApi.createGroup(title.trim(), Array.from(picked))
      await openConversation(data.conversation.id)
    } catch (e) {
      setError(errMsg(e, 'Gagal membuat grup'))
    } finally { setBusy(false) }
  }

  const tabCls = (active: boolean) =>
    `flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
      active ? 'border-[#4aa3df] text-[#4aa3df]' : 'border-transparent text-gray-500 hover:text-gray-700'
    }`

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => !busy && onClose()}>
      <div className="bg-white rounded-xl w-96 max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex">
          <button className={tabCls(tab === 'dm')} onClick={() => setTab('dm')}>Chat langsung</button>
          <button className={tabCls(tab === 'group')} onClick={() => setTab('group')}>Grup baru</button>
        </div>

        <div className="p-4 pb-2">
          {tab === 'group' && (
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nama grup"
              className="w-full mb-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#4aa3df]"
            />
          )}
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari nama atau username..."
            className="w-full px-3 py-2 bg-gray-100 rounded-lg text-sm text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:border focus:border-[#4aa3df]"
          />
        </div>

        {error && <div className="mx-4 mb-2 px-3 py-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">{error}</div>}

        <div className="flex-1 overflow-y-auto px-2 pb-2 min-h-[180px]">
          {loading && <div className="p-4 text-sm text-gray-400">Memuat...</div>}
          {!loading && users.length === 0 && <div className="p-4 text-sm text-gray-400">Tidak ada user</div>}
          {!loading && users.map((u) => {
            const checked = picked.has(u.id)
            return (
              <button
                key={u.id}
                disabled={busy}
                onClick={() => (tab === 'dm' ? startDm(u) : toggle(u.id))}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors disabled:opacity-50 ${
                  tab === 'group' && checked ? 'bg-[#f0f7fc]' : 'hover:bg-gray-50'
                }`}
              >
                <div className="relative flex-shrink-0">
                  <Avatar userId={u.id} name={u.displayName} className="w-9 h-9 rounded-full" />
                  <span className={`absolute -right-0.5 -bottom-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${DOT[u.status] ?? 'bg-gray-400'}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-gray-900 truncate">{u.displayName}</div>
                  <div className="text-xs text-gray-500 truncate">{u.username}</div>
                </div>
                {tab === 'group' && (
                  <span className={`w-4 h-4 rounded border flex items-center justify-center ${checked ? 'bg-[#4aa3df] border-[#4aa3df]' : 'border-gray-300'}`}>
                    {checked && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                    )}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        <div className="flex justify-between items-center gap-2 px-4 py-3 border-t border-gray-100">
          <span className="text-xs text-gray-400">
            {tab === 'group' ? `${picked.size} dipilih` : 'Klik nama untuk mulai chat'}
          </span>
          <div className="flex gap-2">
            <button disabled={busy} onClick={onClose} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg text-gray-600">Batal</button>
            {tab === 'group' && (
              <button
                disabled={busy || !title.trim() || picked.size < 1}
                onClick={createGroup}
                className="px-4 py-1.5 text-sm bg-[#4aa3df] hover:bg-[#3a92ce] text-white rounded-lg disabled:opacity-40"
              >
                {busy ? 'Membuat...' : 'Buat grup'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
