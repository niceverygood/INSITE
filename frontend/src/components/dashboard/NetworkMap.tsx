interface Node {
  id: string
  name: string
  ip: string
  status: string
  x?: number
  y?: number
}

interface Props {
  nodes: Node[]
}

const statusColor: Record<string, string> = {
  normal: '#10b981',
  warning: '#f59e0b',
  down: '#ef4444',
}

export default function NetworkMap({ nodes }: Props) {
  return (
    <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
      <h3 className="text-sm font-semibold text-gray-300 mb-4">네트워크 토폴로지</h3>
      <div className="relative w-full h-64 bg-gray-900/50 rounded-lg overflow-hidden">
        {nodes.length === 0 ? (
          <p className="text-gray-500 text-sm text-center pt-24">등록된 네트워크 장비 없음</p>
        ) : (
          <svg width="100%" height="100%" viewBox="0 0 600 250">
            {nodes.map((node, i) => {
              const cx = node.x ?? 60 + (i % 8) * 70
              const cy = node.y ?? 40 + Math.floor(i / 8) * 80
              return (
                <g key={node.id}>
                  <circle cx={cx} cy={cy} r={18} fill={statusColor[node.status] ?? '#6b7280'} opacity={0.3} />
                  <circle cx={cx} cy={cy} r={10} fill={statusColor[node.status] ?? '#6b7280'} />
                  <text x={cx} y={cy + 30} textAnchor="middle" fill="#9ca3af" fontSize={9}>
                    {node.name}
                  </text>
                </g>
              )
            })}
          </svg>
        )}
      </div>
    </div>
  )
}
