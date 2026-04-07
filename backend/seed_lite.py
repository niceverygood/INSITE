"""Lightweight seed for Vercel cold start — minimal data, fast execution."""
import uuid
import random
from datetime import datetime, timedelta, timezone

from app.database import AsyncSessionLocal, TimescaleSessionLocal
from app.models.asset import Asset
from app.models.metric import Metric
from app.models.alert import Alert, AlertRule
from app.models.log_entry import LogEntry
from app.models.user import User
from app.core.security import hash_password

now = datetime.now(timezone.utc)

ASSETS = [
    # Servers
    {"asset_type": "server", "name": "WEB-PRD-01", "ip": "10.0.1.10", "mac": "00:1A:2B:3C:01:10", "loc": "서울 IDC A동 3F", "status": "normal",
     "extra": {"os": "Ubuntu 22.04", "cpu": "16 cores", "ram": "64GB", "role": "Web Server"}},
    {"asset_type": "server", "name": "WEB-PRD-02", "ip": "10.0.1.11", "mac": "00:1A:2B:3C:01:11", "loc": "서울 IDC A동 3F", "status": "normal",
     "extra": {"os": "Ubuntu 22.04", "cpu": "16 cores", "ram": "64GB", "role": "Web Server"}},
    {"asset_type": "server", "name": "WEB-PRD-03", "ip": "10.0.1.12", "mac": "00:1A:2B:3C:01:12", "loc": "서울 IDC A동 3F", "status": "warning",
     "extra": {"os": "Ubuntu 22.04", "cpu": "16 cores", "ram": "64GB", "role": "Web Server"}},
    {"asset_type": "server", "name": "API-PRD-01", "ip": "10.0.2.10", "mac": "00:1A:2B:3C:02:10", "loc": "서울 IDC A동 3F", "status": "normal",
     "extra": {"os": "CentOS 8", "cpu": "32 cores", "ram": "128GB", "role": "API Server"}},
    {"asset_type": "server", "name": "API-PRD-02", "ip": "10.0.2.11", "mac": "00:1A:2B:3C:02:11", "loc": "서울 IDC A동 3F", "status": "normal",
     "extra": {"os": "CentOS 8", "cpu": "32 cores", "ram": "128GB", "role": "API Server"}},
    {"asset_type": "server", "name": "DB-PRD-01", "ip": "10.0.3.10", "mac": "00:1A:2B:3C:03:10", "loc": "서울 IDC B동 2F", "status": "normal",
     "extra": {"os": "Rocky Linux 9", "cpu": "64 cores", "ram": "256GB", "role": "Primary DB"}},
    {"asset_type": "server", "name": "DB-PRD-02", "ip": "10.0.3.11", "mac": "00:1A:2B:3C:03:11", "loc": "서울 IDC B동 2F", "status": "normal",
     "extra": {"os": "Rocky Linux 9", "cpu": "64 cores", "ram": "256GB", "role": "Replica DB"}},
    {"asset_type": "server", "name": "DB-PRD-03", "ip": "10.0.3.12", "mac": "00:1A:2B:3C:03:12", "loc": "서울 IDC B동 2F", "status": "down",
     "extra": {"os": "Rocky Linux 9", "cpu": "64 cores", "ram": "256GB", "role": "Replica DB"}},
    {"asset_type": "server", "name": "CACHE-PRD-01", "ip": "10.0.4.10", "mac": "00:1A:2B:3C:04:10", "loc": "서울 IDC A동 3F", "status": "normal",
     "extra": {"os": "Ubuntu 22.04", "cpu": "8 cores", "ram": "32GB", "role": "Redis Cache"}},
    {"asset_type": "server", "name": "KAFKA-PRD-01", "ip": "10.0.5.10", "mac": "00:1A:2B:3C:05:10", "loc": "서울 IDC B동 3F", "status": "normal",
     "extra": {"os": "Ubuntu 22.04", "cpu": "16 cores", "ram": "64GB", "role": "Kafka Broker"}},
    {"asset_type": "server", "name": "KAFKA-PRD-03", "ip": "10.0.5.12", "mac": "00:1A:2B:3C:05:12", "loc": "서울 IDC B동 3F", "status": "warning",
     "extra": {"os": "Ubuntu 22.04", "cpu": "16 cores", "ram": "64GB", "role": "Kafka Broker"}},
    {"asset_type": "server", "name": "ES-PRD-01", "ip": "10.0.6.10", "mac": "00:1A:2B:3C:06:10", "loc": "서울 IDC B동 3F", "status": "normal",
     "extra": {"os": "Ubuntu 22.04", "cpu": "32 cores", "ram": "128GB", "role": "Elasticsearch"}},
    # Network Devices
    {"asset_type": "network_device", "name": "CORE-SW-01", "ip": "10.0.0.1", "mac": "00:1A:2B:AA:00:01", "loc": "서울 IDC A동 1F", "status": "normal",
     "extra": {"vendor": "Cisco", "model": "Nexus 9300", "firmware": "10.3.2"}},
    {"asset_type": "network_device", "name": "CORE-SW-02", "ip": "10.0.0.2", "mac": "00:1A:2B:AA:00:02", "loc": "서울 IDC B동 1F", "status": "normal",
     "extra": {"vendor": "Cisco", "model": "Nexus 9300", "firmware": "10.3.2"}},
    {"asset_type": "network_device", "name": "DIST-SW-B2", "ip": "10.0.0.11", "mac": "00:1A:2B:BB:00:11", "loc": "서울 IDC B동 2F", "status": "warning",
     "extra": {"vendor": "Juniper", "model": "EX4300", "firmware": "21.4R3"}},
    {"asset_type": "network_device", "name": "FW-EXT-01", "ip": "10.0.0.50", "mac": "00:1A:2B:CC:00:50", "loc": "서울 IDC A동 1F", "status": "normal",
     "extra": {"vendor": "Palo Alto", "model": "PA-5260", "firmware": "11.1.2"}},
    {"asset_type": "network_device", "name": "LB-PRD-01", "ip": "10.0.0.60", "mac": "00:1A:2B:DD:00:60", "loc": "서울 IDC A동 1F", "status": "normal",
     "extra": {"vendor": "F5", "model": "BIG-IP i5800", "firmware": "17.1.1"}},
    # VMs
    {"asset_type": "vm", "name": "DEV-VM-01", "ip": "10.10.1.10", "mac": "00:50:56:A1:01:10", "loc": "서울 IDC A동 3F", "status": "normal",
     "extra": {"hypervisor": "VMware", "cpu": "4 cores", "ram": "16GB", "role": "Dev Server"}},
    # Systems
    {"asset_type": "system", "name": "K8S-MASTER-01", "ip": "10.0.10.10", "mac": "00:1A:2B:EE:10:10", "loc": "서울 IDC B동 3F", "status": "normal",
     "extra": {"type": "Kubernetes", "version": "1.29.2", "role": "Control Plane"}},
    {"asset_type": "system", "name": "K8S-WORKER-01", "ip": "10.0.10.20", "mac": "00:1A:2B:EE:10:20", "loc": "서울 IDC B동 3F", "status": "normal",
     "extra": {"type": "Kubernetes", "version": "1.29.2", "role": "Worker Node"}},
    {"asset_type": "system", "name": "K8S-WORKER-03", "ip": "10.0.10.22", "mac": "00:1A:2B:EE:10:22", "loc": "서울 IDC B동 3F", "status": "down",
     "extra": {"type": "Kubernetes", "version": "1.29.2", "role": "Worker Node"}},
]

PROFILES = {
    "WEB": (35, 55, 42), "API": (45, 62, 38), "DB": (55, 78, 72),
    "CACHE": (20, 85, 15), "KAFKA": (40, 68, 55), "ES": (50, 75, 65),
    "CORE": (30, 40, 20), "DIST": (25, 35, 18), "FW": (35, 50, 25),
    "LB": (30, 45, 20), "DEV": (20, 40, 35), "K8S": (45, 65, 40),
}
OVERRIDES = {
    "WEB-PRD-03": (82, 88, 42), "DB-PRD-03": (95, 96, 93),
    "KAFKA-PRD-03": (78, 82, 55), "DIST-SW-B2": (75, 35, 18),
    "K8S-WORKER-03": (0, 0, 0),
}


def clamp(v, lo=0.0, hi=100.0):
    return max(lo, min(hi, v))


async def seed_lite():
    async with AsyncSessionLocal() as db:
        # Users
        db.add_all([
            User(username="admin", email="admin@insite.local", hashed_password=hash_password("admin123"), role="admin"),
            User(username="operator", email="operator@insite.local", hashed_password=hash_password("oper123"), role="operator"),
            User(username="viewer", email="viewer@insite.local", hashed_password=hash_password("view123"), role="viewer"),
        ])

        # Assets
        asset_ids = {}
        for a in ASSETS:
            asset = Asset(id=uuid.uuid4(), asset_type=a["asset_type"], name=a["name"],
                          ip_address=a["ip"], mac_address=a.get("mac"),
                          location=a["loc"], status=a["status"],
                          extra_info=a.get("extra"),
                          last_heartbeat=now - timedelta(seconds=random.randint(5, 60)) if a["status"] != "down" else now - timedelta(hours=2))
            db.add(asset)
            asset_ids[a["name"]] = asset.id

        # Alert rules
        rules = [
            {"name": "CPU Critical (>90%, 5min)", "metric_name": "cpu_usage", "condition": "gt", "threshold": 90.0, "duration_seconds": 300, "severity": "critical"},
            {"name": "CPU Warning (>70%, 10min)", "metric_name": "cpu_usage", "condition": "gt", "threshold": 70.0, "duration_seconds": 600, "severity": "warning"},
            {"name": "Memory Critical (>95%)", "metric_name": "memory_usage", "condition": "gt", "threshold": 95.0, "duration_seconds": 0, "severity": "critical"},
            {"name": "Memory Warning (>85%)", "metric_name": "memory_usage", "condition": "gt", "threshold": 85.0, "duration_seconds": 0, "severity": "warning"},
            {"name": "Disk Critical (>90%)", "metric_name": "disk_usage", "condition": "gt", "threshold": 90.0, "duration_seconds": 0, "severity": "critical"},
            {"name": "Disk Warning (>80%)", "metric_name": "disk_usage", "condition": "gt", "threshold": 80.0, "duration_seconds": 0, "severity": "warning"},
            {"name": "Packet Loss (>5%)", "metric_name": "packet_loss", "condition": "gt", "threshold": 5.0, "duration_seconds": 60, "severity": "warning"},
            {"name": "Heartbeat Failure", "metric_name": "heartbeat", "condition": "eq", "threshold": 0.0, "duration_seconds": 30, "severity": "critical"},
        ]
        rule_ids = {}
        for r in rules:
            rule = AlertRule(id=uuid.uuid4(), **r, enabled=True)
            db.add(rule)
            rule_ids[r["name"]] = rule.id

        # Alerts — mix of firing, acknowledged, resolved for realistic view
        alerts = [
            # Active critical alerts
            {"asset": "DB-PRD-03", "rule": "CPU Critical (>90%, 5min)", "sev": "critical",
             "title": "DB-PRD-03 CPU 95% 초과", "msg": "CPU 사용률이 95%를 5분 이상 초과했습니다. 즉시 확인 필요.",
             "status": "firing", "ago": 45},
            {"asset": "DB-PRD-03", "rule": "Memory Critical (>95%)", "sev": "critical",
             "title": "DB-PRD-03 메모리 96%", "msg": "메모리 사용률 96%. OOM 위험. 프로세스 정리 또는 증설 필요.",
             "status": "firing", "ago": 40},
            {"asset": "DB-PRD-03", "rule": "Disk Critical (>90%)", "sev": "critical",
             "title": "DB-PRD-03 디스크 93%", "msg": "디스크 /data 93%. 긴급 정리 필요. 예상 포화 시간: 6시간.",
             "status": "firing", "ago": 120},
            {"asset": "K8S-WORKER-03", "rule": "Heartbeat Failure", "sev": "critical",
             "title": "K8S-WORKER-03 응답 없음", "msg": "워커 노드 2시간 전부터 Heartbeat 응답 없음. 노드 상태 확인 필요.",
             "status": "firing", "ago": 130},
            # Active warnings
            {"asset": "WEB-PRD-03", "rule": "CPU Warning (>70%, 10min)", "sev": "warning",
             "title": "WEB-PRD-03 CPU 82%", "msg": "CPU 사용률 높음. 트래픽 분산 또는 스케일아웃 확인.",
             "status": "firing", "ago": 25},
            {"asset": "KAFKA-PRD-03", "rule": "CPU Warning (>70%, 10min)", "sev": "warning",
             "title": "KAFKA-PRD-03 CPU 78%", "msg": "Consumer lag 증가 추세. 파티션 리밸런싱 확인 필요.",
             "status": "firing", "ago": 15},
            {"asset": "DIST-SW-B2", "rule": "Packet Loss (>5%)", "sev": "warning",
             "title": "DIST-SW-B2 트래픽 과부하", "msg": "포트 Gi0/24 트래픽 임계치 초과. 패킷 로스 7.2%.",
             "status": "firing", "ago": 8},
            {"asset": "CACHE-PRD-01", "rule": "Memory Warning (>85%)", "sev": "warning",
             "title": "CACHE-PRD-01 메모리 87%", "msg": "Redis 메모리 사용 87%. maxmemory 정책 확인.",
             "status": "firing", "ago": 55},
            # Acknowledged alerts
            {"asset": "ES-PRD-01", "rule": "Disk Warning (>80%)", "sev": "warning",
             "title": "ES-PRD-01 디스크 83%", "msg": "Elasticsearch 인덱스 정리 작업 예정.",
             "status": "acknowledged", "ago": 180},
            {"asset": "WEB-PRD-02", "rule": "CPU Warning (>70%, 10min)", "sev": "warning",
             "title": "WEB-PRD-02 CPU 간헐적 75%", "msg": "배치 작업 시간대 일시적 증가. 모니터링 중.",
             "status": "acknowledged", "ago": 95},
            # Resolved alerts
            {"asset": "API-PRD-01", "rule": "CPU Critical (>90%, 5min)", "sev": "critical",
             "title": "API-PRD-01 CPU 92% 스파이크", "msg": "대량 API 요청으로 인한 일시적 CPU 급증. 오토스케일 대응 완료.",
             "status": "resolved", "ago": 360},
            {"asset": "DB-PRD-01", "rule": "Memory Warning (>85%)", "sev": "warning",
             "title": "DB-PRD-01 메모리 88%", "msg": "쿼리 캐시 정리 후 정상화.",
             "status": "resolved", "ago": 480},
            {"asset": "CORE-SW-01", "rule": "Packet Loss (>5%)", "sev": "warning",
             "title": "CORE-SW-01 패킷 로스 6%", "msg": "포트 플랩 감지. 케이블 교체 후 정상.",
             "status": "resolved", "ago": 720},
        ]
        for ad in alerts:
            alert = Alert(id=uuid.uuid4(), asset_id=asset_ids[ad["asset"]], rule_id=rule_ids[ad["rule"]],
                          severity=ad["sev"], title=ad["title"], message=ad["msg"], status=ad["status"],
                          fired_at=now - timedelta(minutes=ad["ago"]), notification_sent=True)
            if ad["status"] == "acknowledged":
                alert.acknowledged_at = now - timedelta(minutes=ad["ago"] - 10)
                alert.acknowledged_by = "operator"
            elif ad["status"] == "resolved":
                alert.acknowledged_at = now - timedelta(minutes=ad["ago"] - 5)
                alert.acknowledged_by = "operator"
                alert.resolved_at = now - timedelta(minutes=ad["ago"] - 30)
            db.add(alert)

        # Logs (30 entries — lightweight)
        log_msgs = [
            ("error", "Connection refused to upstream server"), ("error", "Database connection pool exhausted"),
            ("error", "SSL handshake failed: certificate expired"), ("error", "Out of memory: Kill process java"),
            ("warn", "Slow query detected: 8500ms"), ("warn", "Certificate expires in 7 days"),
            ("warn", "Disk space below 20%"), ("warn", "Memory swap usage: 2GB"),
            ("info", "Application deployed: v2.4.321"), ("info", "Health check passed"),
            ("info", "Database backup completed: 45GB"), ("info", "Service auth restarted"),
            ("debug", "System heartbeat OK"),
        ]
        names = list(asset_ids.keys())
        for i in range(30):
            level, msg = random.choice(log_msgs)
            db.add(LogEntry(id=uuid.uuid4(), asset_id=asset_ids[random.choice(names)],
                            timestamp=now - timedelta(minutes=random.randint(1, 1440)),
                            source=random.choice(["syslog", "application", "security"]), level=level, message=msg))

        await db.commit()

    # Metrics — 1 hour, 5-min intervals = 12 points per asset (very lightweight)
    async with TimescaleSessionLocal() as db:
        for a in ASSETS:
            aid = asset_ids[a["name"]]
            prefix = a["name"].split("-")[0]
            cpu_base, mem_base, disk_base = OVERRIDES.get(a["name"], PROFILES.get(prefix, (30, 50, 40)))

            for i in range(12):
                t = now - timedelta(minutes=(11 - i) * 5)
                is_down = a["name"] == "K8S-WORKER-03" and i > 10
                db.add(Metric(time=t, asset_id=aid, metric_name="cpu_usage",
                              value=0 if is_down else round(clamp(random.gauss(cpu_base, 5)), 1), unit="%"))
                db.add(Metric(time=t, asset_id=aid, metric_name="memory_usage",
                              value=0 if is_down else round(clamp(random.gauss(mem_base, 3)), 1), unit="%"))
                db.add(Metric(time=t, asset_id=aid, metric_name="disk_usage",
                              value=0 if is_down else round(clamp(random.gauss(disk_base, 2)), 1), unit="%"))
                db.add(Metric(time=t, asset_id=aid, metric_name="network_in",
                              value=0 if is_down else round(max(0, random.gauss(2000, 800))), unit="Kbps"))
                db.add(Metric(time=t, asset_id=aid, metric_name="network_out",
                              value=0 if is_down else round(max(0, random.gauss(3000, 1000))), unit="Kbps"))
        await db.commit()
