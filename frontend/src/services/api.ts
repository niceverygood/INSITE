/**
 * API layer — uses Supabase PostgREST for all data operations.
 * Each function returns { data } to match the previous axios pattern.
 */
import { supabase } from './supabase'
import { DEMO_REPORTS } from '@/data/demo'

// ─── Auth ───
export const login = async (username: string, password: string) => {
  const { data, error } = await supabase.rpc('authenticate', {
    p_username: username,
    p_password: password,
  })
  if (error) throw error
  if (data?.error) throw new Error(data.error)
  // Return in the format LoginPage expects: { data: { access_token, refresh_token } }
  return {
    data: {
      access_token: btoa(JSON.stringify(data)), // Encode user info as pseudo-token
      refresh_token: 'supabase-session',
      user: data,
    },
  }
}

// ─── Assets ───
export const fetchAssets = async (params?: Record<string, string | number>) => {
  let query = supabase
    .from('assets')
    .select('*', { count: 'exact' })
    .order('name')

  if (params?.search) {
    query = query.or(`name.ilike.%${params.search}%,ip_address.ilike.%${params.search}%`)
  }
  if (params?.asset_type) {
    query = query.eq('asset_type', params.asset_type)
  }
  if (params?.status) {
    query = query.eq('status', params.status)
  }

  const page = Number(params?.page) || 1
  const pageSize = Number(params?.page_size) || 20
  query = query.range((page - 1) * pageSize, page * pageSize - 1)

  const { data, count, error } = await query
  if (error) throw error
  return { data: { items: data || [], total: count || 0, page, page_size: pageSize } }
}

export const fetchAsset = async (id: string) => {
  const { data, error } = await supabase.from('assets').select('*').eq('id', id).single()
  if (error) throw error
  return { data }
}

export const createAsset = async (body: Record<string, unknown>) => {
  const { data, error } = await supabase.from('assets').insert(body).select().single()
  if (error) throw error
  return { data }
}

export const updateAsset = async (id: string, body: Record<string, unknown>) => {
  const { data, error } = await supabase.from('assets').update(body).eq('id', id).select().single()
  if (error) throw error
  return { data }
}

export const deleteAsset = async (id: string) => {
  const { error } = await supabase.from('assets').delete().eq('id', id)
  if (error) throw error
  return { data: null }
}

// ─── Alerts ───
export const fetchAlerts = async (params?: Record<string, string>) => {
  let query = supabase.from('alerts').select('*').order('fired_at', { ascending: false })
  if (params?.status) query = query.eq('status', params.status)
  if (params?.severity) query = query.eq('severity', params.severity)
  if (params?.page_size) query = query.limit(Number(params.page_size))
  const { data, error } = await query
  if (error) throw error
  return { data: data || [] }
}

export const fetchActiveAlerts = async () => {
  const { data, error } = await supabase
    .from('alerts')
    .select('*')
    .eq('status', 'firing')
    .order('fired_at', { ascending: false })
  if (error) throw error
  return { data: data || [] }
}

export const acknowledgeAlert = async (id: string) => {
  const { data, error } = await supabase
    .from('alerts')
    .update({ status: 'acknowledged', acknowledged_at: new Date().toISOString(), acknowledged_by: 'operator' })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return { data }
}

export const resolveAlert = async (id: string) => {
  const { data, error } = await supabase
    .from('alerts')
    .update({ status: 'resolved', resolved_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return { data }
}

export const fetchAlertRules = async () => {
  const { data, error } = await supabase.from('alert_rules').select('*').order('name')
  if (error) throw error
  return { data: data || [] }
}

export const createAlertRule = async (body: Record<string, unknown>) => {
  const { data, error } = await supabase.from('alert_rules').insert(body).select().single()
  if (error) throw error
  return { data }
}

export const updateAlertRule = async (id: string, body: Record<string, unknown>) => {
  const { data, error } = await supabase.from('alert_rules').update(body).eq('id', id).select().single()
  if (error) throw error
  return { data }
}

export const deleteAlertRule = async (id: string) => {
  const { error } = await supabase.from('alert_rules').delete().eq('id', id)
  if (error) throw error
  return { data: null }
}

// ─── Dashboard ───
export const fetchDashboardSummary = async () => {
  const { data, error } = await supabase.rpc('dashboard_summary')
  if (error) throw error
  return { data: data || { total_assets: 0, normal_count: 0, warning_count: 0, down_count: 0, active_alerts: 0, critical_alerts: 0, warning_alerts: 0 } }
}

export const fetchStatusMatrix = async () => {
  const { data, error } = await supabase.from('assets').select('id, name, asset_type, status, ip_address, location')
  if (error) throw error
  return { data: data || [] }
}

// ─── Metrics ───
export const fetchCurrentMetrics = async () => {
  // Get latest metrics per asset (last 10 minutes)
  const tenMinAgo = new Date(Date.now() - 10 * 60_000).toISOString()
  const { data, error } = await supabase
    .from('metrics')
    .select('*')
    .gte('time', tenMinAgo)
    .order('time', { ascending: false })
  if (error) throw error
  return { data: data || [] }
}

export const fetchMetricHistory = async (params: Record<string, string>) => {
  let query = supabase.from('metrics').select('*').order('time', { ascending: true })
  if (params.asset_id) query = query.eq('asset_id', params.asset_id)
  if (params.metric_name) query = query.eq('metric_name', params.metric_name)
  if (params.from) query = query.gte('time', params.from)
  if (params.to) query = query.lte('time', params.to)
  const { data, error } = await query
  if (error) throw error
  return { data: data || [] }
}

export const fetchTopN = async (metricName: string, n: number) => {
  const tenMinAgo = new Date(Date.now() - 10 * 60_000).toISOString()
  const { data, error } = await supabase
    .from('metrics')
    .select('*')
    .eq('metric_name', metricName)
    .gte('time', tenMinAgo)
    .order('value', { ascending: false })
    .limit(n)
  if (error) throw error
  return { data: data || [] }
}

export const fetchTrafficSummary = async () => {
  // Return empty — traffic summary needs aggregation not available via PostgREST
  return { data: [] }
}

// ─── Logs ───
export const searchLogs = async (params: Record<string, string>) => {
  let query = supabase.from('log_entries').select('*').order('timestamp', { ascending: false })
  if (params.level) query = query.eq('level', params.level)
  if (params.source) query = query.eq('source', params.source)
  if (params.search) query = query.ilike('message', `%${params.search}%`)
  if (params.page_size) query = query.limit(Number(params.page_size))
  const { data, error } = await query
  if (error) throw error
  return { data: data || [] }
}

export const fetchLogStats = async () => {
  const { data, error } = await supabase.from('log_entries').select('level')
  if (error) throw error
  const counts: Record<string, number> = {}
  data?.forEach((l) => { counts[l.level] = (counts[l.level] || 0) + 1 })
  return { data: counts }
}

// ─── Reports (demo data — no DB table) ───
export const generateReport = async (body: Record<string, string>) => {
  const typeMap: Record<string, string> = { daily: '일간', weekly: '주간', monthly: '월간' }
  return {
    data: {
      id: `rpt-new-${Date.now()}`,
      report_type: typeMap[body.report_type] || body.report_type,
      format: body.format?.toUpperCase() || 'PDF',
      status: '생성완료',
      created_at: new Date().toISOString(),
      created_by: 'admin',
      file_size: '생성 중',
      summary: `${typeMap[body.report_type] || body.report_type} 리포트가 생성되었습니다.`,
    },
  }
}

export const fetchReports = async () => {
  return { data: DEMO_REPORTS }
}

// ─── AI (demo mode — realistic simulated responses) ───

const DIAGNOSIS_DB: Record<string, { summary: string; severity: number; causes: any[] }> = {
  down: {
    summary: '서버 다운 — 복합 장애 감지',
    severity: 9,
    causes: [
      { rank: 1, cause: '메모리 부족으로 OOM Killer 작동', confidence: 0.92, evidence: ['메모리 사용률 96% 초과', 'dmesg에 OOM 로그 다수 발견', 'Java 프로세스 비정상 종료'], immediate_action: 'Java 힙 사이즈 축소 후 프로세스 재시작 (systemctl restart app)', prevention: 'JVM 메모리 상한 설정 (-Xmx) 및 메모리 모니터링 알람 강화' },
      { rank: 2, cause: '디스크 I/O 병목으로 서비스 응답 불가', confidence: 0.85, evidence: ['디스크 사용률 93%', 'iowait 40% 이상', '/data 파티션 IOPS 포화'], immediate_action: '불필요 로그 및 임시 파일 정리 (find /tmp -mtime +7 -delete)', prevention: '디스크 사용량 80% 알람 설정 및 로그 로테이션 정책 수립' },
      { rank: 3, cause: 'CPU 과부하로 인한 프로세스 응답 지연', confidence: 0.78, evidence: ['CPU 사용률 95% 지속', 'Load Average 12.5 (코어 수 대비 초과)', '컨텍스트 스위칭 급증'], immediate_action: '비필수 배치 작업 일시 중단 후 서비스 프로세스 우선순위 조정', prevention: 'CPU 크리티컬 알람 임계치 조정 및 오토스케일링 정책 도입' },
    ],
  },
  warning: {
    summary: '성능 저하 감지 — 선제 조치 권고',
    severity: 6,
    causes: [
      { rank: 1, cause: 'CPU 사용률 증가 추세 (현재 82%)', confidence: 0.88, evidence: ['최근 1시간 CPU 평균 78→82% 상승', '특정 워커 스레드 CPU 집중', 'GC 빈도 증가 감지'], immediate_action: '트래픽 분산을 위한 로드밸런서 가중치 조정', prevention: '오토스케일링 트리거 CPU 70% 설정 및 코드 프로파일링' },
      { rank: 2, cause: '네트워크 트래픽 임계치 근접', confidence: 0.72, evidence: ['인바운드 트래픽 평소 대비 +35%', 'TCP 재전송률 2.1%', '특정 포트 커넥션 집중'], immediate_action: '비정상 트래픽 패턴 확인 및 Rate Limiting 적용 검토', prevention: '네트워크 트래픽 이상 탐지 룰 설정 및 CDN 캐시 최적화' },
    ],
  },
  normal: {
    summary: '정상 상태 — 잠재적 개선 사항 발견',
    severity: 2,
    causes: [
      { rank: 1, cause: '디스크 사용량 서서히 증가 추세', confidence: 0.65, evidence: ['월간 디스크 증가율 +3%', '로그 파일 로테이션 미설정 감지', '30일 후 80% 도달 예상'], immediate_action: '즉시 조치 불필요 — 모니터링 유지', prevention: '로그 로테이션 정책 설정 및 디스크 증설 계획 수립 (Q3)' },
    ],
  },
}

const PREDICTIONS_DEMO = [
  { asset_name: 'DB-PRD-03', metric_name: 'disk_usage', current_value: 93, severity: 'critical', days_remaining: 3 },
  { asset_name: 'ES-PRD-01', metric_name: 'disk_usage', current_value: 83, severity: 'warning', days_remaining: 14 },
  { asset_name: 'CACHE-PRD-01', metric_name: 'memory_usage', current_value: 87, severity: 'warning', days_remaining: 21 },
  { asset_name: 'KAFKA-PRD-03', metric_name: 'disk_usage', current_value: 78, severity: 'warning', days_remaining: 30 },
]

const CHAT_RESPONSES: Record<string, string> = {
  cpu: '현재 CPU 사용률이 높은 자산은 DB-PRD-03 (95%), WEB-PRD-03 (82%), KAFKA-PRD-03 (78%)입니다.\n\n**권장 조치:**\n1. DB-PRD-03: 슬로우 쿼리 분석 및 인덱스 최적화\n2. WEB-PRD-03: 트래픽 분산을 위한 스케일아웃\n3. KAFKA-PRD-03: Consumer lag 확인 및 파티션 리밸런싱',
  메모리: '메모리 사용률 상위 자산:\n• DB-PRD-03: 96% ⚠️ OOM 위험\n• CACHE-PRD-01: 87% (Redis maxmemory 근접)\n• ES-PRD-01: 83% (인덱스 캐시)\n\n**즉시 조치:**\nDB-PRD-03의 불필요 프로세스를 정리하고, Redis의 eviction 정책을 확인하세요.',
  디스크: '디스크 사용률 경고 자산:\n• DB-PRD-03: 93% 🔴 긴급\n• ES-PRD-01: 83% 🟡 주의\n\n**예측:** DB-PRD-03은 현재 증가 추세로 약 3일 후 포화 예상됩니다.\n\n**권장:** 오래된 로그 정리, 테이블스페이스 압축, 또는 볼륨 확장을 검토하세요.',
  장애: '현재 장애 상태인 자산:\n1. **DB-PRD-03** (서울 IDC B동 2F) — 2시간 전부터 다운\n   - CPU 95%, 메모리 96%, 디스크 93%\n   - 원인 추정: OOM + 디스크 포화 복합 장애\n\n2. **K8S-WORKER-03** (서울 IDC B동 3F) — 2시간 전부터 응답 없음\n   - Heartbeat 실패\n   - 원인 추정: 노드 크래시 또는 네트워크 단절',
  알람: '현재 활성 알람 8건:\n• 🔴 Critical 4건: DB-PRD-03 (CPU/메모리/디스크), K8S-WORKER-03 (Heartbeat)\n• 🟡 Warning 4건: WEB-PRD-03, KAFKA-PRD-03, DIST-SW-B2, CACHE-PRD-01\n\n가장 시급한 것은 DB-PRD-03입니다. 복합 장애로 서비스 영향 가능성이 높습니다.',
  상태: '**인프라 현황 요약:**\n\n총 21개 자산 중:\n✅ 정상: 16개 (76%)\n⚠️ 경고: 3개 (14%)\n🔴 다운: 2개 (10%)\n\nSLA 가용률: 90.5% (목표 99.9% 미달)\n\n**주요 이슈:** DB-PRD-03 복합 장애, K8S-WORKER-03 노드 다운',
}

export const requestDiagnosis = async (assetId: string, _symptom?: string) => {
  // Simulate AI analysis delay
  await new Promise((r) => setTimeout(r, 1500 + Math.random() * 1000))

  // Find asset to determine status
  const { data: asset } = await supabase.from('assets').select('name, status').eq('id', assetId).single()
  const status = asset?.status || 'normal'
  const template = DIAGNOSIS_DB[status] || DIAGNOSIS_DB.normal

  return {
    data: {
      diagnosis_id: `diag-${Date.now()}`,
      asset_id: assetId,
      timestamp: new Date().toISOString(),
      summary: `[${asset?.name}] ${template.summary}`,
      severity_score: template.severity,
      causes: template.causes,
    },
  }
}

export const fetchPredictions = async () => {
  return { data: PREDICTIONS_DEMO }
}

export const aiChat = async (message: string) => {
  // Simulate AI thinking
  await new Promise((r) => setTimeout(r, 800 + Math.random() * 1200))

  const lower = message.toLowerCase()
  // Find matching response
  for (const [key, response] of Object.entries(CHAT_RESPONSES)) {
    if (lower.includes(key)) {
      return { data: { message: response } }
    }
  }

  // Default response
  return {
    data: {
      message: `인프라 현황을 기반으로 답변드리겠습니다.\n\n현재 모니터링 중인 자산 21개 중 정상 16개, 경고 3개, 다운 2개입니다.\n\n더 구체적인 질문을 해주시면 상세한 분석을 제공할 수 있습니다. 예시:\n• "CPU 사용률 높은 서버는?"\n• "현재 장애 상태는?"\n• "디스크 사용량 분석해줘"\n• "활성 알람 현황"`,
    },
  }
}

// ─── Audit ───
export const fetchAuditLogs = async (params?: Record<string, string>) => {
  let query = supabase.from('audit_logs').select('*').order('timestamp', { ascending: false })
  if (params?.action) query = query.eq('action', params.action)
  const { data, error } = await query
  if (error) throw error
  return { data: data || [] }
}

// Default export for backward compatibility
export default { get: () => Promise.resolve({ data: null }), post: () => Promise.resolve({ data: null }) }
