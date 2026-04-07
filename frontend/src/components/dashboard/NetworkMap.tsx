import { useState, useMemo } from 'react'
import type { AssetStatus } from '@/types'

interface StatusMatrixItem {
  asset_id: string
  asset_name: string
  asset_type: string
  ip_address?: string
  status: AssetStatus | string
}

interface Props {
  items: StatusMatrixItem[]
}

interface TopoNode {
  id: string
  name: string
  type: string
  status: string
  tier: number
  x: number
  y: number
  count?: number // for grouped nodes
}

interface TopoEdge {
  from: string
  to: string
}

const STATUS_COLOR: Record<string, string> = {
  normal: '#10b981',
  warning: '#f59e0b',
  down: '#ef4444',
}
const GRAY = '#4b5563'

const TIER_Y = [40, 120, 210, 300, 400]
const TIER_LABEL = ['Internet', 'Firewall', 'Core Switch', 'Distribution', 'Server / VM / System']

function classify(item: StatusMatrixItem): number {
  const n = item.asset_name.toLowerCase()
  const t = item.asset_type.toLowerCase()
  if (n.includes('fw') || n.includes('firewall')) return 1
  if (n.includes('core')) return 2
  if (t === 'network_device' || n.includes('dist') || n.includes('lb-') || n.includes('switch')) return 3
  return 4
}

function buildGraph(items: StatusMatrixItem[]): { nodes: TopoNode[]; edges: TopoEdge[] } {
  if (!items.length) return { nodes: [], edges: [] }

  const W = 1000
  const buckets = new Map<number, StatusMatrixItem[]>()
  for (const it of items) {
    const tier = classify(it)
    if (!buckets.has(tier)) buckets.set(tier, [])
    buckets.get(tier)!.push(it)
  }

  const nodes: TopoNode[] = []
  const edges: TopoEdge[] = []
  const tierIds = new Map<number, string[]>()

  // Internet node
  nodes.push({ id: '__inet__', name: 'Internet', type: 'internet', status: 'normal', tier: 0, x: W / 2, y: TIER_Y[0] })
  tierIds.set(0, ['__inet__'])

  const MAX_PER_TIER = 8

  for (let tier = 1; tier <= 4; tier++) {
    const bucket = buckets.get(tier) ?? []
    if (!bucket.length) continue
    const ids: string[] = []

    const show = bucket.slice(0, MAX_PER_TIER)
    const extra = bucket.length - show.length
    const total = show.length + (extra > 0 ? 1 : 0)
    const pad = 80
    const usable = W - pad * 2
    const spacing = total > 1 ? usable / (total - 1) : 0

    show.forEach((it, i) => {
      const x = total === 1 ? W / 2 : pad + i * spacing
      nodes.push({ id: it.asset_id, name: it.asset_name, type: it.asset_type, status: it.status, tier, x, y: TIER_Y[tier] })
      ids.push(it.asset_id)
    })

    if (extra > 0) {
      const gid = `__group_${tier}__`
      const x = pad + show.length * spacing
      nodes.push({ id: gid, name: `+${extra}`, type: 'group', status: 'normal', tier, x, y: TIER_Y[tier], count: extra })
      ids.push(gid)
    }

    tierIds.set(tier, ids)

    // Edges to parent tier
    for (let pt = tier - 1; pt >= 0; pt--) {
      if (tierIds.has(pt)) {
        const parents = tierIds.get(pt)!
        for (const cid of ids) {
          const closest = parents.reduce((best, pid) => {
            const pn = nodes.find((n) => n.id === pid)!
            const cn = nodes.find((n) => n.id === cid)!
            const bn = nodes.find((n) => n.id === best)!
            return Math.abs(pn.x - cn.x) < Math.abs(bn.x - cn.x) ? pid : best
          }, parents[0])
          edges.push({ from: closest, to: cid })
        }
        break
      }
    }
  }

  return { nodes, edges }
}

export default function NetworkMap({ items }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const { nodes, edges } = useMemo(() => buildGraph(items), [items])

  if (!items.length) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 text-sm">
        등록된 네트워크 장비 없음
      </div>
    )
  }

  const selectedNode = nodes.find((n) => n.id === selectedId)
  const connectedEdges = edges.filter((e) => e.from === selectedId || e.to === selectedId)
  const connectedIds = new Set(connectedEdges.flatMap((e) => [e.from, e.to]))

  return (
    <div className="relative w-full" style={{ aspectRatio: '1000 / 460' }}>
      <svg viewBox="0 0 1000 460" className="w-full h-full" onClick={() => setSelectedId(null)}>
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Tier labels */}
        {TIER_LABEL.map((label, i) => {
          if (!nodes.some((n) => n.tier === i)) return null
          return (
            <text key={i} x={12} y={TIER_Y[i] + 4} fill="#6b7280" fontSize="10" fontWeight="500">
              {label}
            </text>
          )
        })}

        {/* Edges */}
        {edges.map((e, i) => {
          const from = nodes.find((n) => n.id === e.from)!
          const to = nodes.find((n) => n.id === e.to)!
          const highlight = connectedIds.has(e.from) && connectedIds.has(e.to) && selectedId
          const midY = (from.y + to.y) / 2
          return (
            <path
              key={i}
              d={`M${from.x},${from.y + 20} C${from.x},${midY} ${to.x},${midY} ${to.x},${to.y - 20}`}
              stroke={highlight ? '#60a5fa' : '#374151'}
              strokeWidth={highlight ? 2 : 1}
              fill="none"
              opacity={selectedId ? (highlight ? 1 : 0.2) : 0.6}
            />
          )
        })}

        {/* Nodes */}
        {nodes.map((node) => {
          const color = STATUS_COLOR[node.status] || GRAY
          const isSelected = node.id === selectedId
          const dimmed = selectedId && !isSelected && !connectedIds.has(node.id)

          return (
            <g
              key={node.id}
              onClick={(ev) => { ev.stopPropagation(); setSelectedId(isSelected ? null : node.id) }}
              style={{ cursor: 'pointer', opacity: dimmed ? 0.25 : 1, transition: 'opacity 0.2s' }}
            >
              {/* Node circle */}
              <ellipse
                cx={node.x} cy={node.y}
                rx={node.type === 'group' ? 24 : 30} ry={18}
                fill="#1f2937"
                stroke={isSelected ? '#60a5fa' : color}
                strokeWidth={isSelected ? 2.5 : 1.5}
                filter={isSelected ? 'url(#glow)' : undefined}
              />

              {/* Status dot */}
              <circle cx={node.x + 22} cy={node.y - 12} r={4} fill={color} />

              {/* Icon */}
              {node.type === 'internet' && (
                <text x={node.x} y={node.y + 4} textAnchor="middle" fill={color} fontSize="16">☁</text>
              )}
              {node.type === 'group' && (
                <text x={node.x} y={node.y + 5} textAnchor="middle" fill="#9ca3af" fontSize="12" fontWeight="bold">{node.name}</text>
              )}
              {node.type !== 'internet' && node.type !== 'group' && (
                <>
                  <rect x={node.x - 8} y={node.y - 7} width={16} height={12} rx={2} fill="none" stroke={color} strokeWidth={1.2} />
                  <line x1={node.x - 5} y1={node.y - 2} x2={node.x + 5} y2={node.y - 2} stroke={color} strokeWidth={0.8} />
                  <line x1={node.x - 5} y1={node.y + 1} x2={node.x + 5} y2={node.y + 1} stroke={color} strokeWidth={0.8} />
                </>
              )}

              {/* Name label */}
              {node.type !== 'group' && (
                <text x={node.x} y={node.y + 32} textAnchor="middle" fill="#d1d5db" fontSize="9" fontWeight="500">
                  {node.name}
                </text>
              )}
            </g>
          )
        })}
      </svg>

      {/* Tooltip */}
      {selectedNode && selectedNode.type !== 'group' && (
        <div
          className="absolute bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 shadow-xl pointer-events-none z-10"
          style={{
            left: `${(selectedNode.x / 1000) * 100}%`,
            top: `${(selectedNode.y / 460) * 100 - 12}%`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className="text-sm font-semibold text-white">{selectedNode.name}</div>
          <div className="text-[10px] text-gray-400 mt-0.5">유형: {selectedNode.type === 'internet' ? 'Internet' : selectedNode.type === 'network_device' ? '네트워크 장비' : selectedNode.type === 'server' ? '서버' : selectedNode.type === 'vm' ? 'VM' : selectedNode.type === 'system' ? '시스템' : selectedNode.type}</div>
          <div className="text-[10px] mt-0.5">
            <span className="text-gray-400">상태: </span>
            <span style={{ color: STATUS_COLOR[selectedNode.status] || GRAY }}>
              {selectedNode.status === 'normal' ? '정상' : selectedNode.status === 'warning' ? '경고' : '다운'}
            </span>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-2 right-3 flex gap-3 text-[10px]">
        {[['정상', '#10b981'], ['경고', '#f59e0b'], ['다운', '#ef4444']].map(([l, c]) => (
          <span key={l} className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: c as string }} />
            <span className="text-gray-400">{l}</span>
          </span>
        ))}
      </div>
    </div>
  )
}
