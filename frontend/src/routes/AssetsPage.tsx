import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchAssets, createAsset } from '@/services/api'
import { cn } from '@/utils/cn'
import { Search, Plus, Server, Wifi, Monitor, Cloud, X, ChevronDown, ChevronUp, Cpu, HardDrive, MemoryStick, MapPin, Clock, Info } from 'lucide-react'
import type { Asset, AssetType, AssetStatus } from '@/types'

const typeIcons: Record<AssetType, typeof Server> = {
  server: Server,
  network_device: Wifi,
  system: Monitor,
  vm: Cloud,
}

const typeLabels: Record<AssetType, string> = {
  server: '서버',
  network_device: '네트워크 장비',
  system: '시스템',
  vm: '가상머신',
}

const statusConfig: Record<AssetStatus, { label: string; cls: string }> = {
  normal: { label: '정상', cls: 'bg-green-500/20 text-green-400' },
  warning: { label: '관리필요', cls: 'bg-yellow-500/20 text-yellow-400' },
  down: { label: '다운', cls: 'bg-red-500/20 text-red-400' },
}

export default function AssetsPage() {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [page, setPage] = useState(1)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const queryClient = useQueryClient()

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
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="h-4 w-4" /> 자산 등록
        </button>
      </div>

      {/* Stats cards */}
      {data && (
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-white">{data.total}</div>
            <div className="text-xs text-gray-400">전체 자산</div>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-400">{data.items?.filter((a: Asset) => a.status === 'normal').length || 0}</div>
            <div className="text-xs text-gray-400">정상</div>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-yellow-400">{data.items?.filter((a: Asset) => a.status === 'warning').length || 0}</div>
            <div className="text-xs text-gray-400">관리필요</div>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-red-400">{data.items?.filter((a: Asset) => a.status === 'down').length || 0}</div>
            <div className="text-xs text-gray-400">다운</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="이름 또는 IP로 검색..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1) }} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200">
          <option value="">전체 유형</option>
          <option value="server">서버</option>
          <option value="network_device">네트워크 장비</option>
          <option value="system">시스템</option>
          <option value="vm">VM</option>
        </select>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200">
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
              <th className="px-4 py-3 font-medium w-10"></th>
              <th className="px-4 py-3 font-medium">유형</th>
              <th className="px-4 py-3 font-medium">이름</th>
              <th className="px-4 py-3 font-medium">IP 주소</th>
              <th className="px-4 py-3 font-medium">MAC 주소</th>
              <th className="px-4 py-3 font-medium">위치</th>
              <th className="px-4 py-3 font-medium">상태</th>
              <th className="px-4 py-3 font-medium">최근 응답</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {isLoading ? (
              <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-500">로딩 중...</td></tr>
            ) : !data?.items?.length ? (
              <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-500">등록된 자산이 없습니다</td></tr>
            ) : (
              data.items.map((asset: Asset) => {
                const Icon = typeIcons[asset.asset_type] || Server
                const expanded = expandedId === asset.id
                const st = statusConfig[asset.status] || statusConfig.normal
                const extra = asset.extra_info || {}
                return (
                  <>
                    <tr
                      key={asset.id}
                      onClick={() => setExpandedId(expanded ? null : asset.id)}
                      className="hover:bg-gray-700/50 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 text-gray-500">
                        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-gray-400" />
                          <span className="text-xs text-gray-500">{typeLabels[asset.asset_type] || asset.asset_type}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-200 font-medium">{asset.name}</td>
                      <td className="px-4 py-3 text-gray-400 font-mono text-xs">{asset.ip_address}</td>
                      <td className="px-4 py-3 text-gray-500 font-mono text-xs">{asset.mac_address || '-'}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{asset.location ?? '-'}</td>
                      <td className="px-4 py-3">
                        <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', st.cls)}>{st.label}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {asset.last_heartbeat ? new Date(asset.last_heartbeat).toLocaleString('ko-KR') : '-'}
                      </td>
                    </tr>
                    {expanded && (
                      <tr key={`${asset.id}-detail`} className="bg-gray-900/50">
                        <td colSpan={8} className="px-6 py-4">
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {extra.os && (
                              <div className="flex items-center gap-2">
                                <Monitor className="h-4 w-4 text-blue-400" />
                                <div>
                                  <div className="text-[10px] text-gray-500">운영체제</div>
                                  <div className="text-xs text-gray-200">{extra.os}</div>
                                </div>
                              </div>
                            )}
                            {extra.cpu && (
                              <div className="flex items-center gap-2">
                                <Cpu className="h-4 w-4 text-green-400" />
                                <div>
                                  <div className="text-[10px] text-gray-500">CPU</div>
                                  <div className="text-xs text-gray-200">{extra.cpu}</div>
                                </div>
                              </div>
                            )}
                            {extra.ram && (
                              <div className="flex items-center gap-2">
                                <MemoryStick className="h-4 w-4 text-purple-400" />
                                <div>
                                  <div className="text-[10px] text-gray-500">메모리</div>
                                  <div className="text-xs text-gray-200">{extra.ram}</div>
                                </div>
                              </div>
                            )}
                            {extra.role && (
                              <div className="flex items-center gap-2">
                                <Info className="h-4 w-4 text-yellow-400" />
                                <div>
                                  <div className="text-[10px] text-gray-500">역할</div>
                                  <div className="text-xs text-gray-200">{extra.role}</div>
                                </div>
                              </div>
                            )}
                            {extra.vendor && (
                              <div className="flex items-center gap-2">
                                <HardDrive className="h-4 w-4 text-orange-400" />
                                <div>
                                  <div className="text-[10px] text-gray-500">제조사 / 모델</div>
                                  <div className="text-xs text-gray-200">{extra.vendor} {extra.model}</div>
                                </div>
                              </div>
                            )}
                            {extra.firmware && (
                              <div className="flex items-center gap-2">
                                <Info className="h-4 w-4 text-cyan-400" />
                                <div>
                                  <div className="text-[10px] text-gray-500">펌웨어</div>
                                  <div className="text-xs text-gray-200">{extra.firmware}</div>
                                </div>
                              </div>
                            )}
                            {extra.hypervisor && (
                              <div className="flex items-center gap-2">
                                <Cloud className="h-4 w-4 text-indigo-400" />
                                <div>
                                  <div className="text-[10px] text-gray-500">하이퍼바이저</div>
                                  <div className="text-xs text-gray-200">{extra.hypervisor}</div>
                                </div>
                              </div>
                            )}
                            {extra.type && (
                              <div className="flex items-center gap-2">
                                <Info className="h-4 w-4 text-teal-400" />
                                <div>
                                  <div className="text-[10px] text-gray-500">플랫폼</div>
                                  <div className="text-xs text-gray-200">{extra.type} {extra.version}</div>
                                </div>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-red-400" />
                              <div>
                                <div className="text-[10px] text-gray-500">위치</div>
                                <div className="text-xs text-gray-200">{asset.location || '-'}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-gray-400" />
                              <div>
                                <div className="text-[10px] text-gray-500">등록일</div>
                                <div className="text-xs text-gray-200">{asset.created_at ? new Date(asset.created_at).toLocaleDateString('ko-KR') : '-'}</div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && data.total > data.page_size && (
        <div className="flex justify-center gap-2 mt-4">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-3 py-1 bg-gray-800 rounded text-sm text-gray-300 disabled:opacity-30">이전</button>
          <span className="px-3 py-1 text-sm text-gray-400">{page} / {Math.ceil(data.total / data.page_size)}</span>
          <button disabled={page >= Math.ceil(data.total / data.page_size)} onClick={() => setPage(page + 1)} className="px-3 py-1 bg-gray-800 rounded text-sm text-gray-300 disabled:opacity-30">다음</button>
        </div>
      )}

      {/* Create Asset Modal */}
      {showCreateModal && (
        <CreateAssetModal onClose={() => setShowCreateModal(false)} onCreated={() => { queryClient.invalidateQueries({ queryKey: ['assets'] }); setShowCreateModal(false) }} />
      )}
    </div>
  )
}

function CreateAssetModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    asset_type: 'server',
    name: '',
    ip_address: '',
    mac_address: '',
    location: '',
  })
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: () => createAsset(form as any),
    onSuccess: () => onCreated(),
    onError: (err: any) => setError(err.response?.data?.detail || '자산 등록에 실패했습니다'),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.ip_address) { setError('이름과 IP는 필수 항목입니다'); return }
    mutation.mutate()
  }

  const set = (k: string, v: string) => setForm({ ...form, [k]: v })

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white">자산 등록</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="h-5 w-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 block mb-1">자산 유형 *</label>
            <select value={form.asset_type} onChange={(e) => set('asset_type', e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-200">
              <option value="server">서버</option>
              <option value="network_device">네트워크 장비</option>
              <option value="system">시스템</option>
              <option value="vm">가상머신</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">자산명 *</label>
            <input type="text" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="예: WEB-PRD-04"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-200 placeholder-gray-500" />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">IP 주소 *</label>
            <input type="text" value={form.ip_address} onChange={(e) => set('ip_address', e.target.value)} placeholder="예: 10.0.1.13"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-200 font-mono placeholder-gray-500" />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">MAC 주소</label>
            <input type="text" value={form.mac_address} onChange={(e) => set('mac_address', e.target.value)} placeholder="예: 00:1A:2B:3C:4D:5E"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-200 font-mono placeholder-gray-500" />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">설치 위치</label>
            <input type="text" value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="예: 서울 IDC A동 3F"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-200 placeholder-gray-500" />
          </div>

          {error && <p className="text-red-400 text-xs">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-200 py-2.5 rounded-lg text-sm font-medium transition-colors">취소</button>
            <button type="submit" disabled={mutation.isPending}
              className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:opacity-40 text-white py-2.5 rounded-lg text-sm font-medium transition-colors">
              {mutation.isPending ? '등록 중...' : '등록'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
