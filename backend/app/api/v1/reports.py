from fastapi import APIRouter, Depends
from app.core.auth import get_current_user
from app.models.user import User
from app.schemas.report import ReportRequest, ReportResponse

router = APIRouter()


@router.post("/generate", response_model=dict)
async def generate_report(body: ReportRequest, user: User = Depends(get_current_user)):
    # Placeholder — implemented in PROMPT 7
    return {"status": "generating", "report_type": body.report_type, "format": body.format}


@router.get("/")
async def list_reports(user: User = Depends(get_current_user)):
    return []


@router.get("/{report_id}/download")
async def download_report(report_id: str, user: User = Depends(get_current_user)):
    return {"detail": "Not implemented yet"}
