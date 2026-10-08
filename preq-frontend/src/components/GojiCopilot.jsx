import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { X, Send, Loader2, Plus, Sparkles, MessageSquare, AlertTriangle, Mail } from 'lucide-react';
import { API_URL } from '../apiConfig';

export const GojiCopilot = ({ isOpen, onToggle, activeProjectId, onAddItemFromCopilot }) => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "**Hi! I am PreQ Copilot, your AI readiness advisor.**\n\nI can help you:\n• Identify critical Day-1 kick-off blockers\n• Verify submitted evidence & cloud configs\n• Draft client escalation emails\n• Propose missing edge-case pre-requisites\n\nWhat would you like to know?"
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, suggestions, isOpen]);

  const handleSend = async (customPrompt = null) => {
    const textToSend = customPrompt || input;
    if (!textToSend.trim()) return;

    const newMessages = [...messages, { role: 'user', content: textToSend }];
    setMessages(newMessages);
    if (!customPrompt) setInput('');
    setLoading(true);

    try {
      const res = await axios.post(`${API_URL}/copilot/chat`, {
        project_id: activeProjectId,
        messages: newMessages
      });
      setMessages([...newMessages, { role: 'assistant', content: res.data.reply }]);
    } catch (err) {
      console.error(err);
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: 'I encountered an issue reaching the AI engine. Please ensure the backend is running.'
        }
      ]);
    }
    setLoading(false);
  };

  const handleSuggestItems = async () => {
    if (!activeProjectId) {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Please open a specific initiative first to analyze tailored pre-requisite recommendations.' }
      ]);
      return;
    }

    setLoading(true);
    setMessages(prev => [
      ...prev,
      { role: 'user', content: 'Suggest missing pre-requisites for this project.' }
    ]);

    try {
      const res = await axios.post(`${API_URL}/copilot/suggest-items?project_id=${activeProjectId}`);
      const items = res.data.suggestions || [];
      setSuggestions(items);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `I scanned the architecture against GoML blueprints and identified **${items.length} critical edge-case prerequisites** not yet tracked in your matrix:`
        }
      ]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Failed to retrieve blueprint suggestions.' }
      ]);
    }
    setLoading(false);
  };

  return (
    <>
      {/* Floating Chat Popup Widget (Matching GoML.io "Ask Goji" style) */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: '96px',
          right: '24px',
          width: '380px',
          maxWidth: 'calc(100vw - 32px)',
          maxHeight: '560px',
          background: 'linear-gradient(180deg, #FFF7F0 0%, #FFEDE0 100%)',
          borderRadius: '24px',
          boxShadow: '0 20px 45px -10px rgba(0, 0, 0, 0.2), 0 0 1px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 9999,
          overflow: 'hidden',
          animation: 'slideUpGoji 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          {/* Header */}
          <div style={{
            padding: '1.25rem 1.25rem 0.5rem',
            textAlign: 'center',
            position: 'relative'
          }}>
            {/* Small avatar circle */}
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: '#ffffff',
              boxShadow: '0 2px 8px rgba(237, 125, 49, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 0.4rem'
            }}>
              <span style={{ fontWeight: 800, color: '#ED7D31', fontSize: '0.85rem' }}>G</span>
            </div>

            <div style={{ fontWeight: 700, fontSize: '1rem', color: '#ED7D31' }}>
              Ask PreQ
            </div>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#111827', marginTop: '0.15rem' }}>
              Hello! how can I assist you today?
            </div>
          </div>

          {/* Quick Action Chips */}
          <div style={{
            padding: '0.5rem 1rem',
            display: 'flex',
            gap: '0.35rem',
            overflowX: 'auto',
            whiteSpace: 'nowrap'
          }}>
            <button
              onClick={() => handleSend("Analyze top kick-off blocker risks and recommend urgent next steps.")}
              style={{
                background: '#ffffff',
                border: '1px solid #fcd9c2',
                borderRadius: '9999px',
                padding: '0.25rem 0.65rem',
                fontSize: '0.72rem',
                fontWeight: 600,
                color: '#ED7D31',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <AlertTriangle size={12} /> Blocker Risks
            </button>
            <button
              onClick={() => handleSend("Draft an executive escalation email to the client sponsor about critical overdue prerequisites.")}
              style={{
                background: '#ffffff',
                border: '1px solid #fcd9c2',
                borderRadius: '9999px',
                padding: '0.25rem 0.65rem',
                fontSize: '0.72rem',
                fontWeight: 600,
                color: '#ED7D31',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Mail size={12} /> Escalation Email
            </button>
            <button
              onClick={handleSuggestItems}
              style={{
                background: '#ffffff',
                border: '1px solid #fcd9c2',
                borderRadius: '9999px',
                padding: '0.25rem 0.65rem',
                fontSize: '0.72rem',
                fontWeight: 600,
                color: '#ED7D31',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Sparkles size={12} /> Suggest Items
            </button>
          </div>

          {/* Messages Body */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '0.75rem 1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}>
            {messages.map((m, idx) => (
              <div
                key={idx}
                style={{
                  alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '90%',
                  background: m.role === 'user' ? '#111827' : '#ffffff',
                  color: m.role === 'user' ? '#ffffff' : '#1f2937',
                  padding: '0.85rem 1rem',
                  borderRadius: '16px',
                  boxShadow: m.role === 'user' ? 'none' : '0 4px 12px rgba(0, 0, 0, 0.05)',
                  fontSize: '0.825rem',
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap'
                }}
              >
                {m.content}
              </div>
            ))}

            {/* Suggestions cards */}
            {suggestions.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ED7D31', textTransform: 'uppercase' }}>
                  Recommended Prerequisites:
                </div>
                {suggestions.map((item, idx) => (
                  <div key={idx} style={{ background: '#ffffff', border: '1px solid #fcd9c2', borderRadius: '12px', padding: '0.75rem', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#111827' }}>{item.name}</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', margin: '0.2rem 0' }}>{item.description}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.35rem' }}>
                      <span style={{ fontSize: '0.7rem', color: '#ED7D31', fontWeight: 600 }}>{item.category}</span>
                      {onAddItemFromCopilot && (
                        <button
                          onClick={() => {
                            onAddItemFromCopilot(item);
                            setSuggestions(suggestions.filter((_, i) => i !== idx));
                          }}
                          style={{
                            background: '#111827',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '9999px',
                            padding: '0.2rem 0.5rem',
                            fontSize: '0.7rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.2rem'
                          }}
                        >
                          <Plus size={10} /> Add
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#ED7D31', fontSize: '0.8rem', padding: '0.25rem 0' }}>
                <Loader2 className="animate-spin" size={14} />
                <span>PreQ AI is thinking...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Pill Input Bar (Matching GoML.io style) */}
          <div style={{ padding: '0.75rem 1rem 1rem' }}>
            <form
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              style={{
                background: '#ffffff',
                borderRadius: '9999px',
                padding: '0.35rem 0.45rem 0.35rem 1rem',
                display: 'flex',
                alignItems: 'center',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06)'
              }}
            >
              <input
                type="text"
                placeholder="Chat with PreQ..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
                style={{
                  border: 'none',
                  outline: 'none',
                  flex: 1,
                  fontSize: '0.825rem',
                  fontFamily: 'inherit',
                  color: '#111827'
                }}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: input.trim() ? 'pointer' : 'default',
                  padding: '0.35rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: input.trim() ? '#111827' : '#9ca3af'
                }}
              >
                <Send size={15} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Floating Trigger Button (Matching GoML round orange button in bottom right) */}
      <button
        onClick={onToggle}
        aria-label="Toggle AI Copilot"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: '#ED7D31',
          border: 'none',
          color: '#ffffff',
          boxShadow: '0 6px 20px rgba(237, 125, 49, 0.45)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>

      <style>{`
        @keyframes slideUpGoji {
          from { opacity: 0; transform: translateY(16px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </>
  );
};
