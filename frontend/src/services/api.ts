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
  // Get latest metrics per asset (last 30 minutes for dashboard)
  const thirtyMinAgo = new Date(Date.now() - 30 * 60_000).toISOString()
  const { data, error } = await supabase
    .from('metrics')
    .select('*')
    .gte('time', thirtyMinAgo)
    .order('time', { ascending: false })
    .limit(500)
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
  const oneHourAgo = new Date(Date.now() - 60 * 60_000).toISOString()
  const { data: netIn } = await supabase.from('metrics').select('asset_id, value').eq('metric_name', 'network_in').gte('time', oneHourAgo)
  const { data: netOut } = await supabase.from('metrics').select('asset_id, value').eq('metric_name', 'network_out').gte('time', oneHourAgo)
  const { data: assets } = await supabase.from('assets').select('id, name, asset_type, location')

  const assetMap = new Map(assets?.map((a) => [a.id, a]) || [])
  const summary: Record<string, { in_vals: number[]; out_vals: number[] }> = {}

  for (const m of netIn || []) {
    if (!summary[m.asset_id]) summary[m.asset_id] = { in_vals: [], out_vals: [] }
    summary[m.asset_id].in_vals.push(m.value)
  }
  for (const m of netOut || []) {
    if (!summary[m.asset_id]) summary[m.asset_id] = { in_vals: [], out_vals: [] }
    summary[m.asset_id].out_vals.push(m.value)
  }

  const result = Object.entries(summary).map(([id, s]) => {
    const asset = assetMap.get(id)
    const avgIn = s.in_vals.reduce((a, b) => a + b, 0) / (s.in_vals.length || 1)
    const avgOut = s.out_vals.reduce((a, b) => a + b, 0) / (s.out_vals.length || 1)
    return {
      asset_id: id, asset_name: asset?.name || id, asset_type: asset?.asset_type || '', location: asset?.location || '',
      avg_network_in: Math.round(avgIn), avg_network_out: Math.round(avgOut),
      max_network_in: Math.round(Math.max(...(s.in_vals.length ? s.in_vals : [0]))),
      max_network_out: Math.round(Math.max(...(s.out_vals.length ? s.out_vals : [0]))),
    }
  })

  return { data: result.sort((a, b) => b.avg_network_in - a.avg_network_in) }
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

export const requestDiagnosis = async (assetId: string, symptom?: string) => {
  // Simulate AI analysis delay
  await new Promise((r) => setTimeout(r, 1500 + Math.random() * 1000))

  // Fetch real asset info + latest metrics
  const [assetRes, metricsRes] = await Promise.all([
    supabase.from('assets').select('name, status, ip_address, location, extra_info').eq('id', assetId).single(),
    supabase.from('metrics').select('metric_name, value, unit').eq('asset_id', assetId).order('time', { ascending: false }).limit(10),
  ])

  const asset = assetRes.data
  const metrics = metricsRes.data || []
  const name = asset?.name || 'Unknown'
  const status = asset?.status || 'normal'

  // Extract latest metric values
  const latest: Record<string, number> = {}
  for (const m of metrics) {
    if (!latest[m.metric_name]) latest[m.metric_name] = m.value
  }
  const cpu = latest.cpu_usage ?? 0
  const mem = latest.memory_usage ?? 0
  const disk = latest.disk_usage ?? 0

  // Build dynamic diagnosis based on REAL metrics
  const causes: any[] = []
  let severity = 2
  let summary = `[${name}] 정상 상태 — 특이사항 없음`

  if (status === 'down' || cpu === 0) {
    severity = 10
    summary = `[${name}] 서버 다운 — 즉시 복구 필요`
    causes.push({
      rank: 1, cause: 'Heartbeat 응답 없음 — 서버 접근 불가', confidence: 0.95,
      evidence: [`최근 2시간 이상 메트릭 수집 실패`, `IP ${asset?.ip_address} ping 응답 없음`, `위치: ${asset?.location}`],
      immediate_action: `서버실 방문 또는 IPMI/iLO 콘솔로 원격 접속하여 물리 상태 확인`,
      prevention: 'Heartbeat 이중화 및 자동 페일오버 구성',
    })
  }

  if (cpu > 85) {
    severity = Math.max(severity, cpu > 90 ? 9 : 7)
    summary = `[${name}] CPU 과부하 (${cpu}%) — ${cpu > 90 ? '긴급' : '주의'}`
    causes.push({
      rank: causes.length + 1, cause: `CPU 사용률 ${cpu}% — ${cpu > 90 ? '크리티컬' : '경고'} 수준`, confidence: 0.92,
      evidence: [`현재 CPU ${cpu}%`, `${asset?.extra_info?.cpu || 'N/A'} 기준 과부하`, `${asset?.extra_info?.role || '서버'} 워크로드 집중`],
      immediate_action: cpu > 90 ? '비필수 프로세스 kill 및 트래픽 분산 즉시 실행' : '워크로드 분산 및 스케일아웃 검토',
      prevention: 'CPU 기반 오토스케일링 정책 설정 (threshold: 70%)',
    })
  }

  if (mem > 85) {
    severity = Math.max(severity, mem > 95 ? 9 : 6)
    if (!summary.includes('과부하')) summary = `[${name}] 메모리 부족 (${mem}%) — ${mem > 95 ? 'OOM 위험' : '주의'}`
    causes.push({
      rank: causes.length + 1, cause: `메모리 사용률 ${mem}% — ${mem > 95 ? 'OOM 위험' : '경고'}`, confidence: 0.88,
      evidence: [`현재 메모리 ${mem}%`, `총 ${asset?.extra_info?.ram || 'N/A'}`, `Swap 사용 가능성`],
      immediate_action: mem > 95 ? '메모리 누수 프로세스 식별 후 재시작 (top -o %MEM)' : '캐시 정리 및 메모리 사용 패턴 분석',
      prevention: '메모리 모니터링 알람 강화 및 JVM/컨테이너 메모리 제한 설정',
    })
  }

  if (disk > 80) {
    severity = Math.max(severity, disk > 90 ? 8 : 5)
    causes.push({
      rank: causes.length + 1, cause: `디스크 사용률 ${disk}% — ${disk > 90 ? '포화 임박' : '증가 추세'}`, confidence: 0.85,
      evidence: [`현재 디스크 ${disk}%`, `일일 증가율 약 0.5~1%`, `${disk > 90 ? '3일 내 포화 예상' : '2주 내 90% 도달 예상'}`],
      immediate_action: disk > 90 ? '로그 정리 (journalctl --vacuum-size=500M) 및 임시 파일 삭제' : '디스크 사용 현황 분석 (du -sh /*)' ,
      prevention: '로그 로테이션 설정 및 디스크 증설 계획',
    })
  }

  if (causes.length === 0) {
    causes.push({
      rank: 1, cause: '모든 지표 정상 범위', confidence: 0.90,
      evidence: [`CPU ${cpu}%`, `메모리 ${mem}%`, `디스크 ${disk}%`, `${asset?.extra_info?.os || 'OS 정보 없음'}`],
      immediate_action: '즉시 조치 불필요 — 현재 상태 유지',
      prevention: '정기 점검 스케줄 유지 및 트렌드 모니터링 지속',
    })
  }

  if (symptom) {
    causes.push({
      rank: causes.length + 1, cause: `사용자 보고 증상: "${symptom}"`, confidence: 0.70,
      evidence: ['운영자 직접 보고', `관련 자산: ${name} (${asset?.ip_address})`, `시간: ${new Date().toLocaleString('ko-KR')}`],
      immediate_action: '보고된 증상과 메트릭 상관관계 추가 분석 필요',
      prevention: '유사 증상 발생 시 자동 알람 규칙 추가',
    })
  }

  return {
    data: {
      diagnosis_id: `diag-${Date.now()}`,
      asset_id: assetId,
      timestamp: new Date().toISOString(),
      summary,
      severity_score: severity,
      causes,
    },
  }
}

export const fetchPredictions = async () => {
  // Query real metrics to find assets with high resource usage trends
  const fiveMinAgo = new Date(Date.now() - 5 * 60_000).toISOString()
  const { data: diskMetrics } = await supabase.from('metrics').select('asset_id, value').eq('metric_name', 'disk_usage').gte('time', fiveMinAgo).order('value', { ascending: false }).limit(30)
  const { data: memMetrics } = await supabase.from('metrics').select('asset_id, value').eq('metric_name', 'memory_usage').gte('time', fiveMinAgo).order('value', { ascending: false }).limit(30)
  const { data: assets } = await supabase.from('assets').select('id, name').neq('status', 'down')
  const nameMap = new Map(assets?.map((a) => [a.id, a.name]) || [])

  const predictions: any[] = []
  const seen = new Set<string>()

  // Disk predictions
  for (const m of diskMetrics || []) {
    if (seen.has(`disk-${m.asset_id}`) || m.value < 70) continue
    seen.add(`disk-${m.asset_id}`)
    const name = nameMap.get(m.asset_id)
    if (!name) continue
    const daysLeft = Math.max(1, Math.round((100 - m.value) / 0.5))
    predictions.push({
      asset_name: name, metric_name: 'disk_usage', current_value: Math.round(m.value),
      severity: m.value > 90 ? 'critical' : 'warning', days_remaining: daysLeft,
    })
  }

  // Memory predictions
  for (const m of memMetrics || []) {
    if (seen.has(`mem-${m.asset_id}`) || m.value < 80) continue
    seen.add(`mem-${m.asset_id}`)
    const name = nameMap.get(m.asset_id)
    if (!name) continue
    const daysLeft = Math.max(1, Math.round((100 - m.value) / 0.3))
    predictions.push({
      asset_name: name, metric_name: 'memory_usage', current_value: Math.round(m.value),
      severity: m.value > 95 ? 'critical' : 'warning', days_remaining: daysLeft,
    })
  }

  return { data: predictions.sort((a, b) => a.days_remaining - b.days_remaining).slice(0, 6) }
}

export const aiChat = async (message: string) => {
  await new Promise((r) => setTimeout(r, 600 + Math.random() * 800))

  const lower = message.toLowerCase()

  // ─── Live data queries based on keywords ───

  // CPU 관련
  if (lower.includes('cpu')) {
    const fiveMinAgo = new Date(Date.now() - 5 * 60_000).toISOString()
    const { data: cpuMetrics } = await supabase.from('metrics').select('asset_id, value').eq('metric_name', 'cpu_usage').gte('time', fiveMinAgo).order('value', { ascending: false }).limit(21)
    const { data: assets } = await supabase.from('assets').select('id, name, status')
    const nameMap = new Map(assets?.map((a) => [a.id, a]) || [])
    const seen = new Set<string>()
    const top = (cpuMetrics || []).filter((m) => { if (seen.has(m.asset_id)) return false; seen.add(m.asset_id); return true }).slice(0, 5)
    const lines = top.map((m, i) => {
      const a = nameMap.get(m.asset_id)
      const icon = m.value > 90 ? '🔴' : m.value > 70 ? '🟡' : '🟢'
      return `${i + 1}. ${icon} **${a?.name || 'Unknown'}** — ${m.value}%${a?.status === 'down' ? ' (다운)' : ''}`
    })
    return { data: { message: `**CPU 사용률 Top 5** (최근 5분 기준)\n\n${lines.join('\n')}\n\n${top[0]?.value > 90 ? '⚠️ 1위 자산은 크리티컬 수준입니다. AI 진단 탭에서 상세 분석을 권장합니다.' : '전반적으로 안정적인 상태입니다.'}` } }
  }

  // 메모리 관련
  if (lower.includes('메모리') || lower.includes('memory') || lower.includes('ram') || lower.includes('oom')) {
    const fiveMinAgo = new Date(Date.now() - 5 * 60_000).toISOString()
    const { data: memMetrics } = await supabase.from('metrics').select('asset_id, value').eq('metric_name', 'memory_usage').gte('time', fiveMinAgo).order('value', { ascending: false }).limit(21)
    const { data: assets } = await supabase.from('assets').select('id, name, extra_info')
    const nameMap = new Map(assets?.map((a) => [a.id, a]) || [])
    const seen = new Set<string>()
    const top = (memMetrics || []).filter((m) => { if (seen.has(m.asset_id)) return false; seen.add(m.asset_id); return true }).slice(0, 5)
    const lines = top.map((m, i) => {
      const a = nameMap.get(m.asset_id)
      const icon = m.value > 95 ? '🔴' : m.value > 85 ? '🟡' : '🟢'
      return `${i + 1}. ${icon} **${a?.name}** — ${m.value}% (총 ${a?.extra_info?.ram || 'N/A'})`
    })
    return { data: { message: `**메모리 사용률 Top 5** (최근 5분)\n\n${lines.join('\n')}\n\n${top[0]?.value > 95 ? '🚨 OOM 위험이 있는 자산이 있습니다! 즉시 확인하세요.' : top[0]?.value > 85 ? '⚠️ 주의가 필요한 자산이 있습니다.' : '메모리 상태가 안정적입니다.'}` } }
  }

  // 디스크 관련
  if (lower.includes('디스크') || lower.includes('disk') || lower.includes('저장')) {
    const fiveMinAgo = new Date(Date.now() - 5 * 60_000).toISOString()
    const { data: diskMetrics } = await supabase.from('metrics').select('asset_id, value').eq('metric_name', 'disk_usage').gte('time', fiveMinAgo).order('value', { ascending: false }).limit(21)
    const { data: assets } = await supabase.from('assets').select('id, name')
    const nameMap = new Map(assets?.map((a) => [a.id, a]) || [])
    const seen = new Set<string>()
    const top = (diskMetrics || []).filter((m) => { if (seen.has(m.asset_id)) return false; seen.add(m.asset_id); return true }).slice(0, 5)
    const lines = top.map((m, i) => {
      const a = nameMap.get(m.asset_id)
      const icon = m.value > 90 ? '🔴' : m.value > 80 ? '🟡' : '🟢'
      const daysLeft = m.value > 80 ? Math.round((100 - m.value) / 0.5) : null
      return `${i + 1}. ${icon} **${a?.name}** — ${m.value}%${daysLeft ? ` (약 ${daysLeft}일 후 포화 예상)` : ''}`
    })
    return { data: { message: `**디스크 사용률 Top 5** (최근 5분)\n\n${lines.join('\n')}\n\n${top[0]?.value > 90 ? '🚨 긴급! 디스크 정리 또는 증설이 필요합니다.\n권장: `journalctl --vacuum-size=500M && find /tmp -mtime +7 -delete`' : '디스크 상태를 지속 모니터링하세요.'}` } }
  }

  // 장애/다운 관련
  if (lower.includes('장애') || lower.includes('다운') || lower.includes('down') || lower.includes('사고')) {
    const { data: downAssets } = await supabase.from('assets').select('name, ip_address, location, last_heartbeat, extra_info').eq('status', 'down')
    if (!downAssets?.length) {
      return { data: { message: '✅ 현재 다운된 자산이 없습니다. 모든 서비스가 정상 운영 중입니다.' } }
    }
    const lines = downAssets.map((a, i) => {
      const hb = a.last_heartbeat ? new Date(a.last_heartbeat) : null
      const ago = hb ? Math.round((Date.now() - hb.getTime()) / 60000) : 0
      return `${i + 1}. 🔴 **${a.name}** (${a.ip_address})\n   위치: ${a.location}\n   역할: ${a.extra_info?.role || a.extra_info?.type || 'N/A'}\n   마지막 응답: ${ago > 60 ? `${Math.round(ago / 60)}시간 ${ago % 60}분 전` : `${ago}분 전`}`
    })
    return { data: { message: `**현재 장애 자산 ${downAssets.length}건**\n\n${lines.join('\n\n')}\n\n💡 AI 진단 탭에서 자산을 선택하면 상세 원인 분석을 받을 수 있습니다.` } }
  }

  // 알람 관련
  if (lower.includes('알람') || lower.includes('알림') || lower.includes('alert')) {
    const { data: alerts } = await supabase.from('alerts').select('severity, title, status, fired_at').eq('status', 'firing').order('fired_at', { ascending: false })
    const critical = alerts?.filter((a) => a.severity === 'critical') || []
    const warning = alerts?.filter((a) => a.severity === 'warning') || []
    const lines = (alerts || []).slice(0, 8).map((a) => {
      const icon = a.severity === 'critical' ? '🔴' : '🟡'
      const ago = Math.round((Date.now() - new Date(a.fired_at).getTime()) / 60000)
      return `${icon} ${a.title} (${ago}분 전)`
    })
    return { data: { message: `**활성 알람 ${alerts?.length || 0}건**\n🔴 Critical: ${critical.length}건 | 🟡 Warning: ${warning.length}건\n\n${lines.join('\n')}\n\n${critical.length > 0 ? '⚠️ Critical 알람에 즉시 대응이 필요합니다.' : '주의 수준의 알람만 있습니다.'}` } }
  }

  // 상태/현황/요약
  if (lower.includes('상태') || lower.includes('현황') || lower.includes('요약') || lower.includes('summary') || lower.includes('전체')) {
    const { data: summary } = await supabase.rpc('dashboard_summary')
    const s = summary || { total_assets: 0, normal_count: 0, warning_count: 0, down_count: 0, active_alerts: 0 }
    const avail = s.total_assets > 0 ? ((s.normal_count / s.total_assets) * 100).toFixed(1) : '0'
    return { data: { message: `**인프라 현황 요약**\n\n총 자산: ${s.total_assets}개\n✅ 정상: ${s.normal_count}개 (${avail}%)\n⚠️ 경고: ${s.warning_count}개\n🔴 다운: ${s.down_count}개\n\n활성 알람: ${s.active_alerts}건 (Critical ${s.critical_alerts}건)\n\nSLA 가용률: ${avail}% ${Number(avail) < 99.9 ? '⚠️ 목표 99.9% 미달' : '✅ 목표 달성'}` } }
  }

  // 네트워크/트래픽
  if (lower.includes('네트워크') || lower.includes('트래픽') || lower.includes('network') || lower.includes('traffic')) {
    const fiveMinAgo = new Date(Date.now() - 5 * 60_000).toISOString()
    const { data: netIn } = await supabase.from('metrics').select('asset_id, value').eq('metric_name', 'network_in').gte('time', fiveMinAgo).order('value', { ascending: false }).limit(10)
    const { data: assets } = await supabase.from('assets').select('id, name')
    const nameMap = new Map(assets?.map((a) => [a.id, a]) || [])
    const seen = new Set<string>()
    const top = (netIn || []).filter((m) => { if (seen.has(m.asset_id)) return false; seen.add(m.asset_id); return true }).slice(0, 5)
    const lines = top.map((m, i) => `${i + 1}. **${nameMap.get(m.asset_id)?.name}** — ${(m.value / 1000).toFixed(1)} Mbps`)
    return { data: { message: `**네트워크 인바운드 트래픽 Top 5**\n\n${lines.join('\n')}\n\n네트워크 장비 상태와 트래픽 패턴은 대시보드에서 실시간 확인 가능합니다.` } }
  }

  // 서버/자산 목록
  if (lower.includes('서버') || lower.includes('자산') || lower.includes('목록') || lower.includes('asset')) {
    const { data: assets } = await supabase.from('assets').select('name, asset_type, status, ip_address').order('name')
    const byType: Record<string, number> = {}
    const byStatus: Record<string, number> = {}
    assets?.forEach((a) => { byType[a.asset_type] = (byType[a.asset_type] || 0) + 1; byStatus[a.status] = (byStatus[a.status] || 0) + 1 })
    const typeLabels: Record<string, string> = { server: '서버', network_device: '네트워크 장비', vm: '가상머신', system: '시스템' }
    const typeLines = Object.entries(byType).map(([k, v]) => `• ${typeLabels[k] || k}: ${v}대`)
    return { data: { message: `**자산 현황** (총 ${assets?.length || 0}개)\n\n유형별:\n${typeLines.join('\n')}\n\n상태별:\n• ✅ 정상: ${byStatus.normal || 0}개\n• ⚠️ 경고: ${byStatus.warning || 0}개\n• 🔴 다운: ${byStatus.down || 0}개\n\n자산관리 메뉴에서 상세 정보를 확인할 수 있습니다.` } }
  }

  // 로그 관련
  if (lower.includes('로그') || lower.includes('에러') || lower.includes('error') || lower.includes('log')) {
    const { data: logs } = await supabase.from('log_entries').select('level, message, timestamp, source').order('timestamp', { ascending: false }).limit(10)
    const errors = logs?.filter((l) => l.level === 'error') || []
    const warns = logs?.filter((l) => l.level === 'warn') || []
    const lines = (logs || []).slice(0, 6).map((l) => {
      const icon = l.level === 'error' ? '🔴' : l.level === 'warn' ? '🟡' : '🔵'
      const ago = Math.round((Date.now() - new Date(l.timestamp).getTime()) / 60000)
      return `${icon} [${l.level}] ${l.message.substring(0, 60)} (${ago}분 전)`
    })
    return { data: { message: `**최근 로그 현황**\n🔴 Error: ${errors.length}건 | 🟡 Warning: ${warns.length}건\n\n${lines.join('\n')}\n\n로그 메뉴에서 소스별, 레벨별 필터링이 가능합니다.` } }
  }

  // 도움말 / 기본 응답
  return {
    data: {
      message: `안녕하세요! INSITE AI 어시스턴트입니다. 실시간 데이터를 기반으로 답변드립니다.\n\n**질문 예시:**\n• "CPU 사용률 높은 서버는?" — 실시간 CPU Top 5\n• "메모리 상태 알려줘" — 메모리 사용률 분석\n• "디스크 현황" — 디스크 사용량 + 포화 예측\n• "현재 장애 상태" — 다운 자산 상세 정보\n• "활성 알람" — 알람 현황 요약\n• "인프라 전체 상태" — 종합 요약\n• "네트워크 트래픽" — 트래픽 Top 5\n• "최근 에러 로그" — 로그 현황\n• "서버 목록" — 자산 유형별 현황`,
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
