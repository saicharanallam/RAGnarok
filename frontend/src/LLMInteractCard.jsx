import React, { useState, useEffect, useRef } from "react";

const LLMInteractCard = ({ maxWidth = 1000 }) => {
  const [prompt, setPrompt] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [response, setResponse] = useState("");
  const [streamingResponse, setStreamingResponse] = useState("");
  const [sourcesUsed, setSourcesUsed] = useState([]);
  const [contextFound, setContextFound] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [useRag, setUseRag] = useState(true);
  const [error, setError] = useState("");

  // Add a useState for forcing re-renders during streaming
  const [streamCounter, setStreamCounter] = useState(0);

  const chatContainerRef = useRef(null);

  useEffect(() => {
    // Load chat history from localStorage
    const savedChat = localStorage.getItem("ragnarok_chat_history");
    if (savedChat) {
      setChatHistory(JSON.parse(savedChat));
    }
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  // Add new handler for textarea keydown
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Modify handleSubmit to handle streaming better
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    // Add user message
    const userMessage = { role: "user", content: prompt.trim() };
    setChatHistory((prev) => [...prev, userMessage]);

    setPrompt("");
    setIsLoading(true);
    setIsStreaming(true); // Set streaming state

    try {
      const response = await fetch("/api/llm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          use_rag: useRag,
        }),
      });

      if (!response.ok) throw new Error("Network response was not ok");

      // Add an empty assistant message that we'll update as tokens arrive
      setChatHistory((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "",
          sources: [],
        },
      ]);

      const reader = response.body.getReader();
      let accumulatedResponse = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Process incoming chunks
        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const jsonData = JSON.parse(line.substring(6));
              if (jsonData.response) {
                // Add new token to accumulated response
                accumulatedResponse += jsonData.response;

                // Update chat history with new token
                setChatHistory((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    role: "assistant",
                    content: accumulatedResponse,
                    sources: jsonData.sources || [],
                  };
                  return updated;
                });

                // Force re-render with each token by updating counter
                setStreamCounter((prev) => prev + 1);

                // Tiny delay to ensure UI updates (optional)
                await new Promise((resolve) => setTimeout(resolve, 5));
              }
            } catch (e) {
              console.error("Error parsing JSON:", e);
            }
          }
        }
      }
    } catch (err) {
      console.error("Error:", err);
      setChatHistory((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, there was an error processing your request. Please try again.",
          sources: [],
        },
      ]);
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  const displayResponse = isStreaming ? streamingResponse : response;

  return (
    <div
      style={{
        width: "100%",
        maxWidth: maxWidth,
        height: "70vh", // Reduced from 80vh
        margin: "0 auto",
        padding: "24px",
        borderRadius: "16px",
        background: "rgba(24, 38, 53, 0.35)", // More transparent
        backdropFilter: "blur(10px)",
        border: "1px solid rgba(255, 179, 71, 0.2)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
        display: "flex",
        flexDirection: "column",
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

      {/* Chat History */}
      <div
        ref={chatContainerRef}
        style={{
          flex: 1,
          overflowY: "auto",
          marginBottom: "16px",
          padding: "16px",
          borderRadius: "12px",
          background: "rgba(0, 0, 0, 0.2)",
          border: "1px solid rgba(255, 179, 71, 0.2)",
        }}
      >
        {chatHistory.length === 0 ? (
          <div
            style={{
              color: "#8BA0B8",
              textAlign: "center",
              padding: "20px",
            }}
          >
            Start a conversation with RAGnarok! 🔥
          </div>
        ) : (
          chatHistory.map((msg, index) => (
            <div
              key={index}
              style={{
                marginBottom: "16px",
                padding: "12px",
                borderRadius: "8px",
                background:
                  msg.role === "user"
                    ? "rgba(255, 179, 71, 0.1)"
                    : "rgba(0, 0, 0, 0.3)",
                border: "1px solid rgba(255, 179, 71, 0.2)",
              }}
            >
              <strong
                style={{
                  color: msg.role === "user" ? "#FFB347" : "#4CAF50",
                }}
              >
                {msg.role === "user" ? "You:" : "RAGnarok:"}
              </strong>
              <div
                style={{
                  color: "#fff",
                  marginTop: "8px",
                  whiteSpace: "pre-wrap",
                }}
              >
                {msg.content}
              </div>
              {msg.role === "assistant" &&
                msg.sources &&
                msg.sources.length > 0 && (
                  <div
                    style={{
                      marginTop: "8px",
                      fontSize: "0.9em",
                      color: "#4CAF50",
                    }}
                  >
                    <strong>Sources:</strong>
                    <ul style={{ margin: "4px 0 0 20px" }}>
                      {msg.sources.map((source, idx) => (
                        <li key={idx}>{source}</li>
                      ))}
                    </ul>
                  </div>
                )}
            </div>
          ))
        )}
        {isStreaming && <div style={{ color: "#FFB347" }}>RAGnarok is typing...</div>}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} style={{ marginTop: "auto" }}>
        <div style={{ marginBottom: "16px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "12px",
            }}
          >
            <label
              style={{
                color: "#FFB347",
                fontWeight: "bold",
                marginRight: "12px",
              }}
            >
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
            onKeyDown={handleKeyDown}
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

        <div style={{ display: "flex", gap: "16px" }}>
          <button
            type="submit"
            disabled={isLoading || !prompt.trim()}
            style={{
              flex: 1,
              padding: "16px",
              borderRadius: "12px",
              border: "none",
              background:
                isLoading || isStreaming
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
            {isLoading ? "Thinking..." : "Ask RAGnarok 🔥"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LLMInteractCard;
