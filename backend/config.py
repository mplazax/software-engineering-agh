import os
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Central settings management for the application.
    Loads variables from environment variables, which are injected by Docker Compose.
    """
    # === KLUCZOWA ZMIANA TUTAJ ===
    # Ta linia mówi: "Spróbuj znaleźć DATABASE_URL_UNPOOLED. Jeśli jej nie ma,
    # poszukaj standardowej DATABASE_URL". Dzięki temu kod działa
    # zarówno na Vercelu, jak i lokalnie w Dockerze.
    DATABASE_URL: str = os.environ.get("DATABASE_URL_UNPOOLED", os.environ.get("DATABASE_URL"))
    # === KONIEC KLUCZOWEJ ZMIANY ===

    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 # 24 godziny

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding='utf-8', extra='ignore')


@lru_cache()
def get_settings() -> Settings:
    """Returns a cached instance of the Settings."""
    return Settings()