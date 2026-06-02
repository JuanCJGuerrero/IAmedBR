"""
Configuração centralizada (lê variáveis de ambiente).

Use Pydantic Settings para validar tipos e dar valores default seguros.
NUNCA hardcode segredos aqui — leia do .env.
"""

from functools import lru_cache
from typing import List

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # --- App ---
    app_name: str = "PlataformaMedicaIntegrada"
    app_env: str = Field(default="development", pattern="^(development|production|test)$")
    debug: bool = True
    host: str = "0.0.0.0"
    port: int = 8100

    # --- DB ---
    database_url: str = "postgresql+psycopg2://postgres:postgres@localhost:5432/plataforma_medica"

    # --- JWT ---
    jwt_secret: str = "change-me"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 60
    jwt_refresh_token_expire_days: int = 7

    # --- CORS ---
    cors_origins: str = "http://localhost:3000,http://localhost:80"

    # --- Bootstrap admin ---
    admin_bootstrap_email: str = "admin@plataforma.local"
    admin_bootstrap_password: str = "change-me-on-first-login"

    @field_validator("jwt_secret")
    @classmethod
    def _validate_secret(cls, v: str, info):
        # Em produção, recusar segredo padrão.
        env = (info.data.get("app_env") or "").lower()
        if env == "production" and v in {"change-me", "troque-este-segredo-em-producao"}:
            raise ValueError("JWT_SECRET inseguro em produção. Defina um segredo forte.")
        return v

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
