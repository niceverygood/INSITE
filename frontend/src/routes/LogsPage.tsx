import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { searchLogs } from '@/services/api'
import { cn } from '@/utils/cn'
import { Search } from 'lucide-react'
import type { LogEntry } from '@/types'

const levelColor: Record<string, string> = {
  debug: 'text-gray-400',
  info: 'text-blue-400',
  warn: 'text-yellow-400',
  error: 'text-red-400',
  critical: 'text-red-500 font-bold',
}

export default function LogsPage() {
  const [query, setQuery] = useState('')
  const [level, setLevel] = useState('')

  const { data: logs, isLoading } = useQuery({
    queryKey: ['logs', query, level],
    queryFn: async () => {
      const params: Record<string, string> = { page_size: '100' }
      if (query) params.query = query
      if (level) params.level = level
      return (await searchLogs(params)).data as LogEntry[]
    },
  })

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">로그 검색</h1>

      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="로그 메시지 검색..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <select value={level} onChange={(e) => setLevel(e.target.value)} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200">
          <option value="">전체 레벨</option>
          <option value="debug">Debug</option>
          <option value="info">Info</option>
          <option value="warn">Warn</option>
          <option value="error">Error</option>
          <option value="critical">Critical</option>
        </select>
      </div>

      <div className="bg-gray-950 rounded-xl border border-gray-700 font-mono text-xs overflow-auto max-h-[70vh]">
        {isLoading ? (
          <p className="text-gray-500 text-center py-12">로딩 중...</p>
        ) : !logs?.length ? (
          <p className="text-gray-500 text-center py-12">로그가 없습니다</p>
        ) : (
          <table className="w-full">
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-900/50 border-b border-gray-800/50">
                  <td className="px-3 py-1.5 text-gray-600 whitespace-nowrap">{new Date(log.timestamp).toLocaleString('ko-KR')}</td>
                  <td className={cn('px-2 py-1.5 whitespace-nowrap uppercase', levelColor[log.level])}>{log.level}</td>
                  <td className="px-3 py-1.5 text-gray-300 break-all">{log.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
