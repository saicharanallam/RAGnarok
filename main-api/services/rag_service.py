import os
import asyncio
from typing import List, Dict, Tuple, Optional
import chromadb
from sentence_transformers import SentenceTransformer
import logging

logger = logging.getLogger(__name__)

class RAGService:
    def __init__(self, chroma_persist_directory: str = "./chroma_db"):
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
    
    async def search_similar_chunks(self, query: str, n_results: int = 5) -> List[Dict]:
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
            logger.error(f"Error searching chunks: {e}")
            return []
    
    async def get_relevant_context(self, query: str, max_context_length: int = 2000) -> Tuple[str, int, bool]:
        """
        Get relevant context for a query, respecting token limits.
        Returns: (context, context_length, context_found)
        """
        try:
            chunks = await self.search_similar_chunks(query, n_results=10)
            
            if not chunks:
                return "", 0, False
            
            context_parts = []
            total_length = 0
            
            for i, chunk in enumerate(chunks):
                chunk_content = chunk['content']
                similarity = chunk['similarity']
                
                # Only include chunks with reasonable similarity (> 0.3)
                if similarity < 0.3:
                    continue
                
                # Add source information
                metadata = chunk.get('metadata', {})
                filename = metadata.get('filename', 'Unknown')
                chunk_header = f"\n--- Source: {filename} (Relevance: {similarity:.2f}) ---\n"
                chunk_with_header = chunk_header + chunk_content
                
                # Check if adding this chunk would exceed the limit
                if total_length + len(chunk_with_header) > max_context_length * 4:  # 4 chars ≈ 1 token
                    break
                
                context_parts.append(chunk_with_header)
                total_length += len(chunk_with_header)
            
            if not context_parts:
                return "", 0, False
            
            context = "\n".join(context_parts)
            return context, len(context), True
            
        except Exception as e:
            logger.error(f"Error getting relevant context: {e}")
            return "", 0, False
    
    async def enhance_prompt_with_context(self, user_prompt: str, max_context_length: int = 2000) -> Tuple[str, bool, int]:
        """
        Enhance user prompt with relevant context from the knowledge base.
        Returns: (enhanced_prompt, context_found, context_length)
        """
        try:
            logger.info(f"Enhancing prompt with context here in rag service")
            context, context_length, context_found = await self.get_relevant_context(user_prompt, max_context_length)
            
            if not context_found:
                return user_prompt, False, 0
            
            # Create enhanced prompt with context
            enhanced_prompt = f"""You are an AI assistant with access to document knowledge. Use the following context to answer the user's question. If the context doesn't contain relevant information, you can provide a general response but mention that you don't have specific information from the documents.

CONTEXT FROM DOCUMENTS:
{context}

USER QUESTION: {user_prompt}

Please provide a helpful and accurate response based on the context above."""
            
            return enhanced_prompt, True, context_length
            
        except Exception as e:
            logger.error(f"Error enhancing prompt with context: {e}")
            return user_prompt, False, 0
    
    def store_document_chunks(self, pdf_id: int, filename: str, chunks: List[str]) -> bool:
        """Store document chunks with embeddings in the vector database."""
        try:
            if not chunks:
                return False
            
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
                    "timestamp": str(asyncio.get_event_loop().time())
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

# Global RAG service instance
rag_service = RAGService()
