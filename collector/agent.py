"""INSITE Collector Agent — standalone data collection service."""

import asyncio
import json
import logging
import os
import signal
import sys

import httpx

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(name)s] %(levelname)s: %(message)s")
logger = logging.getLogger("collector")

BACKEND_URL = os.getenv("VITE_API_BASE_URL", "http://backend:8000")
KAFKA_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "kafka:9092")
POLL_INTERVAL = int(os.getenv("POLL_INTERVAL", "15"))


async def fetch_assets() -> list[dict]:
    """Fetch asset list from backend API."""
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"{BACKEND_URL}/api/v1/assets/", params={"page_size": 1000})
            if resp.status_code == 200:
                data = resp.json()
                return data.get("items", [])
    except Exception as e:
        logger.error(f"Failed to fetch assets: {e}")
    return []


async def collect_and_publish():
    """Main collection loop."""
    try:
        from aiokafka import AIOKafkaProducer
        producer = AIOKafkaProducer(
            bootstrap_servers=KAFKA_SERVERS,
            value_serializer=lambda v: json.dumps(v).encode("utf-8"),
        )
        await producer.start()
        logger.info("Kafka producer connected")
    except Exception as e:
        logger.error(f"Kafka connection failed: {e}")
        producer = None

    while True:
        try:
            assets = await fetch_assets()
            logger.info(f"Collecting metrics for {len(assets)} assets")

            for asset in assets:
                # Simulate metric collection (replace with real collectors)
                import random
                metrics = [
                    {"asset_id": asset["id"], "metric_name": "cpu_usage", "value": round(random.uniform(10, 95), 1), "unit": "%"},
                    {"asset_id": asset["id"], "metric_name": "memory_usage", "value": round(random.uniform(20, 90), 1), "unit": "%"},
                    {"asset_id": asset["id"], "metric_name": "disk_usage", "value": round(random.uniform(15, 85), 1), "unit": "%"},
                    {"asset_id": asset["id"], "metric_name": "network_in", "value": round(random.uniform(100, 10000), 0), "unit": "Kbps"},
                    {"asset_id": asset["id"], "metric_name": "network_out", "value": round(random.uniform(50, 5000), 0), "unit": "Kbps"},
                ]
                for m in metrics:
                    if producer:
                        await producer.send("metrics.raw", value=m)

            # Also ingest to backend directly
            if assets:
                try:
                    async with httpx.AsyncClient() as client:
                        await client.post(f"{BACKEND_URL}/api/v1/metrics/ingest", json={"metrics": metrics})
                except Exception:
                    pass

        except Exception as e:
            logger.error(f"Collection error: {e}")

        await asyncio.sleep(POLL_INTERVAL)


async def main():
    logger.info("INSITE Collector Agent starting...")
    loop = asyncio.get_event_loop()

    def shutdown():
        logger.info("Shutting down...")
        for task in asyncio.all_tasks(loop):
            task.cancel()

    for sig in (signal.SIGTERM, signal.SIGINT):
        loop.add_signal_handler(sig, shutdown)

    await collect_and_publish()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except (KeyboardInterrupt, asyncio.CancelledError):
        logger.info("Collector stopped")
