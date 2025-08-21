from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
import psutil

from database import get_db
from models import PDF, LLMInteraction, SystemMetrics
from schemas import AnalyticsOverview

router = APIRouter()

@router.get("/analytics/overview")
async def get_analytics_overview(db: Session = Depends(get_db)):
    """Get comprehensive analytics overview."""
    try:
        # PDF Statistics
        total_pdfs = db.query(PDF).count()
        processed_pdfs = db.query(PDF).filter(PDF.processing_status == 'completed').count()
        pending_pdfs = db.query(PDF).filter(PDF.processing_status == 'pending').count()
        failed_pdfs = db.query(PDF).filter(PDF.processing_status == 'failed').count()
        
        # Average processing time (handle potential missing column gracefully)
        try:
            avg_processing_time = db.query(func.avg(PDF.processing_duration)).filter(
                PDF.processing_duration.isnot(None)
            ).scalar()
        except Exception:
            avg_processing_time = None
        
        # Total chunks (handle potential missing column gracefully)
        try:
            total_chunks = db.query(func.sum(PDF.chunk_count)).scalar() or 0
        except Exception:
            total_chunks = 0
        
        # LLM Statistics
        total_interactions = db.query(LLMInteraction).count()
        
        # Handle success field gracefully in case it doesn't exist
        try:
            successful_interactions = db.query(LLMInteraction).filter(LLMInteraction.success == True).count()
        except Exception:
            successful_interactions = total_interactions  # Assume all successful if no success field
        
        success_rate = None
        avg_response_time = None
        avg_prompt_length = None
        avg_response_length = None
        
        if total_interactions > 0:
            success_rate = (successful_interactions / total_interactions) * 100
            
            # Calculate averages
            avg_response_time = db.query(func.avg(LLMInteraction.response_time)).filter(
                LLMInteraction.response_time.isnot(None)
            ).scalar()
            
            avg_prompt_length = db.query(func.avg(LLMInteraction.prompt_length)).scalar()
            avg_response_length = db.query(func.avg(LLMInteraction.response_length)).filter(
                LLMInteraction.response_length.isnot(None)
            ).scalar()
        
        # System Statistics (current)
        cpu_usage = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        return {
            "total_pdfs": total_pdfs,
            "processed_pdfs": processed_pdfs,
            "pending_pdfs": pending_pdfs,
            "failed_pdfs": failed_pdfs,
            "avg_processing_time": avg_processing_time,
            "total_chunks": total_chunks,
            "total_interactions": total_interactions,
            "successful_interactions": successful_interactions,
            "success_rate": success_rate,
            "avg_response_time": avg_response_time,
            "avg_prompt_length": avg_prompt_length,
            "avg_response_length": avg_response_length,
            "cpu_usage": cpu_usage,
            "memory_usage": memory.used / (1024 * 1024),  # MB
            "disk_usage": disk.percent,
            "current_queue_size": pending_pdfs
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get analytics: {str(e)}")

@router.get("/analytics/pdf/{pdf_id}")
async def get_pdf_analytics(pdf_id: int, db: Session = Depends(get_db)):
    """Get detailed analytics for a specific PDF."""
    pdf = db.query(PDF).filter(PDF.id == pdf_id).first()
    if not pdf:
        raise HTTPException(status_code=404, detail="PDF not found")
    
    return {
        "id": pdf.id,
        "filename": pdf.filename,
        "upload_time": pdf.upload_time,
        "processing_start_time": pdf.processing_start_time,
        "processing_end_time": pdf.processing_end_time,
        "processing_duration": pdf.processing_duration,
        "file_size": pdf.file_size,
        "page_count": pdf.page_count,
        "text_length": pdf.text_length,
        "chunk_count": pdf.chunk_count,
        "extraction_method": pdf.extraction_method,
        "processing_status": pdf.processing_status,
        "processing_error": pdf.processing_error
    }

@router.get("/analytics/system")
async def get_system_metrics(db: Session = Depends(get_db)):
    """Get recent system metrics."""
    try:
        # Get recent system metrics (last 24 hours)
        recent_metrics = db.query(SystemMetrics).filter(
            SystemMetrics.timestamp >= datetime.utcnow() - timedelta(hours=24)
        ).order_by(SystemMetrics.timestamp.desc()).limit(100).all()
        
        return {
            "metrics": [
                {
                    "timestamp": metric.timestamp,
                    "cpu_usage": metric.cpu_usage,
                    "memory_usage": metric.memory_usage,
                    "disk_usage": metric.disk_usage,
                    "active_connections": metric.active_connections,
                    "queue_size": metric.queue_size
                }
                for metric in recent_metrics
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get system metrics: {str(e)}")

@router.get("/analytics/llm-interactions")
async def get_llm_interactions(db: Session = Depends(get_db)):
    """Get recent LLM interactions."""
    try:
        # Get recent interactions (last 50)
        recent_interactions = db.query(LLMInteraction).order_by(
            LLMInteraction.timestamp.desc()
        ).limit(50).all()
        
        return {
            "interactions": [
                {
                    "id": interaction.id,
                    "timestamp": interaction.timestamp,
                    "prompt": getattr(interaction, 'prompt', 'N/A'),
                    "response": getattr(interaction, 'response', 'N/A'),
                    "response_time": interaction.response_time,
                    "use_rag": interaction.use_rag,
                    "model": getattr(interaction, 'model_used', 'unknown')
                }
                for interaction in recent_interactions
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get LLM interactions: {str(e)}")