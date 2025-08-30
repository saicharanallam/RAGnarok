from pydantic_settings import BaseSettings
import os

class Settings(BaseSettings):
    # Database configuration
    DB_HOST: str = "db"
    DB_PORT: str = "5432"
    DB_NAME: str = "ragnarok"
    DB_USER: str = "postgres"
    DB_PASSWORD: str = "postgres"
    
    @property
    def DATABASE_URL(self) -> str:
        return f"postgresql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
    
    # File paths
    UPLOAD_FOLDER: str = "/app/uploads"  # Shared volume
    
    # ChromaDB configuration
    CHROMA_PERSIST_DIRECTORY: str = "/app/chroma_db"  # Shared volume
    
    # Processing limits
    MAX_CHUNK_SIZE: int = 1000
    MAX_CHUNKS: int = 1000
    MAX_CONTEXT_LENGTH: int = 32000
    
    # OCR Configuration
    OCR_DPI: int = 300
    OCR_LANGUAGE: str = "eng"
    
    class Config:
        env_file = ".env"

settings = Settings()
