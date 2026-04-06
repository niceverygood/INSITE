import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import { useWebSocket } from '@/hooks/useWebSocket'

export default function MainLayout() {
  useWebSocket()

  return (
    <div className="min-h-screen bg-gray-900">
      <Sidebar />
      <div className="ml-60">
        <Header />
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
