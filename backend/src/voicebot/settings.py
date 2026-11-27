from pathlib import Path
from typing import Literal

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
    voice_architecture: Literal["realtime"] = "realtime"
    realtime_provider: Literal["gemini"] = "gemini"
    gemini_model: str = "gemini-3.8-live"
    gemini_voice: str = "Charon"
    feedback_provider: Literal["gemini", "openrouter"] = "gemini"
    feedback_model: str = "gemini-3.5-flash"
    openrouter_api_key: SecretStr = SecretStr("")
    openrouter_feedback_model: str = "openai/gpt-4.1-mini"
    supabase_url: str = ""
    database_url: SecretStr = SecretStr("")
    supabase_secret_key: SecretStr = SecretStr("")
    database_path: Path = Path("data/voicebot.sqlite3")
    cors_origins: list[str] = ["http://localhost:3000"]
    ice_servers: list[IceServerConfig] = []
    max_sessions: int = Field(default=8, ge=1, le=100)
    pending_timeout_seconds: int = Field(default=120, ge=1)
    connect_timeout_seconds: int = Field(default=30, ge=1)
    session_timeout_seconds: int = Field(default=900, ge=1)
    cleanup_timeout_seconds: int = Field(default=10, ge=5)
    session_token_ttl_seconds: int = Field(default=86400, ge=60)
    recording_retention_days: int = Field(default=30, ge=1)
    recording_cleanup_interval_seconds: int = Field(default=3600, ge=60)
