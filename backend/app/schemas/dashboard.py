from pydantic import BaseModel


class DashboardSummary(BaseModel):
    total_assets: int
    normal_count: int
    warning_count: int
    down_count: int
    active_alerts: int
    critical_alerts: int
    warning_alerts: int


class StatusMatrixItem(BaseModel):
    asset_id: str
    asset_name: str
    asset_type: str
    status: str
    cpu: float | None = None
    memory: float | None = None
    disk: float | None = None


class StatusMatrix(BaseModel):
    items: list[StatusMatrixItem]
