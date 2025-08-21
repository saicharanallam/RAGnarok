from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional

from database import get_db
from models import PDF

router = APIRouter()

@router.patch("/internal/pdfs/{pdf_id}/status")
async def update_pdf_status(
    pdf_id: int,
    update_data: dict,
    db: Session = Depends(get_db)
):
    """Internal endpoint for PDF service to update PDF status."""
    pdf = db.query(PDF).filter(PDF.id == pdf_id).first()
    if not pdf:
        raise HTTPException(status_code=404, detail="PDF not found")
    
    # Update fields if provided
    for field, value in update_data.items():
        if hasattr(pdf, field):
            # Handle datetime fields
            if field in ["processing_start_time", "processing_end_time"] and isinstance(value, str):
                setattr(pdf, field, datetime.fromisoformat(value))
            else:
                setattr(pdf, field, value)
    
    db.commit()
    db.refresh(pdf)
    
    return {"status": "success", "pdf_id": pdf_id}
