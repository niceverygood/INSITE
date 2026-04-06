import uuid
from datetime import datetime

from pydantic import BaseModel


class MetricIngest(BaseModel):
    asset_id: uuid.UUID
    metric_name: str
    value: float
    unit: str | None = None
    time: datetime | None = None


class MetricBulkIngest(BaseModel):
    metrics: list[MetricIngest]


class MetricResponse(BaseModel):
    time: datetime
    asset_id: uuid.UUID
    metric_name: str
    value: float
    unit: str | None

    model_config = {"from_attributes": True}


class MetricHistoryQuery(BaseModel):
    asset_id: uuid.UUID | None = None
    metric_name: str | None = None
    from_time: datetime | None = None
    to_time: datetime | None = None
    interval: str = "5m"


class TopNResponse(BaseModel):
    asset_id: uuid.UUID
    asset_name: str
    metric_name: str
    value: float
    unit: str | None
