# RAGnarok Makefile - Essential Commands Only

.PHONY: help setup start stop restart rebuild logs test ollama-pull ollama-list ollama-logs ollama-download ollama-test ollama-chat

help: ## Show available commands
	@echo "🔥 RAGnarok - Essential Commands"
	@echo "================================"
	@awk 'BEGIN {FS = ":.*##"} /^[a-zA-Z_-]+:.*?##/ { printf "  \033[36m%-10s\033[0m %s\n", $$1, $$2 }' $(MAKEFILE_LIST)

setup: ## First time setup / Nuclear reset
	@echo "🔥 Setting up RAGnarok..."
	@docker-compose down -v --remove-orphans 2>/dev/null || true
	@docker system prune -f
	@rm -rf chroma_db/* uploads/* || true
	@cp env.example .env 2>/dev/null || true
	@mkdir -p uploads chroma_db logs backups
	@docker-compose build --no-cache
	@docker-compose up -d
	@echo "✅ RAGnarok is ready!"
	@echo "🌐 Frontend: http://localhost:3000"
	@echo "📚 API Docs: http://localhost:8000/docs"

up: ## Start RAGnarok
	@echo "🔥 Starting RAGnarok..."
	@docker-compose up -d
	@echo "✅ RAGnarok started!"
	@echo "⏳ Waiting for services to be ready..."
	@sleep 10
	@$(MAKE) test
	@echo "🌐 Frontend: http://localhost:3000"
	@echo "📚 API Docs: http://localhost:8000/docs"

down: ## Stop RAGnarok
	@echo "🛑 Stopping RAGnarok..."
	@docker-compose down
	@echo "✅ Stopped"

restart: ## Quick restart (no rebuild)
	@echo "🔄 Quick restart..."
	@docker-compose restart
	@echo "✅ Restarted!"
	@echo "⏳ Waiting for services to be ready..."
	@sleep 10
	@$(MAKE) test

rebuild: ## Restart with code changes (rebuilds images)
	@echo "🔨 Rebuilding with fresh code..."
	@docker-compose down
	@docker-compose up --build -d
	@echo "✅ Rebuilt with latest code!"
	@echo "⏳ Waiting for services to be ready..."
	@sleep 10
	@$(MAKE) test

logs: ## View logs
	@echo "📜 Viewing logs (Ctrl+C to exit)..."
	@docker-compose logs -f

elogs: ## View logs
	@echo "📜 Viewing logs (Ctrl+C to exit)..."
	@docker-compose logs -f | grep -A5 -B5 "llm\|error\|ERROR"

test: ## Test all services
	@echo "🧪 Testing RAGnarok services..."
	@echo "   📡 Testing Main API..."
	@curl -s http://localhost:8000/api/test >/dev/null && echo "   ✅ Main API working" || echo "   ❌ Main API not responding"
	@echo "   📄 Testing PDF Processor..."
	@curl -s http://localhost:8001/health >/dev/null && echo "   ✅ PDF Processor working" || echo "   ❌ PDF Processor not responding"
	@echo "   🌐 Testing Frontend..."
	@curl -s http://localhost:3000 >/dev/null && echo "   ✅ Frontend working" || echo "   ❌ Frontend not responding"
	@echo "   🤖 Testing Ollama LLM..."
	@curl -s http://localhost:11434/api/tags >/dev/null && echo "   ✅ Ollama working" || echo "   ❌ Ollama not responding"
	@echo "🏁 All tests complete!"

ollama-pull: ## Download a specific LLM model to Ollama
	@echo "🤖 Downloading LLM model..."
	@if [ -z "$(MODEL)" ]; then \
			echo "Usage: make ollama-pull MODEL=mistral:7b"; \
	echo "Available models: mistral:7b, llama3.2:70b, codellama:7b, llama3.2:3b"; \
	exit 1; \
	fi
	@docker exec ragnarok_ollama_1 ollama pull $(MODEL)
	@echo "✅ Model $(MODEL) downloaded successfully!"

ollama-list: ## List available models in Ollama
	@echo "🤖 Available models in Ollama:"
	@docker exec ragnarok_ollama_1 ollama list

ollama-logs: ## View Ollama logs
	@echo "🤖 Viewing Ollama logs (Ctrl+C to exit)..."
	@docker-compose logs -f ollama

ollama-download: ## Download a model to Ollama (check if exists first)
	@echo "🤖 Downloading model to Ollama..."
	@if [ -z "$(MODEL)" ]; then \
			echo "Usage: make ollama-download MODEL=mistral:7b"; \
	echo "Available models: mistral:7b, llama3.2:3b, llama3.2:70b, codellama:7b"; \
	exit 1; \
	fi
	@echo "🔍 Checking if model $(MODEL) already exists..."
	@if curl -s http://localhost:11434/api/tags | grep -q "$(MODEL)"; then \
		echo "✅ Model $(MODEL) already exists, skipping download"; \
	else \
		echo "📥 Model $(MODEL) not found, downloading..."; \
		curl -s -X POST http://localhost:11434/api/pull -d "{\"name\":\"$(MODEL)\"}"; \
		echo "✅ Model $(MODEL) downloaded successfully!"; \
	fi

ollama-test: ## Test prompt generation with Ollama
	@echo "🤖 Testing prompt generation with Ollama..."
	@if [ -z "$(PROMPT)" ]; then \
		echo "Usage: make ollama-test PROMPT='Your test prompt here'"; \
		echo "Example: make ollama-test PROMPT='What is 2+2?'"; \
		exit 1; \
	fi
	@if [ -z "$(MODEL)" ]; then \
		echo "⚠️  No model specified, using default: mistral:7b"; \
		curl -s -X POST http://localhost:11434/api/generate \
			-d "{\"model\":\"mistral:7b\",\"prompt\":\"$(PROMPT)\",\"stream\":false}"; \
	else \
		echo "🎯 Using specified model: $(MODEL)"; \
		curl -s -X POST http://localhost:11434/api/generate \
			-d "{\"model\":\"$(MODEL)\",\"prompt\":\"$(PROMPT)\",\"stream\":false}"; \
	fi

ollama-chat: ## Interactive chat with Ollama
	@echo "🤖 Starting interactive chat with Ollama..."
	@if [ -z "$(MODEL)" ]; then \
		echo "⚠️  No model specified, using default: mistral:7b"; \
		echo "💬 Chat started with model: mistral:7b (Type 'quit' to exit)"; \
		echo "=================================================="; \
		while true; do \
			read -p "You: " prompt; \
			if [ "$$prompt" = "quit" ]; then \
				echo "👋 Goodbye!"; \
				break; \
			fi; \
			if [ -n "$$prompt" ]; then \
				echo "🤖 AI:"; \
				curl -s -X POST http://localhost:11434/api/generate \
					-d "{\"model\":\"mistral:7b\",\"prompt\":\"$$prompt\",\"stream\":false}"; \
				echo ""; \
			fi; \
		done; \
	else \
		echo "🎯 Using specified model: $(MODEL)"; \
		echo "💬 Chat started with model: $(MODEL) (Type 'quit' to exit)"; \
		echo "=================================================="; \
		while true; do \
			read -p "You: " prompt; \
			if [ "$$prompt" = "quit" ]; then \
				echo "👋 Goodbye!"; \
				break; \
			fi; \
			if [ -n "$$prompt" ]; then \
				echo "🤖 AI:"; \
				curl -s -X POST http://localhost:11434/api/generate \
					-d "{\"model\":\"$(MODEL)\",\"prompt\":\"$$prompt\",\"stream\":false}"; \
				echo ""; \
			fi; \
		done; \
	fi