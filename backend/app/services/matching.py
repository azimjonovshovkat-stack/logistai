import re
import time

import asyncpg

from app.services.ai_engine import ParsedQuery, parse_query_with_failover
from app.services.cities import find_cities_in_text

_TON_RE = re.compile(r"(\d+(?:[.,]\d+)?)\s*(?:tonna|t\b|тонна)", re.IGNORECASE)


def _fallback_parse(text: str) -> ParsedQuery:
    """Deterministic, hallucination-free parser used when no AI provider is
    configured/available, or the AI call is too slow/fails. Only ever picks
    city names that literally appear in our known city list."""
    cities = find_cities_in_text(text)
    origin = cities[0] if len(cities) >= 1 else None
    destination = cities[1] if len(cities) >= 2 else None

    ton_match = _TON_RE.search(text)
    min_capacity = float(ton_match.group(1).replace(",", ".")) if ton_match else None

    return ParsedQuery(
        origin=origin,
        destination=destination,
        min_capacity_tons=min_capacity,
        cargo_type=None,
    )


def _mask_phone(phone: str) -> str:
    """Keeps country/operator prefix and last 2 digits visible, hides the rest
    behind a subscription paywall (spec: contact info only for subscribers)."""
    digits = phone
    if len(digits) <= 6:
        return "*" * len(digits)
    return f"{digits[:5]}{'*' * (len(digits) - 7)}{digits[-2:]}"


async def search_drivers(pool: asyncpg.Pool, user_query: str, has_subscription: bool) -> dict:
    start = time.perf_counter()

    parsed, source_reason = await parse_query_with_failover(pool, user_query)
    source = "ai"
    if parsed is None:
        parsed = _fallback_parse(user_query)
        source = "fallback_keyword"

    conditions = ["u.status = 'approved'", "ds.status = 'available'", "ds.date = CURRENT_DATE"]
    params: list = []

    if parsed.origin:
        params.append(f"%{parsed.origin}%")
        conditions.append(f"ds.current_location ILIKE ${len(params)}")

    if parsed.destination:
        params.append(f"%{parsed.destination}%")
        conditions.append(f"ds.destination_location ILIKE ${len(params)}")

    if parsed.min_capacity_tons:
        params.append(parsed.min_capacity_tons)
        conditions.append(f"dp.capacity_tons >= ${len(params)}")

    where_clause = " AND ".join(conditions)
    sql = f"""
        SELECT
            u.id AS driver_id, u.full_name, u.phone,
            dp.rating, dp.car_name, dp.car_number, dp.capacity_tons,
            ds.current_location, ds.destination_location
        FROM driver_daily_status ds
        JOIN users u ON u.id = ds.driver_id
        JOIN driver_profiles dp ON dp.user_id = u.id
        WHERE {where_clause}
        ORDER BY dp.rating DESC, ds.updated_at DESC
        LIMIT 20
    """
    rows = await pool.fetch(sql, *params)
    elapsed_ms = int((time.perf_counter() - start) * 1000)

    message = None
    if not rows:
        message = (
            "Ma'lumotlar bazasida so'rovingizga mos haydovchi topilmadi. "
            "Iltimos, shahar nomini yoki yuk hajmini aniqroq kiriting."
        )

    matches = []
    for r in rows:
        m = dict(r)
        if not has_subscription:
            m["phone"] = _mask_phone(m["phone"])
        matches.append(m)

    return {
        "matches": matches,
        "subscription_active": has_subscription,
        "parsed_query": {
            "origin": parsed.origin,
            "destination": parsed.destination,
            "min_capacity_tons": parsed.min_capacity_tons,
            "cargo_type": parsed.cargo_type,
        },
        "source": source,
        "elapsed_ms": elapsed_ms,
        "message": message,
    }
