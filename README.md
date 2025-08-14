# RAGnarok 🔥

**RAGnarok** is a fully-featured local Retrieval-Augmented Generation (RAG) system that enables intelligent document-based Q&A. Upload your PDFs and ask questions - RAGnarok will search through your documents to provide contextual answers with source attribution.

## ✨ Key Features

### 🧠 Smart Document Processing
- **Automatic PDF Processing**: Upload PDFs and they're immediately processed through the RAG pipeline
- **Text Chunking**: Documents are intelligently split into semantic chunks with overlap
- **Vector Embeddings**: Uses sentence-transformers for high-quality semantic embeddings
- **Persistent Storage**: ChromaDB vector database with persistent storage

### 🔍 Intelligent Question Answering  
- **Semantic Search**: Find relevant content using vector similarity search
- **Source Attribution**: See exactly which documents contributed to each answer
- **Context-Aware Responses**: LLM receives relevant document chunks as context
- **Graceful Fallback**: Provides general knowledge answers when no relevant content found

### 🎨 Modern Web Interface
- **Beautiful UI**: Fire-themed modern interface with collapsible sidebar
- **Real-time Chat**: Interactive chat interface with message history
- **Processing Status**: Visual indicators showing which PDFs have been processed
- **Responsive Design**: Works on desktop and mobile devices

### 🛠 Developer Features
- **REST API**: Complete Flask-based API for all functionality
- **Admin Tools**: Flush and reprocess endpoints for document management
- **Docker Compose**: One-command deployment with all services
- **Database Migration**: Automatic schema updates

## 🚀 Tech Stack

- **Backend:** Python (Flask, SQLAlchemy)
- **LLM:** Ollama (Llama3) - runs locally
- **Embeddings:** Sentence Transformers (all-MiniLM-L6-v2)
- **Vector DB:** ChromaDB for semantic search
- **Database:** PostgreSQL for metadata
- **Frontend:** React.js with modern styling
- **PDF Processing:** pdfplumber for text extraction
- **Containerization:** Docker, Docker Compose

## 🚀 Getting Started

### Prerequisites
- Docker & Docker Compose
- At least 4GB RAM (for Ollama LLM)
- 10GB+ free disk space

### Quick Start
1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
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

## 🔌 API Endpoints

### Document Management
- `POST /api/upload` - Upload and process PDF files
- `GET /api/pdfs` - List all uploaded documents with status
- `GET /api/test` - Health check endpoint

### Chat & RAG
- `POST /api/llm` - Send questions and get RAG-enhanced responses
  ```json
  {
    "prompt": "Your question here",
    "use_rag": true  // optional, defaults to true
  }
  ```

### Admin Tools
- `GET /api/admin/flush` - Clear all documents and embeddings
- `POST /api/admin/reprocess` - Reprocess failed/unprocessed PDFs

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
- ✅ **RAG Pipeline**: Vector embeddings with ChromaDB semantic search  
- ✅ **LLM Integration**: Ollama/Llama3 with context-aware responses
- ✅ **Web UI**: Modern React interface with real-time chat
- ✅ **Source Attribution**: Document provenance in all responses
- ✅ **Persistent Storage**: Vector DB and metadata persistence
- ✅ **Docker Deployment**: One-command multi-service setup
- ✅ **Admin Tools**: Document management and system maintenance

### Future Enhancements
- 🔄 **Image Processing**: OCR for image-based PDFs
- 🔄 **Multi-format Support**: Word docs, text files, web pages
- 🔄 **User Authentication**: Multi-user document isolation
- 🔄 **Advanced Search**: Filtering, metadata search, faceted queries
- 🔄 **Cloud Deployment**: Kubernetes configs and cloud-native features
- 🔄 **Performance Optimization**: Caching, async processing, load balancing

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
