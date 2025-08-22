FROM ollama/ollama:latest

# Set the model to download
ENV OLLAMA_MODEL=llama3.2:8b

# Create a startup script using a different approach
RUN echo '#!/bin/sh' > /start.sh && \
    echo 'set -e' >> /start.sh && \
    echo 'echo "🚀 Starting Ollama..."' >> /start.sh && \
    echo 'ollama serve &' >> /start.sh && \
    echo 'echo "⏳ Waiting for Ollama to be ready..."' >> /start.sh && \
    echo 'sleep 15' >> /start.sh && \
    echo 'echo "📥 Downloading model: $OLLAMA_MODEL"' >> /start.sh && \
    echo 'ollama pull $OLLAMA_MODEL' >> /start.sh && \
    echo 'echo "✅ Model downloaded successfully!"' >> /start.sh && \
    echo 'echo "🔄 Restarting Ollama with downloaded model..."' >> /start.sh && \
    echo 'pkill ollama || true' >> /start.sh && \
    echo 'sleep 3' >> /start.sh && \
    echo 'echo "🚀 Starting Ollama with downloaded model..."' >> /start.sh && \
    echo 'exec ollama serve' >> /start.sh

RUN chmod +x /start.sh

# Expose the Ollama port
EXPOSE 11434

# Use shell to run our script
ENTRYPOINT ["/bin/sh", "/start.sh"]
