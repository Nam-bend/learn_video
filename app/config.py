from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    GEMINI_API_KEY: str
    OPENAI_API_KEY: str
    OPENAI_BASE_URL: str
    LLM_MODEL: str = "gpt-5.3-codex"
    UPLOAD_DIR: str = "tmp/uploads"

    class Config:
        env_file = ".env"

settings = Settings()