import { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, Sparkles, AlertCircle, Info, ExternalLink, RotateCcw, MessageSquare } from 'lucide-react';
import { api } from '../../lib/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import './ChatbotWidget.css';

const INITIAL_SUGGESTIONS = [
  'How to claim an item?',
  'How are private clues protected?',
  'Found items in campus',
  'How to report lost item?',
];

export default function ChatbotWidget({ onNavigate }) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [providerInfo, setProviderInfo] = useState({
    provider: 'deterministic-retrieval',
    configuredModel: false,
    note: 'Deterministic campus search assistant active (GEMINI_API_KEY optional).',
  });

  const [messages, setMessages] = useState([
    {
      id: 'init-1',
      sender: 'assistant',
      text: 'Hello! I am the e-Milap campus assistant. I can help you locate public lost & found reports, explain the claim process, or review our privacy policies.',
      matchedReports: [],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      inputRef.current?.focus();
    }
  }, [isOpen, messages]);

  const handleSend = async (messageText = null) => {
    const textToSend = (messageText || input).trim();
    if (!textToSend || loading) return;

    if (textToSend.length > 500) {
      setError('Message exceeds the 500-character limit. Please shorten your question.');
      return;
    }

    const userMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setError(null);
    setLoading(true);

    try {
      const communityId = user?.primaryCommunityId || undefined;
      const res = await api.chat.send(textToSend, communityId);
      const payload = res?.data || res;

      setProviderInfo({
        provider: payload.provider || 'deterministic-retrieval',
        configuredModel: Boolean(payload.configuredModel),
        note: payload.note || '',
      });

      const assistantMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: payload.reply || 'No response available.',
        matchedReports: payload.matchedReports || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Chat error:', err);
      const isRateLimit = err?.status === 429;
      const errorMessage = isRateLimit
        ? 'Rate limit reached (max 40 questions per 15 minutes). Please wait a moment before sending another message.'
        : err?.message || 'Unable to connect to the campus assistant service. Please check your connection.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleReset = () => {
    setMessages([
      {
        id: `init-${Date.now()}`,
        sender: 'assistant',
        text: 'Chat history reset. How can I assist you with campus lost and found items today?',
        matchedReports: [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setError(null);
  };

  return (
    <aside className="chatbot-widget-container" aria-label="e-Milap Campus Assistant">
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="chatbot-launcher-button"
          aria-label="Open e-Milap Campus Assistant"
          aria-expanded={isOpen}
        >
          <div className="chatbot-launcher-icon-wrap">
            <Bot size={22} className="text-platinum-200" />
            <span className="chatbot-pulse-dot" />
          </div>
          <span className="chatbot-launcher-label">Ask e-Milap</span>
        </button>
      )}

      {isOpen && (
        <section
          className="chatbot-window"
          role="dialog"
          aria-modal="true"
          aria-label="e-Milap Campus Assistant Chat"
        >
          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-header-info">
              <div className="chatbot-header-avatar">
                <Bot size={18} className="text-signal-400" />
              </div>
              <div>
                <h3 className="chatbot-title">e-Milap Assistant</h3>
                <div className="chatbot-meta">
                  <span className="chatbot-community-badge">
                    {user?.communityName || 'Campus Community'}
                  </span>
                  <span
                    className={`chatbot-provider-badge ${
                      providerInfo.configuredModel ? 'ai-active' : 'deterministic'
                    }`}
                    title={providerInfo.note}
                  >
                    {providerInfo.configuredModel ? 'AI Active' : 'Deterministic Search'}
                  </span>
                </div>
              </div>
            </div>
            <div className="chatbot-header-actions">
              <button
                type="button"
                onClick={handleReset}
                className="chatbot-icon-btn"
                title="Reset conversation"
                aria-label="Reset conversation"
              >
                <RotateCcw size={15} />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="chatbot-icon-btn"
                title="Close chat"
                aria-label="Close chat"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Fallback Notice Banner */}
          {!providerInfo.configuredModel && (
            <div className="chatbot-notice-banner">
              <Info size={13} className="shrink-0 text-lavender-400" />
              <span>
                Deterministic retrieval active. Optional LLM disabled (set <code>GEMINI_API_KEY</code> in backend).
              </span>
            </div>
          )}

          {/* Messages Container */}
          <div className="chatbot-messages" tabIndex={0} role="region" aria-label="Conversation messages">
            {messages.map((m) => (
              <div key={m.id} className={`chatbot-message-row ${m.sender}`}>
                <div className="chatbot-bubble">
                  <p className="chatbot-bubble-text">{m.text}</p>

                  {/* Render matched reports preview */}
                  {m.matchedReports && m.matchedReports.length > 0 && (
                    <div className="chatbot-matched-reports">
                      <div className="chatbot-matched-header">
                        <Sparkles size={12} className="text-signal-400" />
                        <span>Matched Public Reports:</span>
                      </div>
                      <div className="chatbot-report-cards">
                        {m.matchedReports.map((report) => (
                          <div key={report.id} className="chatbot-report-pill">
                            <div className="chatbot-report-meta">
                              <span
                                className={`chatbot-badge ${
                                  report.reportType === 'FOUND' ? 'badge-found' : 'badge-lost'
                                }`}
                              >
                                {report.reportType}
                              </span>
                              <span className="chatbot-report-title">{report.title}</span>
                            </div>
                            <div className="chatbot-report-sub">
                              <span>{report.category}</span>
                              {report.approximateLocation && (
                                <span> • {report.approximateLocation}</span>
                              )}
                              <span className="chatbot-report-status">[{report.status}]</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      {onNavigate && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsOpen(false);
                            onNavigate('browse');
                          }}
                          className="chatbot-view-all-btn"
                        >
                          <ExternalLink size={12} />
                          <span>View all in Campus Listings</span>
                        </button>
                      )}
                    </div>
                  )}

                  <span className="chatbot-bubble-time">{m.timestamp}</span>
                </div>
              </div>
            ))}

            {loading && (
              <div className="chatbot-message-row assistant">
                <div className="chatbot-bubble loading">
                  <div className="chatbot-typing-dots">
                    <span />
                    <span />
                    <span />
                  </div>
                  <span className="text-xs text-platinum-400/60 ml-2">Searching public campus records...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions */}
          {messages.length <= 2 && !loading && (
            <div className="chatbot-suggestions">
              <span className="chatbot-suggestions-title">Quick Questions:</span>
              <div className="chatbot-pill-list">
                {INITIAL_SUGGESTIONS.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSend(s)}
                    className="chatbot-suggestion-pill"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="chatbot-error-banner" role="alert">
              <AlertCircle size={14} className="shrink-0 text-signal-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Input Footer */}
          <form
            className="chatbot-input-footer"
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
          >
            <div className="chatbot-input-wrap">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about lost items or policies..."
                maxLength={500}
                disabled={loading}
                className="chatbot-input"
                aria-label="Ask the e-Milap assistant"
              />
              <span className="chatbot-char-count">{input.length}/500</span>
            </div>
            <button
              type="submit"
              disabled={!input.trim() || loading || input.length > 500}
              className="chatbot-send-btn"
              aria-label="Send message"
            >
              <Send size={15} />
            </button>
          </form>
        </section>
      )}
    </aside>
  );
}
