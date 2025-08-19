import React, { useState } from "react";

const LLMInteractCard = ({ maxWidth = 700 }) => {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [streamingResponse, setStreamingResponse] = useState("");
  const [sourcesUsed, setSourcesUsed] = useState([]);
  const [contextFound, setContextFound] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [useRag, setUseRag] = useState(true);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsLoading(true);
    setIsStreaming(false);
    setResponse("");
    setStreamingResponse("");
    setSourcesUsed([]);
    setContextFound(false);
    setError("");

    try {
      const response = await fetch("/api/llm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          use_rag: useRag,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Handle streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullResponse = "";

      setIsLoading(false);
      setIsStreaming(true);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              switch (data.type) {
                case 'start':
                  setSourcesUsed(data.sources_used || []);
                  setContextFound(data.context_found || false);
                  break;
                  
                case 'chunk':
                  if (data.content) {
                    fullResponse += data.content;
                    setStreamingResponse(fullResponse);
                  }
                  break;
                  
                case 'done':
                  setIsStreaming(false);
                  setResponse(fullResponse);
                  setStreamingResponse("");
                  break;
                  
                case 'error':
                  setIsStreaming(false);
                  setError(data.error || "An error occurred");
                  break;
              }
            } catch (parseError) {
              console.warn("Failed to parse streaming data:", parseError);
            }
          }
        }
      }
    } catch (err) {
      setIsLoading(false);
      setIsStreaming(false);
      setError(err.message || "Failed to get response from LLM");
      console.error("LLM request error:", err);
    }
  };

  const displayResponse = isStreaming ? streamingResponse : response;

  return (
    <div
      style={{
        maxWidth: maxWidth,
        margin: "0 auto",
        padding: "32px",
        borderRadius: "16px",
        background: "rgba(24, 38, 53, 0.95)",
        backdropFilter: "blur(10px)",
        border: "1px solid rgba(255, 179, 71, 0.2)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
      }}
    >
      <h2
        style={{
          color: "#FFB347",
          marginBottom: "24px",
          fontSize: "28px",
          fontWeight: "bold",
          textAlign: "center",
          textShadow: "0 2px 4px rgba(0, 0, 0, 0.5)",
        }}
      >
        🔥 Chat with RAGnarok
      </h2>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: "12px" }}>
            <label style={{ 
              color: "#FFB347", 
              fontWeight: "bold", 
              marginRight: "12px" 
            }}>
              Use RAG Context:
            </label>
            <input
              type="checkbox"
              checked={useRag}
              onChange={(e) => setUseRag(e.target.checked)}
              style={{
                width: "18px",
                height: "18px",
                accentColor: "#FF6600",
              }}
            />
          </div>
          
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ask a question about your uploaded documents..."
            style={{
              width: "100%",
              minHeight: "120px",
              padding: "16px",
              borderRadius: "12px",
              border: "2px solid rgba(255, 179, 71, 0.3)",
              background: "rgba(0, 0, 0, 0.3)",
              color: "#fff",
              fontSize: "16px",
              resize: "vertical",
              outline: "none",
              transition: "border-color 0.3s ease",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "rgba(255, 179, 71, 0.6)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "rgba(255, 179, 71, 0.3)";
            }}
          />
        </div>
        
        <button
          type="submit"
          disabled={isLoading || isStreaming || !prompt.trim()}
          style={{
            width: "100%",
            padding: "16px",
            borderRadius: "12px",
            border: "none",
            background: isLoading || isStreaming 
              ? "linear-gradient(135deg, #666, #444)" 
              : "linear-gradient(135deg, #FF6600, #FFB347)",
            color: "#fff",
            fontSize: "18px",
            fontWeight: "bold",
            cursor: isLoading || isStreaming ? "not-allowed" : "pointer",
            transition: "all 0.3s ease",
            boxShadow: "0 4px 15px rgba(255, 102, 0, 0.3)",
          }}
        >
          {isLoading ? "Connecting..." : isStreaming ? "Generating..." : "Ask RAGnarok 🔥"}
        </button>
      </form>

      {error && (
        <div
          style={{
            marginTop: "24px",
            padding: "16px",
            borderRadius: "12px",
            background: "rgba(244, 67, 54, 0.1)",
            border: "1px solid rgba(244, 67, 54, 0.3)",
            color: "#ff6b6b",
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}

      {(displayResponse || sourcesUsed.length > 0) && (
        <div style={{ marginTop: "24px" }}>
          {sourcesUsed.length > 0 && (
            <div
              style={{
                marginBottom: "16px",
                padding: "12px",
                borderRadius: "8px",
                background: "rgba(76, 175, 80, 0.1)",
                border: "1px solid rgba(76, 175, 80, 0.3)",
              }}
            >
              <strong style={{ color: "#4CAF50" }}>Sources used:</strong>
              <ul style={{ margin: "8px 0 0 20px", color: "#4CAF50" }}>
                {sourcesUsed.map((source, index) => (
                  <li key={index}>{source}</li>
                ))}
              </ul>
            </div>
          )}

          {!contextFound && useRag && (
            <div
              style={{
                marginBottom: "16px",
                padding: "12px",
                borderRadius: "8px",
                background: "rgba(255, 152, 0, 0.1)",
                border: "1px solid rgba(255, 152, 0, 0.3)",
                color: "#FF9800",
              }}
            >
              <strong>Note:</strong> No relevant context found in uploaded documents. 
              Answering from general knowledge.
            </div>
          )}

          <div
            style={{
              padding: "20px",
              borderRadius: "12px",
              background: "rgba(0, 0, 0, 0.2)",
              border: "1px solid rgba(255, 179, 71, 0.2)",
              color: "#fff",
              lineHeight: "1.6",
              fontSize: "16px",
              whiteSpace: "pre-wrap",
              position: "relative",
            }}
          >
            <strong style={{ color: "#FFB347", marginBottom: "12px", display: "block" }}>
              Response:
            </strong>
            {displayResponse}
            {isStreaming && (
              <span
                style={{
                  display: "inline-block",
                  width: "8px",
                  height: "20px",
                  background: "#FFB347",
                  marginLeft: "4px",
                  animation: "blink 1s infinite",
                }}
              />
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default LLMInteractCard;
