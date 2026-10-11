import React, { useState } from 'react';
import axios from 'axios';
import { X, Loader2 } from 'lucide-react';
import { API_URL } from '../apiConfig';

export const EscalateModal = ({ isOpen, onClose, item, onEscalated }) => {
  const [level, setLevel] = useState(2);
  const [message, setMessage] = useState(
    `Prerequisite '${item?.name}' assigned to ${item?.owner} is currently pending or blocked. Target kick-off schedule is at risk unless evidence is submitted immediately.`
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !item) return null;

  const handleEscalate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await axios.post(`${API_URL}/items/${item.id}/escalate`, {
        level: parseInt(level),
        message: message.trim()
      });

      onEscalated();
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to dispatch escalation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="goml-modal-overlay">
      <div className="goml-modal-content" style={{ borderRadius: '24px', border: '2px solid #E2E8F0', padding: '1.75rem 2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, color: '#0F172A', letterSpacing: '-0.02em' }}>
              Trigger SLA Escalation / Nudge
            </h3>
            <p style={{ color: '#64748B', fontSize: '0.875rem', margin: '4px 0 0', fontWeight: 500 }}>
              {item.name} ({item.owner})
            </p>
          </div>
          <button 
            onClick={onClose} 
            style={{ 
              background: '#FFFFFF', 
              border: '1.5px solid #E2E8F0', 
              borderRadius: '50%', 
              width: '32px', 
              height: '32px', 
              cursor: 'pointer', 
              color: '#0F172A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleEscalate}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.5rem' }}>
              Escalation Severity Tier
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
              <div
                onClick={() => setLevel(1)}
                style={{
                  border: `2px solid ${level === 1 ? '#ED7D31' : '#E2E8F0'}`,
                  background: level === 1 ? '#FFF7ED' : '#FFFFFF',
                  borderRadius: '16px',
                  padding: '0.85rem',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ fontWeight: 800, fontSize: '0.85rem', color: level === 1 ? '#EA580C' : '#0F172A' }}>Tier 1: Warning</div>
                <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.2rem', fontWeight: 500 }}>Upcoming SLA</div>
              </div>

              <div
                onClick={() => setLevel(2)}
                style={{
                  border: `2px solid ${level === 2 ? '#ED7D31' : '#E2E8F0'}`,
                  background: level === 2 ? '#FFF7ED' : '#FFFFFF',
                  borderRadius: '16px',
                  padding: '0.85rem',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ fontWeight: 800, fontSize: '0.85rem', color: level === 2 ? '#EA580C' : '#0F172A' }}>Tier 2: Urgent</div>
                <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.2rem', fontWeight: 500 }}>Kick-off Threat</div>
              </div>

              <div
                onClick={() => setLevel(3)}
                style={{
                  border: `2px solid ${level === 3 ? '#0F172A' : '#E2E8F0'}`,
                  background: level === 3 ? '#0F172A' : '#FFFFFF',
                  borderRadius: '16px',
                  padding: '0.85rem',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ fontWeight: 800, fontSize: '0.85rem', color: level === 3 ? '#FFFFFF' : '#0F172A' }}>Tier 3: Critical</div>
                <div style={{ fontSize: '0.75rem', color: level === 3 ? '#E2E8F0' : '#64748B', marginTop: '0.2rem', fontWeight: 500 }}>Exec Sponsor</div>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
              Escalation Notification Message
            </label>
            <textarea
              className="goml-input"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              style={{
                width: '100%',
                borderRadius: '16px',
                border: '2px solid #E2E8F0',
                padding: '12px 16px',
                fontSize: '13.5px',
                fontFamily: 'inherit',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {error && (
            <div style={{ color: '#EA580C', background: '#FFF7ED', border: '1.5px solid #FED7AA', padding: '0.75rem 1rem', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 700, marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button 
              type="button" 
              onClick={onClose} 
              style={{
                background: '#FFFFFF',
                color: '#0F172A',
                border: '2px solid #E2E8F0',
                borderRadius: '9999px',
                padding: '9px 22px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading} 
              style={{
                background: 'linear-gradient(135deg, #ED7D31 0%, #EA580C 100%)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '9999px',
                padding: '9px 24px',
                fontSize: '13px',
                fontWeight: 800,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 14px rgba(237, 125, 49, 0.35)'
              }}
            >
              {loading && <Loader2 className="animate-spin" size={14} />}
              <span>Dispatch Escalation Alert</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
