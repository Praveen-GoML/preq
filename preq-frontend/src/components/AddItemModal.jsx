import React, { useState } from 'react';
import axios from 'axios';
import { PlusCircle, X, Loader2 } from 'lucide-react';
import { API_URL } from '../apiConfig';

const CATEGORIES = ["Environment", "Security", "Data", "Compliance", "People", "Integration"];
const OWNERS = ["Client Sponsor", "DevOps Lead", "Security & Compliance Lead", "Data Steward", "Cloud Architect", "Project Lead"];

export const AddItemModal = ({ isOpen, onClose, projectId, existingItems = [], onItemAdded }) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Environment');
  const [description, setDescription] = useState('');
  const [owner, setOwner] = useState('DevOps Lead');
  const [isCritical, setIsCritical] = useState(false);
  const [dueDate, setDueDate] = useState('');
  const [expectedEvidence, setExpectedEvidence] = useState('');
  const [selectedDeps, setSelectedDeps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Prerequisite title is required.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await axios.post(`${API_URL}/projects/${projectId}/items`, {
        name: name.trim(),
        category,
        description: description.trim(),
        owner,
        is_critical: isCritical,
        due_date: dueDate,
        expected_evidence: expectedEvidence.trim() || 'Verification document or screenshot',
        depends_on: selectedDeps
      });

      onItemAdded();
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to add prerequisite.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        padding: 0,
        margin: 0
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '920px',
          maxHeight: '90vh',
          backgroundColor: '#FFFFFF',
          borderRadius: '32px 32px 0 0',
          borderTop: '3.5px solid #ED7D31',
          boxShadow: '0 -24px 70px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
          fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
          animation: 'slideUpSheet 0.32s cubic-bezier(0.16, 1, 0.3, 1) forwards'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Grab Handle Pull Bar */}
        <div style={{
          width: '56px',
          height: '5px',
          borderRadius: '9999px',
          backgroundColor: '#000000',
          opacity: 0.22,
          margin: '14px auto 2px auto',
          flexShrink: 0
        }} />

        {/* Ambient Orange Radial Glow in Header */}
        <div style={{
          position: 'absolute',
          top: '-60px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '600px',
          height: '180px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(237, 125, 49, 0.24) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0
        }} />

        {/* High-Contrast Round Close Button at Top Right */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 16,
            right: 22,
            zIndex: 3,
            color: '#0F172A',
            backgroundColor: '#FFFFFF',
            borderRadius: '50%',
            width: 38,
            height: 38,
            border: '1.5px solid #000000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.18s ease'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#000000';
            e.currentTarget.style.color = '#FFFFFF';
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = '#FFFFFF';
            e.currentTarget.style.color = '#0F172A';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          title="Close dialog"
        >
          <X size={18} strokeWidth={2.5} />
        </button>

        {/* Modal Header */}
        <div style={{
          padding: '1.5rem 2.5rem 1rem 2.5rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          position: 'relative',
          zIndex: 1,
          borderBottom: '1px solid #F1F5F9'
        }}>
          <h2 style={{
            fontSize: '1.75rem',
            fontWeight: 800,
            color: '#0F172A',
            margin: '0.25rem 0 0.4rem 0',
            letterSpacing: '-0.025em'
          }}>
            Add Engineering Prerequisite
          </h2>
          <p style={{
            fontSize: '14.5px',
            color: '#64748B',
            margin: 0,
            fontWeight: 500,
            maxWidth: '560px'
          }}>
            Define a required technical or governance milestone before Day-1 project kick-off.
          </p>
        </div>

        {/* Form Body - Scrollable */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div style={{
            padding: '1.75rem 2.5rem',
            overflowY: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem'
          }}>
            {/* Requirement Title */}
            <div>
              <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 800, color: '#0F172A', marginBottom: '0.45rem' }}>
                Requirement Title *
              </label>
              <input
                type="text"
                placeholder="e.g., Cross-Account VPC Peering Routing Table Approval"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={{
                  width: '100%',
                  borderRadius: '14px',
                  border: '2px solid #CBD5E1',
                  fontSize: '14.5px',
                  padding: '13px 16px',
                  boxSizing: 'border-box',
                  background: '#FFFFFF',
                  color: '#0F172A',
                  fontFamily: 'inherit',
                  transition: 'border-color 0.15s ease, box-shadow 0.15s ease'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#ED7D31';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(237, 125, 49, 0.18)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#CBD5E1';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Category & Owner */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 800, color: '#0F172A', marginBottom: '0.45rem' }}>
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{
                    width: '100%',
                    borderRadius: '14px',
                    border: '2px solid #CBD5E1',
                    fontSize: '14.5px',
                    padding: '13px 16px',
                    boxSizing: 'border-box',
                    background: '#FFFFFF',
                    color: '#0F172A',
                    fontFamily: 'inherit',
                    cursor: 'pointer'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#ED7D31';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#CBD5E1';
                  }}
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 800, color: '#0F172A', marginBottom: '0.45rem' }}>
                  Primary Owner
                </label>
                <select
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                  style={{
                    width: '100%',
                    borderRadius: '14px',
                    border: '2px solid #CBD5E1',
                    fontSize: '14.5px',
                    padding: '13px 16px',
                    boxSizing: 'border-box',
                    background: '#FFFFFF',
                    color: '#0F172A',
                    fontFamily: 'inherit',
                    cursor: 'pointer'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#ED7D31';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#CBD5E1';
                  }}
                >
                  {OWNERS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 800, color: '#0F172A', marginBottom: '0.45rem' }}>
                Description & Technical Rationale
              </label>
              <textarea
                rows={2}
                placeholder="Why this item is mandatory and what engineering risks it mitigates..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{
                  width: '100%',
                  borderRadius: '14px',
                  border: '2px solid #CBD5E1',
                  fontSize: '14px',
                  lineHeight: 1.5,
                  padding: '13px 16px',
                  boxSizing: 'border-box',
                  background: '#FFFFFF',
                  color: '#0F172A',
                  fontFamily: 'inherit',
                  transition: 'border-color 0.15s ease, box-shadow 0.15s ease'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#ED7D31';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(237, 125, 49, 0.18)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#CBD5E1';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Due Date & Critical Gatekeeper */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', alignItems: 'center' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 800, color: '#0F172A', marginBottom: '0.45rem' }}>
                  Target Resolution Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  style={{
                    width: '100%',
                    borderRadius: '14px',
                    border: '2px solid #CBD5E1',
                    fontSize: '14px',
                    padding: '12px 16px',
                    boxSizing: 'border-box',
                    background: '#FFFFFF',
                    color: '#0F172A',
                    fontFamily: 'inherit'
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#ED7D31'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = '#CBD5E1'; }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 800, color: '#0F172A', marginBottom: '0.45rem' }}>
                  Gatekeeper Priority
                </label>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    padding: '11px 16px',
                    borderRadius: '14px',
                    border: isCritical ? '2px solid #ED7D31' : '2px solid #E2E8F0',
                    background: isCritical ? '#FFF7ED' : '#F8FAFC',
                    transition: 'all 0.18s ease'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isCritical}
                    onChange={(e) => setIsCritical(e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: '#ED7D31', cursor: 'pointer' }}
                  />
                  <div>
                    <span style={{ fontSize: '13.5px', color: isCritical ? '#EA580C' : '#334155', fontWeight: 800 }}>
                      Mandatory Blocker
                    </span>
                    <span style={{ display: 'block', fontSize: '11.5px', color: '#64748B' }}>
                      Project cannot kick off without this
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Expected Evidence Artifact */}
            <div>
              <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 800, color: '#0F172A', marginBottom: '0.45rem' }}>
                Required Verification Artifact
              </label>
              <input
                type="text"
                placeholder="e.g., Terraform plan log, signed security policy PDF, AWS IAM console screenshot"
                value={expectedEvidence}
                onChange={(e) => setExpectedEvidence(e.target.value)}
                style={{
                  width: '100%',
                  borderRadius: '14px',
                  border: '2px solid #CBD5E1',
                  fontSize: '14px',
                  padding: '13px 16px',
                  boxSizing: 'border-box',
                  background: '#FFFFFF',
                  color: '#0F172A',
                  fontFamily: 'inherit',
                  transition: 'border-color 0.15s ease, box-shadow 0.15s ease'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#ED7D31';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(237, 125, 49, 0.18)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#CBD5E1';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Dependencies */}
            {existingItems.length > 0 && (
              <div>
                <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 800, color: '#0F172A', marginBottom: '0.45rem' }}>
                  Dependent Milestones (Must resolve prior to this item)
                </label>
                <select
                  multiple
                  value={selectedDeps}
                  onChange={(e) => {
                    const vals = Array.from(e.target.selectedOptions, opt => opt.value);
                    setSelectedDeps(vals);
                  }}
                  style={{
                    width: '100%',
                    height: '84px',
                    fontSize: '13px',
                    borderRadius: '14px',
                    border: '2px solid #CBD5E1',
                    padding: '8px 12px',
                    boxSizing: 'border-box',
                    background: '#FFFFFF',
                    color: '#0F172A',
                    fontFamily: 'inherit'
                  }}
                >
                  {existingItems.map(it => (
                    <option key={it.id} value={it.id}>
                      {it.name} ({it.status})
                    </option>
                  ))}
                </select>
                <span style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px', display: 'block' }}>
                  Hold Ctrl (Windows) or Cmd (Mac) to select multiple dependencies
                </span>
              </div>
            )}

            {error && (
              <div style={{
                color: '#EA580C',
                background: '#FFF7ED',
                border: '2px solid #FED7AA',
                padding: '0.85rem 1.25rem',
                borderRadius: '14px',
                fontSize: '13.5px',
                fontWeight: 700
              }}>
                {error}
              </div>
            )}
          </div>

          {/* Sticky Footer */}
          <div style={{
            padding: '1.25rem 2.5rem',
            borderTop: '1px solid #E2E8F0',
            backgroundColor: '#F8FAFC',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: '12px'
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                borderRadius: '9999px',
                border: '2px solid #CBD5E1',
                padding: '12px 28px',
                fontSize: '14.5px',
                fontWeight: 700,
                background: '#FFFFFF',
                color: '#334155',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = '#0F172A';
                e.currentTarget.style.color = '#0F172A';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = '#CBD5E1';
                e.currentTarget.style.color = '#334155';
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              style={{
                borderRadius: '9999px',
                border: 'none',
                padding: '13px 34px',
                fontSize: '14.5px',
                fontWeight: 800,
                background: 'linear-gradient(135deg, #ED7D31 0%, #EA580C 100%)',
                color: '#FFFFFF',
                boxShadow: '0 6px 20px rgba(237, 125, 49, 0.4)',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.18s ease'
              }}
              onMouseOver={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 8px 26px rgba(237, 125, 49, 0.5)';
                }
              }}
              onMouseOut={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(237, 125, 49, 0.4)';
                }
              }}
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : <PlusCircle size={16} />}
              <span>Add to Matrix</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
