export type AssetType = 'server' | 'network_device' | 'system' | 'vm'
export type AssetStatus = 'normal' | 'warning' | 'down'
export type AlertSeverity = 'info' | 'warning' | 'critical'
export type AlertStatus = 'firing' | 'acknowledged' | 'resolved'
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical'
export type UserRole = 'admin' | 'operator' | 'viewer'

export interface Asset {
  id: string
  asset_type: AssetType
  name: string
  ip_address: string
  mac_address?: string
  location?: string
  floor_map_x?: number
  floor_map_y?: number
  status: AssetStatus
  last_heartbeat?: string
  metadata?: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface Metric {
  time: string
  asset_id: string
  metric_name: string
  value: number
  unit?: string
}

export interface Alert {
  id: string
  asset_id: string
  rule_id: string
  severity: AlertSeverity
  title: string
  message: string
  status: AlertStatus
  fired_at: string
  acknowledged_at?: string
  acknowledged_by?: string
  resolved_at?: string
  notification_sent: boolean
}

export interface AlertRule {
  id: string
  name: string
  metric_name: string
  condition: 'gt' | 'lt' | 'eq'
  threshold: number
  duration_seconds: number
  severity: AlertSeverity
  enabled: boolean
  notification_channels?: Record<string, unknown>
  asset_filter?: Record<string, unknown>
}

export interface LogEntry {
  id: string
  asset_id: string
  timestamp: string
  source: string
  level: LogLevel
  message: string
  raw_data?: Record<string, unknown>
}

export interface User {
  id: string
  username: string
  email: string
  role: UserRole
  department?: string
  last_login?: string
  is_active: boolean
}

export interface DashboardSummary {
  total_assets: number
  normal_count: number
  warning_count: number
  down_count: number
  active_alerts: number
  critical_alerts: number
  warning_alerts: number
}

export interface DiagnosisResult {
  diagnosis_id: string
  asset_id: string
  timestamp: string
  causes: {
    rank: number
    cause: string
    confidence: number
    evidence: string[]
    immediate_action: string
    prevention: string
  }[]
  severity_score: number
  summary: string
}
