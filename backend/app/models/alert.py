import enum
import uuid
from datetime import datetime

from sqlalchemy import String, Float, Integer, Boolean, DateTime, ForeignKey, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.utils.compat import GUID, JSONType


class AlertSeverity(str, enum.Enum):
    info = "info"
    warning = "warning"
    critical = "critical"


class AlertStatus(str, enum.Enum):
    firing = "firing"
    acknowledged = "acknowledged"
    resolved = "resolved"


class AlertCondition(str, enum.Enum):
    gt = "gt"
    lt = "lt"
    eq = "eq"


class AlertRule(Base):
    __tablename__ = "alert_rules"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    metric_name: Mapped[str] = mapped_column(String(100), nullable=False)
    condition: Mapped[str] = mapped_column(String(10), nullable=False)
    threshold: Mapped[float] = mapped_column(Float, nullable=False)
    duration_seconds: Mapped[int] = mapped_column(Integer, default=0)
    severity: Mapped[str] = mapped_column(String(20), default="warning")
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    notification_channels: Mapped[dict | None] = mapped_column(JSONType(), nullable=True)
    asset_filter: Mapped[dict | None] = mapped_column(JSONType(), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    alerts = relationship("Alert", back_populates="rule", lazy="selectin")


class Alert(Base):
    __tablename__ = "alerts"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    asset_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("assets.id"), index=True)
    rule_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("alert_rules.id"))
    severity: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="firing", index=True)
    fired_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    acknowledged_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    acknowledged_by: Mapped[str | None] = mapped_column(String(255), nullable=True)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    notification_sent: Mapped[bool] = mapped_column(Boolean, default=False)

    asset = relationship("Asset", back_populates="alerts")
    rule = relationship("AlertRule", back_populates="alerts")
