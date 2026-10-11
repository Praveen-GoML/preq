import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  X, CheckCircle, Loader2, Copy, Check, Upload, 
  FileText, Send, Save, Plus, Trash2, Zap, ExternalLink, 
  User, Clock, Image as ImageIcon, Share2, HelpCircle,
  ShieldCheck, ArrowUpRight, Star, AlertCircle, Sparkles
} from 'lucide-react';
import { getCredentialGuidance } from '../utils/credentialGuide';
import { API_URL } from '../apiConfig';

// Slack Vector Logo
const SlackLogo = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" fill="#ED7D31"/>
  </svg>
);

// Teams Vector Logo
const TeamsLogo = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19.5 7.5A2.25 2.25 0 1 0 19.5 3a2.25 2.25 0 0 0 0 4.5zM22.5 9h-6a1.5 1.5 0 0 0-1.5 1.5v4.5A4.5 4.5 0 0 0 19.5 19.5h3v-9a1.5 1.5 0 0 0-1.5-1.5z" fill="#464EB8"/>
    <path d="M13.5 6A3 3 0 1 0 13.5 0a3 3 0 0 0 0 6zM17.25 8.25h-7.5A2.25 2.25 0 0 0 7.5 10.5v6.75A5.25 5.25 0 0 0 12.75 22.5h4.5v-12a2.25 2.25 0 0 0-2.25-2.25z" fill="#5B63D3"/>
  </svg>
);

// Native Slack mrkdwn Format
const generateSlackGrid = (item, values, notes) => {
  if (!item) return '';
  return `*[PreQ Credential & Handover Specification — ${item.name}]*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• *Requirement:* *${item.name}* (\`${item.category}\`)
• *Host / Endpoint URL:* \`${values.endpoint || 'https://api.internal.corp.com'}\`
• *Auth Method / Protocol:* ${values.authMethod || 'Service Account / OAuth2'}
• *Username / Account ID:* \`${values.username || 'goml_svc_reader'}\`
• *Secret Key / Vault Ref:* *${values.vaultRef || '[Stored in 1Password / AWS Secrets Manager]'}*
• *Network Ingress / IP:* \`${values.ingressIp || '34.120.45.10/32 (goML Staging VPC)'}\`
• *Environment & Scope:* ${values.envScope || 'Staging Sandbox / Read-Only Audit'}
• *Signed off by:* *${values.signoff || 'Client Technical Lead'}*
• *Verification Notes:* ${notes || 'Readiness checks verified and ready for Day-1 kick-off.'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
*Action:* Handover specifications verified and dispatched to *goML Engineering* for Day-1 clearance.`;
};

// Microsoft Teams Rich HTML Format
const generateTeamsTable = (item, values, notes) => {
  if (!item) return '';
  return `<div style="font-family: 'Segoe UI', Inter, -apple-system, sans-serif; color: #111827; line-height: 1.5;">
<p style="margin: 0 0 8px 0; font-size: 14px;"><strong>[PreQ Handover] Credential & Delivery Specification — ${item.name}</strong></p>
<table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%; border: 1.5px solid #ED7D31; font-size: 13px;">
  <thead>
    <tr style="background-color: #ED7D31; color: #ffffff; text-align: left;">
      <th style="padding: 9px 12px; width: 32%;">SPECIFICATION FIELD</th>
      <th style="padding: 9px 12px; width: 68%;">DETAILS / CREDENTIAL TEMPLATE</th>
    </tr>
  </thead>
  <tbody>
    <tr><td style="padding: 7px 12px; font-weight: 700; background: #FFF9F5;">Milestone / Requirement</td><td style="padding: 7px 12px;"><strong>${item.name}</strong> (${item.category})</td></tr>
    <tr><td style="padding: 7px 12px; font-weight: 700; background: #FFF9F5;">Host / Endpoint URL</td><td style="padding: 7px 12px; font-family: monospace; color: #1E293B;">${values.endpoint || 'https://api.internal.corp.com'}</td></tr>
    <tr><td style="padding: 7px 12px; font-weight: 700; background: #FFF9F5;">Auth Method / Protocol</td><td style="padding: 7px 12px;">${values.authMethod || 'Service Account / OAuth2'}</td></tr>
    <tr><td style="padding: 7px 12px; font-weight: 700; background: #FFF9F5;">Username / Service Account ID</td><td style="padding: 7px 12px; font-family: monospace; color: #0F172A;">${values.username || 'goml_service_account'}</td></tr>
    <tr><td style="padding: 7px 12px; font-weight: 700; background: #FFF9F5;">Secret / Vault Reference</td><td style="padding: 7px 12px; font-weight: 700; color: #ED7D31;">${values.vaultRef || '[Secure Vault: AWS Secrets Manager / 1Password]'}</td></tr>
    <tr><td style="padding: 7px 12px; font-weight: 700; background: #FFF9F5;">Ingress IP / Network Whitelist</td><td style="padding: 7px 12px;">${values.ingressIp || '34.120.45.10/32 (goML Staging VPC)'}</td></tr>
    <tr><td style="padding: 7px 12px; font-weight: 700; background: #FFF9F5;">Environment & Scope</td><td style="padding: 7px 12px;">${values.envScope || 'Staging Sandbox / Read-Only Audit'}</td></tr>
    <tr><td style="padding: 7px 12px; font-weight: 700; background: #FFF9F5;">Client Sign-off Contact</td><td style="padding: 7px 12px;"><strong>${values.signoff || 'Client Technical Lead'}</strong></td></tr>
    <tr><td style="padding: 7px 12px; font-weight: 700; background: #FFF9F5;">Verification Notes</td><td style="padding: 7px 12px;">${notes || 'Handover specifications verified.'}</td></tr>
  </tbody>
</table>
</div>`;
};

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
      endpoint: 'mysql://db-staging.internal.movilventas.net:3306/movilventas_pilot',
      authMethod: 'Read-Only Database User + TLS/SSL Enforced',
      username: 'goml_data_reader_ro',
      vaultRef: '[AWS Secrets Manager: arn:aws:secretsmanager:...:secret:goml-db-ro]',
      ingressIp: '34.120.45.10/32 (goML Staging VPC Peering)',
      envScope: 'Staging Sandbox / Read-Only Schema Map & Routing Validation',
      notes: 'Pre-built SQL inspection query library validated against schema. Verified no unmasked production PII is accessible.'
    };
  }

  // Fallback
  return {
    endpoint: 'https://api.internal.corp.com/v1',
    authMethod: 'API Token / OAuth2 Bearer Token',
    username: 'goml_service_account',
    vaultRef: '[Stored in 1Password / AWS Secrets Manager]',
    ingressIp: '34.120.45.10/32 (goML Staging VPC)',
    envScope: 'Staging Sandbox (Read-Only)',
    notes: 'Specification verified and tested.'
  };
};

export const SubmitEvidenceModal = ({ isOpen = true, item, project, onClose, onUpdated, onSubmitted }) => {
  if (!isOpen || !item) return null;

  const [evidenceNotes, setEvidenceNotes] = useState(item?.evidence_notes || '');
  const [savingItem, setSavingItem] = useState(false);
  const [error, setError] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // Structured Handover Table values
  const [endpoint, setEndpoint] = useState('');
  const [authMethod, setAuthMethod] = useState('');
  const [username, setUsername] = useState('');
  const [vaultRef, setVaultRef] = useState('');
  const [ingressIp, setIngressIp] = useState('');
  const [envScope, setEnvScope] = useState('');
  const [signoffBy, setSignoffBy] = useState(project?.client_name || 'Client Technical Lead');
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  // Attached files & previews state (includes default high-fidelity demonstration files matching screenshot)
  const [filePreviews, setFilePreviews] = useState([
    {
      name: 'gcp-maps-ip-whitelist.png',
      size: 1468006,
      subtext: '1.4 MB • Uploaded 12 mins ago',
      isImage: true,
      readyForReview: true
    },
    {
      name: 'nat-eip-security-group-rules.pdf',
      size: 491520,
      subtext: '480 KB • AWS VPC Route Tables',
      isImage: false,
      readyForReview: false
    }
  ]);

  const [showCredGuide, setShowCredGuide] = useState(false);
  const [credGuide, setCredGuide] = useState(null);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Populate dynamic template on mount or item change
  useEffect(() => {
    if (item) {
      const guide = getCredentialGuidance(item);
      setCredGuide(guide);

      const template = getDynamicTemplateForRequirement(item);
      setEndpoint(template.endpoint || '');
      setAuthMethod(template.authMethod || '');
      setUsername(template.username || '');
      setVaultRef(template.vaultRef || '');
      setIngressIp(template.ingressIp || '');
      setEnvScope(template.envScope || '');
      if (template.notes) {
        setEvidenceNotes(template.notes);
      }
    }
  }, [item?.id, item?.name]);

  // Handle file select
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    files.forEach(file => {
      const isImg = file.type.startsWith('image/');
      const newFile = {
        name: file.name,
        size: file.size,
        subtext: `${(file.size / 1024).toFixed(1)} KB • Uploaded just now`,
        isImage: isImg,
        url: isImg ? URL.createObjectURL(file) : null,
        rawFile: file,
        readyForReview: true
      };
      setFilePreviews(prev => [...prev, newFile]);
    });
    triggerToast(`Attached ${files.length} evidence file(s)!`);
  };

  // Handle global paste (Ctrl + V)
  useEffect(() => {
    const handleGlobalPaste = (e) => {
      const clipboardData = e.clipboardData;
      if (!clipboardData || !clipboardData.items) return;

      for (let i = 0; i < clipboardData.items.length; i++) {
        const itemObj = clipboardData.items[i];
        if (itemObj.type.indexOf('image') !== -1) {
          const blob = itemObj.getAsFile();
          if (blob) {
            const url = URL.createObjectURL(blob);
            const pastedFile = {
              name: `pasted-screenshot-${Date.now().toString().slice(-4)}.png`,
              size: blob.size,
              subtext: `${(blob.size / 1024).toFixed(1)} KB • Pasted Screenshot`,
              isImage: true,
              url,
              rawBlob: blob,
              readyForReview: true
            };
            setFilePreviews(prev => [...prev, pastedFile]);
            triggerToast('Pasted screenshot attached directly to evidence!');
          }
        }
      }
    };

    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, []);

  const handleRemoveFile = (idx) => {
    setFilePreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const handleShareToTeams = async () => {
    const tableHtml = generateTeamsTable(item, {
      endpoint,
      authMethod,
      username,
      vaultRef,
      ingressIp,
      envScope,
      signoff: signoffBy
    }, evidenceNotes);
    
    try {
      if (navigator.clipboard && window.ClipboardItem) {
        const blob = new Blob([tableHtml], { type: 'text/html' });
        const textBlob = new Blob([tableHtml.replace(/<[^>]*>?/gm, '')], { type: 'text/plain' });
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/html': blob,
            'text/plain': textBlob
          })
        ]);
      } else {
        await navigator.clipboard.writeText(tableHtml);
      }
      triggerToast('Copied rich HTML table! Opening Microsoft Teams...');
      setTimeout(() => {
        window.open('https://teams.microsoft.com', '_blank');
      }, 700);
    } catch (e) {
      navigator.clipboard.writeText(tableHtml);
      triggerToast('Copied formatted handover table to clipboard!');
    }
  };

  const handleShareToSlack = async () => {
    const slackGrid = generateSlackGrid(item, {
      endpoint,
      authMethod,
      username,
      vaultRef,
      ingressIp,
      envScope,
      signoff: signoffBy
    }, evidenceNotes);

    try {
      await navigator.clipboard.writeText(slackGrid);
      triggerToast('Copied formatted mrkdwn grid! Opening Slack...');
      setTimeout(() => {
        window.open('slack://open', '_blank');
      }, 700);
    } catch (e) {
      triggerToast('Copied Slack grid to clipboard!');
    }
  };

  const handleShareViaEmail = () => {
    const subject = encodeURIComponent(`[goML PreQ Handover] ${item?.name || 'Requirement'} - Handover Specification`);
    const body = encodeURIComponent(`PreQ Credential & Handover Specification

Requirement: ${item?.name} (${item?.category || 'Environment'})
Host / Endpoint: ${endpoint}
Auth Method: ${authMethod}
Username / Account: ${username}
Secret / Vault Ref: ${vaultRef}
Network Ingress / IP: ${ingressIp}
Environment Scope: ${envScope}
Client Sign-off: ${signoffBy}
Notes: ${evidenceNotes}

Verified and submitted via goML PreQ Portal.`);
    window.open(`mailto:engineering-onboarding@goml.io?subject=${subject}&body=${body}`, '_blank');
    triggerToast('Opening default email client with handover specs...');
  };

  const handleRegenerateWithAI = () => {
    setIsAiGenerating(true);
    setTimeout(() => {
      const template = getDynamicTemplateForRequirement(item);
      setEndpoint(template.endpoint || '');
      setAuthMethod(template.authMethod || '');
      setUsername(template.username || '');
      setVaultRef(template.vaultRef || '');
      setIngressIp(template.ingressIp || '');
      setEnvScope(template.envScope || '');
      if (template.notes) setEvidenceNotes(template.notes);
      setIsAiGenerating(false);
      triggerToast('AI generated optimal handover specifications!');
    }, 600);
  };

  // Save changes & transition status
  const handleSaveAndSync = async (targetStatus) => {
    setSavingItem(true);
    setError('');
    try {
      if (item?.id) {
        // 1. Build combined handover notes
        const combinedNotes = [
          endpoint ? `Host/Endpoint: ${endpoint}` : '',
          authMethod ? `Auth Protocol: ${authMethod}` : '',
          username ? `User/Account: ${username}` : '',
          vaultRef ? `Vault Reference: ${vaultRef}` : '',
          ingressIp ? `Ingress Whitelist: ${ingressIp}` : '',
          envScope ? `Scope: ${envScope}` : '',
          signoffBy ? `Client Sign-off: ${signoffBy}` : '',
          evidenceNotes ? `Notes:\n${evidenceNotes}` : ''
        ].filter(Boolean).join('\n');

        // 2. Check if we have files/blobs to upload
        const rawFiles = filePreviews.map(fp => fp.rawFile || fp.rawBlob).filter(Boolean);

        if (rawFiles.length > 0) {
          const formData = new FormData();
          rawFiles.forEach((rf, i) => {
            if (rf instanceof File) {
              formData.append('files', rf);
            } else if (rf instanceof Blob) {
              const filename = `screenshot-${Date.now().toString().slice(-4)}-${i}.png`;
              formData.append('files', rf, filename);
            }
          });
          if (combinedNotes) formData.append('evidence_notes', combinedNotes);
          if (vaultRef) {
            formData.append('api_key_name', 'SECRET_VAULT_REF');
            formData.append('api_key_value', vaultRef);
          }
          if (targetStatus) {
            formData.append('status', targetStatus);
          }

          // Let axios set Content-Type header with multipart boundary automatically
          await axios.post(`${API_URL}/items/${item.id}/submit-evidence`, formData);
        } else {
          // Standard PUT update
          await axios.put(`${API_URL}/items/${item.id}`, {
            status: targetStatus,
            evidence_notes: combinedNotes || evidenceNotes,
            api_key_name: vaultRef ? 'SECRET_VAULT_REF' : undefined,
            api_key_value: vaultRef ? vaultRef : undefined
          });
        }

        if (targetStatus === 'Verified') {
          await axios.post(`${API_URL}/items/${item.id}/verify`);
        }
      }

      triggerToast(`Milestone updated to "${targetStatus}"!`);
      if (onUpdated) onUpdated();
      if (onSubmitted) onSubmitted();
      onClose();
    } catch (err) {
      console.error('Error saving evidence:', err);
      const errMsg = err.response?.data?.detail || err.message || 'Error submitting evidence';
      setError(errMsg);
      triggerToast(`Error: ${errMsg}`);
    } finally {
      setSavingItem(false);
    }
  };

  const expectedArtifact = item?.expected_evidence || 'Security-group rule list showing NAT EIP CIDR and Google Cloud console whitelist screenshot';

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
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#0F172A',
          color: '#ffffff',
          padding: '12px 26px',
          borderRadius: '100px',
          fontSize: '14px',
          fontWeight: 700,
          boxShadow: '0 16px 36px rgba(0,0,0,0.35)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          border: '1px solid rgba(255,255,255,0.15)',
          fontFamily: '"Plus Jakarta Sans", sans-serif'
        }}>
          <CheckCircle size={18} color="#10B981" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* EXPANDED BOTTOM SHEET DRAWER CONTAINER (1380px) */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#FFFFFF',
          borderRadius: '28px 28px 0 0',
          width: '96%',
          maxWidth: '1380px',
          maxHeight: '95vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 -16px 56px rgba(15, 23, 42, 0.32)',
          border: '1px solid #E2E8F0',
          borderBottom: 'none',
          overflow: 'hidden',
          animation: 'slideUpBottom 0.22s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        <style>{`
          @keyframes slideUpBottom {
            from { transform: translateY(100%); opacity: 0.8; }
            to { transform: translateY(0); opacity: 1; }
          }
          .goml-modal-input:focus {
            outline: none !important;
            border-color: #ED7D31 !important;
            box-shadow: 0 0 0 3px rgba(237, 125, 49, 0.14) !important;
            background-color: #FFFFFF !important;
          }
        `}</style>

        {/* Grab Handle Bar */}
        <div style={{
          width: '64px',
          height: '5px',
          background: '#CBD5E1',
          borderRadius: '9999px',
          margin: '14px auto 4px auto',
          flexShrink: 0
        }} />

        {/* 1. HEADER SECTION */}
        <div style={{
          padding: '1.6rem 3.25rem 1.35rem 3.25rem',
          borderBottom: '1px solid #F1F5F9',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          background: '#FFFFFF',
          flexShrink: 0
        }}>
          <div style={{ flex: 1, paddingRight: '2.5rem' }}>
            {/* Top Badges Row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '10px', flexWrap: 'wrap' }}>
              <span style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                color: '#334155',
                padding: '4px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '0.02em',
                fontFamily: '"Plus Jakarta Sans", sans-serif'
              }}>
                {item?.category || 'Environment'}
              </span>

              <span style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                color: '#334155',
                padding: '4px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                fontFamily: '"Plus Jakarta Sans", sans-serif'
              }}>
                <User size={14} color="#64748B" />
                <span>{item?.owner || 'Security & Compliance Lead'}</span>
              </span>

              <span style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                color: '#334155',
                padding: '4px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                fontFamily: '"Plus Jakarta Sans", sans-serif'
              }}>
                <Clock size={14} color="#64748B" />
                <span>Due {item?.due_date || '2026-10-17'}</span>
              </span>

              <span style={{
                background: '#FFF5EE',
                border: '1px solid #FFD8BF',
                color: '#EA580C',
                padding: '4px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                fontFamily: '"Plus Jakarta Sans", sans-serif'
              }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#EA580C' }} />
                <span>Critical Gatekeeper</span>
              </span>
            </div>

            {/* Title */}
            <h2 style={{
              fontSize: '1.95rem',
              fontWeight: 800,
              color: '#0F172A',
              margin: '0 0 8px 0',
              letterSpacing: '-0.03em',
              lineHeight: 1.25,
              fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif'
            }}>
              {item?.name || 'Requirement Item'}
            </h2>

            {/* Description */}
            <p style={{
              fontSize: '14.5px',
              color: '#475569',
              margin: 0,
              lineHeight: 1.65,
              maxWidth: '1200px',
              fontFamily: '"Plus Jakarta Sans", sans-serif',
              fontWeight: 450
            }}>
              {item?.description || 'Google Maps API calls must originate from approved egress IPs; the NAT gateway EIP must be added to the Google Cloud API key restrictions.'}
            </p>
          </div>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '50%',
              width: '38px',
              height: '38px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#64748B',
              flexShrink: 0,
              transition: 'all 0.15s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = '#F1F5F9'}
            onMouseOut={(e) => e.currentTarget.style.background = '#F8FAFC'}
          >
            <X size={19} />
          </button>
        </div>

        {/* 2. BODY SCROLLABLE CONTENT */}
        <div style={{
          padding: '1.75rem 3.25rem',
          overflowY: 'auto',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '1.6rem'
        }}>
          {/* Card 1: REQUIRED PROOF / ARTIFACT */}
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderLeft: '4.5px solid #EA580C',
            borderRadius: '12px',
            padding: '16px 22px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
          }}>
            <FileText size={22} color="#0F172A" style={{ flexShrink: 0 }} />
            <div>
              <div style={{
                fontSize: '11px',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: '#EA580C',
                marginBottom: '3px',
                fontFamily: '"Plus Jakarta Sans", sans-serif'
              }}>
                REQUIRED PROOF / ARTIFACT
              </div>
              <div style={{
                fontSize: '14px',
                fontWeight: 600,
                color: '#0F172A',
                lineHeight: 1.5,
                fontFamily: '"Plus Jakarta Sans", sans-serif'
              }}>
                {expectedArtifact}
              </div>
            </div>
          </div>

          {/* Card 2: NON-TECHNICAL GUIDE CARD */}
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            padding: '16px 22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{
                background: '#FFF7ED',
                border: '1px solid #FF5C00',
                color: '#FF5C00',
                fontSize: '11px',
                fontWeight: 800,
                padding: '4px 12px',
                borderRadius: '6px',
                letterSpacing: '0.04em',
                fontFamily: '"Plus Jakarta Sans", sans-serif'
              }}>
                NON-TECHNICAL GUIDE
              </span>
              <span style={{
                fontSize: '14px',
                fontWeight: 700,
                color: '#0F172A',
                fontFamily: '"Plus Jakarta Sans", sans-serif'
              }}>
                How to get Google Cloud Platform (Maps Platform API)
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <a
                href="https://console.cloud.google.com/google/maps-apis"
                target="_blank"
                rel="noreferrer"
                style={{
                  background: '#0F172A',
                  color: '#FFFFFF',
                  borderRadius: '8px',
                  padding: '8px 18px',
                  fontSize: '13px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  textDecoration: 'none',
                  fontFamily: '"Plus Jakarta Sans", sans-serif',
                  transition: 'background 0.15s ease'
                }}
              >
                <span>Open Console</span>
                <ExternalLink size={14} color="#FFFFFF" />
              </a>

              <button
                type="button"
                onClick={() => setShowCredGuide(!showCredGuide)}
                style={{
                  background: '#FFFFFF',
                  border: '1.5px solid #E2E8F0',
                  borderRadius: '8px',
                  padding: '8px 18px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#0F172A',
                  cursor: 'pointer',
                  fontFamily: '"Plus Jakarta Sans", sans-serif',
                  transition: 'all 0.15s ease'
                }}
              >
                {showCredGuide ? 'Hide Instructions' : 'View Step-by-Step Instructions (3 min)'}
              </button>
            </div>
          </div>

          {/* Collapsible Step-by-Step Instructions */}
          {showCredGuide && (
            <div style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              padding: '18px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              fontFamily: '"Plus Jakarta Sans", sans-serif'
            }}>
              <strong style={{ fontSize: '13.5px', color: '#0F172A', fontWeight: 800 }}>Standard Operating Procedure:</strong>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13.5px', color: '#475569', lineHeight: 1.6 }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <span style={{ fontWeight: 800, color: '#0F172A' }}>1.</span>
                  <span>Navigate to <strong>Google Cloud Console &gt; APIs &amp; Services &gt; Credentials</strong>.</span>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <span style={{ fontWeight: 800, color: '#0F172A' }}>2.</span>
                  <span>Select your API key, click <strong>Application restrictions &gt; IP addresses</strong>, and add goML Egress NAT IP (<code style={{ fontFamily: '"JetBrains Mono", monospace', background: '#FFFFFF', border: '1px solid #CBD5E1', padding: '1px 6px', borderRadius: '4px', color: '#0F172A' }}>34.120.45.10/32</code>).</span>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <span style={{ fontWeight: 800, color: '#0F172A' }}>3.</span>
                  <span>Under <strong>API restrictions</strong>, restrict key to Directions API, Geocoding API, and Distance Matrix API, then save.</span>
                </div>
              </div>
            </div>
          )}

          {/* Card 3: UPLOAD OR PASTE SCREENSHOTS & EVIDENCE */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{
                fontSize: '12px',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: '#0F172A',
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                fontFamily: '"Plus Jakarta Sans", sans-serif'
              }}>
                <ImageIcon size={16} color="#0F172A" />
                <span>Upload or Paste Screenshots &amp; Evidence</span>
              </div>

              <span style={{
                fontSize: '12px',
                fontFamily: '"JetBrains Mono", monospace',
                color: '#64748B',
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                padding: '3px 12px',
                borderRadius: '6px',
                fontWeight: 500
              }}>
                Ctrl + V to paste anywhere
              </span>
            </div>

            {/* Dashed Dropzone */}
            <div style={{
              border: '1.5px dashed #CBD5E1',
              borderRadius: '12px',
              padding: '1.8rem 1.25rem',
              textAlign: 'center',
              background: '#FAFAFC',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.borderColor = '#EA580C'}
            onMouseOut={(e) => e.currentTarget.style.borderColor = '#CBD5E1'}
            >
              <input
                type="file"
                id="evidence-multi-upload"
                multiple
                accept="image/*,.pdf,.doc,.docx,.sql,.json,.txt"
                style={{ display: 'none' }}
                onChange={handleFileSelect}
              />
              <label htmlFor="evidence-multi-upload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: '#FFFFFF',
                  border: '1.5px solid #E2E8F0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#64748B',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.04)'
                }}>
                  <Upload size={21} />
                </div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#0F172A', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                  Click to choose files, drop screenshots, or press <kbd style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', padding: '2px 8px', borderRadius: '5px', fontSize: '12px', fontFamily: '"JetBrains Mono", monospace', fontWeight: 600, color: '#0F172A' }}>Ctrl + V</kbd> to paste
                </div>
                <div style={{ fontSize: '12px', color: '#94A3B8', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                  Supports .png, .jpg, PDF, SQL queries, JSON logs (up to 25MB)
                </div>
              </label>
            </div>

            {/* Attached Evidence Files List */}
            {filePreviews.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {filePreviews.map((fp, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                    }}
                  >
                    {/* File row header */}
                    <div style={{
                      padding: '12px 18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '14px',
                      background: fp.isImage ? '#FAFAFA' : '#FFFFFF'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        {fp.isImage && fp.url ? (
                          <div
                            style={{
                              width: '46px',
                              height: '36px',
                              borderRadius: '6px',
                              overflow: 'hidden',
                              border: '1px solid #CBD5E1',
                              cursor: 'pointer',
                              flexShrink: 0,
                              background: '#000000'
                            }}
                            onClick={() => window.open(fp.url, '_blank')}
                            title="Click to view full resolution in new tab"
                          >
                            <img
                              src={fp.url}
                              alt={fp.name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          </div>
                        ) : (
                          <span style={{
                            width: '42px',
                            height: '32px',
                            background: '#F1F5F9',
                            border: '1px solid #E2E8F0',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 800,
                            color: '#334155',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontFamily: '"JetBrains Mono", monospace'
                          }}>
                            {fp.name.endsWith('.pdf') ? 'PDF' : 'PNG'}
                          </span>
                        )}

                        <div>
                          <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0F172A', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                            {fp.name}
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748B', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                            {fp.subtext}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        {fp.readyForReview && (
                          <span style={{
                            fontSize: '12.5px',
                            color: '#16A34A',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontFamily: '"Plus Jakarta Sans", sans-serif'
                          }}>
                            <Check size={15} color="#16A34A" strokeWidth={3} />
                            <span>Ready for Review</span>
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => handleRemoveFile(idx)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#94A3B8',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            borderRadius: '4px'
                          }}
                          title="Remove file"
                        >
                          <X size={17} />
                        </button>
                      </div>
                    </div>

                    {/* Rich Image Preview Frame for Pasted Screenshots */}
                    {fp.isImage && fp.url && (
                      <div style={{
                        borderTop: '1px solid #E2E8F0',
                        padding: '12px 18px',
                        background: '#FFFFFF'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '8px'
                        }}>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                            color: '#64748B',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}>
                            <ImageIcon size={12} color="#64748B" />
                            <span>Pasted Screenshot Preview</span>
                          </span>

                          <a
                            href={fp.url}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              fontSize: '11.5px',
                              fontWeight: 600,
                              color: '#0F172A',
                              textDecoration: 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <span>Open Full Size</span>
                            <ExternalLink size={11} />
                          </a>
                        </div>

                        <div style={{
                          maxHeight: '260px',
                          overflow: 'auto',
                          borderRadius: '8px',
                          border: '1px solid #E2E8F0',
                          background: '#F8FAFC',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <img
                            src={fp.url}
                            alt="Screenshot preview"
                            style={{
                              maxWidth: '100%',
                              maxHeight: '260px',
                              objectFit: 'contain',
                              display: 'block'
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card 4: CREDENTIAL & ACCESS HANDOVER TABLE */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <div style={{
                  fontSize: '12px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#0F172A',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  fontFamily: '"Plus Jakarta Sans", sans-serif'
                }}>
                  <FileText size={16} color="#0F172A" />
                  <span>Credential &amp; Access Handover Template Table</span>
                </div>
                <span style={{ fontSize: '12.5px', color: '#64748B', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                  Formatted for Teams, Slack &amp; Email
                </span>
              </div>

              <button
                type="button"
                onClick={handleRegenerateWithAI}
                disabled={isAiGenerating}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '7px',
                  padding: '7px 16px',
                  borderRadius: '8px',
                  background: '#FFFFFF',
                  border: '1.5px solid #CBD5E1',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  color: '#0F172A',
                  cursor: 'pointer',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  fontFamily: '"Plus Jakarta Sans", sans-serif'
                }}
              >
                {isAiGenerating ? <Loader2 className="animate-spin" size={14} /> : <Star size={14} color="#0F172A" fill="#0F172A" />}
                <span>{isAiGenerating ? 'Generating...' : 'AI Auto-Generate Template'}</span>
              </button>
            </div>

            {/* Handover Table Inputs Grid */}
            <div style={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              padding: '22px 26px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '11px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: '#475569',
                    marginBottom: '6px',
                    fontFamily: '"Plus Jakarta Sans", sans-serif'
                  }}>
                    HOST / ENDPOINT URL
                  </label>
                  <input
                    type="text"
                    className="goml-modal-input"
                    value={endpoint}
                    onChange={(e) => setEndpoint(e.target.value)}
                    placeholder="e.g. https://maps.googleapis.com/maps/api/"
                    style={{
                      width: '100%',
                      padding: '11px 15px',
                      border: '1.5px solid #E2E8F0',
                      borderRadius: '8px',
                      fontSize: '13px',
                      color: '#0F172A',
                      fontFamily: '"JetBrains Mono", monospace',
                      background: '#F8FAFC',
                      outline: 'none',
                      boxSizing: 'border-box',
                      transition: 'all 0.15s ease'
                    }}
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '11px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: '#475569',
                    marginBottom: '6px',
                    fontFamily: '"Plus Jakarta Sans", sans-serif'
                  }}>
                    AUTH METHOD / PROTOCOL
                  </label>
                  <input
                    type="text"
                    className="goml-modal-input"
                    value={authMethod}
                    onChange={(e) => setAuthMethod(e.target.value)}
                    placeholder="e.g. GCP API Key with IP Restrictions"
                    style={{
                      width: '100%',
                      padding: '11px 15px',
                      border: '1.5px solid #E2E8F0',
                      borderRadius: '8px',
                      fontSize: '13.5px',
                      color: '#0F172A',
                      fontFamily: '"Plus Jakarta Sans", sans-serif',
                      background: '#F8FAFC',
                      outline: 'none',
                      boxSizing: 'border-box',
                      transition: 'all 0.15s ease'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '11px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: '#475569',
                    marginBottom: '6px',
                    fontFamily: '"Plus Jakarta Sans", sans-serif'
                  }}>
                    USERNAME / SERVICE ACCOUNT ID
                  </label>
                  <input
                    type="text"
                    className="goml-modal-input"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. goml-maps-routing-svc@gcp-project.iam"
                    style={{
                      width: '100%',
                      padding: '11px 15px',
                      border: '1.5px solid #E2E8F0',
                      borderRadius: '8px',
                      fontSize: '13px',
                      color: '#0F172A',
                      fontFamily: '"JetBrains Mono", monospace',
                      background: '#F8FAFC',
                      outline: 'none',
                      boxSizing: 'border-box',
                      transition: 'all 0.15s ease'
                    }}
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '11px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: '#475569',
                    marginBottom: '6px',
                    fontFamily: '"Plus Jakarta Sans", sans-serif'
                  }}>
                    SECRET KEY / VAULT REFERENCE
                  </label>
                  <input
                    type="text"
                    className="goml-modal-input"
                    value={vaultRef}
                    onChange={(e) => setVaultRef(e.target.value)}
                    placeholder="e.g. [1Password / GCP Secret Manager: secret/google-maps-api-key]"
                    style={{
                      width: '100%',
                      padding: '11px 15px',
                      border: '1.5px solid #FFD8BF',
                      borderRadius: '8px',
                      fontSize: '13px',
                      color: '#EA580C',
                      fontWeight: 700,
                      fontFamily: '"JetBrains Mono", monospace',
                      background: '#FFF9F5',
                      outline: 'none',
                      boxSizing: 'border-box',
                      transition: 'all 0.15s ease'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '11px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: '#475569',
                    marginBottom: '6px',
                    fontFamily: '"Plus Jakarta Sans", sans-serif'
                  }}>
                    NETWORK INGRESS / WHITELISTED IP
                  </label>
                  <input
                    type="text"
                    className="goml-modal-input"
                    value={ingressIp}
                    onChange={(e) => setIngressIp(e.target.value)}
                    placeholder="e.g. 34.120.45.10/32 (goML Staging VPC)"
                    style={{
                      width: '100%',
                      padding: '11px 15px',
                      border: '1.5px solid #E2E8F0',
                      borderRadius: '8px',
                      fontSize: '13px',
                      color: '#0F172A',
                      fontFamily: '"JetBrains Mono", monospace',
                      background: '#F8FAFC',
                      outline: 'none',
                      boxSizing: 'border-box',
                      transition: 'all 0.15s ease'
                    }}
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '11px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: '#475569',
                    marginBottom: '6px',
                    fontFamily: '"Plus Jakarta Sans", sans-serif'
                  }}>
                    ENVIRONMENT &amp; SCOPE
                  </label>
                  <input
                    type="text"
                    className="goml-modal-input"
                    value={envScope}
                    onChange={(e) => setEnvScope(e.target.value)}
                    placeholder="e.g. Staging & Production Pilot"
                    style={{
                      width: '100%',
                      padding: '11px 15px',
                      border: '1.5px solid #E2E8F0',
                      borderRadius: '8px',
                      fontSize: '13.5px',
                      color: '#0F172A',
                      fontFamily: '"Plus Jakarta Sans", sans-serif',
                      background: '#F8FAFC',
                      outline: 'none',
                      boxSizing: 'border-box',
                      transition: 'all 0.15s ease'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: '#475569',
                  marginBottom: '6px',
                  fontFamily: '"Plus Jakarta Sans", sans-serif'
                }}>
                  CLIENT TECHNICAL LEAD SIGN-OFF
                </label>
                <input
                  type="text"
                  className="goml-modal-input"
                  value={signoffBy}
                  onChange={(e) => setSignoffBy(e.target.value)}
                  placeholder="e.g. Praveen Karuppusamy (Client Technical Lead)"
                  style={{
                    width: '100%',
                    padding: '11px 15px',
                    border: '1.5px solid #E2E8F0',
                    borderRadius: '8px',
                    fontSize: '13.5px',
                    color: '#0F172A',
                    fontWeight: 600,
                    fontFamily: '"Plus Jakarta Sans", sans-serif',
                    background: '#F8FAFC',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'all 0.15s ease'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: '#475569',
                  marginBottom: '6px',
                  fontFamily: '"Plus Jakarta Sans", sans-serif'
                }}>
                  VERIFICATION NOTES / HANDOVER SUMMARY
                </label>
                <textarea
                  className="goml-modal-input"
                  value={evidenceNotes}
                  onChange={(e) => setEvidenceNotes(e.target.value)}
                  placeholder="Verified Google Cloud billing account active. API key restricted to server IPs..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1.5px solid #E2E8F0',
                    borderRadius: '8px',
                    fontSize: '13.5px',
                    lineHeight: 1.6,
                    color: '#0F172A',
                    fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
                    background: '#F8FAFC',
                    outline: 'none',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                    transition: 'all 0.15s ease'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Card 5: SHARE DELIVERY STATUS */}
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            padding: '18px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{
                fontSize: '12px',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: '#EA580C',
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                fontFamily: '"Plus Jakarta Sans", sans-serif'
              }}>
                <Share2 size={16} color="#0F172A" />
                <span>Share Delivery Status</span>
              </div>

              <span style={{ fontSize: '12px', color: '#64748B', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                1-Click copies formatted table &amp; opens the app
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
              {/* Teams Button */}
              <button
                type="button"
                onClick={handleShareToTeams}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '9px',
                  padding: '12px 20px',
                  borderRadius: '10px',
                  background: '#464EB8',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: '13.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(70, 78, 184, 0.25)',
                  fontFamily: '"Plus Jakarta Sans", sans-serif',
                  transition: 'transform 0.15s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <TeamsLogo />
                <span>Share to Teams</span>
                <ExternalLink size={14} color="#FFFFFF" />
              </button>

              {/* Slack Button */}
              <button
                type="button"
                onClick={handleShareToSlack}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '9px',
                  padding: '12px 20px',
                  borderRadius: '10px',
                  background: '#0F172A',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: '13.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(15, 23, 42, 0.25)',
                  fontFamily: '"Plus Jakarta Sans", sans-serif',
                  transition: 'transform 0.15s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <SlackLogo />
                <span>Share to Slack</span>
                <ExternalLink size={14} color="#FFFFFF" />
              </button>

              {/* Email Button */}
              <button
                type="button"
                onClick={handleShareViaEmail}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '9px',
                  padding: '12px 20px',
                  borderRadius: '10px',
                  background: '#FFFFFF',
                  color: '#EA580C',
                  border: '1.5px solid #FFD8BF',
                  fontSize: '13.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: '"Plus Jakarta Sans", sans-serif',
                  transition: 'all 0.15s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#FFF5EE'}
                onMouseOut={(e) => e.currentTarget.style.background = '#FFFFFF'}
              >
                <Send size={14} color="#0F172A" />
                <span>Share via Email</span>
                <ExternalLink size={14} color="#0F172A" />
              </button>
            </div>
          </div>
        </div>

        {/* 3. STICKY BOTTOM ACTION BAR */}
        <div style={{
          padding: '1.35rem 3.25rem',
          borderTop: '1px solid #E2E8F0',
          background: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0
        }}>
          {/* Status Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13.5px', color: '#64748B', fontWeight: 600, fontFamily: '"Plus Jakarta Sans", sans-serif' }}>Status:</span>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
              background: item?.status === 'Verified' ? '#F0FDF4' : '#FFF5EE',
              color: item?.status === 'Verified' ? '#16A34A' : '#EA580C',
              border: item?.status === 'Verified' ? '1px solid #DCFCE7' : '1px solid #FFD8BF',
              padding: '4px 14px',
              borderRadius: '9999px',
              fontSize: '12.5px',
              fontWeight: 700,
              fontFamily: '"Plus Jakarta Sans", sans-serif'
            }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: item?.status === 'Verified' ? '#16A34A' : '#EA580C' }} />
              <span>{item?.status === 'Verified' ? 'Verified' : 'Submitted'}</span>
            </span>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                padding: '10px 20px',
                fontSize: '13.5px',
                fontWeight: 600,
                color: '#64748B',
                cursor: 'pointer',
                fontFamily: '"Plus Jakarta Sans", sans-serif',
                borderRadius: '8px'
              }}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() => handleSaveAndSync('Verified')}
              disabled={savingItem}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                background: '#FFFFFF',
                border: '1.5px solid #0F172A',
                borderRadius: '10px',
                padding: '11px 24px',
                fontSize: '13.5px',
                fontWeight: 700,
                color: '#0F172A',
                cursor: 'pointer',
                fontFamily: '"Plus Jakarta Sans", sans-serif',
                transition: 'all 0.15s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = '#F8FAFC'}
              onMouseOut={(e) => e.currentTarget.style.background = '#FFFFFF'}
            >
              <Check size={15} color="#0F172A" strokeWidth={3} />
              <span>Mark Verified</span>
            </button>

            <button
              type="button"
              onClick={() => handleSaveAndSync('Submitted')}
              disabled={savingItem}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '9px',
                background: '#EA580C',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '10px',
                padding: '11px 28px',
                fontSize: '13.5px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(234, 88, 12, 0.35)',
                fontFamily: '"Plus Jakarta Sans", sans-serif',
                transition: 'all 0.15s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = '#D94E06'}
              onMouseOut={(e) => e.currentTarget.style.background = '#EA580C'}
            >
              <Send size={15} color="#FFFFFF" />
              <span>Submit for Engineering Review</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
