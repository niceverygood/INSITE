"""Heartbeat checker — ICMP ping + TCP port check for all assets."""

import asyncio
import logging
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

CHECK_INTERVAL = 10  # seconds
MAX_FAILURES = 3


class HeartbeatChecker:
    def __init__(self, kafka_producer=None):
        self.kafka_producer = kafka_producer
        self.failure_counts: dict[str, int] = {}
        self.running = False

    async def ping(self, ip: str) -> bool:
        try:
            proc = await asyncio.create_subprocess_exec(
                "ping", "-c", "1", "-W", "2", ip,
                stdout=asyncio.subprocess.DEVNULL,
                stderr=asyncio.subprocess.DEVNULL,
            )
            await proc.wait()
            return proc.returncode == 0
        except Exception as e:
            logger.error(f"Ping failed for {ip}: {e}")
            return False

    async def tcp_check(self, ip: str, port: int = 22, timeout: float = 3.0) -> bool:
        try:
            _, writer = await asyncio.wait_for(asyncio.open_connection(ip, port), timeout=timeout)
            writer.close()
            await writer.wait_closed()
            return True
        except Exception:
            return False

    async def check_asset(self, asset_id: str, ip: str):
        is_alive = await self.ping(ip) or await self.tcp_check(ip)

        if is_alive:
            self.failure_counts[asset_id] = 0
            return {"asset_id": asset_id, "status": "normal", "time": datetime.now(timezone.utc).isoformat()}

        self.failure_counts[asset_id] = self.failure_counts.get(asset_id, 0) + 1
        if self.failure_counts[asset_id] >= MAX_FAILURES:
            logger.warning(f"Asset {asset_id} ({ip}) is DOWN after {MAX_FAILURES} consecutive failures")
            event = {
                "asset_id": asset_id,
                "status": "down",
                "failures": self.failure_counts[asset_id],
                "time": datetime.now(timezone.utc).isoformat(),
            }
            if self.kafka_producer:
                await self.kafka_producer.send("asset.status", value=event)
            return event
        return None

    async def run(self, assets: list[dict]):
        self.running = True
        logger.info(f"Heartbeat checker started for {len(assets)} assets, interval={CHECK_INTERVAL}s")
        while self.running:
            tasks = [self.check_asset(a["asset_id"], a["ip"]) for a in assets]
            await asyncio.gather(*tasks, return_exceptions=True)
            await asyncio.sleep(CHECK_INTERVAL)

    def stop(self):
        self.running = False
