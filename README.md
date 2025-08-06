# RAGnarok

**RAGnarok** is a local Retrieval-Augmented Generation (RAG) assistant that:
- Accepts PDFs (and optionally images)
- Responds using these files as its knowledge base
- Falls back to regular LLM answers when info isn't in the files
- Runs locally first, and is scalable to the web
- Is fully dockerised

## Features
- Upload PDFs/images for knowledge ingestion
- Ask questions and get answers based on uploaded files
- LLM fallback for answers outside file knowledge
- REST API (Flask) + React web UI
- Dockerised for easy deployment
- Uses Postgres for metadata storage

## Tech Stack
- **Backend:** Python (Flask)
- **Frontend:** React
- **Database:** Postgres
- **Containerization:** Docker, Docker Compose

## Getting Started

1. Clone the repo
2. Install Docker & Docker Compose
3. Build and run all services:

```bash
docker compose up --build
```

Frontend will be available at `http://localhost:3000`  
Backend API at `http://localhost:5000`

## Repo Structure

```
backend/
  app.py
  requirements.txt
  Dockerfile
frontend/
  (React app)
  Dockerfile
docker-compose.yml
README.md
.gitignore
```

## Roadmap

- [ ] PDF/Image ingestion
- [ ] RAG pipeline (vector search, embedding)
- [ ] LLM integration
- [ ] Web UI for chat/upload
- [ ] User authentication (optional)
- [ ] Scale to cloud

## License
MIT