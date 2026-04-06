from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.database import get_db
from app.models.asset import Asset
from app.models.alert import Alert
from app.models.user import User
from app.schemas.dashboard import DashboardSummary, StatusMatrix, StatusMatrixItem

router = APIRouter()


@router.get("/summary", response_model=DashboardSummary)
async def get_summary(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    asset_counts = await db.execute(select(Asset.status, func.count(Asset.id)).group_by(Asset.status))
    counts = {row[0]: row[1] for row in asset_counts.fetchall()}

    active_alerts = await db.execute(
        select(func.count(Alert.id)).where(Alert.status == "firing")
    )
    critical_alerts = await db.execute(
        select(func.count(Alert.id)).where(Alert.status == "firing", Alert.severity == "critical")
    )
    warning_alerts = await db.execute(
        select(func.count(Alert.id)).where(Alert.status == "firing", Alert.severity == "warning")
    )

    total = sum(counts.values())
    return DashboardSummary(
        total_assets=total,
        normal_count=counts.get("normal", 0),
        warning_count=counts.get("warning", 0),
        down_count=counts.get("down", 0),
        active_alerts=active_alerts.scalar() or 0,
        critical_alerts=critical_alerts.scalar() or 0,
        warning_alerts=warning_alerts.scalar() or 0,
    )


@router.get("/status-matrix", response_model=StatusMatrix)
async def get_status_matrix(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    result = await db.execute(select(Asset).order_by(Asset.name))
    assets = result.scalars().all()
    items = [
        StatusMatrixItem(
            asset_id=str(a.id),
            asset_name=a.name,
            asset_type=a.asset_type,
            status=a.status,
        )
        for a in assets
    ]
    return StatusMatrix(items=items)


@router.websocket("/ws/realtime")
async def realtime_websocket(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            await websocket.send_json({"type": "ping", "message": "connected"})
    except WebSocketDisconnect:
        pass
