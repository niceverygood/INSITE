import uuid
from datetime import datetime

from pydantic import BaseModel


class AuditLogResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    username: str
    action: str
    target_type: str
    target_id: str | None
    detail: str | None
    ip_address: str | None
    timestamp: datetime

    model_config = {"from_attributes": True}
