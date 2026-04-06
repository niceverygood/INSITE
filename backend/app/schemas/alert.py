import uuid
from datetime import datetime

from pydantic import BaseModel

from app.models.alert import AlertSeverity, AlertStatus, AlertCondition


class AlertResponse(BaseModel):
    id: uuid.UUID
    asset_id: uuid.UUID
    rule_id: uuid.UUID
    severity: AlertSeverity
    title: str
    message: str
    status: AlertStatus
    fired_at: datetime
    acknowledged_at: datetime | None
    acknowledged_by: str | None
    resolved_at: datetime | None
    notification_sent: bool

    model_config = {"from_attributes": True}


class AlertRuleCreate(BaseModel):
    name: str
    metric_name: str
    condition: AlertCondition
    threshold: float
    duration_seconds: int = 0
    severity: AlertSeverity = AlertSeverity.warning
    enabled: bool = True
    notification_channels: dict | None = None
    asset_filter: dict | None = None


class AlertRuleUpdate(BaseModel):
    name: str | None = None
    metric_name: str | None = None
    condition: AlertCondition | None = None
    threshold: float | None = None
    duration_seconds: int | None = None
    severity: AlertSeverity | None = None
    enabled: bool | None = None
    notification_channels: dict | None = None
    asset_filter: dict | None = None


class AlertRuleResponse(BaseModel):
    id: uuid.UUID
    name: str
    metric_name: str
    condition: AlertCondition
    threshold: float
    duration_seconds: int
    severity: AlertSeverity
    enabled: bool
    notification_channels: dict | None
    asset_filter: dict | None
    created_at: datetime

    model_config = {"from_attributes": True}
