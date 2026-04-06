import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import type { AssetStatus } from '@/types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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
  ip: string
  type: string
  status: string
  tier: number      // 0 = internet, 1 = firewall, 2 = core, 3 = dist, 4 = access
  x: number
  y: number
}

interface TopoEdge {
  from: string
  to: string
}

interface Tooltip {
  x: number
  y: number
  node: TopoNode
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_FILL: Record<string, string> = {
  normal: '#10b981',
  warning: '#f59e0b',
  down: '#ef4444',
}
const STATUS_FILL_DEFAULT = '#6b7280'

const TIER_LABELS = ['Internet', 'Firewall', 'Core Switch', 'Distribution', 'Server / VM']

const TIER_ICON: Record<number, string> = {
  0: 'cloud',
  1: 'shield',
  2: 'switch',
  3: 'switch',
  4: 'server',
}

const VIEW_W = 900
const VIEW_H = 420
const TIER_Y = [30, 100, 190, 280, 370]
const NODE_RX = 32
const NODE_RY = 20

// ---------------------------------------------------------------------------
// Helpers: classify asset_type / asset_name into a topology tier
// ---------------------------------------------------------------------------

function classifyTier(item: StatusMatrixItem): number {
  const t = (item.asset_type ?? '').toLowerCase()
  const n = (item.asset_name ?? '').toLowerCase()

  if (t.includes('firewall') || n.includes('firewall') || n.includes('fw')) return 1
  if (t.includes('core') || n.includes('core')) return 2
  if (
    t === 'network_device' ||
    t.includes('switch') ||
    t.includes('router') ||
    n.includes('switch') ||
    n.includes('router') ||
    n.includes('dist')
  )
    return 3
  if (t === 'server' || t === 'vm' || t === 'system' || t.includes('server') || t.includes('vm'))
    return 4
  // fallback: put unknown items in the access / server tier
  return 4
}

// ---------------------------------------------------------------------------
// Build the topology graph from flat items
// ---------------------------------------------------------------------------

function buildTopology(items: StatusMatrixItem[]): { nodes: TopoNode[]; edges: TopoEdge[] } {
  if (items.length === 0) return { nodes: [], edges: [] }

  // Classify items into tiers
  const tierBuckets: Map<number, StatusMatrixItem[]> = new Map()
  for (const item of items) {
    const tier = classifyTier(item)
    if (!tierBuckets.has(tier)) tierBuckets.set(tier, [])
    tierBuckets.get(tier)!.push(item)
  }

  // Always add a virtual Internet node at tier 0
  const nodes: TopoNode[] = []
  const edges: TopoEdge[] = []

  const internetNode: TopoNode = {
    id: '__internet__',
    name: 'Internet',
    ip: '',
    type: 'internet',
    status: 'normal',
    tier: 0,
    x: VIEW_W / 2,
    y: TIER_Y[0],
  }
  nodes.push(internetNode)

  // Place nodes per tier, evenly spaced horizontally
  const tierNodeIds: Map<number, string[]> = new Map()
  tierNodeIds.set(0, ['__internet__'])

  for (let tier = 1; tier <= 4; tier++) {
    const bucket = tierBuckets.get(tier) ?? []
    const ids: string[] = []
    const count = bucket.length
    if (count === 0) continue

    const padding = 80
    const usable = VIEW_W - padding * 2
    const spacing = count > 1 ? usable / (count - 1) : 0

    bucket.forEach((item, i) => {
      const x = count === 1 ? VIEW_W / 2 : padding + i * spacing
      const y = TIER_Y[tier]
      const node: TopoNode = {
        id: item.asset_id,
        name: item.asset_name,
        ip: item.ip_address ?? '',
        type: item.asset_type,
        status: item.status,
        tier,
        x,
        y,
      }
      nodes.push(node)
      ids.push(item.asset_id)
    })
    tierNodeIds.set(tier, ids)
  }

  // Build edges: connect each tier to the closest higher tier that has nodes
  const populatedTiers = Array.from(tierNodeIds.keys()).sort((a, b) => a - b)

  for (let idx = 1; idx < populatedTiers.length; idx++) {
    const parentTier = populatedTiers[idx - 1]
    const childTier = populatedTiers[idx]
    const parentIds = tierNodeIds.get(parentTier) ?? []
    const childIds = tierNodeIds.get(childTier) ?? []

    // If only one parent, connect all children to it; else distribute
    if (parentIds.length === 1) {
      for (const cid of childIds) {
        edges.push({ from: parentIds[0], to: cid })
      }
    } else {
      // Connect each child to its nearest parent by x position
      const parentNodes = parentIds.map((pid) => nodes.find((n) => n.id === pid)!)
      for (const cid of childIds) {
        const child = nodes.find((n) => n.id === cid)!
        let nearest = parentNodes[0]
        let minDist = Math.abs(child.x - nearest.x)
        for (const pn of parentNodes) {
          const d = Math.abs(child.x - pn.x)
          if (d < minDist) {
            minDist = d
            nearest = pn
          }
        }
        edges.push({ from: nearest.id, to: cid })
      }
    }
  }

  return { nodes, edges }
}

// ---------------------------------------------------------------------------
// SVG icon paths (simplified)
// ---------------------------------------------------------------------------

function NodeIcon({ type, x, y, color }: { type: string; x: number; y: number; color: string }) {
  const s = 10
  switch (type) {
    case 'cloud':
      return (
        <path
          d={`M${x - s},${y + 2}
              a${s * 0.6},${s * 0.6} 0 0,1 ${s * 0.3},-${s * 0.7}
              a${s * 0.5},${s * 0.5} 0 0,1 ${s * 0.9},0
              a${s * 0.55},${s * 0.55} 0 0,1 ${s * 0.5},${s * 0.7}
              z`}
          fill={color}
          opacity={0.9}
        />
      )
    case 'shield':
      return (
        <path
          d={`M${x},${y - s} L${x + s * 0.75},${y - s * 0.4} L${x + s * 0.75},${y + s * 0.3}
              Q${x},${y + s} ${x},${y + s} Q${x},${y + s} ${x - s * 0.75},${y + s * 0.3}
              L${x - s * 0.75},${y - s * 0.4} Z`}
          fill={color}
          opacity={0.9}
        />
      )
    case 'switch':
      return (
        <rect
          x={x - s}
          y={y - s * 0.5}
          width={s * 2}
          height={s}
          rx={2}
          fill={color}
          opacity={0.9}
        />
      )
    case 'server':
    default:
      return (
        <g>
          <rect
            x={x - s * 0.7}
            y={y - s}
            width={s * 1.4}
            height={s * 0.55}
            rx={1.5}
            fill={color}
            opacity={0.9}
          />
          <rect
            x={x - s * 0.7}
            y={y - s * 0.35}
            width={s * 1.4}
            height={s * 0.55}
            rx={1.5}
            fill={color}
            opacity={0.85}
          />
          <rect
            x={x - s * 0.7}
            y={y + s * 0.3}
            width={s * 1.4}
            height={s * 0.55}
            rx={1.5}
            fill={color}
            opacity={0.8}
          />
        </g>
      )
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function NetworkMap({ items }: Props) {
  const [tooltip, setTooltip] = useState<Tooltip | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const { nodes, edges } = useMemo(() => buildTopology(items), [items])

  // Build lookup
  const nodeMap = useMemo(() => {
    const m = new Map<string, TopoNode>()
    for (const n of nodes) m.set(n.id, n)
    return m
  }, [nodes])

  // Close tooltip on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (svgRef.current && !svgRef.current.contains(e.target as Node)) {
        setTooltip(null)
        setSelectedId(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleNodeClick = useCallback(
    (node: TopoNode, e: React.MouseEvent) => {
      e.stopPropagation()
      if (selectedId === node.id) {
        setTooltip(null)
        setSelectedId(null)
        return
      }
      setSelectedId(node.id)
      setTooltip({ x: node.x, y: node.y, node })
    },
    [selectedId],
  )

  const handleBgClick = useCallback(() => {
    setTooltip(null)
    setSelectedId(null)
  }, [])

  // connected edge highlight
  const connectedEdges = useMemo(() => {
    if (!selectedId) return new Set<string>()
    const set = new Set<string>()
    for (const e of edges) {
      if (e.from === selectedId || e.to === selectedId) set.add(`${e.from}-${e.to}`)
    }
    return set
  }, [selectedId, edges])

  const statusLabel = (s: string) =>
    s === 'normal' ? '정상' : s === 'warning' ? '경고' : s === 'down' ? '다운' : '알 수 없음'
  const typeLabel = (t: string) => {
    if (t === 'internet') return 'Internet'
    if (t === 'server') return '서버'
    if (t === 'vm') return '가상머신'
    if (t === 'network_device') return '네트워크 장비'
    if (t === 'system') return '시스템'
    return t
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  const isEmpty = items.length === 0

  return (
    <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
      <h3 className="text-sm font-semibold text-gray-300 mb-4">네트워크 토폴로지</h3>

      <div className="relative w-full bg-gray-900/50 rounded-lg overflow-hidden" style={{ minHeight: 320 }}>
        {isEmpty ? (
          <p className="text-gray-500 text-sm text-center pt-24">등록된 네트워크 장비 없음</p>
        ) : (
          <svg
            ref={svgRef}
            width="100%"
            height="100%"
            viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
            preserveAspectRatio="xMidYMid meet"
            className="select-none"
            onClick={handleBgClick}
          >
            <defs>
              {/* glow filter for selected node */}
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              {/* gradient for edges */}
              <linearGradient id="edgeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4b5563" stopOpacity={0.6} />
                <stop offset="100%" stopColor="#4b5563" stopOpacity={0.2} />
              </linearGradient>

              {/* subtle animated pulse */}
              <radialGradient id="pulseGreen">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </radialGradient>
              <radialGradient id="pulseYellow">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
              </radialGradient>
              <radialGradient id="pulseRed">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.6} />
                <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
              </radialGradient>
            </defs>

            {/* Tier labels on left */}
            {TIER_Y.map((y, i) => {
              // Only show label if tier has nodes
              const hasTier = nodes.some((n) => n.tier === i)
              if (!hasTier) return null
              return (
                <text
                  key={i}
                  x={12}
                  y={y + 4}
                  fill="#6b7280"
                  fontSize={9}
                  fontFamily="monospace"
                >
                  {TIER_LABELS[i]}
                </text>
              )
            })}

            {/* Edges */}
            {edges.map((edge) => {
              const from = nodeMap.get(edge.from)
              const to = nodeMap.get(edge.to)
              if (!from || !to) return null
              const key = `${edge.from}-${edge.to}`
              const isHighlighted = connectedEdges.has(key)
              const midY = (from.y + to.y) / 2
              return (
                <path
                  key={key}
                  d={`M${from.x},${from.y + NODE_RY} C${from.x},${midY} ${to.x},${midY} ${to.x},${to.y - NODE_RY}`}
                  stroke={isHighlighted ? '#60a5fa' : '#4b5563'}
                  strokeWidth={isHighlighted ? 2 : 1}
                  strokeOpacity={isHighlighted ? 0.9 : 0.35}
                  fill="none"
                  strokeDasharray={isHighlighted ? undefined : '4 3'}
                />
              )
            })}

            {/* Nodes */}
            {nodes.map((node) => {
              const fill = STATUS_FILL[node.status] ?? STATUS_FILL_DEFAULT
              const isSelected = selectedId === node.id
              const iconType = TIER_ICON[node.tier] ?? 'server'

              return (
                <g
                  key={node.id}
                  className="cursor-pointer"
                  onClick={(e) => handleNodeClick(node, e)}
                >
                  {/* Pulse ring for down/warning status */}
                  {node.status === 'down' && (
                    <ellipse
                      cx={node.x}
                      cy={node.y}
                      rx={NODE_RX + 6}
                      ry={NODE_RY + 6}
                      fill="url(#pulseRed)"
                    >
                      <animate
                        attributeName="rx"
                        values={`${NODE_RX + 2};${NODE_RX + 10};${NODE_RX + 2}`}
                        dur="2s"
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="ry"
                        values={`${NODE_RY + 2};${NODE_RY + 8};${NODE_RY + 2}`}
                        dur="2s"
                        repeatCount="indefinite"
                      />
                    </ellipse>
                  )}
                  {node.status === 'warning' && (
                    <ellipse
                      cx={node.x}
                      cy={node.y}
                      rx={NODE_RX + 4}
                      ry={NODE_RY + 4}
                      fill="url(#pulseYellow)"
                    >
                      <animate
                        attributeName="rx"
                        values={`${NODE_RX + 1};${NODE_RX + 7};${NODE_RX + 1}`}
                        dur="3s"
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="ry"
                        values={`${NODE_RY + 1};${NODE_RY + 5};${NODE_RY + 1}`}
                        dur="3s"
                        repeatCount="indefinite"
                      />
                    </ellipse>
                  )}

                  {/* Node body */}
                  <ellipse
                    cx={node.x}
                    cy={node.y}
                    rx={NODE_RX}
                    ry={NODE_RY}
                    fill="#1f2937"
                    stroke={fill}
                    strokeWidth={isSelected ? 2.5 : 1.5}
                    opacity={isSelected ? 1 : 0.9}
                    filter={isSelected ? 'url(#glow)' : undefined}
                  />

                  {/* Icon */}
                  <NodeIcon type={iconType} x={node.x} y={node.y - 1} color={fill} />

                  {/* Name label */}
                  <text
                    x={node.x}
                    y={node.y + NODE_RY + 12}
                    textAnchor="middle"
                    fill="#d1d5db"
                    fontSize={10}
                    fontWeight={500}
                  >
                    {node.name.length > 14 ? node.name.slice(0, 13) + '...' : node.name}
                  </text>

                  {/* IP label */}
                  {node.ip && (
                    <text
                      x={node.x}
                      y={node.y + NODE_RY + 23}
                      textAnchor="middle"
                      fill="#6b7280"
                      fontSize={8}
                    >
                      {node.ip}
                    </text>
                  )}

                  {/* Tiny status dot */}
                  <circle cx={node.x + NODE_RX - 4} cy={node.y - NODE_RY + 4} r={4} fill={fill} />
                </g>
              )
            })}

            {/* Tooltip */}
            {tooltip && (
              <g>
                {/* Background rect */}
                <rect
                  x={Math.min(tooltip.x + 20, VIEW_W - 200)}
                  y={Math.max(tooltip.y - 60, 5)}
                  width={180}
                  height={76}
                  rx={8}
                  fill="#111827"
                  stroke="#374151"
                  strokeWidth={1}
                  opacity={0.97}
                />
                {/* Tooltip content */}
                <text
                  x={Math.min(tooltip.x + 30, VIEW_W - 190)}
                  y={Math.max(tooltip.y - 60, 5) + 18}
                  fill="#f9fafb"
                  fontSize={12}
                  fontWeight={600}
                >
                  {tooltip.node.name}
                </text>
                <text
                  x={Math.min(tooltip.x + 30, VIEW_W - 190)}
                  y={Math.max(tooltip.y - 60, 5) + 34}
                  fill="#9ca3af"
                  fontSize={10}
                >
                  유형: {typeLabel(tooltip.node.type)}
                </text>
                <text
                  x={Math.min(tooltip.x + 30, VIEW_W - 190)}
                  y={Math.max(tooltip.y - 60, 5) + 48}
                  fill="#9ca3af"
                  fontSize={10}
                >
                  상태: {statusLabel(tooltip.node.status)}
                </text>
                {tooltip.node.ip && (
                  <text
                    x={Math.min(tooltip.x + 30, VIEW_W - 190)}
                    y={Math.max(tooltip.y - 60, 5) + 62}
                    fill="#9ca3af"
                    fontSize={10}
                  >
                    IP: {tooltip.node.ip}
                  </text>
                )}
                {/* Status indicator in tooltip */}
                <circle
                  cx={Math.min(tooltip.x + 20, VIEW_W - 200) + 165}
                  cy={Math.max(tooltip.y - 60, 5) + 15}
                  r={5}
                  fill={STATUS_FILL[tooltip.node.status] ?? STATUS_FILL_DEFAULT}
                />
              </g>
            )}

            {/* Legend */}
            <g transform={`translate(${VIEW_W - 120}, ${VIEW_H - 55})`}>
              <rect x={-8} y={-12} width={120} height={60} rx={6} fill="#111827" opacity={0.7} />
              {[
                { label: '정상', color: '#10b981' },
                { label: '경고', color: '#f59e0b' },
                { label: '다운', color: '#ef4444' },
                { label: '알 수 없음', color: '#6b7280' },
              ].map((item, i) => (
                <g key={item.label} transform={`translate(0, ${i * 12})`}>
                  <circle cx={4} cy={0} r={3.5} fill={item.color} />
                  <text x={14} y={3.5} fill="#9ca3af" fontSize={9}>
                    {item.label}
                  </text>
                </g>
              ))}
            </g>
          </svg>
        )}
      </div>
    </div>
  )
}
