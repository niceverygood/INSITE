import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchAssets } from '@/services/api'
import { cn } from '@/utils/cn'
import { Search, Plus, Server, Wifi, Monitor, Cloud } from 'lucide-react'
import type { Asset, AssetType, AssetStatus } from '@/types'

const typeIcons: Record<AssetType, typeof Server> = {
  server: Server,
  network_device: Wifi,
  system: Monitor,
  vm: Cloud,
}

const statusBadge: Record<AssetStatus, string> = {
  normal: 'bg-green-500/20 text-green-400',
  warning: 'bg-yellow-500/20 text-yellow-400',
  down: 'bg-red-500/20 text-red-400',
}

export default function AssetsPage() {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['assets', search, typeFilter, statusFilter, page],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, page_size: 20 }
      if (search) params.search = search
      if (typeFilter) params.asset_type = typeFilter
      if (statusFilter) params.status = statusFilter
      return (await fetchAssets(params)).data
    },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">자산 관리</h1>
        <button className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus className="h-4 w-4" /> 자산 등록
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="이름 또는 IP로 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200">
          <option value="">전체 유형</option>
          <option value="server">서버</option>
          <option value="network_device">네트워크 장비</option>
          <option value="system">시스템</option>
          <option value="vm">VM</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200">
          <option value="">전체 상태</option>
          <option value="normal">정상</option>
          <option value="warning">관리필요</option>
          <option value="down">다운</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-900/50">
            <tr className="text-gray-400 text-left">
              <th className="px-4 py-3 font-medium">유형</th>
              <th className="px-4 py-3 font-medium">이름</th>
              <th className="px-4 py-3 font-medium">IP</th>
              <th className="px-4 py-3 font-medium">위치</th>
              <th className="px-4 py-3 font-medium">상태</th>
              <th className="px-4 py-3 font-medium">최근 응답</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {isLoading ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-500">로딩 중...</td></tr>
            ) : !data?.items?.length ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-500">등록된 자산이 없습니다</td></tr>
            ) : (
              data.items.map((asset: Asset) => {
                const Icon = typeIcons[asset.asset_type] || Server
                return (
                  <tr key={asset.id} className="hover:bg-gray-700/50 cursor-pointer transition-colors">
                    <td className="px-4 py-3"><Icon className="h-4 w-4 text-gray-400" /></td>
                    <td className="px-4 py-3 text-gray-200 font-medium">{asset.name}</td>
                    <td className="px-4 py-3 text-gray-400 font-mono text-xs">{asset.ip_address}</td>
                    <td className="px-4 py-3 text-gray-400">{asset.location ?? '-'}</td>
                    <td className="px-4 py-3">
                      <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', statusBadge[asset.status])}>
                        {asset.status === 'normal' ? '정상' : asset.status === 'warning' ? '관리필요' : '다운'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {asset.last_heartbeat ? new Date(asset.last_heartbeat).toLocaleString('ko-KR') : '-'}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && data.total > data.page_size && (
        <div className="flex justify-center gap-2 mt-4">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-3 py-1 bg-gray-800 rounded text-sm disabled:opacity-30">이전</button>
          <span className="px-3 py-1 text-sm text-gray-400">{page} / {Math.ceil(data.total / data.page_size)}</span>
          <button disabled={page >= Math.ceil(data.total / data.page_size)} onClick={() => setPage(page + 1)} className="px-3 py-1 bg-gray-800 rounded text-sm disabled:opacity-30">다음</button>
        </div>
      )}
    </div>
  )
}
