"""Prometheus Collector — queries Prometheus API for server metrics."""

import logging
from datetime import datetime, timezone

import httpx

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

METRIC_QUERIES = {
    "cpu_usage": '100 - (avg by(instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)',
    "memory_usage": "(1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) * 100",
    "disk_usage": '(1 - node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"}) * 100',
    "load_average": "node_load1",
    "network_in": "rate(node_network_receive_bytes_total[5m])",
    "network_out": "rate(node_network_transmit_bytes_total[5m])",
}


class PrometheusCollector:
    def __init__(self, prometheus_url: str | None = None):
        self.prometheus_url = prometheus_url or settings.prometheus_url

    async def query(self, promql: str) -> list[dict]:
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(f"{self.prometheus_url}/api/v1/query", params={"query": promql})
                response.raise_for_status()
                data = response.json()
                return data.get("data", {}).get("result", [])
            except Exception as e:
                logger.error(f"Prometheus query failed: {e}")
                return []

    async def collect_all(self) -> list[dict]:
        metrics = []
        for metric_name, promql in METRIC_QUERIES.items():
            results = await self.query(promql)
            for result in results:
                instance = result.get("metric", {}).get("instance", "")
                value = float(result["value"][1]) if result.get("value") else 0.0
                metrics.append({
                    "instance": instance,
                    "metric_name": metric_name,
                    "value": round(value, 2),
                    "time": datetime.now(timezone.utc).isoformat(),
                })
        return metrics
