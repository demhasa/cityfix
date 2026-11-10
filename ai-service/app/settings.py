from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    ai_service_secret: str = ""
    ollama_host: str = "http://127.0.0.1:11434"
    ollama_model: str = "qwen3-vl:8b"
    ollama_timeout_seconds: float = 120
    model_config = SettingsConfigDict(env_file=".env", env_prefix="", extra="ignore")


settings = Settings()
