import { useEffect, useState } from 'react'
import { fetchAuditLogs } from '../services/api'

interface AuditLog {
  id: string
  user_id: string
  username: string
  action: string
  target_type: string
  target_id: string | null
  detail: string | null
  ip_address: string | null
  timestamp: string
}

const ACTION_LABELS: Record<string, string> = {
  login: '로그인',
  logout: '로그아웃',
  create_asset: '자산 생성',
  update_asset: '자산 수정',
  delete_asset: '자산 삭제',
  acknowledge_alert: '알림 확인',
  resolve_alert: '알림 해결',
  ai_diagnose: 'AI 진단',
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'settings' | 'audit'>('settings')
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (activeTab === 'audit') {
      setLoading(true)
      fetchAuditLogs()
        .then((res) => setAuditLogs(res.data))
        .catch(() => setAuditLogs([]))
        .finally(() => setLoading(false))
    }
  }, [activeTab])

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">설정</h1>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            activeTab === 'settings'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:text-gray-200'
          }`}
        >
          일반 설정
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            activeTab === 'audit'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:text-gray-200'
          }`}
        >
          감사 로그
        </button>
      </div>

      {activeTab === 'settings' && (
        <div className="space-y-6 max-w-2xl">
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
            <h3 className="text-sm font-semibold text-gray-300 mb-4">알림 채널 설정</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Slack Webhook URL</label>
                <input type="text" placeholder="https://hooks.slack.com/services/..." className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Email 수신자 (쉼표 구분)</label>
                <input type="text" placeholder="admin@example.com, ops@example.com" className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200" />
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
            <h3 className="text-sm font-semibold text-gray-300 mb-4">사용자 관리</h3>
            <p className="text-gray-500 text-sm">Admin 전용 기능 — 사용자 목록 및 권한 관리</p>
          </div>
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-700">
            <h3 className="text-sm font-semibold text-gray-300">감사 로그</h3>
            <p className="text-xs text-gray-500 mt-1">시스템 활동 기록을 확인합니다</p>
          </div>
          {loading ? (
            <div className="p-8 text-center text-gray-500 text-sm">로딩 중...</div>
          ) : auditLogs.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">감사 로그가 없습니다</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-400 border-b border-gray-700">
                    <th className="px-4 py-3 font-medium">시간</th>
                    <th className="px-4 py-3 font-medium">사용자</th>
                    <th className="px-4 py-3 font-medium">액션</th>
                    <th className="px-4 py-3 font-medium">대상</th>
                    <th className="px-4 py-3 font-medium">상세</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-700/30 transition">
                      <td className="px-4 py-3 text-gray-300 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString('ko-KR')}
                      </td>
                      <td className="px-4 py-3 text-gray-300">{log.username}</td>
                      <td className="px-4 py-3">
                        <span className="inline-block px-2 py-0.5 rounded bg-gray-700 text-gray-200 text-xs">
                          {ACTION_LABELS[log.action] || log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400">
                        {log.target_type}
                        {log.target_id && (
                          <span className="text-gray-500 ml-1 text-xs">({log.target_id.slice(0, 8)})</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-400 max-w-xs truncate">{log.detail || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
