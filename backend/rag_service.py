import os
import pdfplumber
import chromadb
from sentence_transformers import SentenceTransformer
from typing import List, Dict, Tuple
import uuid
from datetime import datetime

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
        """Extract text from a PDF file."""
        text = ""
        try:
            with pdfplumber.open(pdf_path) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
        except Exception as e:
            print(f"Error extracting text from PDF: {e}")
            return ""
        return text
    
    def chunk_text(self, text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
        """Split text into overlapping chunks."""
        if not text.strip():
            return []
        
        words = text.split()
        chunks = []
        
        for i in range(0, len(words), chunk_size - overlap):
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
    
    def process_pdf(self, pdf_path: str, pdf_id: int, filename: str) -> bool:
        """Complete pipeline: extract text, chunk, and store embeddings."""
        try:
            # Extract text
            text = self.extract_text_from_pdf(pdf_path)
            if not text.strip():
                print(f"No text extracted from {filename}")
                return False
            
            # Chunk text
            chunks = self.chunk_text(text)
            if not chunks:
                print(f"No chunks created from {filename}")
                return False
            
            # Store with embeddings
            success = self.store_document(pdf_id, filename, chunks)
            
            if success:
                print(f"Successfully processed {filename}: {len(chunks)} chunks stored")
            else:
                print(f"Failed to store chunks for {filename}")
            
            return success
        except Exception as e:
            print(f"Error processing PDF {filename}: {e}")
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
