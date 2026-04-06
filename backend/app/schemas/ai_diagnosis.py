import uuid
from datetime import datetime

from pydantic import BaseModel


class DiagnosisRequest(BaseModel):
    asset_id: uuid.UUID
    symptom: str | None = None


class DiagnosisCause(BaseModel):
    rank: int
    cause: str
    confidence: float
    evidence: list[str]
    immediate_action: str
    prevention: str


class DiagnosisResponse(BaseModel):
    diagnosis_id: uuid.UUID
    asset_id: uuid.UUID
    timestamp: datetime
    causes: list[DiagnosisCause]
    severity_score: int
    summary: str


class PredictionResponse(BaseModel):
    asset_id: uuid.UUID
    asset_name: str
    metric_name: str
    current_value: float
    predicted_exhaustion: datetime | None
    days_remaining: float | None
    severity: str
