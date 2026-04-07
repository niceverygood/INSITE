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

const TYPE_KR: Record<string, string> = {
  server: '서버', network_device: '네트워크', system: '시스템', vm: 'VM',
}

export default function TrafficChart({ data, height = 260 }: Props) {
  const grouped: Record<string, { time: string; network_in: number; network_out: number }> = {}
  for (const m of data) {
    const timeKey = m.time.slice(11, 16)
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

  // Show top 5 by traffic
  const top5 = trafficSummary?.slice(0, 5) ?? []

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

      {/* Top 5 traffic table */}
      {top5.length > 0 && (
        <div className="mt-4">
          <h4 className="text-xs font-medium text-gray-400 mb-2">트래픽 상위 장비 (Kbps)</h4>
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-xs min-w-[500px]">
              <thead>
                <tr className="text-gray-500 border-b border-gray-700">
                  <th className="text-left py-1.5 px-2 font-medium">장비</th>
                  <th className="text-right py-1.5 px-2 font-medium">평균 In</th>
                  <th className="text-right py-1.5 px-2 font-medium">평균 Out</th>
                  <th className="text-right py-1.5 px-2 font-medium">최대 In</th>
                  <th className="text-right py-1.5 px-2 font-medium">최대 Out</th>
                </tr>
              </thead>
              <tbody>
                {top5.map((item) => (
                  <tr key={item.asset_id} className="border-b border-gray-700/50">
                    <td className="py-1.5 px-2">
                      <div className="text-gray-200 font-medium">{item.asset_name}</div>
                      <div className="text-gray-500 text-[10px]">{TYPE_KR[item.asset_type] || item.asset_type} · {item.location || '-'}</div>
                    </td>
                    <td className="py-1.5 px-2 text-blue-400 text-right font-mono">{item.avg_network_in.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                    <td className="py-1.5 px-2 text-emerald-400 text-right font-mono">{item.avg_network_out.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                    <td className="py-1.5 px-2 text-blue-300/70 text-right font-mono">{item.max_network_in.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                    <td className="py-1.5 px-2 text-emerald-300/70 text-right font-mono">{item.max_network_out.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
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
