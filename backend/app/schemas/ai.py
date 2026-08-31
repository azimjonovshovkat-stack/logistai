from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class SearchRequest(BaseModel):
    query: str = Field(min_length=3, max_length=500)


class DriverMatch(BaseModel):
    driver_id: int
    full_name: str
    phone: str
    rating: float
    car_name: str
    car_number: str
    capacity_tons: float
    current_location: str
    destination_location: str


class SearchResponse(BaseModel):
    matches: list[DriverMatch]
    subscription_active: bool
    parsed_query: dict
    source: Literal["ai", "fallback_keyword"]
    elapsed_ms: int
    message: str | None = None


class BookDriverRequest(BaseModel):
    driver_id: int
    from_location: str
    to_location: str
    cargo_description: str | None = None
    weight_tons: float | None = None


class AIConfigCreate(BaseModel):
    provider: Literal["openai", "deepseek"]
    api_key: str = Field(min_length=8)
    label: str | None = None
    priority: int = 0
    is_active: bool = True


class AIConfigUpdate(BaseModel):
    is_active: bool | None = None
    priority: int | None = None
    label: str | None = None
    api_key: str | None = None


class AIConfigOut(BaseModel):
    id: int
    provider: str
    label: str | None
    is_active: bool
    usage_count: int
    priority: int
    last_error: str | None
    last_used_at: datetime | None
    masked_key: str


class BalanceRefillRequest(BaseModel):
    user_id: int
    amount: float
    note: str | None = None
