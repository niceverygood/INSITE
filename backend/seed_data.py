"""Seed realistic dummy data for INSITE demo."""
import asyncio
import json
import random
import uuid
from datetime import datetime, timedelta, timezone

from app.database import engine, AsyncSessionLocal, Base, TimescaleBase, timescale_engine
from app.models.asset import Asset
from app.models.metric import Metric
from app.models.alert import Alert, AlertRule
from app.models.log_entry import LogEntry
from app.models.user import User
from app.core.security import hash_password

# ─── Assets ───
ASSETS = [
    # Servers
    {"asset_type": "server", "name": "WEB-PRD-01", "ip_address": "10.0.1.10", "location": "서울 IDC A동 3F", "extra_info": '{"os":"Ubuntu 22.04","cpu":"16 cores","ram":"64GB","role":"Web Server"}', "status": "normal"},
    {"asset_type": "server", "name": "WEB-PRD-02", "ip_address": "10.0.1.11", "location": "서울 IDC A동 3F", "extra_info": '{"os":"Ubuntu 22.04","cpu":"16 cores","ram":"64GB","role":"Web Server"}', "status": "normal"},
    {"asset_type": "server", "name": "WEB-PRD-03", "ip_address": "10.0.1.12", "location": "서울 IDC A동 3F", "extra_info": '{"os":"Ubuntu 22.04","cpu":"16 cores","ram":"64GB","role":"Web Server"}', "status": "warning"},
    {"asset_type": "server", "name": "API-PRD-01", "ip_address": "10.0.2.10", "location": "서울 IDC A동 3F", "extra_info": '{"os":"CentOS 8","cpu":"32 cores","ram":"128GB","role":"API Server"}', "status": "normal"},
    {"asset_type": "server", "name": "API-PRD-02", "ip_address": "10.0.2.11", "location": "서울 IDC A동 3F", "extra_info": '{"os":"CentOS 8","cpu":"32 cores","ram":"128GB","role":"API Server"}', "status": "normal"},
    {"asset_type": "server", "name": "DB-PRD-01", "ip_address": "10.0.3.10", "location": "서울 IDC B동 2F", "extra_info": '{"os":"Rocky Linux 9","cpu":"64 cores","ram":"256GB","role":"Primary DB"}', "status": "normal"},
    {"asset_type": "server", "name": "DB-PRD-02", "ip_address": "10.0.3.11", "location": "서울 IDC B동 2F", "extra_info": '{"os":"Rocky Linux 9","cpu":"64 cores","ram":"256GB","role":"Replica DB"}', "status": "normal"},
    {"asset_type": "server", "name": "DB-PRD-03", "ip_address": "10.0.3.12", "location": "서울 IDC B동 2F", "extra_info": '{"os":"Rocky Linux 9","cpu":"64 cores","ram":"256GB","role":"Replica DB"}', "status": "critical"},
    {"asset_type": "server", "name": "CACHE-PRD-01", "ip_address": "10.0.4.10", "location": "서울 IDC A동 3F", "extra_info": '{"os":"Ubuntu 22.04","cpu":"8 cores","ram":"32GB","role":"Redis Cache"}', "status": "normal"},
    {"asset_type": "server", "name": "CACHE-PRD-02", "ip_address": "10.0.4.11", "location": "서울 IDC A동 3F", "extra_info": '{"os":"Ubuntu 22.04","cpu":"8 cores","ram":"32GB","role":"Redis Cache"}', "status": "normal"},
    {"asset_type": "server", "name": "KAFKA-PRD-01", "ip_address": "10.0.5.10", "location": "서울 IDC B동 3F", "extra_info": '{"os":"Ubuntu 22.04","cpu":"16 cores","ram":"64GB","role":"Kafka Broker"}', "status": "normal"},
    {"asset_type": "server", "name": "KAFKA-PRD-02", "ip_address": "10.0.5.11", "location": "서울 IDC B동 3F", "extra_info": '{"os":"Ubuntu 22.04","cpu":"16 cores","ram":"64GB","role":"Kafka Broker"}', "status": "normal"},
    {"asset_type": "server", "name": "KAFKA-PRD-03", "ip_address": "10.0.5.12", "location": "서울 IDC B동 3F", "extra_info": '{"os":"Ubuntu 22.04","cpu":"16 cores","ram":"64GB","role":"Kafka Broker"}', "status": "warning"},
    {"asset_type": "server", "name": "ES-PRD-01", "ip_address": "10.0.6.10", "location": "서울 IDC B동 3F", "extra_info": '{"os":"Ubuntu 22.04","cpu":"32 cores","ram":"128GB","role":"Elasticsearch"}', "status": "normal"},
    {"asset_type": "server", "name": "ES-PRD-02", "ip_address": "10.0.6.11", "location": "서울 IDC B동 3F", "extra_info": '{"os":"Ubuntu 22.04","cpu":"32 cores","ram":"128GB","role":"Elasticsearch"}', "status": "normal"},
    {"asset_type": "server", "name": "MON-PRD-01", "ip_address": "10.0.7.10", "location": "서울 IDC A동 2F", "extra_info": '{"os":"Ubuntu 22.04","cpu":"8 cores","ram":"32GB","role":"Monitoring"}', "status": "normal"},
    {"asset_type": "server", "name": "BATCH-PRD-01", "ip_address": "10.0.8.10", "location": "서울 IDC A동 2F", "extra_info": '{"os":"CentOS 8","cpu":"16 cores","ram":"64GB","role":"Batch Server"}', "status": "normal"},
    {"asset_type": "server", "name": "FILE-PRD-01", "ip_address": "10.0.9.10", "location": "판교 DR센터 1F", "extra_info": '{"os":"Ubuntu 22.04","cpu":"8 cores","ram":"32GB","role":"File Server"}', "status": "normal"},
    # Network Devices
    {"asset_type": "network_device", "name": "CORE-SW-01", "ip_address": "10.0.0.1", "location": "서울 IDC A동 1F", "extra_info": '{"vendor":"Cisco","model":"Nexus 9300","firmware":"10.3.2"}', "status": "normal"},
    {"asset_type": "network_device", "name": "CORE-SW-02", "ip_address": "10.0.0.2", "location": "서울 IDC B동 1F", "extra_info": '{"vendor":"Cisco","model":"Nexus 9300","firmware":"10.3.2"}', "status": "normal"},
    {"asset_type": "network_device", "name": "DIST-SW-A3", "ip_address": "10.0.0.10", "location": "서울 IDC A동 3F", "extra_info": '{"vendor":"Juniper","model":"EX4300","firmware":"21.4R3"}', "status": "normal"},
    {"asset_type": "network_device", "name": "DIST-SW-B2", "ip_address": "10.0.0.11", "location": "서울 IDC B동 2F", "extra_info": '{"vendor":"Juniper","model":"EX4300","firmware":"21.4R3"}', "status": "warning"},
    {"asset_type": "network_device", "name": "FW-EXT-01", "ip_address": "10.0.0.50", "location": "서울 IDC A동 1F", "extra_info": '{"vendor":"Palo Alto","model":"PA-5260","firmware":"11.1.2"}', "status": "normal"},
    {"asset_type": "network_device", "name": "LB-PRD-01", "ip_address": "10.0.0.60", "location": "서울 IDC A동 1F", "extra_info": '{"vendor":"F5","model":"BIG-IP i5800","firmware":"17.1.1"}', "status": "normal"},
    {"asset_type": "network_device", "name": "LB-PRD-02", "ip_address": "10.0.0.61", "location": "서울 IDC A동 1F", "extra_info": '{"vendor":"F5","model":"BIG-IP i5800","firmware":"17.1.1"}', "status": "normal"},
    # VMs
    {"asset_type": "vm", "name": "DEV-VM-01", "ip_address": "10.10.1.10", "location": "서울 IDC A동 3F", "extra_info": '{"hypervisor":"VMware","cpu":"4 cores","ram":"16GB","role":"Dev Server"}', "status": "normal"},
    {"asset_type": "vm", "name": "DEV-VM-02", "ip_address": "10.10.1.11", "location": "서울 IDC A동 3F", "extra_info": '{"hypervisor":"VMware","cpu":"4 cores","ram":"16GB","role":"Dev Server"}', "status": "normal"},
    {"asset_type": "vm", "name": "STG-VM-01", "ip_address": "10.10.2.10", "location": "서울 IDC B동 2F", "extra_info": '{"hypervisor":"VMware","cpu":"8 cores","ram":"32GB","role":"Staging"}', "status": "normal"},
    {"asset_type": "vm", "name": "CI-VM-01", "ip_address": "10.10.3.10", "location": "서울 IDC A동 2F", "extra_info": '{"hypervisor":"VMware","cpu":"8 cores","ram":"32GB","role":"CI/CD Runner"}', "status": "normal"},
    # Systems
    {"asset_type": "system", "name": "K8S-MASTER-01", "ip_address": "10.0.10.10", "location": "서울 IDC B동 3F", "extra_info": '{"type":"Kubernetes","version":"1.29.2","role":"Control Plane"}', "status": "normal"},
    {"asset_type": "system", "name": "K8S-WORKER-01", "ip_address": "10.0.10.20", "location": "서울 IDC B동 3F", "extra_info": '{"type":"Kubernetes","version":"1.29.2","role":"Worker Node"}', "status": "normal"},
    {"asset_type": "system", "name": "K8S-WORKER-02", "ip_address": "10.0.10.21", "location": "서울 IDC B동 3F", "extra_info": '{"type":"Kubernetes","version":"1.29.2","role":"Worker Node"}', "status": "normal"},
    {"asset_type": "system", "name": "K8S-WORKER-03", "ip_address": "10.0.10.22", "location": "서울 IDC B동 3F", "extra_info": '{"type":"Kubernetes","version":"1.29.2","role":"Worker Node"}', "status": "down"},
]

# ─── Profiles for realistic metrics ───
METRIC_PROFILES = {
    "WEB-PRD": {"cpu": (35, 15), "memory": (55, 10), "disk": (42, 3), "net_in": (2500, 800), "net_out": (4200, 1200)},
    "API-PRD": {"cpu": (45, 20), "memory": (62, 8), "disk": (38, 2), "net_in": (1800, 600), "net_out": (3500, 1000)},
    "DB-PRD": {"cpu": (55, 15), "memory": (78, 5), "disk": (72, 2), "net_in": (3000, 500), "net_out": (5000, 800)},
    "CACHE-PRD": {"cpu": (20, 8), "memory": (85, 3), "disk": (15, 1), "net_in": (4000, 1500), "net_out": (6000, 2000)},
    "KAFKA-PRD": {"cpu": (40, 18), "memory": (68, 6), "disk": (55, 3), "net_in": (5000, 2000), "net_out": (5500, 2000)},
    "ES-PRD": {"cpu": (50, 15), "memory": (75, 4), "disk": (65, 2), "net_in": (2000, 800), "net_out": (3000, 1000)},
    "MON-PRD": {"cpu": (25, 10), "memory": (45, 8), "disk": (30, 2), "net_in": (500, 200), "net_out": (800, 300)},
    "BATCH-PRD": {"cpu": (60, 25), "memory": (50, 15), "disk": (55, 5), "net_in": (1000, 500), "net_out": (1500, 600)},
    "FILE-PRD": {"cpu": (15, 8), "memory": (30, 5), "disk": (78, 1), "net_in": (800, 400), "net_out": (2000, 800)},
    "CORE-SW": {"cpu": (30, 10), "memory": (40, 5), "disk": (20, 1), "net_in": (8000, 3000), "net_out": (8500, 3000)},
    "DIST-SW": {"cpu": (25, 8), "memory": (35, 5), "disk": (18, 1), "net_in": (4000, 1500), "net_out": (4200, 1500)},
    "FW-EXT": {"cpu": (35, 12), "memory": (50, 5), "disk": (25, 2), "net_in": (6000, 2500), "net_out": (5800, 2500)},
    "LB-PRD": {"cpu": (30, 10), "memory": (45, 5), "disk": (20, 1), "net_in": (7000, 3000), "net_out": (7200, 3000)},
    "DEV-VM": {"cpu": (20, 15), "memory": (40, 10), "disk": (35, 5), "net_in": (300, 200), "net_out": (500, 300)},
    "STG-VM": {"cpu": (30, 12), "memory": (50, 8), "disk": (40, 3), "net_in": (600, 300), "net_out": (900, 400)},
    "CI-VM": {"cpu": (70, 25), "memory": (60, 15), "disk": (50, 5), "net_in": (400, 200), "net_out": (700, 300)},
    "K8S-MASTER": {"cpu": (25, 8), "memory": (55, 5), "disk": (30, 2), "net_in": (1200, 500), "net_out": (1500, 600)},
    "K8S-WORKER": {"cpu": (55, 20), "memory": (70, 10), "disk": (45, 3), "net_in": (2000, 800), "net_out": (2500, 1000)},
}

# Special: make "problem" servers have high metrics
PROBLEM_OVERRIDES = {
    "WEB-PRD-03": {"cpu": (82, 8), "memory": (88, 3)},
    "DB-PRD-03": {"cpu": (95, 3), "memory": (96, 2), "disk": (93, 1)},
    "KAFKA-PRD-03": {"cpu": (78, 5), "memory": (82, 3)},
    "DIST-SW-B2": {"cpu": (75, 8), "net_in": (9500, 500)},
    "K8S-WORKER-03": {"cpu": (0, 0), "memory": (0, 0), "disk": (0, 0), "net_in": (0, 0), "net_out": (0, 0)},
}

# ─── Alert Rules ───
ALERT_RULES = [
    {"name": "CPU Critical (>90%, 5min)", "metric_name": "cpu_usage", "condition": "gt", "threshold": 90.0, "duration_seconds": 300, "severity": "critical"},
    {"name": "CPU Warning (>70%, 10min)", "metric_name": "cpu_usage", "condition": "gt", "threshold": 70.0, "duration_seconds": 600, "severity": "warning"},
    {"name": "Memory Critical (>95%)", "metric_name": "memory_usage", "condition": "gt", "threshold": 95.0, "duration_seconds": 0, "severity": "critical"},
    {"name": "Memory Warning (>85%)", "metric_name": "memory_usage", "condition": "gt", "threshold": 85.0, "duration_seconds": 0, "severity": "warning"},
    {"name": "Disk Critical (>90%)", "metric_name": "disk_usage", "condition": "gt", "threshold": 90.0, "duration_seconds": 0, "severity": "critical"},
    {"name": "Disk Warning (>80%)", "metric_name": "disk_usage", "condition": "gt", "threshold": 80.0, "duration_seconds": 0, "severity": "warning"},
    {"name": "Packet Loss Warning (>5%)", "metric_name": "packet_loss", "condition": "gt", "threshold": 5.0, "duration_seconds": 60, "severity": "warning"},
    {"name": "Heartbeat Failure", "metric_name": "heartbeat", "condition": "eq", "threshold": 0.0, "duration_seconds": 30, "severity": "critical"},
]

LOG_MESSAGES = {
    "error": [
        "Connection refused to upstream server",
        "Out of memory: Kill process java (pid={pid}) score 950",
        "Disk I/O error on /dev/sdb1: Input/output error",
        "Failed to authenticate user from {ip}",
        "SSL handshake failed: certificate expired",
        "Database connection pool exhausted (max=100, active=100)",
        "Segmentation fault (core dumped)",
        "Too many open files (ulimit: 1024)",
        "RAID array degraded: disk 3 failed",
        "Kernel panic - not syncing: Fatal exception in interrupt",
    ],
    "warn": [
        "Slow query detected: {ms}ms for SELECT on orders table",
        "Certificate expires in {days} days for *.company.co.kr",
        "Disk space below 20% on /data partition",
        "Connection pool utilization at {pct}%",
        "Memory swap usage detected: {mb}MB",
        "High CPU load average: {load}",
        "Retrying failed request to payment gateway (attempt {n}/3)",
        "DNS resolution timeout for api.external-service.com",
        "NTP clock drift detected: {drift}ms",
        "Backup job exceeded expected duration by {min} minutes",
    ],
    "info": [
        "Application deployed successfully: v2.4.{ver}",
        "Scheduled maintenance completed for {svc} service",
        "New SSL certificate installed, expires 2027-01-15",
        "User admin logged in from {ip}",
        "Config reload completed: {n} rules updated",
        "Health check passed for all {n} upstream servers",
        "Log rotation completed: archived {n} files",
        "Database backup completed: {gb}GB in {min}m",
        "Service {svc} restarted successfully",
        "Cron job batch-report completed in {sec}s",
    ],
}

now = datetime.now(timezone.utc)


def get_profile(name: str) -> dict:
    for prefix, profile in METRIC_PROFILES.items():
        if name.startswith(prefix):
            result = dict(profile)
            if name in PROBLEM_OVERRIDES:
                result.update(PROBLEM_OVERRIDES[name])
            return result
    return {"cpu": (30, 10), "memory": (50, 10), "disk": (40, 5), "net_in": (1000, 500), "net_out": (1500, 500)}


def clamp(v: float, lo: float = 0.0, hi: float = 100.0) -> float:
    return max(lo, min(hi, v))


async def seed(skip_create_tables: bool = False):
    if not skip_create_tables:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
            await conn.run_sync(Base.metadata.create_all)
        async with timescale_engine.begin() as conn:
            await conn.run_sync(TimescaleBase.metadata.drop_all)
            await conn.run_sync(TimescaleBase.metadata.create_all)

    async with AsyncSessionLocal() as db:
        # Users
        admin = User(username="admin", email="admin@insite.local", hashed_password=hash_password("admin123"), role="admin")
        operator = User(username="operator", email="operator@insite.local", hashed_password=hash_password("oper123"), role="operator")
        viewer = User(username="viewer", email="viewer@insite.local", hashed_password=hash_password("view123"), role="viewer")
        db.add_all([admin, operator, viewer])

        # Assets
        asset_ids = {}
        for idx, a in enumerate(ASSETS):
            mac = f"00:1A:2B:{idx:02X}:{random.randint(0,255):02X}:{random.randint(0,255):02X}"
            asset = Asset(
                id=uuid.uuid4(),
                asset_type=a["asset_type"],
                name=a["name"],
                ip_address=a["ip_address"],
                mac_address=mac,
                location=a["location"],
                status="down" if a["status"] == "critical" else a["status"],
                last_heartbeat=now - timedelta(seconds=random.randint(5, 60)) if a["status"] != "critical" else now - timedelta(hours=2),
                extra_info=json.loads(a.get("extra_info", "null")),
            )
            db.add(asset)
            asset_ids[a["name"]] = asset.id

        # Alert Rules
        rule_ids = {}
        for r in ALERT_RULES:
            rule = AlertRule(id=uuid.uuid4(), **r, enabled=True)
            db.add(rule)
            rule_ids[r["name"]] = rule.id

        # Alerts — create realistic active alerts
        alerts_data = [
            {"asset": "DB-PRD-03", "rule": "CPU Critical (>90%, 5min)", "severity": "critical", "title": "DB-PRD-03 CPU 사용률 95% 초과", "message": "Primary DB 서버의 CPU 사용률이 95%를 초과했습니다. 즉시 확인이 필요합니다.", "status": "firing", "ago_min": 45},
            {"asset": "DB-PRD-03", "rule": "Memory Critical (>95%)", "severity": "critical", "title": "DB-PRD-03 메모리 96% 사용", "message": "메모리 사용률이 96%에 도달했습니다. OOM 위험이 있습니다.", "status": "firing", "ago_min": 40},
            {"asset": "DB-PRD-03", "rule": "Disk Critical (>90%)", "severity": "critical", "title": "DB-PRD-03 디스크 93% 사용", "message": "디스크 /data 파티션 사용률이 93%입니다. 긴급 정리가 필요합니다.", "status": "firing", "ago_min": 120},
            {"asset": "K8S-WORKER-03", "rule": "Heartbeat Failure", "severity": "critical", "title": "K8S-WORKER-03 응답 없음", "message": "Kubernetes Worker Node 03이 2시간 전부터 응답하지 않습니다.", "status": "firing", "ago_min": 130},
            {"asset": "WEB-PRD-03", "rule": "CPU Warning (>70%, 10min)", "severity": "warning", "title": "WEB-PRD-03 CPU 82% 사용", "message": "Web Server 03의 CPU 사용률이 높습니다. 트래픽 분산을 확인하세요.", "status": "firing", "ago_min": 25},
            {"asset": "WEB-PRD-03", "rule": "Memory Warning (>85%)", "severity": "warning", "title": "WEB-PRD-03 메모리 88% 사용", "message": "메모리 사용률이 88%입니다. 메모리 릭 여부를 확인하세요.", "status": "acknowledged", "ago_min": 30},
            {"asset": "KAFKA-PRD-03", "rule": "CPU Warning (>70%, 10min)", "severity": "warning", "title": "KAFKA-PRD-03 CPU 78% 사용", "message": "Kafka Broker 03의 CPU가 높습니다. Consumer lag을 확인하세요.", "status": "firing", "ago_min": 15},
            {"asset": "KAFKA-PRD-03", "rule": "Memory Warning (>85%)", "severity": "warning", "title": "KAFKA-PRD-03 힙 메모리 부족", "message": "JVM 힙 메모리 사용률 82%. GC 튜닝이 필요합니다.", "status": "firing", "ago_min": 10},
            {"asset": "DIST-SW-B2", "rule": "CPU Warning (>70%, 10min)", "severity": "warning", "title": "DIST-SW-B2 트래픽 과부하", "message": "분배 스위치 B2의 포트 트래픽이 임계치를 초과했습니다.", "status": "firing", "ago_min": 8},
            # Resolved alerts
            {"asset": "API-PRD-01", "rule": "CPU Warning (>70%, 10min)", "severity": "warning", "title": "API-PRD-01 CPU 일시적 급증", "message": "배치 처리로 인한 일시적 CPU 급증. 자동 해소됨.", "status": "resolved", "ago_min": 180},
            {"asset": "ES-PRD-01", "rule": "Disk Warning (>80%)", "severity": "warning", "title": "ES-PRD-01 인덱스 정리 필요", "message": "오래된 인덱스 정리 후 디스크 사용률 정상화.", "status": "resolved", "ago_min": 360},
            {"asset": "DB-PRD-01", "rule": "Memory Warning (>85%)", "severity": "warning", "title": "DB-PRD-01 커넥션 풀 과다", "message": "비활성 커넥션 정리 후 메모리 사용률 정상화.", "status": "resolved", "ago_min": 720},
        ]
        for ad in alerts_data:
            alert = Alert(
                id=uuid.uuid4(),
                asset_id=asset_ids[ad["asset"]],
                rule_id=rule_ids[ad["rule"]],
                severity=ad["severity"],
                title=ad["title"],
                message=ad["message"],
                status=ad["status"],
                fired_at=now - timedelta(minutes=ad["ago_min"]),
                acknowledged_at=(now - timedelta(minutes=ad["ago_min"] - 5)) if ad["status"] == "acknowledged" else None,
                acknowledged_by="operator" if ad["status"] == "acknowledged" else None,
                resolved_at=(now - timedelta(minutes=ad["ago_min"] - 30)) if ad["status"] == "resolved" else None,
                notification_sent=True,
            )
            db.add(alert)

        # Logs — generate 200 realistic log entries
        for _ in range(200):
            level = random.choices(["info", "warn", "error", "debug"], weights=[50, 25, 15, 10])[0]
            source = random.choice(["syslog", "application", "security"])
            asset_name = random.choice(list(asset_ids.keys()))
            timestamp = now - timedelta(minutes=random.randint(1, 1440))

            if level in LOG_MESSAGES:
                msg_template = random.choice(LOG_MESSAGES[level])
                msg = msg_template.format(
                    pid=random.randint(1000, 65000),
                    ip=f"10.{random.randint(0,10)}.{random.randint(1,255)}.{random.randint(1,255)}",
                    ms=random.randint(500, 15000),
                    days=random.randint(3, 30),
                    pct=random.randint(80, 98),
                    mb=random.randint(100, 4000),
                    load=f"{random.uniform(4.0, 16.0):.1f}",
                    n=random.randint(1, 20),
                    drift=random.randint(50, 500),
                    min=random.randint(5, 60),
                    ver=random.randint(100, 350),
                    svc=random.choice(["auth", "payment", "order", "notification", "search"]),
                    gb=random.randint(5, 200),
                    sec=random.randint(10, 300),
                )
            else:
                msg = f"System heartbeat OK from {asset_name}"

            log = LogEntry(
                id=uuid.uuid4(),
                asset_id=asset_ids[asset_name],
                timestamp=timestamp,
                source=source,
                level=level,
                message=msg,
            )
            db.add(log)

        await db.commit()
        print(f"  Seeded {len(ASSETS)} assets, {len(ALERT_RULES)} rules, {len(alerts_data)} alerts, 200 logs, 3 users")

    # Metrics — 24 hours of data, every 5 minutes = 288 data points per asset per metric
    from app.database import TimescaleSessionLocal
    async with TimescaleSessionLocal() as db:
        total_metrics = 0
        for asset_data in ASSETS:
            aid = asset_ids[asset_data["name"]]
            profile = get_profile(asset_data["name"])
            is_down = asset_data["name"] == "K8S-WORKER-03"

            for i in range(288):  # 24 hours, 5min intervals
                t = now - timedelta(minutes=(287 - i) * 5)

                # Add time-of-day pattern (higher during business hours)
                hour = (t.hour + 9) % 24  # KST offset
                business_factor = 1.0 + 0.3 * max(0, 1 - abs(hour - 14) / 6)

                if is_down and i > 264:  # down for last 2 hours
                    metrics_to_add = [
                        Metric(time=t, asset_id=aid, metric_name="cpu_usage", value=0, unit="%"),
                        Metric(time=t, asset_id=aid, metric_name="memory_usage", value=0, unit="%"),
                        Metric(time=t, asset_id=aid, metric_name="disk_usage", value=0, unit="%"),
                        Metric(time=t, asset_id=aid, metric_name="network_in", value=0, unit="Kbps"),
                        Metric(time=t, asset_id=aid, metric_name="network_out", value=0, unit="Kbps"),
                    ]
                else:
                    cpu_mean, cpu_std = profile["cpu"]
                    mem_mean, mem_std = profile["memory"]
                    disk_mean, disk_std = profile["disk"]
                    net_in_mean, net_in_std = profile["net_in"]
                    net_out_mean, net_out_std = profile["net_out"]

                    metrics_to_add = [
                        Metric(time=t, asset_id=aid, metric_name="cpu_usage", value=round(clamp(random.gauss(cpu_mean * business_factor, cpu_std)), 1), unit="%"),
                        Metric(time=t, asset_id=aid, metric_name="memory_usage", value=round(clamp(random.gauss(mem_mean, mem_std)), 1), unit="%"),
                        Metric(time=t, asset_id=aid, metric_name="disk_usage", value=round(clamp(random.gauss(disk_mean + i * 0.01, disk_std)), 1), unit="%"),
                        Metric(time=t, asset_id=aid, metric_name="network_in", value=round(max(0, random.gauss(net_in_mean * business_factor, net_in_std))), unit="Kbps"),
                        Metric(time=t, asset_id=aid, metric_name="network_out", value=round(max(0, random.gauss(net_out_mean * business_factor, net_out_std))), unit="Kbps"),
                    ]

                for m in metrics_to_add:
                    db.add(m)
                total_metrics += len(metrics_to_add)

            # Commit per asset to avoid huge transaction
            await db.commit()

        print(f"  Seeded {total_metrics} metric data points (24h, 5min intervals)")

    print("Seed completed!")


if __name__ == "__main__":
    asyncio.run(seed())
