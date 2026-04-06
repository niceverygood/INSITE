"""Notification Service — sends alerts via Email, Slack, Kakao, SMS."""

import json
import logging
from datetime import datetime

import httpx
import aiosmtplib
from email.mime.text import MIMEText

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

ALERT_TEMPLATE = """[INSITE 알람] {severity}
자산: {asset_name} ({ip_address})
항목: {metric_name}
현재값: {current_value} (임계치: {threshold})
발생시각: {fired_at}
"""


class NotificationService:
    async def send_email(self, to: list[str], subject: str, body: str):
        if not settings.smtp_user:
            logger.warning("SMTP not configured, skipping email")
            return
        message = MIMEText(body, "plain", "utf-8")
        message["From"] = settings.smtp_from
        message["To"] = ", ".join(to)
        message["Subject"] = subject
        try:
            await aiosmtplib.send(
                message,
                hostname=settings.smtp_host,
                port=settings.smtp_port,
                username=settings.smtp_user,
                password=settings.smtp_password,
                start_tls=True,
            )
            logger.info(f"Email sent to {to}")
        except Exception as e:
            logger.error(f"Email send failed: {e}")

    async def send_slack(self, message: str):
        if not settings.slack_webhook_url:
            logger.warning("Slack webhook not configured, skipping")
            return
        async with httpx.AsyncClient() as client:
            try:
                await client.post(settings.slack_webhook_url, json={"text": message})
                logger.info("Slack notification sent")
            except Exception as e:
                logger.error(f"Slack send failed: {e}")

    async def send_kakao(self, message: str):
        """Kakao 알림톡 — requires API key configuration."""
        logger.info(f"Kakao notification: {message[:50]}...")

    async def send_sms(self, phone: str, message: str):
        """SMS via external API — requires configuration."""
        logger.info(f"SMS to {phone}: {message[:50]}...")

    async def send_alert(self, alert_data: dict, channels: list[str] | None = None):
        body = ALERT_TEMPLATE.format(
            severity=alert_data.get("severity", "WARNING").upper(),
            asset_name=alert_data.get("asset_name", "Unknown"),
            ip_address=alert_data.get("ip_address", ""),
            metric_name=alert_data.get("metric_name", ""),
            current_value=alert_data.get("current_value", ""),
            threshold=alert_data.get("threshold", ""),
            fired_at=alert_data.get("fired_at", datetime.now().isoformat()),
        )
        subject = f"[INSITE] {alert_data.get('severity', 'WARNING').upper()} - {alert_data.get('asset_name', '')}"

        channels = channels or ["email", "slack"]
        for channel in channels:
            if channel == "email":
                recipients = settings.report_email_recipients.split(",") if settings.report_email_recipients else []
                if recipients:
                    await self.send_email(recipients, subject, body)
            elif channel == "slack":
                await self.send_slack(body)
            elif channel == "kakao":
                await self.send_kakao(body)
            elif channel == "sms":
                await self.send_sms("", body)

    async def run(self, kafka_consumer):
        """Consume alerts.trigger and send notifications."""
        logger.info("Notification service started")
        async for msg in kafka_consumer:
            try:
                alert = json.loads(msg.value) if isinstance(msg.value, (str, bytes)) else msg.value
                await self.send_alert(alert)
            except Exception as e:
                logger.error(f"Notification error: {e}")
