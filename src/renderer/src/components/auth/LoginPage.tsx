import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useAuthStore } from '../../stores/auth.store'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, isLoading, error, clearError } = useAuthStore()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async () => {
    if (!username || !password) return
    await login(username, password)
    if (localStorage.getItem('bsi_access_token')) {
      navigate({ to: '/' })
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit()
  }

  return (
    <div className="flex items-center justify-center w-full h-full bg-gray-900">
      <div className="w-full max-w-sm p-8 bg-gray-800 rounded-2xl shadow-xl">
        <h1 className="text-2xl font-bold text-white mb-1">BSI Messenger</h1>
        <p className="text-gray-400 text-sm mb-8">Sign in to your account</p>

        {error && (
          <div
            className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-300 text-sm cursor-pointer"
            onClick={clearError}
          >
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Username"
              className="w-full px-4 py-2.5 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500 placeholder-gray-500"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Password"
              className="w-full px-4 py-2.5 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500 placeholder-gray-500"
            />
          </div>
          <button
            onClick={handleSubmit}
            disabled={isLoading || !username || !password}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-900 disabled:text-blue-400 text-white font-semibold rounded-lg transition-colors"
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>
        </div>
      </div>
    </div>
  )
}
