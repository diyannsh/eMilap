import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Bot, MessageSquare, Send, Sparkles, X } from 'lucide-react';
import { QUICK_QUERIES, matchLostFoundQuery } from './lostFoundKnowledge.js';
import './LostFoundChatbot.css';

function formatMessageText(text) {
  if (!text) return null;

  const lines = text.split('\n');

  return lines.map((line, lineIdx) => {
    // Split by **bold** markdown tokens
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    const formattedLine = parts.map((part, partIdx) => {
      if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
        return (
          <strong key={partIdx} className="emilap-bold-text">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });

    return (
      <span key={lineIdx} className="emilap-message-line">
        {formattedLine}
        {lineIdx < lines.length - 1 && <br />}
      </span>
    );
  });
}

export default function LostFoundChatbot({ visible = true, onNavigate }) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'bot',
      text: "Hello! 👋 I'm **Milap.ai**, your campus lost & found assistant.\n\nI can answer questions regarding lost items, reporting found goods, proving ownership, or finding the campus desk. Select a quick query below or type your question!",
      showQuickQueries: true,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      // Auto focus input on desktop
      if (window.innerWidth > 700) {
        setTimeout(() => inputRef.current?.focus(), 150);
      }
    }
  }, [isOpen, messages, isTyping]);

  const handleSend = (textToSend = inputVal) => {
    const text = textToSend.trim();
    if (!text) return;

    const userTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      time: userTime,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputVal('');
    setIsTyping(true);

    // Simulate realistic AI generation response (~400ms delay)
    setTimeout(() => {
      const matchResult = matchLostFoundQuery(text);
      const botTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const botMsg = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: matchResult.text,
        action: matchResult.action,
        showQuickQueries: Boolean(matchResult.quickQueries),
        time: botTime,
      };

      setIsTyping(false);
      setMessages((prev) => [...prev, botMsg]);
    }, 420);
  };

  const handleQuickClick = (queryLabel) => {
    handleSend(queryLabel);
  };

  const handleActionClick = (viewId) => {
    setIsOpen(false);
    if (onNavigate) {
      onNavigate(viewId);
    }
  };

  return (
    <>
      {/* Floating Launcher Button */}
      <div className={`emilap-bot-container ${!visible ? 'is-hidden' : ''}`}>
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={`emilap-bot-trigger ${isOpen ? 'is-active' : ''}`}
          aria-label={isOpen ? 'Close Milap.ai' : 'Open Milap.ai'}
          title="Milap.ai"
        >
          <div className="emilap-bot-icon-wrap">
            {isOpen ? <X size={18} /> : <MessageSquare size={18} />}
            <span className="emilap-bot-badge-dot" />
          </div>
          <span className="emilap-bot-trigger-label">
            {isOpen ? 'Close' : 'Milap.ai'}
          </span>
        </button>
      </div>

      {/* Chat Window Popup */}
      {isOpen && visible && (
        <div
          className="emilap-chat-window custom-scrollbar"
          data-lenis-prevent="true"
          data-lenis-prevent-wheel="true"
          data-lenis-prevent-touch="true"
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          role="dialog"
          aria-label="Milap.ai - Campus Lost & Found Assistant"
        >
          {/* Header */}
          <div className="emilap-chat-header">
            <div className="emilap-chat-header-info">
              <div className="emilap-chat-avatar">
                <Bot size={18} />
              </div>
              <div>
                <h3 className="emilap-chat-title">Milap.ai</h3>
                <p className="emilap-chat-subtitle">
                  <span className="emilap-chat-status-dot" />
                  Campus Lost &amp; Found AI
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="emilap-chat-close-btn"
              aria-label="Minimize chat window"
            >
              <X size={18} />
            </button>
          </div>

          {/* Message List */}
          <div
            className="emilap-chat-messages custom-scrollbar"
            data-lenis-prevent="true"
            onWheel={(e) => e.stopPropagation()}
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`emilap-message ${msg.sender === 'user' ? 'emilap-message-user' : 'emilap-message-bot'}`}
              >
                <div className="emilap-message-bubble">
                  {formatMessageText(msg.text)}

                  {/* Navigation Action Button if available */}
                  {msg.action && (
                    <div>
                      <button
                        type="button"
                        onClick={() => handleActionClick(msg.action.view)}
                        className="emilap-chat-action-btn"
                      >
                        <span>{msg.action.label}</span>
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  )}

                  {/* Quick Queries (stacked pills styled matching reference screenshot) */}
                  {msg.showQuickQueries && (
                    <div className="emilap-quick-queries">
                      {QUICK_QUERIES.map((q) => (
                        <button
                          key={q.id}
                          type="button"
                          onClick={() => handleQuickClick(q.label)}
                          className="emilap-quick-btn"
                        >
                          {q.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <span className="emilap-message-time">{msg.time}</span>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="emilap-message emilap-message-bot">
                <div className="emilap-typing-bubble">
                  <span className="emilap-typing-dot" />
                  <span className="emilap-typing-dot" />
                  <span className="emilap-typing-dot" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="emilap-chat-input-bar"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Ask Milap.ai about lost & found..."
              className="emilap-chat-input"
              aria-label="Type your message"
            />
            <button
              type="submit"
              disabled={!inputVal.trim() || isTyping}
              className="emilap-chat-send-btn"
              aria-label="Send message"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}

