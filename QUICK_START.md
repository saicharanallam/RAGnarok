# 🚀 RAGnarok Quick Start

## Start RAGnarok (2-5 minutes)

```bash
make start
```

**First time?** The system will automatically download the LLM model (llama3.2:8b) - this takes 2-5 minutes depending on your internet speed.

**Done!** Go to http://localhost:3000

## 🤖 LLM Model Information

- **Model**: `llama3.2:8b` (Meta's latest Llama 3.2 model)
- **Size**: ~4.7GB download
- **Quality**: Excellent for RAG applications, good balance of speed and accuracy
- **Auto-download**: Model is automatically downloaded during first startup

## All Commands

```bash
make start    # Start everything (includes model download)
make stop     # Stop everything  
make logs     # View logs
make test     # Check if working
make clean    # Delete everything (including downloaded models)
```

## Alternative (Python)

```bash
python ragnarok.py start    # Start
python ragnarok.py stop     # Stop
python ragnarok.py logs     # Logs
python ragnarok.py test     # Test
python ragnarok.py clean    # Clean
```

## 🔧 Manual Model Management

**Download a different model:**
```bash
docker exec -it ragnarok-ollama-1 ollama pull llama3.2:70b
```

**List available models:**
```bash
docker exec -it ragnarok-ollama-1 ollama list
```

**Remove a model:**
```bash
docker exec -it ragnarok-ollama-1 ollama rm llama3.2:8b
```

## Troubleshooting

**Not working?**
```bash
make clean && make start
```

**Want to see logs?**
```bash
make logs
```

**Model download stuck?**
```bash
docker-compose logs ollama
```

**Change model in config:**
Edit `main-api/config.py` and `docker-compose.yml`, then restart:
```bash
make stop && make start
```

**Manage models easily:**
```bash
# Command line
./scripts/manage_models.sh list      # Show models
./scripts/manage_models.sh pull llama3.2:70b  # Download new model
./scripts/manage_models.sh rm llama3.2:8b     # Remove model

# Web interface
# Go to Analytics tab → LLM Model Management
# Download, remove, and view models with a beautiful UI!
```

That's it! 🔥