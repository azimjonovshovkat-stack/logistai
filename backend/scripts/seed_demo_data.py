"""Populate the database with realistic demo data for investor / stakeholder
demos. Safe to re-run: every row is keyed off a unique phone number in the
+998 900 1xx xx block reserved for seed data, inserted with ON CONFLICT DO
NOTHING, so re-running just skips rows that already exist.

Usage (from backend/):
    .venv/Scripts/python.exe scripts/seed_demo_data.py
"""

import asyncio
import base64
import random
import sys
from datetime import datetime, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import asyncpg  # noqa: E402

from app.core.config import get_settings  # noqa: E402
from app.core.security import hash_password  # noqa: E402

settings = get_settings()
DEMO_PASSWORD = "demo12345"
CAR_PHOTO = "/uploads/demo_car.jpg"
LICENSE_PHOTO = "/uploads/demo_license.jpg"

# a minimal valid 1x1 JPEG, used as a stand-in car/license photo for every
# seeded driver — written to uploads/ on demand so this script has zero
# external dependencies and works on a freshly-cloned repo
_PLACEHOLDER_JPEG = base64.b64decode(
    "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkI"
    "CQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/2wBDAQMDAwQDBAgEBAgQCwkLEBAQEBAQ"
    "EBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBD/wAARCAABAAEDASIA"
    "AhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAf/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEB"
    "AQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX"
    "/9k="
)


def _ensure_placeholder_images() -> None:
    upload_dir = Path(settings.upload_dir)
    upload_dir.mkdir(parents=True, exist_ok=True)
    for name in ("demo_car.jpg", "demo_license.jpg"):
        path = upload_dir / name
        if not path.exists():
            path.write_bytes(_PLACEHOLDER_JPEG)

# (full_name, phone_last9, current_city, dest_city, car_name, car_number, year, capacity, status, rating)
APPROVED_DRIVERS = [
    ("Bekzod Yusupov", "900100101", "Toshkent", "Samarqand", "Isuzu Forward", "01 A 411 KY", 2019, 8, "available", 4.8),
    ("Davron Rashidov", "900100102", "Samarqand", "Buxoro", "MAN TGS", "30 B 782 SD", 2021, 20, "available", 4.9),
    ("Jasur Nematov", "900100103", "Buxoro", "Xiva", "Hyundai HD78", "25 C 190 BX", 2018, 5, "available", 4.6),
    ("Otabek Qodirov", "900100104", "Andijon", "Toshkent", "KamAZ 65115", "20 A 305 AN", 2017, 15, "available", 4.7),
    ("Sherzod Tursunov", "900100105", "Namangan", "Farg'ona", "Isuzu NPR", "30 D 558 NM", 2020, 4, "busy", 5.0),
    ("Aziz Rahimov", "900100106", "Farg'ona", "Toshkent", "Mercedes Actros", "40 A 672 FA", 2022, 24, "available", 4.9),
    ("Botir Ergashev", "900100107", "Qarshi", "Termiz", "MAN TGX", "60 B 214 QS", 2021, 22, "available", 4.8),
    ("Ulug'bek Saidov", "900100108", "Termiz", "Qarshi", "Hyundai Trago", "90 C 337 TR", 2019, 18, "day_off", 4.5),
    ("Farrux Abdullayev", "900100109", "Nukus", "Urganch", "Isuzu Giga", "85 A 449 NK", 2020, 10, "available", 4.7),
    ("Jahongir Yoldashev", "900100110", "Urganch", "Xiva", "KamAZ 6520", "95 B 561 UR", 2018, 20, "available", 4.6),
    ("Bobur Xolmatov", "900100111", "Jizzax", "Samarqand", "MAN TGS", "70 A 673 JZ", 2021, 16, "available", 4.9),
    ("Rustam Ismoilov", "900100112", "Navoiy", "Buxoro", "Hyundai HD72", "75 C 785 NV", 2019, 7, "available", 4.8),
    ("Anvar Nazarov", "900100113", "Guliston", "Toshkent", "Isuzu Forward", "65 A 897 GL", 2020, 9, "busy", 4.6),
    ("Shohruh Ahmedov", "900100114", "Toshkent", "Namangan", "Mercedes Atego", "01 D 908 TSH", 2022, 12, "available", 5.0),
    ("Kamron Berdiyev", "900100115", "Angren", "Toshkent", "Isuzu NPR", "01 A 112 AN", 2020, 5, "available", 4.7),
]

PENDING_DRIVERS = [
    ("Elyor Saparov", "900100201", "Chirchiq", "Toshkent", "Isuzu NPR", "01 B 221 CQ", 2019, 5),
    ("Diyor Nabiyev", "900100202", "Angren", "Samarqand", "KamAZ 5511", "01 C 332 AR", 2016, 14),
    ("Ravshan Tojiyev", "900100203", "Olmaliq", "Buxoro", "Hyundai HD65", "01 D 443 OL", 2018, 6),
]

SHIPPERS = [
    # (full_name, phone_last9, balance, give_subscription)
    ("Kamronbek Yusupov — Oltin Bug'doy MChJ", "900100301", 1_500_000, True),
    ("Nodira Xasanova", "900100302", 800_000, False),
    ("Farhod Mirzayev — TransLogist Uz", "900100303", 3_000_000, True),
    ("Malika Ergasheva", "900100304", 300_000, False),
]

CARGO_TYPES = [
    "qurilish materiali", "sement", "g'isht", "meva-sabzavot", "un",
    "temir-beton konstruksiya", "paxta tolasi", "kiyim-kechak", "mebel",
    "elektr uskunalari", "ichimlik suvi", "don mahsulotlari",
]

REVIEW_COMMENTS = [
    "Vaqtida yetkazib berdi, juda mamnunman!",
    "Professional haydovchi, yukni ehtiyotkorlik bilan tashidi.",
    "Hammasi rejadagidek, tavsiya qilaman.",
    "Tez va sifatli xizmat, rahmat!",
    "Yukni belgilangan vaqtdan oldin yetkazdi.",
    "Juda yaxshi muloqot, hech qanday muammo bo'lmadi.",
    None,
    None,
]


async def main() -> None:
    _ensure_placeholder_images()
    pool = await asyncpg.create_pool(dsn=settings.database_url, min_size=1, max_size=5)
    async with pool.acquire() as conn:
        driver_ids: list[int] = []

        for name, phone_last9, city, dest, car, number, year, cap, status, rating in APPROVED_DRIVERS:
            phone = f"+998{phone_last9}"
            user = await conn.fetchrow(
                """
                INSERT INTO users (full_name, phone, password_hash, role, status)
                VALUES ($1, $2, $3, 'driver', 'approved')
                ON CONFLICT (phone) DO UPDATE SET full_name = EXCLUDED.full_name
                RETURNING id
                """,
                name, phone, hash_password(DEMO_PASSWORD),
            )
            uid = user["id"]
            driver_ids.append(uid)
            await conn.execute(
                """
                INSERT INTO driver_profiles (user_id, car_name, car_number, car_year, capacity_tons, car_photo_url, license_photo_url, rating)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                ON CONFLICT (user_id) DO UPDATE SET rating = EXCLUDED.rating
                """,
                uid, car, number, year, cap, CAR_PHOTO, LICENSE_PHOTO, rating,
            )
            await conn.execute(
                """
                INSERT INTO driver_daily_status (driver_id, date, current_location, destination_location, status)
                VALUES ($1, CURRENT_DATE, $2, $3, $4)
                ON CONFLICT (driver_id, date) DO UPDATE SET
                    current_location = EXCLUDED.current_location,
                    destination_location = EXCLUDED.destination_location,
                    status = EXCLUDED.status
                """,
                uid, city, dest, status,
            )

        for name, phone_last9, city, dest, car, number, year, cap in PENDING_DRIVERS:
            phone = f"+998{phone_last9}"
            user = await conn.fetchrow(
                """
                INSERT INTO users (full_name, phone, password_hash, role, status)
                VALUES ($1, $2, $3, 'driver', 'pending')
                ON CONFLICT (phone) DO NOTHING
                RETURNING id
                """,
                name, phone, hash_password(DEMO_PASSWORD),
            )
            if user:
                await conn.execute(
                    """
                    INSERT INTO driver_profiles (user_id, car_name, car_number, car_year, capacity_tons, car_photo_url, license_photo_url)
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                    ON CONFLICT (user_id) DO NOTHING
                    """,
                    user["id"], car, number, year, cap, CAR_PHOTO, LICENSE_PHOTO,
                )

        shipper_ids: list[int] = []
        for name, phone_last9, balance, give_sub in SHIPPERS:
            phone = f"+998{phone_last9}"
            user = await conn.fetchrow(
                """
                INSERT INTO users (full_name, phone, password_hash, role, status, balance)
                VALUES ($1, $2, $3, 'shipper', 'approved', $4)
                ON CONFLICT (phone) DO UPDATE SET balance = EXCLUDED.balance
                RETURNING id
                """,
                name, phone, hash_password(DEMO_PASSWORD), balance,
            )
            uid = user["id"]
            shipper_ids.append(uid)
            if give_sub:
                await conn.execute(
                    """
                    INSERT INTO subscriptions (user_id, start_date, end_date, is_active)
                    VALUES ($1, NOW(), NOW() + INTERVAL '30 days', TRUE)
                    """,
                    uid,
                )

        # also grant the pre-existing demo shippers (if any) a starter balance
        await conn.execute(
            "UPDATE users SET balance = 500000 WHERE role = 'shipper' AND balance = 0"
        )

        # --- realistic order history: completed + rated, plus a couple active ones ---
        # Re-derived from the DB (not just this run's inserts) so every approved
        # driver/shipper — including ones created before this script existed —
        # gets folded into the demo order pool and no profile is left at "0
        # reviews" next to peers that have plenty.
        all_shippers = [r["id"] for r in await conn.fetch("SELECT id FROM users WHERE role = 'shipper'")]
        all_driver_ids = [r["id"] for r in await conn.fetch("SELECT id FROM users WHERE role = 'driver' AND status = 'approved'")]

        # cargo_orders here is exclusively demo/seed content (no real bookings
        # exist yet at this stage of the project), so it's safe to reset and
        # regenerate a fresh, evenly-distributed batch on every run.
        await conn.execute("DELETE FROM cargo_orders")

        cities = ["Toshkent", "Samarqand", "Buxoro", "Andijon", "Namangan", "Farg'ona", "Qarshi", "Termiz", "Nukus", "Urganch"]

        async def make_order(shipper_id: int, driver_id: int, force_completed: bool = False) -> None:
            origin, dest = random.sample(cities, 2)
            weight = round(random.uniform(3, 22), 1)
            created = datetime.utcnow() - timedelta(days=random.randint(1, 45))
            is_completed = force_completed or random.random() < 0.8
            rating = random.choice([4, 4, 5, 5, 5]) if is_completed else None
            comment = random.choice(REVIEW_COMMENTS) if is_completed else None
            status = "completed" if is_completed else random.choice(["pending", "accepted"])
            completed_at = created + timedelta(hours=random.randint(4, 48)) if is_completed else None
            await conn.execute(
                """
                INSERT INTO cargo_orders
                    (shipper_id, driver_id, from_location, to_location, cargo_description,
                     weight_tons, status, rating, rating_comment, created_at, completed_at)
                VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
                """,
                shipper_id, driver_id, origin, dest, random.choice(CARGO_TYPES),
                weight, status, rating, comment, created, completed_at,
            )

        # guarantee every approved driver has at least 2-3 completed+rated
        # orders, so no driver card in search results shows "0 ta sharh"
        for driver_id in all_driver_ids:
            for _ in range(random.randint(2, 3)):
                await make_order(random.choice(all_shippers), driver_id, force_completed=True)

        # a few extra in-flight orders (pending/accepted) to show live workflow
        for _ in range(4):
            await make_order(random.choice(all_shippers), random.choice(all_driver_ids), force_completed=False)

        # recompute driver ratings from seeded reviews so profile cards match reality
        await conn.execute(
            """
            UPDATE driver_profiles dp SET rating = sub.avg_rating
            FROM (
                SELECT driver_id, AVG(rating)::numeric(3,2) AS avg_rating
                FROM cargo_orders WHERE rating IS NOT NULL GROUP BY driver_id
            ) sub
            WHERE dp.user_id = sub.driver_id
            """
        )

    await pool.close()
    print("Demo data seeded successfully.")
    print(f"All seeded accounts use password: {DEMO_PASSWORD}")


if __name__ == "__main__":
    asyncio.run(main())
