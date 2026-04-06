from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # App
    app_name: str = "INSITE"
    app_env: str = "development"
    app_debug: bool = True
    app_host: str = "0.0.0.0"
    app_port: int = 8000
    secret_key: str = "change-me-to-a-random-secret-key"
    jwt_algorithm: str = "HS256"
    jwt_expiration_minutes: int = 60
    jwt_refresh_expiration_days: int = 7

    # PostgreSQL
    postgres_host: str = "localhost"
    postgres_port: int = 5432
    postgres_db: str = "insite"
    postgres_user: str = "insite"
    postgres_password: str = "insite_password"

    # TimescaleDB
    timescale_host: str = "localhost"
    timescale_port: int = 5433
    timescale_db: str = "insite_metrics"
    timescale_user: str = "insite"
    timescale_password: str = "insite_password"

    # Redis
    redis_host: str = "localhost"
    redis_port: int = 6379
    redis_password: str = ""
    redis_url: str = ""

    # Kafka
    kafka_bootstrap_servers: str = "localhost:9092"
    kafka_group_id: str = "insite-backend"

    # Elasticsearch
    elasticsearch_url: str = "http://localhost:9200"

    # Prometheus
    prometheus_url: str = "http://localhost:9090"

    # AI
    openai_api_key: str = ""
    anthropic_api_key: str = ""
    ai_provider: str = "openai"
    ai_model: str = "gpt-4o"

    # SMTP
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from: str = "noreply@insite.local"

    # Slack
    slack_webhook_url: str = ""

    # SNMP
    snmp_community: str = "public"
    snmp_timeout: int = 5
    snmp_retries: int = 3

    # Report
    report_output_dir: str = "/app/reports"
    report_email_recipients: str = ""

    @property
    def database_url(self) -> str:
        return (
            f"postgresql+asyncpg://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )

    @property
    def timescale_url(self) -> str:
        return (
            f"postgresql+asyncpg://{self.timescale_user}:{self.timescale_password}"
            f"@{self.timescale_host}:{self.timescale_port}/{self.timescale_db}"
        )

    @property
    def redis_dsn(self) -> str:
        if self.redis_url:
            return self.redis_url
        if self.redis_password:
            return f"redis://:{self.redis_password}@{self.redis_host}:{self.redis_port}/0"
        return f"redis://{self.redis_host}:{self.redis_port}/0"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


@lru_cache
def get_settings() -> Settings:
    return Settings()
