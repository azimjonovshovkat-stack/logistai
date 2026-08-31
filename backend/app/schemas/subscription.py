from datetime import datetime

from pydantic import BaseModel


class SubscriptionOut(BaseModel):
    is_active: bool
    start_date: datetime | None
    end_date: datetime | None
    days_remaining: int
    duration_days: int
    price_monthly: float


class TransactionOut(BaseModel):
    id: int
    amount: float
    type: str
    note: str | None
    created_at: datetime


class DriverReviewOut(BaseModel):
    rating: int
    comment: str | None
    reviewer_name: str
    created_at: datetime


class DriverReviewsResponse(BaseModel):
    driver_id: int
    full_name: str
    rating: float
    total_reviews: int
    car_name: str
    car_number: str
    capacity_tons: float
    reviews: list[DriverReviewOut]


class LiveMapPoint(BaseModel):
    city: str
    available_count: int


class LiveMapResponse(BaseModel):
    points: list[LiveMapPoint]
    total_available: int
    total_verified_drivers: int
