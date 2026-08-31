from typing import Annotated

import asyncpg
from fastapi import APIRouter, Depends

from app.core.deps import db_pool
from app.schemas.subscription import LiveMapPoint, LiveMapResponse

router = APIRouter(prefix="/public", tags=["public"])


@router.get("/live-map", response_model=LiveMapResponse)
async def live_map(pool: Annotated[asyncpg.Pool, Depends(db_pool)]):
    """Aggregated, real (not fake/random) counts of currently-available drivers
    per city, driven straight off today's driver_daily_status rows. Powers the
    landing page's live network map widget."""
    rows = await pool.fetch(
        """
        SELECT current_location AS city, COUNT(*) AS available_count
        FROM driver_daily_status
        WHERE status = 'available' AND date = CURRENT_DATE
        GROUP BY current_location
        ORDER BY available_count DESC
        """
    )
    total_verified = await pool.fetchval(
        "SELECT COUNT(*) FROM users WHERE role = 'driver' AND status = 'approved'"
    )
    return LiveMapResponse(
        points=[LiveMapPoint(**dict(r)) for r in rows],
        total_available=sum(r["available_count"] for r in rows),
        total_verified_drivers=total_verified or 0,
    )
