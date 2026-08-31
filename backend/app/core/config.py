from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Database
    database_url: str = "postgresql://postgres:postgres@localhost:5432/logistai"

    # Auth
    jwt_secret: str = "CHANGE_ME_IN_PRODUCTION_super_secret_key"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24 * 7  # 7 days

    # CORS
    allowed_origins: str = "http://localhost:3000"

    # Uploads
    upload_dir: str = "uploads"
    max_upload_mb: int = 8

    # AI engine
    ai_request_timeout_seconds: float = 2.5
    ai_default_model_openai: str = "gpt-4o-mini"
    ai_default_model_deepseek: str = "deepseek-chat"

    # Bootstrap admin (created on first startup if no admin exists)
    bootstrap_admin_phone: str = "+998900000000"
    bootstrap_admin_password: str = "admin12345"
    bootstrap_admin_name: str = "Bosh Administrator"

    # Subscription (unlocks driver contact info in search results)
    subscription_price_monthly: float = 300_000.0
    subscription_duration_days: int = 30

    @property
    def origins_list(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
