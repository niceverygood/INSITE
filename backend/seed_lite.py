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
    {"asset_type": "server", "name": "WEB-PRD-01", "ip": "10.0.1.10", "loc": "서울 IDC A동 3F", "status": "normal"},
    {"asset_type": "server", "name": "WEB-PRD-02", "ip": "10.0.1.11", "loc": "서울 IDC A동 3F", "status": "normal"},
    {"asset_type": "server", "name": "WEB-PRD-03", "ip": "10.0.1.12", "loc": "서울 IDC A동 3F", "status": "warning"},
    {"asset_type": "server", "name": "API-PRD-01", "ip": "10.0.2.10", "loc": "서울 IDC A동 3F", "status": "normal"},
    {"asset_type": "server", "name": "API-PRD-02", "ip": "10.0.2.11", "loc": "서울 IDC A동 3F", "status": "normal"},
    {"asset_type": "server", "name": "DB-PRD-01", "ip": "10.0.3.10", "loc": "서울 IDC B동 2F", "status": "normal"},
    {"asset_type": "server", "name": "DB-PRD-02", "ip": "10.0.3.11", "loc": "서울 IDC B동 2F", "status": "normal"},
    {"asset_type": "server", "name": "DB-PRD-03", "ip": "10.0.3.12", "loc": "서울 IDC B동 2F", "status": "down"},
    {"asset_type": "server", "name": "CACHE-PRD-01", "ip": "10.0.4.10", "loc": "서울 IDC A동 3F", "status": "normal"},
    {"asset_type": "server", "name": "KAFKA-PRD-01", "ip": "10.0.5.10", "loc": "서울 IDC B동 3F", "status": "normal"},
    {"asset_type": "server", "name": "KAFKA-PRD-03", "ip": "10.0.5.12", "loc": "서울 IDC B동 3F", "status": "warning"},
    {"asset_type": "server", "name": "ES-PRD-01", "ip": "10.0.6.10", "loc": "서울 IDC B동 3F", "status": "normal"},
    {"asset_type": "network_device", "name": "CORE-SW-01", "ip": "10.0.0.1", "loc": "서울 IDC A동 1F", "status": "normal"},
    {"asset_type": "network_device", "name": "CORE-SW-02", "ip": "10.0.0.2", "loc": "서울 IDC B동 1F", "status": "normal"},
    {"asset_type": "network_device", "name": "DIST-SW-B2", "ip": "10.0.0.11", "loc": "서울 IDC B동 2F", "status": "warning"},
    {"asset_type": "network_device", "name": "FW-EXT-01", "ip": "10.0.0.50", "loc": "서울 IDC A동 1F", "status": "normal"},
    {"asset_type": "network_device", "name": "LB-PRD-01", "ip": "10.0.0.60", "loc": "서울 IDC A동 1F", "status": "normal"},
    {"asset_type": "vm", "name": "DEV-VM-01", "ip": "10.10.1.10", "loc": "서울 IDC A동 3F", "status": "normal"},
    {"asset_type": "system", "name": "K8S-MASTER-01", "ip": "10.0.10.10", "loc": "서울 IDC B동 3F", "status": "normal"},
    {"asset_type": "system", "name": "K8S-WORKER-01", "ip": "10.0.10.20", "loc": "서울 IDC B동 3F", "status": "normal"},
    {"asset_type": "system", "name": "K8S-WORKER-03", "ip": "10.0.10.22", "loc": "서울 IDC B동 3F", "status": "down"},
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
                          ip_address=a["ip"], location=a["loc"], status=a["status"],
                          last_heartbeat=now - timedelta(seconds=random.randint(5, 60)) if a["status"] != "down" else now - timedelta(hours=2))
            db.add(asset)
            asset_ids[a["name"]] = asset.id

        # Alert rules
        rules = [
            {"name": "CPU Critical", "metric_name": "cpu_usage", "condition": "gt", "threshold": 90.0, "duration_seconds": 300, "severity": "critical"},
            {"name": "Memory Critical", "metric_name": "memory_usage", "condition": "gt", "threshold": 95.0, "duration_seconds": 0, "severity": "critical"},
            {"name": "Disk Critical", "metric_name": "disk_usage", "condition": "gt", "threshold": 90.0, "duration_seconds": 0, "severity": "critical"},
            {"name": "CPU Warning", "metric_name": "cpu_usage", "condition": "gt", "threshold": 70.0, "duration_seconds": 600, "severity": "warning"},
            {"name": "Heartbeat Fail", "metric_name": "heartbeat", "condition": "eq", "threshold": 0.0, "duration_seconds": 30, "severity": "critical"},
        ]
        rule_ids = {}
        for r in rules:
            rule = AlertRule(id=uuid.uuid4(), **r, enabled=True)
            db.add(rule)
            rule_ids[r["name"]] = rule.id

        # Alerts
        alerts = [
            {"asset": "DB-PRD-03", "rule": "CPU Critical", "sev": "critical", "title": "DB-PRD-03 CPU 95% 초과", "msg": "CPU 사용률이 95%를 초과했습니다.", "status": "firing", "ago": 45},
            {"asset": "DB-PRD-03", "rule": "Memory Critical", "sev": "critical", "title": "DB-PRD-03 메모리 96%", "msg": "메모리 사용률 96%. OOM 위험.", "status": "firing", "ago": 40},
            {"asset": "DB-PRD-03", "rule": "Disk Critical", "sev": "critical", "title": "DB-PRD-03 디스크 93%", "msg": "디스크 /data 93%. 긴급 정리 필요.", "status": "firing", "ago": 120},
            {"asset": "K8S-WORKER-03", "rule": "Heartbeat Fail", "sev": "critical", "title": "K8S-WORKER-03 응답 없음", "msg": "워커 노드 2시간 전부터 응답 없음.", "status": "firing", "ago": 130},
            {"asset": "WEB-PRD-03", "rule": "CPU Warning", "sev": "warning", "title": "WEB-PRD-03 CPU 82%", "msg": "CPU 사용률 높음. 트래픽 분산 확인.", "status": "firing", "ago": 25},
            {"asset": "KAFKA-PRD-03", "rule": "CPU Warning", "sev": "warning", "title": "KAFKA-PRD-03 CPU 78%", "msg": "Consumer lag 확인 필요.", "status": "firing", "ago": 15},
            {"asset": "DIST-SW-B2", "rule": "CPU Warning", "sev": "warning", "title": "DIST-SW-B2 트래픽 과부하", "msg": "포트 트래픽 임계치 초과.", "status": "firing", "ago": 8},
        ]
        for ad in alerts:
            db.add(Alert(id=uuid.uuid4(), asset_id=asset_ids[ad["asset"]], rule_id=rule_ids[ad["rule"]],
                         severity=ad["sev"], title=ad["title"], message=ad["msg"], status=ad["status"],
                         fired_at=now - timedelta(minutes=ad["ago"]), notification_sent=True))

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

    # Metrics — only 2 hours, 5-min intervals = 24 points per asset (lightweight)
    async with TimescaleSessionLocal() as db:
        for a in ASSETS:
            aid = asset_ids[a["name"]]
            prefix = a["name"].split("-")[0]
            cpu_base, mem_base, disk_base = OVERRIDES.get(a["name"], PROFILES.get(prefix, (30, 50, 40)))

            for i in range(24):
                t = now - timedelta(minutes=(23 - i) * 5)
                is_down = a["name"] == "K8S-WORKER-03" and i > 20
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
