from __future__ import annotations

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configurações centrais da API, carregadas de variáveis de ambiente (`.env`)."""

    model_config = SettingsConfigDict(env_file='.env', env_file_encoding='utf-8', extra='ignore')

    # Banco
    database_url: str = Field(default='postgresql+psycopg://menvi:menvi@localhost:5432/menvi')

    # Redis
    redis_url: str = Field(default='redis://localhost:6379/0')

    # API
    api_host: str = '0.0.0.0'
    api_port: int = 8000
    api_env: str = 'development'
    api_cors_origins: str = 'http://localhost:3000,http://localhost:3001'

    # JWT
    jwt_secret: str = 'change-me'
    jwt_algorithm: str = 'HS256'
    jwt_access_ttl_min: int = 15
    jwt_refresh_ttl_days: int = 30

    # Admin
    admin_api_token: str = 'change-me-admin'

    # URLs
    menu_web_url: str = 'http://localhost:3000'
    crm_web_url: str = 'http://localhost:3001'

    # Email
    resend_api_key: str = ''
    email_from: str = 'Menvi <no-reply@menvi.app>'

    # Pagamento
    mercadopago_access_token: str = ''
    mercadopago_webhook_secret: str = ''

    # WhatsApp
    whatsapp_phone_number_id: str = ''
    whatsapp_access_token: str = ''
    whatsapp_verify_token: str = ''

    # Web Push (VAPID)
    vapid_public_key: str = ''
    vapid_private_key: str = ''
    vapid_subject: str = 'mailto:no-reply@menvi.app'

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.api_cors_origins.split(',') if o.strip()]

    @property
    def is_production(self) -> bool:
        return self.api_env == 'production'


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
