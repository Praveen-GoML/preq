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
    <div className="goml-modal-overlay">
      <div className="goml-modal-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', margin: 0, color: '#111827' }}>Add Custom Pre-requisite</h3>
            <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '0.2rem 0 0' }}>
              Define a new required milestone before Day-1 project kick-off.
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
              Requirement Title *
            </label>
            <input
              type="text"
              className="goml-input"
              placeholder="e.g., Cross-Account VPC Peering Routing Table Approval"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                Category
              </label>
              <select className="goml-input" value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                Primary Owner
              </label>
              <select className="goml-input" value={owner} onChange={(e) => setOwner(e.target.value)}>
                {OWNERS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
              Description & Rationale
            </label>
            <textarea
              className="goml-input"
              rows={2}
              placeholder="Why this item is mandatory and what risk it eliminates..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                Due Date
              </label>
              <input
                type="date"
                className="goml-input"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                Critical Gatekeeper?
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginTop: '0.6rem' }}>
                <input
                  type="checkbox"
                  checked={isCritical}
                  onChange={(e) => setIsCritical(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: '#ED7D31' }}
                />
                <span style={{ fontSize: '0.85rem', color: isCritical ? '#dc2626' : '#64748b', fontWeight: 600 }}>
                  Mandatory Kick-off Blocker
                </span>
              </label>
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
              Expected Evidence Artifact
            </label>
            <input
              type="text"
              className="goml-input"
              placeholder="e.g. Terraform plan output, signed policy PDF, route table screenshot"
              value={expectedEvidence}
              onChange={(e) => setExpectedEvidence(e.target.value)}
            />
          </div>

          {/* Dependencies */}
          {existingItems.length > 0 && (
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                Prerequisites (Must be verified before this milestone)
              </label>
              <select
                className="goml-input"
                multiple
                value={selectedDeps}
                onChange={(e) => {
                  const vals = Array.from(e.target.selectedOptions, opt => opt.value);
                  setSelectedDeps(vals);
                }}
                style={{ height: '80px', fontSize: '0.8rem' }}
              >
                {existingItems.map(it => (
                  <option key={it.id} value={it.id}>
                    {it.name} ({it.status})
                  </option>
                ))}
              </select>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Hold Ctrl/Cmd to select multiple dependencies</span>
            </div>
          )}

          {error && (
            <div style={{ color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', padding: '0.65rem', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" onClick={onClose} className="btn-goml btn-goml-outline btn-goml-sm">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-goml btn-goml-black btn-goml-sm">
              {loading ? <Loader2 className="animate-spin" size={14} /> : <PlusCircle size={14} />}
              <span>Add to Matrix</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
