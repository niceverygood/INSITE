import { useEffect, useRef, useCallback } from 'react'
import { useDashboardStore } from '@/stores/dashboardStore'

const WS_BASE = import.meta.env.VITE_WS_URL || `ws://${window.location.host}`
const RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 16000, 30000]

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null)
  const retriesRef = useRef(0)
  const { setWsConnected, addMetric, addAlert } = useDashboardStore()

  const connect = useCallback(() => {
    const token = localStorage.getItem('access_token')
    if (!token) return

    const ws = new WebSocket(`${WS_BASE}/ws/realtime?token=${token}`)
    wsRef.current = ws

    ws.onopen = () => {
      setWsConnected(true)
      retriesRef.current = 0
      ws.send(JSON.stringify({ subscribe: ['metrics', 'alerts', 'status'], asset_ids: ['all'] }))
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'metric') addMetric(data.payload)
        else if (data.type === 'alert') addAlert(data.payload)
      } catch {
        // ignore parse errors
      }
    }

    ws.onclose = () => {
      setWsConnected(false)
      const delay = RECONNECT_DELAYS[Math.min(retriesRef.current, RECONNECT_DELAYS.length - 1)]
      retriesRef.current++
      setTimeout(connect, delay)
    }

    ws.onerror = () => ws.close()
  }, [setWsConnected, addMetric, addAlert])

  useEffect(() => {
    connect()
    return () => {
      wsRef.current?.close()
    }
  }, [connect])

  return wsRef
}
