from pathlib import Path

from pydantic import BaseModel, ConfigDict, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class IceServerConfig(BaseModel):
    model_config = ConfigDict(extra="forbid")
    urls: str | list[str]
    username: str | None = None
    credential: str | None = None


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="VOICEBOT_", env_file=".env", extra="ignore")

    google_api_key: SecretStr = SecretStr("")
    gemini_model: str = "gemini-2.5-flash-native-audio-preview-12-2025"
    gemini_voice: str = "Charon"
    database_path: Path = Path("data/voicebot.sqlite3")
    cors_origins: list[str] = ["http://localhost:3000"]
    ice_servers: list[IceServerConfig] = []
