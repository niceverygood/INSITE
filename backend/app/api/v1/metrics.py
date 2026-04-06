import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.database import get_timescale_db
from app.models.asset import Asset
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


@router.get("/traffic-summary")
async def get_traffic_summary(
    db: AsyncSession = Depends(get_timescale_db),
    user: User = Depends(get_current_user),
):
    cutoff = datetime.now(timezone.utc) - timedelta(hours=2)
    # Query network metrics grouped by asset
    query = (
        select(
            Metric.asset_id,
            Metric.metric_name,
            func.avg(Metric.value).label("avg_value"),
            func.max(Metric.value).label("max_value"),
        )
        .where(Metric.time >= cutoff)
        .where(Metric.metric_name.in_(["network_in", "network_out"]))
        .group_by(Metric.asset_id, Metric.metric_name)
    )
    result = await db.execute(query)
    rows = result.all()

    # Collect unique asset IDs and fetch asset info
    asset_ids = list({row.asset_id for row in rows})
    assets_map: dict[str, dict] = {}
    if asset_ids:
        from app.database import AsyncSessionLocal
        async with AsyncSessionLocal() as main_db:
            asset_result = await main_db.execute(
                select(Asset).where(Asset.id.in_(asset_ids))
            )
            for a in asset_result.scalars().all():
                assets_map[str(a.id)] = {
                    "asset_name": a.name,
                    "asset_type": a.asset_type,
                    "location": a.location or "",
                }

    # Pivot rows into per-asset summaries
    summaries: dict[str, dict] = {}
    for row in rows:
        aid = str(row.asset_id)
        if aid not in summaries:
            info = assets_map.get(aid, {"asset_name": "Unknown", "asset_type": "", "location": ""})
            summaries[aid] = {
                "asset_id": aid,
                "asset_name": info["asset_name"],
                "asset_type": info["asset_type"],
                "location": info["location"],
                "avg_network_in": 0,
                "avg_network_out": 0,
                "max_network_in": 0,
                "max_network_out": 0,
            }
        if row.metric_name == "network_in":
            summaries[aid]["avg_network_in"] = round(row.avg_value, 2)
            summaries[aid]["max_network_in"] = round(row.max_value, 2)
        elif row.metric_name == "network_out":
            summaries[aid]["avg_network_out"] = round(row.avg_value, 2)
            summaries[aid]["max_network_out"] = round(row.max_value, 2)

    # Sort by highest total average traffic
    result_list = sorted(
        summaries.values(),
        key=lambda x: x["avg_network_in"] + x["avg_network_out"],
        reverse=True,
    )
    return result_list


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
