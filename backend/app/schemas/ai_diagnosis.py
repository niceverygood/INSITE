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
    diagnosis_id: str
    asset_id: str
    timestamp: str
    causes: list[DiagnosisCause]
    severity_score: int
    summary: str


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    message: str


class PredictionResponse(BaseModel):
    asset_id: str
    asset_name: str
    metric_name: str
    current_value: float
    predicted_hours: float
    days_remaining: float
    severity: str
