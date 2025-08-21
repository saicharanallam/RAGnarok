from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class PDFBase(BaseModel):
    filename: str

class PDFCreate(PDFBase):
    filepath: str

class PDFResponse(PDFBase):
    id: int
    upload_time: datetime
    processed: bool
    chunk_count: int
    processing_status: str
    processing_error: Optional[str] = None
    extraction_method: Optional[str] = None
    processing_duration: Optional[float] = None
    file_size: Optional[int] = None
    page_count: Optional[int] = None
    text_length: Optional[int] = None
    
    class Config:
        from_attributes = True

class PDFListResponse(BaseModel):
    pdfs: List[PDFResponse]
    pagination: dict

class LLMRequest(BaseModel):
    prompt: str
    use_rag: bool = True
    max_context_length: int = 2000

class LLMResponse(BaseModel):
    response: str
    context_used: bool
    context_length: int
    processing_time: float

class ChunkSearchResult(BaseModel):
    content: str
    metadata: dict
    similarity: float

class AnalyticsOverview(BaseModel):
    pdf_stats: dict
    llm_stats: dict
    system_stats: dict

class SystemStatus(BaseModel):
    status: str
    message: str
