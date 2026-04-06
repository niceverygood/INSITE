from fastapi import APIRouter, Depends
from app.core.auth import get_current_user
from app.models.user import User
from app.schemas.ai_diagnosis import DiagnosisRequest

router = APIRouter()


@router.post("/diagnose")
async def diagnose(body: DiagnosisRequest, user: User = Depends(get_current_user)):
    # Placeholder — implemented in PROMPT 6
    return {"status": "processing", "asset_id": str(body.asset_id)}


@router.get("/predictions")
async def get_predictions(user: User = Depends(get_current_user)):
    return []


@router.get("/history")
async def get_diagnosis_history(user: User = Depends(get_current_user)):
    return []
