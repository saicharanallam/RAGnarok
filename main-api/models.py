from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, Float
from sqlalchemy.sql import func
from database import Base
from datetime import datetime

class PDF(Base):
    __tablename__ = "pdfs"
    
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(256), nullable=False)
    filepath = Column(String(512), nullable=False)
    upload_time = Column(DateTime, default=func.now())
    processed = Column(Boolean, default=False)
    chunk_count = Column(Integer, default=0)
    processing_status = Column(String(50), default='pending')  # pending, processing, completed, failed
    processing_error = Column(Text, nullable=True)
    extraction_method = Column(String(50), nullable=True)  # text, ocr, mixed
    
    # Analytics fields for PDF processing
    processing_start_time = Column(DateTime, nullable=True)
    processing_end_time = Column(DateTime, nullable=True)
    processing_duration = Column(Float, nullable=True)  # in seconds
    file_size = Column(Integer, nullable=True)  # in bytes
    page_count = Column(Integer, nullable=True)
    text_length = Column(Integer, nullable=True)  # total characters extracted

class LLMInteraction(Base):
    __tablename__ = "llm_interactions"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=func.now())
    
    # Request details
    prompt = Column(Text, nullable=True)  # actual prompt (truncated)
    prompt_length = Column(Integer, nullable=False)  # characters
    use_rag = Column(Boolean, default=True)
    context_found = Column(Boolean, default=False)
    context_length = Column(Integer, nullable=True)  # characters
    
    # Response details
    response = Column(Text, nullable=True)  # actual response (truncated)
    response_length = Column(Integer, nullable=True)  # characters
    response_time = Column(Float, nullable=True)  # in seconds
    
    # Model details
    model_used = Column(String(100), nullable=True)
    
    # Performance metrics
    tokens_processed = Column(Integer, nullable=True)
    memory_usage = Column(Float, nullable=True)  # MB
    
    # Error tracking
    success = Column(Boolean, default=True)
    error_message = Column(Text, nullable=True)

class SystemMetrics(Base):
    __tablename__ = "system_metrics"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=func.now())
    
    # Resource usage
    cpu_usage = Column(Float, nullable=True)  # percentage
    memory_usage = Column(Float, nullable=True)  # MB
    disk_usage = Column(Float, nullable=True)  # percentage
    
    # Queue metrics
    processing_queue_size = Column(Integer, default=0)
    active_llm_requests = Column(Integer, default=0)
    
    # Performance metrics
    avg_response_time = Column(Float, nullable=True)  # seconds
    avg_processing_time = Column(Float, nullable=True)  # seconds
    
    # Error rates
    error_rate = Column(Float, nullable=True)  # percentage
    failed_requests = Column(Integer, default=0)
    total_requests = Column(Integer, default=0)

class UserAnalytics(Base):
    __tablename__ = "user_analytics"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=func.now())
    
    # Query analysis
    query_type = Column(String(100), nullable=True)  # e.g., 'document_search', 'general_question'
    query_category = Column(String(100), nullable=True)  # e.g., 'technical', 'business', 'academic'
    
    # Document analysis
    documents_accessed = Column(Integer, default=0)
    document_types = Column(String(500), nullable=True)  # JSON string of document types
    
    # Session data
    session_duration = Column(Float, nullable=True)  # in seconds
    interactions_count = Column(Integer, default=1)
