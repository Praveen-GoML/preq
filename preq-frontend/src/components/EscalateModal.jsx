import React, { useState } from 'react';
import axios from 'axios';
import { Send, X, Loader2, ShieldAlert } from 'lucide-react';
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
      <div className="goml-modal-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              background: '#F4F4F5',
              border: '1px solid #E4E4E7',
              padding: '0.4rem',
              borderRadius: '8px'
            }}>
              <ShieldAlert size={20} color="#0F172A" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', margin: 0, color: '#111827' }}>Trigger SLA Escalation / Nudge</h3>
              <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>
                {item.name} ({item.owner})
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleEscalate}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.5rem' }}>
              Escalation Severity Tier
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
              <div
                onClick={() => setLevel(1)}
                style={{
                  border: `1.5px solid ${level === 1 ? '#ED7D31' : '#e5e5e5'}`,
                  background: level === 1 ? '#fff9f5' : '#ffffff',
                  borderRadius: '8px',
                  padding: '0.75rem',
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: level === 1 ? '#ED7D31' : '#111827' }}>Tier 1: Warning</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>Upcoming SLA</div>
              </div>

              <div
                onClick={() => setLevel(2)}
                style={{
                  border: `1.5px solid ${level === 2 ? '#ED7D31' : '#e5e5e5'}`,
                  background: level === 2 ? '#fff9f5' : '#ffffff',
                  borderRadius: '8px',
                  padding: '0.75rem',
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: level === 2 ? '#ED7D31' : '#111827' }}>Tier 2: Urgent</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>Kick-off Threat</div>
              </div>

              <div
                onClick={() => setLevel(3)}
                style={{
                  border: `1.5px solid ${level === 3 ? '#dc2626' : '#e5e5e5'}`,
                  background: level === 3 ? '#fef2f2' : '#ffffff',
                  borderRadius: '8px',
                  padding: '0.75rem',
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: level === 3 ? '#dc2626' : '#111827' }}>Tier 3: Critical</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>Exec Sponsor</div>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
              Escalation Notification Message
            </label>
            <textarea
              className="goml-input"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
          </div>

          {error && (
            <div style={{ color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', padding: '0.65rem', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" onClick={onClose} className="btn-goml btn-goml-outline btn-goml-sm">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-goml btn-goml-orange btn-goml-sm">
              {loading ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />}
              <span>Dispatch Escalation Alert</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
