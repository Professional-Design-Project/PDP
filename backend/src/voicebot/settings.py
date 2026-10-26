from pathlib import Path

from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="VOICEBOT_", env_file=".env", extra="ignore")

    google_api_key: SecretStr = SecretStr("")
    gemini_model: str = "gemini-2.5-flash-native-audio-preview-12-2025"
    gemini_voice: str = "Charon"
    database_path: Path = Path("data/voicebot.sqlite3")
    cors_origins: list[str] = ["http://localhost:3000"]
