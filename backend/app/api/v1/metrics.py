import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.database import get_timescale_db
from app.models.metric import Metric
from app.models.user import User
from app.schemas.metric import MetricBulkIngest, MetricResponse

router = APIRouter()


@router.get("/current", response_model=list[MetricResponse])
async def get_current_metrics(
    db: AsyncSession = Depends(get_timescale_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Metric).order_by(Metric.time.desc()).limit(500)
    )
    return result.scalars().all()


@router.get("/history", response_model=list[MetricResponse])
async def get_metric_history(
    asset_id: uuid.UUID | None = None,
    metric_name: str | None = None,
    from_time: datetime | None = None,
    to_time: datetime | None = None,
    db: AsyncSession = Depends(get_timescale_db),
    user: User = Depends(get_current_user),
):
    query = select(Metric)
    if asset_id:
        query = query.where(Metric.asset_id == asset_id)
    if metric_name:
        query = query.where(Metric.metric_name == metric_name)
    if from_time:
        query = query.where(Metric.time >= from_time)
    if to_time:
        query = query.where(Metric.time <= to_time)
    query = query.order_by(Metric.time.asc()).limit(1000)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/top-n")
async def get_top_n(
    metric_name: str = "cpu_usage",
    n: int = Query(5, ge=1, le=50),
    db: AsyncSession = Depends(get_timescale_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Metric).where(Metric.metric_name == metric_name).order_by(Metric.time.desc()).limit(200)
    )
    rows = result.scalars().all()
    # Deduplicate by asset_id, keep latest
    seen = {}
    for r in rows:
        if str(r.asset_id) not in seen:
            seen[str(r.asset_id)] = r
    sorted_rows = sorted(seen.values(), key=lambda r: r.value, reverse=True)[:n]
    return [{"asset_id": str(r.asset_id), "metric_name": r.metric_name, "value": r.value, "unit": r.unit} for r in sorted_rows]


@router.post("/ingest", status_code=202)
async def ingest_metrics(body: MetricBulkIngest, db: AsyncSession = Depends(get_timescale_db)):
    for m in body.metrics:
        metric = Metric(
            time=m.time or datetime.now(timezone.utc),
            asset_id=m.asset_id,
            metric_name=m.metric_name,
            value=m.value,
            unit=m.unit,
        )
        db.add(metric)
    await db.commit()
    return {"accepted": len(body.metrics)}
