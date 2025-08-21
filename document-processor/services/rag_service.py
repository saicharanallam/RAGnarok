import chromadb
from sentence_transformers import SentenceTransformer
from typing import List
import logging
from datetime import datetime

from config import settings

logger = logging.getLogger(__name__)

class RAGService:
    def __init__(self):
        """Initialize the RAG service with embedding model and vector database."""
        self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
        self.chroma_client = chromadb.PersistentClient(path=settings.CHROMA_PERSIST_DIRECTORY)
        
        # Create or get collection
        try:
            self.collection = self.chroma_client.get_collection("documents")
        except:
            self.collection = self.chroma_client.create_collection(
                name="documents",
                metadata={"hnsw:space": "cosine"}
            )
            logger.info("Created new ChromaDB collection 'documents'")
    
    def store_document_chunks(self, pdf_id: int, filename: str, chunks: List[str]) -> bool:
        """Store document chunks with embeddings in the vector database."""
        try:
            if not chunks:
                return False
            
            logger.info(f"Generating embeddings for {len(chunks)} chunks from {filename}")
            
            # Generate embeddings
            embeddings = self.embedding_model.encode(chunks).tolist()
            
            # Create unique IDs for each chunk
            chunk_ids = [f"{pdf_id}_{i}" for i in range(len(chunks))]
            
            # Create metadata for each chunk
            metadatas = [
                {
                    "pdf_id": pdf_id,
                    "filename": filename,
                    "chunk_index": i,
                    "timestamp": datetime.utcnow().isoformat(),
                    "chunk_length": len(chunk)
                }
                for i, chunk in enumerate(chunks)
            ]
            
            # Store in ChromaDB
            self.collection.add(
                embeddings=embeddings,
                documents=chunks,
                metadatas=metadatas,
                ids=chunk_ids
            )
            
            logger.info(f"Successfully stored {len(chunks)} chunks for {filename}")
            return True
            
        except Exception as e:
            logger.error(f"Error storing document chunks: {e}")
            return False
    
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
                logger.info(f"Deleted {len(results['ids'])} chunks for PDF {pdf_id}")
            else:
                logger.info(f"No chunks found for PDF {pdf_id}")
                
        except Exception as e:
            logger.error(f"Error deleting document chunks: {e}")
    
    def count_chunks_for_pdf(self, pdf_id: int) -> int:
        """Count chunks for a specific PDF."""
        try:
            results = self.collection.get(
                where={"pdf_id": pdf_id},
                include=["documents"]
            )
            return len(results['ids']) if results['ids'] else 0
        except Exception as e:
            logger.error(f"Error counting chunks for PDF {pdf_id}: {e}")
            return 0
    
    def flush_all_documents(self):
        """Delete all documents from the vector database."""
        try:
            # Delete the collection and recreate it
            self.chroma_client.delete_collection("documents")
            self.collection = self.chroma_client.create_collection(
                name="documents",
                metadata={"hnsw:space": "cosine"}
            )
            logger.info("Flushed all documents from vector database")
        except Exception as e:
            logger.error(f"Error flushing documents: {e}")
    
    def get_collection_stats(self) -> dict:
        """Get statistics about the document collection."""
        try:
            # Get total count
            results = self.collection.get(include=["metadatas"])
            total_chunks = len(results['ids']) if results['ids'] else 0
            
            # Count unique PDFs
            unique_pdfs = set()
            if results['metadatas']:
                for metadata in results['metadatas']:
                    unique_pdfs.add(metadata.get('pdf_id'))
            
            return {
                "total_chunks": total_chunks,
                "unique_documents": len(unique_pdfs),
                "collection_name": "documents"
            }
        except Exception as e:
            logger.error(f"Error getting collection stats: {e}")
            return {"error": str(e)}
