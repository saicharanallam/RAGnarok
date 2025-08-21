from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
import httpx
import time
import logging

from database import get_db
from schemas import LLMRequest, LLMResponse
from models import LLMInteraction
from services.rag_service import rag_service
from config import settings

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/llm", response_model=dict)
async def llm_interact(
    request: LLMRequest,
    db: Session = Depends(get_db)
):
    """
    Enhanced LLM interaction with RAG context integration.
    """
    start_time = time.time()
    
    try:
        # Enhance prompt with RAG context if requested
        enhanced_prompt = request.prompt
        context_found = False
        context_length = 0
        
        if request.use_rag:
            enhanced_prompt, context_found, context_length = await rag_service.enhance_prompt_with_context(
                request.prompt, 
                max_context_length=2000
            )
            
            if context_found:
                logger.info(f"Enhanced prompt with {context_length} characters of context")
            else:
                logger.info("No relevant context found for prompt")
        
        # Prepare Ollama request (non-streaming)
        ollama_url = f"{settings.OLLAMA_URL}/api/generate"
        payload = {
            "model": settings.OLLAMA_MODEL,
            "prompt": enhanced_prompt,
            "stream": False,
            "options": {
                "temperature": 0.7,
                "top_p": 0.9,
                "max_tokens": 2000
            }
        }

        # Make request to Ollama
        full_response = ""
        async with httpx.AsyncClient(timeout=180.0) as client:
            response = await client.post(ollama_url, json=payload)
            
            if response.status_code != 200:
                error_msg = f"Error from LLM service: {response.status_code}"
                logger.error(error_msg)
                raise HTTPException(status_code=500, detail=error_msg)
            
            data = response.json()
            full_response = data.get("response", "")
        
        # Log interaction to database
        end_time = time.time()
        processing_time = end_time - start_time
        
        interaction = LLMInteraction(
            prompt_length=len(request.prompt),
            use_rag=request.use_rag,
            context_found=context_found,
            context_length=context_length,
            response_length=len(full_response),
            response_time=processing_time,
            model_used=settings.OLLAMA_MODEL,
            prompt=request.prompt[:500],  # Store first 500 chars
            response=full_response[:1000]  # Store first 1000 chars
        )
        db.add(interaction)
        db.commit()
        
        return {
            "response": full_response,
            "context_used": context_found,
            "context_length": context_length,
            "response_time": processing_time,
            "sources": []  # TODO: Add source information if needed
        }
        
    except Exception as e:
        logger.error(f"LLM interaction failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"LLM interaction failed: {str(e)}")

@router.post("/llm/search", response_model=list)
async def search_documents(
    request: LLMRequest,
    db: Session = Depends(get_db)
):
    """
    Search documents using RAG without LLM generation.
    """
    try:
        if not request.use_rag:
            return []
            
        # Search for relevant chunks
        results = rag_service.search_relevant_chunks(request.prompt, max_chunks=10)
        
        return [
            {
                "content": chunk["content"][:200] + "..." if len(chunk["content"]) > 200 else chunk["content"],
                "similarity": chunk.get("similarity", 0.0),
                "source": chunk.get("source", "Unknown")
            }
            for chunk in results
        ]
        
    except Exception as e:
        logger.error(f"Document search failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Document search failed: {str(e)}")