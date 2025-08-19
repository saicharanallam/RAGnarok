# RAGnarok 🔥

**RAGnarok** is a fully-featured local Retrieval-Augmented Generation (RAG) system that enables intelligent document-based Q&A. Upload your PDFs and ask questions - RAGnarok will search through your documents to provide contextual answers with source attribution.

## ✨ Key Features

### 🧠 Smart Document Processing
- **Automatic PDF Processing**: Upload PDFs and they're immediately processed through the RAG pipeline
- **OCR Support**: Handles image-based PDFs with Tesseract OCR technology
- **Text Chunking**: Documents are intelligently split into semantic chunks with overlap
- **Vector Embeddings**: Uses sentence-transformers for high-quality semantic embeddings
- **Persistent Storage**: ChromaDB vector database with persistent storage
- **Processing Analytics**: Track processing time, file size, page count, and extraction methods

### 🔍 Intelligent Question Answering  
- **Semantic Search**: Find relevant content using vector similarity search
- **Streaming Responses**: Real-time LLM responses with typing indicators
- **Source Attribution**: See exactly which documents contributed to each answer
- **Context-Aware Responses**: LLM receives relevant document chunks as context
- **Graceful Fallback**: Provides general knowledge answers when no relevant content found
- **Performance Tracking**: Monitor response times, prompt/response lengths, and success rates

### 🎨 Modern Web Interface
- **Beautiful UI**: Fire-themed modern interface with realistic flame animations
- **Tabbed Sidebar**: Organized upload and document management interface
- **Real-time Chat**: Interactive chat interface with streaming responses
- **Processing Status**: Visual indicators showing which PDFs have been processed
- **Responsive Design**: Scalable card-based layout for growing document collections
- **Search & Filter**: Find and filter documents by status and filename

### 🛠 Developer Features
- **REST API**: Complete Flask-based API for all functionality
- **Swagger Documentation**: Interactive API documentation at `/swagger/`
- **Admin Tools**: Flush and reprocess endpoints for document management
- **Docker Compose**: One-command deployment with all services
- **Database Migration**: Automatic schema updates
- **Analytics Dashboard**: Comprehensive system and usage analytics

## 🚀 Tech Stack

- **Backend:** Python (Flask, SQLAlchemy, Flasgger)
- **LLM:** Ollama (Llama3) - runs locally with streaming support
- **Embeddings:** Sentence Transformers (all-MiniLM-L6-v2)
- **Vector DB:** ChromaDB for semantic search
- **Database:** PostgreSQL for metadata and analytics
- **Frontend:** React.js with modern styling and real-time features
- **PDF Processing:** pdfplumber + Tesseract OCR for comprehensive text extraction
- **Analytics:** psutil for system monitoring and performance tracking
- **Containerization:** Docker, Docker Compose with health checks

## 🚀 Getting Started

### Prerequisites
- Docker & Docker Compose
- At least 4GB RAM (for Ollama LLM)
- 10GB+ free disk space

### Quick Start
1. **Clone the repository**
   ```bash
   git clone https://github.com/saicharanallam/RAGnarok.git
   cd RAGnarok
   ```

2. **Start all services**
   ```bash
   docker-compose up --build
   ```
   
   **First run notes:**
   - Downloads Docker images for Python, Node, PostgreSQL, and Ollama
   - Ollama will download the Llama3 model (~4GB) on first use
   - May take 10-15 minutes for initial setup

3. **Access the application**
   - **Frontend:** http://localhost:3000
   - **Backend API:** http://localhost:5000
   - **Swagger API Docs:** http://localhost:5000/swagger/
   - **Database:** localhost:5432 (postgres/postgres)

### First Steps
1. 📄 Upload a PDF using the sidebar upload interface
2. ⏳ Wait for processing (you'll see "✓ Processed" with chunk count)
3. 💬 Ask questions about your document in the chat interface
4. 🎯 See source attribution and relevant context in responses

## 📖 Usage Guide

### Uploading Documents
- Click the upload area in the left sidebar
- Select PDF files (multiple uploads supported)
- Documents are automatically processed through the RAG pipeline
- Processing status shows: "✓ Processed (X chunks)" or "⚠ Not processed"

### Asking Questions
- Type questions in the chat interface
- RAGnarok searches your uploaded documents for relevant context
- Responses include:
  - **📚 Sources**: Which documents were referenced
  - **ℹ️ Context indicators**: Whether answer came from documents or general knowledge

### Example Queries
- "What is this document about?"
- "Summarize the main points"
- "What does it say about [specific topic]?"
- "Compare the information in document A vs document B"

## 📁 Project Structure

```
RAGnarok/
├── backend/
│   ├── app.py              # Flask application entry point
│   ├── routes.py           # API endpoints
│   ├── models.py           # Database models
│   ├── rag_service.py      # RAG pipeline implementation
│   ├── config.py           # Configuration settings
│   ├── init_db.py          # Database initialization
│   ├── migrate_db.py       # Database migration script
│   ├── test_rag.py         # RAG testing utilities
│   ├── requirements.txt    # Python dependencies
│   ├── Dockerfile          # Backend container config
│   └── uploads/            # Uploaded PDF storage
├── frontend/
│   ├── src/
│   │   ├── App.js          # Main React component
│   │   ├── HomePage.jsx    # Main page layout
│   │   ├── UploadCard.jsx  # PDF upload interface
│   │   ├── PDFListCard.jsx # Document management
│   │   ├── LLMInteractCard.jsx # Chat interface
│   │   ├── FireBackground.jsx  # Animated background
│   │   └── styles.css      # Custom styling
│   ├── public/
│   ├── package.json        # Node.js dependencies
│   └── Dockerfile          # Frontend container config
├── docker-compose.yml      # Multi-service orchestration
└── README.md
```

## 🔌 API Documentation

### Swagger Documentation
Interactive API documentation is available at **http://localhost:5000/swagger/** when the application is running.

### Core API Endpoints

#### Document Management
- `POST /api/upload` - Upload and process PDF files (with file size validation)
- `GET /api/pdfs` - List all uploaded documents with pagination and status
- `GET /api/pdfs/{id}/status` - Get processing status for specific PDF
- `GET /api/test` - Health check endpoint

#### Chat & RAG
- `POST /api/llm` - Send questions and get streaming RAG-enhanced responses
  ```json
  {
    "prompt": "Your question here",
    "use_rag": true  // optional, defaults to true
  }
  ```
  Returns: Server-Sent Events (SSE) stream for real-time responses

#### Analytics
- `GET /api/analytics/overview` - Get comprehensive system analytics
- `GET /api/analytics/pdf/{id}` - Get detailed analytics for specific PDF

#### Admin Tools
- `GET /api/admin/flush` - Clear all documents, embeddings, and analytics
- `POST /api/admin/reprocess` - Reprocess failed/unprocessed PDFs

### API Features
- **Streaming Responses**: Real-time LLM output via Server-Sent Events
- **Pagination**: Efficient handling of large document collections
- **Analytics Tracking**: Comprehensive performance and usage metrics
- **Error Handling**: Detailed error responses with proper HTTP status codes
- **File Validation**: Size limits and type checking for uploads

## 📊 Component Documentation

Detailed React component documentation is available in [`frontend/src/components/README.md`](frontend/src/components/README.md), covering:
- Component architecture and design principles
- State management patterns
- Performance optimizations
- Testing strategies
- Development guidelines

## 🛠 Troubleshooting

### Common Issues

**PDF Processing Fails**
- Check if PDF contains extractable text (not just images)
- Try the reprocess endpoint: `POST /api/admin/reprocess`
- Check backend logs: `docker-compose logs backend`

**Ollama Model Download Slow**
- First run downloads ~4GB Llama3 model
- Check progress: `docker-compose logs ollama`
- Ensure stable internet connection

**Out of Memory Errors**
- Ensure at least 4GB RAM available
- Reduce chunk size in `rag_service.py` if needed
- Monitor usage: `docker stats`

**Vector Search Returns No Results**
- Check document processing status in sidebar
- Try broader/different question phrasing
- Verify embeddings: run `python test_rag.py` in backend container

### Development Commands

```bash
# View logs
docker-compose logs -f [service_name]

# Access backend container
docker exec -it ragnarok-backend-1 /bin/bash

# Run RAG pipeline tests
docker exec -it ragnarok-backend-1 python test_rag.py

# Reset everything
docker-compose down -v && docker-compose up --build
```

## ✅ Implementation Status

- ✅ **PDF Ingestion**: Automatic text extraction and processing
- ✅ **OCR Support**: Tesseract OCR for image-based PDFs
- ✅ **RAG Pipeline**: Vector embeddings with ChromaDB semantic search  
- ✅ **LLM Integration**: Ollama/Llama3 with streaming responses
- ✅ **Web UI**: Modern React interface with real-time chat
- ✅ **Source Attribution**: Document provenance in all responses
- ✅ **Persistent Storage**: Vector DB and metadata persistence
- ✅ **Docker Deployment**: One-command multi-service setup with health checks
- ✅ **Admin Tools**: Document management and system maintenance
- ✅ **Analytics Dashboard**: Comprehensive performance and usage tracking
- ✅ **API Documentation**: Interactive Swagger documentation
- ✅ **Streaming Responses**: Real-time LLM output with typing indicators
- ✅ **Background Processing**: Asynchronous PDF processing
- ✅ **Component Documentation**: Detailed React component guides

### Future Enhancements
- 🔄 **Multi-format Support**: Word docs, text files, web pages
- 🔄 **User Authentication**: Multi-user document isolation
- 🔄 **Advanced Search**: Filtering, metadata search, faceted queries
- 🔄 **Cloud Deployment**: Kubernetes configs and cloud-native features
- 🔄 **Performance Optimization**: Caching, load balancing, auto-scaling
- 🔄 **ML Enhancements**: Custom embeddings, fine-tuned models
- 🔄 **Data Export**: Analytics dashboards, usage reports

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

---

**RAGnarok** - *When documents meet AI, knowledge becomes power* 🔥
