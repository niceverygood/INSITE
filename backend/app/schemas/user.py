import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr

from app.models.user import UserRole


class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    role: UserRole = UserRole.viewer
    department: str | None = None


class UserResponse(BaseModel):
    id: uuid.UUID
    username: str
    email: str
    role: UserRole
    department: str | None
    last_login: datetime | None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
