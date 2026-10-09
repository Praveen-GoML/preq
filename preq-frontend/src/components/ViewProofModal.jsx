import React, { useState } from 'react';
import axios from 'axios';
import { 
  X, Check, Sparkles, ShieldCheck, FileText, Download, 
  ExternalLink, Eye, Key, AlertTriangle, ArrowRight,
  Clock, CheckCircle, CheckCircle2, XCircle, Copy, Send,
  User, Calendar, Layers, Lock, Image as ImageIcon, ZoomIn, RefreshCw
} from 'lucide-react';
import { API_URL, BASE_URL } from '../apiConfig';

export const ViewProofModal = ({
  isOpen = true,
  item,
  project,
  onClose,
  onUpdated,
  onOpenRejectModal
}) => {
  if (!isOpen || !item) return null;

  const [isVerifying, setIsVerifying] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Parse structured handover specs from evidence_notes if available
  const parseNotes = (notes) => {
    if (!notes) return {};
    const lines = notes.split('\n');
    const result = {};
    lines.forEach(line => {
      const parts = line.split(': ');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const val = parts.slice(1).join(': ').trim();
        result[key] = val;
      }
    });
    return result;
  };

  const parsedSpecs = parseNotes(item.evidence_notes);

  // Detect delivery channel
  const notesText = item.evidence_notes || '';
  const isTeams = notesText.includes('Teams') || notesText.includes('Specification') || notesText.includes('Host/Endpoint:');
  const isSlack = notesText.includes('Slack') || notesText.includes('#') || notesText.includes('mrkdwn');
  const isWebhook = notesText.includes('Inbound from') || notesText.includes('Webhook');

  // Multi-file evidence parsing
  const evidenceFiles = item.evidence_file 
    ? item.evidence_file.split(',').map(f => f.trim()).filter(Boolean)
    : [];

  const handleCopyMaskedKey = () => {
    if (item.masked_api_key) {
      navigator.clipboard.writeText(item.masked_api_key);
      setCopiedKey(true);
      triggerToast('Copied credential reference to clipboard!');
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  // Instant Manual Approval
  const handleApprove = async () => {
    try {
      await axios.post(`${API_URL}/items/${item.id}/verify`);
      triggerToast(`Milestone "${item.name}" marked Verified!`);
      if (onUpdated) onUpdated();
      onClose();
    } catch (err) {
      console.error(err);
      triggerToast(err.response?.data?.detail || 'Error approving milestone');
    }
  };

  // AI Proof Verification
  const handleAiVerify = async () => {
    setIsVerifying(true);
    try {
      await axios.post(`${API_URL}/items/${item.id}/ai-verify`);
      triggerToast('AI verification analysis complete!');
      if (onUpdated) onUpdated();
    } catch (err) {
      console.error(err);
      triggerToast(err.response?.data?.detail || 'AI Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const isDone = item.status === 'Verified';

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(9, 9, 11, 0.78)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1.5rem',
        boxSizing: 'border-box',
        fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}
    >
      {/* TOAST */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#09090B',
          color: '#FFFFFF',
          padding: '10px 24px',
          borderRadius: '100px',
          fontSize: '13px',
          fontWeight: 700,
          boxShadow: '0 16px 36px rgba(0,0,0,0.4)',
          zIndex: 10001,
          border: '1px solid #27272A',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle size={15} color="#ED7D31" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* MODAL CARD */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          maxWidth: '920px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          border: '1px solid #E4E4E7',
          overflow: 'hidden'
        }}
      >
        {/* 1. HEADER */}
        <div style={{
          padding: '1.5rem 2rem',
          borderBottom: '1px solid #E4E4E7',
          background: '#FFFFFF',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '1rem',
          flexShrink: 0
        }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            {/* Top Tag Strip */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#ED7D31',
                background: '#FFF7ED',
                border: '1px solid #FFEDD5',
                padding: '2px 9px',
                borderRadius: '9999px',
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}>
                {item.category || 'Security'}
              </span>

              {item.is_critical && (
                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#EA580C',
                  background: '#FFF7ED',
                  border: '1px solid #FED7AA',
                  padding: '2px 9px',
                  borderRadius: '9999px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#EA580C' }} />
                  Day-1 Gatekeeper
                </span>
              )}

              {/* Handover Channel Badge */}
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#09090B',
                background: '#F4F4F5',
                border: '1px solid #E4E4E7',
                padding: '2px 10px',
                borderRadius: '9999px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                {isTeams ? (
                  <span>💬 Microsoft Teams Handover Spec</span>
                ) : isSlack ? (
                  <span>💬 Slack mrkdwn Delivery</span>
                ) : isWebhook ? (
                  <span>⚡ Inbound API / Webhook</span>
                ) : (
                  <span>🛡️ Verified Client Handover Protocol</span>
                )}
              </span>

              {/* Status Badge */}
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                color: isDone ? '#16A34A' : '#EA580C',
                background: isDone ? '#F0FDF4' : '#FFF7ED',
                border: isDone ? '1px solid #DCFCE7' : '1px solid #FED7AA',
                padding: '2px 10px',
                borderRadius: '9999px'
              }}>
                {isDone ? 'Cleared & Verified' : 'In Engineering Review'}
              </span>
            </div>

            <h2 style={{
              fontSize: '1.35rem',
              fontWeight: 800,
              color: '#09090B',
              margin: '0 0 6px 0',
              lineHeight: 1.3,
              letterSpacing: '-0.02em'
            }}>
              {item.name}
            </h2>

            <div style={{
              fontSize: '12.5px',
              color: '#71717A',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              flexWrap: 'wrap'
            }}>
              <span><strong>Owner:</strong> {item.owner || 'Client Technical Lead'}</span>
              <span>&bull;</span>
              <span><strong>Due SLA:</strong> {item.due_date || 'Day-1'}</span>
              {project?.client_name && (
                <>
                  <span>&bull;</span>
                  <span><strong>Client Sponsor:</strong> {project.client_name}</span>
                </>
              )}
            </div>
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#F4F4F5',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#71717A',
              transition: 'all 0.15s ease'
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = '#E4E4E7'; e.currentTarget.style.color = '#09090B'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = '#F4F4F5'; e.currentTarget.style.color = '#71717A'; }}
          >
            <X size={16} />
          </button>
        </div>

        {/* 2. SCROLLABLE BODY */}
        <div style={{
          padding: '1.75rem 2rem',
          overflowY: 'auto',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          background: '#FAFAFC'
        }}>
          {/* A. Expected Deliverable Standard Card */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid #E4E4E7',
            padding: '1.25rem 1.5rem'
          }}>
            <div style={{
              fontSize: '11px',
              fontWeight: 800,
              color: '#ED7D31',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '6px'
            }}>
              Expected Deliverable Standard
            </div>
            <div style={{ fontSize: '13.5px', color: '#09090B', lineHeight: 1.5, fontWeight: 500 }}>
              {item.expected_evidence || 'Structured access credential, schema confirmation, or security-group rule list.'}
            </div>
          </div>

          {/* B. Structured Handover Specification Table (Teams / Slack Shared Specs) */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid #E4E4E7',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '1rem 1.5rem',
              background: '#09090B',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={16} color="#ED7D31" />
                <span style={{ fontSize: '12.5px', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  Handover Specification & Credential Audit
                </span>
              </div>
              <span style={{ fontSize: '11px', color: '#A1A1AA', fontWeight: 600 }}>
                Zero-Exposure Masking Active
              </span>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <tbody>
                <tr style={{ borderBottom: '1px solid #F4F4F5' }}>
                  <td style={{ padding: '10px 1.5rem', width: '30%', fontWeight: 700, color: '#71717A', background: '#FAFAFC' }}>Host / Endpoint URL</td>
                  <td style={{ padding: '10px 1.5rem', fontFamily: 'monospace', color: '#09090B', fontWeight: 600 }}>
                    {parsedSpecs['Host/Endpoint'] || parsedSpecs['Host'] || item.evidence_url || 'https://api.internal.movilventas.net/staging'}
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #F4F4F5' }}>
                  <td style={{ padding: '10px 1.5rem', fontWeight: 700, color: '#71717A', background: '#FAFAFC' }}>Auth Method / Protocol</td>
                  <td style={{ padding: '10px 1.5rem', color: '#09090B' }}>
                    {parsedSpecs['Auth Protocol'] || parsedSpecs['Auth'] || 'Read-Only Service Account / IAM TLS Enforced'}
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #F4F4F5' }}>
                  <td style={{ padding: '10px 1.5rem', fontWeight: 700, color: '#71717A', background: '#FAFAFC' }}>Username / Service Account</td>
                  <td style={{ padding: '10px 1.5rem', fontFamily: 'monospace', color: '#09090B' }}>
                    {parsedSpecs['User/Account'] || parsedSpecs['Username'] || 'goml_staging_reader_ro'}
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #F4F4F5' }}>
                  <td style={{ padding: '10px 1.5rem', fontWeight: 700, color: '#71717A', background: '#FAFAFC' }}>Vault Reference / Secret Key</td>
                  <td style={{ padding: '10px 1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <code style={{
                        background: '#FFF7ED',
                        border: '1px solid #FED7AA',
                        padding: '3px 10px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        color: '#EA580C',
                        fontWeight: 700,
                        fontFamily: 'monospace'
                      }}>
                        {item.masked_api_key || parsedSpecs['Vault Reference'] || '[AWS Secrets Manager: secret/movilventas-rds-ro]'}
                      </code>
                      <button
                        type="button"
                        onClick={handleCopyMaskedKey}
                        style={{
                          background: '#FFFFFF',
                          border: '1px solid #E4E4E7',
                          borderRadius: '6px',
                          padding: '3px 8px',
                          fontSize: '11px',
                          color: '#09090B',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontWeight: 600
                        }}
                      >
                        {copiedKey ? <Check size={11} color="#16A34A" /> : <Copy size={11} />}
                        <span>{copiedKey ? 'Copied' : 'Copy Ref'}</span>
                      </button>
                    </div>
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #F4F4F5' }}>
                  <td style={{ padding: '10px 1.5rem', fontWeight: 700, color: '#71717A', background: '#FAFAFC' }}>Network Ingress / Whitelist</td>
                  <td style={{ padding: '10px 1.5rem', fontFamily: 'monospace', color: '#09090B' }}>
                    {parsedSpecs['Ingress Whitelist'] || '34.120.45.10/32 (goML Staging VPC NAT)'}
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #F4F4F5' }}>
                  <td style={{ padding: '10px 1.5rem', fontWeight: 700, color: '#71717A', background: '#FAFAFC' }}>Environment Scope</td>
                  <td style={{ padding: '10px 1.5rem', color: '#09090B' }}>
                    {parsedSpecs['Scope'] || 'Staging Sandbox / Read-Only Schema Map & Routing Validation'}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '10px 1.5rem', fontWeight: 700, color: '#71717A', background: '#FAFAFC' }}>Client Sign-off Contact</td>
                  <td style={{ padding: '10px 1.5rem', fontWeight: 700, color: '#09090B' }}>
                    {parsedSpecs['Client Sign-off'] || project?.client_name || 'Client Technical Lead'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* C. Attached Screenshots & Proof Files */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid #E4E4E7',
            padding: '1.25rem 1.5rem'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.85rem'
            }}>
              <div style={{
                fontSize: '11px',
                fontWeight: 800,
                color: '#ED7D31',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Attached Evidence Artifacts & Screenshots ({evidenceFiles.length})
              </div>
              <span style={{ fontSize: '11.5px', color: '#71717A' }}>
                High-Resolution Audit Proof
              </span>
            </div>

            {evidenceFiles.length === 0 ? (
              <div style={{
                padding: '2rem 1rem',
                textAlign: 'center',
                color: '#71717A',
                fontSize: '13px',
                background: '#FAFAFC',
                borderRadius: '8px',
                border: '1px dashed #E4E4E7'
              }}>
                No screenshot or file artifact attached yet. Handover credentials provided above.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                {evidenceFiles.map((filePath, idx) => {
                  const fullUrl = filePath.startsWith('http') ? filePath : `${BASE_URL}${filePath}`;
                  const isImg = /\.(png|jpe?g|webp|gif|svg)$/i.test(filePath);
                  const fileName = filePath.split('/').pop() || `artifact-${idx + 1}`;

                  return (
                    <div
                      key={idx}
                      style={{
                        background: '#FAFAFC',
                        border: '1px solid #E4E4E7',
                        borderRadius: '10px',
                        padding: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {/* Image Preview / File Icon */}
                      {isImg ? (
                        <div
                          onClick={() => setSelectedImage(fullUrl)}
                          style={{
                            width: '100%',
                            height: '180px',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            border: '1px solid #CBD5E1',
                            background: '#09090B',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            position: 'relative'
                          }}
                        >
                          <img
                            src={fullUrl}
                            alt={fileName}
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                          />
                          <div style={{
                            position: 'absolute',
                            bottom: '8px',
                            right: '8px',
                            background: 'rgba(0,0,0,0.75)',
                            color: '#FFFFFF',
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <ZoomIn size={12} />
                            <span>Click to Zoom</span>
                          </div>
                        </div>
                      ) : (
                        <div style={{
                          height: '100px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: '#FFFFFF',
                          borderRadius: '8px',
                          border: '1px solid #E4E4E7'
                        }}>
                          <FileText size={38} color="#ED7D31" />
                        </div>
                      )}

                      {/* File Info & Action */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{
                            fontSize: '12.5px',
                            fontWeight: 700,
                            color: '#09090B',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }} title={fileName}>
                            {fileName}
                          </div>
                          <div style={{ fontSize: '11px', color: '#71717A' }}>
                            Verified Audit Proof
                          </div>
                        </div>

                        <a
                          href={fullUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            background: '#09090B',
                            color: '#FFFFFF',
                            borderRadius: '6px',
                            padding: '6px 12px',
                            fontSize: '11.5px',
                            fontWeight: 700,
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            flexShrink: 0
                          }}
                        >
                          <span>{isImg ? 'Open' : 'Download'}</span>
                          <ExternalLink size={11} />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* D. AI Evaluation & Verification Proof Engine */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid #E4E4E7',
            padding: '1.25rem 1.5rem'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.85rem'
            }}>
              <div style={{
                fontSize: '11px',
                fontWeight: 800,
                color: '#ED7D31',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <Sparkles size={14} color="#ED7D31" />
                <span>AI Proof Analysis & Confidence Engine</span>
              </div>

              {item.verification_score !== null && item.verification_score !== undefined ? (
                <span style={{
                  fontSize: '12px',
                  fontWeight: 800,
                  color: '#16A34A',
                  background: '#F0FDF4',
                  border: '1px solid #BBF7D0',
                  padding: '3px 10px',
                  borderRadius: '9999px'
                }}>
                  {item.verification_score}% Confidence Passed
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleAiVerify}
                  disabled={isVerifying}
                  style={{
                    background: '#ED7D31',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '9999px',
                    padding: '5px 14px',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    boxShadow: '0 2px 8px rgba(237, 125, 49, 0.3)'
                  }}
                >
                  <Sparkles size={12} />
                  <span>{isVerifying ? 'Analyzing Evidence...' : 'Run AI Evaluation'}</span>
                </button>
              )}
            </div>

            {item.verification_notes ? (
              <div style={{
                background: '#F0FDF4',
                border: '1px solid #BBF7D0',
                borderRadius: '8px',
                padding: '1rem',
                fontSize: '12.5px',
                color: '#14532D',
                lineHeight: 1.5
              }}>
                <strong>AI Audit Reasoning:</strong>
                <div style={{ marginTop: '4px', whiteSpace: 'pre-wrap' }}>
                  {item.verification_notes}
                </div>
              </div>
            ) : (
              <div style={{ fontSize: '12.5px', color: '#71717A', lineHeight: 1.4 }}>
                Run the AI evaluation engine to cryptographically check schema structure, IP CIDR notation, and AWS/MySQL credential validity against SOW requirements.
              </div>
            )}
          </div>
        </div>

        {/* 3. STICKY FOOTER ACTIONS */}
        <div style={{
          padding: '1.25rem 2rem',
          borderTop: '1px solid #E4E4E7',
          background: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0
        }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#F4F4F5',
              border: 'none',
              borderRadius: '9999px',
              padding: '9px 20px',
              fontSize: '13px',
              fontWeight: 700,
              color: '#71717A',
              cursor: 'pointer'
            }}
          >
            Close
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Reject button */}
            {!isDone && onOpenRejectModal && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenRejectModal(item);
                }}
                style={{
                  background: '#FFFFFF',
                  color: '#DC2626',
                  border: '1px solid #FECACA',
                  borderRadius: '9999px',
                  padding: '9px 18px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <XCircle size={14} />
                <span>Reject with Feedback</span>
              </button>
            )}

            {/* AI Verify Button */}
            {!isDone && (
              <button
                type="button"
                onClick={handleAiVerify}
                disabled={isVerifying}
                style={{
                  background: '#FFFFFF',
                  color: '#ED7D31',
                  border: '1.5px solid #ED7D31',
                  borderRadius: '9999px',
                  padding: '9px 18px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Sparkles size={14} />
                <span>{isVerifying ? 'Evaluating...' : 'AI Verify'}</span>
              </button>
            )}

            {/* Approve Button */}
            {!isDone ? (
              <button
                type="button"
                onClick={handleApprove}
                style={{
                  background: '#09090B',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '9999px',
                  padding: '10px 24px',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '7px',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
                  transition: 'all 0.15s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#27272A'}
                onMouseOut={(e) => e.currentTarget.style.background = '#09090B'}
              >
                <Check size={15} strokeWidth={3} />
                <span>Approve & Mark Verified</span>
              </button>
            ) : (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                color: '#16A34A',
                fontWeight: 800,
                fontSize: '13px',
                padding: '8px 18px',
                background: '#F0FDF4',
                borderRadius: '9999px',
                border: '1px solid #DCFCE7'
              }}>
                <CheckCircle2 size={16} />
                <span>Verified & Cleared for Kick-off</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FULLSCREEN IMAGE LIGHTBOX ZOOM */}
      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.92)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10002,
            padding: '2rem'
          }}
        >
          <div style={{ position: 'relative', maxWidth: '95vw', maxHeight: '95vh' }} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSelectedImage(null)}
              style={{
                position: 'absolute',
                top: '-40px',
                right: '0',
                background: '#FFFFFF',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#09090B'
              }}
            >
              <X size={18} />
            </button>
            <img
              src={selectedImage}
              alt="Full Resolution Evidence"
              style={{
                maxWidth: '90vw',
                maxHeight: '85vh',
                objectFit: 'contain',
                borderRadius: '8px',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
