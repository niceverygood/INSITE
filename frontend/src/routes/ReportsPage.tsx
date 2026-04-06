import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { fetchReports, generateReport } from '@/services/api'
import { FileText, Download } from 'lucide-react'

export default function ReportsPage() {
  const [reportType, setReportType] = useState('daily')
  const [format, setFormat] = useState('pdf')

  const { data: reports } = useQuery({
    queryKey: ['reports'],
    queryFn: async () => (await fetchReports()).data,
  })

  const generateMutation = useMutation({
    mutationFn: () => generateReport({ report_type: reportType, format }),
  })

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">리포트</h1>

      <div className="bg-gray-800 rounded-xl border border-gray-700 p-5 mb-6">
        <h3 className="text-sm font-semibold text-gray-300 mb-4">리포트 생성</h3>
        <div className="flex gap-3">
          <select value={reportType} onChange={(e) => setReportType(e.target.value)} className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200">
            <option value="daily">일간</option>
            <option value="weekly">주간</option>
            <option value="monthly">월간</option>
          </select>
          <select value={format} onChange={(e) => setFormat(e.target.value)} className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200">
            <option value="pdf">PDF</option>
            <option value="excel">Excel</option>
          </select>
          <button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-40 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            <FileText className="h-4 w-4" />
            {generateMutation.isPending ? '생성 중...' : '리포트 생성'}
          </button>
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-900/50">
            <tr className="text-gray-400 text-left">
              <th className="px-4 py-3 font-medium">유형</th>
              <th className="px-4 py-3 font-medium">포맷</th>
              <th className="px-4 py-3 font-medium">상태</th>
              <th className="px-4 py-3 font-medium">생성일</th>
              <th className="px-4 py-3 font-medium">다운로드</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {!reports?.length ? (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-500">생성된 리포트가 없습니다</td></tr>
            ) : (
              reports.map((r: any) => (
                <tr key={r.id} className="hover:bg-gray-700/50">
                  <td className="px-4 py-3 text-gray-200">{r.report_type}</td>
                  <td className="px-4 py-3 text-gray-400 uppercase">{r.format}</td>
                  <td className="px-4 py-3 text-gray-400">{r.status}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{new Date(r.created_at).toLocaleString('ko-KR')}</td>
                  <td className="px-4 py-3">
                    <button className="text-primary-400 hover:text-primary-300"><Download className="h-4 w-4" /></button>
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
