import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.database import get_db, get_timescale_db
from app.models.asset import Asset
from app.models.alert import Alert
from app.models.log_entry import LogEntry
from app.models.metric import Metric
from app.models.user import User
from app.schemas.ai_diagnosis import DiagnosisRequest, ChatRequest, ChatResponse
from app.services.ai_engine import AIEngine

router = APIRouter()
engine = AIEngine()


@router.post("/diagnose")
async def diagnose(
    body: DiagnosisRequest,
    db: AsyncSession = Depends(get_db),
    ts_db: AsyncSession = Depends(get_timescale_db),
    user: User = Depends(get_current_user),
):
    # 1. Get asset info
    result = await db.execute(select(Asset).where(Asset.id == body.asset_id))
    asset = result.scalar_one_or_none()
    if not asset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found")

    asset_info = {
        "id": str(asset.id),
        "name": asset.name,
        "type": asset.asset_type,
        "ip": asset.ip_address,
        "location": asset.location or "",
        "status": asset.status,
    }

    # 2. Get recent metrics
    metrics_result = await ts_db.execute(
        select(Metric)
        .where(Metric.asset_id == body.asset_id)
        .order_by(Metric.time.desc())
        .limit(30)
    )
    metrics = [
        {"name": m.metric_name, "value": m.value, "unit": m.unit, "time": m.time.isoformat()}
        for m in metrics_result.scalars().all()
    ]

    # 3. Get error logs
    logs_result = await db.execute(
        select(LogEntry)
        .where(LogEntry.asset_id == body.asset_id, LogEntry.level.in_(["error", "warn"]))
        .order_by(LogEntry.timestamp.desc())
        .limit(20)
    )
    error_logs = [f"[{log.level.upper()}] {log.timestamp.strftime('%H:%M')} {log.message}" for log in logs_result.scalars().all()]

    # 4. Get active alerts
    alerts_result = await db.execute(
        select(Alert)
        .where(Alert.asset_id == body.asset_id, Alert.status.in_(["firing", "acknowledged"]))
        .order_by(Alert.fired_at.desc())
    )
    active_alerts = [
        {"severity": a.severity, "title": a.title, "message": a.message, "fired_at": a.fired_at.isoformat()}
        for a in alerts_result.scalars().all()
    ]

    # 5. Call AI engine
    diagnosis = await engine.diagnose(
        asset_info=asset_info,
        recent_metrics=metrics,
        error_logs=error_logs,
        active_alerts=active_alerts,
        symptom=body.symptom or "",
    )

    return diagnosis


@router.post("/chat", response_model=ChatResponse)
async def ai_chat(
    body: ChatRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    # Build context from current system state
    assets_result = await db.execute(select(Asset))
    assets = assets_result.scalars().all()

    total = len(assets)
    normal = sum(1 for a in assets if a.status == "normal")
    warning = sum(1 for a in assets if a.status == "warning")
    down = sum(1 for a in assets if a.status == "down")

    alerts_result = await db.execute(
        select(Alert).where(Alert.status == "firing").order_by(Alert.fired_at.desc()).limit(10)
    )
    firing_alerts = alerts_result.scalars().all()

    context = f"""총 자산: {total}개 (정상: {normal}, 경고: {warning}, 다운: {down})
활성 알람 {len(firing_alerts)}건:
""" + "\n".join(f"- [{a.severity}] {a.title}" for a in firing_alerts)

    answer = await engine.chat(question=body.message, context=context)
    return ChatResponse(message=answer)


@router.get("/predictions")
async def get_predictions(
    db: AsyncSession = Depends(get_db),
    ts_db: AsyncSession = Depends(get_timescale_db),
    user: User = Depends(get_current_user),
):
    """Predict resource exhaustion for all assets using linear trend."""
    assets_result = await db.execute(select(Asset).where(Asset.status != "down"))
    assets = assets_result.scalars().all()

    predictions = []
    for asset in assets:
        for metric_name in ["disk_usage", "memory_usage"]:
            metrics_result = await ts_db.execute(
                select(Metric)
                .where(Metric.asset_id == asset.id, Metric.metric_name == metric_name)
                .order_by(Metric.time.asc())
                .limit(288)
            )
            rows = metrics_result.scalars().all()
            if len(rows) < 20:
                continue

            values = [r.value for r in rows]
            n = len(values)
            # Simple linear regression
            x_mean = (n - 1) / 2
            y_mean = sum(values) / n
            num = sum((i - x_mean) * (v - y_mean) for i, v in enumerate(values))
            den = sum((i - x_mean) ** 2 for i in range(n))
            if den == 0:
                continue
            slope = num / den
            if slope <= 0.001:
                continue  # Not increasing

            current = values[-1]
            steps_to_100 = (100 - current) / slope
            hours_remaining = steps_to_100 * (5 / 60)  # 5-minute intervals

            if hours_remaining > 0 and hours_remaining < 720:  # Within 30 days
                predictions.append({
                    "asset_id": str(asset.id),
                    "asset_name": asset.name,
                    "metric_name": metric_name,
                    "current_value": round(current, 1),
                    "predicted_hours": round(hours_remaining, 1),
                    "days_remaining": round(hours_remaining / 24, 1),
                    "severity": "critical" if hours_remaining < 72 else "warning" if hours_remaining < 168 else "info",
                })

    predictions.sort(key=lambda p: p["predicted_hours"])
    return predictions


@router.get("/history")
async def get_diagnosis_history(user: User = Depends(get_current_user)):
    return []
