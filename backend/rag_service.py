import os
import pdfplumber
import chromadb
from sentence_transformers import SentenceTransformer
from typing import List, Dict, Tuple
import uuid
from datetime import datetime
import pytesseract
from PIL import Image
from pdf2image import convert_from_path
import tempfile

class RAGService:
    def __init__(self, chroma_persist_directory="./chroma_db"):
        """Initialize the RAG service with embedding model and vector database."""
        self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
        self.chroma_client = chromadb.PersistentClient(path=chroma_persist_directory)
        
        # Create or get collection
        try:
            self.collection = self.chroma_client.get_collection("documents")
        except:
            self.collection = self.chroma_client.create_collection(
                name="documents",
                metadata={"hnsw:space": "cosine"}
            )
    
    def extract_text_from_pdf(self, pdf_path: str) -> str:
        """Extract text from a PDF file using both text extraction and OCR."""
        text, _ = self.extract_text_from_pdf_with_method(pdf_path)
        return text
    
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
            print(f"Error with pdfplumber extraction: {e}")
        return text
    
    def _extract_text_with_ocr(self, pdf_path: str) -> str:
        """Extract text from PDF using OCR for image-based content."""
        text = ""
        images = []
        try:
            # Convert PDF pages to images
            images = convert_from_path(pdf_path, dpi=200)
            
            print(f"Processing {len(images)} pages with OCR...")
            
            for i, image in enumerate(images):
                try:
                    # Use OCR to extract text from the image
                    page_text = pytesseract.image_to_string(image, lang='eng')
                    if page_text.strip():
                        text += f"\n--- Page {i+1} (OCR) ---\n{page_text}\n"
                        print(f"Page {i+1}: Extracted {len(page_text)} characters via OCR")
                except Exception as e:
                    print(f"OCR failed on page {i+1}: {e}")
                finally:
                    # Clean up image memory
                    if hasattr(image, 'close'):
                        image.close()
                    
        except Exception as e:
            print(f"Error with OCR extraction: {e}")
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
        """Check if extracted text contains meaningful content (not just whitespace/numbers)."""
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
    
    def chunk_text(self, text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
        """Split text into overlapping chunks."""
        if not text.strip():
            return []
        
        # Limit chunk size to prevent memory issues
        max_chunk_size = 1000
        chunk_size = min(chunk_size, max_chunk_size)
        
        # Limit overlap to prevent excessive overlap
        max_overlap = min(overlap, chunk_size // 2)
        
        words = text.split()
        chunks = []
        
        # Limit total chunks to prevent memory explosion
        max_chunks = 1000
        
        for i in range(0, len(words), chunk_size - max_overlap):
            if len(chunks) >= max_chunks:
                print(f"Warning: Reached maximum chunk limit ({max_chunks}) for text processing")
                break
                
            chunk = " ".join(words[i:i + chunk_size])
            if chunk.strip():
                chunks.append(chunk.strip())
        
        return chunks
    
    def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for a list of texts."""
        if not texts:
            return []
        
        embeddings = self.embedding_model.encode(texts)
        return embeddings.tolist()
    
    def store_document(self, pdf_id: int, filename: str, chunks: List[str]) -> bool:
        """Store document chunks with embeddings in the vector database."""
        try:
            if not chunks:
                return False
            
            # Generate embeddings
            embeddings = self.generate_embeddings(chunks)
            
            # Create unique IDs for each chunk
            chunk_ids = [f"{pdf_id}_{i}" for i in range(len(chunks))]
            
            # Create metadata for each chunk
            metadatas = [
                {
                    "pdf_id": pdf_id,
                    "filename": filename,
                    "chunk_index": i,
                    "timestamp": datetime.utcnow().isoformat()
                }
                for i in range(len(chunks))
            ]
            
            # Store in ChromaDB
            self.collection.add(
                embeddings=embeddings,
                documents=chunks,
                metadatas=metadatas,
                ids=chunk_ids
            )
            
            return True
        except Exception as e:
            print(f"Error storing document: {e}")
            return False
    
    def search_similar_chunks(self, query: str, n_results: int = 5) -> List[Dict]:
        """Search for similar chunks given a query."""
        try:
            # Generate embedding for the query
            query_embedding = self.embedding_model.encode([query]).tolist()
            
            # Search in ChromaDB
            results = self.collection.query(
                query_embeddings=query_embedding,
                n_results=n_results,
                include=["documents", "metadatas", "distances"]
            )
            
            # Format results
            formatted_results = []
            if results['documents'] and results['documents'][0]:
                for i, doc in enumerate(results['documents'][0]):
                    formatted_results.append({
                        "content": doc,
                        "metadata": results['metadatas'][0][i],
                        "similarity": 1 - results['distances'][0][i]  # Convert distance to similarity
                    })
            
            return formatted_results
        except Exception as e:
            print(f"Error searching chunks: {e}")
            return []
    
    def process_pdf(self, pdf_path: str, pdf_id: int, filename: str) -> tuple[bool, str]:
        """Complete pipeline: extract text, chunk, and store embeddings."""
        try:
            # Extract text and determine method used
            text, extraction_method = self.extract_text_from_pdf_with_method(pdf_path)
            if not text.strip():
                print(f"No text extracted from {filename}")
                return False, extraction_method
            
            # Chunk text
            chunks = self.chunk_text(text)
            if not chunks:
                print(f"No chunks created from {filename}")
                return False, extraction_method
            
            # Store with embeddings
            success = self.store_document(pdf_id, filename, chunks)
            
            if success:
                print(f"Successfully processed {filename}: {len(chunks)} chunks stored using {extraction_method}")
            else:
                print(f"Failed to store chunks for {filename}")
            
            return success, extraction_method
        except Exception as e:
            print(f"Error processing PDF {filename}: {e}")
            return False, "error"
    
    def extract_text_from_pdf_with_method(self, pdf_path: str) -> tuple[str, str]:
        """Extract text and return the method used."""
        try:
            # First, try standard text extraction
            text_extracted = self._extract_selectable_text(pdf_path)
            
            # Check if we got meaningful text (more than just whitespace/numbers)
            meaningful_text = self._has_meaningful_text(text_extracted)
            
            if meaningful_text:
                print(f"Found selectable text in PDF: {len(text_extracted)} characters")
                
                # Check if there are also images with text (cache OCR result)
                try:
                    ocr_text = self._extract_text_with_ocr(pdf_path)
                    if self._has_meaningful_text(ocr_text):
                        print("PDF has both selectable text and images, combining both...")
                        combined_text = f"{text_extracted}\n\n--- Text from Images ---\n{ocr_text}"
                        return combined_text, "mixed"
                    else:
                        return text_extracted, "text"
                except Exception as e:
                    print(f"OCR check failed, using text only: {e}")
                    return text_extracted, "text"
            else:
                print("No meaningful selectable text found, trying OCR...")
                ocr_text = self._extract_text_with_ocr(pdf_path)
                return ocr_text, "ocr"
                
        except Exception as e:
            print(f"Error extracting text from PDF: {e}")
            return "", "error"
    
    def delete_document(self, pdf_id: int):
        """Delete all chunks for a specific PDF."""
        try:
            # Get all chunk IDs for this PDF
            results = self.collection.get(
                where={"pdf_id": pdf_id},
                include=["documents"]
            )
            
            if results['ids']:
                self.collection.delete(ids=results['ids'])
                print(f"Deleted {len(results['ids'])} chunks for PDF {pdf_id}")
        except Exception as e:
            print(f"Error deleting document chunks: {e}")
    
    def flush_all_documents(self):
        """Delete all documents from the vector database."""
        try:
            # Delete the collection and recreate it
            self.chroma_client.delete_collection("documents")
            self.collection = self.chroma_client.create_collection(
                name="documents",
                metadata={"hnsw:space": "cosine"}
            )
            print("Flushed all documents from vector database")
        except Exception as e:
            print(f"Error flushing documents: {e}")
    
    def count_chunks_for_pdf(self, pdf_id: int) -> int:
        """Efficiently count chunks for a specific PDF."""
        try:
            results = self.collection.get(
                where={"pdf_id": pdf_id},
                include=["documents"]
            )
            return len(results['ids']) if results['ids'] else 0
        except Exception as e:
            print(f"Error counting chunks for PDF {pdf_id}: {e}")
            # Try alternative method if primary fails
            try:
                # Fallback: search with empty query and filter by metadata
                search_results = self.collection.query(
                    query_embeddings=[[0.0] * 384],  # Dummy embedding
                    n_results=1000,
                    where={"pdf_id": pdf_id}
                )
                return len(search_results['ids']) if search_results['ids'] else 0
            except Exception as fallback_error:
                print(f"Fallback counting also failed for PDF {pdf_id}: {fallback_error}")
                return 0
    
    def get_relevant_context(self, query: str, max_context_length: int = 2000) -> str:
        """Get relevant context for a query, respecting token limits."""
        chunks = self.search_similar_chunks(query, n_results=10)
        
        context = ""
        for chunk in chunks:
            chunk_content = chunk['content']
            # Simple approximation: 4 characters ≈ 1 token
            if len(context) + len(chunk_content) < max_context_length * 4:
                context += f"\n---\n{chunk_content}"
            else:
                break
        
        return context.strip()
