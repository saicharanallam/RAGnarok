import httpx
import asyncio
from datetime import datetime
from typing import Optional
import logging

logger = logging.getLogger(__name__)

class DatabaseClient:
    """Client to communicate with the main backend for database updates."""
    
    def __init__(self):
        # This would typically be configured via environment variables  
        self.backend_url = "http://main-api:8000"  # Main API service
    
    async def update_pdf_status(self, pdf_id: int, status: str, error_message: str = None):
        """Update PDF processing status."""
        try:
            data = {
                "processing_status": status,
                "processed": status == "completed"
            }
            if error_message:
                data["processing_error"] = error_message
            
            async with httpx.AsyncClient() as client:
                response = await client.patch(
                    f"{self.backend_url}/internal/pdfs/{pdf_id}/status",
                    json=data,
                    timeout=30.0
                )
                
                if response.status_code != 200:
                    logger.error(f"Failed to update PDF status: {response.status_code}")
                    
        except Exception as e:
            logger.error(f"Error updating PDF status: {e}")
    
    async def update_pdf_processing_start(
        self, 
        pdf_id: int, 
        start_time: datetime, 
        file_size: Optional[int] = None,
        page_count: Optional[int] = None
    ):
        """Update PDF with processing start information."""
        try:
            data = {
                "processing_status": "processing",
                "processing_start_time": start_time.isoformat(),
            }
            if file_size:
                data["file_size"] = file_size
            if page_count:
                data["page_count"] = page_count
            
            async with httpx.AsyncClient() as client:
                response = await client.patch(
                    f"{self.backend_url}/internal/pdfs/{pdf_id}/status",
                    json=data,
                    timeout=30.0
                )
                
                if response.status_code != 200:
                    logger.error(f"Failed to update PDF processing start: {response.status_code}")
                    
        except Exception as e:
            logger.error(f"Error updating PDF processing start: {e}")
    
    async def update_pdf_completed(
        self,
        pdf_id: int,
        chunk_count: int,
        extraction_method: str,
        processing_end_time: datetime,
        processing_duration: float,
        text_length: Optional[int] = None
    ):
        """Update PDF as completed with processing results."""
        try:
            data = {
                "processing_status": "completed",
                "processed": True,
                "chunk_count": chunk_count,
                "extraction_method": extraction_method,
                "processing_end_time": processing_end_time.isoformat(),
                "processing_duration": processing_duration,
                "processing_error": None
            }
            if text_length:
                data["text_length"] = text_length
            
            async with httpx.AsyncClient() as client:
                response = await client.patch(
                    f"{self.backend_url}/internal/pdfs/{pdf_id}/status",
                    json=data,
                    timeout=30.0
                )
                
                if response.status_code != 200:
                    logger.error(f"Failed to update PDF completion: {response.status_code}")
                    
        except Exception as e:
            logger.error(f"Error updating PDF completion: {e}")
    
    async def update_pdf_failed(
        self,
        pdf_id: int,
        error_message: str,
        processing_end_time: datetime,
        processing_duration: float,
        file_size: Optional[int] = None,
        page_count: Optional[int] = None,
        text_length: Optional[int] = None
    ):
        """Update PDF as failed with error information."""
        try:
            data = {
                "processing_status": "failed",
                "processed": False,
                "processing_error": error_message,
                "processing_end_time": processing_end_time.isoformat(),
                "processing_duration": processing_duration
            }
            if file_size:
                data["file_size"] = file_size
            if page_count:
                data["page_count"] = page_count
            if text_length:
                data["text_length"] = text_length
            
            async with httpx.AsyncClient() as client:
                response = await client.patch(
                    f"{self.backend_url}/internal/pdfs/{pdf_id}/status",
                    json=data,
                    timeout=30.0
                )
                
                if response.status_code != 200:
                    logger.error(f"Failed to update PDF failure: {response.status_code}")
                    
        except Exception as e:
            logger.error(f"Error updating PDF failure: {e}")
