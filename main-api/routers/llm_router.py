from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import httpx
import time
import logging
import json

from database import get_db
from schemas import LLMRequest, LLMResponse
from models import LLMInteraction
from services.rag_service import rag_service
from config import settings

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/llm")
async def llm_interact(
    request: LLMRequest,
    db: Session = Depends(get_db)
):
    """
    Enhanced LLM interaction with RAG context integration - Streaming.
    """
    start_time = time.time()
    logger.debug(f"Starting LLM interaction")
    try:
        # Enhance prompt with RAG context if requested
        enhanced_prompt = request.prompt
        context_found = False
        context_length = 0
        logger.debug(f"Processing RAG request: use_rag={request.use_rag}")

        if request.use_rag:
            logger.debug(f"Enhancing prompt with RAG context")
            enhanced_prompt, context_found, context_length = await rag_service.enhance_prompt_with_context(
                request.prompt, 
                max_context_length=request.max_context_length
            )
            
            if context_found:
                logger.info(f"Enhanced prompt with {context_length} characters of context")
            else:
                logger.info("No relevant context found for prompt")
        
        # Prepare Ollama request (streaming)
        ollama_url = f"{settings.OLLAMA_URL}/api/generate"
        payload = {
            "model": settings.OLLAMA_MODEL,
            "prompt": enhanced_prompt,
            "stream": True,
            "options": {
                "temperature": 0.7,
                "top_p": 0.9,
                "max_tokens": 4000
            }
        }
        
        # Request logging (debug level to avoid spam)
        logger.debug(f"Sending request to Ollama: {ollama_url}")
        logger.debug(f"Model: {settings.OLLAMA_MODEL}, Prompt length: {len(enhanced_prompt)} chars")

        async def generate_stream():
            full_response = ""
            try:
                logger.debug(f"Establishing connection to Ollama")
                
                async with httpx.AsyncClient(timeout=180.0) as client:
                    async with client.stream('POST', ollama_url, json=payload) as response:
                        logger.info(f"📡 Ollama response status: {response.status_code}")
                        if response.status_code != 200:
                            error_msg = f"Error from LLM service: {response.status_code}"
                            logger.error(f"❌ {error_msg}")
                            # Try to get error details from response
                            try:
                                error_body = await response.text()
                                logger.error(f"   Error body: {error_body}")
                            except:
                                logger.error("   Could not read error body")
                            yield f"data: {json.dumps({'error': error_msg})}\n\n"
                            return
                        
                        async for chunk in response.aiter_lines():
                            if chunk:
                                try:
                                    data = json.loads(chunk)
                                    if 'response' in data:
                                        token = data['response']
                                        full_response += token
                                        yield f"data: {json.dumps({'token': token})}\n\n"
                                    
                                    if data.get('done', False):
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
                                            prompt=request.prompt[:500],
                                            response=full_response[:1000]
                                        )
                                        db.add(interaction)
                                        db.commit()
                                        
                                        yield f"data: {json.dumps({'done': True, 'context_used': context_found, 'context_length': context_length, 'response_time': processing_time})}\n\n"
                                        break
                                except json.JSONDecodeError:
                                    continue
                                    
            except Exception as e:
                logger.error(f"LLM streaming failed: {str(e)}")
                yield f"data: {json.dumps({'error': f'LLM interaction failed: {str(e)}'})}\n\n"

        return StreamingResponse(generate_stream(), media_type="text/plain")
        
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
        results = await rag_service.search_similar_chunks(request.prompt, n_results=10)
        
        return [
            {
                "content": chunk["content"][:200] + "..." if len(chunk["content"]) > 200 else chunk["content"],
                "similarity": chunk.get("similarity", 0.0),
                "source": chunk.get("metadata", {}).get("filename", "Unknown")
            }
            for chunk in results
        ]
        
    except Exception as e:
        logger.error(f"Document search failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Document search failed: {str(e)}")
