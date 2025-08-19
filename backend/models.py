from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class PDF(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(256), nullable=False)
    filepath = db.Column(db.String(512), nullable=False)
    upload_time = db.Column(db.DateTime, default=datetime.utcnow)
    processed = db.Column(db.Boolean, default=False)
    chunk_count = db.Column(db.Integer, default=0)
    processing_status = db.Column(db.String(50), default='pending')  # pending, processing, completed, failed
    processing_error = db.Column(db.Text, nullable=True)  # Store error messages
    extraction_method = db.Column(db.String(50), nullable=True)  # text, ocr, mixed
    
    # Analytics fields for PDF processing
    processing_start_time = db.Column(db.DateTime, nullable=True)
    processing_end_time = db.Column(db.DateTime, nullable=True)
    processing_duration = db.Column(db.Float, nullable=True)  # in seconds
    file_size = db.Column(db.Integer, nullable=True)  # in bytes
    page_count = db.Column(db.Integer, nullable=True)
    text_length = db.Column(db.Integer, nullable=True)  # total characters extracted

class LLMInteraction(db.Model):
    """Track LLM interactions for analytics"""
    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Request details
    prompt_length = db.Column(db.Integer, nullable=False)  # characters
    use_rag = db.Column(db.Boolean, default=True)
    context_found = db.Column(db.Boolean, default=False)
    context_length = db.Column(db.Integer, nullable=True)  # characters
    
    # Response details
    response_length = db.Column(db.Integer, nullable=True)  # characters
    response_time = db.Column(db.Float, nullable=True)  # in seconds
    
    # Model details
    model_used = db.Column(db.String(100), nullable=True)
    
    # Performance metrics
    tokens_processed = db.Column(db.Integer, nullable=True)
    memory_usage = db.Column(db.Float, nullable=True)  # MB
    
    # Error tracking
    success = db.Column(db.Boolean, default=True)
    error_message = db.Column(db.Text, nullable=True)

class SystemMetrics(db.Model):
    """Track system performance metrics"""
    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Resource usage
    cpu_usage = db.Column(db.Float, nullable=True)  # percentage
    memory_usage = db.Column(db.Float, nullable=True)  # MB
    disk_usage = db.Column(db.Float, nullable=True)  # percentage
    
    # Queue metrics
    processing_queue_size = db.Column(db.Integer, default=0)
    active_llm_requests = db.Column(db.Integer, default=0)
    
    # Performance metrics
    avg_response_time = db.Column(db.Float, nullable=True)  # seconds
    avg_processing_time = db.Column(db.Float, nullable=True)  # seconds
    
    # Error rates
    error_rate = db.Column(db.Float, nullable=True)  # percentage
    failed_requests = db.Column(db.Integer, default=0)
    total_requests = db.Column(db.Integer, default=0)

class UserAnalytics(db.Model):
    """Track user behavior and popular queries"""
    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Query analysis
    query_type = db.Column(db.String(100), nullable=True)  # e.g., 'document_search', 'general_question'
    query_category = db.Column(db.String(100), nullable=True)  # e.g., 'technical', 'business', 'academic'
    
    # Document analysis
    documents_accessed = db.Column(db.Integer, default=0)
    document_types = db.Column(db.String(500), nullable=True)  # JSON string of document types
    
    # Session data
    session_duration = db.Column(db.Float, nullable=True)  # in seconds
    interactions_count = db.Column(db.Integer, default=1)
