import { useQuery } from '@tanstack/react-query'
import { fetchDashboardSummary, fetchStatusMatrix, fetchActiveAlerts, fetchCurrentMetrics } from '@/services/api'
import { useDashboardStore } from '@/stores/dashboardStore'
import StatusMatrix from './StatusMatrix'
import AlertFeed from './AlertFeed'
import ResourceGauge from './ResourceGauge'
import TrafficChart from './TrafficChart'
import NetworkMap from './NetworkMap'
import type { Alert, Metric } from '@/types'

export default function DashboardGrid() {
  const { setSummary, recentAlerts, realtimeMetrics } = useDashboardStore()

  const { data: summary } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: async () => {
      const res = await fetchDashboardSummary()
      setSummary(res.data)
      return res.data
    },
    refetchInterval: 30_000,
  })

  const { data: statusMatrix } = useQuery({
    queryKey: ['status-matrix'],
    queryFn: async () => (await fetchStatusMatrix()).data,
    refetchInterval: 30_000,
  })

  const { data: alerts } = useQuery({
    queryKey: ['active-alerts'],
    queryFn: async () => (await fetchActiveAlerts()).data as Alert[],
    refetchInterval: 15_000,
  })

  const { data: metrics } = useQuery({
    queryKey: ['current-metrics'],
    queryFn: async () => (await fetchCurrentMetrics()).data as Metric[],
    refetchInterval: 15_000,
  })

  const allAlerts = alerts?.length ? alerts : recentAlerts
  const allMetrics = metrics?.length ? metrics : realtimeMetrics

  // Compute averages for gauges
  const avg = (name: string) => {
    const filtered = allMetrics.filter((m) => m.metric_name === name)
    if (!filtered.length) return 0
    return filtered.reduce((sum, m) => sum + m.value, 0) / filtered.length
  }

  return (
    <div className="space-y-6">
      {/* Row 1: Status + Gauges */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <StatusMatrix items={statusMatrix?.items ?? []} />
        <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">리소스 사용률 (평균)</h3>
          <div className="flex justify-around">
            <ResourceGauge label="CPU" value={avg('cpu_usage')} />
            <ResourceGauge label="Memory" value={avg('memory_usage')} />
            <ResourceGauge label="Disk" value={avg('disk_usage')} />
          </div>
        </div>
        <AlertFeed alerts={allAlerts} />
      </div>

      {/* Row 2: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TrafficChart data={allMetrics} />
        <NetworkMap nodes={[]} />
      </div>

      {/* Row 3: Heatmap placeholder */}
      <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
        <h3 className="text-sm font-semibold text-gray-300 mb-4">자산 상태 히트맵</h3>
        <div className="grid grid-cols-10 gap-1">
          {(statusMatrix?.items ?? []).map((item: { asset_id: string; asset_name: string; status: string }) => (
            <div
              key={item.asset_id}
              title={`${item.asset_name} (${item.status})`}
              className={`h-8 rounded ${
                item.status === 'normal'
                  ? 'bg-green-500/40'
                  : item.status === 'warning'
                    ? 'bg-yellow-500/40'
                    : 'bg-red-500/40'
              } hover:brightness-125 transition cursor-pointer`}
            />
          ))}
        </div>
        {(!statusMatrix?.items || statusMatrix.items.length === 0) && (
          <p className="text-gray-500 text-sm text-center py-8">등록된 자산 없음</p>
        )}
      </div>
    </div>
  )
}
