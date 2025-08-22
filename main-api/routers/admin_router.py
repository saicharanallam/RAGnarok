from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
import os
import httpx
import logging
import redis
import json
from datetime import datetime

from database import get_db
from models import PDF, LLMInteraction, SystemMetrics, UserAnalytics
from schemas import SystemStatus
from services.rag_service import rag_service
from config import settings

router = APIRouter()
logger = logging.getLogger(__name__)

# Redis client for caching
redis_client = redis.Redis.from_url(settings.REDIS_URL, decode_responses=True)

@router.get("/admin/models", response_model=dict)
async def list_available_models():
    """Get list of available models from Ollama with Redis caching."""
    try:
        # Check Redis cache first (5 minute TTL)
        cache_key = "ollama_models"
        cached_models = redis_client.get(cache_key)
        
        if cached_models:
            logger.info("Returning cached models from Redis")
            return json.loads(cached_models)
        
        # Query Ollama directly
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{settings.OLLAMA_URL}/api/tags",
                timeout=10.0
            )
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=500, 
                    detail=f"Failed to get models from Ollama: {response.status_code}"
                )
            
            models_data = response.json()
            models = models_data.get("models", [])
            
            # Format models for frontend
            formatted_models = []
            for model in models:
                formatted_models.append({
                    "name": model.get("name", ""),
                    "size": model.get("size", 0),
                    "modified_at": model.get("modified_at", ""),
                    "digest": model.get("digest", "")
                })
            
            # Cache in Redis for 5 minutes
            redis_client.setex(
                cache_key, 
                300,  # 5 minutes TTL
                json.dumps({
                    "models": formatted_models,
                    "cached_at": str(datetime.now()),
                    "total_count": len(formatted_models)
                })
            )
            
            return {
                "models": formatted_models,
                "cached_at": str(datetime.now()),
                "total_count": len(formatted_models)
            }
            
    except Exception as e:
        logger.error(f"Failed to list models: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to list models: {str(e)}")

@router.get("/admin/models/current", response_model=dict)
async def get_current_model():
    """Get the currently configured model."""
    try:
        return {
            "current_model": settings.OLLAMA_MODEL,
            "config_source": "main-api/config.py"
        }
    except Exception as e:
        logger.error(f"Failed to get current model: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get current model: {str(e)}")

@router.post("/admin/models/switch", response_model=dict)
async def switch_model(model_name: str):
    """Switch to a different model (requires restart)."""
    try:
        # Validate model exists
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{settings.OLLAMA_URL}/api/tags",
                timeout=10.0
            )
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=500, 
                    detail="Failed to connect to Ollama"
                )
            
            models_data = response.json()
            available_models = [m.get("name", "") for m in models_data.get("models", [])]
            
            if model_name not in available_models:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Model '{model_name}' not found. Available models: {', '.join(available_models)}"
                )
        
        # Clear Redis cache
        redis_client.delete("ollama_models")
        
        return {
            "status": "success",
            "message": f"Model '{model_name}' is available. Please restart the main-api service to use it.",
            "note": "Edit main-api/config.py and restart services to complete the switch."
        }
        
    except Exception as e:
        logger.error(f"Failed to switch model: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to switch model: {str(e)}")

@router.post("/admin/models/download", response_model=dict)
async def download_model(model_name: str):
    """Download a new model to Ollama."""
    try:
        # Start download in background
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{settings.OLLAMA_URL}/api/pull",
                json={"name": model_name},
                timeout=30.0
            )
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=500, 
                    detail=f"Failed to start model download: {response.status_code}"
                )
        
        # Clear Redis cache
        redis_client.delete("ollama_models")
        
        return {
            "status": "success",
            "message": f"Started downloading model '{model_name}'",
            "note": "Check Ollama logs for download progress"
        }
        
    except Exception as e:
        logger.error(f"Failed to download model: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to download model: {str(e)}")

@router.delete("/admin/models/{model_name}", response_model=dict)
async def remove_model(model_name: str):
    """Remove a model from Ollama."""
    try:
        # Remove model
        async with httpx.AsyncClient() as client:
            response = await client.delete(
                f"{settings.OLLAMA_URL}/api/delete",
                json={"name": model_name},
                timeout=30.0
            )
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=500, 
                    detail=f"Failed to remove model: {response.status_code}"
                )
        
        # Clear Redis cache
        redis_client.delete("ollama_models")
        
        return {
            "status": "success",
            "message": f"Model '{model_name}' removed successfully"
        }
        
    except Exception as e:
        logger.error(f"Failed to remove model: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to remove model: {str(e)}")

@router.delete("/admin/flush/{data_type}", response_model=dict)
async def admin_flush(data_type: str, db: Session = Depends(get_db)):
    """
    Flush specific types of data or all data.
    Supported types: pdfs, interactions, metrics, all
    """
    try:
        deleted_files = 0
        deleted_records = 0
        message_parts = []
        
        if data_type == "pdfs" or data_type == "all":
            # Delete all PDF files in the uploads folder
            if os.path.exists(settings.UPLOAD_FOLDER):
                for filename in os.listdir(settings.UPLOAD_FOLDER):
                    try:
                        file_path = os.path.join(settings.UPLOAD_FOLDER, filename)
                        if os.path.isfile(file_path):
                            os.remove(file_path)
                            deleted_files += 1
                    except OSError as e:
                        logger.warning(f"Failed to delete file {filename}: {e}")
            
            # Count PDF records before deletion
            pdf_records = db.query(PDF).count()
            deleted_records += pdf_records
            
            # Remove PDF records from the database
            db.query(PDF).delete()
            
            # Clear the vector database
            rag_service.flush_all_documents()
            
            # Notify PDF service to flush its data
            try:
                async with httpx.AsyncClient() as client:
                    await client.post(
                        f"{settings.PDF_SERVICE_URL}/admin/flush",
                        timeout=30.0
                    )
            except Exception as e:
                logger.warning(f"Failed to notify PDF service about flush: {e}")
            
            message_parts.append(f"Deleted {deleted_files} files and {pdf_records} PDF records")
        
        if data_type == "interactions" or data_type == "all":
            # Count interaction records before deletion
            interaction_records = db.query(LLMInteraction).count()
            deleted_records += interaction_records
            
            # Remove interaction records
            db.query(LLMInteraction).delete()
            message_parts.append(f"Deleted {interaction_records} LLM interaction records")
        
        if data_type == "metrics" or data_type == "all":
            # Count metrics records before deletion
            metrics_records = db.query(SystemMetrics).count()
            analytics_records = db.query(UserAnalytics).count()
            deleted_records += metrics_records + analytics_records
            
            # Remove metrics records
            db.query(SystemMetrics).delete()
            db.query(UserAnalytics).delete()
            message_parts.append(f"Deleted {metrics_records} system metrics and {analytics_records} analytics records")
        
        if data_type not in ["pdfs", "interactions", "metrics", "all"]:
            raise HTTPException(
                status_code=400, 
                detail="Invalid data type. Supported types: pdfs, interactions, metrics, all"
            )
        
        # Commit all deletions
        db.commit()
        
        message = f"{data_type.capitalize()} data cleared. " + "; ".join(message_parts)
        
        return {
            "status": "success",
            "message": message
        }
        
    except Exception as e:
        logger.error(f"Flush failed: {e}")
        raise HTTPException(status_code=500, detail=f"Flush failed: {str(e)}")

@router.post("/admin/reprocess", response_model=dict)
async def admin_reprocess(db: Session = Depends(get_db)):
    """Reprocess all unprocessed PDFs by notifying the PDF service."""
    try:
        unprocessed_pdfs = db.query(PDF).filter(PDF.processed == False).all()
        
        if not unprocessed_pdfs:
            return {
                "status": "completed",
                "message": "No unprocessed PDFs found",
                "total_unprocessed": 0
            }
        
        # Notify PDF service to reprocess all unprocessed PDFs
        reprocess_requests = []
        for pdf in unprocessed_pdfs:
            reprocess_requests.append({
                "pdf_id": pdf.id,
                "filename": pdf.filename,
                "filepath": pdf.filepath
            })
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{settings.PDF_SERVICE_URL}/admin/reprocess",
                    json={"pdfs": reprocess_requests},
                    timeout=60.0
                )
                
                if response.status_code == 200:
                    result = response.json()
                    return {
                        "status": "initiated",
                        "message": f"Reprocessing initiated for {len(unprocessed_pdfs)} PDFs",
                        "total_unprocessed": len(unprocessed_pdfs),
                        "pdf_service_response": result
                    }
                else:
                    raise HTTPException(
                        status_code=500, 
                        detail=f"PDF service returned status {response.status_code}"
                    )
                    
        except httpx.RequestError as e:
            logger.error(f"Failed to communicate with PDF service: {e}")
            raise HTTPException(
                status_code=503, 
                detail="PDF processing service is not available"
            )
        
    except Exception as e:
        logger.error(f"Reprocessing failed: {e}")
        raise HTTPException(status_code=500, detail=f"Reprocessing failed: {str(e)}")

@router.get("/admin/status")
async def admin_status(db: Session = Depends(get_db)):
    """Get system status and health information."""
    try:
        # Database status
        total_pdfs = db.query(PDF).count()
        processed_pdfs = db.query(PDF).filter(PDF.processed == True).count()
        pending_pdfs = db.query(PDF).filter(PDF.processing_status == 'pending').count()
        failed_pdfs = db.query(PDF).filter(PDF.processing_status == 'failed').count()
        
        # PDF Service status
        pdf_service_status = "unknown"
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{settings.PDF_SERVICE_URL}/health",
                    timeout=5.0
                )
                pdf_service_status = "healthy" if response.status_code == 200 else "unhealthy"
        except:
            pdf_service_status = "unreachable"
        
        # Ollama status
        ollama_status = "unknown"
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{settings.OLLAMA_URL}",
                    timeout=5.0
                )
                ollama_status = "healthy" if response.status_code == 200 else "unhealthy"
        except:
            ollama_status = "unreachable"
        
        return {
            "database": {
                "total_pdfs": total_pdfs,
                "processed_pdfs": processed_pdfs,
                "pending_pdfs": pending_pdfs,
                "failed_pdfs": failed_pdfs
            },
            "services": {
                "pdf_service": pdf_service_status,
                "ollama": ollama_status
            },
            "vector_db": {
                "total_chunks": sum(pdf.chunk_count or 0 for pdf in db.query(PDF).all())
            }
        }
        
    except Exception as e:
        logger.error(f"Status check failed: {e}")
        raise HTTPException(status_code=500, detail=f"Status check failed: {str(e)}")
