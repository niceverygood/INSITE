"""SNMP Collector — polls network devices for interface and resource metrics."""

import asyncio
import logging
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

# Standard OIDs
OIDS = {
    "ifInOctets": "1.3.6.1.2.1.2.2.1.10",
    "ifOutOctets": "1.3.6.1.2.1.2.2.1.16",
    "ifOperStatus": "1.3.6.1.2.1.2.2.1.8",
    "sysUpTime": "1.3.6.1.2.1.1.3.0",
    "sysName": "1.3.6.1.2.1.1.5.0",
}

POLL_INTERVAL = 30  # seconds


class SNMPCollector:
    def __init__(self, kafka_producer=None, community: str = "public"):
        self.community = community
        self.kafka_producer = kafka_producer
        self.running = False

    async def poll_device(self, ip: str, asset_id: str):
        """Poll a single device via SNMP and return metrics."""
        try:
            # Placeholder: actual pysnmp implementation
            logger.info(f"Polling SNMP device {ip} (asset_id={asset_id})")
            return {
                "asset_id": asset_id,
                "time": datetime.now(timezone.utc).isoformat(),
                "metrics": {
                    "traffic_in_bps": 0.0,
                    "traffic_out_bps": 0.0,
                    "interface_status": 1,
                },
            }
        except Exception as e:
            logger.error(f"SNMP poll failed for {ip}: {e}")
            return None

    async def publish_metrics(self, data: dict):
        if self.kafka_producer and data:
            await self.kafka_producer.send("metrics.raw", value=data)

    async def run(self, devices: list[dict]):
        """Main loop: poll all devices every POLL_INTERVAL seconds."""
        self.running = True
        logger.info(f"SNMP Collector started, polling {len(devices)} devices every {POLL_INTERVAL}s")
        while self.running:
            tasks = [self.poll_device(d["ip"], d["asset_id"]) for d in devices]
            results = await asyncio.gather(*tasks, return_exceptions=True)
            for result in results:
                if isinstance(result, dict):
                    await self.publish_metrics(result)
            await asyncio.sleep(POLL_INTERVAL)

    def stop(self):
        self.running = False
