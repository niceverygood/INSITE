import enum
import uuid
from datetime import datetime

from sqlalchemy import String, Enum, Float, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.utils.compat import GUID, JSONType


class AssetType(str, enum.Enum):
    server = "server"
    network_device = "network_device"
    system = "system"
    vm = "vm"


class AssetStatus(str, enum.Enum):
    normal = "normal"
    warning = "warning"
    down = "down"


class Asset(Base):
    __tablename__ = "assets"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    asset_type: Mapped[str] = mapped_column(String(30), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    ip_address: Mapped[str] = mapped_column(String(45), nullable=False, unique=True, index=True)
    mac_address: Mapped[str | None] = mapped_column(String(17), nullable=True)
    location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    floor_map_x: Mapped[float | None] = mapped_column(Float, nullable=True)
    floor_map_y: Mapped[float | None] = mapped_column(Float, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="normal", index=True)
    last_heartbeat: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    extra_info: Mapped[dict | None] = mapped_column("extra_info", JSONType(), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    alerts = relationship("Alert", back_populates="asset", lazy="selectin")
    log_entries = relationship("LogEntry", back_populates="asset", lazy="selectin")
