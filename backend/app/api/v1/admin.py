from typing import Annotated, Literal

import asyncpg
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.core.deps import db_pool, require_role
from app.schemas.ai import AIConfigCreate, AIConfigOut, AIConfigUpdate, BalanceRefillRequest
from app.schemas.user import DriverProfileOut, UserOut

router = APIRouter(prefix="/admin", tags=["admin"])


class PendingDriverOut(UserOut):
    driver_profile: DriverProfileOut


class VerifyDecision(BaseModel):
    decision: Literal["approved", "rejected"]


def _mask_key(key: str) -> str:
    if len(key) <= 8:
        return "*" * len(key)
    return f"{key[:4]}{'*' * (len(key) - 8)}{key[-4:]}"


# ---------------------------------------------------------------------------
# Driver verification
# ---------------------------------------------------------------------------


@router.get("/drivers/pending", response_model=list[PendingDriverOut])
async def pending_drivers(
    _admin: Annotated[asyncpg.Record, Depends(require_role("admin"))],
    pool: Annotated[asyncpg.Pool, Depends(db_pool)],
):
    rows = await pool.fetch(
        """
        SELECT u.*, row_to_json(dp) AS driver_profile
        FROM users u
        JOIN driver_profiles dp ON dp.user_id = u.id
        WHERE u.role = 'driver' AND u.status = 'pending'
        ORDER BY u.created_at ASC
        """
    )
    result = []
    for r in rows:
        d = dict(r)
        profile = d.pop("driver_profile")
        result.append(PendingDriverOut(**d, driver_profile=DriverProfileOut(**profile)))
    return result


@router.post("/drivers/{driver_id}/verify", response_model=UserOut)
async def verify_driver(
    driver_id: int,
    payload: VerifyDecision,
    _admin: Annotated[asyncpg.Record, Depends(require_role("admin"))],
    pool: Annotated[asyncpg.Pool, Depends(db_pool)],
):
    row = await pool.fetchrow(
        "UPDATE users SET status = $1 WHERE id = $2 AND role = 'driver' RETURNING *",
        payload.decision,
        driver_id,
    )
    if not row:
        raise HTTPException(status_code=404, detail="Haydovchi topilmadi")
    return UserOut(**dict(row))


# ---------------------------------------------------------------------------
# Manual balance refill
# ---------------------------------------------------------------------------


@router.post("/balance/refill", response_model=UserOut)
async def refill_balance(
    payload: BalanceRefillRequest,
    admin: Annotated[asyncpg.Record, Depends(require_role("admin"))],
    pool: Annotated[asyncpg.Pool, Depends(db_pool)],
):
    if payload.amount == 0:
        raise HTTPException(status_code=400, detail="Summa 0 bo'lishi mumkin emas")

    async with pool.acquire() as conn:
        async with conn.transaction():
            user = await conn.fetchrow(
                "UPDATE users SET balance = balance + $1 WHERE id = $2 RETURNING *",
                payload.amount,
                payload.user_id,
            )
            if not user:
                raise HTTPException(status_code=404, detail="Foydalanuvchi topilmadi")
            await conn.execute(
                """
                INSERT INTO balance_transactions (user_id, admin_id, amount, type, note)
                VALUES ($1, $2, $3, $4, $5)
                """,
                payload.user_id,
                admin["id"],
                payload.amount,
                "refill" if payload.amount > 0 else "deduction",
                payload.note,
            )
    return UserOut(**dict(user))


@router.get("/users", response_model=list[UserOut])
async def list_users(
    _admin: Annotated[asyncpg.Record, Depends(require_role("admin"))],
    pool: Annotated[asyncpg.Pool, Depends(db_pool)],
    role: str | None = None,
):
    if role:
        rows = await pool.fetch("SELECT * FROM users WHERE role = $1 ORDER BY created_at DESC", role)
    else:
        rows = await pool.fetch("SELECT * FROM users ORDER BY created_at DESC")
    return [UserOut(**dict(r)) for r in rows]


# ---------------------------------------------------------------------------
# Failover AI engine management
# ---------------------------------------------------------------------------


@router.get("/ai-configs", response_model=list[AIConfigOut])
async def list_ai_configs(
    _admin: Annotated[asyncpg.Record, Depends(require_role("admin"))],
    pool: Annotated[asyncpg.Pool, Depends(db_pool)],
):
    rows = await pool.fetch("SELECT * FROM ai_configs ORDER BY priority ASC, id ASC")
    return [AIConfigOut(**{**dict(r), "masked_key": _mask_key(r["api_key"])}) for r in rows]


@router.post("/ai-configs", response_model=AIConfigOut, status_code=201)
async def create_ai_config(
    payload: AIConfigCreate,
    _admin: Annotated[asyncpg.Record, Depends(require_role("admin"))],
    pool: Annotated[asyncpg.Pool, Depends(db_pool)],
):
    row = await pool.fetchrow(
        """
        INSERT INTO ai_configs (provider, api_key, label, priority, is_active)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
        """,
        payload.provider,
        payload.api_key,
        payload.label,
        payload.priority,
        payload.is_active,
    )
    return AIConfigOut(**{**dict(row), "masked_key": _mask_key(row["api_key"])})


@router.patch("/ai-configs/{config_id}", response_model=AIConfigOut)
async def update_ai_config(
    config_id: int,
    payload: AIConfigUpdate,
    _admin: Annotated[asyncpg.Record, Depends(require_role("admin"))],
    pool: Annotated[asyncpg.Pool, Depends(db_pool)],
):
    existing = await pool.fetchrow("SELECT * FROM ai_configs WHERE id = $1", config_id)
    if not existing:
        raise HTTPException(status_code=404, detail="AI konfiguratsiya topilmadi")

    updates = payload.model_dump(exclude_unset=True)
    if not updates:
        return AIConfigOut(**{**dict(existing), "masked_key": _mask_key(existing["api_key"])})

    set_clauses = []
    values = []
    for i, (key, value) in enumerate(updates.items(), start=1):
        set_clauses.append(f"{key} = ${i}")
        values.append(value)
    values.append(config_id)

    row = await pool.fetchrow(
        f"UPDATE ai_configs SET {', '.join(set_clauses)} WHERE id = ${len(values)} RETURNING *",
        *values,
    )
    return AIConfigOut(**{**dict(row), "masked_key": _mask_key(row["api_key"])})


@router.delete("/ai-configs/{config_id}", status_code=204)
async def delete_ai_config(
    config_id: int,
    _admin: Annotated[asyncpg.Record, Depends(require_role("admin"))],
    pool: Annotated[asyncpg.Pool, Depends(db_pool)],
):
    result = await pool.execute("DELETE FROM ai_configs WHERE id = $1", config_id)
    if result == "DELETE 0":
        raise HTTPException(status_code=404, detail="AI konfiguratsiya topilmadi")
