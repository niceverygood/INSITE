import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchAlerts, acknowledgeAlert, resolveAlert } from '@/services/api'
import { cn } from '@/utils/cn'
import { Check, CheckCheck, AlertTriangle, AlertCircle, Info } from 'lucide-react'
import type { Alert } from '@/types'

const severityIcon = {
  critical: <AlertCircle className="h-4 w-4 text-red-400" />,
  warning: <AlertTriangle className="h-4 w-4 text-yellow-400" />,
  info: <Info className="h-4 w-4 text-blue-400" />,
}

export default function AlertsPage() {
  const queryClient = useQueryClient()

  const { data: alerts, isLoading } = useQuery({
    queryKey: ['all-alerts'],
    queryFn: async () => (await fetchAlerts({ page_size: '100' })).data as Alert[],
    refetchInterval: 10_000,
  })

  const ackMutation = useMutation({
    mutationFn: acknowledgeAlert,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['all-alerts'] }),
  })

  const resolveMutation = useMutation({
    mutationFn: resolveAlert,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['all-alerts'] }),
  })

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">알람 관리</h1>

      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-900/50">
            <tr className="text-gray-400 text-left">
              <th className="px-4 py-3 font-medium">심각도</th>
              <th className="px-4 py-3 font-medium">제목</th>
              <th className="px-4 py-3 font-medium">상태</th>
              <th className="px-4 py-3 font-medium">발생 시각</th>
              <th className="px-4 py-3 font-medium">액션</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {isLoading ? (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-500">로딩 중...</td></tr>
            ) : !alerts?.length ? (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-500">알람이 없습니다</td></tr>
            ) : (
              alerts.map((alert) => (
                <tr key={alert.id} className="hover:bg-gray-700/50 transition-colors">
                  <td className="px-4 py-3">{severityIcon[alert.severity]}</td>
                  <td className="px-4 py-3 text-gray-200">{alert.title}</td>
                  <td className="px-4 py-3">
                    <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', {
                      'bg-red-500/20 text-red-400': alert.status === 'firing',
                      'bg-yellow-500/20 text-yellow-400': alert.status === 'acknowledged',
                      'bg-green-500/20 text-green-400': alert.status === 'resolved',
                    })}>
                      {alert.status === 'firing' ? '발생중' : alert.status === 'acknowledged' ? '확인됨' : '해결됨'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{new Date(alert.fired_at).toLocaleString('ko-KR')}</td>
                  <td className="px-4 py-3 flex gap-2">
                    {alert.status === 'firing' && (
                      <button onClick={() => ackMutation.mutate(alert.id)} className="flex items-center gap-1 text-xs text-yellow-400 hover:text-yellow-300">
                        <Check className="h-3.5 w-3.5" /> 확인
                      </button>
                    )}
                    {alert.status !== 'resolved' && (
                      <button onClick={() => resolveMutation.mutate(alert.id)} className="flex items-center gap-1 text-xs text-green-400 hover:text-green-300">
                        <CheckCheck className="h-3.5 w-3.5" /> 해결
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
