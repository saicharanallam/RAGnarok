from pydantic_settings import BaseSettings
from typing import Optional
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
    
    # File upload configuration
    UPLOAD_FOLDER: str = "/app/uploads"
    MAX_FILE_SIZE: int = 50 * 1024 * 1024  # 50MB
    
    # Ollama configuration
    OLLAMA_URL: str = "http://ollama:11434"
    OLLAMA_MODEL: str = "llama3.2:8b"  # Better quality, good balance of speed/accuracy
    
    # PDF Service configuration
    PDF_SERVICE_URL: str = "http://document-processor:8001"
    
    # Redis configuration for queuing
    REDIS_URL: str = "redis://redis:6379"
    
    # ChromaDB configuration
    CHROMA_PERSIST_DIRECTORY: str = "/app/chroma_db"
    
    class Config:
        env_file = ".env"

settings = Settings()
