import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { fetchAssets, requestDiagnosis, fetchPredictions } from '@/services/api'
import { Brain, Send } from 'lucide-react'
import type { Asset, DiagnosisResult } from '@/types'

export default function AIPage() {
  const [selectedAssetId, setSelectedAssetId] = useState('')
  const [symptom, setSymptom] = useState('')
  const [result, setResult] = useState<DiagnosisResult | null>(null)

  const { data: assetsData } = useQuery({
    queryKey: ['assets-list'],
    queryFn: async () => (await fetchAssets({ page_size: 200 })).data,
  })

  const { data: predictions } = useQuery({
    queryKey: ['predictions'],
    queryFn: async () => (await fetchPredictions()).data,
    refetchInterval: 60_000,
  })

  const diagnoseMutation = useMutation({
    mutationFn: () => requestDiagnosis(selectedAssetId, symptom),
    onSuccess: (res) => setResult(res.data),
  })

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">AI 장애 진단</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Diagnosis chat */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="h-5 w-5 text-primary-400" />
            <h3 className="text-sm font-semibold text-gray-300">장애 원인 분석</h3>
          </div>

          <div className="space-y-3 mb-4">
            <select
              value={selectedAssetId}
              onChange={(e) => setSelectedAssetId(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200"
            >
              <option value="">자산 선택...</option>
              {assetsData?.items?.map((asset: Asset) => (
                <option key={asset.id} value={asset.id}>{asset.name} ({asset.ip_address})</option>
              ))}
            </select>

            <textarea
              placeholder="증상을 입력하세요... (예: 서버 응답 지연, CPU 사용률 급증)"
              value={symptom}
              onChange={(e) => setSymptom(e.target.value)}
              rows={3}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 resize-none"
            />

            <button
              onClick={() => diagnoseMutation.mutate()}
              disabled={!selectedAssetId || diagnoseMutation.isPending}
              className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-40 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <Send className="h-4 w-4" />
              {diagnoseMutation.isPending ? '분석 중...' : '분석 요청'}
            </button>
          </div>

          {/* Result */}
          {result && (
            <div className="bg-gray-900 rounded-lg p-4 mt-4 space-y-3">
              <div className="text-sm text-gray-200 font-medium">{result.summary}</div>
              <div className="text-xs text-gray-400">심각도: {result.severity_score}/10</div>
              {result.causes?.map((cause) => (
                <div key={cause.rank} className="border-l-2 border-primary-500 pl-3 py-1">
                  <div className="text-sm text-gray-200">{cause.rank}. {cause.cause}</div>
                  <div className="text-xs text-gray-400 mt-1">신뢰도: {(cause.confidence * 100).toFixed(0)}%</div>
                  <div className="text-xs text-green-400 mt-1">조치: {cause.immediate_action}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Predictions */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">리소스 고갈 예측</h3>
          {!predictions?.length ? (
            <p className="text-gray-500 text-sm text-center py-12">예측 데이터 없음</p>
          ) : (
            <div className="space-y-3">
              {predictions.map((pred: any, i: number) => (
                <div key={i} className="bg-gray-900 rounded-lg p-3">
                  <div className="text-sm text-gray-200">{pred.asset_name} - {pred.metric_name}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    현재: {pred.current_value}% | 예상 고갈: {pred.days_remaining?.toFixed(1)}일 후
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
