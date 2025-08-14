#!/usr/bin/env python3
"""
Database migration script to add new columns to PDF model.
Run this after updating the models.py file.
"""

import os
from app import app
from models import db

def migrate_database():
    """Add new columns to existing PDF table."""
    with app.app_context():
        try:
            # Check if columns already exist
            from sqlalchemy import text
            
            # Check for 'processed' column
            result = db.session.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='pdf' AND column_name='processed'"))
            if not result.fetchone():
                db.session.execute(text("ALTER TABLE pdf ADD COLUMN processed BOOLEAN DEFAULT FALSE"))
                db.session.commit()
                print("Added 'processed' column")
            else:
                print("'processed' column already exists")
            
            # Check for 'chunk_count' column
            result = db.session.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='pdf' AND column_name='chunk_count'"))
            if not result.fetchone():
                db.session.execute(text("ALTER TABLE pdf ADD COLUMN chunk_count INTEGER DEFAULT 0"))
                db.session.commit()
                print("Added 'chunk_count' column")
            else:
                print("'chunk_count' column already exists")
            
            print("Database migration completed successfully!")
            
        except Exception as e:
            print(f"Migration failed: {e}")
            print("If tables don't exist yet, run init_db.py first")

if __name__ == "__main__":
    migrate_database()
