from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator

Role = Literal["driver", "shipper"]  # admins are never self-registered


class RegisterRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=255)
    phone: str = Field(min_length=9, max_length=20)
    password: str = Field(min_length=6, max_length=128)
    role: Role

    # driver-only fields (required when role == "driver")
    car_name: str | None = None
    car_number: str | None = None
    car_year: int | None = None
    capacity_tons: float | None = None
    car_photo_url: str | None = None
    license_photo_url: str | None = None

    @field_validator("phone")
    @classmethod
    def normalize_phone(cls, v: str) -> str:
        v = v.strip().replace(" ", "")
        if not v.startswith("+"):
            v = "+" + v
        return v


class LoginRequest(BaseModel):
    phone: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"


class UserOut(BaseModel):
    id: int
    full_name: str
    phone: str
    role: str
    balance: float
    status: str
    created_at: datetime


class DriverProfileOut(BaseModel):
    car_name: str
    car_number: str
    car_year: int
    capacity_tons: float
    car_photo_url: str
    license_photo_url: str | None
    rating: float


class MeResponse(UserOut):
    driver_profile: DriverProfileOut | None = None


class UpdateProfileRequest(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=255)
    phone: str | None = Field(default=None, min_length=9, max_length=20)

    @field_validator("phone")
    @classmethod
    def normalize_phone(cls, v: str | None) -> str | None:
        if v is None:
            return v
        v = v.strip().replace(" ", "")
        if not v.startswith("+"):
            v = "+" + v
        return v


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=6, max_length=128)


class DriverProfileUpdateRequest(BaseModel):
    car_name: str | None = Field(default=None, min_length=1, max_length=100)
    car_number: str | None = Field(default=None, min_length=1, max_length=20)
    car_year: int | None = Field(default=None, ge=1970, le=2100)
    capacity_tons: float | None = Field(default=None, gt=0)
    car_photo_url: str | None = None
    license_photo_url: str | None = None
