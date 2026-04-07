import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '@/services/api'
import { useAuthStore } from '@/stores/authStore'
import { Activity, Shield, Eye, Settings } from 'lucide-react'

const TEST_ACCOUNTS = [
  { username: 'admin', password: 'admin123', role: 'admin', label: '관리자', icon: Shield, color: 'from-red-500 to-orange-500' },
  { username: 'operator', password: 'oper123', role: 'operator', label: '운영자', icon: Settings, color: 'from-blue-500 to-cyan-500' },
  { username: 'viewer', password: 'view123', role: 'viewer', label: '뷰어', icon: Eye, color: 'from-green-500 to-emerald-500' },
]

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()

  const doLogin = async (user: string, pass: string) => {
    setError('')
    setLoading(true)
    try {
      const res = await login(user, pass)
      const userInfo = res.data.user || { id: '', username: user, email: '', role: 'viewer' }
      setAuth({ id: userInfo.id, username: userInfo.username, email: userInfo.email, role: userInfo.role, is_active: true }, res.data.access_token, res.data.refresh_token)
      navigate('/dashboard')
    } catch {
      setError('아이디 또는 비밀번호가 올바르지 않습니다')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    doLogin(username, password)
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

        {/* Test account quick login */}
        <div className="mt-6 pt-5 border-t border-gray-700">
          <p className="text-[11px] text-gray-500 text-center mb-3">테스트 계정으로 빠른 로그인</p>
          <div className="grid grid-cols-3 gap-2">
            {TEST_ACCOUNTS.map((acc) => (
              <button
                key={acc.username}
                onClick={() => doLogin(acc.username, acc.password)}
                disabled={loading}
                className="group relative flex flex-col items-center gap-1.5 bg-gray-900 hover:bg-gray-750 border border-gray-700 hover:border-gray-500 rounded-xl py-3 px-2 transition-all disabled:opacity-40"
              >
                <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${acc.color} flex items-center justify-center shadow-lg`}>
                  <acc.icon className="h-4 w-4 text-white" />
                </div>
                <span className="text-[11px] font-medium text-gray-300 group-hover:text-white">{acc.label}</span>
                <span className="text-[10px] text-gray-500">{acc.username}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
