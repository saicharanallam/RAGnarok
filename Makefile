# RAGnarok Makefile - Essential Commands Only

.PHONY: help setup start stop restart rebuild logs test

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