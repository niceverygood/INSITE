-- ============================================================
-- INSITE: Supabase 테이블 생성 + 시드 데이터
-- Supabase SQL Editor에서 이 전체를 복사해서 실행하세요
-- ============================================================

-- 1. 확장 기능
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. 기존 테이블 삭제 (재실행 시)
DROP TABLE IF EXISTS metrics CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS log_entries CASCADE;
DROP TABLE IF EXISTS alerts CASCADE;
DROP TABLE IF EXISTS alert_rules CASCADE;
DROP TABLE IF EXISTS assets CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================================
-- 테이블 생성
-- ============================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'viewer',
    department VARCHAR(255),
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_users_username ON users(username);

CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_type VARCHAR(30) NOT NULL,
    name VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45) UNIQUE NOT NULL,
    mac_address VARCHAR(17),
    location VARCHAR(255),
    floor_map_x FLOAT,
    floor_map_y FLOAT,
    status VARCHAR(20) DEFAULT 'normal',
    last_heartbeat TIMESTAMP,
    extra_info JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_assets_type ON assets(asset_type);
CREATE INDEX idx_assets_ip ON assets(ip_address);
CREATE INDEX idx_assets_status ON assets(status);

CREATE TABLE alert_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    condition VARCHAR(10) NOT NULL,
    threshold FLOAT NOT NULL,
    duration_seconds INTEGER DEFAULT 0,
    severity VARCHAR(20) DEFAULT 'warning',
    enabled BOOLEAN DEFAULT TRUE,
    notification_channels JSONB,
    asset_filter JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID REFERENCES assets(id),
    rule_id UUID REFERENCES alert_rules(id),
    severity VARCHAR(20) NOT NULL,
    title VARCHAR(500) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'firing',
    fired_at TIMESTAMP DEFAULT NOW(),
    acknowledged_at TIMESTAMP,
    acknowledged_by VARCHAR(255),
    resolved_at TIMESTAMP,
    notification_sent BOOLEAN DEFAULT FALSE
);
CREATE INDEX idx_alerts_asset ON alerts(asset_id);
CREATE INDEX idx_alerts_severity ON alerts(severity);
CREATE INDEX idx_alerts_status ON alerts(status);

CREATE TABLE log_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID REFERENCES assets(id),
    timestamp TIMESTAMP DEFAULT NOW(),
    source VARCHAR(30) NOT NULL,
    level VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    raw_data JSONB
);
CREATE INDEX idx_logs_asset ON log_entries(asset_id);
CREATE INDEX idx_logs_level ON log_entries(level);
CREATE INDEX idx_logs_time ON log_entries(timestamp);

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    username VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    target_id VARCHAR(36),
    detail TEXT,
    ip_address VARCHAR(45),
    timestamp TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_time ON audit_logs(timestamp);

CREATE TABLE metrics (
    time TIMESTAMP NOT NULL,
    asset_id UUID NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    value FLOAT NOT NULL,
    unit VARCHAR(20),
    PRIMARY KEY (time, asset_id, metric_name)
);
CREATE INDEX idx_metrics_name ON metrics(metric_name);

-- ============================================================
-- 시드 데이터: 사용자
-- ============================================================

INSERT INTO users (id, username, email, hashed_password, role) VALUES
    ('00000000-0000-0000-0000-000000000001', 'admin', 'admin@insite.local', '$2b$12$4mLxQo0wF8w4Yd9EjcIiQuu2eRmz7EWkWwFooD7wl/N4TWH9hustS', 'admin'),
    ('00000000-0000-0000-0000-000000000002', 'operator', 'operator@insite.local', '$2b$12$yEExDdA4e7hnaLJYgYXjGuU4w9CJt.PpkMC382V1VG5JMRmOb4nT6', 'operator'),
    ('00000000-0000-0000-0000-000000000003', 'viewer', 'viewer@insite.local', '$2b$12$fnniyLBBRftfimLmcNWvsuaI7Aq59oIxRep0YlAFrN3RQJSTVTKsu', 'viewer');

-- ============================================================
-- 시드 데이터: 자산 (21개)
-- ============================================================

INSERT INTO assets (id, asset_type, name, ip_address, mac_address, location, status, last_heartbeat, extra_info) VALUES
    -- Servers
    ('10000000-0000-0000-0000-000000000001', 'server', 'WEB-PRD-01', '10.0.1.10', '00:1A:2B:3C:01:10', '서울 IDC A동 3F', 'normal', NOW() - INTERVAL '30 seconds', '{"os":"Ubuntu 22.04","cpu":"16 cores","ram":"64GB","role":"Web Server"}'),
    ('10000000-0000-0000-0000-000000000002', 'server', 'WEB-PRD-02', '10.0.1.11', '00:1A:2B:3C:01:11', '서울 IDC A동 3F', 'normal', NOW() - INTERVAL '18 seconds', '{"os":"Ubuntu 22.04","cpu":"16 cores","ram":"64GB","role":"Web Server"}'),
    ('10000000-0000-0000-0000-000000000003', 'server', 'WEB-PRD-03', '10.0.1.12', '00:1A:2B:3C:01:12', '서울 IDC A동 3F', 'warning', NOW() - INTERVAL '60 seconds', '{"os":"Ubuntu 22.04","cpu":"16 cores","ram":"64GB","role":"Web Server"}'),
    ('10000000-0000-0000-0000-000000000004', 'server', 'API-PRD-01', '10.0.2.10', '00:1A:2B:3C:02:10', '서울 IDC A동 3F', 'normal', NOW() - INTERVAL '12 seconds', '{"os":"CentOS 8","cpu":"32 cores","ram":"128GB","role":"API Server"}'),
    ('10000000-0000-0000-0000-000000000005', 'server', 'API-PRD-02', '10.0.2.11', '00:1A:2B:3C:02:11', '서울 IDC A동 3F', 'normal', NOW() - INTERVAL '24 seconds', '{"os":"CentOS 8","cpu":"32 cores","ram":"128GB","role":"API Server"}'),
    ('10000000-0000-0000-0000-000000000006', 'server', 'DB-PRD-01', '10.0.3.10', '00:1A:2B:3C:03:10', '서울 IDC B동 2F', 'normal', NOW() - INTERVAL '18 seconds', '{"os":"Rocky Linux 9","cpu":"64 cores","ram":"256GB","role":"Primary DB"}'),
    ('10000000-0000-0000-0000-000000000007', 'server', 'DB-PRD-02', '10.0.3.11', '00:1A:2B:3C:03:11', '서울 IDC B동 2F', 'normal', NOW() - INTERVAL '30 seconds', '{"os":"Rocky Linux 9","cpu":"64 cores","ram":"256GB","role":"Replica DB"}'),
    ('10000000-0000-0000-0000-000000000008', 'server', 'DB-PRD-03', '10.0.3.12', '00:1A:2B:3C:03:12', '서울 IDC B동 2F', 'down', NOW() - INTERVAL '2 hours', '{"os":"Rocky Linux 9","cpu":"64 cores","ram":"256GB","role":"Replica DB"}'),
    ('10000000-0000-0000-0000-000000000009', 'server', 'CACHE-PRD-01', '10.0.4.10', '00:1A:2B:3C:04:10', '서울 IDC A동 3F', 'normal', NOW() - INTERVAL '12 seconds', '{"os":"Ubuntu 22.04","cpu":"8 cores","ram":"32GB","role":"Redis Cache"}'),
    ('10000000-0000-0000-0000-000000000010', 'server', 'KAFKA-PRD-01', '10.0.5.10', '00:1A:2B:3C:05:10', '서울 IDC B동 3F', 'normal', NOW() - INTERVAL '18 seconds', '{"os":"Ubuntu 22.04","cpu":"16 cores","ram":"64GB","role":"Kafka Broker"}'),
    ('10000000-0000-0000-0000-000000000011', 'server', 'KAFKA-PRD-03', '10.0.5.12', '00:1A:2B:3C:05:12', '서울 IDC B동 3F', 'warning', NOW() - INTERVAL '120 seconds', '{"os":"Ubuntu 22.04","cpu":"16 cores","ram":"64GB","role":"Kafka Broker"}'),
    ('10000000-0000-0000-0000-000000000012', 'server', 'ES-PRD-01', '10.0.6.10', '00:1A:2B:3C:06:10', '서울 IDC B동 3F', 'normal', NOW() - INTERVAL '24 seconds', '{"os":"Ubuntu 22.04","cpu":"32 cores","ram":"128GB","role":"Elasticsearch"}'),
    -- Network Devices
    ('10000000-0000-0000-0000-000000000013', 'network_device', 'CORE-SW-01', '10.0.0.1', '00:1A:2B:AA:00:01', '서울 IDC A동 1F', 'normal', NOW() - INTERVAL '6 seconds', '{"vendor":"Cisco","model":"Nexus 9300","firmware":"10.3.2"}'),
    ('10000000-0000-0000-0000-000000000014', 'network_device', 'CORE-SW-02', '10.0.0.2', '00:1A:2B:AA:00:02', '서울 IDC B동 1F', 'normal', NOW() - INTERVAL '6 seconds', '{"vendor":"Cisco","model":"Nexus 9300","firmware":"10.3.2"}'),
    ('10000000-0000-0000-0000-000000000015', 'network_device', 'DIST-SW-B2', '10.0.0.11', '00:1A:2B:BB:00:11', '서울 IDC B동 2F', 'warning', NOW() - INTERVAL '30 seconds', '{"vendor":"Juniper","model":"EX4300","firmware":"21.4R3"}'),
    ('10000000-0000-0000-0000-000000000016', 'network_device', 'FW-EXT-01', '10.0.0.50', '00:1A:2B:CC:00:50', '서울 IDC A동 1F', 'normal', NOW() - INTERVAL '12 seconds', '{"vendor":"Palo Alto","model":"PA-5260","firmware":"11.1.2"}'),
    ('10000000-0000-0000-0000-000000000017', 'network_device', 'LB-PRD-01', '10.0.0.60', '00:1A:2B:DD:00:60', '서울 IDC A동 1F', 'normal', NOW() - INTERVAL '12 seconds', '{"vendor":"F5","model":"BIG-IP i5800","firmware":"17.1.1"}'),
    -- VMs
    ('10000000-0000-0000-0000-000000000018', 'vm', 'DEV-VM-01', '10.10.1.10', '00:50:56:A1:01:10', '서울 IDC A동 3F', 'normal', NOW() - INTERVAL '60 seconds', '{"hypervisor":"VMware","cpu":"4 cores","ram":"16GB","role":"Dev Server"}'),
    -- Systems (Kubernetes)
    ('10000000-0000-0000-0000-000000000019', 'system', 'K8S-MASTER-01', '10.0.10.10', '00:1A:2B:EE:10:10', '서울 IDC B동 3F', 'normal', NOW() - INTERVAL '18 seconds', '{"type":"Kubernetes","version":"1.29.2","role":"Control Plane"}'),
    ('10000000-0000-0000-0000-000000000020', 'system', 'K8S-WORKER-01', '10.0.10.20', '00:1A:2B:EE:10:20', '서울 IDC B동 3F', 'normal', NOW() - INTERVAL '24 seconds', '{"type":"Kubernetes","version":"1.29.2","role":"Worker Node"}'),
    ('10000000-0000-0000-0000-000000000021', 'system', 'K8S-WORKER-03', '10.0.10.22', '00:1A:2B:EE:10:22', '서울 IDC B동 3F', 'down', NOW() - INTERVAL '2 hours', '{"type":"Kubernetes","version":"1.29.2","role":"Worker Node"}');

-- ============================================================
-- 시드 데이터: 알람 규칙 (8개)
-- ============================================================

INSERT INTO alert_rules (id, name, metric_name, condition, threshold, duration_seconds, severity, enabled) VALUES
    ('20000000-0000-0000-0000-000000000001', 'CPU Critical (>90%, 5min)', 'cpu_usage', 'gt', 90.0, 300, 'critical', TRUE),
    ('20000000-0000-0000-0000-000000000002', 'CPU Warning (>70%, 10min)', 'cpu_usage', 'gt', 70.0, 600, 'warning', TRUE),
    ('20000000-0000-0000-0000-000000000003', 'Memory Critical (>95%)', 'memory_usage', 'gt', 95.0, 0, 'critical', TRUE),
    ('20000000-0000-0000-0000-000000000004', 'Memory Warning (>85%)', 'memory_usage', 'gt', 85.0, 0, 'warning', TRUE),
    ('20000000-0000-0000-0000-000000000005', 'Disk Critical (>90%)', 'disk_usage', 'gt', 90.0, 0, 'critical', TRUE),
    ('20000000-0000-0000-0000-000000000006', 'Disk Warning (>80%)', 'disk_usage', 'gt', 80.0, 0, 'warning', TRUE),
    ('20000000-0000-0000-0000-000000000007', 'Packet Loss (>5%)', 'packet_loss', 'gt', 5.0, 60, 'warning', TRUE),
    ('20000000-0000-0000-0000-000000000008', 'Heartbeat Failure', 'heartbeat', 'eq', 0.0, 30, 'critical', TRUE);

-- ============================================================
-- 시드 데이터: 알람 (13개 — firing/acknowledged/resolved 혼합)
-- ============================================================

INSERT INTO alerts (asset_id, rule_id, severity, title, message, status, fired_at, acknowledged_at, acknowledged_by, resolved_at, notification_sent) VALUES
    -- Firing - Critical
    ('10000000-0000-0000-0000-000000000008', '20000000-0000-0000-0000-000000000001', 'critical', 'DB-PRD-03 CPU 95% 초과', 'CPU 사용률이 95%를 5분 이상 초과했습니다. 즉시 확인 필요.', 'firing', NOW() - INTERVAL '45 minutes', NULL, NULL, NULL, TRUE),
    ('10000000-0000-0000-0000-000000000008', '20000000-0000-0000-0000-000000000003', 'critical', 'DB-PRD-03 메모리 96%', '메모리 사용률 96%. OOM 위험. 프로세스 정리 또는 증설 필요.', 'firing', NOW() - INTERVAL '40 minutes', NULL, NULL, NULL, TRUE),
    ('10000000-0000-0000-0000-000000000008', '20000000-0000-0000-0000-000000000005', 'critical', 'DB-PRD-03 디스크 93%', '디스크 /data 93%. 긴급 정리 필요. 예상 포화 시간: 6시간.', 'firing', NOW() - INTERVAL '120 minutes', NULL, NULL, NULL, TRUE),
    ('10000000-0000-0000-0000-000000000021', '20000000-0000-0000-0000-000000000008', 'critical', 'K8S-WORKER-03 응답 없음', '워커 노드 2시간 전부터 Heartbeat 응답 없음. 노드 상태 확인 필요.', 'firing', NOW() - INTERVAL '130 minutes', NULL, NULL, NULL, TRUE),
    -- Firing - Warning
    ('10000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000002', 'warning', 'WEB-PRD-03 CPU 82%', 'CPU 사용률 높음. 트래픽 분산 또는 스케일아웃 확인.', 'firing', NOW() - INTERVAL '25 minutes', NULL, NULL, NULL, TRUE),
    ('10000000-0000-0000-0000-000000000011', '20000000-0000-0000-0000-000000000002', 'warning', 'KAFKA-PRD-03 CPU 78%', 'Consumer lag 증가 추세. 파티션 리밸런싱 확인 필요.', 'firing', NOW() - INTERVAL '15 minutes', NULL, NULL, NULL, TRUE),
    ('10000000-0000-0000-0000-000000000015', '20000000-0000-0000-0000-000000000007', 'warning', 'DIST-SW-B2 트래픽 과부하', '포트 Gi0/24 트래픽 임계치 초과. 패킷 로스 7.2%.', 'firing', NOW() - INTERVAL '8 minutes', NULL, NULL, NULL, TRUE),
    ('10000000-0000-0000-0000-000000000009', '20000000-0000-0000-0000-000000000004', 'warning', 'CACHE-PRD-01 메모리 87%', 'Redis 메모리 사용 87%. maxmemory 정책 확인.', 'firing', NOW() - INTERVAL '55 minutes', NULL, NULL, NULL, TRUE),
    -- Acknowledged
    ('10000000-0000-0000-0000-000000000012', '20000000-0000-0000-0000-000000000006', 'warning', 'ES-PRD-01 디스크 83%', 'Elasticsearch 인덱스 정리 작업 예정.', 'acknowledged', NOW() - INTERVAL '180 minutes', NOW() - INTERVAL '170 minutes', 'operator', NULL, TRUE),
    ('10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'warning', 'WEB-PRD-02 CPU 간헐적 75%', '배치 작업 시간대 일시적 증가. 모니터링 중.', 'acknowledged', NOW() - INTERVAL '95 minutes', NOW() - INTERVAL '85 minutes', 'operator', NULL, TRUE),
    -- Resolved
    ('10000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000001', 'critical', 'API-PRD-01 CPU 92% 스파이크', '대량 API 요청으로 인한 일시적 CPU 급증. 오토스케일 대응 완료.', 'resolved', NOW() - INTERVAL '360 minutes', NOW() - INTERVAL '355 minutes', 'operator', NOW() - INTERVAL '330 minutes', TRUE),
    ('10000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000004', 'warning', 'DB-PRD-01 메모리 88%', '쿼리 캐시 정리 후 정상화.', 'resolved', NOW() - INTERVAL '480 minutes', NOW() - INTERVAL '475 minutes', 'admin', NOW() - INTERVAL '450 minutes', TRUE),
    ('10000000-0000-0000-0000-000000000013', '20000000-0000-0000-0000-000000000007', 'warning', 'CORE-SW-01 패킷 로스 6%', '포트 플랩 감지. 케이블 교체 후 정상.', 'resolved', NOW() - INTERVAL '720 minutes', NOW() - INTERVAL '710 minutes', 'operator', NOW() - INTERVAL '690 minutes', TRUE);

-- ============================================================
-- 시드 데이터: 로그 (30건)
-- ============================================================

INSERT INTO log_entries (asset_id, timestamp, source, level, message) VALUES
    ('10000000-0000-0000-0000-000000000008', NOW() - INTERVAL '5 minutes', 'application', 'error', 'Connection refused to upstream server'),
    ('10000000-0000-0000-0000-000000000008', NOW() - INTERVAL '12 minutes', 'application', 'error', 'Database connection pool exhausted (max=100, active=100)'),
    ('10000000-0000-0000-0000-000000000008', NOW() - INTERVAL '20 minutes', 'syslog', 'error', 'Out of memory: Kill process java (pid=29451) score 950'),
    ('10000000-0000-0000-0000-000000000021', NOW() - INTERVAL '130 minutes', 'syslog', 'error', 'Kernel panic - not syncing: Fatal exception in interrupt'),
    ('10000000-0000-0000-0000-000000000003', NOW() - INTERVAL '30 minutes', 'application', 'warn', 'Slow query detected: 8500ms for SELECT on orders table'),
    ('10000000-0000-0000-0000-000000000011', NOW() - INTERVAL '18 minutes', 'application', 'warn', 'Consumer lag increasing: partition 3 offset delta 15000'),
    ('10000000-0000-0000-0000-000000000015', NOW() - INTERVAL '10 minutes', 'syslog', 'warn', 'Interface Gi0/24 traffic exceeds 85% capacity'),
    ('10000000-0000-0000-0000-000000000009', NOW() - INTERVAL '55 minutes', 'application', 'warn', 'Redis memory usage at 87% of maxmemory'),
    ('10000000-0000-0000-0000-000000000016', NOW() - INTERVAL '60 minutes', 'security', 'warn', 'Certificate expires in 7 days for *.company.co.kr'),
    ('10000000-0000-0000-0000-000000000006', NOW() - INTERVAL '45 minutes', 'application', 'warn', 'Disk space below 20% on /data partition'),
    ('10000000-0000-0000-0000-000000000001', NOW() - INTERVAL '2 minutes', 'application', 'info', 'Application deployed: v2.4.321 (zero-downtime)'),
    ('10000000-0000-0000-0000-000000000004', NOW() - INTERVAL '3 minutes', 'application', 'info', 'Health check passed — all dependencies OK'),
    ('10000000-0000-0000-0000-000000000006', NOW() - INTERVAL '120 minutes', 'syslog', 'info', 'Database backup completed: 45GB in 12 minutes'),
    ('10000000-0000-0000-0000-000000000001', NOW() - INTERVAL '90 minutes', 'application', 'info', 'Service auth restarted successfully'),
    ('10000000-0000-0000-0000-000000000019', NOW() - INTERVAL '15 minutes', 'application', 'info', 'Kubernetes rolling update completed: api-server 3/3'),
    ('10000000-0000-0000-0000-000000000002', NOW() - INTERVAL '7 minutes', 'syslog', 'info', 'NTP time synchronized: offset 0.003s'),
    ('10000000-0000-0000-0000-000000000005', NOW() - INTERVAL '25 minutes', 'application', 'info', 'Cache warmed up: 15000 entries loaded'),
    ('10000000-0000-0000-0000-000000000013', NOW() - INTERVAL '40 minutes', 'syslog', 'info', 'BGP neighbor 10.0.0.2 established'),
    ('10000000-0000-0000-0000-000000000010', NOW() - INTERVAL '8 minutes', 'application', 'info', 'Kafka topic rebalance completed for consumer group insite'),
    ('10000000-0000-0000-0000-000000000017', NOW() - INTERVAL '35 minutes', 'syslog', 'info', 'SSL certificate renewed for *.insite.co.kr'),
    ('10000000-0000-0000-0000-000000000012', NOW() - INTERVAL '50 minutes', 'application', 'info', 'Elasticsearch index rotation: logs-2026.04.07 created'),
    ('10000000-0000-0000-0000-000000000007', NOW() - INTERVAL '70 minutes', 'syslog', 'info', 'PostgreSQL vacuum completed on orders table'),
    ('10000000-0000-0000-0000-000000000018', NOW() - INTERVAL '100 minutes', 'application', 'info', 'Dev build #1842 completed successfully'),
    ('10000000-0000-0000-0000-000000000014', NOW() - INTERVAL '200 minutes', 'syslog', 'info', 'Firmware upgrade scheduled for maintenance window'),
    ('10000000-0000-0000-0000-000000000004', NOW() - INTERVAL '1 minute', 'application', 'debug', 'API request: GET /api/v1/health - 200 OK (2ms)'),
    ('10000000-0000-0000-0000-000000000001', NOW() - INTERVAL '1 minute', 'application', 'debug', 'System heartbeat OK — all services responding'),
    ('10000000-0000-0000-0000-000000000020', NOW() - INTERVAL '5 minutes', 'syslog', 'debug', 'kubelet: node status updated, ready=true'),
    ('10000000-0000-0000-0000-000000000010', NOW() - INTERVAL '3 minutes', 'application', 'debug', 'Kafka producer sent 1500 messages in 2.1s'),
    ('10000000-0000-0000-0000-000000000006', NOW() - INTERVAL '2 minutes', 'application', 'debug', 'Query cache hit ratio: 94.2%'),
    ('10000000-0000-0000-0000-000000000019', NOW() - INTERVAL '4 minutes', 'syslog', 'debug', 'etcd cluster health: healthy, leader=k8s-master-01');

-- ============================================================
-- 완료!
-- ============================================================
-- 테스트 계정:
--   admin / admin123 (관리자)
--   operator / oper123 (운영자)
--   viewer / view123 (뷰어)
-- ============================================================

SELECT 'Setup complete!' AS result,
       (SELECT COUNT(*) FROM users) AS users,
       (SELECT COUNT(*) FROM assets) AS assets,
       (SELECT COUNT(*) FROM alert_rules) AS rules,
       (SELECT COUNT(*) FROM alerts) AS alerts,
       (SELECT COUNT(*) FROM log_entries) AS logs;
