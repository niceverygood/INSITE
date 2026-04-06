import { cn } from '@/utils/cn'
import type { Alert } from '@/types'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'

interface Props {
  alerts: Alert[]
}

const severityStyle = {
  critical: 'bg-red-500/10 border-l-red-500 text-red-300',
  warning: 'bg-yellow-500/10 border-l-yellow-500 text-yellow-300',
  info: 'bg-blue-500/10 border-l-blue-500 text-blue-300',
}

export default function AlertFeed({ alerts }: Props) {
  return (
    <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
      <h3 className="text-sm font-semibold text-gray-300 mb-4">실시간 알람</h3>
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {alerts.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8">활성 알람 없음</p>
        ) : (
          alerts.slice(0, 10).map((alert) => (
            <div
              key={alert.id}
              className={cn('border-l-4 rounded-r-lg p-3 cursor-pointer hover:brightness-110 transition', severityStyle[alert.severity])}
            >
              <div className="flex justify-between items-start">
                <span className="text-sm font-medium">{alert.title}</span>
                <span className="text-[10px] text-gray-500 whitespace-nowrap ml-2">
                  {formatDistanceToNow(new Date(alert.fired_at), { addSuffix: true, locale: ko })}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1 line-clamp-1">{alert.message}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
