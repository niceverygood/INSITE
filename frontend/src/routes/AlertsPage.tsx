import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchAlerts, acknowledgeAlert, resolveAlert, fetchAlertRules, createAlertRule, updateAlertRule, deleteAlertRule } from '@/services/api'
import { cn } from '@/utils/cn'
import { Check, CheckCheck, AlertTriangle, AlertCircle, Info, Plus, Pencil, Trash2, X } from 'lucide-react'
import type { Alert, AlertRule } from '@/types'
import { DEMO_ALERTS, DEMO_ALERT_RULES } from '@/data/demo'

const severityIcon = {
  critical: <AlertCircle className="h-4 w-4 text-red-400" />,
  warning: <AlertTriangle className="h-4 w-4 text-yellow-400" />,
  info: <Info className="h-4 w-4 text-blue-400" />,
}

const conditionLabels: Record<string, string> = { gt: '>', lt: '<', eq: '=' }
const severityLabels: Record<string, string> = { critical: '심각', warning: '경고', info: '정보' }
const metricOptions = ['cpu_usage', 'memory_usage', 'disk_usage', 'network_in', 'network_out']
const conditionOptions = ['gt', 'lt', 'eq'] as const
const severityOptions = ['critical', 'warning', 'info'] as const

interface RuleFormData {
  name: string
  metric_name: string
  condition: string
  threshold: number
  duration_seconds: number
  severity: string
  enabled: boolean
}

const emptyForm: RuleFormData = {
  name: '',
  metric_name: 'cpu_usage',
  condition: 'gt',
  threshold: 80,
  duration_seconds: 60,
  severity: 'warning',
  enabled: true,
}

export default function AlertsPage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'alerts' | 'rules'>('alerts')
  const [showRuleForm, setShowRuleForm] = useState(false)
  const [editingRule, setEditingRule] = useState<AlertRule | null>(null)
  const [form, setForm] = useState<RuleFormData>(emptyForm)

  // Alerts queries
  const { data: apiAlerts, isLoading } = useQuery({
    queryKey: ['all-alerts'],
    queryFn: async () => (await fetchAlerts({ page_size: '100' })).data as Alert[],
    refetchInterval: 10_000,
  })
  const alerts = apiAlerts?.length ? apiAlerts : DEMO_ALERTS

  const ackMutation = useMutation({
    mutationFn: acknowledgeAlert,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['all-alerts'] }),
  })

  const resolveMutation = useMutation({
    mutationFn: resolveAlert,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['all-alerts'] }),
  })

  // Rules queries
  const { data: apiRules, isLoading: rulesLoading } = useQuery({
    queryKey: ['alert-rules'],
    queryFn: async () => (await fetchAlertRules()).data as AlertRule[],
    refetchInterval: 30_000,
  })
  const rules = apiRules?.length ? apiRules : DEMO_ALERT_RULES

  const createMutation = useMutation({
    mutationFn: (data: RuleFormData) => createAlertRule(data as unknown as Record<string, unknown>),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-rules'] })
      closeForm()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: RuleFormData }) => updateAlertRule(id, data as unknown as Record<string, unknown>),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-rules'] })
      closeForm()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteAlertRule,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alert-rules'] }),
  })

  function openCreateForm() {
    setEditingRule(null)
    setForm(emptyForm)
    setShowRuleForm(true)
  }

  function openEditForm(rule: AlertRule) {
    setEditingRule(rule)
    setForm({
      name: rule.name,
      metric_name: rule.metric_name,
      condition: rule.condition,
      threshold: rule.threshold,
      duration_seconds: rule.duration_seconds,
      severity: rule.severity,
      enabled: rule.enabled,
    })
    setShowRuleForm(true)
  }

  function closeForm() {
    setShowRuleForm(false)
    setEditingRule(null)
    setForm(emptyForm)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (editingRule) {
      updateMutation.mutate({ id: editingRule.id, data: form })
    } else {
      createMutation.mutate(form)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">알람 관리</h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-4">
        <button
          onClick={() => setActiveTab('alerts')}
          className={cn(
            'px-4 py-2 text-sm font-medium rounded-t-lg transition-colors',
            activeTab === 'alerts'
              ? 'bg-gray-800 text-white border border-gray-700 border-b-transparent'
              : 'text-gray-400 hover:text-gray-300'
          )}
        >
          알람 목록
        </button>
        <button
          onClick={() => setActiveTab('rules')}
          className={cn(
            'px-4 py-2 text-sm font-medium rounded-t-lg transition-colors',
            activeTab === 'rules'
              ? 'bg-gray-800 text-white border border-gray-700 border-b-transparent'
              : 'text-gray-400 hover:text-gray-300'
          )}
        >
          알람 규칙 설정
        </button>
      </div>

      {/* Alerts Tab */}
      {activeTab === 'alerts' && (
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
      )}

      {/* Rules Tab */}
      {activeTab === 'rules' && (
        <div>
          {/* Rule Form Modal */}
          {showRuleForm && (
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-5 mb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-200">
                  {editingRule ? '규칙 수정' : '규칙 추가'}
                </h3>
                <button onClick={closeForm} className="text-gray-400 hover:text-gray-200">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">규칙명</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500"
                    placeholder="예: CPU 사용률 경고"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">메트릭</label>
                  <select
                    value={form.metric_name}
                    onChange={(e) => setForm({ ...form, metric_name: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500"
                  >
                    {metricOptions.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">조건</label>
                  <select
                    value={form.condition}
                    onChange={(e) => setForm({ ...form, condition: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500"
                  >
                    {conditionOptions.map((c) => (
                      <option key={c} value={c}>{c === 'gt' ? '> (초과)' : c === 'lt' ? '< (미만)' : '= (같음)'}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">임계치</label>
                  <input
                    type="number"
                    required
                    step="any"
                    value={form.threshold}
                    onChange={(e) => setForm({ ...form, threshold: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">지속시간 (초)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={form.duration_seconds}
                    onChange={(e) => setForm({ ...form, duration_seconds: parseInt(e.target.value) || 0 })}
                    className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">심각도</label>
                  <select
                    value={form.severity}
                    onChange={(e) => setForm({ ...form, severity: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500"
                  >
                    {severityOptions.map((s) => (
                      <option key={s} value={s}>{severityLabels[s]}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    id="rule-enabled"
                    checked={form.enabled}
                    onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
                    className="rounded bg-gray-900 border-gray-600 text-blue-500 focus:ring-blue-500"
                  />
                  <label htmlFor="rule-enabled" className="text-sm text-gray-300">활성</label>
                </div>
                <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-2">
                  <button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
                  >
                    {editingRule ? '수정' : '추가'}
                  </button>
                  <button
                    type="button"
                    onClick={closeForm}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded-lg transition-colors"
                  >
                    취소
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Rules Header */}
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm text-gray-400">{rules?.length ?? 0}개 규칙</span>
            {!showRuleForm && (
              <button
                onClick={openCreateForm}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4" /> 규칙 추가
              </button>
            )}
          </div>

          {/* Rules Table */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-900/50">
                <tr className="text-gray-400 text-left">
                  <th className="px-4 py-3 font-medium">규칙명</th>
                  <th className="px-4 py-3 font-medium">메트릭</th>
                  <th className="px-4 py-3 font-medium">조건</th>
                  <th className="px-4 py-3 font-medium">임계치</th>
                  <th className="px-4 py-3 font-medium">심각도</th>
                  <th className="px-4 py-3 font-medium">활성</th>
                  <th className="px-4 py-3 font-medium">액션</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {rulesLoading ? (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-500">로딩 중...</td></tr>
                ) : !rules?.length ? (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-500">등록된 규칙이 없습니다</td></tr>
                ) : (
                  rules.map((rule) => (
                    <tr key={rule.id} className="hover:bg-gray-700/50 transition-colors">
                      <td className="px-4 py-3 text-gray-200">{rule.name}</td>
                      <td className="px-4 py-3 text-gray-400">{rule.metric_name}</td>
                      <td className="px-4 py-3 text-gray-400">{conditionLabels[rule.condition] ?? rule.condition} {rule.threshold}</td>
                      <td className="px-4 py-3 text-gray-300">{rule.threshold}</td>
                      <td className="px-4 py-3">
                        <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', {
                          'bg-red-500/20 text-red-400': rule.severity === 'critical',
                          'bg-yellow-500/20 text-yellow-400': rule.severity === 'warning',
                          'bg-blue-500/20 text-blue-400': rule.severity === 'info',
                        })}>
                          {severityLabels[rule.severity]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', {
                          'bg-green-500/20 text-green-400': rule.enabled,
                          'bg-gray-500/20 text-gray-400': !rule.enabled,
                        })}>
                          {rule.enabled ? '활성' : '비활성'}
                        </span>
                      </td>
                      <td className="px-4 py-3 flex gap-2">
                        <button
                          onClick={() => openEditForm(rule)}
                          className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
                        >
                          <Pencil className="h-3.5 w-3.5" /> 편집
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('이 규칙을 삭제하시겠습니까?')) {
                              deleteMutation.mutate(rule.id)
                            }
                          }}
                          className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> 삭제
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
