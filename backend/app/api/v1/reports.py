from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from app.core.auth import get_current_user
from app.models.user import User
from app.schemas.report import ReportRequest

router = APIRouter()

now = datetime.now(timezone.utc)

# Demo report history
DEMO_REPORTS = [
    {"id": "rpt-001", "report_type": "일간", "format": "PDF", "status": "완료", "created_at": (now - timedelta(hours=2)).isoformat(), "created_by": "admin", "file_size": "2.4MB", "summary": "자산 33개 중 정상 28개, 경고 3개, 다운 2개"},
    {"id": "rpt-002", "report_type": "일간", "format": "Excel", "status": "완료", "created_at": (now - timedelta(hours=6)).isoformat(), "created_by": "admin", "file_size": "1.8MB", "summary": "알람 12건 발생, Critical 4건, Warning 4건 해결"},
    {"id": "rpt-003", "report_type": "주간", "format": "PDF", "status": "완료", "created_at": (now - timedelta(days=1)).isoformat(), "created_by": "operator", "file_size": "5.1MB", "summary": "주간 가용률 97.2%, SLA 목표 99.9% 미달"},
    {"id": "rpt-004", "report_type": "주간", "format": "Excel", "status": "완료", "created_at": (now - timedelta(days=2)).isoformat(), "created_by": "admin", "file_size": "3.7MB", "summary": "DB-PRD-03 장애 45분, K8S-WORKER-03 다운 지속"},
    {"id": "rpt-005", "report_type": "월간", "format": "PDF", "status": "완료", "created_at": (now - timedelta(days=7)).isoformat(), "created_by": "admin", "file_size": "12.3MB", "summary": "월간 인프라 종합 보고서 — 자산 증가 +5, 장애 3건"},
    {"id": "rpt-006", "report_type": "월간", "format": "Excel", "status": "완료", "created_at": (now - timedelta(days=14)).isoformat(), "created_by": "operator", "file_size": "8.9MB", "summary": "리소스 사용 트렌드 분석, 디스크 증설 권고 3건"},
    {"id": "rpt-007", "report_type": "일간", "format": "PDF", "status": "완료", "created_at": (now - timedelta(days=1, hours=3)).isoformat(), "created_by": "admin", "file_size": "2.1MB", "summary": "전일 대비 CPU 사용률 +12%, 트래픽 +8%"},
    {"id": "rpt-008", "report_type": "주간", "format": "PDF", "status": "완료", "created_at": (now - timedelta(days=8)).isoformat(), "created_by": "admin", "file_size": "4.8MB", "summary": "보안 패치 미적용 서버 2대 식별"},
]


@router.post("/generate", response_model=dict)
async def generate_report(body: ReportRequest, user: User = Depends(get_current_user)):
    type_map = {"daily": "일간", "weekly": "주간", "monthly": "월간"}
    return {
        "id": f"rpt-new-{int(now.timestamp())}",
        "report_type": type_map.get(body.report_type, body.report_type),
        "format": body.format.upper(),
        "status": "생성완료",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": user.username,
        "file_size": "생성 중",
        "summary": f"{type_map.get(body.report_type, body.report_type)} 리포트가 생성되었습니다.",
    }


@router.get("/")
async def list_reports(user: User = Depends(get_current_user)):
    return DEMO_REPORTS


@router.get("/{report_id}/download")
async def download_report(report_id: str, user: User = Depends(get_current_user)):
    return {"detail": "데모 환경에서는 다운로드가 지원되지 않습니다."}
