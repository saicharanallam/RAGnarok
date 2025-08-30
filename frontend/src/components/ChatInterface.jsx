import React, { useState, useRef, useEffect } from 'react';
import Card from './ui/Card';
import Button from './ui/Button';
import apiConfig from '../config/api';
import './ChatInterface.css';

const ChatInterface = ({ onNotification, documentsAvailable }) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [useRAG, setUseRAG] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Welcome message
    if (messages.length === 0) {
      setMessages([
        {
          id: 1,
          type: 'assistant',
          content: documentsAvailable 
            ? '🔥 Welcome to RAGnarok! I can chat with you and optionally use your documents for context. Toggle RAG ON/OFF to control document usage. What would you like to know?'
            : '👋 Welcome to RAGnarok! Upload some PDF documents first, then I can help you explore and understand their content.',
          timestamp: new Date()
        }
      ]);
    }
  }, [documentsAvailable, messages.length]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };



  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!inputValue.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Create assistant message for streaming
      const assistantMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: '',
        timestamp: new Date(),
        sources: [],
        isStreaming: true
      };

      setMessages(prev => [...prev, assistantMessage]);

      const response = await fetch(apiConfig.getUrl('api/llm'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: userMessage.content,
          use_rag: documentsAvailable && useRAG
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.token) {
                // Update streaming message
                setMessages(prev => prev.map(msg => 
                  msg.id === assistantMessage.id 
                    ? { ...msg, content: msg.content + data.token }
                    : msg
                ));
              }
              
              if (data.done) {
                // Mark streaming as complete
                setMessages(prev => prev.map(msg => 
                  msg.id === assistantMessage.id 
                    ? { ...msg, isStreaming: false, sources: data.sources || [] }
                    : msg
                ));
              }
              
              if (data.error) {
                throw new Error(data.error);
              }
            } catch (parseError) {
              console.warn('Failed to parse streaming data:', parseError);
            }
          }
        }
      }

    } catch (error) {
      console.error('Chat error:', error);
      
      const errorMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: '❌ Sorry, I encountered an error. Please make sure the backend services are running and try again.',
        timestamp: new Date(),
        isError: true
      };

      setMessages(prev => [...prev, errorMessage]);
      
      onNotification({
        type: 'error',
        message: 'Failed to get response from AI'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const exampleQuestions = [
    "What are the main topics in my documents?",
    "Summarize the key findings",
    "What are the important dates mentioned?",
    "Find information about specific concepts"
  ];

  return (
    <div className="chat-interface">
      {/* Messages Container */}
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="chat-welcome">
            <div className="chat-welcome__content">
              <h2>🔥 RAGnarok AI Chat</h2>
              <p>Your intelligent document companion</p>
              
              {documentsAvailable ? (
                <div className="chat-examples">
                  <h3>Try asking:</h3>
                  <div className="chat-examples__grid">
                    {exampleQuestions.map((question, index) => (
                      <button
                        key={index}
                        className="chat-example-btn"
                        onClick={() => setInputValue(question)}
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="chat-no-docs">
                  <p>📄 Upload some PDF documents to get started!</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="chat-messages__list">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`chat-message chat-message--${message.type} ${message.isError ? 'chat-message--error' : ''}`}
              >
                <div className="chat-message__content">
                  <div className="chat-message__text">
                    {message.content}
                    {message.isStreaming && (
                      <span className="streaming-cursor">▊</span>
                    )}
                  </div>
                  
                  {message.sources && message.sources.length > 0 && (
                    <div className="chat-message__sources">
                      <strong>Sources:</strong>
                      <ul>
                        {message.sources.map((source, index) => (
                          <li key={index}>{source}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <div className="chat-message__time">
                    {formatTime(message.timestamp)}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="chat-message chat-message--assistant">
                <div className="chat-message__content">
                  <div className="chat-message__loading">
                    <div className="spinner"></div>
                    <span>RAGnarok is thinking...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="chat-input">
        {messages.length > 1 && (
          <div className="chat-input__actions">
            <Button
              variant="ghost"
              size="small"
              onClick={() => setUseRAG(!useRAG)}
              icon={useRAG ? "🧠" : "💭"}
              title={useRAG ? "RAG enabled - using document context" : "RAG disabled - pure LLM chat"}
            >
              {useRAG ? "RAG ON" : "RAG OFF"}
            </Button>
            <Button
              variant="ghost"
              size="small"
              onClick={handleClearChat}
              icon="🗑️"
            >
              Clear Chat
            </Button>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="chat-input__form">
          <div className="chat-input__field">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={documentsAvailable ? "Ask me anything... (Shift+Enter for new line)" : "Upload documents first to start chatting..."}
              disabled={isLoading || !documentsAvailable}
              className="chat-input__text"
              rows={3}
            />
            <Button
              type="submit"
              variant="primary"
              disabled={!inputValue.trim() || isLoading || !documentsAvailable}
              loading={isLoading}
              icon="🚀"
            >
              Send
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;
