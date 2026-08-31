from typing import Annotated

import asyncpg
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from app.core.security import decode_access_token
from app.db.pool import get_pool

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


def db_pool() -> asyncpg.Pool:
    return get_pool()


async def get_current_user(
    token: Annotated[str | None, Depends(oauth2_scheme)],
    pool: Annotated[asyncpg.Pool, Depends(db_pool)],
) -> asyncpg.Record:
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Avtorizatsiyadan o'tilmagan yoki token yaroqsiz",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_error

    payload = decode_access_token(token)
    if payload is None:
        raise credentials_error

    user_id = payload.get("sub")
    if user_id is None:
        raise credentials_error

    user = await pool.fetchrow("SELECT * FROM users WHERE id = $1", int(user_id))
    if user is None:
        raise credentials_error
    return user


def require_role(*roles: str):
    async def checker(
        user: Annotated[asyncpg.Record, Depends(get_current_user)],
    ) -> asyncpg.Record:
        if user["role"] not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Bu amal uchun ruxsatingiz yo'q",
            )
        return user

    return checker


def require_approved(
    user: Annotated[asyncpg.Record, Depends(get_current_user)],
) -> asyncpg.Record:
    if user["role"] != "admin" and user["status"] != "approved":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Profilingiz hali admin tomonidan tasdiqlanmagan",
        )
    return user
