import { create } from 'zustand'
import type { DashboardSummary, Alert, Metric } from '@/types'

interface DashboardState {
  summary: DashboardSummary | null
  realtimeMetrics: Metric[]
  recentAlerts: Alert[]
  wsConnected: boolean
  setSummary: (s: DashboardSummary) => void
  addMetric: (m: Metric) => void
  addAlert: (a: Alert) => void
  setWsConnected: (connected: boolean) => void
}

export const useDashboardStore = create<DashboardState>((set) => ({
  summary: null,
  realtimeMetrics: [],
  recentAlerts: [],
  wsConnected: false,
  setSummary: (summary) => set({ summary }),
  addMetric: (metric) =>
    set((state) => ({
      realtimeMetrics: [...state.realtimeMetrics.slice(-500), metric],
    })),
  addAlert: (alert) =>
    set((state) => ({
      recentAlerts: [alert, ...state.recentAlerts.slice(0, 49)],
    })),
  setWsConnected: (connected) => set({ wsConnected: connected }),
}))
