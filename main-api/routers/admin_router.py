from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
import os
import httpx
import logging

from database import get_db
from models import PDF, LLMInteraction, SystemMetrics, UserAnalytics
from schemas import SystemStatus
from services.rag_service import rag_service
from config import settings

router = APIRouter()
logger = logging.getLogger(__name__)

@router.delete("/admin/flush/{data_type}", response_model=dict)
async def admin_flush(data_type: str, db: Session = Depends(get_db)):
    """
    Flush all data - PDF files, database records, and vector embeddings.
    WARNING: This will delete ALL data!
    """
    try:
        deleted_files = 0
        deleted_records = 0
        
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
        
        # Count records before deletion
        deleted_records = db.query(PDF).count()
        
        # Remove all records from the database
        db.query(UserAnalytics).delete()
        db.query(SystemMetrics).delete()
        db.query(LLMInteraction).delete()
        db.query(PDF).delete()
        db.commit()
        
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
        
        return SystemStatus(
            status="success",
            message=f"All data cleared. Deleted {deleted_files} files and {deleted_records} database records."
        )
        
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
