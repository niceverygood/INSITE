import { useQuery } from '@tanstack/react-query'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { fetchTrafficSummary } from '@/services/api'
import type { Metric, TrafficSummary } from '@/types'

interface Props {
  data: Metric[]
  height?: number
}

export default function TrafficChart({ data, height = 260 }: Props) {
  // Group by time, show network_in and network_out
  const grouped: Record<string, { time: string; network_in: number; network_out: number }> = {}
  for (const m of data) {
    const timeKey = m.time.slice(11, 16) // HH:MM
    if (!grouped[timeKey]) grouped[timeKey] = { time: timeKey, network_in: 0, network_out: 0 }
    if (m.metric_name === 'network_in') grouped[timeKey].network_in = m.value
    if (m.metric_name === 'network_out') grouped[timeKey].network_out = m.value
  }
  const chartData = Object.values(grouped).slice(-30)

  const { data: trafficSummary } = useQuery({
    queryKey: ['traffic-summary'],
    queryFn: async () => (await fetchTrafficSummary()).data as TrafficSummary[],
    refetchInterval: 30_000,
  })

  return (
    <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
      <h3 className="text-sm font-semibold text-gray-300 mb-4">트래픽 트렌드</h3>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="time" tick={{ fill: '#9ca3af', fontSize: 11 }} />
          <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: 8 }}
            labelStyle={{ color: '#d1d5db' }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line type="monotone" dataKey="network_in" stroke="#3b82f6" strokeWidth={2} dot={false} name="Inbound" />
          <Line type="monotone" dataKey="network_out" stroke="#10b981" strokeWidth={2} dot={false} name="Outbound" />
        </LineChart>
      </ResponsiveContainer>

      {/* Per-asset traffic summary table */}
      {trafficSummary && trafficSummary.length > 0 && (
        <div className="mt-5">
          <h4 className="text-sm font-semibold text-gray-300 mb-3">장비별 트래픽 현황</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-900/50">
                <tr className="text-gray-400 text-left">
                  <th className="px-3 py-2 font-medium">장비명</th>
                  <th className="px-3 py-2 font-medium">유형</th>
                  <th className="px-3 py-2 font-medium">위치</th>
                  <th className="px-3 py-2 font-medium text-right">평균 In</th>
                  <th className="px-3 py-2 font-medium text-right">평균 Out</th>
                  <th className="px-3 py-2 font-medium text-right">최대 In</th>
                  <th className="px-3 py-2 font-medium text-right">최대 Out</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {trafficSummary.map((item) => (
                  <tr key={item.asset_id} className="hover:bg-gray-700/50 transition-colors">
                    <td className="px-3 py-2 text-gray-200">{item.asset_name}</td>
                    <td className="px-3 py-2 text-gray-400">{item.asset_type}</td>
                    <td className="px-3 py-2 text-gray-400">{item.location || '-'}</td>
                    <td className="px-3 py-2 text-blue-400 text-right">{item.avg_network_in.toLocaleString()}</td>
                    <td className="px-3 py-2 text-emerald-400 text-right">{item.avg_network_out.toLocaleString()}</td>
                    <td className="px-3 py-2 text-blue-300 text-right">{item.max_network_in.toLocaleString()}</td>
                    <td className="px-3 py-2 text-emerald-300 text-right">{item.max_network_out.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
