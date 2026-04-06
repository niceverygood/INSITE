import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.core.permissions import require_operator
from app.database import get_db
from app.models.alert import Alert, AlertRule, AlertStatus, AlertSeverity
from app.models.user import User
from app.schemas.alert import AlertResponse, AlertRuleCreate, AlertRuleUpdate, AlertRuleResponse

router = APIRouter()


@router.get("/", response_model=list[AlertResponse])
async def list_alerts(
    alert_status: AlertStatus | None = Query(None, alias="status"),
    severity: AlertSeverity | None = None,
    asset_id: uuid.UUID | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    query = select(Alert)
    if alert_status:
        query = query.where(Alert.status == alert_status)
    if severity:
        query = query.where(Alert.severity == severity)
    if asset_id:
        query = query.where(Alert.asset_id == asset_id)
    query = query.order_by(Alert.fired_at.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/active", response_model=list[AlertResponse])
async def get_active_alerts(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    result = await db.execute(
        select(Alert).where(Alert.status == "firing").order_by(Alert.fired_at.desc())
    )
    return result.scalars().all()


@router.put("/{alert_id}/acknowledge", response_model=AlertResponse)
async def acknowledge_alert(alert_id: uuid.UUID, db: AsyncSession = Depends(get_db), user: User = Depends(require_operator)):
    result = await db.execute(select(Alert).where(Alert.id == alert_id))
    alert = result.scalar_one_or_none()
    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")
    alert.status = "acknowledged"
    alert.acknowledged_at = datetime.now(timezone.utc)
    alert.acknowledged_by = user.username
    await db.commit()
    await db.refresh(alert)
    return alert


@router.put("/{alert_id}/resolve", response_model=AlertResponse)
async def resolve_alert(alert_id: uuid.UUID, db: AsyncSession = Depends(get_db), user: User = Depends(require_operator)):
    result = await db.execute(select(Alert).where(Alert.id == alert_id))
    alert = result.scalar_one_or_none()
    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")
    alert.status = "resolved"
    alert.resolved_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(alert)
    return alert


# Alert Rules CRUD
@router.get("/rules", response_model=list[AlertRuleResponse])
async def list_rules(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    result = await db.execute(select(AlertRule).order_by(AlertRule.name))
    return result.scalars().all()


@router.post("/rules", response_model=AlertRuleResponse, status_code=status.HTTP_201_CREATED)
async def create_rule(body: AlertRuleCreate, db: AsyncSession = Depends(get_db), user: User = Depends(require_operator)):
    rule = AlertRule(**body.model_dump())
    db.add(rule)
    await db.commit()
    await db.refresh(rule)
    return rule


@router.put("/rules/{rule_id}", response_model=AlertRuleResponse)
async def update_rule(rule_id: uuid.UUID, body: AlertRuleUpdate, db: AsyncSession = Depends(get_db), user: User = Depends(require_operator)):
    result = await db.execute(select(AlertRule).where(AlertRule.id == rule_id))
    rule = result.scalar_one_or_none()
    if not rule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rule not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(rule, field, value)
    await db.commit()
    await db.refresh(rule)
    return rule


@router.delete("/rules/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_rule(rule_id: uuid.UUID, db: AsyncSession = Depends(get_db), user: User = Depends(require_operator)):
    result = await db.execute(select(AlertRule).where(AlertRule.id == rule_id))
    rule = result.scalar_one_or_none()
    if not rule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rule not found")
    await db.delete(rule)
    await db.commit()
