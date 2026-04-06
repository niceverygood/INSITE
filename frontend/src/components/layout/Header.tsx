import { Bell, User, Wifi, WifiOff } from 'lucide-react'
import { useDashboardStore } from '@/stores/dashboardStore'
import { useAuthStore } from '@/stores/authStore'

export default function Header() {
  const { summary, wsConnected, recentAlerts } = useDashboardStore()
  const { user, logout } = useAuthStore()
  const activeAlertCount = summary?.active_alerts ?? recentAlerts.filter((a) => a.status === 'firing').length

  return (
    <header className="sticky top-0 z-30 h-14 bg-gray-900/80 backdrop-blur border-b border-gray-800 flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        {wsConnected ? (
          <span className="flex items-center gap-1 text-xs text-green-400">
            <Wifi className="h-3.5 w-3.5" /> 실시간 연결
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs text-red-400">
            <WifiOff className="h-3.5 w-3.5" /> 연결 끊김
          </span>
        )}
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 rounded-lg hover:bg-gray-800 transition-colors">
          <Bell className="h-5 w-5 text-gray-400" />
          {activeAlertCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {activeAlertCount > 99 ? '99+' : activeAlertCount}
            </span>
          )}
        </button>

        <div className="flex items-center gap-2 text-sm text-gray-300">
          <User className="h-4 w-4" />
          <span>{user?.username ?? 'Guest'}</span>
          <button onClick={logout} className="ml-2 text-xs text-gray-500 hover:text-gray-300">
            로그아웃
          </button>
        </div>
      </div>
    </header>
  )
}
