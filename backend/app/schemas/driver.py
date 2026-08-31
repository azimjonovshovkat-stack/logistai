from datetime import date as date_type
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

DriverStatus = Literal["available", "busy", "day_off"]


class StatusUpdateRequest(BaseModel):
    status: DriverStatus
    current_location: str = Field(min_length=2, max_length=100)
    destination_location: str = Field(min_length=2, max_length=100)


class DailyStatusOut(BaseModel):
    id: int
    driver_id: int
    date: date_type
    current_location: str
    destination_location: str
    status: str
    updated_at: datetime


class OrderOut(BaseModel):
    id: int
    shipper_id: int
    shipper_name: str | None = None
    shipper_phone: str | None = None
    driver_id: int
    from_location: str
    to_location: str
    cargo_description: str | None
    weight_tons: float | None
    status: str
    rating: int | None
    rating_comment: str | None
    created_at: datetime
    completed_at: datetime | None


class OrderStatusUpdateRequest(BaseModel):
    status: Literal["accepted", "in_transit", "completed", "cancelled"]


class RateOrderRequest(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: str | None = Field(default=None, max_length=500)
