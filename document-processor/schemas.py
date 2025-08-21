from pydantic import BaseModel
from typing import Optional

class ProcessRequest(BaseModel):
    pdf_id: int
    filename: str
    filepath: str

class ProcessResponse(BaseModel):
    pdf_id: int
    status: str
    message: str

class HealthResponse(BaseModel):
    status: str
    service: str

class PDFUpdateRequest(BaseModel):
    pdf_id: int
    status: str
    processed: bool = False
    chunk_count: Optional[int] = None
    processing_error: Optional[str] = None
    extraction_method: Optional[str] = None
    processing_duration: Optional[float] = None
    file_size: Optional[int] = None
    page_count: Optional[int] = None
    text_length: Optional[int] = None
