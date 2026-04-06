export default function SettingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">설정</h1>

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
    </div>
  )
}
