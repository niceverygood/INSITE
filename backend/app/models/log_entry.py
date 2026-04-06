import enum
import uuid
from datetime import datetime

from sqlalchemy import String, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.utils.compat import GUID, JSONType


class LogLevel(str, enum.Enum):
    debug = "debug"
    info = "info"
    warn = "warn"
    error = "error"
    critical = "critical"


class LogSource(str, enum.Enum):
    syslog = "syslog"
    application = "application"
    security = "security"


class LogEntry(Base):
    __tablename__ = "log_entries"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    asset_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("assets.id"), index=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), index=True)
    source: Mapped[str] = mapped_column(String(30), nullable=False)
    level: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    raw_data: Mapped[dict | None] = mapped_column(JSONType(), nullable=True)

    asset = relationship("Asset", back_populates="log_entries")
