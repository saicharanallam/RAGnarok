# 🔥 RAGnarok - AI Document Chat

Upload PDFs and chat with them using AI! Built with FastAPI microservices.

## 🚀 Quick Start

```bash
# Option 1: Makefile
make start

# Option 2: Python script  
python ragnarok.py start

# Option 3: Docker
docker-compose up --build
```

**That's it!** Access at:
- **Chat**: http://localhost:3000
- **API**: http://localhost:8000/docs

## 📱 Usage

1. **Upload PDF**: Go to http://localhost:3000 and upload a PDF
2. **Chat**: Ask questions about your document
3. **Get AI answers**: With context from your PDFs!

## 🤖 AI Model Features

- **Model**: `mistral:7b` - Mistral AI's high-quality 7B parameter model
- **Quality**: Excellent reasoning and text generation for RAG applications
- **Speed**: Optimized for real-time chat interactions
- **Context**: Enhanced with your document content for accurate answers
- **Auto-setup**: Model downloads automatically on first startup

## 🎯 Ollama Model Management

### Available Models
- **llama3.2:3b** - Fast, lightweight (2GB)
- **mistral:7b** - Balanced performance (4.4GB) 
- **llama3.2:70b** - High quality, slower (40GB+)
- **mistral:7b** - Fast and capable (4.4GB)
- **codellama:7b** - Specialized for code (4.4GB)

### Quick Examples
```bash
# Download a model (only if not already present)
make ollama-download MODEL=mistral:7b

# Test a prompt
make ollama-test PROMPT="Explain quantum computing"

# Start interactive chat
make ollama-chat MODEL=mistral:7b

# List what models you have
make ollama-list
```

## 🛠️ Commands

### Makefile
```bash
# Core Commands
make start    # Start everything
make stop     # Stop services
make logs     # View logs
make test     # Check if working
make clean    # Remove everything

# Ollama AI Model Management
make ollama-list           # List available models
make ollama-download MODEL=mistral:7b    # Download model (checks if exists first)
make ollama-test PROMPT="Your prompt"     # Test prompt generation
make ollama-chat                           # Interactive chat with default model
make ollama-chat MODEL=mistral:7b          # Interactive chat with specific model
make ollama-logs                           # View Ollama service logs
```

### Python Script
```bash
python ragnarok.py start    # Start everything
python ragnarok.py stop     # Stop services
python ragnarok.py logs     # View logs
python ragnarok.py test     # Check if working
python ragnarok.py clean    # Remove everything
```

## 🔧 Requirements

- Docker & Docker Compose
- 8GB+ RAM (for AI model)
- 10GB+ disk space
- Internet connection (first time only - for model download)

## 🏗️ Architecture

- **Frontend** (Port 3000): React web app
- **Main API** (Port 8000): FastAPI service
- **PDF Processor** (Port 8001): Document processing
- **Database**: PostgreSQL + ChromaDB + Redis
- **AI**: Ollama with mistral:7b (local LLM)

## 🚨 Troubleshooting

**Services won't start?**
```bash
make clean && make start
```

**First startup taking long?**
The system automatically downloads the LLM model (~4.7GB). Check progress with:
```bash
make logs
```

**Want to see what's happening?**
```bash
make logs
```

**Check if everything is working:**
```bash
make test
```

## 📂 What Gets Created

- `uploads/` - Your PDF files (ignored by git)
- `chroma_db/` - AI embeddings (ignored by git)
- `.env` - Configuration (ignored by git)

## 🔒 Privacy

- Everything runs locally
- No data sent to external services
- Your documents stay private

---

**That's it! Simple and powerful document AI.** 🔥