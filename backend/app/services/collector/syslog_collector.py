"""Syslog Collector — receives syslog messages via UDP/TCP."""

import asyncio
import logging
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

SYSLOG_PORT = 514


class SyslogProtocol(asyncio.DatagramProtocol):
    def __init__(self, callback):
        self.callback = callback

    def datagram_received(self, data: bytes, addr: tuple):
        message = data.decode("utf-8", errors="replace")
        self.callback(message, addr[0])


class SyslogCollector:
    def __init__(self, kafka_producer=None):
        self.kafka_producer = kafka_producer
        self.transport = None

    def handle_message(self, message: str, source_ip: str):
        log_entry = {
            "source_ip": source_ip,
            "message": message.strip(),
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "source": "syslog",
        }
        logger.debug(f"Syslog from {source_ip}: {message[:100]}")
        if self.kafka_producer:
            asyncio.create_task(self.kafka_producer.send("logs.ingest", value=log_entry))

    async def start(self, host: str = "0.0.0.0", port: int = SYSLOG_PORT):
        loop = asyncio.get_event_loop()
        self.transport, _ = await loop.create_datagram_endpoint(
            lambda: SyslogProtocol(self.handle_message),
            local_addr=(host, port),
        )
        logger.info(f"Syslog collector listening on {host}:{port}")

    def stop(self):
        if self.transport:
            self.transport.close()
