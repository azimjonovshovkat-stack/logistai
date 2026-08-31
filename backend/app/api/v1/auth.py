from typing import Annotated

import asyncpg
from fastapi import APIRouter, Depends, HTTPException, status

from app.core.deps import db_pool, get_current_user
from app.core.security import create_access_token, hash_password, verify_password
from app.schemas.user import (
    ChangePasswordRequest,
    DriverProfileOut,
    LoginRequest,
    MeResponse,
    RegisterRequest,
    TokenResponse,
    UpdateProfileRequest,
    UserOut,
)

router = APIRouter(prefix="/auth", tags=["auth"])

DRIVER_REQUIRED_FIELDS = ["car_name", "car_number", "car_year", "capacity_tons", "car_photo_url"]


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterRequest, pool: Annotated[asyncpg.Pool, Depends(db_pool)]):
    if payload.role == "driver":
        missing = [f for f in DRIVER_REQUIRED_FIELDS if getattr(payload, f) in (None, "")]
        if missing:
            raise HTTPException(
                status_code=400,
                detail=f"Haydovchi uchun quyidagi maydonlar shart: {', '.join(missing)}",
            )

    existing = await pool.fetchrow("SELECT id FROM users WHERE phone = $1", payload.phone)
    if existing:
        raise HTTPException(status_code=409, detail="Bu telefon raqami bilan foydalanuvchi allaqachon mavjud")

    async with pool.acquire() as conn:
        async with conn.transaction():
            # drivers start pending (need admin approval); shippers can be used right away
            initial_status = "pending" if payload.role == "driver" else "approved"
            user = await conn.fetchrow(
                """
                INSERT INTO users (full_name, phone, password_hash, role, status)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING *
                """,
                payload.full_name,
                payload.phone,
                hash_password(payload.password),
                payload.role,
                initial_status,
            )
            if payload.role == "driver":
                await conn.execute(
                    """
                    INSERT INTO driver_profiles
                        (user_id, car_name, car_number, car_year, capacity_tons, car_photo_url, license_photo_url)
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                    """,
                    user["id"],
                    payload.car_name,
                    payload.car_number,
                    payload.car_year,
                    payload.capacity_tons,
                    payload.car_photo_url,
                    payload.license_photo_url,
                )

    token = create_access_token({"sub": str(user["id"]), "role": user["role"]})
    return TokenResponse(access_token=token, user=UserOut(**dict(user)))


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, pool: Annotated[asyncpg.Pool, Depends(db_pool)]):
    phone = payload.phone.strip()
    if not phone.startswith("+"):
        phone = "+" + phone
    user = await pool.fetchrow("SELECT * FROM users WHERE phone = $1", phone)
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Telefon raqami yoki parol noto'g'ri")

    token = create_access_token({"sub": str(user["id"]), "role": user["role"]})
    return TokenResponse(access_token=token, user=UserOut(**dict(user)))


@router.get("/me", response_model=MeResponse)
async def me(
    user: Annotated[asyncpg.Record, Depends(get_current_user)],
    pool: Annotated[asyncpg.Pool, Depends(db_pool)],
):
    driver_profile = None
    if user["role"] == "driver":
        row = await pool.fetchrow("SELECT * FROM driver_profiles WHERE user_id = $1", user["id"])
        if row:
            driver_profile = DriverProfileOut(**dict(row))
    return MeResponse(**dict(user), driver_profile=driver_profile)


@router.patch("/me", response_model=UserOut)
async def update_me(
    payload: UpdateProfileRequest,
    user: Annotated[asyncpg.Record, Depends(get_current_user)],
    pool: Annotated[asyncpg.Pool, Depends(db_pool)],
):
    updates = payload.model_dump(exclude_unset=True, exclude_none=True)
    if not updates:
        return UserOut(**dict(user))

    if "phone" in updates and updates["phone"] != user["phone"]:
        existing = await pool.fetchrow(
            "SELECT id FROM users WHERE phone = $1 AND id != $2", updates["phone"], user["id"]
        )
        if existing:
            raise HTTPException(status_code=409, detail="Bu telefon raqami boshqa foydalanuvchiga tegishli")

    set_clauses = []
    values = []
    for i, (key, value) in enumerate(updates.items(), start=1):
        set_clauses.append(f"{key} = ${i}")
        values.append(value)
    values.append(user["id"])

    row = await pool.fetchrow(
        f"UPDATE users SET {', '.join(set_clauses)} WHERE id = ${len(values)} RETURNING *",
        *values,
    )
    return UserOut(**dict(row))


@router.post("/change-password", status_code=204)
async def change_password(
    payload: ChangePasswordRequest,
    user: Annotated[asyncpg.Record, Depends(get_current_user)],
    pool: Annotated[asyncpg.Pool, Depends(db_pool)],
):
    if not verify_password(payload.current_password, user["password_hash"]):
        raise HTTPException(status_code=400, detail="Joriy parol noto'g'ri")

    await pool.execute(
        "UPDATE users SET password_hash = $1 WHERE id = $2",
        hash_password(payload.new_password),
        user["id"],
    )
