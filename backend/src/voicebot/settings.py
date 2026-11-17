from pathlib import Path

from pydantic import BaseModel, ConfigDict, Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class IceServerConfig(BaseModel):
    model_config = ConfigDict(extra="forbid")
    urls: str | list[str]
    username: str | None = None
    credential: str | None = None


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="VOICEBOT_", env_file=".env", extra="ignore")

    google_api_key: SecretStr = SecretStr("")
    gemini_model: str = "gemini-3.8-live"
    gemini_voice: str = "Charon"
    feedback_model: str = "gemini-3.5-flash"
    supabase_url: str = ""
    database_url: SecretStr = SecretStr("")
    database_path: Path = Path("data/voicebot.sqlite3")
    cors_origins: list[str] = ["http://localhost:3000"]
    ice_servers: list[IceServerConfig] = []
    max_sessions: int = Field(default=8, ge=1, le=100)
    pending_timeout_seconds: int = Field(default=120, ge=1)
    connect_timeout_seconds: int = Field(default=30, ge=1)
    session_timeout_seconds: int = Field(default=900, ge=1)
    cleanup_timeout_seconds: int = Field(default=10, ge=5)
    session_token_ttl_seconds: int = Field(default=86400, ge=60)
