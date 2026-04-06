"""Alert Engine — consumes metrics from Kafka and evaluates alert rules."""

import asyncio
import json
import logging
import uuid
from datetime import datetime, timezone

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class AlertEngine:
    def __init__(self, db_session_factory=None, redis_client=None, kafka_producer=None):
        self.db_session_factory = db_session_factory
        self.redis = redis_client
        self.kafka_producer = kafka_producer
        self.rules: list[dict] = []
        self.running = False

    async def load_rules(self):
        """Load active alert rules from database."""
        if not self.db_session_factory:
            return
        async with self.db_session_factory() as session:
            from sqlalchemy import select
            from app.models.alert import AlertRule
            result = await session.execute(select(AlertRule).where(AlertRule.enabled == True))
            self.rules = [
                {
                    "id": str(r.id),
                    "name": r.name,
                    "metric_name": r.metric_name,
                    "condition": r.condition.value,
                    "threshold": r.threshold,
                    "duration_seconds": r.duration_seconds,
                    "severity": r.severity.value,
                    "asset_filter": r.asset_filter,
                }
                for r in result.scalars().all()
            ]
        logger.info(f"Loaded {len(self.rules)} alert rules")

    def evaluate(self, metric: dict) -> list[dict]:
        """Evaluate a metric against all rules. Returns triggered alerts."""
        triggered = []
        for rule in self.rules:
            if rule["metric_name"] != metric.get("metric_name"):
                continue

            value = metric.get("value", 0)
            threshold = rule["threshold"]
            condition = rule["condition"]

            matched = (
                (condition == "gt" and value > threshold)
                or (condition == "lt" and value < threshold)
                or (condition == "eq" and value == threshold)
            )

            if matched:
                triggered.append({
                    "rule_id": rule["id"],
                    "rule_name": rule["name"],
                    "asset_id": metric.get("asset_id"),
                    "metric_name": metric.get("metric_name"),
                    "current_value": value,
                    "threshold": threshold,
                    "severity": rule["severity"],
                    "fired_at": datetime.now(timezone.utc).isoformat(),
                })
        return triggered

    async def check_duration(self, alert_key: str, duration_seconds: int) -> bool:
        """Check if condition persisted for required duration using Redis."""
        if not self.redis or duration_seconds <= 0:
            return True
        count = await self.redis.incr(alert_key)
        if count == 1:
            await self.redis.expire(alert_key, duration_seconds + 60)
        return count * 15 >= duration_seconds  # assuming 15s scrape interval

    async def process_metric(self, metric: dict):
        triggered = self.evaluate(metric)
        for alert in triggered:
            rule = next((r for r in self.rules if r["id"] == alert["rule_id"]), None)
            if not rule:
                continue
            alert_key = f"alert:duration:{alert['asset_id']}:{alert['rule_id']}"
            if await self.check_duration(alert_key, rule["duration_seconds"]):
                # Check for duplicate firing alerts
                dup_key = f"alert:firing:{alert['asset_id']}:{alert['rule_id']}"
                if self.redis and await self.redis.exists(dup_key):
                    continue
                if self.redis:
                    await self.redis.setex(dup_key, 3600, "1")
                if self.kafka_producer:
                    await self.kafka_producer.send("alerts.trigger", value=alert)
                logger.warning(f"Alert triggered: {alert['rule_name']} for asset {alert['asset_id']}")

    async def run(self, kafka_consumer):
        self.running = True
        await self.load_rules()
        logger.info("Alert engine started, consuming metrics.raw")
        async for msg in kafka_consumer:
            if not self.running:
                break
            try:
                metric = json.loads(msg.value) if isinstance(msg.value, (str, bytes)) else msg.value
                await self.process_metric(metric)
            except Exception as e:
                logger.error(f"Alert engine error: {e}")

    def stop(self):
        self.running = False
