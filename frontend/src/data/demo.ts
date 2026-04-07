/**
 * Fallback demo data for when the backend API returns empty results.
 * Ensures the UI always looks populated for demo/showcase purposes.
 */
import type { Asset, Alert, AlertRule } from '@/types'

const now = new Date()
const ago = (minutes: number) => new Date(now.getTime() - minutes * 60_000).toISOString()
const daysAgo = (days: number, hours = 0) => new Date(now.getTime() - (days * 24 + hours) * 3600_000).toISOString()

// ─── Assets ───
export const DEMO_ASSETS: Asset[] = [
  // Servers
  { id: 'a-001', asset_type: 'server', name: 'WEB-PRD-01', ip_address: '10.0.1.10', mac_address: '00:1A:2B:3C:01:10', location: '서울 IDC A동 3F', status: 'normal', last_heartbeat: ago(0.5), extra_info: { os: 'Ubuntu 22.04', cpu: '16 cores', ram: '64GB', role: 'Web Server' }, created_at: daysAgo(120), updated_at: ago(1) },
  { id: 'a-002', asset_type: 'server', name: 'WEB-PRD-02', ip_address: '10.0.1.11', mac_address: '00:1A:2B:3C:01:11', location: '서울 IDC A동 3F', status: 'normal', last_heartbeat: ago(0.3), extra_info: { os: 'Ubuntu 22.04', cpu: '16 cores', ram: '64GB', role: 'Web Server' }, created_at: daysAgo(120), updated_at: ago(1) },
  { id: 'a-003', asset_type: 'server', name: 'WEB-PRD-03', ip_address: '10.0.1.12', mac_address: '00:1A:2B:3C:01:12', location: '서울 IDC A동 3F', status: 'warning', last_heartbeat: ago(1), extra_info: { os: 'Ubuntu 22.04', cpu: '16 cores', ram: '64GB', role: 'Web Server' }, created_at: daysAgo(120), updated_at: ago(5) },
  { id: 'a-004', asset_type: 'server', name: 'API-PRD-01', ip_address: '10.0.2.10', mac_address: '00:1A:2B:3C:02:10', location: '서울 IDC A동 3F', status: 'normal', last_heartbeat: ago(0.2), extra_info: { os: 'CentOS 8', cpu: '32 cores', ram: '128GB', role: 'API Server' }, created_at: daysAgo(90), updated_at: ago(1) },
  { id: 'a-005', asset_type: 'server', name: 'API-PRD-02', ip_address: '10.0.2.11', mac_address: '00:1A:2B:3C:02:11', location: '서울 IDC A동 3F', status: 'normal', last_heartbeat: ago(0.4), extra_info: { os: 'CentOS 8', cpu: '32 cores', ram: '128GB', role: 'API Server' }, created_at: daysAgo(90), updated_at: ago(1) },
  { id: 'a-006', asset_type: 'server', name: 'DB-PRD-01', ip_address: '10.0.3.10', mac_address: '00:1A:2B:3C:03:10', location: '서울 IDC B동 2F', status: 'normal', last_heartbeat: ago(0.3), extra_info: { os: 'Rocky Linux 9', cpu: '64 cores', ram: '256GB', role: 'Primary DB' }, created_at: daysAgo(180), updated_at: ago(1) },
  { id: 'a-007', asset_type: 'server', name: 'DB-PRD-02', ip_address: '10.0.3.11', mac_address: '00:1A:2B:3C:03:11', location: '서울 IDC B동 2F', status: 'normal', last_heartbeat: ago(0.5), extra_info: { os: 'Rocky Linux 9', cpu: '64 cores', ram: '256GB', role: 'Replica DB' }, created_at: daysAgo(180), updated_at: ago(1) },
  { id: 'a-008', asset_type: 'server', name: 'DB-PRD-03', ip_address: '10.0.3.12', mac_address: '00:1A:2B:3C:03:12', location: '서울 IDC B동 2F', status: 'down', last_heartbeat: ago(125), extra_info: { os: 'Rocky Linux 9', cpu: '64 cores', ram: '256GB', role: 'Replica DB' }, created_at: daysAgo(180), updated_at: ago(45) },
  { id: 'a-009', asset_type: 'server', name: 'CACHE-PRD-01', ip_address: '10.0.4.10', mac_address: '00:1A:2B:3C:04:10', location: '서울 IDC A동 3F', status: 'normal', last_heartbeat: ago(0.2), extra_info: { os: 'Ubuntu 22.04', cpu: '8 cores', ram: '32GB', role: 'Redis Cache' }, created_at: daysAgo(100), updated_at: ago(1) },
  { id: 'a-010', asset_type: 'server', name: 'KAFKA-PRD-01', ip_address: '10.0.5.10', mac_address: '00:1A:2B:3C:05:10', location: '서울 IDC B동 3F', status: 'normal', last_heartbeat: ago(0.3), extra_info: { os: 'Ubuntu 22.04', cpu: '16 cores', ram: '64GB', role: 'Kafka Broker' }, created_at: daysAgo(80), updated_at: ago(1) },
  { id: 'a-011', asset_type: 'server', name: 'KAFKA-PRD-03', ip_address: '10.0.5.12', mac_address: '00:1A:2B:3C:05:12', location: '서울 IDC B동 3F', status: 'warning', last_heartbeat: ago(2), extra_info: { os: 'Ubuntu 22.04', cpu: '16 cores', ram: '64GB', role: 'Kafka Broker' }, created_at: daysAgo(80), updated_at: ago(10) },
  { id: 'a-012', asset_type: 'server', name: 'ES-PRD-01', ip_address: '10.0.6.10', mac_address: '00:1A:2B:3C:06:10', location: '서울 IDC B동 3F', status: 'normal', last_heartbeat: ago(0.4), extra_info: { os: 'Ubuntu 22.04', cpu: '32 cores', ram: '128GB', role: 'Elasticsearch' }, created_at: daysAgo(70), updated_at: ago(1) },
  // Network Devices
  { id: 'a-013', asset_type: 'network_device', name: 'CORE-SW-01', ip_address: '10.0.0.1', mac_address: '00:1A:2B:AA:00:01', location: '서울 IDC A동 1F', status: 'normal', last_heartbeat: ago(0.1), extra_info: { vendor: 'Cisco', model: 'Nexus 9300', firmware: '10.3.2' }, created_at: daysAgo(200), updated_at: ago(1) },
  { id: 'a-014', asset_type: 'network_device', name: 'CORE-SW-02', ip_address: '10.0.0.2', mac_address: '00:1A:2B:AA:00:02', location: '서울 IDC B동 1F', status: 'normal', last_heartbeat: ago(0.1), extra_info: { vendor: 'Cisco', model: 'Nexus 9300', firmware: '10.3.2' }, created_at: daysAgo(200), updated_at: ago(1) },
  { id: 'a-015', asset_type: 'network_device', name: 'DIST-SW-B2', ip_address: '10.0.0.11', mac_address: '00:1A:2B:BB:00:11', location: '서울 IDC B동 2F', status: 'warning', last_heartbeat: ago(0.5), extra_info: { vendor: 'Juniper', model: 'EX4300', firmware: '21.4R3' }, created_at: daysAgo(150), updated_at: ago(5) },
  { id: 'a-016', asset_type: 'network_device', name: 'FW-EXT-01', ip_address: '10.0.0.50', mac_address: '00:1A:2B:CC:00:50', location: '서울 IDC A동 1F', status: 'normal', last_heartbeat: ago(0.2), extra_info: { vendor: 'Palo Alto', model: 'PA-5260', firmware: '11.1.2' }, created_at: daysAgo(200), updated_at: ago(1) },
  { id: 'a-017', asset_type: 'network_device', name: 'LB-PRD-01', ip_address: '10.0.0.60', mac_address: '00:1A:2B:DD:00:60', location: '서울 IDC A동 1F', status: 'normal', last_heartbeat: ago(0.2), extra_info: { vendor: 'F5', model: 'BIG-IP i5800', firmware: '17.1.1' }, created_at: daysAgo(160), updated_at: ago(1) },
  // VMs
  { id: 'a-018', asset_type: 'vm', name: 'DEV-VM-01', ip_address: '10.10.1.10', mac_address: '00:50:56:A1:01:10', location: '서울 IDC A동 3F', status: 'normal', last_heartbeat: ago(1), extra_info: { hypervisor: 'VMware', cpu: '4 cores', ram: '16GB', role: 'Dev Server' }, created_at: daysAgo(60), updated_at: ago(1) },
  // Systems (Kubernetes)
  { id: 'a-019', asset_type: 'system', name: 'K8S-MASTER-01', ip_address: '10.0.10.10', mac_address: '00:1A:2B:EE:10:10', location: '서울 IDC B동 3F', status: 'normal', last_heartbeat: ago(0.3), extra_info: { type: 'Kubernetes', version: '1.29.2', role: 'Control Plane' }, created_at: daysAgo(100), updated_at: ago(1) },
  { id: 'a-020', asset_type: 'system', name: 'K8S-WORKER-01', ip_address: '10.0.10.20', mac_address: '00:1A:2B:EE:10:20', location: '서울 IDC B동 3F', status: 'normal', last_heartbeat: ago(0.4), extra_info: { type: 'Kubernetes', version: '1.29.2', role: 'Worker Node' }, created_at: daysAgo(100), updated_at: ago(1) },
  { id: 'a-021', asset_type: 'system', name: 'K8S-WORKER-03', ip_address: '10.0.10.22', mac_address: '00:1A:2B:EE:10:22', location: '서울 IDC B동 3F', status: 'down', last_heartbeat: ago(135), extra_info: { type: 'Kubernetes', version: '1.29.2', role: 'Worker Node' }, created_at: daysAgo(100), updated_at: ago(130) },
]

// ─── Alerts ───
export const DEMO_ALERTS: Alert[] = [
  // Firing - Critical
  { id: 'al-001', asset_id: 'a-008', rule_id: 'r-001', severity: 'critical', title: 'DB-PRD-03 CPU 95% 초과', message: 'CPU 사용률이 95%를 5분 이상 초과했습니다. 즉시 확인 필요.', status: 'firing', fired_at: ago(45), notification_sent: true },
  { id: 'al-002', asset_id: 'a-008', rule_id: 'r-003', severity: 'critical', title: 'DB-PRD-03 메모리 96%', message: '메모리 사용률 96%. OOM 위험. 프로세스 정리 또는 증설 필요.', status: 'firing', fired_at: ago(40), notification_sent: true },
  { id: 'al-003', asset_id: 'a-008', rule_id: 'r-005', severity: 'critical', title: 'DB-PRD-03 디스크 93%', message: '디스크 /data 93%. 긴급 정리 필요. 예상 포화 시간: 6시간.', status: 'firing', fired_at: ago(120), notification_sent: true },
  { id: 'al-004', asset_id: 'a-021', rule_id: 'r-008', severity: 'critical', title: 'K8S-WORKER-03 응답 없음', message: '워커 노드 2시간 전부터 Heartbeat 응답 없음. 노드 상태 확인 필요.', status: 'firing', fired_at: ago(130), notification_sent: true },
  // Firing - Warning
  { id: 'al-005', asset_id: 'a-003', rule_id: 'r-002', severity: 'warning', title: 'WEB-PRD-03 CPU 82%', message: 'CPU 사용률 높음. 트래픽 분산 또는 스케일아웃 확인.', status: 'firing', fired_at: ago(25), notification_sent: true },
  { id: 'al-006', asset_id: 'a-011', rule_id: 'r-002', severity: 'warning', title: 'KAFKA-PRD-03 CPU 78%', message: 'Consumer lag 증가 추세. 파티션 리밸런싱 확인 필요.', status: 'firing', fired_at: ago(15), notification_sent: true },
  { id: 'al-007', asset_id: 'a-015', rule_id: 'r-007', severity: 'warning', title: 'DIST-SW-B2 트래픽 과부하', message: '포트 Gi0/24 트래픽 임계치 초과. 패킷 로스 7.2%.', status: 'firing', fired_at: ago(8), notification_sent: true },
  { id: 'al-008', asset_id: 'a-009', rule_id: 'r-004', severity: 'warning', title: 'CACHE-PRD-01 메모리 87%', message: 'Redis 메모리 사용 87%. maxmemory 정책 확인.', status: 'firing', fired_at: ago(55), notification_sent: true },
  // Acknowledged
  { id: 'al-009', asset_id: 'a-012', rule_id: 'r-006', severity: 'warning', title: 'ES-PRD-01 디스크 83%', message: 'Elasticsearch 인덱스 정리 작업 예정.', status: 'acknowledged', fired_at: ago(180), acknowledged_at: ago(170), acknowledged_by: 'operator', notification_sent: true },
  { id: 'al-010', asset_id: 'a-002', rule_id: 'r-002', severity: 'warning', title: 'WEB-PRD-02 CPU 간헐적 75%', message: '배치 작업 시간대 일시적 증가. 모니터링 중.', status: 'acknowledged', fired_at: ago(95), acknowledged_at: ago(85), acknowledged_by: 'operator', notification_sent: true },
  // Resolved
  { id: 'al-011', asset_id: 'a-004', rule_id: 'r-001', severity: 'critical', title: 'API-PRD-01 CPU 92% 스파이크', message: '대량 API 요청으로 인한 일시적 CPU 급증. 오토스케일 대응 완료.', status: 'resolved', fired_at: ago(360), acknowledged_at: ago(355), acknowledged_by: 'operator', resolved_at: ago(330), notification_sent: true },
  { id: 'al-012', asset_id: 'a-006', rule_id: 'r-004', severity: 'warning', title: 'DB-PRD-01 메모리 88%', message: '쿼리 캐시 정리 후 정상화.', status: 'resolved', fired_at: ago(480), acknowledged_at: ago(475), acknowledged_by: 'admin', resolved_at: ago(450), notification_sent: true },
  { id: 'al-013', asset_id: 'a-013', rule_id: 'r-007', severity: 'warning', title: 'CORE-SW-01 패킷 로스 6%', message: '포트 플랩 감지. 케이블 교체 후 정상.', status: 'resolved', fired_at: ago(720), acknowledged_at: ago(710), acknowledged_by: 'operator', resolved_at: ago(690), notification_sent: true },
]

// ─── Alert Rules ───
export const DEMO_ALERT_RULES: AlertRule[] = [
  { id: 'r-001', name: 'CPU Critical (>90%, 5min)', metric_name: 'cpu_usage', condition: 'gt', threshold: 90, duration_seconds: 300, severity: 'critical', enabled: true },
  { id: 'r-002', name: 'CPU Warning (>70%, 10min)', metric_name: 'cpu_usage', condition: 'gt', threshold: 70, duration_seconds: 600, severity: 'warning', enabled: true },
  { id: 'r-003', name: 'Memory Critical (>95%)', metric_name: 'memory_usage', condition: 'gt', threshold: 95, duration_seconds: 0, severity: 'critical', enabled: true },
  { id: 'r-004', name: 'Memory Warning (>85%)', metric_name: 'memory_usage', condition: 'gt', threshold: 85, duration_seconds: 0, severity: 'warning', enabled: true },
  { id: 'r-005', name: 'Disk Critical (>90%)', metric_name: 'disk_usage', condition: 'gt', threshold: 90, duration_seconds: 0, severity: 'critical', enabled: true },
  { id: 'r-006', name: 'Disk Warning (>80%)', metric_name: 'disk_usage', condition: 'gt', threshold: 80, duration_seconds: 0, severity: 'warning', enabled: true },
  { id: 'r-007', name: 'Packet Loss (>5%)', metric_name: 'packet_loss', condition: 'gt', threshold: 5, duration_seconds: 60, severity: 'warning', enabled: true },
  { id: 'r-008', name: 'Heartbeat Failure', metric_name: 'heartbeat', condition: 'eq', threshold: 0, duration_seconds: 30, severity: 'critical', enabled: true },
]

// ─── Reports ───
export const DEMO_REPORTS = [
  { id: 'rpt-001', report_type: '일간', format: 'PDF', status: '완료', created_at: ago(83), created_by: 'admin', file_size: '2.4MB', summary: '자산 21개 중 정상 16개, 경고 3개, 다운 2개 — 전일 대비 다운 +1' },
  { id: 'rpt-002', report_type: '일간', format: 'Excel', status: '완료', created_at: ago(340), created_by: 'admin', file_size: '1.8MB', summary: '알람 7건 발생 (Critical 3, Warning 4), 해결 0건 — 즉시 대응 필요' },
  { id: 'rpt-003', report_type: '일간', format: 'PDF', status: '완료', created_at: daysAgo(1, 2), created_by: 'operator', file_size: '2.2MB', summary: 'DB-PRD-03 CPU 95% 지속, KAFKA-PRD-03 Consumer lag 증가 감지' },
  { id: 'rpt-004', report_type: '주간', format: 'PDF', status: '완료', created_at: daysAgo(1, 8), created_by: 'admin', file_size: '5.1MB', summary: '주간 가용률 97.2%, SLA 목표 99.9% 미달 — DB/K8S 장애 영향' },
  { id: 'rpt-005', report_type: '주간', format: 'Excel', status: '완료', created_at: daysAgo(2, 3), created_by: 'admin', file_size: '3.7MB', summary: '서버별 리소스 사용 현황 — WEB-PRD-03 CPU 82%, 트래픽 분산 권고' },
  { id: 'rpt-006', report_type: '일간', format: 'PDF', status: '완료', created_at: daysAgo(2, 6), created_by: 'operator', file_size: '2.0MB', summary: '네트워크 장비 DIST-SW-B2 트래픽 과부하, 포트 임계치 초과' },
  { id: 'rpt-007', report_type: '주간', format: 'PDF', status: '완료', created_at: daysAgo(5), created_by: 'admin', file_size: '4.8MB', summary: '보안 패치 미적용 서버 2대 식별, SSL 인증서 만료 7일 전 경고' },
  { id: 'rpt-008', report_type: '월간', format: 'PDF', status: '완료', created_at: daysAgo(7, 4), created_by: 'admin', file_size: '12.3MB', summary: '월간 인프라 종합 — 자산 21개, 장애 3건, 평균 CPU 42%, 디스크 증설 권고' },
  { id: 'rpt-009', report_type: '월간', format: 'Excel', status: '완료', created_at: daysAgo(14), created_by: 'operator', file_size: '8.9MB', summary: '리소스 트렌드 분석 — DB 메모리 월 +5%, Kafka 디스크 월 +3% 증가 추세' },
  { id: 'rpt-010', report_type: '일간', format: 'PDF', status: '완료', created_at: daysAgo(3, 1), created_by: 'admin', file_size: '2.3MB', summary: 'K8S-WORKER-03 응답 없음 2시간 경과, 노드 교체 작업 필요' },
  { id: 'rpt-011', report_type: '주간', format: 'Excel', status: '완료', created_at: daysAgo(9), created_by: 'admin', file_size: '4.2MB', summary: '알람 규칙 효율성 분석 — 오탐률 12%, 임계치 조정 권고 4건' },
  { id: 'rpt-012', report_type: '월간', format: 'PDF', status: '완료', created_at: daysAgo(30), created_by: 'admin', file_size: '15.1MB', summary: '분기 인프라 투자 보고서 — 서버 3대 증설, 네트워크 회선 이중화 완료' },
]
