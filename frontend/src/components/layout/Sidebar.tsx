import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Server,
  Bell,
  FileText,
  Brain,
  ClipboardList,
  Settings,
  Activity,
} from 'lucide-react'
import { cn } from '@/utils/cn'

const navItems = [
  { to: '/dashboard', label: '대시보드', icon: LayoutDashboard },
  { to: '/assets', label: '자산관리', icon: Server },
  { to: '/alerts', label: '알람', icon: Bell },
  { to: '/logs', label: '로그', icon: FileText },
  { to: '/ai', label: 'AI 진단', icon: Brain },
  { to: '/reports', label: '리포트', icon: ClipboardList },
  { to: '/settings', label: '설정', icon: Settings },
]

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-60 bg-gray-950 border-r border-gray-800 flex flex-col">
      <div className="flex items-center gap-2 px-5 py-5 border-b border-gray-800">
        <Activity className="h-7 w-7 text-primary-500" />
        <span className="text-xl font-bold text-white tracking-tight">INSITE</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary-600/20 text-primary-400'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200',
              )
            }
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="px-5 py-4 border-t border-gray-800 text-xs text-gray-500">
        INSITE v0.1.0
      </div>
    </aside>
  )
}
