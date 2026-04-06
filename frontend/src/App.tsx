import { Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from '@/components/layout/MainLayout'
import LoginPage from '@/routes/LoginPage'
import DashboardPage from '@/routes/DashboardPage'
import AssetsPage from '@/routes/AssetsPage'
import AlertsPage from '@/routes/AlertsPage'
import LogsPage from '@/routes/LogsPage'
import AIPage from '@/routes/AIPage'
import ReportsPage from '@/routes/ReportsPage'
import SettingsPage from '@/routes/SettingsPage'
import { useAuthStore } from '@/stores/authStore'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/assets" element={<AssetsPage />} />
        <Route path="/alerts" element={<AlertsPage />} />
        <Route path="/logs" element={<LogsPage />} />
        <Route path="/ai" element={<AIPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
