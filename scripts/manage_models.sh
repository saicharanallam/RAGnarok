#!/bin/bash

# RAGnarok Model Management Script
# Usage: ./scripts/manage_models.sh [command] [model_name]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
    exit 1
fi

# Check if RAGnarok is running
if ! docker ps | grep -q "ragnarok-ollama"; then
    echo -e "${RED}❌ RAGnarok is not running. Please start it first with 'make start'${NC}"
    exit 1
fi

# Get the Ollama container name
CONTAINER_NAME=$(docker ps --format "table {{.Names}}" | grep "ollama" | head -1)

if [ -z "$CONTAINER_NAME" ]; then
    echo -e "${RED}❌ Ollama container not found. Is RAGnarok running?${NC}"
    exit 1
fi

echo -e "${BLUE}🔍 Using Ollama container: $CONTAINER_NAME${NC}"

case "$1" in
    "list")
        echo -e "${GREEN}📋 Available models:${NC}"
        docker exec -it "$CONTAINER_NAME" ollama list
        ;;
    "pull")
        if [ -z "$2" ]; then
            echo -e "${RED}❌ Please specify a model name${NC}"
            echo "Usage: $0 pull <model_name>"
            echo "Example: $0 pull llama3.2:70b"
            exit 1
        fi
        echo -e "${YELLOW}📥 Downloading model: $2${NC}"
        docker exec -it "$CONTAINER_NAME" ollama pull "$2"
        echo -e "${GREEN}✅ Model downloaded successfully!${NC}"
        ;;
    "rm")
        if [ -z "$2" ]; then
            echo -e "${RED}❌ Please specify a model name${NC}"
            echo "Usage: $0 rm <model_name>"
            echo "Example: $0 rm llama3.2:8b"
            exit 1
        fi
        echo -e "${YELLOW}🗑️ Removing model: $2${NC}"
        docker exec -it "$CONTAINER_NAME" ollama rm "$2"
        echo -e "${GREEN}✅ Model removed successfully!${NC}"
        ;;
    "info")
        echo -e "${GREEN}ℹ️ Ollama container info:${NC}"
        docker exec -it "$CONTAINER_NAME" ollama --version
        echo ""
        echo -e "${GREEN}📊 Container status:${NC}"
        docker ps --filter "name=$CONTAINER_NAME" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
        ;;
    "logs")
        echo -e "${GREEN}📋 Ollama logs:${NC}"
        docker logs "$CONTAINER_NAME" --tail 50 -f
        ;;
    *)
        echo -e "${BLUE}🤖 RAGnarok Model Management${NC}"
        echo ""
        echo "Usage: $0 [command] [model_name]"
        echo ""
        echo "Commands:"
        echo "  list                    - Show all available models"
        echo "  pull <model_name>       - Download a new model"
        echo "  rm <model_name>         - Remove a model"
        echo "  info                    - Show container information"
        echo "  logs                    - Show Ollama logs"
        echo ""
        echo "Examples:"
        echo "  $0 list"
        echo "  $0 pull llama3.2:70b"
        echo "  $0 rm llama3.2:8b"
        echo "  $0 info"
        echo "  $0 logs"
        echo ""
        echo "Popular models:"
        echo "  llama3.2:8b    - Good balance (default)"
        echo "  llama3.2:70b   - High quality, slower"
        echo "  llama3.2:1b    - Fast, lower quality"
        echo "  mistral:7b     - Alternative model"
        ;;
esac
