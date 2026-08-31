import json
from pathlib import Path

import asyncpg

from app.core.config import get_settings

settings = get_settings()

_pool: asyncpg.Pool | None = None


async def _init_connection(conn: asyncpg.Connection) -> None:
    # asyncpg returns json/jsonb columns (e.g. row_to_json()) as raw text by
    # default; decode them to Python objects so callers get dicts, not strings.
    await conn.set_type_codec(
        "json", encoder=json.dumps, decoder=json.loads, schema="pg_catalog"
    )
    await conn.set_type_codec(
        "jsonb", encoder=json.dumps, decoder=json.loads, schema="pg_catalog"
    )


async def init_pool() -> asyncpg.Pool:
    global _pool
    if _pool is None:
        _pool = await asyncpg.create_pool(
            dsn=settings.database_url,
            min_size=2,
            max_size=10,
            command_timeout=10,
            init=_init_connection,
        )
        await _run_schema(_pool)
        await _bootstrap_admin(_pool)
    return _pool


async def close_pool() -> None:
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None


def get_pool() -> asyncpg.Pool:
    if _pool is None:
        raise RuntimeError("DB pool not initialized yet")
    return _pool


async def _run_schema(pool: asyncpg.Pool) -> None:
    schema_path = Path(__file__).parent / "schema.sql"
    sql = schema_path.read_text(encoding="utf-8")
    async with pool.acquire() as conn:
        await conn.execute(sql)


async def _bootstrap_admin(pool: asyncpg.Pool) -> None:
    """Ensure at least one approved admin account exists so the platform is usable on first boot."""
    from app.core.security import hash_password

    async with pool.acquire() as conn:
        existing = await conn.fetchrow("SELECT id FROM users WHERE role = 'admin' LIMIT 1")
        if existing:
            return
        await conn.execute(
            """
            INSERT INTO users (full_name, phone, password_hash, role, status)
            VALUES ($1, $2, $3, 'admin', 'approved')
            ON CONFLICT (phone) DO NOTHING
            """,
            settings.bootstrap_admin_name,
            settings.bootstrap_admin_phone,
            hash_password(settings.bootstrap_admin_password),
        )
