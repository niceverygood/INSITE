import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchReports, generateReport } from '@/services/api'
import { FileText, Download, Calendar, FileSpreadsheet, File, Clock } from 'lucide-react'
import { DEMO_REPORTS } from '@/data/demo'

const typeColors: Record<string, string> = {
  '일간': 'bg-blue-500/20 text-blue-400',
  '주간': 'bg-purple-500/20 text-purple-400',
  '월간': 'bg-orange-500/20 text-orange-400',
}

export default function ReportsPage() {
  const [reportType, setReportType] = useState('daily')
  const [format, setFormat] = useState('pdf')
  const queryClient = useQueryClient()

  const { data: apiReports } = useQuery({
    queryKey: ['reports'],
    queryFn: async () => (await fetchReports()).data,
  })
  const reports = apiReports?.length ? apiReports : DEMO_REPORTS

  const generateMutation = useMutation({
    mutationFn: () => generateReport({ report_type: reportType, format }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reports'] }),
  })

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">리포트</h1>

      {/* Generate card */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-5 mb-6">
        <h3 className="text-sm font-semibold text-gray-300 mb-4">리포트 생성</h3>
        <div className="flex gap-3 items-end">
          <div>
            <label className="text-[10px] text-gray-500 block mb-1">기간</label>
            <select value={reportType} onChange={(e) => setReportType(e.target.value)} className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200">
              <option value="daily">일간</option>
              <option value="weekly">주간</option>
              <option value="monthly">월간</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] text-gray-500 block mb-1">포맷</label>
            <select value={format} onChange={(e) => setFormat(e.target.value)} className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200">
              <option value="pdf">PDF</option>
              <option value="excel">Excel</option>
            </select>
          </div>
          <button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-40 text-white px-5 py-2 rounded-lg text-sm font-medium"
          >
            <FileText className="h-4 w-4" />
            {generateMutation.isPending ? '생성 중...' : '리포트 생성'}
          </button>
        </div>
        {generateMutation.isSuccess && (
          <p className="text-green-400 text-xs mt-3">리포트가 생성되었습니다.</p>
        )}
      </div>

      {/* Reports list */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-700">
          <span className="text-sm font-semibold text-gray-300">리포트 이력</span>
          <span className="text-xs text-gray-500 ml-2">{reports?.length || 0}건</span>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-900/50">
            <tr className="text-gray-400 text-left">
              <th className="px-4 py-3 font-medium">유형</th>
              <th className="px-4 py-3 font-medium">포맷</th>
              <th className="px-4 py-3 font-medium">요약</th>
              <th className="px-4 py-3 font-medium">생성자</th>
              <th className="px-4 py-3 font-medium">크기</th>
              <th className="px-4 py-3 font-medium">생성일</th>
              <th className="px-4 py-3 font-medium">상태</th>
              <th className="px-4 py-3 font-medium w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {!reports?.length ? (
              <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-500">생성된 리포트가 없습니다</td></tr>
            ) : (
              reports.map((r: any) => (
                <tr key={r.id} className="hover:bg-gray-700/50">
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[r.report_type] || 'bg-gray-500/20 text-gray-400'}`}>
                      {r.report_type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-gray-400">
                      {r.format === 'PDF' ? <File className="h-3.5 w-3.5 text-red-400" /> : <FileSpreadsheet className="h-3.5 w-3.5 text-green-400" />}
                      <span className="text-xs">{r.format}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-300 text-xs max-w-xs truncate">{r.summary}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{r.created_by}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{r.file_size}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(r.created_at).toLocaleString('ko-KR')}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400">{r.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <button className="text-primary-400 hover:text-primary-300" title="다운로드"><Download className="h-4 w-4" /></button>
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
