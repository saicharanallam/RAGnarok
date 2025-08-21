import os
import asyncio
import pdfplumber
import pytesseract
from PIL import Image
from pdf2image import convert_from_path
import PyPDF2
from typing import List, Tuple
from datetime import datetime
import logging

from .rag_service import RAGService
from .database_client import DatabaseClient
from config import settings

logger = logging.getLogger(__name__)

class PDFProcessor:
    def __init__(self):
        self.rag_service = RAGService()
        self.db_client = DatabaseClient()
    
    def _extract_selectable_text(self, pdf_path: str) -> str:
        """Extract selectable text from PDF using pdfplumber."""
        text = ""
        try:
            with pdfplumber.open(pdf_path) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
        except Exception as e:
            logger.error(f"Error with pdfplumber extraction: {e}")
        return text
    
    def _extract_text_with_ocr(self, pdf_path: str) -> str:
        """Extract text from PDF using OCR for image-based content."""
        text = ""
        images = []
        try:
            # Convert PDF pages to images
            images = convert_from_path(pdf_path, dpi=settings.OCR_DPI)
            
            logger.info(f"Processing {len(images)} pages with OCR...")
            
            for i, image in enumerate(images):
                try:
                    # Use OCR to extract text from the image
                    page_text = pytesseract.image_to_string(image, lang=settings.OCR_LANGUAGE)
                    if page_text.strip():
                        text += f"\n--- Page {i+1} (OCR) ---\n{page_text}\n"
                        logger.info(f"Page {i+1}: Extracted {len(page_text)} characters via OCR")
                except Exception as e:
                    logger.error(f"OCR failed on page {i+1}: {e}")
                finally:
                    # Clean up image memory
                    if hasattr(image, 'close'):
                        image.close()
                    
        except Exception as e:
            logger.error(f"Error with OCR extraction: {e}")
        finally:
            # Ensure all images are cleaned up
            for image in images:
                try:
                    if hasattr(image, 'close'):
                        image.close()
                except Exception:
                    pass
        return text
    
    def _has_meaningful_text(self, text: str) -> bool:
        """Check if extracted text contains meaningful content."""
        if not text or len(text.strip()) < 50:
            return False
        
        # Count alphabetic characters vs total characters
        alpha_chars = sum(1 for c in text if c.isalpha())
        total_chars = len(text.replace(' ', '').replace('\n', ''))
        
        if total_chars == 0:
            return False
            
        # Consider meaningful if at least 30% are alphabetic characters
        alpha_ratio = alpha_chars / total_chars
        return alpha_ratio > 0.3
    
    def _get_page_count(self, pdf_path: str) -> int:
        """Get the number of pages in the PDF."""
        try:
            with open(pdf_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                return len(pdf_reader.pages)
        except Exception as e:
            logger.error(f"Error getting page count: {e}")
            return 0
    
    def extract_text_from_pdf_with_method(self, pdf_path: str) -> Tuple[str, str]:
        """Extract text and return the method used."""
        try:
            # First, try standard text extraction
            text_extracted = self._extract_selectable_text(pdf_path)
            
            # Check if we got meaningful text
            meaningful_text = self._has_meaningful_text(text_extracted)
            
            if meaningful_text:
                logger.info(f"Found selectable text in PDF: {len(text_extracted)} characters")
                
                # Check if there are also images with text
                try:
                    ocr_text = self._extract_text_with_ocr(pdf_path)
                    if self._has_meaningful_text(ocr_text):
                        logger.info("PDF has both selectable text and images, combining both...")
                        combined_text = f"{text_extracted}\n\n--- Text from Images ---\n{ocr_text}"
                        return combined_text, "mixed"
                    else:
                        return text_extracted, "text"
                except Exception as e:
                    logger.error(f"OCR check failed, using text only: {e}")
                    return text_extracted, "text"
            else:
                logger.info("No meaningful selectable text found, trying OCR...")
                ocr_text = self._extract_text_with_ocr(pdf_path)
                return ocr_text, "ocr"
                
        except Exception as e:
            logger.error(f"Error extracting text from PDF: {e}")
            return "", "error"
    
    def chunk_text(self, text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
        """Split text into overlapping chunks."""
        if not text.strip():
            return []
        
        # Limit chunk size to prevent memory issues
        chunk_size = min(chunk_size, settings.MAX_CHUNK_SIZE)
        
        # Limit overlap to prevent excessive overlap
        max_overlap = min(overlap, chunk_size // 2)
        
        words = text.split()
        chunks = []
        
        for i in range(0, len(words), chunk_size - max_overlap):
            if len(chunks) >= settings.MAX_CHUNKS:
                logger.warning(f"Reached maximum chunk limit ({settings.MAX_CHUNKS}) for text processing")
                break
                
            chunk = " ".join(words[i:i + chunk_size])
            if chunk.strip():
                chunks.append(chunk.strip())
        
        return chunks
    
    async def process_pdf_background(self, pdf_id: int, filepath: str, filename: str):
        """Process PDF in background with comprehensive error handling."""
        start_time = datetime.utcnow()
        file_size = None
        page_count = None
        text_length = None
        
        try:
            logger.info(f"Starting processing for PDF {pdf_id}: {filename}")
            
            # Get file size and page count
            file_size = os.path.getsize(filepath) if os.path.exists(filepath) else None
            page_count = self._get_page_count(filepath)
            
            # Update database with processing start
            await self.db_client.update_pdf_processing_start(
                pdf_id, start_time, file_size, page_count
            )
            
            # Extract text and determine method used
            text, extraction_method = self.extract_text_from_pdf_with_method(filepath)
            
            if not text.strip():
                logger.warning(f"No text extracted from {filename}")
                await self._mark_processing_failed(
                    pdf_id, start_time, 
                    f"No text could be extracted (method: {extraction_method})",
                    file_size, page_count
                )
                return
            
            text_length = len(text)
            logger.info(f"Extracted {text_length} characters from {filename}")
            
            # Chunk text
            chunks = self.chunk_text(text)
            if not chunks:
                logger.warning(f"No chunks created from {filename}")
                await self._mark_processing_failed(
                    pdf_id, start_time,
                    f"No chunks could be created from extracted text",
                    file_size, page_count, text_length
                )
                return
            
            logger.info(f"Created {len(chunks)} chunks from {filename}")
            
            # Store with embeddings
            success = self.rag_service.store_document_chunks(pdf_id, filename, chunks)
            
            end_time = datetime.utcnow()
            processing_duration = (end_time - start_time).total_seconds()
            
            if success:
                # Mark as completed
                await self.db_client.update_pdf_completed(
                    pdf_id=pdf_id,
                    chunk_count=len(chunks),
                    extraction_method=extraction_method,
                    processing_end_time=end_time,
                    processing_duration=processing_duration,
                    text_length=text_length
                )
                logger.info(f"Successfully processed {filename}: {len(chunks)} chunks stored")
            else:
                await self._mark_processing_failed(
                    pdf_id, start_time,
                    f"Failed to store chunks in vector database",
                    file_size, page_count, text_length
                )
            
        except Exception as e:
            logger.error(f"Background processing error for PDF {pdf_id}: {e}")
            await self._mark_processing_failed(
                pdf_id, start_time, str(e), file_size, page_count, text_length
            )
    
    async def _mark_processing_failed(
        self, 
        pdf_id: int, 
        start_time: datetime, 
        error_message: str,
        file_size: int = None,
        page_count: int = None,
        text_length: int = None
    ):
        """Mark PDF processing as failed with error details."""
        end_time = datetime.utcnow()
        processing_duration = (end_time - start_time).total_seconds()
        
        await self.db_client.update_pdf_failed(
            pdf_id=pdf_id,
            error_message=error_message,
            processing_end_time=end_time,
            processing_duration=processing_duration,
            file_size=file_size,
            page_count=page_count,
            text_length=text_length
        )
