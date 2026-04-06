import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

interface Props {
  label: string
  value: number
  unit?: string
}

function getColor(value: number) {
  if (value >= 90) return '#ef4444'
  if (value >= 70) return '#f59e0b'
  return '#10b981'
}

export default function ResourceGauge({ label, value, unit = '%' }: Props) {
  const color = getColor(value)
  const data = [
    { name: 'used', value },
    { name: 'free', value: 100 - value },
  ]

  return (
    <div className="flex flex-col items-center">
      <div className="w-24 h-24 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={28}
              outerRadius={40}
              startAngle={90}
              endAngle={-270}
              dataKey="value"
              stroke="none"
            >
              <Cell fill={color} />
              <Cell fill="#374151" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold" style={{ color }}>{value.toFixed(0)}{unit}</span>
        </div>
      </div>
      <span className="text-xs text-gray-400 mt-1">{label}</span>
    </div>
  )
}
