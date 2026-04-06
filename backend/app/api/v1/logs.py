from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.database import get_db
from app.models.log_entry import LogEntry, LogLevel
from app.models.user import User
from app.schemas.log_entry import LogSearchQuery, LogResponse

router = APIRouter()


@router.get("/search", response_model=list[LogResponse])
async def search_logs(
    query: str | None = None,
    asset_id: str | None = None,
    level: LogLevel | None = None,
    from_time: str | None = None,
    to_time: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    stmt = select(LogEntry)
    if query:
        stmt = stmt.where(LogEntry.message.ilike(f"%{query}%"))
    if asset_id:
        stmt = stmt.where(LogEntry.asset_id == asset_id)
    if level:
        stmt = stmt.where(LogEntry.level == level)
    stmt = stmt.order_by(LogEntry.timestamp.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/stats")
async def log_stats(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    result = await db.execute(
        select(LogEntry.level, func.count(LogEntry.id)).group_by(LogEntry.level)
    )
    return [{"level": row[0].value, "count": row[1]} for row in result.fetchall()]
