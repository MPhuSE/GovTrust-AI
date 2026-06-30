from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # General
    AI_GATEWAY_PORT: int = 8000
    NODE_ENV: str = "development"

    # VNPT eKYC
    VNPT_EKYC_BASE_URL: str = "https://api.vnpt-ekyc.vn"
    VNPT_EKYC_TOKEN_ID: str = ""
    VNPT_EKYC_TOKEN_KEY: str = ""
    VNPT_EKYC_ACCESS_TOKEN: str = ""

    # VNPT SmartReader
    VNPT_SMARTREADER_BASE_URL: str = "https://api.smartreader.vnpt.vn"
    VNPT_SMARTREADER_API_KEY: str = ""

    # VNPT SmartBot
    VNPT_SMARTBOT_BASE_URL: str = "https://api.smartbot.vnpt.vn"
    VNPT_SMARTBOT_API_KEY: str = ""

    # VNPT SmartVoice
    VNPT_SMARTVOICE_BASE_URL: str = "https://api.smartvoice.vnpt.vn"
    VNPT_SMARTVOICE_API_KEY: str = ""

    # Qdrant
    QDRANT_URL: str = "http://localhost:6333"
    QDRANT_COLLECTION: str = "legal_chunks"
    QDRANT_VECTOR_SIZE: int = 768

    # Redis
    REDIS_URL: str = "redis://localhost:6379"

    # File
    UPLOAD_DIR: str = "./uploads"
    FILE_TTL_MINUTES: int = 30

    class Config:
        env_file = "../../.env"
        extra = "ignore"


settings = Settings()
