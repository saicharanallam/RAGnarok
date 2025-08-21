#!/usr/bin/env python3
"""
Database schema migration script.
Adds new columns to existing tables.
"""

from sqlalchemy import create_engine, text, inspect
from config import settings
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def migrate_database():
    """Migrate database schema to add new columns."""
    try:
        engine = create_engine(settings.DATABASE_URL)
        inspector = inspect(engine)
        
        with engine.connect() as conn:
            # Check if llm_interactions table has prompt and response columns
            llm_columns = [col['name'] for col in inspector.get_columns('llm_interactions')]
            
            if 'prompt' not in llm_columns:
                logger.info("Adding 'prompt' column to llm_interactions table...")
                conn.execute(text("ALTER TABLE llm_interactions ADD COLUMN prompt TEXT"))
                conn.commit()
            
            if 'response' not in llm_columns:
                logger.info("Adding 'response' column to llm_interactions table...")
                conn.execute(text("ALTER TABLE llm_interactions ADD COLUMN response TEXT"))
                conn.commit()
            
            logger.info("✅ Database schema migration completed!")
            
    except Exception as e:
        logger.error(f"❌ Migration failed: {e}")
        return False
    
    return True

if __name__ == "__main__":
    success = migrate_database()
    exit(0 if success else 1)
