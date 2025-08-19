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
            
            # Check for 'processing_status' column
            result = db.session.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='pdf' AND column_name='processing_status'"))
            if not result.fetchone():
                db.session.execute(text("ALTER TABLE pdf ADD COLUMN processing_status VARCHAR(50) DEFAULT 'pending'"))
                db.session.commit()
                print("Added 'processing_status' column")
            else:
                print("'processing_status' column already exists")
            
            # Check for 'processing_error' column
            result = db.session.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='pdf' AND column_name='processing_error'"))
            if not result.fetchone():
                db.session.execute(text("ALTER TABLE pdf ADD COLUMN processing_error TEXT"))
                db.session.commit()
                print("Added 'processing_error' column")
            else:
                print("'processing_error' column already exists")
            
            # Check for 'extraction_method' column
            result = db.session.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='pdf' AND column_name='extraction_method'"))
            if not result.fetchone():
                db.session.execute(text("ALTER TABLE pdf ADD COLUMN extraction_method VARCHAR(50)"))
                db.session.commit()
                print("Added 'extraction_method' column")
            else:
                print("'extraction_method' column already exists")
            
            # Add new analytics columns to PDF table
            analytics_columns = {
                'processing_start_time': 'TIMESTAMP',
                'processing_end_time': 'TIMESTAMP', 
                'processing_duration': 'FLOAT',
                'file_size': 'INTEGER',
                'page_count': 'INTEGER',
                'text_length': 'INTEGER'
            }
            
            for column, column_type in analytics_columns.items():
                result = db.session.execute(text(f"SELECT column_name FROM information_schema.columns WHERE table_name='pdf' AND column_name='{column}'"))
                if not result.fetchone():
                    db.session.execute(text(f"ALTER TABLE pdf ADD COLUMN {column} {column_type}"))
                    db.session.commit()
                    print(f"Added '{column}' column")
                else:
                    print(f"'{column}' column already exists")
            
            # Create analytics tables if they don't exist
            db.session.execute(text("""
                CREATE TABLE IF NOT EXISTS llm_interaction (
                    id SERIAL PRIMARY KEY,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    prompt_length INTEGER NOT NULL,
                    use_rag BOOLEAN DEFAULT TRUE,
                    context_found BOOLEAN DEFAULT FALSE,
                    context_length INTEGER,
                    response_length INTEGER,
                    response_time FLOAT,
                    model_used VARCHAR(100),
                    tokens_processed INTEGER,
                    memory_usage FLOAT,
                    success BOOLEAN DEFAULT TRUE,
                    error_message TEXT
                )
            """))
            
            db.session.execute(text("""
                CREATE TABLE IF NOT EXISTS system_metrics (
                    id SERIAL PRIMARY KEY,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    cpu_usage FLOAT,
                    memory_usage FLOAT,
                    disk_usage FLOAT,
                    processing_queue_size INTEGER DEFAULT 0,
                    active_llm_requests INTEGER DEFAULT 0,
                    avg_response_time FLOAT,
                    avg_processing_time FLOAT,
                    error_rate FLOAT,
                    failed_requests INTEGER DEFAULT 0,
                    total_requests INTEGER DEFAULT 0
                )
            """))
            
            db.session.execute(text("""
                CREATE TABLE IF NOT EXISTS user_analytics (
                    id SERIAL PRIMARY KEY,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    query_type VARCHAR(100),
                    query_category VARCHAR(100),
                    documents_accessed INTEGER DEFAULT 0,
                    document_types VARCHAR(500),
                    session_duration FLOAT,
                    interactions_count INTEGER DEFAULT 1
                )
            """))
            
            db.session.commit()
            print("Created analytics tables")
            print("Database migration completed successfully!")
            
        except Exception as e:
            print(f"Migration failed: {e}")
            print("If tables don't exist yet, run init_db.py first")

if __name__ == "__main__":
    migrate_database()
