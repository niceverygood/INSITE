import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '@/services/api'
import { useAuthStore } from '@/stores/authStore'
import { Activity } from 'lucide-react'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await login(username, password)
      setAuth({ id: '', username, email: '', role: 'viewer', is_active: true }, res.data.access_token, res.data.refresh_token)
      navigate('/dashboard')
    } catch {
      setError('아이디 또는 비밀번호가 올바르지 않습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="w-full max-w-sm bg-gray-800 border border-gray-700 rounded-2xl p-8">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Activity className="h-8 w-8 text-primary-500" />
          <span className="text-2xl font-bold text-white">INSITE</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 block mb-1">사용자명</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>

          {error && <p className="text-red-400 text-xs">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-40 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>
      </div>
    </div>
  )
}
