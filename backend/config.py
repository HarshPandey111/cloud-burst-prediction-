from pathlib import Path
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    """Application configuration."""

    # Base directory
    BASE_DIR: Path = Path(__file__).resolve().parent

    # Database
    SQLALCHEMY_DATABASE_URL: str = f"sqlite:///{(BASE_DIR / 'cloudburst.db').as_posix()}"

    # Model / ML-related
    MODEL_PATH: str = str(BASE_DIR / "models" / "model.pkl")
    RISK_MODEL_PATH: str = str(BASE_DIR / "models" / "risk_model.pkl")

    # External API keys (placeholders)
    WEATHER_API_KEY: str | None = None

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()

