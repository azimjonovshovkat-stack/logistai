from datetime import datetime, timedelta
from typing import Annotated

import asyncpg
from fastapi import APIRouter, Depends, HTTPException

from app.core.config import get_settings
from app.core.deps import db_pool, require_approved, require_role
from app.schemas.ai import BookDriverRequest, SearchRequest, SearchResponse
from app.schemas.driver import OrderOut, RateOrderRequest
from app.schemas.subscription import (
    DriverReviewOut,
    DriverReviewsResponse,
    SubscriptionOut,
    TransactionOut,
)
from app.services.matching import search_drivers

router = APIRouter(prefix="/shippers", tags=["shippers"])
settings = get_settings()


def _utcnow() -> datetime:
    """Naive UTC now, matching the naive TIMESTAMP columns Postgres NOW() writes."""
    return datetime.utcnow()


def _days_remaining(end_date: datetime) -> int:
    delta = end_date - _utcnow()
    return max(delta.days, 0)


async def _active_subscription(pool: asyncpg.Pool, user_id: int) -> asyncpg.Record | None:
    return await pool.fetchrow(
        """
        SELECT * FROM subscriptions
        WHERE user_id = $1 AND is_active = TRUE AND end_date > NOW()
        ORDER BY end_date DESC LIMIT 1
        """,
        user_id,
    )


@router.post("/search", response_model=SearchResponse)
async def ai_search(
    payload: SearchRequest,
    user: Annotated[asyncpg.Record, Depends(require_role("shipper"))],
    pool: Annotated[asyncpg.Pool, Depends(db_pool)],
):
    sub = await _active_subscription(pool, user["id"])
    result = await search_drivers(pool, payload.query, has_subscription=sub is not None)
    return SearchResponse(**result)


@router.get("/subscription", response_model=SubscriptionOut)
async def get_subscription(
    user: Annotated[asyncpg.Record, Depends(require_role("shipper"))],
    pool: Annotated[asyncpg.Pool, Depends(db_pool)],
):
    sub = await _active_subscription(pool, user["id"])
    if not sub:
        return SubscriptionOut(
            is_active=False,
            start_date=None,
            end_date=None,
            days_remaining=0,
            duration_days=settings.subscription_duration_days,
            price_monthly=settings.subscription_price_monthly,
        )
    return SubscriptionOut(
        is_active=True,
        start_date=sub["start_date"],
        end_date=sub["end_date"],
        days_remaining=_days_remaining(sub["end_date"]),
        duration_days=settings.subscription_duration_days,
        price_monthly=settings.subscription_price_monthly,
    )


@router.post("/subscription/purchase", response_model=SubscriptionOut, status_code=201)
async def purchase_subscription(
    user: Annotated[asyncpg.Record, Depends(require_role("shipper"))],
    pool: Annotated[asyncpg.Pool, Depends(db_pool)],
):
    price = settings.subscription_price_monthly
    async with pool.acquire() as conn:
        async with conn.transaction():
            fresh_user = await conn.fetchrow("SELECT balance FROM users WHERE id = $1 FOR UPDATE", user["id"])
            if fresh_user["balance"] < price:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"Balansingizda mablag' yetarli emas. Obuna narxi: "
                        f"{price:,.0f} so'm. Admin orqali balansingizni to'ldiring."
                    ),
                )
            await conn.execute(
                "UPDATE users SET balance = balance - $1 WHERE id = $2", price, user["id"]
            )
            await conn.execute(
                """
                INSERT INTO balance_transactions (user_id, admin_id, amount, type, note)
                VALUES ($1, NULL, $2, 'deduction', 'Obuna sotib olindi (30 kun)')
                """,
                user["id"],
                price,
            )

            existing = await _active_subscription_locked(conn, user["id"])
            base_start = existing["end_date"] if existing else _utcnow()
            new_end = base_start + timedelta(days=settings.subscription_duration_days)

            if existing:
                sub = await conn.fetchrow(
                    "UPDATE subscriptions SET end_date = $1 WHERE id = $2 RETURNING *",
                    new_end,
                    existing["id"],
                )
            else:
                sub = await conn.fetchrow(
                    """
                    INSERT INTO subscriptions (user_id, start_date, end_date, is_active)
                    VALUES ($1, NOW(), $2, TRUE)
                    RETURNING *
                    """,
                    user["id"],
                    new_end,
                )

    return SubscriptionOut(
        is_active=True,
        start_date=sub["start_date"],
        end_date=sub["end_date"],
        days_remaining=_days_remaining(sub["end_date"]),
        duration_days=settings.subscription_duration_days,
        price_monthly=price,
    )


async def _active_subscription_locked(conn, user_id: int) -> asyncpg.Record | None:
    return await conn.fetchrow(
        """
        SELECT * FROM subscriptions
        WHERE user_id = $1 AND is_active = TRUE AND end_date > NOW()
        ORDER BY end_date DESC LIMIT 1
        """,
        user_id,
    )


@router.get("/transactions", response_model=list[TransactionOut])
async def my_transactions(
    user: Annotated[asyncpg.Record, Depends(require_role("shipper"))],
    pool: Annotated[asyncpg.Pool, Depends(db_pool)],
):
    rows = await pool.fetch(
        """
        SELECT id, amount, type, note, created_at
        FROM balance_transactions
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT 50
        """,
        user["id"],
    )
    return [TransactionOut(**dict(r)) for r in rows]


@router.get("/drivers/{driver_id}/reviews", response_model=DriverReviewsResponse)
async def driver_reviews(
    driver_id: int,
    _user: Annotated[asyncpg.Record, Depends(require_role("shipper"))],
    pool: Annotated[asyncpg.Pool, Depends(db_pool)],
):
    driver = await pool.fetchrow(
        """
        SELECT u.id, u.full_name, dp.rating, dp.car_name, dp.car_number, dp.capacity_tons
        FROM users u
        JOIN driver_profiles dp ON dp.user_id = u.id
        WHERE u.id = $1 AND u.role = 'driver'
        """,
        driver_id,
    )
    if not driver:
        raise HTTPException(status_code=404, detail="Haydovchi topilmadi")

    rows = await pool.fetch(
        """
        SELECT o.rating, o.rating_comment AS comment, o.completed_at AS created_at,
               s.full_name AS reviewer_name
        FROM cargo_orders o
        JOIN users s ON s.id = o.shipper_id
        WHERE o.driver_id = $1 AND o.rating IS NOT NULL
        ORDER BY o.completed_at DESC
        LIMIT 20
        """,
        driver_id,
    )
    reviews = [
        DriverReviewOut(
            rating=r["rating"],
            comment=r["comment"],
            # first name + masked surname initial keeps some privacy while still feeling human
            reviewer_name=_mask_reviewer_name(r["reviewer_name"]),
            created_at=r["created_at"],
        )
        for r in rows
    ]
    return DriverReviewsResponse(
        driver_id=driver["id"],
        full_name=driver["full_name"],
        rating=driver["rating"],
        total_reviews=len(reviews),
        car_name=driver["car_name"],
        car_number=driver["car_number"],
        capacity_tons=driver["capacity_tons"],
        reviews=reviews,
    )


def _mask_reviewer_name(full_name: str) -> str:
    parts = full_name.strip().split()
    if len(parts) < 2:
        return full_name
    return f"{parts[0]} {parts[1][0]}."


@router.post("/book", response_model=OrderOut, status_code=201)
async def book_driver(
    payload: BookDriverRequest,
    user: Annotated[asyncpg.Record, Depends(require_role("shipper"))],
    _approved: Annotated[asyncpg.Record, Depends(require_approved)],
    pool: Annotated[asyncpg.Pool, Depends(db_pool)],
):
    driver = await pool.fetchrow(
        "SELECT id FROM users WHERE id = $1 AND role = 'driver' AND status = 'approved'",
        payload.driver_id,
    )
    if not driver:
        raise HTTPException(status_code=404, detail="Haydovchi topilmadi yoki hali tasdiqlanmagan")

    row = await pool.fetchrow(
        """
        INSERT INTO cargo_orders (shipper_id, driver_id, from_location, to_location, cargo_description, weight_tons)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
        """,
        user["id"],
        payload.driver_id,
        payload.from_location,
        payload.to_location,
        payload.cargo_description,
        payload.weight_tons,
    )
    return OrderOut(**dict(row), shipper_name=user["full_name"])


@router.get("/orders", response_model=list[OrderOut])
async def my_orders(
    user: Annotated[asyncpg.Record, Depends(require_role("shipper"))],
    pool: Annotated[asyncpg.Pool, Depends(db_pool)],
):
    rows = await pool.fetch(
        """
        SELECT o.*, s.full_name AS shipper_name
        FROM cargo_orders o
        JOIN users s ON s.id = o.shipper_id
        WHERE o.shipper_id = $1
        ORDER BY o.created_at DESC
        """,
        user["id"],
    )
    return [OrderOut(**dict(r)) for r in rows]


@router.post("/orders/{order_id}/rate", response_model=OrderOut)
async def rate_order(
    order_id: int,
    payload: RateOrderRequest,
    user: Annotated[asyncpg.Record, Depends(require_role("shipper"))],
    pool: Annotated[asyncpg.Pool, Depends(db_pool)],
):
    order = await pool.fetchrow(
        "SELECT * FROM cargo_orders WHERE id = $1 AND shipper_id = $2", order_id, user["id"]
    )
    if not order:
        raise HTTPException(status_code=404, detail="Buyurtma topilmadi")
    if order["status"] != "completed":
        raise HTTPException(status_code=400, detail="Faqat yakunlangan buyurtmaga baho qo'yish mumkin")
    if order["rating"] is not None:
        raise HTTPException(status_code=400, detail="Bu buyurtmaga allaqachon baho qo'yilgan")

    async with pool.acquire() as conn:
        async with conn.transaction():
            row = await conn.fetchrow(
                """
                UPDATE cargo_orders SET rating = $1, rating_comment = $2
                WHERE id = $3
                RETURNING *
                """,
                payload.rating,
                payload.comment,
                order_id,
            )
            avg = await conn.fetchval(
                "SELECT AVG(rating)::numeric(3,2) FROM cargo_orders WHERE driver_id = $1 AND rating IS NOT NULL",
                order["driver_id"],
            )
            await conn.execute(
                "UPDATE driver_profiles SET rating = $1 WHERE user_id = $2",
                avg,
                order["driver_id"],
            )
    return OrderOut(**dict(row), shipper_name=user["full_name"])


@router.post("/orders/{order_id}/cancel", response_model=OrderOut)
async def cancel_order(
    order_id: int,
    user: Annotated[asyncpg.Record, Depends(require_role("shipper"))],
    pool: Annotated[asyncpg.Pool, Depends(db_pool)],
):
    order = await pool.fetchrow(
        "SELECT * FROM cargo_orders WHERE id = $1 AND shipper_id = $2", order_id, user["id"]
    )
    if not order:
        raise HTTPException(status_code=404, detail="Buyurtma topilmadi")
    if order["status"] != "pending":
        raise HTTPException(
            status_code=400,
            detail="Faqat hali qabul qilinmagan (kutilayotgan) buyurtmani bekor qilish mumkin",
        )

    row = await pool.fetchrow(
        "UPDATE cargo_orders SET status = 'cancelled' WHERE id = $1 RETURNING *",
        order_id,
    )
    return OrderOut(**dict(row), shipper_name=user["full_name"])
