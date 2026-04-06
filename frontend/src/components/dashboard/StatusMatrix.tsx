import { cn } from '@/utils/cn'
import type { AssetStatus } from '@/types'

interface Props {
  items: { asset_id: string; asset_name: string; asset_type: string; status: AssetStatus }[]
}

const statusColors: Record<AssetStatus, string> = {
  normal: 'bg-green-500/20 border-green-500/40 text-green-400',
  warning: 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400',
  down: 'bg-red-500/20 border-red-500/40 text-red-400',
}

export default function StatusMatrix({ items }: Props) {
  const grouped = {
    normal: items.filter((i) => i.status === 'normal').length,
    warning: items.filter((i) => i.status === 'warning').length,
    down: items.filter((i) => i.status === 'down').length,
  }

  return (
    <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
      <h3 className="text-sm font-semibold text-gray-300 mb-4">자산 상태 현황</h3>
      <div className="grid grid-cols-3 gap-3">
        {(['normal', 'warning', 'down'] as AssetStatus[]).map((status) => (
          <div key={status} className={cn('rounded-lg border p-4 text-center', statusColors[status])}>
            <div className="text-3xl font-bold">{grouped[status]}</div>
            <div className="text-xs mt-1 opacity-80">
              {status === 'normal' ? '정상' : status === 'warning' ? '관리필요' : '다운'}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
