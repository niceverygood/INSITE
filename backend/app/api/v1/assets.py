import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.core.permissions import require_operator
from app.database import get_db
from app.models.asset import Asset, AssetType, AssetStatus
from app.models.user import User
from app.schemas.asset import AssetCreate, AssetUpdate, AssetResponse, AssetListResponse

router = APIRouter()


@router.get("/", response_model=AssetListResponse)
async def list_assets(
    asset_type: AssetType | None = None,
    asset_status: AssetStatus | None = Query(None, alias="status"),
    location: str | None = None,
    search: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    query = select(Asset)
    count_query = select(func.count(Asset.id))

    if asset_type:
        query = query.where(Asset.asset_type == asset_type)
        count_query = count_query.where(Asset.asset_type == asset_type)
    if asset_status:
        query = query.where(Asset.status == asset_status)
        count_query = count_query.where(Asset.status == asset_status)
    if location:
        query = query.where(Asset.location.ilike(f"%{location}%"))
        count_query = count_query.where(Asset.location.ilike(f"%{location}%"))
    if search:
        query = query.where(Asset.name.ilike(f"%{search}%") | Asset.ip_address.ilike(f"%{search}%"))
        count_query = count_query.where(Asset.name.ilike(f"%{search}%") | Asset.ip_address.ilike(f"%{search}%"))

    total = (await db.execute(count_query)).scalar()
    result = await db.execute(query.offset((page - 1) * page_size).limit(page_size).order_by(Asset.name))
    items = result.scalars().all()

    return AssetListResponse(items=items, total=total, page=page, page_size=page_size)


@router.get("/topology")
async def get_topology(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    result = await db.execute(select(Asset).where(Asset.asset_type == AssetType.network_device))
    devices = result.scalars().all()
    nodes = [{"id": str(d.id), "name": d.name, "ip": d.ip_address, "status": d.status if isinstance(d.status, str) else d.status.value, "x": d.floor_map_x, "y": d.floor_map_y} for d in devices]
    return {"nodes": nodes, "links": []}


@router.get("/{asset_id}", response_model=AssetResponse)
async def get_asset(asset_id: uuid.UUID, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    result = await db.execute(select(Asset).where(Asset.id == asset_id))
    asset = result.scalar_one_or_none()
    if not asset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found")
    return asset


@router.post("/", response_model=AssetResponse, status_code=status.HTTP_201_CREATED)
async def create_asset(body: AssetCreate, db: AsyncSession = Depends(get_db), user: User = Depends(require_operator)):
    asset = Asset(**body.model_dump(by_alias=False, exclude_unset=True))
    db.add(asset)
    await db.commit()
    await db.refresh(asset)
    return asset


@router.put("/{asset_id}", response_model=AssetResponse)
async def update_asset(asset_id: uuid.UUID, body: AssetUpdate, db: AsyncSession = Depends(get_db), user: User = Depends(require_operator)):
    result = await db.execute(select(Asset).where(Asset.id == asset_id))
    asset = result.scalar_one_or_none()
    if not asset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found")

    for field, value in body.model_dump(exclude_unset=True, by_alias=False).items():
        setattr(asset, field, value)
    await db.commit()
    await db.refresh(asset)
    return asset


@router.delete("/{asset_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_asset(asset_id: uuid.UUID, db: AsyncSession = Depends(get_db), user: User = Depends(require_operator)):
    result = await db.execute(select(Asset).where(Asset.id == asset_id))
    asset = result.scalar_one_or_none()
    if not asset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found")
    await db.delete(asset)
    await db.commit()
