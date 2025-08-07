import React, { useState, useRef, useEffect } from "react";

function AnimatedDots() {
  const [dots, setDots] = useState("");
  useEffect(() => {
    if (!dots && typeof window === "undefined") return;
    const interval = setInterval(() => {
      setDots((prev) => (prev.length < 3 ? prev + "." : ""));
    }, 400);
    return () => clearInterval(interval);
  }, [dots]);
  return <span>{dots}</span>;
}

export default function LLMInteractCard() {
  const [expanded, setExpanded] = useState(true);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [chat, setChat] = useState([]); // [{role: "user"|"llm", text: string}]
  const cardWidth = 800;
  const chatEndRef = useRef(null);

  // Scroll to bottom when chat updates
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chat, expanded]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    const userMsg = prompt;
    setChat((prev) => [...prev, { role: "user", text: userMsg }]);
    setPrompt("");
    setLoading(true);
    try {
      const res = await fetch("/api/llm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: userMsg }),
      });
      const data = await res.json();
      setChat((prev) => [
        ...prev,
        { role: "llm", text: data.response || data.error || "No response." },
      ]);
    } catch {
      setChat((prev) => [
        ...prev,
        { role: "llm", text: "Error contacting LLM backend." },
      ]);
    }
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!loading && prompt.trim()) {
        handleSubmit(e);
      }
    }
  };

  if (!expanded) {
    return (
      <div
        style={{
          width: "100%",
          maxWidth: cardWidth,
          minWidth: 320,
          margin: "24px auto",
          borderRadius: 12,
          background: "#182635",
          boxShadow: "0 2px 16px #0008",
          padding: 24,
          cursor: "pointer",
          transition: "all 0.2s",
          textAlign: "center",
        }}
        onClick={() => setExpanded(true)}
      >
        <h3 style={{ color: "#FFB347", margin: 0 }}>
          LLM Interaction
        </h3>
        <div style={{ color: "#FF6600", marginTop: 8, fontSize: 14 }}>
          Click to expand
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 900, // wider
        minWidth: 320,
        margin: "24px auto",
        borderRadius: 18,
        background: "rgba(24, 38, 53, 0.2)", // translucent
        boxShadow: "0 4px 32px 0 #0006, 0 2px 8px #0002",
        padding: 24,
        cursor: "default",
        transition: "all 0.2s",
        display: "flex",
        flexDirection: "column",
        height: "56vh", // shorter
        maxHeight: "60vh",
        backdropFilter: "blur(6px)", // optional: glass effect
        WebkitBackdropFilter: "blur(6px)", // for Safari
      }}
    >
      <h3
        style={{
          color: "#FFB347",
          margin: 0,
          marginBottom: 20,
          cursor: "pointer",
          userSelect: "none"
        }}
        onClick={() => setExpanded(false)}
        title="Click to collapse"
      >
        Ask RAGnarok
      </h3>
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          marginBottom: 16,
          background: "rgba(26, 34, 51, 0.2)", // translucent chat area
          borderRadius: 8,
          padding: 16,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          maxHeight: "60vh",
          backdropFilter: "blur(4px)", // subtle glass effect
          WebkitBackdropFilter: "blur(4px)",
        }}
      >
        {chat.length === 0 && (
          <div style={{ color: "#aaa", textAlign: "center" }}>
            Start the conversation!
          </div>
        )}
        {chat.map((msg, idx) => (
          <div
            key={idx}
            style={{
              margin: "8px 0",
              alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
              background: msg.role === "user" ? "#FFB34722" : "#222c3a",
              color: msg.role === "user" ? "#FFB347" : "#fff",
              borderRadius: 8,
              padding: "8px 14px",
              maxWidth: "80%",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {msg.text}
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>
      <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8 }}>
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
          style={{
            flex: 1,
            borderRadius: 8,
            border: "1px solid #FFB347",
            padding: 12,
            fontSize: 16,
            background: "#222c3a",
            color: "#fff",
            resize: "none"
          }}
          placeholder="Type your message..."
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !prompt.trim()}
          style={{
            background: "linear-gradient(90deg, #FFB347 0%, #FF6600 100%)",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            padding: "10px 24px",
            fontWeight: "bold",
            fontSize: 16,
            cursor: loading ? "not-allowed" : "pointer"
          }}
        >
          {loading ? <>Waiting<AnimatedDots /></> : "Send"}
        </button>
      </form>
    </div>
  );
}
