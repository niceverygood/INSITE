import axios from 'axios'

const envBase = import.meta.env.VITE_API_BASE_URL
const API_BASE = envBase !== undefined && envBase !== '' ? envBase : (import.meta.env.DEV ? '' : '/_/backend')

const api = axios.create({
  baseURL: `${API_BASE}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  },
)

export default api

// Auth
export const login = (username: string, password: string) =>
  api.post('/auth/login', { username, password })

// Assets
export const fetchAssets = (params?: Record<string, string | number>) =>
  api.get('/assets/', { params })
export const fetchAsset = (id: string) => api.get(`/assets/${id}`)
export const createAsset = (data: Record<string, unknown>) => api.post('/assets/', data)
export const updateAsset = (id: string, data: Record<string, unknown>) => api.put(`/assets/${id}`, data)
export const deleteAsset = (id: string) => api.delete(`/assets/${id}`)

// Metrics
export const fetchCurrentMetrics = () => api.get('/metrics/current')
export const fetchMetricHistory = (params: Record<string, string>) => api.get('/metrics/history', { params })
export const fetchTopN = (metricName: string, n: number) =>
  api.get('/metrics/top-n', { params: { metric_name: metricName, n } })

// Alerts
export const fetchAlerts = (params?: Record<string, string>) => api.get('/alerts/', { params })
export const fetchActiveAlerts = () => api.get('/alerts/active')
export const acknowledgeAlert = (id: string) => api.put(`/alerts/${id}/acknowledge`)
export const resolveAlert = (id: string) => api.put(`/alerts/${id}/resolve`)
export const fetchAlertRules = () => api.get('/alerts/rules')

// Dashboard
export const fetchDashboardSummary = () => api.get('/dashboard/summary')
export const fetchStatusMatrix = () => api.get('/dashboard/status-matrix')

// Logs
export const searchLogs = (params: Record<string, string>) => api.get('/logs/search', { params })
export const fetchLogStats = () => api.get('/logs/stats')

// AI
export const requestDiagnosis = (assetId: string, symptom?: string) =>
  api.post('/ai/diagnose', { asset_id: assetId, symptom })
export const fetchPredictions = () => api.get('/ai/predictions')
export const aiChat = (message: string) => api.post('/ai/chat', { message })

// Reports
export const generateReport = (data: Record<string, string>) => api.post('/reports/generate', data)
export const fetchReports = () => api.get('/reports/')
