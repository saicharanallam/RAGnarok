from fastapi import APIRouter, HTTPException, Depends, File, UploadFile, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import desc
import os
import httpx
from typing import List
import logging

from database import get_db
from models import PDF
from schemas import PDFResponse, PDFListResponse, SystemStatus
from config import settings

router = APIRouter()
logger = logging.getLogger(__name__)

def allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() == "pdf"

async def notify_pdf_service(pdf_id: int, filename: str, filepath: str):
    """Notify the PDF processing service about a new file."""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{settings.PDF_SERVICE_URL}/process",
                json={
                    "pdf_id": pdf_id,
                    "filename": filename,
                    "filepath": filepath
                },
                timeout=30.0
            )
            if response.status_code != 200:
                logger.error(f"PDF service returned status {response.status_code}")
    except Exception as e:
        logger.error(f"Failed to notify PDF service: {e}")

@router.post("/pdfs/upload", response_model=dict)
async def upload_pdf(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Upload a PDF document for processing."""
    
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file selected")
    
    if not allowed_file(file.filename):
        raise HTTPException(status_code=400, detail="Invalid file type. Only PDF files are allowed.")
    
    # Check file size
    content = await file.read()
    if len(content) > settings.MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400, 
            detail=f"File too large. Maximum size is {settings.MAX_FILE_SIZE // (1024*1024)}MB"
        )
    
    try:
        # Ensure upload directory exists
        os.makedirs(settings.UPLOAD_FOLDER, exist_ok=True)
        
        # Save file
        filepath = os.path.join(settings.UPLOAD_FOLDER, file.filename)
        with open(filepath, "wb") as f:
            f.write(content)
        
        # Create PDF record
        pdf = PDF(
            filename=file.filename,
            filepath=filepath,
            processing_status='pending',
            file_size=len(content)
        )
        db.add(pdf)
        db.commit()
        db.refresh(pdf)
        
        # Notify PDF service for processing
        background_tasks.add_task(notify_pdf_service, pdf.id, file.filename, filepath)
        
        return {
            "status": "success",
            "filename": file.filename,
            "pdf_id": pdf.id,
            "processing_status": "pending",
            "message": "File uploaded successfully. Processing started in background."
        }
        
    except Exception as e:
        # Clean up file if database operation fails
        if os.path.exists(filepath):
            try:
                os.remove(filepath)
            except:
                pass
        logger.error(f"Upload failed: {e}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@router.get("/pdfs", response_model=PDFListResponse)
async def list_pdfs(
    page: int = 1,
    per_page: int = 20,
    db: Session = Depends(get_db)
):
    """List uploaded PDF documents with pagination."""
    
    # Validate inputs
    if page < 1:
        page = 1
    if per_page < 1:
        per_page = 20
    per_page = min(per_page, 100)  # Limit to prevent abuse
    
    # Calculate offset
    offset = (page - 1) * per_page
    
    # Get total count
    total = db.query(PDF).count()
    
    # Get paginated results
    pdfs = db.query(PDF).order_by(desc(PDF.upload_time)).offset(offset).limit(per_page).all()
    
    # Calculate pagination info
    total_pages = (total + per_page - 1) // per_page
    has_next = page < total_pages
    has_prev = page > 1
    
    return PDFListResponse(
        pdfs=[PDFResponse.from_orm(pdf) for pdf in pdfs],
        pagination={
            "page": page,
            "per_page": per_page,
            "total": total,
            "pages": total_pages,
            "has_next": has_next,
            "has_prev": has_prev
        }
    )

@router.get("/pdfs/{pdf_id}/status", response_model=PDFResponse)
async def get_pdf_status(pdf_id: int, db: Session = Depends(get_db)):
    """Get processing status for a specific PDF."""
    pdf = db.query(PDF).filter(PDF.id == pdf_id).first()
    if not pdf:
        raise HTTPException(status_code=404, detail="PDF not found")
    
    return PDFResponse.from_orm(pdf)

@router.delete("/pdfs/{pdf_id}")
async def delete_pdf(pdf_id: int, db: Session = Depends(get_db)):
    """Delete a PDF and its associated data."""
    pdf = db.query(PDF).filter(PDF.id == pdf_id).first()
    if not pdf:
        raise HTTPException(status_code=404, detail="PDF not found")
    
    try:
        # Delete file from filesystem
        if os.path.exists(pdf.filepath):
            os.remove(pdf.filepath)
        
        # Notify PDF service to delete chunks
        try:
            async with httpx.AsyncClient() as client:
                await client.delete(
                    f"{settings.PDF_SERVICE_URL}/documents/{pdf_id}",
                    timeout=30.0
                )
        except Exception as e:
            logger.warning(f"Failed to notify PDF service about deletion: {e}")
        
        # Delete from database
        db.delete(pdf)
        db.commit()
        
        return {"status": "success", "message": f"PDF {pdf.filename} deleted successfully"}
        
    except Exception as e:
        logger.error(f"Error deleting PDF {pdf_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete PDF: {str(e)}")
