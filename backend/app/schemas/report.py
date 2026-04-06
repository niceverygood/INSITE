import uuid
from datetime import datetime

from pydantic import BaseModel


class ReportRequest(BaseModel):
    report_type: str  # daily, weekly, monthly
    format: str = "pdf"  # pdf, excel
    from_date: datetime | None = None
    to_date: datetime | None = None


class ReportResponse(BaseModel):
    id: uuid.UUID
    report_type: str
    format: str
    status: str  # generating, completed, failed
    file_path: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
