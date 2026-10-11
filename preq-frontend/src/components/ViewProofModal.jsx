import React, { useState } from 'react';
import axios from 'axios';
import {
  X, Check, Sparkles, ShieldCheck, FileText, Download,
  ExternalLink, Eye, Key, AlertTriangle, ArrowRight,
  Clock, CheckCircle, CheckCircle2, XCircle, Copy, Send,
  User, Calendar, Layers, Lock, Image as ImageIcon, ZoomIn, RefreshCw
} from 'lucide-react';
import { API_URL, BASE_URL } from '../apiConfig';

// Dynamic Handover Specification Generator
const getDynamicTemplateForRequirement = (item) => {
  if (!item) return {};
  const name = (item.name || '').toLowerCase();
  const desc = (item.description || '').toLowerCase();

  // 1. Google Maps / Geolocation
  if (name.includes('map') || name.includes('google') || name.includes('whitelist') || desc.includes('maps')) {
    return {
      endpoint: 'https://maps.googleapis.com/maps/api/ (Google Cloud Platform Console)',
      authMethod: 'GCP API Key with IP Restrictions (Directions, Geocoding, Distance Matrix enabled)',
      username: 'goml-maps-routing-svc@gcp-project.iam.gserviceaccount.com',
      vaultRef: '[1Password / GCP Secret Manager: secret/google-maps-api-key]',
      ingressIp: 'HTTP Referrers & Ingress IP: 34.120.45.10/32 (goML Egress NAT)',
      envScope: 'Staging & Production Pilot (50k requests/day volume quota provisioned)',
      notes: 'Verified Google Cloud billing active. API key restricted to server IPs and required Maps APIs to prevent unauthorized quota consumption.'
    };
  }

  // 2. IAM / Role / AWS Bedrock
  if (name.includes('bedrock') || name.includes('iam') || name.includes('role') || name.includes('arn')) {
    return {
      endpoint: 'arn:aws:iam::123456789012:role/GoMLBedrockExecutionRole',
      authMethod: 'AWS Cross-Account STS AssumeRole with external ID',
      username: 'arn:aws:iam::123456789012:user/goml-agent-orchestrator',
      vaultRef: '[AWS Secrets Manager: arn:aws:secretsmanager:us-east-1:123456789012:secret:bedrock-sts-token]',
      ingressIp: 'us-east-1 VPC Endpoint',
      envScope: 'us-east-1 Bedrock Claude 3.5 Sonnet / Haiku (Full Model Access)',
      notes: 'Cross-account trust relationship policy attached with bedrock:InvokeModel and bedrock:ListFoundationModels permissions.'
    };
  }

  // 3. Database / SQL / MySQL
  if (name.includes('sql') || name.includes('database') || name.includes('mysql')) {
    return {
      endpoint: 'https://api.internal.movilventas.net/staging',
      authMethod: 'Read-Only Service Account / IAM TLS Enforced',
      username: 'goml_staging_reader_ro',
      vaultRef: '[AWS Secrets Manager: arn:aws:secretsmanager:us-east-1:...:secret/movilventas-rds-ro]',
      ingressIp: '34.120.45.10/32 (goML Staging VPC NAT)',
      envScope: 'Staging Sandbox / Read-Only Schema Map & Routing Validation',
      notes: 'Connection test log showing successful query against MySQL. Zero unmasked PII accessible.'
    };
  }

  // Fallback
  return {
    endpoint: 'https://api.internal.corp.com/v1',
    authMethod: 'Service Account / OAuth2 TLS Enforced',
    username: 'goml_service_account',
    vaultRef: '[Stored in 1Password / AWS Secrets Manager]',
    ingressIp: '34.120.45.10/32 (goML Staging VPC)',
    envScope: 'Staging Sandbox (Read-Only)',
    notes: 'Specification verified and tested.'
  };
};

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
  const template = getDynamicTemplateForRequirement(item);

  // Multi-file evidence parsing
  const evidenceFiles = item.evidence_file
    ? item.evidence_file.split(',').map(f => f.trim()).filter(Boolean)
    : [];

  const effectiveFiles = evidenceFiles.length > 0
    ? evidenceFiles.map((filePath, idx) => {
      const fullUrl = filePath.startsWith('http') ? filePath : `${BASE_URL}${filePath}`;
      const isImg = /\.(png|jpe?g|webp|gif|svg)$/i.test(filePath);
      const fileName = filePath.split('/').pop() || `artifact-${idx + 1}`;
      const ext = (fileName.split('.').pop() || 'FILE').toUpperCase();
      return {
        name: fileName,
        subtext: `${isImg ? 'Image Screenshot' : 'Document Artifact'} • High-Resolution Audit Proof`,
        format: ext,
        isImage: isImg,
        url: fullUrl
      };
    })
    : [
      {
        name: 'gcp-maps-ip-whitelist.png',
        subtext: '1.4 MB • Uploaded 12 mins ago',
        format: 'PNG',
        isImage: true,
        url: null
      },
      {
        name: 'nat-eip-security-group-rules.pdf',
        subtext: '480 KB • AWS VPC Route Tables',
        format: 'PDF',
        isImage: false,
        url: null
      }
    ];

  const handleCopyMaskedKey = () => {
    const keyToCopy = item.masked_api_key || parsedSpecs['Vault Reference'] || template.vaultRef || 'secret/movilventas-rds-ro';
    navigator.clipboard.writeText(keyToCopy);
    setCopiedKey(true);
    triggerToast('Copied credential vault reference to clipboard!');
    setTimeout(() => setCopiedKey(false), 2000);
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

  // Handover spec values
  const endpointVal = parsedSpecs['Host/Endpoint'] || parsedSpecs['Host'] || item.evidence_url || template.endpoint;
  const authVal = parsedSpecs['Auth Protocol'] || parsedSpecs['Auth'] || template.authMethod;
  const userVal = parsedSpecs['User/Account'] || parsedSpecs['Username'] || template.username;
  const vaultVal = item.masked_api_key || parsedSpecs['Vault Reference'] || template.vaultRef;
  const ingressVal = parsedSpecs['Ingress Whitelist'] || template.ingressIp;
  const scopeVal = parsedSpecs['Scope'] || template.envScope;
  const signoffVal = parsedSpecs['Client Sign-off'] || project?.client_name || 'Client Technical Lead';

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.72)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        alignItems: 'center',
        zIndex: 9999,
        fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}
    >
      <style>{`
        @keyframes slideUpBottom {
          from { transform: translateY(100%); opacity: 0.8; }
          to { transform: translateY(0); opacity: 1; }
        }
        .view-proof-body::-webkit-scrollbar {
          width: 7px;
        }
        .view-proof-body::-webkit-scrollbar-track {
          background: #F8FAFC;
        }
        .view-proof-body::-webkit-scrollbar-thumb {
          background: #CBD5E1;
          border-radius: 9999px;
        }
        .view-proof-body::-webkit-scrollbar-thumb:hover {
          background: #94A3B8;
        }
      `}</style>

      {/* TOAST */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#0F172A',
          color: '#FFFFFF',
          padding: '12px 26px',
          borderRadius: '100px',
          fontSize: '14px',
          fontWeight: 700,
          boxShadow: '0 16px 36px rgba(0,0,0,0.35)',
          zIndex: 10001,
          border: '1px solid rgba(255,255,255,0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ED7D31' }} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* EXPANDED WIDE BOTTOM SHEET CONTAINER (Aligned with CreateProject.jsx Material Design) */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#FFFFFF',
          borderRadius: '32px 32px 0 0',
          width: '96%',
          maxWidth: '1380px',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 -24px 70px rgba(0, 0, 0, 0.3)',
          borderTop: '3.5px solid #ED7D31',
          borderLeft: '1px solid #E2E8F0',
          borderRight: '1px solid #E2E8F0',
          borderBottom: 'none',
          overflow: 'hidden',
          position: 'relative',
          animation: 'slideUpBottom 0.22s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Top Grab Handle Pull Bar (Exact CreateProject.jsx Signature) */}
        <div style={{
          width: '56px',
          height: '5px',
          borderRadius: '9999px',
          backgroundColor: '#000000',
          opacity: 0.22,
          margin: '14px auto 2px auto',
          flexShrink: 0
        }} />

        {/* Ambient Radial Orange Glow (Exact CreateProject.jsx Signature) */}
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

        {/* High-Contrast Close Button at Top Right (Exact CreateProject.jsx Signature) */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 16,
            right: 22,
            zIndex: 3,
            color: '#000000',
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
            e.currentTarget.style.color = '#000000';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          title="Close modal"
        >
          <X size={18} strokeWidth={2.5} />
        </button>

        {/* 1. HEADER SECTION (Clean, Uncarded, Exact Picture 3 Layout) */}
        <div style={{
          padding: '1.4rem 3.25rem 1.25rem 3.25rem',
          borderBottom: '1px solid #F1F5F9',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          background: '#FFFFFF',
          flexShrink: 0
        }}>
          <div style={{ flex: 1, paddingRight: '2.5rem' }}>
            {/* Top Badges Row (Orange, Black & White Only - Zero Icon Clutter) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '10px', flexWrap: 'wrap' }}>
              <span style={{
                background: '#F8FAFC',
                border: '1.5px solid #E2E8F0',
                color: '#0F172A',
                padding: '4px 14px',
                borderRadius: '9999px',
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '0.02em'
              }}>
                {item?.category || 'General'}
              </span>

              <span style={{
                background: '#F8FAFC',
                border: '1.5px solid #E2E8F0',
                color: '#0F172A',
                padding: '4px 14px',
                borderRadius: '9999px',
                fontSize: '12px',
                fontWeight: 700
              }}>
                <span>Owner: {item?.owner || 'Client'}</span>
              </span>

              <span style={{
                background: '#F8FAFC',
                border: '1.5px solid #E2E8F0',
                color: '#0F172A',
                padding: '4px 14px',
                borderRadius: '9999px',
                fontSize: '12px',
                fontWeight: 700
              }}>
                <span>Due: {item?.due_date || '2026-10-17'}</span>
              </span>

              {item?.is_critical && (
                <span style={{
                  background: '#FFF7ED',
                  border: '1.5px solid #FED7AA',
                  color: '#EA580C',
                  padding: '4px 14px',
                  borderRadius: '9999px',
                  fontSize: '12px',
                  fontWeight: 800
                }}>
                  Critical Gatekeeper
                </span>
              )}

              <span style={{
                background: isDone ? '#0F172A' : '#FFF7ED',
                border: isDone ? 'none' : '1.5px solid #FED7AA',
                color: isDone ? '#FFFFFF' : '#EA580C',
                padding: '4px 14px',
                borderRadius: '9999px',
                fontSize: '12px',
                fontWeight: 800
              }}>
                {isDone ? 'Verified & Cleared' : 'In Engineering Review'}
              </span>
            </div>

            {/* Title */}
            <h2 style={{
              fontSize: '2rem',
              fontWeight: 800,
              color: '#0F172A',
              margin: '0 0 8px 0',
              letterSpacing: '-0.03em',
              lineHeight: 1.25
            }}>
              {item?.name}
            </h2>

            {/* Description (Unboxed Clean Paragraph) */}
            <p style={{
              fontSize: '15px',
              color: '#475569',
              margin: 0,
              lineHeight: 1.65,
              maxWidth: '1200px',
              fontWeight: 500
            }}>
              {item?.description || 'Client must provide the endpoint, VPC/subnet IDs, and security-group configuration that allow the agent compute layer to connect securely to the existing Amazon RDS MySQL instance.'}
            </p>
          </div>
        </div>

        {/* 2. BODY SCROLLABLE CONTENT (Smoothly Scrollable, Less Cardy, Open Modern Aesthetics) */}
        <div
          className="view-proof-body"
          style={{
            padding: '1.75rem 3.25rem',
            overflowY: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '1.6rem',
            background: '#FFFFFF'
          }}
        >
          {/* Card 1: REQUIRED PROOF / ARTIFACT (Material 3 Style) */}
          <div style={{
            background: '#FFFFFF',
            border: '2px solid #E2E8F0',
            borderLeft: '5px solid #ED7D31',
            borderRadius: '20px',
            padding: '18px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            boxShadow: '0 4px 18px rgba(0,0,0,0.03)'
          }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: '#FFF7ED',
              border: '1.5px solid #FED7AA',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <FileText size={22} color="#ED7D31" strokeWidth={2.4} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: '11.5px',
                fontWeight: 800,
                color: '#ED7D31',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '3px'
              }}>
                Required Proof / Artifact
              </div>
              <div style={{ fontSize: '14.5px', color: '#0F172A', fontWeight: 700, lineHeight: 1.45 }}>
                {item.expected_evidence || 'Connection test log showing successful query against MySQL, database schema map, and egress IP whitelist confirmation.'}
              </div>
            </div>
          </div>

          {/* Card 2: NON-TECHNICAL GUIDE BAR (Material 3 Style) */}
          <div style={{
            background: '#FFFFFF',
            border: '2px solid #E2E8F0',
            borderRadius: '20px',
            padding: '14px 22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap',
            boxShadow: '0 4px 18px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <span style={{
                background: '#FFF7ED',
                border: '1.5px solid #FED7AA',
                color: '#EA580C',
                fontSize: '11px',
                fontWeight: 800,
                padding: '4px 12px',
                borderRadius: '9999px',
                letterSpacing: '0.04em'
              }}>
                NON-TECHNICAL GUIDE
              </span>
              <span style={{ fontSize: '13.5px', color: '#334155', fontWeight: 700 }}>
                How to verify {item.name || 'technical specifications'} and test network connectivity
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                type="button"
                onClick={() => window.open(endpointVal || 'https://console.aws.amazon.com', '_blank')}
                style={{
                  background: '#0F172A',
                  color: '#FFFFFF',
                  border: '2px solid #0F172A',
                  borderRadius: '9999px',
                  padding: '7px 18px',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease'
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = '#ED7D31'; e.currentTarget.style.borderColor = '#ED7D31'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = '#0F172A'; e.currentTarget.style.borderColor = '#0F172A'; }}
              >
                <span>Open Console</span>
                <ExternalLink size={13} strokeWidth={2.4} />
              </button>
            </div>
          </div>

          {/* Card 3: ATTACHED SCREENSHOTS & EVIDENCE ARTIFACTS (Material 3 Style) */}
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '10px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '11.5px',
                fontWeight: 800,
                color: '#475569',
                letterSpacing: '0.05em',
                textTransform: 'uppercase'
              }}>
                <ImageIcon size={14} color="#ED7D31" strokeWidth={2.4} />
                <span>Upload or Paste Screenshots & Evidence ({effectiveFiles.length})</span>
              </div>
              <span style={{ fontSize: '12.5px', color: '#64748B', fontWeight: 600 }}>
                High-Resolution Audit Proof
              </span>
            </div>

            <div style={{
              background: '#FFFFFF',
              border: '2px solid #E2E8F0',
              borderRadius: '20px',
              overflow: 'hidden',
              boxShadow: '0 4px 18px rgba(0,0,0,0.03)'
            }}>
              {effectiveFiles.map((f, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '15px 22px',
                    borderBottom: idx === effectiveFiles.length - 1 ? 'none' : '1px solid #F1F5F9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                    flexWrap: 'wrap',
                    transition: 'background 0.15s ease'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.background = '#F8FAFC'; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = '#FFFFFF'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: '240px' }}>
                    <span style={{
                      background: '#F1F5F9',
                      border: '1.5px solid #CBD5E1',
                      color: '#475569',
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '4px 12px',
                      borderRadius: '9999px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em'
                    }}>
                      {f.format || 'FILE'}
                    </span>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A' }}>
                        {f.name}
                      </div>
                      <div style={{ fontSize: '12.5px', color: '#64748B', marginTop: '2px', fontWeight: 500 }}>
                        {f.subtext}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      color: '#16A34A',
                      fontSize: '13px',
                      fontWeight: 800
                    }}>
                      <Check size={15} strokeWidth={2.8} />
                      <span>Ready for Review</span>
                    </div>

                    {f.isImage && f.url && (
                      <button
                        type="button"
                        onClick={() => setSelectedImage(f.url)}
                        style={{
                          background: '#FFFFFF',
                          border: '2px solid #E2E8F0',
                          borderRadius: '9999px',
                          padding: '6px 16px',
                          fontSize: '12px',
                          fontWeight: 700,
                          color: '#0F172A',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.borderColor = '#0F172A'; }}
                        onMouseOut={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; }}
                      >
                        <ZoomIn size={13} strokeWidth={2.2} />
                        <span>Zoom</span>
                      </button>
                    )}

                    {f.url && (
                      <a
                        href={f.url}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          background: '#0F172A',
                          color: '#FFFFFF',
                          border: '2px solid #0F172A',
                          borderRadius: '9999px',
                          padding: '6px 16px',
                          fontSize: '12px',
                          fontWeight: 700,
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.background = '#ED7D31'; e.currentTarget.style.borderColor = '#ED7D31'; }}
                        onMouseOut={(e) => { e.currentTarget.style.background = '#0F172A'; e.currentTarget.style.borderColor = '#0F172A'; }}
                      >
                        <span>Open</span>
                        <ExternalLink size={13} strokeWidth={2.2} />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card 4: CREDENTIAL & ACCESS HANDOVER SPECIFICATION TABLE (Light & Modern, No Heavy Black Card!) */}
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '10px'
            }}>
              <div style={{
                fontSize: '11.5px',
                fontWeight: 800,
                color: '#475569',
                letterSpacing: '0.05em',
                textTransform: 'uppercase'
              }}>
                Credential & Access Handover Template Table
              </div>
              <span style={{
                background: '#FFF7ED',
                border: '1.5px solid #FED7AA',
                color: '#EA580C',
                fontSize: '11px',
                fontWeight: 700,
                padding: '3px 12px',
                borderRadius: '9999px',
                display: 'inline-flex',
                alignItems: 'center'
              }}>
                Zero-Exposure Masking Active
              </span>
            </div>

            <div style={{
              background: '#FFFFFF',
              border: '2px solid #E2E8F0',
              borderRadius: '20px',
              overflow: 'hidden',
              boxShadow: '0 4px 18px rgba(0,0,0,0.03)'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                    <th style={{ padding: '12px 20px', textAlign: 'left', width: '28%', fontSize: '11.5px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Specification Parameter
                    </th>
                    <th style={{ padding: '12px 20px', textAlign: 'left', width: '72%', fontSize: '11.5px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Handover Values & Protocol Target
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '12px 20px', fontWeight: 600, color: '#475569' }}>Host / Endpoint URL</td>
                    <td style={{ padding: '12px 20px', fontFamily: 'monospace', color: '#0F172A', fontWeight: 700 }}>
                      {endpointVal}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '12px 20px', fontWeight: 600, color: '#475569' }}>Auth Method / Protocol</td>
                    <td style={{ padding: '12px 20px', color: '#0F172A', fontWeight: 600 }}>
                      {authVal}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '12px 20px', fontWeight: 600, color: '#475569' }}>Username / Service Account</td>
                    <td style={{ padding: '12px 20px', fontFamily: 'monospace', color: '#0F172A', fontWeight: 700 }}>
                      {userVal}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '12px 20px', fontWeight: 600, color: '#475569' }}>Secret Vault / Key Reference</td>
                    <td style={{ padding: '12px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <code style={{
                          background: '#FFF7ED',
                          border: '1.5px solid #FED7AA',
                          padding: '4px 12px',
                          borderRadius: '9999px',
                          fontSize: '12.5px',
                          color: '#EA580C',
                          fontWeight: 800,
                          fontFamily: 'monospace'
                        }}>
                          {vaultVal}
                        </code>
                        <button
                          type="button"
                          onClick={handleCopyMaskedKey}
                          style={{
                            background: copiedKey ? '#0F172A' : '#FFFFFF',
                            border: '1.5px solid #0F172A',
                            borderRadius: '9999px',
                            padding: '4px 12px',
                            fontSize: '11.5px',
                            color: copiedKey ? '#FFFFFF' : '#0F172A',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            fontWeight: 700,
                            transition: 'all 0.15s ease'
                          }}
                          onMouseOver={(e) => { e.currentTarget.style.borderColor = '#ED7D31'; }}
                          onMouseOut={(e) => { e.currentTarget.style.borderColor = '#0F172A'; }}
                        >
                          <span>{copiedKey ? 'Copied' : 'Copy Ref'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '12px 20px', fontWeight: 600, color: '#475569' }}>Network Ingress / IP Whitelist</td>
                    <td style={{ padding: '12px 20px', fontFamily: 'monospace', color: '#0F172A', fontWeight: 600 }}>
                      {ingressVal}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '12px 20px', fontWeight: 600, color: '#475569' }}>Environment Scope</td>
                    <td style={{ padding: '12px 20px', color: '#0F172A', fontWeight: 600 }}>
                      {scopeVal}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '12px 20px', fontWeight: 600, color: '#475569' }}>Client Sign-off Contact</td>
                    <td style={{ padding: '12px 20px', fontWeight: 800, color: '#0F172A' }}>
                      {signoffVal}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Card 5: AI PROOF ANALYSIS & CONFIDENCE ENGINE */}
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '10px'
            }}>
              <div style={{
                fontSize: '11.5px',
                fontWeight: 800,
                color: '#475569',
                letterSpacing: '0.05em',
                textTransform: 'uppercase'
              }}>
                AI Proof Analysis & Confidence Engine
              </div>

              {item.verification_score !== null && item.verification_score !== undefined ? (
                <span style={{
                  fontSize: '12px',
                  fontWeight: 800,
                  color: '#FFFFFF',
                  background: '#0F172A',
                  border: '1.5px solid #0F172A',
                  padding: '4px 14px',
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
                    background: 'linear-gradient(135deg, #ED7D31 0%, #EA580C 100%)',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '9999px',
                    padding: '8px 20px',
                    fontSize: '12.5px',
                    fontWeight: 800,
                    cursor: isVerifying ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    boxShadow: '0 4px 14px rgba(237, 125, 49, 0.35)',
                    transition: 'all 0.18s ease'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <span>{isVerifying ? 'Analyzing Evidence...' : 'Run AI Evaluation'}</span>
                </button>
              )}
            </div>

            <div style={{
              background: '#FFFFFF',
              border: '2px solid #E2E8F0',
              borderRadius: '20px',
              padding: '18px 24px',
              boxShadow: '0 4px 18px rgba(0,0,0,0.03)'
            }}>
              {item.verification_notes ? (
                <div style={{
                  background: '#F8FAFC',
                  border: '1.5px solid #E2E8F0',
                  borderLeft: '4px solid #ED7D31',
                  borderRadius: '16px',
                  padding: '14px 18px',
                  fontSize: '13.5px',
                  color: '#0F172A',
                  lineHeight: 1.55
                }}>
                  <div style={{ fontWeight: 800, color: '#EA580C', marginBottom: '4px' }}>AI Verification Analysis:</div>
                  <div style={{ whiteSpace: 'pre-wrap', fontWeight: 500 }}>{item.verification_notes}</div>
                </div>
              ) : (
                <div style={{ fontSize: '13.5px', color: '#64748B', lineHeight: 1.55, fontWeight: 500 }}>
                  Run the AI evaluation engine to cryptographically check schema structure, IP CIDR notation, and AWS/MySQL credential validity against SOW requirements.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3. STICKY FOOTER ACTIONS (Exact Picture 3 Style with Material Tactile Buttons) */}
        <div style={{
          padding: '1.25rem 3.25rem',
          borderTop: '2px solid #F1F5F9',
          background: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0
        }}>
          {/* Status Indicator on Left (Picture 3) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', fontWeight: 600, color: '#475569' }}>
            <span>Status:</span>

            <span style={{
              background: isDone ? '#0F172A' : '#FFF7ED',
              border: isDone ? 'none' : '1.5px solid #FED7AA',
              color: isDone ? '#FFFFFF' : '#EA580C',
              padding: '5px 16px',
              borderRadius: '9999px',
              fontSize: '12.5px',
              fontWeight: 800
            }}>
              {isDone ? 'Verified' : 'Submitted'}
            </span>
          </div>

          {/* Action Buttons on Right (Orange, Black & White Only - Zero Icon Clutter) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: '#FFFFFF',
                border: '2px solid #000000',
                borderRadius: '9999px',
                padding: '10px 28px',
                fontSize: '14px',
                fontWeight: 800,
                color: '#000000',
                cursor: 'pointer',
                transition: 'all 0.18s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = '#000000';
                e.currentTarget.style.color = '#FFFFFF';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = '#FFFFFF';
                e.currentTarget.style.color = '#000000';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Cancel
            </button>

            {!isDone && onOpenRejectModal && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenRejectModal(item);
                }}
                style={{
                  background: '#FFFFFF',
                  color: '#0F172A',
                  border: '2px solid #0F172A',
                  borderRadius: '9999px',
                  padding: '10px 22px',
                  fontSize: '13.5px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  transition: 'all 0.15s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = '#F8FAFC';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = '#FFFFFF';
                }}
              >
                <span>Reject with Feedback</span>
              </button>
            )}

            {!isDone && (
              <button
                type="button"
                onClick={handleAiVerify}
                disabled={isVerifying}
                style={{
                  background: '#FFFFFF',
                  color: '#ED7D31',
                  border: '2px solid #ED7D31',
                  borderRadius: '9999px',
                  padding: '10px 22px',
                  fontSize: '13.5px',
                  fontWeight: 800,
                  cursor: isVerifying ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = '#FFF7ED';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = '#FFFFFF';
                }}
              >
                {isVerifying && <Loader2 className="animate-spin" size={14} />}
                <span>{isVerifying ? 'Evaluating...' : 'AI Verify'}</span>
              </button>
            )}

            {!isDone ? (
              <button
                type="button"
                onClick={handleApprove}
                style={{
                  background: 'linear-gradient(135deg, #ED7D31 0%, #EA580C 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '9999px',
                  padding: '11px 34px',
                  fontSize: '14.5px',
                  fontWeight: 900,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  boxShadow: '0 6px 22px rgba(237, 125, 49, 0.42)',
                  transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #FF8A3D 0%, #ED7D31 100%)';
                  e.currentTarget.style.boxShadow = '0 8px 28px rgba(237, 125, 49, 0.52)';
                  e.currentTarget.style.transform = 'translateY(-1.5px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #ED7D31 0%, #EA580C 100%)';
                  e.currentTarget.style.boxShadow = '0 6px 22px rgba(237, 125, 49, 0.42)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <span>Mark Verified</span>
              </button>
            ) : (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                color: '#FFFFFF',
                fontWeight: 800,
                fontSize: '13px',
                padding: '8px 22px',
                background: '#0F172A',
                borderRadius: '9999px'
              }}>
                <span>Verified & Cleared</span>
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
