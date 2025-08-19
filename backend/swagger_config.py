"""Swagger configuration for RAGnarok API documentation."""

SWAGGER_CONFIG = {
    "headers": [],
    "specs": [
        {
            "endpoint": "apispec",
            "route": "/apispec.json",
            "rule_filter": lambda rule: True,
            "model_filter": lambda tag: True,
        }
    ],
    "static_url_path": "/flasgger_static",
    "swagger_ui": True,
    "specs_route": "/swagger/",
}

SWAGGER_TEMPLATE = {
    "swagger": "2.0",
    "info": {
        "title": "RAGnarok API",
        "description": "Retrieval-Augmented Generation (RAG) system for PDF document processing and AI chat",
        "version": "1.0.0",
        "contact": {
            "name": "RAGnarok Team",
            "email": "support@ragnarok.dev"
        }
    },
    "host": "localhost:5000",
    "basePath": "/",
    "schemes": ["http", "https"],
    "consumes": ["application/json", "multipart/form-data"],
    "produces": ["application/json", "text/event-stream"],
    "tags": [
        {
            "name": "documents",
            "description": "PDF document management operations"
        },
        {
            "name": "chat", 
            "description": "LLM chat and RAG interactions"
        },
        {
            "name": "analytics",
            "description": "System analytics and metrics"
        },
        {
            "name": "admin",
            "description": "Administrative operations"
        }
    ],
    "definitions": {
        "PDF": {
            "type": "object",
            "properties": {
                "id": {"type": "integer", "description": "Unique PDF identifier"},
                "filename": {"type": "string", "description": "Original filename"},
                "upload_time": {"type": "string", "format": "date-time", "description": "Upload timestamp"},
                "processed": {"type": "boolean", "description": "Processing completion status"},
                "chunk_count": {"type": "integer", "description": "Number of text chunks"},
                "processing_status": {"type": "string", "enum": ["pending", "processing", "completed", "failed"]},
                "processing_error": {"type": "string", "description": "Error message if processing failed"},
                "extraction_method": {"type": "string", "enum": ["text", "ocr", "mixed"], "description": "Text extraction method used"},
                "processing_duration": {"type": "number", "description": "Processing time in seconds"},
                "file_size": {"type": "integer", "description": "File size in bytes"},
                "page_count": {"type": "integer", "description": "Number of pages"},
                "text_length": {"type": "integer", "description": "Total characters extracted"}
            }
        },
        "LLMRequest": {
            "type": "object",
            "required": ["prompt"],
            "properties": {
                "prompt": {"type": "string", "description": "User question or prompt"},
                "use_rag": {"type": "boolean", "default": True, "description": "Whether to use RAG context"}
            }
        },
        "LLMResponse": {
            "type": "object",
            "properties": {
                "response": {"type": "string", "description": "LLM generated response"},
                "sources_used": {"type": "array", "items": {"type": "string"}, "description": "Source documents used"},
                "context_found": {"type": "boolean", "description": "Whether relevant context was found"},
                "rag_enabled": {"type": "boolean", "description": "Whether RAG was enabled for this request"}
            }
        },
        "AnalyticsOverview": {
            "type": "object", 
            "properties": {
                "pdf_stats": {
                    "type": "object",
                    "properties": {
                        "total_pdfs": {"type": "integer"},
                        "processed_pdfs": {"type": "integer"},
                        "pending_pdfs": {"type": "integer"},
                        "failed_pdfs": {"type": "integer"},
                        "avg_processing_time": {"type": "number"},
                        "total_chunks": {"type": "integer"}
                    }
                },
                "llm_stats": {
                    "type": "object",
                    "properties": {
                        "total_interactions": {"type": "integer"},
                        "avg_response_time": {"type": "number"},
                        "success_rate": {"type": "number"},
                        "avg_prompt_length": {"type": "number"},
                        "avg_response_length": {"type": "number"}
                    }
                },
                "system_stats": {
                    "type": "object",
                    "properties": {
                        "avg_cpu_usage": {"type": "number"},
                        "avg_memory_usage": {"type": "number"},
                        "avg_disk_usage": {"type": "number"},
                        "current_queue_size": {"type": "integer"}
                    }
                }
            }
        }
    }
}
