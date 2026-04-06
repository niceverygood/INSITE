import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import type { Metric } from '@/types'

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
    </div>
  )
}
