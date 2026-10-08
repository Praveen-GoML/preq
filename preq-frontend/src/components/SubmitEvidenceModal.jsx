import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  X, CheckCircle, Loader2, Copy, Check, Upload, 
  FileText, Send, CheckSquare, Square, Save, Plus, 
  Trash2, ListChecks, Paperclip, Zap, ExternalLink, 
  User, Clock, Image as ImageIcon, Share2, HelpCircle,
  ShieldCheck, ArrowUpRight
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

// Native Slack mrkdwn Format (Clean bullet grid with bold keys & code values)
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

// Detailed Microsoft Teams Table (Rich HTML Format) with Credential Handover Template
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
<p style="margin: 8px 0 0 0; font-size: 11.5px; color: #64748B;"><em>Generated automatically via goML PreQ Client Portal for Day-1 Clearance.</em></p>
</div>`;
};

// Detailed Email Draft
const generateEmail = (item, values, notes) => {
  if (!item) return { subject: '', body: '' };
  const subject = `[PreQ Handover] ${item.name} — Credential & Delivery Specification`;
  const body = `Hi goML Engineering Team,

We have completed the prerequisite verification for: ${item.name} (${item.category}).
Below is the structured credential & delivery specification table for Day-1 kick-off clearance:

======================================================================
PREQ CREDENTIAL & HANDOVER SPECIFICATION TABLE
======================================================================
• Milestone / Requirement : ${item.name} (${item.category})
• Host / Endpoint URL     : ${values.endpoint || 'Not Specified'}
• Auth Method / Protocol  : ${values.authMethod || 'Service Account'}
• Username / Account ID   : ${values.username || 'goml_svc_reader'}
• Secret / Vault Ref      : ${values.vaultRef || '[Stored in 1Password / AWS Secrets Manager]'}
• Ingress / Whitelisted IP: ${values.ingressIp || '34.120.45.10/32 (goML Staging VPC)'}
• Environment & Scope     : ${values.envScope || 'Staging Sandbox (Read-Only)'}
• Signed off by           : ${values.signoff || 'Client Technical Lead'}
• Notes                   : ${notes || 'All checks verified.'}
======================================================================

Best regards,
${values.signoff || 'Client Technical Lead'}`;
  return { subject, body };
};

// Dynamic Handover Specification Generator tailored specifically to requirement type
const getDynamicTemplateForRequirement = (item) => {
  if (!item) return {};
  const name = (item.name || '').toLowerCase();
  const cat = (item.category || '').toLowerCase();
  const desc = (item.description || '').toLowerCase();

  // 1. Google Maps / Geolocation / Navigation
  if (name.includes('map') || name.includes('google') || name.includes('geo') || desc.includes('maps') || desc.includes('routing')) {
    return {
      endpoint: 'https://maps.googleapis.com/maps/api/ (Google Cloud Platform Console)',
      authMethod: 'GCP API Key with API Restrictions (Directions, Geocoding, Distance Matrix enabled)',
      username: 'goml-maps-routing-svc@gcp-project.iam.gserviceaccount.com',
      vaultRef: '[1Password / GCP Secret Manager: secret/google-maps-api-key]',
      ingressIp: 'HTTP Referrers & Ingress IP: 34.120.45.10/32',
      envScope: 'Staging & Production Pilot (50k requests/day volume quota provisioned)',
      notes: 'Verified Google Cloud billing account active. API key restricted to server IPs and required Maps APIs to prevent unauthorized quota consumption.'
    };
  }

  // 2. Database / SQL / MySQL / PostgreSQL / Schema
  if (name.includes('sql') || name.includes('database') || name.includes('schema') || name.includes('mysql') || name.includes('postgres') || cat === 'data') {
    return {
      endpoint: 'mysql://db-staging.internal.goml.net:3306/production_mirror',
      authMethod: 'Read-Only Database User + TLS/SSL Enforced',
      username: 'goml_data_steward_ro',
      vaultRef: '[AWS Secrets Manager: arn:aws:secretsmanager:...:secret:goml-db-ro]',
      ingressIp: '34.120.45.10/32 (goML Staging VPC Peering)',
      envScope: 'Staging Sandbox / Read-Only Schema Map & Routing Validation',
      notes: 'Pre-built SQL inspection query library validated against schema. Verified no unmasked production PII is accessible.'
    };
  }

  // 3. LLM / OpenAI / Anthropic / AI API Keys
  if (name.includes('openai') || name.includes('anthropic') || name.includes('llm') || name.includes('key') || name.includes('token') || (cat === 'integration' && desc.includes('model'))) {
    return {
      endpoint: 'https://api.openai.com/v1 (or https://api.anthropic.com/v1)',
      authMethod: 'Organization API Key / Service Account Token (Tier 4 / Enterprise Quota)',
      username: 'goml-llm-orchestrator-svc',
      vaultRef: '[Vault: 1Password "goML Integration Keys" / AWS Secrets Manager]',
      ingressIp: 'Global Cloud Egress Active (No IP whitelist required)',
      envScope: 'Staging & Production Pilot Inference',
      notes: 'Provisioned with auto-reload quota balance to prevent inference throttling during peak testing.'
    };
  }

  // 4. AWS / S3 / Cloud Lakehouse / Storage
  if (name.includes('s3') || name.includes('bucket') || name.includes('lake') || name.includes('storage') || name.includes('aws')) {
    return {
      endpoint: 'https://s3.us-east-1.amazonaws.com/client-goml-staging-lake',
      authMethod: 'IAM Cross-Account AssumeRole Policy (Read-Only)',
      username: 'arn:aws:iam::123456789012:role/goMLReadWriteExecutionRole',
      vaultRef: '[AWS IAM STS Token / External ID Secret in Secrets Manager]',
      ingressIp: 'AWS VPC Endpoint / Direct Cloud Peering',
      envScope: 'Staging S3 Bucket / Raw Event Ingestion Lake',
      notes: 'Bucket encryption KMS key policy granted to goML execution role with least-privilege permissions.'
    };
  }

  // 5. CRM / Salesforce / Hubspot / ERP
  if (name.includes('salesforce') || name.includes('crm') || name.includes('hubspot') || name.includes('erp') || name.includes('oauth')) {
    return {
      endpoint: 'https://clientcorp.my.salesforce.com/services/oauth2/token',
      authMethod: 'Connected App OAuth 2.0 (JWT Bearer Token Flow)',
      username: 'goml_integration_user@clientcorp.com',
      vaultRef: '[1Password: Salesforce Connected App Client ID + Private Key]',
      ingressIp: 'Trusted IP Range Whitelist: 34.120.45.10/32',
      envScope: 'Full Sandbox (CS128) / Lead & Account Routing Sync',
      notes: 'Sandbox profile assigned with API Enabled and Read/Write access to relevant custom objects.'
    };
  }

  // 6. Slack / Webhooks / Alerts
  if (name.includes('slack') || name.includes('webhook') || name.includes('alert') || name.includes('teams')) {
    return {
      endpoint: 'https://hooks.slack.com/services/T.../B.../... (or Teams Webhook URL)',
      authMethod: 'Incoming Webhook Token / Bot User OAuth Token',
      username: 'goml-delivery-notifier-bot',
      vaultRef: '[1Password / AWS Secrets Manager: secret/slack-webhook-url]',
      ingressIp: 'HTTPS Webhook Ingress (Public Cloud)',
      envScope: '#movil-ventas-goml / #alerts-staging Channel Delivery',
      notes: 'Webhook tested with sample Block Kit notification payload.'
    };
  }

  // 7. Compliance / Security / Legal / BAA / SOC2
  if (name.includes('baa') || name.includes('soc2') || name.includes('hipaa') || name.includes('nda') || name.includes('compliance') || cat === 'compliance' || cat === 'security') {
    return {
      endpoint: 'https://clientcorp.sharepoint.com/legal/compliance-portal',
      authMethod: 'Authorized Officer DocuSign / Sign-off Digital Signature',
      username: 'legal-counsel@clientcorp.com',
      vaultRef: '[Signed BAA & SOC2 Type-II PDF Document Archive]',
      ingressIp: 'Secure Client Portal (Multi-Factor Authenticated)',
      envScope: 'Enterprise Day-1 Project Governance Clearance',
      notes: 'Data protection agreement executed with designated data retention and disposal terms.'
    };
  }

  // Default fallback
  return {
    endpoint: 'https://console.cloud.google.com / AWS Console',
    authMethod: 'SSO Federation / Least-Privilege IAM Access',
    username: 'goml-engineer-access@clientcorp.com',
    vaultRef: '[Identity Provider: Okta / Google Workspace SSO]',
    ingressIp: '34.120.45.10/32 (goML VPN Gateway)',
    envScope: 'Development & Staging Environment',
    notes: 'Verified Day-1 technical governance sign-off and environment access clearance.'
  };
};

export const SubmitEvidenceModal = ({ isOpen, onClose, item, onSubmitted }) => {
  // Credential & Handover Template Form Fields
  const [endpoint, setEndpoint] = useState('');
  const [authMethod, setAuthMethod] = useState('');
  const [username, setUsername] = useState('');
  const [vaultRef, setVaultRef] = useState('');
  const [ingressIp, setIngressIp] = useState('');
  const [envScope, setEnvScope] = useState('');
  const [signoffBy, setSignoffBy] = useState('Client Technical Lead');
  const [evidenceNotes, setEvidenceNotes] = useState('');
  const [savingItem, setSavingItem] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  // Non-Technical Credential Guidance States
  const [showCredGuide, setShowCredGuide] = useState(false);
  const [showItDelegation, setShowItDelegation] = useState(false);
  const [copiedDelegation, setCopiedDelegation] = useState(false);

  const credGuide = item ? getCredentialGuidance(item) : null;

  const handleCopyDelegation = (msg) => {
    if (!msg) return;
    navigator.clipboard.writeText(msg);
    setCopiedDelegation(true);
    triggerToast('Copied ready-to-send IT delegation email template!');
    setTimeout(() => setCopiedDelegation(false), 2500);
  };

  // Multiple screenshot / file uploads & paste support
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);

  // Sharing states
  const [slackSending, setSlackSending] = useState(false);
  const [slackSuccess, setSlackSuccess] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [error, setError] = useState('');

  // Live AI Handover Template Regeneration
  const handleRegenerateWithAI = async () => {
    setIsAiGenerating(true);
    try {
      const res = await axios.post(`${API_URL}/copilot/generate-handover-spec`, {
        name: item.name,
        category: item.category,
        description: item.description,
        expected_evidence: item.expected_evidence,
        client_name: 'Praveen Karuppusamy'
      });
      if (res.data) {
        if (res.data.endpoint) setEndpoint(res.data.endpoint);
        if (res.data.authMethod) setAuthMethod(res.data.authMethod);
        if (res.data.username) setUsername(res.data.username);
        if (res.data.vaultRef) setVaultRef(res.data.vaultRef);
        if (res.data.ingressIp) setIngressIp(res.data.ingressIp);
        if (res.data.envScope) setEnvScope(res.data.envScope);
        if (res.data.notes) setEvidenceNotes(res.data.notes);
        triggerToast('AI generated bespoke handover specifications!');
      }
    } catch (e) {
      console.error(e);
      const fallback = getDynamicTemplateForRequirement(item);
      setEndpoint(fallback.endpoint);
      setAuthMethod(fallback.authMethod);
      setUsername(fallback.username);
      setVaultRef(fallback.vaultRef);
      setIngressIp(fallback.ingressIp);
      setEnvScope(fallback.envScope);
      setEvidenceNotes(fallback.notes);
      triggerToast('Applied intelligent use-case template!');
    } finally {
      setIsAiGenerating(false);
    }
  };

  useEffect(() => {
    if (item && isOpen) {
      // Dynamically generate tailored handover template for this exact requirement use-case
      const dynamicTemplate = getDynamicTemplateForRequirement(item);
      setEndpoint(dynamicTemplate.endpoint);
      setAuthMethod(dynamicTemplate.authMethod);
      setUsername(dynamicTemplate.username);
      setVaultRef(dynamicTemplate.vaultRef);
      setIngressIp(dynamicTemplate.ingressIp);
      setEnvScope(dynamicTemplate.envScope);
      setEvidenceNotes(item.evidence_notes || dynamicTemplate.notes);

      setSignoffBy('Praveen Karuppusamy (Client Technical Lead)');
      setAttachedFiles([]);
      setFilePreviews([]);
      setError('');
      setSlackSuccess(false);

      // Async AI enrichment in the background
      axios.post(`${API_URL}/copilot/generate-handover-spec`, {
        name: item.name,
        category: item.category,
        description: item.description,
        expected_evidence: item.expected_evidence,
        client_name: 'Praveen Karuppusamy'
      }).then(res => {
        if (res.data && res.data.endpoint) {
          setEndpoint(res.data.endpoint);
          setAuthMethod(res.data.authMethod);
          setUsername(res.data.username);
          setVaultRef(res.data.vaultRef);
          setIngressIp(res.data.ingressIp);
          setEnvScope(res.data.envScope);
          if (!item.evidence_notes && res.data.notes) {
            setEvidenceNotes(res.data.notes);
          }
        }
      }).catch(err => {
        // Fallback already active
      });
    }
  }, [item, isOpen]);

  // CLIPBOARD PASTE HANDLER: Allows users to press Ctrl + V anywhere in modal to attach screenshots
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const newFiles = [];
      const newPreviews = [];

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            const fileName = `screenshot_pasted_${Date.now()}_${i + 1}.png`;
            const fileObj = new File([blob], fileName, { type: blob.type });
            const previewUrl = URL.createObjectURL(blob);

            newFiles.push(fileObj);
            newPreviews.push({
              name: fileName,
              url: previewUrl,
              size: fileObj.size,
              isImage: true
            });
          }
        }
      }

      if (newFiles.length > 0) {
        setAttachedFiles(prev => [...prev, ...newFiles]);
        setFilePreviews(prev => [...prev, ...newPreviews]);
        triggerToast(`Pasted ${newFiles.length} screenshot(s) from clipboard!`);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen]);

  if (!isOpen || !item) return null;

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Multi-file selection handler
  const handleFileSelect = (e) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length === 0) return;

    const newPreviews = selected.map(f => ({
      name: f.name,
      url: f.type.startsWith('image/') ? URL.createObjectURL(f) : null,
      size: f.size,
      isImage: f.type.startsWith('image/')
    }));

    setAttachedFiles(prev => [...prev, ...selected]);
    setFilePreviews(prev => [...prev, ...newPreviews]);
    triggerToast(`Added ${selected.length} file(s)!`);
  };

  const handleRemoveFile = (index) => {
    setAttachedFiles(prev => prev.filter((_, idx) => idx !== index));
    setFilePreviews(prev => prev.filter((_, idx) => idx !== index));
  };

  const getValues = () => ({
    endpoint,
    authMethod,
    username,
    vaultRef,
    ingressIp,
    envScope,
    signoff: signoffBy
  });

  // Save checklist and sync tracker (Submitted for review vs Verified directly)
  const handleSaveAndSync = async (targetStatus = 'Submitted') => {
    setSavingItem(true);
    setError('');

    const notesSummary = evidenceNotes || `Specifications submitted: ${endpoint} (${authMethod})`;

    try {
      if (attachedFiles.length > 0) {
        const formData = new FormData();
        attachedFiles.forEach(f => formData.append('files', f));
        formData.append('evidence_notes', notesSummary);
        formData.append('status', targetStatus);
        await axios.post(`${API_URL}/items/${item.id}/submit-evidence`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await axios.put(`${API_URL}/items/${item.id}`, {
          status: targetStatus,
          evidence_notes: notesSummary
        });
      }

      if (targetStatus === 'Submitted') {
        triggerToast('Submitted! Sent to goML Engineering for review & clearance.');
      } else {
        triggerToast('Verified! Milestone marked as cleared for Day-1.');
      }
      if (onSubmitted) onSubmitted();
      setTimeout(() => onClose(), 700);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to sync tracker.');
    } finally {
      setSavingItem(false);
    }
  };

  // Helper to trigger native desktop application protocol with web fallback
  const launchNativeApp = (nativeUri, webFallback) => {
    try {
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = nativeUri;
      document.body.appendChild(iframe);
      setTimeout(() => {
        try { document.body.removeChild(iframe); } catch (e) {}
      }, 2000);
    } catch (e) {
      window.location.href = nativeUri;
    }

    if (webFallback) {
      setTimeout(() => {
        window.open(webFallback, '_blank');
      }, 800);
    }
  };

  // 1-Click Share to Slack (Sends webhook + Copies text + Launches Real Slack App)
  const handleShareSlack = async () => {
    setSlackSending(true);
    setError('');
    
    // Copy clean formatted Slack text to clipboard immediately
    const text = generateSlackGrid(item, getValues(), evidenceNotes);
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {}

    // Launch Real Slack Desktop App (slack://open) + web fallback
    launchNativeApp('slack://open', 'https://app.slack.com/client');

    try {
      const payload = {
        channel: 'movil-ventas-goml',
        checklist_summary: 'Handover Verified & Ready',
        resource: endpoint,
        signoff: signoffBy
      };
      await axios.post(`${API_URL}/items/${item.id}/share-slack`, payload);
      setSlackSuccess(true);
      triggerToast('Dispatched to Slack & launching Slack Desktop App (text copied)!');
      if (onSubmitted) onSubmitted();
    } catch (err) {
      console.error(err);
      triggerToast('Copied Slack message & launched Slack Desktop App!');
    } finally {
      setSlackSending(false);
    }
  };

  // Share to Microsoft Teams (Copies HTML table + Launches Real Teams App)
  const handleShareTeams = async () => {
    const html = generateTeamsTable(item, getValues(), evidenceNotes);
    const text = generateSlackGrid(item, getValues(), evidenceNotes);
    try {
      if (navigator.clipboard && window.ClipboardItem) {
        const blobHtml = new Blob([html], { type: 'text/html' });
        const blobText = new Blob([text], { type: 'text/plain' });
        await navigator.clipboard.write([new ClipboardItem({ 'text/html': blobHtml, 'text/plain': blobText })]);
      } else {
        await navigator.clipboard.writeText(text);
      }
    } catch (e) {
      try { await navigator.clipboard.writeText(text); } catch (err) {}
    }

    // Launch Real Microsoft Teams Desktop App (msteams:/) + web fallback
    launchNativeApp('msteams:/l/chat/0/0', 'https://teams.microsoft.com');
    triggerToast('Copied Teams table & launching Microsoft Teams App!');
  };

  // Share via Email (Copies draft + Launches Real Default Email Client)
  const handleShareEmail = () => {
    const { subject, body } = generateEmail(item, getValues(), evidenceNotes);
    try {
      navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
    } catch (e) {}
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
    triggerToast('Opening Email Client (Outlook/Mail) & copied draft!');
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.7)',
      backdropFilter: 'blur(5px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '1.25rem',
      fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#0F172A',
          color: '#ffffff',
          padding: '10px 22px',
          borderRadius: '100px',
          fontSize: '13px',
          fontWeight: 700,
          boxShadow: '0 12px 30px rgba(0,0,0,0.35)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <CheckCircle size={16} color="#10B981" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Spacious Plain Card */}
      <div style={{
        background: '#ffffff',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '920px',
        maxHeight: '94vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        border: '1px solid #E2E8F0',
        overflow: 'hidden'
      }}>
        {/* 1. PLAIN HEADER */}
        <div style={{
          padding: '1.4rem 2rem',
          borderBottom: '1px solid #F1F5F9',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          background: '#ffffff',
          flexShrink: 0
        }}>
          <div style={{ flex: 1, paddingRight: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
              <span style={{ background: '#F1F5F9', color: '#334155', padding: '3px 10px', borderRadius: '100px', fontSize: '11.5px', fontWeight: 700 }}>
                {item.category}
              </span>
              {item.owner && (
                <span style={{ background: '#FFF7ED', color: '#ED7D31', border: '1px solid #FFEDD5', padding: '3px 10px', borderRadius: '100px', fontSize: '11.5px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <User size={11} /> {item.owner}
                </span>
              )}
              <span style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#475569', padding: '3px 10px', borderRadius: '100px', fontSize: '11.5px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={11} /> Due {item.due_date || 'Day-1'}
              </span>
              {item.is_critical && (
                <span style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FEE2E2', padding: '3px 10px', borderRadius: '100px', fontSize: '11.5px', fontWeight: 700 }}>
                  Critical Gatekeeper
                </span>
              )}
            </div>

            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0F172A', margin: '0 0 4px 0', letterSpacing: '-0.025em' }}>
              {item.name}
            </h2>
            <p style={{ fontSize: '13.5px', color: '#64748B', margin: 0, lineHeight: 1.5 }}>
              {item.description}
            </p>
          </div>

          <button
            onClick={onClose}
            style={{
              background: '#F1F5F9',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#64748B',
              transition: 'background 0.2s ease'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* 2. BODY CONTENT */}
        <div style={{
          padding: '1.5rem 2rem',
          overflowY: 'auto',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '1.35rem'
        }}>
          {/* Required Deliverable Note */}
          <div style={{
            background: '#FFF9F5',
            border: '1px solid #FCD9C2',
            padding: '10px 14px',
            borderRadius: '10px',
            fontSize: '13px',
            color: '#475569',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <FileText size={16} color="#ED7D31" style={{ flexShrink: 0 }} />
            <div>
              <strong style={{ color: '#ED7D31' }}>Required Proof / Artifact:</strong>{' '}
              <span>{item.expected_evidence}</span>
            </div>
          </div>

          {/* NON-TECHNICAL CREDENTIAL RETRIEVAL GUIDE (Collapsible / Prominent for non-technical users) */}
          {credGuide && credGuide.isCredential && (
            <div style={{
              background: 'linear-gradient(135deg, #FFFDFB 0%, #FFF8F3 100%)',
              border: '1.5px solid #FCD9C2',
              borderRadius: '14px',
              padding: '1.15rem 1.35rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem',
              boxShadow: '0 2px 10px rgba(237, 125, 49, 0.05)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    background: '#ED7D31',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '100px',
                    letterSpacing: '0.03em'
                  }}>
                    Non-Technical Guide
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A' }}>
                    How to get {credGuide.serviceName}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {credGuide.consoleUrl && (
                    <a
                      href={credGuide.consoleUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        background: '#0F172A',
                        color: '#ffffff',
                        borderRadius: '6px',
                        padding: '4px 10px',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        textDecoration: 'none'
                      }}
                    >
                      <span>Open Console</span>
                      <ArrowUpRight size={12} color="#ED7D31" />
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => setShowCredGuide(!showCredGuide)}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #CBD5E1',
                      borderRadius: '6px',
                      padding: '4px 10px',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      color: '#475569',
                      cursor: 'pointer'
                    }}
                  >
                    {showCredGuide ? 'Hide Steps' : 'View Step-by-Step Instructions (3 min)'}
                  </button>
                </div>
              </div>

              {/* Collapsible Steps Content */}
              {showCredGuide && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                  {credGuide.quickSteps.map(step => (
                    <div
                      key={step.num}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '8px',
                        background: '#ffffff',
                        border: '1px solid #F1E5DC',
                        borderRadius: '8px',
                        padding: '8px 10px'
                      }}
                    >
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: '#ED7D31',
                        color: '#ffffff',
                        fontSize: '11px',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: '1px'
                      }}>
                        {step.num}
                      </div>
                      <div style={{ lineHeight: 1.4 }}>
                        <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#0F172A' }}>{step.action}</div>
                        <div style={{ fontSize: '12px', color: '#475569' }}>{step.detail}</div>
                      </div>
                    </div>
                  ))}

                  {/* IT Request Delegation Drawer */}
                  <div style={{ borderTop: '1px dashed #FCD9C2', paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <button
                        type="button"
                        onClick={() => setShowItDelegation(!showItDelegation)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ED7D31',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          padding: 0
                        }}
                      >
                        {showItDelegation ? '▼ Hide IT Request Message' : '▶ Not an Admin? Copy message to send your IT / Cloud Admin'}
                      </button>

                      {showItDelegation && (
                        <button
                          type="button"
                          onClick={() => handleCopyDelegation(credGuide.delegationMessage)}
                          style={{
                            background: '#ffffff',
                            border: '1px solid #CBD5E1',
                            borderRadius: '6px',
                            padding: '3px 8px',
                            fontSize: '11px',
                            fontWeight: 700,
                            color: '#0F172A',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          {copiedDelegation ? <Check size={11} color="#10B981" /> : <Copy size={11} />}
                          <span>{copiedDelegation ? 'Copied!' : 'Copy IT Email'}</span>
                        </button>
                      )}
                    </div>

                    {showItDelegation && (
                      <div style={{
                        background: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        borderRadius: '6px',
                        padding: '8px 10px',
                        fontSize: '11.5px',
                        fontFamily: 'monospace',
                        color: '#334155',
                        whiteSpace: 'pre-wrap'
                      }}>
                        {credGuide.delegationMessage}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* EVIDENCE UPLOAD & SCREENSHOT PASTING (Supports Paste Ctrl+V + Multiple files) */}
          <div style={{ border: '1px solid #E5E7EB', borderRadius: '12px', padding: '1rem 1.25rem', background: '#ffffff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <div style={{ fontWeight: 700, fontSize: '13.5px', color: '#111827', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ImageIcon size={15} color="#ED7D31" />
                <span>Upload or Paste Screenshots & Evidence</span>
              </div>
              <span style={{ fontSize: '11.5px', color: '#ED7D31', fontWeight: 700, background: '#FFF7F0', border: '1px solid #FCD9C2', padding: '2px 8px', borderRadius: '100px' }}>
                Ctrl + V to Paste Screenshot Anywhere
              </span>
            </div>

            {/* Drag / Drop / Click zone */}
            <div style={{
              border: '1.5px dashed #CBD5E1',
              borderRadius: '8px',
              padding: '1.25rem 1rem',
              textAlign: 'center',
              background: '#F8FAFC',
              cursor: 'pointer'
            }}>
              <input
                type="file"
                id="evidence-multi-upload"
                multiple
                accept="image/*,.pdf,.doc,.docx,.sql,.json,.txt"
                style={{ display: 'none' }}
                onChange={handleFileSelect}
              />
              <label htmlFor="evidence-multi-upload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <Upload size={22} color="#64748B" />
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#374151' }}>
                  Click to choose files, drop screenshots, or press <kbd style={{ background: '#E2E8F0', padding: '1px 6px', borderRadius: '4px', fontFamily: 'inherit' }}>Ctrl + V</kbd> to paste
                </span>
                <span style={{ fontSize: '11px', color: '#94A3B8' }}>
                  Supports multiple screenshots (.png, .jpg), PDF, SQL queries, JSON logs
                </span>
              </label>
            </div>

            {/* Attached files & Pasted Screenshots previews */}
            {filePreviews.length > 0 && (
              <div style={{ marginTop: '0.85rem' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '6px' }}>
                  Attached Evidence Files ({filePreviews.length}):
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '8px' }}>
                  {filePreviews.map((fp, idx) => (
                    <div
                      key={idx}
                      style={{
                        border: '1px solid #E2E8F0',
                        borderRadius: '8px',
                        padding: '6px',
                        background: '#FAFAFA',
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(idx)}
                        style={{
                          position: 'absolute',
                          top: '3px',
                          right: '3px',
                          background: 'rgba(0,0,0,0.6)',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '50%',
                          width: '18px',
                          height: '18px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                        title="Delete file"
                      >
                        <X size={11} />
                      </button>

                      {fp.isImage && fp.url ? (
                        <img
                          src={fp.url}
                          alt={fp.name}
                          style={{ width: '100%', height: '65px', objectFit: 'cover', borderRadius: '4px' }}
                        />
                      ) : (
                        <div style={{ width: '100%', height: '65px', background: '#EEF2F6', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}>
                          <FileText size={24} />
                        </div>
                      )}

                      <div style={{ width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '10.5px', color: '#374151', textAlign: 'center', fontWeight: 600 }}>
                        {fp.name}
                      </div>
                      <div style={{ fontSize: '9.5px', color: '#94A3B8' }}>
                        {(fp.size / 1024).toFixed(1)} KB
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* DETAILED CREDENTIAL & HANDOVER SPECIFICATION TEMPLATE TABLE */}
            <div style={{ marginTop: '1.25rem', borderTop: '1px solid #F1F5F9', paddingTop: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ fontWeight: 700, fontSize: '13.5px', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileText size={15} color="#ED7D31" />
                  <span>Credential & Access Handover Template Table</span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={handleRegenerateWithAI}
                    disabled={isAiGenerating}
                    style={{
                      background: '#FFF7ED',
                      color: '#ED7D31',
                      border: '1px solid #FFEDD5',
                      padding: '4px 10px',
                      borderRadius: '100px',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = '#FFE8D6'}
                    onMouseOut={(e) => e.currentTarget.style.background = '#FFF7ED'}
                  >
                    {isAiGenerating ? <Loader2 className="animate-spin" size={12} /> : <Zap size={12} color="#ED7D31" />}
                    <span>{isAiGenerating ? 'Generating...' : 'AI Auto-Generate Template'}</span>
                  </button>
                  <span style={{ fontSize: '11px', color: '#64748B', background: '#F1F5F9', padding: '3px 8px', borderRadius: '100px', fontWeight: 600 }}>
                    Formatted for Teams, Slack & Email
                  </span>
                </div>
              </div>

              {/* Template Grid */}
              <div style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '10px',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.85rem'
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.75rem' }}>
                  {/* Host / Endpoint */}
                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                      Host / Endpoint URL:
                    </label>
                    <input
                      type="text"
                      value={endpoint}
                      onChange={(e) => setEndpoint(e.target.value)}
                      placeholder="e.g. mysql://db-staging.internal.corp.com:3306"
                      style={{ width: '100%', padding: '7px 10px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '12.5px', color: '#0F172A', background: '#FFFFFF', outline: 'none', fontFamily: 'monospace' }}
                      onFocus={(e) => e.target.style.borderColor = '#ED7D31'}
                      onBlur={(e) => e.target.style.borderColor = '#CBD5E1'}
                    />
                  </div>

                  {/* Auth Method */}
                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                      Auth Method / Protocol:
                    </label>
                    <input
                      type="text"
                      value={authMethod}
                      onChange={(e) => setAuthMethod(e.target.value)}
                      placeholder="e.g. Read-Only DB User + TLS / IAM Role"
                      style={{ width: '100%', padding: '7px 10px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '12.5px', color: '#0F172A', background: '#FFFFFF', outline: 'none' }}
                      onFocus={(e) => e.target.style.borderColor = '#ED7D31'}
                      onBlur={(e) => e.target.style.borderColor = '#CBD5E1'}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.75rem' }}>
                  {/* Username / Account ID */}
                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                      Username / Service Account ID:
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. goml_data_steward_ro"
                      style={{ width: '100%', padding: '7px 10px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '12.5px', color: '#0F172A', background: '#FFFFFF', outline: 'none', fontFamily: 'monospace' }}
                      onFocus={(e) => e.target.style.borderColor = '#ED7D31'}
                      onBlur={(e) => e.target.style.borderColor = '#CBD5E1'}
                    />
                  </div>

                  {/* Secret / Vault Reference */}
                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                      Secret Key / Vault Reference:
                    </label>
                    <input
                      type="text"
                      value={vaultRef}
                      onChange={(e) => setVaultRef(e.target.value)}
                      placeholder="e.g. [Vault: AWS Secrets Manager / 1Password Share]"
                      style={{ width: '100%', padding: '7px 10px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '12.5px', color: '#ED7D31', fontWeight: 600, background: '#FFFFFF', outline: 'none' }}
                      onFocus={(e) => e.target.style.borderColor = '#ED7D31'}
                      onBlur={(e) => e.target.style.borderColor = '#CBD5E1'}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.75rem' }}>
                  {/* Ingress / Whitelisted IP */}
                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                      Network Ingress / Whitelisted IP:
                    </label>
                    <input
                      type="text"
                      value={ingressIp}
                      onChange={(e) => setIngressIp(e.target.value)}
                      placeholder="e.g. 34.120.45.10/32 (goML Staging VPC)"
                      style={{ width: '100%', padding: '7px 10px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '12.5px', color: '#0F172A', background: '#FFFFFF', outline: 'none' }}
                      onFocus={(e) => e.target.style.borderColor = '#ED7D31'}
                      onBlur={(e) => e.target.style.borderColor = '#CBD5E1'}
                    />
                  </div>

                  {/* Environment Scope */}
                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                      Environment & Scope:
                    </label>
                    <input
                      type="text"
                      value={envScope}
                      onChange={(e) => setEnvScope(e.target.value)}
                      placeholder="e.g. Staging Mirror / Schema Audit & Routing Validation"
                      style={{ width: '100%', padding: '7px 10px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '12.5px', color: '#0F172A', background: '#FFFFFF', outline: 'none' }}
                      onFocus={(e) => e.target.style.borderColor = '#ED7D31'}
                      onBlur={(e) => e.target.style.borderColor = '#CBD5E1'}
                    />
                  </div>
                </div>

                {/* Client Sign-off Name */}
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                    Client Technical Lead Sign-off:
                  </label>
                  <input
                    type="text"
                    value={signoffBy}
                    onChange={(e) => setSignoffBy(e.target.value)}
                    placeholder="e.g. Praveen Karuppusamy (Client Technical Lead)"
                    style={{ width: '100%', padding: '7px 10px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '12.5px', color: '#0F172A', background: '#FFFFFF', outline: 'none', fontWeight: 600 }}
                    onFocus={(e) => e.target.style.borderColor = '#ED7D31'}
                    onBlur={(e) => e.target.style.borderColor = '#CBD5E1'}
                  />
                </div>

                {/* Notes */}
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                    Verification Notes / Summary:
                  </label>
                  <textarea
                    value={evidenceNotes}
                    onChange={(e) => setEvidenceNotes(e.target.value)}
                    placeholder="Add verification notes, test output details, or remarks..."
                    rows={2}
                    style={{
                      width: '100%',
                      padding: '7px 10px',
                      border: '1px solid #CBD5E1',
                      borderRadius: '6px',
                      fontSize: '12.5px',
                      color: '#0F172A',
                      background: '#FFFFFF',
                      outline: 'none',
                      resize: 'vertical',
                      fontFamily: 'inherit'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#ED7D31'}
                    onBlur={(e) => e.target.style.borderColor = '#CBD5E1'}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* PROMINENT ONE-CLICK SHARE ACTIONS (TEAMS, SLACK, EMAIL) */}
          <div style={{ border: '1px solid #E2E8F0', borderRadius: '12px', padding: '1.15rem 1.25rem', background: '#ffffff' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ fontWeight: 700, fontSize: '13.5px', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Share2 size={16} color="#ED7D31" />
                <span>Share Delivery Status</span>
              </div>
              <span style={{ fontSize: '11.5px', color: '#64748B', fontWeight: 600 }}>
                1-Click copies formatted table & opens the app
              </span>
            </div>

            {/* 3 Prominent One-Click Share Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
              {/* Teams 1-Click Launch & Copy */}
              <button
                type="button"
                onClick={handleShareTeams}
                style={{
                  background: '#464EB8',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '0.75rem 1rem',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 2px 8px rgba(70, 78, 184, 0.25)',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#3B429F'}
                onMouseOut={(e) => e.currentTarget.style.background = '#464EB8'}
              >
                <TeamsLogo />
                <span>Share to Teams</span>
                <ExternalLink size={13} style={{ opacity: 0.8 }} />
              </button>

              {/* Slack 1-Click Send & Launch */}
              <button
                type="button"
                onClick={handleShareSlack}
                disabled={slackSending}
                style={{
                  background: '#0F172A',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '0.75rem 1rem',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#1E293B'}
                onMouseOut={(e) => e.currentTarget.style.background = '#0F172A'}
              >
                {slackSending ? <Loader2 className="animate-spin" size={14} /> : (slackSuccess ? <Check size={14} color="#10B981" /> : <SlackLogo />)}
                <span>{slackSuccess ? 'Delivered to Slack!' : 'Share to Slack'}</span>
                <ExternalLink size={13} style={{ opacity: 0.8 }} />
              </button>

              {/* Email 1-Click Mailto Launch & Copy */}
              <button
                type="button"
                onClick={handleShareEmail}
                style={{
                  background: '#F8FAFC',
                  color: '#0F172A',
                  border: '1px solid #CBD5E1',
                  borderRadius: '10px',
                  padding: '0.75rem 1rem',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#EDF2F7'}
                onMouseOut={(e) => e.currentTarget.style.background = '#F8FAFC'}
              >
                <Send size={14} color="#ED7D31" />
                <span>Share via Email</span>
                <ExternalLink size={13} style={{ opacity: 0.6 }} />
              </button>
            </div>
          </div>

          {error && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FEE2E2', color: '#DC2626', padding: '8px 12px', borderRadius: '8px', fontSize: '12.5px' }}>
              {error}
            </div>
          )}
        </div>

        {/* 3. FOOTER */}
        <div style={{
          padding: '1rem 1.75rem',
          borderTop: '1px solid #F0ECE8',
          background: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: '#6B7280' }}>Status:</span>
            <span style={{
              background: item.status === 'Verified' ? '#F0FDF4' : item.status === 'Submitted' ? '#FFF7F0' : '#F3F4F6',
              color: item.status === 'Verified' ? '#16A34A' : item.status === 'Submitted' ? '#ED7D31' : '#4B5563',
              border: item.status === 'Verified' ? '1px solid #DCFCE7' : item.status === 'Submitted' ? '1px solid #FCD9C2' : '1px solid #E5E5E5',
              padding: '2px 8px',
              borderRadius: '100px',
              fontSize: '11.5px',
              fontWeight: 700
            }}>
              {item.status}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{ background: '#ffffff', border: '1px solid #E5E7EB', borderRadius: '6px', padding: '0.5rem 1rem', fontSize: '12.5px', fontWeight: 600, color: '#374151', cursor: 'pointer' }}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() => handleSaveAndSync('Submitted')}
              disabled={savingItem}
              style={{
                background: '#ED7D31',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                padding: '0.5rem 1.25rem',
                fontSize: '12.5px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 8px rgba(237, 125, 49, 0.25)'
              }}
            >
              {savingItem ? <Loader2 className="animate-spin" size={13} /> : <Send size={13} />}
              <span>Submit for Engineering Review</span>
            </button>

            <button
              type="button"
              onClick={() => handleSaveAndSync('Verified')}
              disabled={savingItem}
              style={{
                background: '#0F172A',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                padding: '0.5rem 1.15rem',
                fontSize: '12.5px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              title="Directly mark this requirement verified & cleared"
            >
              {savingItem ? <Loader2 className="animate-spin" size={13} /> : <Check size={13} color="#10B981" />}
              <span>Mark Verified</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
