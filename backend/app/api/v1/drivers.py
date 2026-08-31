from datetime import date, timedelta
from typing import Annotated

import asyncpg
from fastapi import APIRouter, Depends, HTTPException

from app.core.deps import db_pool, require_approved, require_role
from app.schemas.driver import (
    DailyStatusOut,
    OrderOut,
    OrderStatusUpdateRequest,
    StatusUpdateRequest,
)
from app.schemas.user import DriverProfileOut, DriverProfileUpdateRequest

router = APIRouter(prefix="/drivers", tags=["drivers"])


@router.put("/status", response_model=DailyStatusOut)
async def update_status(
    payload: StatusUpdateRequest,
    user: Annotated[asyncpg.Record, Depends(require_role("driver"))],
    _approved: Annotated[asyncpg.Record, Depends(require_approved)],
    pool: Annotated[asyncpg.Pool, Depends(db_pool)],
):
    row = await pool.fetchrow(
        """
        INSERT INTO driver_daily_status (driver_id, date, current_location, destination_location, status)
        VALUES ($1, CURRENT_DATE, $2, $3, $4)
        ON CONFLICT (driver_id, date)
        DO UPDATE SET
            current_location = EXCLUDED.current_location,
            destination_location = EXCLUDED.destination_location,
            status = EXCLUDED.status,
            updated_at = NOW()
        RETURNING *
        """,
        user["id"],
        payload.current_location,
        payload.destination_location,
        payload.status,
    )
    return DailyStatusOut(**dict(row))


@router.patch("/profile", response_model=DriverProfileOut)
async def update_driver_profile(
    payload: DriverProfileUpdateRequest,
    user: Annotated[asyncpg.Record, Depends(require_role("driver"))],
    pool: Annotated[asyncpg.Pool, Depends(db_pool)],
):
    updates = payload.model_dump(exclude_unset=True, exclude_none=True)
    if not updates:
        row = await pool.fetchrow("SELECT * FROM driver_profiles WHERE user_id = $1", user["id"])
        return DriverProfileOut(**dict(row))

    set_clauses = []
    values = []
    for i, (key, value) in enumerate(updates.items(), start=1):
        set_clauses.append(f"{key} = ${i}")
        values.append(value)
    values.append(user["id"])

    row = await pool.fetchrow(
        f"UPDATE driver_profiles SET {', '.join(set_clauses)} WHERE user_id = ${len(values)} RETURNING *",
        *values,
    )
    if not row:
        raise HTTPException(status_code=404, detail="Haydovchi profili topilmadi")
    return DriverProfileOut(**dict(row))


@router.get("/status/today", response_model=DailyStatusOut | None)
async def get_today_status(
    user: Annotated[asyncpg.Record, Depends(require_role("driver"))],
    pool: Annotated[asyncpg.Pool, Depends(db_pool)],
):
    row = await pool.fetchrow(
        "SELECT * FROM driver_daily_status WHERE driver_id = $1 AND date = CURRENT_DATE",
        user["id"],
    )
    return DailyStatusOut(**dict(row)) if row else None


@router.get("/orders", response_model=list[OrderOut])
async def my_orders(
    user: Annotated[asyncpg.Record, Depends(require_role("driver"))],
    pool: Annotated[asyncpg.Pool, Depends(db_pool)],
):
    rows = await pool.fetch(
        """
        SELECT o.*, s.full_name AS shipper_name, s.phone AS shipper_phone
        FROM cargo_orders o
        JOIN users s ON s.id = o.shipper_id
        WHERE o.driver_id = $1
        ORDER BY o.created_at DESC
        """,
        user["id"],
    )
    return [OrderOut(**dict(r)) for r in rows]


@router.get("/status/history", response_model=list[DailyStatusOut])
async def status_history(
    user: Annotated[asyncpg.Record, Depends(require_role("driver"))],
    pool: Annotated[asyncpg.Pool, Depends(db_pool)],
    days: int = 7,
):
    days = max(1, min(days, 30))
    since = date.today() - timedelta(days=days - 1)
    rows = await pool.fetch(
        """
        SELECT * FROM driver_daily_status
        WHERE driver_id = $1 AND date >= $2
        ORDER BY date ASC
        """,
        user["id"],
        since,
    )
    return [DailyStatusOut(**dict(r)) for r in rows]


@router.patch("/orders/{order_id}/status", response_model=OrderOut)
async def update_order_status(
    order_id: int,
    payload: OrderStatusUpdateRequest,
    user: Annotated[asyncpg.Record, Depends(require_role("driver"))],
    pool: Annotated[asyncpg.Pool, Depends(db_pool)],
):
    order = await pool.fetchrow(
        "SELECT * FROM cargo_orders WHERE id = $1 AND driver_id = $2", order_id, user["id"]
    )
    if not order:
        raise HTTPException(status_code=404, detail="Buyurtma topilmadi")

    async with pool.acquire() as conn:
        async with conn.transaction():
            completed_at_clause = ", completed_at = NOW()" if payload.status == "completed" else ""
            row = await conn.fetchrow(
                f"""
                UPDATE cargo_orders SET status = $1 {completed_at_clause}
                WHERE id = $2
                RETURNING *
                """,
                payload.status,
                order_id,
            )
            if payload.status == "accepted":
                # spec: accepting a job ("BUYURTMANI OLDIM") auto-flips the driver to
                # 'busy' (Band) so they stop showing up in other shippers' searches
                await conn.execute(
                    """
                    UPDATE driver_daily_status SET status = 'busy', updated_at = NOW()
                    WHERE driver_id = $1 AND date = CURRENT_DATE
                    """,
                    user["id"],
                )
            shipper = await conn.fetchrow(
                "SELECT full_name, phone FROM users WHERE id = $1", row["shipper_id"]
            )
    return OrderOut(
        **dict(row),
        shipper_name=shipper["full_name"] if shipper else None,
        shipper_phone=shipper["phone"] if shipper else None,
    )
