#!/usr/bin/env python3
"""
Migration script to add content analysis fields to PDF table
"""
import os
import sys
from sqlalchemy import text
from database import engine
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def migrate_pdf_table():
    """Add new content analysis fields to PDF table"""
    
    migrations = [
        "ALTER TABLE pdfs ADD COLUMN IF NOT EXISTS summary TEXT;",
        "ALTER TABLE pdfs ADD COLUMN IF NOT EXISTS key_topics TEXT;", 
        "ALTER TABLE pdfs ADD COLUMN IF NOT EXISTS content_preview TEXT;"
    ]
    
    try:
        with engine.connect() as conn:
            for migration in migrations:
                logger.info(f"Executing: {migration}")
                conn.execute(text(migration))
                conn.commit()
        
        logger.info("✅ Successfully added content analysis fields to PDF table")
        return True
        
    except Exception as e:
        logger.error(f"❌ Migration failed: {e}")
        return False

if __name__ == "__main__":
    success = migrate_pdf_table()
    sys.exit(0 if success else 1)
