"""Failover AI engine.

Tries each active row in `ai_configs`, ordered by priority, until one
succeeds. OpenAI and DeepSeek both speak the OpenAI chat-completions wire
format, so a single HTTP call shape covers both providers.

Crucially, the model is only ever asked to *parse* the shipper's free-text
query into a structured filter (origin, destination, capacity, cargo type).
It never generates the list of matching drivers itself — that always comes
from a real SQL query in `matching.py`. This is what makes "Zero
Hallucination" a guarantee rather than a hope: the AI cannot invent a truck
that isn't in the database because it never sees the database rows, and the
caller never trusts free text from the AI as if it were a driver record.
"""

import json
import time
from dataclasses import dataclass

import asyncpg
import httpx

from app.core.config import get_settings
from app.services.cities import UZBEKISTAN_CITIES

settings = get_settings()

PROVIDER_ENDPOINTS = {
    "openai": "https://api.openai.com/v1/chat/completions",
    "deepseek": "https://api.deepseek.com/chat/completions",
}

SYSTEM_PROMPT = (
    "Sen LogistAI platformasi uchun so'rovlarni JSON formatga o'giruvchi "
    "yordamchisan. Faqat quyidagi shahar nomlaridan foydalan: "
    + ", ".join(UZBEKISTAN_CITIES)
    + ". Foydalanuvchi matnidan: origin (qayerdan), destination (qayerga), "
    "min_capacity_tons (kerakli yuk ko'tarish sig'imi, tonna, son yoki null), "
    "cargo_type (yuk turi, matn yoki null) ni JSON obyekt sifatida qaytar. "
    "Agar shahar aniq bo'lmasa yoki ro'yxatda bo'lmasa, o'sha maydonni null qil. "
    "Hech qachon ro'yxatda yo'q shahar nomi o'ylab topma. "
    'Faqat JSON qaytar, masalan: {"origin": "Toshkent", "destination": "Samarqand", '
    '"min_capacity_tons": 5, "cargo_type": "qurilish materiali"}'
)


@dataclass
class ParsedQuery:
    origin: str | None
    destination: str | None
    min_capacity_tons: float | None
    cargo_type: str | None


async def _get_active_configs(pool: asyncpg.Pool) -> list[asyncpg.Record]:
    return await pool.fetch(
        "SELECT * FROM ai_configs WHERE is_active = TRUE ORDER BY priority ASC, id ASC"
    )


async def _call_provider(config: asyncpg.Record, user_query: str) -> dict:
    provider = config["provider"]
    url = PROVIDER_ENDPOINTS.get(provider)
    if url is None:
        raise ValueError(f"Noma'lum AI provider: {provider}")

    model = (
        settings.ai_default_model_openai
        if provider == "openai"
        else settings.ai_default_model_deepseek
    )

    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_query},
        ],
        "response_format": {"type": "json_object"},
        "temperature": 0,
        "max_tokens": 200,
    }
    headers = {
        "Authorization": f"Bearer {config['api_key']}",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=settings.ai_request_timeout_seconds) as client:
        resp = await client.post(url, json=payload, headers=headers)
        resp.raise_for_status()
        data = resp.json()
        content = data["choices"][0]["message"]["content"]
        return json.loads(content)


async def parse_query_with_failover(
    pool: asyncpg.Pool, user_query: str
) -> tuple[ParsedQuery | None, str]:
    """Returns (parsed_query_or_None, source). source is 'ai' on success, or a
    string describing why it fell through so the caller can decide to use the
    deterministic fallback."""
    configs = await _get_active_configs(pool)
    if not configs:
        return None, "no_ai_configured"

    last_reason = "unknown_error"
    for config in configs:
        try:
            raw = await _call_provider(config, user_query)
            parsed = ParsedQuery(
                origin=raw.get("origin"),
                destination=raw.get("destination"),
                min_capacity_tons=raw.get("min_capacity_tons"),
                cargo_type=raw.get("cargo_type"),
            )
            await pool.execute(
                """UPDATE ai_configs
                   SET usage_count = usage_count + 1, last_used_at = NOW(), last_error = NULL
                   WHERE id = $1""",
                config["id"],
            )
            return parsed, "ai"
        except httpx.TimeoutException:
            last_reason = "timeout"
        except httpx.HTTPStatusError as e:
            last_reason = f"http_{e.response.status_code}"
        except (KeyError, IndexError, json.JSONDecodeError, ValueError):
            last_reason = "bad_response"
        except httpx.HTTPError:
            last_reason = "network_error"

        await pool.execute(
            "UPDATE ai_configs SET last_error = $1, last_used_at = NOW() WHERE id = $2",
            last_reason,
            config["id"],
        )
        # loop continues to next config by priority -> this IS the failover

    return None, last_reason
