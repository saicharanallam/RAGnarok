from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
from contextlib import asynccontextmanager

from config import settings
from services.pdf_processor import PDFProcessor
from services.database_client import DatabaseClient
from schemas import ProcessRequest, ProcessResponse, HealthResponse
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global services
pdf_processor = PDFProcessor()
db_client = DatabaseClient()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("PDF Processing Service starting up...")
    
    # Create upload directory
    os.makedirs(settings.UPLOAD_FOLDER, exist_ok=True)
    
    yield
    
    # Shutdown
    logger.info("PDF Processing Service shutting down...")

app = FastAPI(
    title="PDF Processing Service",
    description="Microservice for processing PDF documents with OCR and text extraction",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    return HealthResponse(status="healthy", service="pdf-processing")

@app.post("/process", response_model=ProcessResponse)
async def process_pdf(
    request: ProcessRequest,
    background_tasks: BackgroundTasks
):
    """Queue a PDF for processing."""
    try:
        # Add to background processing queue
        background_tasks.add_task(
            pdf_processor.process_pdf_background,
            request.pdf_id,
            request.filepath,
            request.filename
        )
        
        # Update status to processing
        await db_client.update_pdf_status(request.pdf_id, "processing")
        
        return ProcessResponse(
            pdf_id=request.pdf_id,
            status="processing",
            message="PDF processing started"
        )
        
    except Exception as e:
        logger.error(f"Error queueing PDF {request.pdf_id}: {e}")
        await db_client.update_pdf_status(
            request.pdf_id, 
            "failed", 
            error_message=str(e)
        )
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/documents/{pdf_id}")
async def delete_document(pdf_id: int):
    """Delete all chunks for a specific PDF."""
    try:
        pdf_processor.rag_service.delete_document(pdf_id)
        return {"status": "success", "message": f"Deleted chunks for PDF {pdf_id}"}
    except Exception as e:
        logger.error(f"Error deleting document {pdf_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/admin/flush")
async def admin_flush():
    """Flush all processed documents from vector database."""
    try:
        pdf_processor.rag_service.flush_all_documents()
        return {"status": "success", "message": "All documents flushed from vector database"}
    except Exception as e:
        logger.error(f"Error flushing documents: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/admin/reprocess")
async def admin_reprocess(
    request: dict,
    background_tasks: BackgroundTasks
):
    """Reprocess multiple PDFs."""
    try:
        pdfs = request.get("pdfs", [])
        
        for pdf_data in pdfs:
            background_tasks.add_task(
                pdf_processor.process_pdf_background,
                pdf_data["pdf_id"],
                pdf_data["filepath"],
                pdf_data["filename"]
            )
            
            # Update status to processing
            await db_client.update_pdf_status(pdf_data["pdf_id"], "processing")
        
        return {
            "status": "success",
            "message": f"Reprocessing started for {len(pdfs)} PDFs",
            "count": len(pdfs)
        }
        
    except Exception as e:
        logger.error(f"Error in bulk reprocessing: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
async def root():
    return {"message": "PDF Processing Service", "version": "1.0.0"}

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8001,
        reload=True
    )
