import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { fetchAssets, requestDiagnosis, fetchPredictions, aiChat } from '@/services/api'
import { Brain, Send, MessageSquare, Activity, AlertTriangle, Zap, Bot, User } from 'lucide-react'
import type { Asset, DiagnosisResult } from '@/types'

interface ChatMsg {
  role: 'user' | 'ai'
  text: string
  time: string
}

export default function AIPage() {
  const [tab, setTab] = useState<'diagnose' | 'chat'>('diagnose')

  // --- Diagnosis ---
  const [selectedAssetId, setSelectedAssetId] = useState('')
  const [symptom, setSymptom] = useState('')
  const [result, setResult] = useState<DiagnosisResult | null>(null)

  const { data: assetsData } = useQuery({
    queryKey: ['assets-list'],
    queryFn: async () => (await fetchAssets({ page_size: 100 })).data,
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

  // --- Chat ---
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: 'ai', text: '안녕하세요! INSITE AI 어시스턴트입니다. 인프라 관련 질문이 있으시면 말씀해 주세요.', time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) },
  ])
  const [chatInput, setChatInput] = useState('')
  const chatEndRef = useRef<HTMLDivElement>(null)

  const chatMutation = useMutation({
    mutationFn: (msg: string) => aiChat(msg),
    onSuccess: (res) => {
      setMessages((prev) => [
        ...prev,
        { role: 'ai', text: res.data.message, time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) },
      ])
    },
    onError: () => {
      setMessages((prev) => [
        ...prev,
        { role: 'ai', text: 'AI 응답에 실패했습니다. 잠시 후 다시 시도해 주세요.', time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) },
      ])
    },
  })

  const sendChat = () => {
    if (!chatInput.trim() || chatMutation.isPending) return
    const msg = chatInput.trim()
    setChatInput('')
    setMessages((prev) => [
      ...prev,
      { role: 'user', text: msg, time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) },
    ])
    chatMutation.mutate(msg)
  }

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const severityColor = (s: number) => {
    if (s >= 8) return 'text-red-400'
    if (s >= 5) return 'text-yellow-400'
    return 'text-green-400'
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">AI 진단</h1>

      {/* Tab bar */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab('diagnose')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'diagnose' ? 'bg-primary-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-gray-200'}`}
        >
          <Brain className="h-4 w-4" />
          장애 진단
        </button>
        <button
          onClick={() => setTab('chat')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'chat' ? 'bg-primary-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-gray-200'}`}
        >
          <MessageSquare className="h-4 w-4" />
          AI 채팅
        </button>
      </div>

      {tab === 'diagnose' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Diagnosis input */}
          <div className="lg:col-span-2 bg-gray-800 rounded-xl border border-gray-700 p-5">
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
                  <option key={asset.id} value={asset.id}>
                    {asset.name} ({asset.ip_address}) [{asset.status === 'normal' ? '정상' : asset.status === 'warning' ? '경고' : '다운'}]
                  </option>
                ))}
              </select>

              <textarea
                placeholder="증상을 입력하세요... (예: 서버 응답 지연, CPU 사용률 급증, 디스크 I/O 지연)"
                value={symptom}
                onChange={(e) => setSymptom(e.target.value)}
                rows={3}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 resize-none"
              />

              <button
                onClick={() => diagnoseMutation.mutate()}
                disabled={!selectedAssetId || diagnoseMutation.isPending}
                className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-40 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                {diagnoseMutation.isPending ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    AI 분석 중...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" />
                    분석 요청
                  </>
                )}
              </button>
            </div>

            {/* Result */}
            {result && (
              <div className="bg-gray-900 rounded-lg p-5 mt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-base text-gray-100 font-semibold">{result.summary}</div>
                  <div className={`text-lg font-bold ${severityColor(result.severity_score)}`}>
                    심각도 {result.severity_score}/10
                  </div>
                </div>
                <div className="space-y-3">
                  {result.causes?.map((cause) => (
                    <div key={cause.rank} className="bg-gray-800 rounded-lg p-4 border-l-4 border-primary-500">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-gray-200">
                          #{cause.rank}. {cause.cause}
                        </span>
                        <span className="text-xs bg-primary-600/30 text-primary-300 px-2 py-0.5 rounded-full">
                          신뢰도 {(cause.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="space-y-1.5 text-xs">
                        <div className="text-gray-400">
                          <strong>근거:</strong> {cause.evidence?.join(', ')}
                        </div>
                        <div className="text-green-400">
                          <strong>즉시 조치:</strong> {cause.immediate_action}
                        </div>
                        <div className="text-blue-400">
                          <strong>재발 방지:</strong> {cause.prevention}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Predictions sidebar */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="h-5 w-5 text-yellow-400" />
              <h3 className="text-sm font-semibold text-gray-300">리소스 고갈 예측</h3>
            </div>
            {!predictions?.length ? (
              <p className="text-gray-500 text-sm text-center py-12">위험한 추세가 감지되지 않았습니다</p>
            ) : (
              <div className="space-y-3">
                {predictions.map((pred: any, i: number) => (
                  <div key={i} className="bg-gray-900 rounded-lg p-3 border-l-4"
                    style={{ borderColor: pred.severity === 'critical' ? '#ef4444' : pred.severity === 'warning' ? '#eab308' : '#3b82f6' }}
                  >
                    <div className="flex items-center gap-2">
                      <AlertTriangle className={`h-3.5 w-3.5 ${pred.severity === 'critical' ? 'text-red-400' : pred.severity === 'warning' ? 'text-yellow-400' : 'text-blue-400'}`} />
                      <span className="text-sm text-gray-200 font-medium">{pred.asset_name}</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1 ml-5">
                      {pred.metric_name === 'disk_usage' ? '디스크' : '메모리'} {pred.current_value}%
                      → <span className={pred.severity === 'critical' ? 'text-red-400' : 'text-yellow-400'}>
                        {pred.days_remaining}일 후 고갈 예측
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'chat' && (
        <div className="bg-gray-800 rounded-xl border border-gray-700 flex flex-col" style={{ height: 'calc(100vh - 220px)' }}>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                {msg.role === 'ai' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                )}
                <div className={`max-w-[70%] rounded-xl px-4 py-3 ${msg.role === 'user' ? 'bg-primary-600 text-white' : 'bg-gray-900 text-gray-200'}`}>
                  <div className="text-sm whitespace-pre-wrap">{msg.text}</div>
                  <div className={`text-[10px] mt-1 ${msg.role === 'user' ? 'text-primary-200' : 'text-gray-500'}`}>{msg.time}</div>
                </div>
                {msg.role === 'user' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>
            ))}
            {chatMutation.isPending && (
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="bg-gray-900 rounded-xl px-4 py-3">
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-700 p-4">
            <div className="flex gap-3">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendChat()}
                placeholder="인프라 관련 질문을 입력하세요..."
                className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-primary-500"
              />
              <button
                onClick={sendChat}
                disabled={!chatInput.trim() || chatMutation.isPending}
                className="bg-primary-600 hover:bg-primary-700 disabled:opacity-40 text-white px-4 py-2.5 rounded-lg transition-colors"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
