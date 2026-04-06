import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class AssetCreate(BaseModel):
    asset_type: str
    name: str = Field(max_length=255)
    ip_address: str = Field(max_length=45)
    mac_address: str | None = None
    location: str | None = None
    floor_map_x: float | None = None
    floor_map_y: float | None = None
    extra_info: dict | None = None


class AssetUpdate(BaseModel):
    name: str | None = None
    ip_address: str | None = None
    mac_address: str | None = None
    location: str | None = None
    floor_map_x: float | None = None
    floor_map_y: float | None = None
    status: str | None = None
    extra_info: dict | None = None


class AssetResponse(BaseModel):
    id: uuid.UUID
    asset_type: str
    name: str
    ip_address: str
    mac_address: str | None = None
    location: str | None = None
    floor_map_x: float | None = None
    floor_map_y: float | None = None
    status: str
    last_heartbeat: datetime | None = None
    extra_info: dict | None = None
    created_at: datetime
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}


class AssetListResponse(BaseModel):
    items: list[AssetResponse]
    total: int
    page: int
    page_size: int
