from fastapi import Depends, HTTPException, status

from app.core.auth import get_current_user
from app.models.user import User


def require_role(*roles: str):
    async def check_role(user: User = Depends(get_current_user)) -> User:
        if user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{user.role}' not authorized. Required: {list(roles)}",
            )
        return user
    return check_role


require_admin = require_role("admin")
require_operator = require_role("admin", "operator")
require_viewer = require_role("admin", "operator", "viewer")
