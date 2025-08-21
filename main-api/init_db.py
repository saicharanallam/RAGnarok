#!/usr/bin/env python3
"""
Database initialization script for FastAPI backend.
Creates all tables and sets up the database schema.
"""

from sqlalchemy import create_engine, text
from models import Base
from config import settings
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def init_database():
    """Initialize the database with all tables."""
    import time
    max_retries = 30
    retry_count = 0
    
    while retry_count < max_retries:
        try:
            engine = create_engine(settings.DATABASE_URL)
            
            # Test connection
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            
            logger.info("Creating database tables...")
            Base.metadata.create_all(bind=engine)
            logger.info("✅ Database tables created successfully!")
            
            return True
        except Exception as e:
            retry_count += 1
            if retry_count >= max_retries:
                logger.error(f"❌ Failed to initialize database after {max_retries} retries: {e}")
                return False
            
            logger.info(f"Database not ready, retrying in 2 seconds... ({retry_count}/{max_retries})")
            time.sleep(2)

if __name__ == "__main__":
    success = init_database()
    exit(0 if success else 1)
