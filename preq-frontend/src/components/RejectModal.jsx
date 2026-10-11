import React, { useState } from 'react';
import axios from 'axios';
import { X, Loader2 } from 'lucide-react';
import { API_URL } from '../apiConfig';

export const RejectModal = ({ isOpen, onClose, item, onRejected }) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !item) return null;

  const handleReject = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Please provide a specific reason for rejection.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await axios.post(`${API_URL}/items/${item.id}/reject`, {
        reason: reason.trim()
      });

      onRejected();
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to reject evidence.');
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
              Reject Evidence Artifact
            </h3>
            <p style={{ color: '#64748B', fontSize: '0.875rem', margin: '4px 0 0', fontWeight: 500 }}>
              {item.name}
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

        <form onSubmit={handleReject}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
              Rejection Reason & Required Remediation
            </label>
            <textarea
              className="goml-input"
              rows={4}
              placeholder="e.g., The IAM policy snippet includes wildcard '*' permissions. Please restrict to S3 bucket arn:aws:s3:::apex-staging-data..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
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
                background: '#0F172A',
                color: '#FFFFFF',
                border: '2px solid #0F172A',
                borderRadius: '9999px',
                padding: '9px 24px',
                fontSize: '13px',
                fontWeight: 800,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
              onMouseOver={(e) => { e.currentTarget.style.background = '#ED7D31'; e.currentTarget.style.borderColor = '#ED7D31'; }}
              onMouseOut={(e) => { e.currentTarget.style.background = '#0F172A'; e.currentTarget.style.borderColor = '#0F172A'; }}
            >
              {loading && <Loader2 className="animate-spin" size={14} />}
              <span>Confirm Rejection</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
