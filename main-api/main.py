from fastapi import FastAPI, HTTPException, Depends, File, UploadFile, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import uvicorn
import os
from contextlib import asynccontextmanager

from database import engine, get_db
from models import Base
from routers import pdf_router, llm_router, analytics_router, admin_router, internal_router
from config import settings

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    Base.metadata.create_all(bind=engine)
    
    # Create upload directory
    os.makedirs(settings.UPLOAD_FOLDER, exist_ok=True)
    
    yield
    
    # Shutdown
    pass

app = FastAPI(
    title="RAGnarok API",
    description="A powerful RAG (Retrieval-Augmented Generation) system for PDF document processing and intelligent querying",
    version="2.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # React frontend (development)
        "http://127.0.0.1:3000",  # Alternative localhost
        "http://frontend:3000",   # Docker internal network
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(pdf_router.router, prefix="/api", tags=["documents"])
app.include_router(llm_router.router, prefix="/api", tags=["llm"])
app.include_router(analytics_router.router, prefix="/api", tags=["analytics"])
app.include_router(admin_router.router, prefix="/api", tags=["admin"])
app.include_router(internal_router.router, tags=["internal"])

@app.get("/api/test")
async def test_api():
    return {"message": "FastAPI Backend is working!"}

@app.get("/")
async def root():
    return {"message": "RAGnarok FastAPI Backend", "version": "2.0.0"}

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
