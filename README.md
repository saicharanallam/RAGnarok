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

## 🛠️ Commands

### Makefile
```bash
make start    # Start everything
make stop     # Stop services
make logs     # View logs
make test     # Check if working
make clean    # Remove everything
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

## 🏗️ Architecture

- **Frontend** (Port 3000): React web app
- **Main API** (Port 8000): FastAPI service
- **PDF Processor** (Port 8001): Document processing
- **Database**: PostgreSQL + ChromaDB + Redis
- **AI**: Ollama (local LLM)

## 🚨 Troubleshooting

**Services won't start?**
```bash
make clean && make start
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