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

// ─── AI (stub — no backend) ───
export const requestDiagnosis = async (_assetId: string, _symptom?: string) => {
  return { data: { diagnosis_id: 'demo', summary: 'AI 진단은 데모 환경에서 지원되지 않습니다.' } }
}

export const fetchPredictions = async () => {
  return { data: [] }
}

export const aiChat = async (_message: string) => {
  return { data: { reply: 'AI 채팅은 데모 환경에서 지원되지 않습니다.' } }
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
