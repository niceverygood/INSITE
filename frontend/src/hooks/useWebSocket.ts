import { useEffect, useRef, useCallback } from 'react'
import { useDashboardStore } from '@/stores/dashboardStore'

const RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 16000, 30000]

function getWsUrl(): string | null {
  // Vercel serverless doesn't support WebSocket — skip in production
  if (window.location.hostname.includes('vercel.app')) return null

  const wsEnv = import.meta.env.VITE_WS_URL
  if (wsEnv) return wsEnv

  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${proto}//${window.location.host}`
}

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null)
  const retriesRef = useRef(0)
  const { setWsConnected, addMetric, addAlert } = useDashboardStore()

  const connect = useCallback(() => {
    const token = localStorage.getItem('access_token')
    const wsBase = getWsUrl()
    if (!token || !wsBase) return

    try {
      const ws = new WebSocket(`${wsBase}/ws/realtime?token=${token}`)
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
    } catch {
      // WebSocket construction failed (e.g., mixed content) — silently skip
      setWsConnected(false)
    }
  }, [setWsConnected, addMetric, addAlert])

  useEffect(() => {
    connect()
    return () => {
      wsRef.current?.close()
    }
  }, [connect])

  return wsRef
}
