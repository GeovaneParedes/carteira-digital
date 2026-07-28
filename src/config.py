from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configurações da aplicação carregadas de variáveis de ambiente."""

    DATABASE_URL: str = "sqlite:///./finance_dev.db"
    SECRET_KEY: str = "dev-secret-key-mude-para-valor-forte"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()