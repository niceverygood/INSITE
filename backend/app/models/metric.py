import uuid
from datetime import datetime

from sqlalchemy import String, Float, DateTime
from sqlalchemy.orm import Mapped, mapped_column

from app.database import TimescaleBase
from app.utils.compat import GUID


class Metric(TimescaleBase):
    __tablename__ = "metrics"

    time: Mapped[datetime] = mapped_column(DateTime, primary_key=True)
    asset_id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True)
    metric_name: Mapped[str] = mapped_column(String(100), primary_key=True, index=True)
    value: Mapped[float] = mapped_column(Float, nullable=False)
    unit: Mapped[str | None] = mapped_column(String(20), nullable=True)
