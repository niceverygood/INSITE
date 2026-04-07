from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from app.core.auth import get_current_user
from app.models.user import User
from app.schemas.report import ReportRequest

router = APIRouter()

now = datetime.now(timezone.utc)

# Demo report history — realistic recent data
DEMO_REPORTS = [
    {"id": "rpt-001", "report_type": "일간", "format": "PDF", "status": "완료",
     "created_at": (now - timedelta(hours=1, minutes=23)).isoformat(), "created_by": "admin",
     "file_size": "2.4MB", "summary": "자산 21개 중 정상 16개, 경고 3개, 다운 2개 — 전일 대비 다운 +1"},
    {"id": "rpt-002", "report_type": "일간", "format": "Excel", "status": "완료",
     "created_at": (now - timedelta(hours=5, minutes=40)).isoformat(), "created_by": "admin",
     "file_size": "1.8MB", "summary": "알람 7건 발생 (Critical 3, Warning 4), 해결 0건 — 즉시 대응 필요"},
    {"id": "rpt-003", "report_type": "일간", "format": "PDF", "status": "완료",
     "created_at": (now - timedelta(days=1, hours=2)).isoformat(), "created_by": "operator",
     "file_size": "2.2MB", "summary": "DB-PRD-03 CPU 95% 지속, KAFKA-PRD-03 Consumer lag 증가 감지"},
    {"id": "rpt-004", "report_type": "주간", "format": "PDF", "status": "완료",
     "created_at": (now - timedelta(days=1, hours=8)).isoformat(), "created_by": "admin",
     "file_size": "5.1MB", "summary": "주간 가용률 97.2%, SLA 목표 99.9% 미달 — DB/K8S 장애 영향"},
    {"id": "rpt-005", "report_type": "주간", "format": "Excel", "status": "완료",
     "created_at": (now - timedelta(days=2, hours=3)).isoformat(), "created_by": "admin",
     "file_size": "3.7MB", "summary": "서버별 리소스 사용 현황 — WEB-PRD-03 CPU 82%, 트래픽 분산 권고"},
    {"id": "rpt-006", "report_type": "일간", "format": "PDF", "status": "완료",
     "created_at": (now - timedelta(days=2, hours=6)).isoformat(), "created_by": "operator",
     "file_size": "2.0MB", "summary": "네트워크 장비 DIST-SW-B2 트래픽 과부하, 포트 임계치 초과"},
    {"id": "rpt-007", "report_type": "주간", "format": "PDF", "status": "완료",
     "created_at": (now - timedelta(days=5)).isoformat(), "created_by": "admin",
     "file_size": "4.8MB", "summary": "보안 패치 미적용 서버 2대 식별, SSL 인증서 만료 7일 전 경고"},
    {"id": "rpt-008", "report_type": "월간", "format": "PDF", "status": "완료",
     "created_at": (now - timedelta(days=7, hours=4)).isoformat(), "created_by": "admin",
     "file_size": "12.3MB", "summary": "월간 인프라 종합 — 자산 21개, 장애 3건, 평균 CPU 42%, 디스크 증설 권고"},
    {"id": "rpt-009", "report_type": "월간", "format": "Excel", "status": "완료",
     "created_at": (now - timedelta(days=14)).isoformat(), "created_by": "operator",
     "file_size": "8.9MB", "summary": "리소스 트렌드 분석 — DB 메모리 월 +5%, Kafka 디스크 월 +3% 증가 추세"},
    {"id": "rpt-010", "report_type": "일간", "format": "PDF", "status": "완료",
     "created_at": (now - timedelta(days=3, hours=1)).isoformat(), "created_by": "admin",
     "file_size": "2.3MB", "summary": "K8S-WORKER-03 응답 없음 2시간 경과, 노드 교체 작업 필요"},
    {"id": "rpt-011", "report_type": "주간", "format": "Excel", "status": "완료",
     "created_at": (now - timedelta(days=9)).isoformat(), "created_by": "admin",
     "file_size": "4.2MB", "summary": "알람 규칙 효율성 분석 — 오탐률 12%, 임계치 조정 권고 4건"},
    {"id": "rpt-012", "report_type": "월간", "format": "PDF", "status": "완료",
     "created_at": (now - timedelta(days=30)).isoformat(), "created_by": "admin",
     "file_size": "15.1MB", "summary": "분기 인프라 투자 보고서 — 서버 3대 증설, 네트워크 회선 이중화 완료"},
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
