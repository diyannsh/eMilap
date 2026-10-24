import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Bot, MessageSquare, Send, ShieldAlert, Sparkles, X } from 'lucide-react';
import { QUICK_QUERIES, matchLostFoundQuery } from './lostFoundKnowledge.js';
import { api } from '../../lib/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { HASH_TO_VIEW, VIEW_TO_HASH } from '../../lib/routes.js';
import './LostFoundChatbot.css';

function formatMessageText(text, onActionClick) {
  if (!text) return null;

  const lines = text.split('\n');

  return lines.map((line, lineIdx) => {
    // Split by markdown links (optionally wrapped in bold) or bold text
    const parts = line.split(/(\*\*(?:\[[^\]]+\]\([^)]+\)|[^*]+)\*\*|\[[^\]]+\]\([^)]+\))/g);

    const formattedLine = parts.map((part, partIdx) => {
      let isBold = false;
      let raw = part;

      if (raw.startsWith('**') && raw.endsWith('**') && raw.length >= 4) {
        isBold = true;
        raw = raw.slice(2, -2);
      }

      // Check markdown link: [Label](#hash)
      const linkMatch = raw.match(/^\[([^\]]+)\]\((#[^)]+|[a-z_-]+)\)$/);
      if (linkMatch) {
        const [, label, target] = linkMatch;
        const resolvedView =
          HASH_TO_VIEW[target] ||
          HASH_TO_VIEW[`#${target}`] ||
          target.replace(/^#/, '').replace(/-/g, '_');

        const linkEl = (
          <a
            key={partIdx}
            href={target.startsWith('#') ? target : `#${target}`}
            onClick={(e) => {
              e.preventDefault();
              if (onActionClick) {
                onActionClick(resolvedView);
              }
            }}
            className="emilap-chat-inline-link"
          >
            {label}
          </a>
        );

        return isBold ? (
          <strong key={partIdx} className="emilap-bold-text">
            {linkEl}
          </strong>
        ) : (
          linkEl
        );
      }

      // Check bold text
      if (isBold) {
        return (
          <strong key={partIdx} className="emilap-bold-text">
            {raw}
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
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'bot',
      text: "Hello! 👋 I'm **Milap.ai**, your campus lost & found assistant.\n\nI can answer questions regarding lost items, reporting found goods, proving ownership, or finding the campus desk. Select a quick query below or type your question!\n\n*(Privacy note: Never enter passwords, card numbers, or secret ownership clues here.)*",
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

  const handleActionClick = (viewId) => {
    setIsOpen(false);
    if (onNavigate) {
      onNavigate(viewId);
    } else if (typeof window !== 'undefined') {
      const hash = VIEW_TO_HASH[viewId] || `#${viewId}`;
      window.location.hash = hash;
    }
  };

  const handleSend = async (textToSend = inputVal) => {
    const text = textToSend.trim();
    if (!text || isTyping) return;

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

    // Build multi-turn context (last 6 messages)
    const history = messages
      .filter((m) => m.id !== 'welcome')
      .slice(-6)
      .map((m) => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text,
      }));

    try {
      const res = await api.chat.send(text, user?.communityId, history);
      const payload = res?.data || res;
      const botTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      let actions = null;
      if (Array.isArray(payload?.actions) && payload.actions.length > 0) {
        actions = payload.actions;
      } else if (payload?.action) {
        actions = [payload.action];
      } else if (Array.isArray(payload?.matchedReports) && payload.matchedReports.length > 0) {
        actions = [{ label: 'Explore Campus Listings', view: 'browse', url: '#browse' }];
      }

      const botMsg = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: payload?.reply || 'Here is the campus lost and found information for your request.',
        action: actions?.[0] || null,
        actions,
        showQuickQueries: false,
        time: botTime,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      // Graceful offline/local fallback: answer using local campus knowledge base
      try {
        const matchResult = matchLostFoundQuery(text, history);
        const botTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const actions = matchResult.actions || (matchResult.action ? [matchResult.action] : null);

        const botMsg = {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: matchResult.text || "I can help you navigate campus lost & found using the links below.",
          action: matchResult.action || actions?.[0] || null,
          actions,
          showQuickQueries: Boolean(matchResult.quickQueries),
          time: botTime,
        };

        setMessages((prev) => [...prev, botMsg]);
      } catch {
        // Fallback safety guarantee: never leave chat hanging
        const botTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            sender: 'bot',
            text: "To report a lost or found item, please use [Report Lost](#report-lost) or [Report Found](#report-found) in the navigation.",
            actions: [
              { label: 'Report Lost Item', view: 'report_lost', url: '#report-lost' },
              { label: 'Report Found Item', view: 'report_found', url: '#report-found' },
              { label: 'Browse Campus Listings', view: 'browse', url: '#browse' },
            ],
            time: botTime,
          },
        ]);
      }
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickClick = (queryLabel) => {
    handleSend(queryLabel);
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
                  {formatMessageText(msg.text, handleActionClick)}

                  {/* Navigation Action Buttons if available */}
                  {(() => {
                    const actionsList = msg.actions || (msg.action ? [msg.action] : []);
                    if (actionsList.length === 0) return null;

                    return (
                      <div className="emilap-chat-actions-group">
                        {actionsList.map((act, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleActionClick(act.view)}
                            className="emilap-chat-action-btn"
                          >
                            <span>{act.label}</span>
                            <ArrowRight size={13} />
                          </button>
                        ))}
                      </div>
                    );
                  })()}

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

          {/* Privacy Notice Banner */}
          <div className="emilap-chat-privacy-notice" role="note" aria-label="Privacy notice">
            <ShieldAlert size={12} className="text-[#C68B59] shrink-0" />
            <span>Public assistant only. Never submit passwords, card details, or private clues.</span>
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
