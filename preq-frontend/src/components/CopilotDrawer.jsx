import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Sparkles, X, Send, Loader2, Plus, Bot, User, AlertTriangle, Mail, BarChart3 } from 'lucide-react';
import { API_URL } from '../apiConfig';

export const CopilotDrawer = ({ isOpen, onClose, activeProjectId, onAddItemFromCopilot }) => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I am your **GoML PreQ Copilot**. I analyze pre-requisite risks, draft client communications, verify compliance boundaries, and suggest overlooked dependencies. How can I assist you with this initiative?'
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
    scrollToBottom();
  }, [messages, suggestions]);

  if (!isOpen) return null;

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
          content: 'Sorry, I encountered an issue connecting to the AI engine. Please ensure the backend is running.'
        }
      ]);
    }
    setLoading(false);
  };

  const handleSuggestItems = async () => {
    if (!activeProjectId) {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Please open a specific initiative first to generate tailored pre-requisite suggestions.' }
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
          content: `I analyzed the architecture against GoML blueprints and identified **${items.length} critical edge-case prerequisites** not yet tracked in your matrix:`
        }
      ]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Failed to retrieve suggestions from the AI engine.' }
      ]);
    }
    setLoading(false);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      display: 'flex',
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(17, 24, 39, 0.4)',
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '520px',
        height: '100vh',
        background: '#ffffff',
        borderLeft: '1px solid #e5e5e5',
        boxShadow: '-10px 0 30px rgba(0, 0, 0, 0.15)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid #e5e5e5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#ffffff'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              background: '#F4F4F5',
              border: '1px solid #E4E4E7',
              padding: '0.5rem',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Sparkles size={18} color="#0F172A" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <h3 style={{ fontSize: '1.1rem', margin: 0, color: '#111827' }}>
                  GoML AI Copilot
                </h3>
                <span className="goml-badge goml-badge-orange" style={{ fontSize: '0.7rem' }}>
                  Groq LLM
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>
                Delivery Readiness & Architecture Advisor
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b', padding: '0.35rem' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Quick Action Chips */}
        <div style={{
          padding: '0.75rem 1.25rem',
          borderBottom: '1px solid #e5e5e5',
          background: '#f8fafc',
          display: 'flex',
          gap: '0.4rem',
          overflowX: 'auto',
          whiteSpace: 'nowrap'
        }}>
          <button
            className="btn-goml btn-goml-outline btn-goml-sm"
            onClick={() => handleSend("Analyze top kick-off blocker risks and recommend urgent next steps.")}
            style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <AlertTriangle size={13} /> Analyze Blockers
          </button>
          <button
            className="btn-goml btn-goml-outline btn-goml-sm"
            onClick={() => handleSend("Draft an executive escalation email to the client sponsor about critical overdue prerequisites.")}
            style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <Mail size={13} /> Draft Email
          </button>
          <button
            className="btn-goml btn-goml-outline btn-goml-sm"
            onClick={handleSuggestItems}
            style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <Sparkles size={13} /> Suggest Missing
          </button>
          <button
            className="btn-goml btn-goml-outline btn-goml-sm"
            onClick={() => handleSend("Provide a 3-bullet executive briefing on launch readiness for leadership.")}
            style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <BarChart3 size={13} /> Exec Briefing
          </button>
        </div>

        {/* Messages Body */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          background: '#fafbfc'
        }}>
          {messages.map((m, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                gap: '0.65rem',
                alignItems: 'flex-start',
                flexDirection: m.role === 'user' ? 'row-reverse' : 'row'
              }}
            >
              <div style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                background: m.role === 'user' ? '#111827' : '#F4F4F5',
                border: m.role === 'user' ? 'none' : '1px solid #E4E4E7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {m.role === 'user' ? <User size={15} color="white" /> : <Bot size={15} color="#0F172A" />}
              </div>

              <div style={{
                maxWidth: '85%',
                background: m.role === 'user' ? '#111827' : '#ffffff',
                color: m.role === 'user' ? '#ffffff' : '#1e293b',
                padding: '0.75rem 1rem',
                borderRadius: '12px',
                border: '1px solid #e5e5e5',
                fontSize: '0.875rem',
                lineHeight: 1.5,
                whiteSpace: 'pre-wrap',
                boxShadow: '0 2px 5px rgba(0,0,0,0.03)'
              }}>
                {m.content}
              </div>
            </div>
          ))}

          {/* Suggestions List */}
          {suggestions.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginTop: '0.5rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ED7D31', textTransform: 'uppercase' }}>
                GoML Blueprint Recommendations:
              </div>
              {suggestions.map((item, idx) => (
                <div key={idx} style={{ background: '#ffffff', border: '1px solid #fcd9c2', borderRadius: '8px', padding: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#111827' }}>{item.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.2rem 0' }}>{item.description}</div>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                        <span>{item.category}</span> • <span>{item.owner}</span>
                        {item.is_critical && (
                          <span style={{ color: '#dc2626', fontWeight: 700, marginLeft: '0.4rem' }}>Critical</span>
                        )}
                      </div>
                    </div>
                    {onAddItemFromCopilot && (
                      <button
                        onClick={() => {
                          onAddItemFromCopilot(item);
                          setSuggestions(suggestions.filter((_, i) => i !== idx));
                        }}
                        className="btn-goml btn-goml-black btn-goml-sm"
                        style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', flexShrink: 0 }}
                      >
                        <Plus size={12} /> Add
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ED7D31', fontSize: '0.85rem' }}>
              <Loader2 className="animate-spin" size={16} />
              <span>GoML Copilot analyzing architecture...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          style={{
            padding: '1rem 1.25rem',
            borderTop: '1px solid #e5e5e5',
            background: '#ffffff',
            display: 'flex',
            gap: '0.5rem'
          }}
        >
          <input
            type="text"
            className="goml-input"
            placeholder="Ask Copilot about blockers, security, or drafts..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            style={{ fontSize: '0.85rem', padding: '0.6rem 0.85rem' }}
          />
          <button
            type="submit"
            className="btn-goml btn-goml-orange"
            disabled={loading || !input.trim()}
            style={{ padding: '0.6rem 1rem' }}
          >
            <Send size={15} />
          </button>
        </form>
      </div>
    </div>
  );
};
