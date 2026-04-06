import uuid
from datetime import datetime

from pydantic import BaseModel

from app.models.log_entry import LogLevel, LogSource


class LogSearchQuery(BaseModel):
    query: str | None = None
    asset_id: uuid.UUID | None = None
    level: LogLevel | None = None
    source: LogSource | None = None
    from_time: datetime | None = None
    to_time: datetime | None = None
    page: int = 1
    page_size: int = 50


class LogResponse(BaseModel):
    id: uuid.UUID
    asset_id: uuid.UUID
    timestamp: datetime
    source: LogSource
    level: LogLevel
    message: str
    raw_data: dict | None

    model_config = {"from_attributes": True}


class LogStatsResponse(BaseModel):
    level: str
    count: int
    period: str
