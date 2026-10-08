import React, { useState } from 'react';
import axios from 'axios';
import { XCircle, X, Loader2 } from 'lucide-react';
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
      <div className="goml-modal-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              padding: '0.4rem',
              borderRadius: '8px'
            }}>
              <XCircle size={20} color="#dc2626" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', margin: 0, color: '#111827' }}>Reject Evidence Artifact</h3>
              <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>
                {item.name}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleReject}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
              Rejection Reason & Required Remediation
            </label>
            <textarea
              className="goml-input"
              rows={4}
              placeholder="e.g., The IAM policy snippet includes wildcard '*' permissions. Please restrict to S3 bucket arn:aws:s3:::apex-staging-data..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
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
            <button type="submit" disabled={loading} className="btn-goml btn-goml-black btn-goml-sm" style={{ backgroundColor: '#dc2626', borderColor: '#dc2626' }}>
              {loading ? <Loader2 className="animate-spin" size={14} /> : <XCircle size={14} />}
              <span>Confirm Rejection</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
