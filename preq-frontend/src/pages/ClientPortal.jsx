import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import {
  CheckCircle2, Clock, Upload, ArrowLeft, ArrowRight,
  FileText, CheckCircle, Loader2, Building2, ShieldCheck,
  ExternalLink, Key, Check, Send, AlertTriangle, Copy,
  Layers, Info, LogOut, Sparkles, CheckSquare, Square,
  Zap, Paperclip, Filter, Search, ArrowUpRight, User, Share2,
  ChevronDown, ChevronRight, HelpCircle, ShieldAlert, KeyRound, Calendar, RefreshCw
} from 'lucide-react';
import { SubmitEvidenceModal } from '../components/SubmitEvidenceModal';
import { WeeklyPlanner } from '../components/WeeklyPlanner';
import { getCredentialGuidance, fetchDynamicCredentialGuidance } from '../utils/credentialGuide';

import { API_URL } from '../apiConfig';

// Official GoML PreQ Logo (NO EMOJIS)
const GoMLPreQLogo = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
    <GoMLWordmark />
    <span style={{
      background: '#ED7D31',
      color: '#ffffff',
      fontSize: '11px',
      fontWeight: 800,
      padding: '2px 8px',
      borderRadius: '6px',
      letterSpacing: '0.04em'
    }}>
      PreQ
    </span>
  </div>
);

// Official GoML Wordmark Logo (NO EMOJIS)
const GoMLWordmark = () => (
  <svg width="68" height="20" viewBox="0 0 117 36" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ verticalAlign: 'middle' }}>
    <path d="M57.4577 20.6304V20.5321H54.6025V20.6216C54.6025 23.0446 52.6117 24.6665 50.049 24.6665C47.4863 24.6665 45.7618 23.0534 45.7618 20.6304C45.7618 18.179 47.4601 16.568 50.049 16.568H50.6362V13.7238H49.99C45.7269 13.7238 42.6403 16.6182 42.6403 20.6304C42.6403 24.8062 45.537 27.4802 50.1035 27.4802C52.6662 27.4802 54.2248 28.5367 54.2248 30.2656C54.2248 32.0184 52.5549 33.1906 50.049 33.1906C47.4317 33.1906 45.7902 31.8525 45.8447 29.8203H42.78C42.6119 33.5224 45.5086 36 50.049 36C54.4758 36 57.3725 33.7734 57.3725 30.2939C57.3725 28.2617 56.1479 26.7293 53.9498 25.9195C56.2331 24.9175 57.4577 23.0817 57.4577 20.6304ZM54.6025 16.568V19.1526H54.6046V16.568H54.6025Z" fill="#111827" />
    <path d="M54.6069 19.1526V16.568H52.018V13.7238H57.4533V18.5588V19.1526H54.6069Z" fill="#ED7D31" />
    <path d="M60.2104 20.8791C60.2104 16.7579 63.0787 13.6953 67.5624 13.6953C72.0176 13.6953 74.8859 16.7579 74.8859 20.8791C74.8859 25.0004 72.0176 28.063 67.5624 28.063C63.0787 28.063 60.2104 25.0004 60.2104 20.8791ZM71.7666 20.8791C71.7666 18.4845 70.1229 16.5352 67.5624 16.5352C64.9735 16.5352 63.3298 18.4845 63.3298 20.8791C63.3298 23.2738 64.9735 25.2231 67.5624 25.2231C70.1251 25.2231 71.7666 23.2738 71.7666 20.8791Z" fill="#111827" />
    <path d="M17.9782 0C8.04827 0 0 8.04825 0 17.9781C0 27.908 8.04827 35.9563 17.9782 35.9563C27.9081 35.9563 35.9564 27.908 35.9564 17.9781C35.9564 8.04825 27.9103 0 17.9782 0ZM20.0235 29.5758H17.2142C10.838 29.5561 5.65365 24.3543 5.65365 17.976C5.65365 11.6413 10.7725 6.46567 17.0898 6.38053V10.6721C13.1366 10.755 9.94083 14.0097 9.94083 17.976C9.94083 21.9466 13.1366 25.1991 17.0898 25.282L18.2489 25.2842L18.286 25.2471L23.2149 20.316L23.4288 20.1064H14.4135V15.8149H23.4288L23.2171 15.6032L18.8382 11.2243L21.8724 8.19014L31.6386 17.9585L20.0235 29.5758Z" fill="#ED7D31" />
    <path d="M98.4652 8.1377V27.7028H95.2237V13.6713L88.4327 22.2805H87.7342L80.9695 13.6997V27.7028H77.6995V8.1377H80.6617L88.0966 17.6135L95.5314 8.1377H98.4652Z" fill="#111827" />
    <path d="M102.562 8.1377H105.832V24.6555H116.147V27.7028H102.562V8.1377Z" fill="#111827" />
  </svg>
);

// Slack Vector Icon (NO EMOJIS)
const SlackLogo = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" fill="#ED7D31" />
  </svg>
);

// Teams Vector Icon (NO EMOJIS)
const TeamsLogo = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19.5 7.5A2.25 2.25 0 1 0 19.5 3a2.25 2.25 0 0 0 0 4.5zM22.5 9h-6a1.5 1.5 0 0 0-1.5 1.5v4.5A4.5 4.5 0 0 0 19.5 19.5h3v-9a1.5 1.5 0 0 0-1.5-1.5z" fill="#FFFFFF"/>
    <path d="M13.5 6A3 3 0 1 0 13.5 0a3 3 0 0 0 0 6zM17.25 8.25h-7.5A2.25 2.25 0 0 0 7.5 10.5v6.75A5.25 5.25 0 0 0 12.75 22.5h4.5v-12a2.25 2.25 0 0 0-2.25-2.25z" fill="#FFFFFF"/>
  </svg>
);

// Helper: Determine precise milestone phase (Pre-Kickoff vs Post-Kickoff Week 1, 2, 3)
const getItemPhase = (item, index) => {
  if (item.is_critical || (item.category === 'Security' || item.category === 'Compliance' || index < 3)) {
    return {
      phase: 'PRE_KICKOFF',
      label: 'Pre-Kickoff',
      sublabel: 'Day-1 Gatekeeper',
      badgeBg: '#FFF7F0',
      badgeColor: '#ED7D31',
      badgeBorder: '#FCD9C2'
    };
  }
  if (index < 6) {
    return {
      phase: 'POST_W1',
      label: 'Post-Kickoff: W1',
      sublabel: 'Week 1 Staging',
      badgeBg: '#EFF6FF',
      badgeColor: '#2563EB',
      badgeBorder: '#BFDBFE'
    };
  }
  if (index < 9) {
    return {
      phase: 'POST_W2',
      label: 'Post-Kickoff: W2',
      sublabel: 'Week 2 Integration',
      badgeBg: '#F5F3FF',
      badgeColor: '#7C3AED',
      badgeBorder: '#DDD6FE'
    };
  }
  return {
    phase: 'POST_W3',
    label: 'Post-Kickoff: W3',
    sublabel: 'Week 3 Sign-Off',
    badgeBg: '#F3F4F6',
    badgeColor: '#4B5563',
    badgeBorder: '#E5E7EB'
  };
};

// Helper: Actionable 3-step guide for client to fulfill the requirement
const getItemSteps = (item) => {
  const name = (item.name || '').toLowerCase();
  const cat = (item.category || '').toLowerCase();

  if (name.includes('key') || name.includes('credential') || name.includes('token') || cat === 'security' || cat === 'integration') {
    return [
      { step: 1, title: 'Locate or Generate Service Credentials', desc: 'Access your cloud portal (GCP, AWS, OpenAI, or 1Password) and provision a dedicated service credential.' },
      { step: 2, title: 'Configure Security & Ingress Whitelisting', desc: 'Enforce read-only scope and whitelist goML staging ingress IP (34.120.45.10/32).' },
      { step: 3, title: 'Submit Details & Complete Verification', desc: 'Click "Provide Handover" below to enter masked credentials or dispatch via Slack/Teams for GoML clearance.' }
    ];
  }
  if (name.includes('spec') || name.includes('schema') || name.includes('diagram') || cat === 'data') {
    return [
      { step: 1, title: 'Export Technical Architecture Artifact', desc: 'Retrieve the latest OpenAPI 3.0 YAML, ER diagram, or data schema dictionary from your repository.' },
      { step: 2, title: 'Verify Data Interfaces & Rate Limits', desc: 'Confirm endpoint contracts, payload schemas, and SLA expectations are accurately documented.' },
      { step: 3, title: 'Upload File or Link Documentation', desc: 'Attach the spec file or provide URL in the Verification workspace to complete this gatekeeper.' }
    ];
  }
  if (name.includes('dpa') || name.includes('compliance') || name.includes('pii') || cat === 'compliance') {
    return [
      { step: 1, title: 'Review & Sign Governance Charter', desc: 'Execute the mutual Data Processing Agreement (DPA) and data retention terms.' },
      { step: 2, title: 'Define PII Masking & Isolation Rules', desc: 'Confirm tenant boundaries and specify masking for sensitive customer PII/PHI.' },
      { step: 3, title: 'Upload Executed Document', desc: 'Upload the signed PDF agreement to unblock production deployment approval.' }
    ];
  }
  return [
    { step: 1, title: 'Review Prerequisite Requirements', desc: 'Examine the required inputs, configuration parameters, and acceptance benchmarks.' },
    { step: 2, title: 'Prepare Necessary Evidence or Sign-Off', desc: 'Assemble configuration screenshots, access tokens, or sponsor authorization.' },
    { step: 3, title: 'Handover & Request Engineering Sign-Off', desc: 'Submit evidence via the workspace or share directly to engineering channels.' }
  ];
};

// Helper: Format and parse markdown bold (**text**), URLs, and code snippets into interactive styled tokens
const renderFormattedInstruction = (text) => {
  if (!text) return null;

  // Split by markdown bold (**text**), URLs (http/https), backticks (`code`), or path tokens
  const regex = /(\*\*[^*]+\*\*|https?:\/\/[^\s,)]+|`[^`]+`|\/[\w/.-]+)/g;
  const parts = text.split(regex);

  return parts.map((part, i) => {
    if (!part) return null;

    // Bold token (**text**) -> styled UI badge
    if (part.startsWith('**') && part.endsWith('**')) {
      const content = part.slice(2, -2);
      return (
        <span
          key={i}
          style={{
            fontWeight: 700,
            color: '#0F172A',
            background: '#F1F5F9',
            border: '1px solid #E2E8F0',
            padding: '1px 6px',
            borderRadius: '4px',
            fontSize: '12px',
            margin: '0 2px',
            display: 'inline-block',
            lineHeight: 1.3
          }}
        >
          {content}
        </span>
      );
    }

    // Monospace code token (`code` or path like /prod/db/creds)
    if (part.startsWith('`') && part.endsWith('`')) {
      const content = part.slice(1, -1);
      return (
        <code
          key={i}
          style={{
            background: '#FFF7F0',
            border: '1px solid #FCD9C2',
            color: '#ED7D31',
            padding: '1px 5px',
            borderRadius: '4px',
            fontSize: '12px',
            fontFamily: 'Consolas, Monaco, monospace',
            margin: '0 2px'
          }}
        >
          {content}
        </code>
      );
    }

    if (part.startsWith('/') && part.includes('/') && !part.includes(' ')) {
      return (
        <code
          key={i}
          style={{
            background: '#FFF7F0',
            border: '1px solid #FCD9C2',
            color: '#ED7D31',
            padding: '1px 5px',
            borderRadius: '4px',
            fontSize: '12px',
            fontFamily: 'Consolas, Monaco, monospace',
            margin: '0 2px'
          }}
        >
          {part}
        </code>
      );
    }

    // URL token -> styled external link
    if (part.startsWith('http://') || part.startsWith('https://')) {
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noreferrer"
          style={{
            color: '#2563EB',
            fontWeight: 600,
            textDecoration: 'underline',
            margin: '0 2px'
          }}
        >
          {part}
        </a>
      );
    }

    return <span key={i}>{part}</span>;
  });
};

// Helper: Make descriptions concise and punchy
const formatConciseDesc = (desc) => {
  if (!desc) return 'Complete and verify this prerequisite deliverable to ensure smooth Day-1 project execution.';
  // Trim to first 2 sentences if overly long
  const sentences = desc.split(/(?<=[.?!])\s+/);
  if (sentences.length > 2) {
    return sentences.slice(0, 2).join(' ');
  }
  return desc;
};

export const ClientPortal = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isInternalPreview = searchParams.get('internal') === 'true';

  const [project, setProject] = useState(null);
  const [checklist, setChecklist] = useState([]);
  const [activeItem, setActiveItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitModalItem, setSubmitModalItem] = useState(null);
  const [filterTab, setFilterTab] = useState('ALL'); // 'ALL' | 'PRE_KICKOFF' | 'POST_W1' | 'POST_W2_3' | 'PENDING' | 'CLEARED'
  const [portalView, setPortalView] = useState('CHECKLIST'); // 'CHECKLIST' | 'PLANNER'
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [globalToast, setGlobalToast] = useState('');
  const [showDelegation, setShowDelegation] = useState(false);
  const [copiedDelegation, setCopiedDelegation] = useState(false);
  const [dynamicGuide, setDynamicGuide] = useState(null);
  const [isScrapingLive, setIsScrapingLive] = useState(false);

  const triggerToast = (msg) => {
    setGlobalToast(msg);
    setTimeout(() => setGlobalToast(''), 3000);
  };

  const handleCopyDelegation = (msg) => {
    if (!msg) return;
    navigator.clipboard.writeText(msg);
    setCopiedDelegation(true);
    triggerToast('Copied ready-to-send IT delegation message!');
    setTimeout(() => setCopiedDelegation(false), 2500);
  };

  const handleRefreshLiveScrape = async () => {
    if (!activeItem) return;
    setIsScrapingLive(true);
    try {
      const fresh = await fetchDynamicCredentialGuidance(activeItem, true);
      if (fresh) {
        setDynamicGuide(fresh);
        triggerToast('Re-scraped official docs & synthesized live instructions!');
      }
    } catch (e) {
      triggerToast('Updated with latest guidance.');
    } finally {
      setIsScrapingLive(false);
    }
  };

  // Asynchronously fetch dynamic web-scraped guide whenever activeItem changes
  useEffect(() => {
    if (activeItem) {
      const local = getCredentialGuidance(activeItem);
      setDynamicGuide(local);
      fetchDynamicCredentialGuidance(activeItem).then(res => {
        if (res) setDynamicGuide(res);
      }).catch(() => {});
    } else {
      setDynamicGuide(null);
    }
  }, [activeItem?.id]);

  const handleToggleCheck = async (e, item) => {
    e.stopPropagation();
    if (item.is_locked) {
      alert("This prerequisite is locked pending completion of earlier dependencies.");
      return;
    }
    const nextStatus = item.status === 'Verified' ? 'Pending' : item.status === 'Submitted' ? 'Verified' : 'Submitted';
    try {
      await axios.put(`${API_URL}/items/${item.id}`, { status: nextStatus });
      fetchProjectData();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || "Could not update status.");
    }
  };

  const fetchProjectData = async () => {
    try {
      const [projRes, checkRes] = await Promise.all([
        axios.get(`${API_URL}/projects/${id}`),
        axios.get(`${API_URL}/projects/${id}/checklist`)
      ]);
      setProject(projRes.data);
      const items = checkRes.data || [];
      setChecklist(items);
      setActiveItem(prev => {
        if (!prev && items.length > 0) return items[0];
        if (prev) {
          const matched = items.find(i => i.id === prev.id);
          return matched || items[0] || null;
        }
        return null;
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectData();
    const interval = setInterval(fetchProjectData, 6000);
    return () => clearInterval(interval);
  }, [id]);

  if (loading && !project) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        background: 'radial-gradient(120% 80% at 50% 0%, #FFF8F3 0%, #FAF5F0 50%, #F5ECE5 100%)',
        fontFamily: 'Inter, sans-serif'
      }}>
        <Loader2 className="animate-spin" size={42} color="#ED7D31" style={{ marginBottom: '1rem' }} />
        <h3 style={{ color: '#111827', fontWeight: 700, letterSpacing: '-0.02em' }}>Loading Client Readiness Checklist...</h3>
        <p style={{ color: '#5E5656', fontSize: '14px' }}>Connecting to Day-1 Verification Engine</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div style={{ padding: '6rem 2rem', textAlign: 'center', fontFamily: 'Inter, sans-serif' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#111827', marginBottom: '8px' }}>Client Portal Initialization</h2>
        <p style={{ color: '#5E5656', maxWidth: '500px', margin: '0 auto 1.5rem auto', fontSize: '14px' }}>
          Connecting to your Day-1 Readiness Checklist workspace. If you just created this project, please refresh or return to registry.
        </p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button onClick={() => fetchProjectData()} className="btn-goml btn-goml-black" style={{ background: '#ED7D31', border: 'none' }}>
            Refresh Portal
          </button>
          <button onClick={() => navigate('/')} className="btn-goml" style={{ background: '#F3F4F6', color: '#111827', border: '1px solid #E5E5E5' }}>
            Go to Projects Registry
          </button>
        </div>
      </div>
    );
  }

  const completedCount = checklist.filter(i => i.status === 'Verified').length;
  const underReviewCount = checklist.filter(i => i.status === 'Submitted' || i.status === 'Verifying').length;
  const pendingCount = checklist.filter(i => i.status === 'Pending' || i.status === 'Rejected').length;
  const progressPct = checklist.length > 0 ? Math.round((completedCount / checklist.length) * 100) : 0;

  // Filter checklist tasks cleanly
  const filteredChecklist = checklist.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (filterTab === 'CRITICAL' || filterTab === 'PRE_KICKOFF') return item.is_critical && item.status !== 'Verified';
    if (filterTab === 'PENDING') return item.status !== 'Verified';
    if (filterTab === 'CLEARED') return item.status === 'Verified';
    return true;
  });

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    triggerToast('Client Portal link copied to clipboard!');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // GLOBAL EXPORT: Full Slack Summary (Markdown format)
  const handleGlobalExportSlack = () => {
    const lines = [
      `*[goML PreQ Readiness Summary] — ${project.name} (${project.client_name})*`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `• *Kick-off SLA Date:* ${project.target_kickoff_date || 'Target Day-1'}`,
      `• *Overall Readiness:* *${progressPct}% Cleared* (${completedCount} of ${checklist.length} Complete)`,
      `• *Pending Gatekeepers:* ${pendingCount} remaining | *Under Review:* ${underReviewCount}`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `*Complete Prerequisite Status Matrix:*`
    ];

    checklist.forEach((item, idx) => {
      const phaseInfo = getItemPhase(item, idx);
      const statusTag = item.status === 'Verified' ? '[CLEARED]' : item.status === 'Submitted' ? '[IN REVIEW]' : '[PENDING]';
      lines.push(`${statusTag} *[${phaseInfo.label}]* *${item.name}* (\`${item.category}\`) — _${item.status}_ (Owner: ${item.owner || 'DevOps'})`);
    });

    lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    lines.push(`*Live Client Portal:* ${window.location.href}`);

    const text = lines.join('\n');
    navigator.clipboard.writeText(text);
    triggerToast('Copied full Checklist summary formatted for Slack!');
  };

  // GLOBAL EXPORT: Full Teams Summary (HTML Rich Table)
  const handleGlobalExportTeams = () => {
    let rows = '';
    checklist.forEach((item, idx) => {
      const phaseInfo = getItemPhase(item, idx);
      const statusColor = item.status === 'Verified' ? '#16A34A' : item.status === 'Submitted' ? '#ED7D31' : '#6B7280';
      rows += `<tr>
        <td style="padding: 7px 10px; border: 1px solid #E5E7EB; font-weight: 700; color: ${phaseInfo.badgeColor};">${phaseInfo.label}</td>
        <td style="padding: 7px 10px; border: 1px solid #E5E7EB;"><strong>${item.name}</strong></td>
        <td style="padding: 7px 10px; border: 1px solid #E5E7EB;">${item.category}</td>
        <td style="padding: 7px 10px; border: 1px solid #E5E7EB;">${item.owner || 'DevOps Lead'}</td>
        <td style="padding: 7px 10px; border: 1px solid #E5E7EB; font-weight: 700; color: ${statusColor};">${item.status}</td>
      </tr>`;
    });

    const htmlTable = `<div style="font-family: 'Segoe UI', Inter, sans-serif; color: #111827;">
      <h3 style="margin: 0 0 6px 0; color: #ED7D31;">[goML PreQ Readiness Summary] — ${project.name} (${project.client_name})</h3>
      <p style="margin: 0 0 10px 0; font-size: 13px; color: #4B5563;">Progress: <strong>${progressPct}% Complete</strong> (${completedCount}/${checklist.length} Verified) | Target Kick-off: <strong>${project.target_kickoff_date || 'Day-1'}</strong></p>
      <table style="border-collapse: collapse; width: 100%; font-size: 12.5px; border: 1px solid #E5E7EB;">
        <thead>
          <tr style="background: #111827; color: #ffffff;">
            <th style="padding: 8px 10px; text-align: left;">PHASE STATUS</th>
            <th style="padding: 8px 10px; text-align: left;">PREREQUISITE DELIVERABLE</th>
            <th style="padding: 8px 10px; text-align: left;">CATEGORY</th>
            <th style="padding: 8px 10px; text-align: left;">OWNER</th>
            <th style="padding: 8px 10px; text-align: left;">STATUS</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
      <p style="margin: 10px 0 0 0; font-size: 12px; color: #6B7280;">Portal: <a href="${window.location.href}">${window.location.href}</a></p>
    </div>`;

    const blob = new Blob([htmlTable], { type: 'text/html' });
    const textBlob = new Blob([checklist.map(i => `${i.name}: ${i.status}`).join('\n')], { type: 'text/plain' });
    
    if (navigator.clipboard && window.ClipboardItem) {
      const clipboardItem = new ClipboardItem({
        'text/html': blob,
        'text/plain': textBlob
      });
      navigator.clipboard.write([clipboardItem]).then(() => {
        triggerToast('Copied full Checklist HTML table ready for Microsoft Teams!');
      }).catch(() => {
        navigator.clipboard.writeText(htmlTable);
        triggerToast('Copied full Teams table markup!');
      });
    } else {
      navigator.clipboard.writeText(htmlTable);
      triggerToast('Copied full Teams table markup!');
    }
  };

  // GLOBAL EXPORT: Full Email Launch & Copy
  const handleGlobalExportEmail = () => {
    const subject = encodeURIComponent(`[PreQ Readiness Manifest] ${project.name} (${project.client_name}) - ${progressPct}% Complete`);
    const bodyLines = [
      `Hi Team,`,
      ``,
      `Here is the complete PreQ Readiness status manifest for ${project.name} (${project.client_name}).`,
      `Overall Readiness: ${progressPct}% Cleared (${completedCount} of ${checklist.length} Complete)`,
      `Target Kick-off Date: ${project.target_kickoff_date || 'Day-1'}`,
      ``,
      `========================================================================`,
      `PRE-REQUISITE CHECKLIST MANIFEST (PRE-KICKOFF VS POST-KICKOFF)`,
      `========================================================================`
    ];

    checklist.forEach((item, idx) => {
      const phaseInfo = getItemPhase(item, idx);
      bodyLines.push(`[${phaseInfo.label}] ${item.name} (${item.category}) — STATUS: ${item.status.toUpperCase()} (Owner: ${item.owner || 'DevOps'})`);
    });

    bodyLines.push(`========================================================================`);
    bodyLines.push(`Live Checklist Workspace: ${window.location.href}`);
    bodyLines.push(``);
    bodyLines.push(`Best regards,`);
    bodyLines.push(`goML AI Engineering`);

    const mailtoUrl = `mailto:${project.client_email || ''}?subject=${subject}&body=${encodeURIComponent(bodyLines.join('\n'))}`;
    window.open(mailtoUrl, '_blank');
    triggerToast('Opened Email draft with full checklist manifest!');
  };

  const activeIndex = activeItem ? checklist.findIndex(i => i.id === activeItem.id) : 0;
  const activePhase = activeItem ? getItemPhase(activeItem, activeIndex >= 0 ? activeIndex : 0) : null;
  const activeSteps = activeItem ? getItemSteps(activeItem) : [];
  const credGuide = dynamicGuide || (activeItem ? getCredentialGuidance(activeItem) : null);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: '#FFFFFF',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      letterSpacing: '-0.015em'
    }}>

      {/* GLOBAL TOAST NOTIFICATION */}
      {globalToast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: 'linear-gradient(135deg, #1E1B2E 0%, #0E0A1A 100%)',
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: '100px',
          fontSize: '13px',
          fontWeight: 700,
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          zIndex: 9999,
          border: '1px solid #ED7D31'
        }}>
          <Sparkles size={16} color="#ED7D31" />
          <span>{globalToast}</span>
        </div>
      )}

      {/* 1. DEDICATED CLIENT TOP NAVBAR (aiMatic by goML branded — NO EMOJIS) */}
      <header style={{
        background: '#ffffff',
        borderBottom: '1px solid #E5E7EB',
        padding: '0 2.5rem',
        height: '68px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
      }}>
        {/* Left: GoML PreQ logo & Client Portal Tag */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <GoMLPreQLogo />
          <div style={{ width: '1px', height: '22px', background: '#E5E7EB' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span style={{
              background: '#FFF7F0',
              color: '#ED7D31',
              border: '1px solid #FCD9C2',
              borderRadius: '100px',
              padding: '3px 12px',
              fontSize: '12px',
              fontWeight: 800,
              letterSpacing: '0.02em',
              textTransform: 'uppercase'
            }}>
              Client Checklist Portal
            </span>
            <span style={{ fontWeight: 700, fontSize: '14px', color: '#111827' }}>
              {project.client_name}
            </span>
          </div>
        </div>

        {/* Center: Target Kick-off SLA */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: '#F9FAFB',
          border: '1px solid #E5E7EB',
          padding: '4px 14px',
          borderRadius: '100px',
          fontSize: '13px'
        }}>
          <Clock size={14} color="#ED7D31" />
          <span style={{ color: '#4B5563' }}>Target Day-1 Kick-off:</span>
          <strong style={{ color: '#111827', fontWeight: 800 }}>{project.target_kickoff_date || 'Day-1'}</strong>
        </div>

        {/* Right: Client Profile Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            background: '#ffffff',
            border: '1px solid #E5E7EB',
            borderRadius: '100px',
            padding: '3px 14px 3px 6px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: '#FFF7F0',
              color: '#ED7D31',
              fontWeight: 700,
              fontSize: '11px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid #FCD9C2'
            }}>
              PK
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
              <span style={{ fontSize: '13px', color: '#111827', fontWeight: 700 }}>Praveen Karuppusamy</span>
              <span style={{ fontSize: '11px', color: '#6B7280' }}>Client Technical Sponsor</span>
            </div>
          </div>

          {isInternalPreview ? (
            <button
              onClick={() => navigate(`/dashboard/${id}`)}
              style={{
                background: '#ffffff',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                padding: '0.45rem 0.85rem',
                fontSize: '12px',
                fontWeight: 600,
                color: '#374151',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
              title="Switch to GoML Team Engineering Cockpit"
            >
              <span>GoML Cockpit</span>
              <ExternalLink size={12} />
            </button>
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              color: '#16A34A',
              background: '#F0FDF4',
              border: '1px solid #DCFCE7',
              padding: '5px 12px',
              borderRadius: '100px',
              fontWeight: 700
            }}>
              <ShieldCheck size={14} color="#16A34A" />
              <span>Verified Client Session</span>
            </div>
          )}
        </div>
      </header>

      {/* 2. STEPPER PROGRESS BAR */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.75rem',
        padding: '1.5rem 1rem 0.75rem',
        flexShrink: 0,
        flexWrap: 'wrap'
      }}>
        <div style={{
          background: '#F9FAFB',
          border: '1px solid #E5E7EB',
          color: '#4B5563',
          borderRadius: '100px',
          padding: '5px 16px',
          fontSize: '13px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '5px'
        }}>
          <Check size={13} strokeWidth={3} color="#10B981" />
          <span>1. Initiative Scope</span>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #1E1B2E 0%, #0E0A1A 100%)',
          border: '1px solid #0E0A1A',
          color: '#ffffff',
          borderRadius: '100px',
          padding: '6px 20px',
          fontSize: '13px',
          fontWeight: 700,
          boxShadow: '0 4px 12px rgba(14, 10, 26, 0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ED7D31' }} />
          <span>2. Client Deliverables Checklist</span>
        </div>

        <div style={{
          background: '#ffffff',
          border: '1px solid #E5E7EB',
          color: '#9CA3AF',
          borderRadius: '100px',
          padding: '5px 16px',
          fontSize: '13px',
          fontWeight: 500
        }}>
          <span>3. Day-1 Kick-off Clearance</span>
        </div>
      </div>

      {/* 3. MAIN CLIENT CHECKLIST (Completely Flat & Seamless Plain UI - No Card Backgrounds) */}
      <main style={{
        maxWidth: '1320px',
        width: '100%',
        margin: '0 auto',
        padding: '1.5rem 2rem 4rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        background: 'transparent'
      }}>

        {/* Hero Section & Global Export Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.25rem', paddingBottom: '1.25rem', borderBottom: '1px solid #E2E8F0' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
              <span style={{
                background: '#FFF7F0',
                color: '#ED7D31',
                border: '1px solid #FCD9C2',
                borderRadius: '100px',
                padding: '2px 10px',
                fontSize: '11px',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.02em'
              }}>
                {project.client_name}
              </span>
              <span style={{
                background: '#F1F5F9',
                color: '#475569',
                borderRadius: '100px',
                padding: '2px 10px',
                fontSize: '11px',
                fontWeight: 600
              }}>
                {project.type}
              </span>
              <span style={{
                background: '#F1F5F9',
                color: '#475569',
                borderRadius: '100px',
                padding: '2px 10px',
                fontSize: '11px',
                fontWeight: 600
              }}>
                {project.deployment}
              </span>
            </div>

            <h1 style={{
              fontSize: '1.85rem',
              fontWeight: 800,
              color: '#0F172A',
              margin: '0 0 0.35rem 0',
              letterSpacing: '-0.025em',
              lineHeight: 1.2
            }}>
              Client Readiness Checklist
            </h1>
            <p style={{
              color: '#475569',
              fontSize: '14px',
              margin: 0,
              lineHeight: 1.55,
              maxWidth: '780px'
            }}>
              {formatConciseDesc(project.description)} Review deliverables, verify requirements, or export status to your engineering channels.
            </p>
          </div>

          {/* GLOBAL EXPORT BUTTONS (SLACK, TEAMS, EMAIL, SHARE) - CLEAN INLINE */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Share2 size={12} color="#ED7D31" /> Export & Share:
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              {/* Global Slack Export */}
              <button
                type="button"
                onClick={handleGlobalExportSlack}
                style={{
                  background: '#1E1E24',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
                title="Copy complete checklist formatted for Slack"
              >
                <SlackLogo />
                <span>Slack</span>
              </button>

              {/* Global Teams Export */}
              <button
                type="button"
                onClick={handleGlobalExportTeams}
                style={{
                  background: '#464EB8',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
                title="Copy complete checklist HTML table for Microsoft Teams"
              >
                <TeamsLogo />
                <span>Teams</span>
              </button>

              {/* Global Email Export */}
              <button
                type="button"
                onClick={handleGlobalExportEmail}
                style={{
                  background: '#ffffff',
                  color: '#0F172A',
                  border: '1px solid #CBD5E1',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
                title="Open email client draft with full checklist"
              >
                <Send size={12} color="#ED7D31" />
                <span>Email</span>
              </button>

              {/* Copy Portal Link */}
              <button
                type="button"
                onClick={handleCopyLink}
                style={{
                  background: '#ffffff',
                  color: '#475569',
                  border: '1px solid #CBD5E1',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title="Copy direct portal link"
              >
                {copiedLink ? <Check size={12} color="#10B981" /> : <Copy size={12} />}
                <span>{copiedLink ? 'Copied' : 'Link'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* PRIMARY VIEW SWITCHER: CHECKLIST VIEW VS WEEKLY PLANNER ROADMAP */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          width: 'fit-content'
        }}>
          <button
            type="button"
            onClick={() => setPortalView('CHECKLIST')}
            style={{
              background: portalView === 'CHECKLIST' ? '#0F172A' : '#F1F5F9',
              color: portalView === 'CHECKLIST' ? '#ffffff' : '#475569',
              border: 'none',
              borderRadius: '8px',
              padding: '7px 16px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease'
            }}
          >
            <CheckSquare size={14} color={portalView === 'CHECKLIST' ? '#ED7D31' : '#64748B'} />
            <span>Checklist Workspace</span>
          </button>

          <button
            type="button"
            onClick={() => setPortalView('PLANNER')}
            style={{
              background: portalView === 'PLANNER' ? '#0F172A' : '#F1F5F9',
              color: portalView === 'PLANNER' ? '#ffffff' : '#475569',
              border: 'none',
              borderRadius: '8px',
              padding: '7px 16px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease'
            }}
          >
            <Calendar size={14} color={portalView === 'PLANNER' ? '#ED7D31' : '#64748B'} />
            <span>Weekly Implementation Planner</span>
            <span style={{
              background: portalView === 'PLANNER' ? '#ED7D31' : '#FFF7F0',
              color: portalView === 'PLANNER' ? '#ffffff' : '#ED7D31',
              border: portalView === 'PLANNER' ? 'none' : '1px solid #FCD9C2',
              fontSize: '10px',
              fontWeight: 700,
              padding: '1px 6px',
              borderRadius: '100px'
            }}>
              SOW Roadmap
            </span>
          </button>
        </div>

        {portalView === 'PLANNER' ? (
          /* WEEKLY PLANNER TIMELINE & EXCEL MATRIX ROADMAP */
          <WeeklyPlanner
            checklist={checklist}
            project={project}
            onProvideHandover={(item) => setSubmitModalItem(item)}
            onToggleCheck={handleToggleCheck}
          />
        ) : (
          /* CLEAN, PLAIN MINIMALIST CHECKLIST VIEW (NO CARDS) */
          <>
              {/* Minimalist Progress & Filter Strip */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem',
              paddingBottom: '0.5rem'
            }}>
              {/* Progress Bar & Counter */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#0F172A' }}>
                    Readiness Progress:
                  </span>
                  <span style={{ fontSize: '13px', color: '#64748B' }}>
                    <strong style={{ color: completedCount === checklist.length ? '#10B981' : '#ED7D31' }}>{completedCount}</strong> of {checklist.length} Complete ({progressPct}%)
                  </span>
                </div>

                <div style={{ flex: '1 1 200px', maxWidth: '300px', height: '6px', background: '#F1F5F9', borderRadius: '100px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${progressPct}%`,
                    height: '100%',
                    background: progressPct === 100 ? '#10B981' : '#ED7D31',
                    borderRadius: '100px',
                    transition: 'width 0.4s ease'
                  }} />
                </div>
              </div>

              {/* 4-Pill Filters & Search - BORDERLESS */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setFilterTab('ALL')}
                    style={{
                      border: 'none',
                      background: filterTab === 'ALL' ? '#0F172A' : '#F1F5F9',
                      color: filterTab === 'ALL' ? '#ffffff' : '#475569',
                      padding: '5px 14px',
                      borderRadius: '100px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    All ({checklist.length})
                  </button>

                  <button
                    onClick={() => setFilterTab('CRITICAL')}
                    style={{
                      border: 'none',
                      background: filterTab === 'CRITICAL' || filterTab === 'PRE_KICKOFF' ? '#DC2626' : '#FEF2F2',
                      color: filterTab === 'CRITICAL' || filterTab === 'PRE_KICKOFF' ? '#ffffff' : '#DC2626',
                      padding: '5px 14px',
                      borderRadius: '100px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <AlertTriangle size={13} color={filterTab === 'CRITICAL' || filterTab === 'PRE_KICKOFF' ? '#ffffff' : '#DC2626'} />
                    <span>Day-1 Blockers ({checklist.filter(i => i.is_critical && i.status !== 'Verified').length})</span>
                  </button>

                  <button
                    onClick={() => setFilterTab('PENDING')}
                    style={{
                      border: 'none',
                      background: filterTab === 'PENDING' ? '#ED7D31' : '#FFF7F0',
                      color: filterTab === 'PENDING' ? '#ffffff' : '#ED7D31',
                      padding: '5px 14px',
                      borderRadius: '100px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Clock size={13} color={filterTab === 'PENDING' ? '#ffffff' : '#ED7D31'} />
                    <span>Need Action ({checklist.filter(i => i.status !== 'Verified').length})</span>
                  </button>

                  <button
                    onClick={() => setFilterTab('CLEARED')}
                    style={{
                      border: 'none',
                      background: filterTab === 'CLEARED' ? '#10B981' : '#F1F5F9',
                      color: filterTab === 'CLEARED' ? '#ffffff' : '#475569',
                      padding: '5px 14px',
                      borderRadius: '100px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <CheckCircle2 size={13} color={filterTab === 'CLEARED' ? '#ffffff' : '#10B981'} />
                    <span>Cleared ({completedCount})</span>
                  </button>
                </div>

                {/* Search */}
                <div style={{ position: 'relative' }}>
                  <Search size={14} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    placeholder="Search deliverables..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      padding: '6px 12px 6px 32px',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '12px',
                      outline: 'none',
                      width: '200px',
                      background: '#F1F5F9',
                      color: '#0F172A'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* ======================================================== */}
            {/* FLAT 2-COLUMN PLAIN WORKSPACE (BORDERLESS, NO CARDS)      */}
            {/* ======================================================== */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(320px, 380px) 1fr',
              gap: '2.5rem',
              alignItems: 'flex-start'
            }}>
              {/* 1. LEFT COLUMN: Flat Deliverables List */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                borderRight: '1px solid #F1F5F9',
                paddingRight: '1.5rem',
                maxHeight: 'calc(100vh - 200px)',
                overflowY: 'auto'
              }}>
                <div style={{
                  padding: '0 4px 8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: '1px solid #F8FAFC'
                }}>
                  <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Deliverables ({filteredChecklist.length})
                  </span>
                  <span style={{ fontSize: '11px', color: '#94A3B8' }}>
                    Click to inspect
                  </span>
                </div>

                {filteredChecklist.map((item) => {
                  const isVerified = item.status === 'Verified';
                  const isSelected = activeItem?.id === item.id;

                  return (
                    <div
                      key={item.id}
                      onClick={() => setActiveItem(item)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '10px',
                        padding: '10px 10px',
                        borderRadius: '8px',
                        borderLeft: isSelected ? '3px solid #ED7D31' : '3px solid transparent',
                        background: isSelected ? '#F8FAFC' : 'transparent',
                        cursor: 'pointer',
                        transition: 'all 0.12s ease',
                        marginBottom: '1px'
                      }}
                      onMouseOver={(e) => {
                        if (!isSelected) e.currentTarget.style.background = '#F8FAFC';
                      }}
                      onMouseOut={(e) => {
                        if (!isSelected) e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                        {/* Circular Checkbox */}
                        <div
                          onClick={(e) => handleToggleCheck(e, item)}
                          title={isVerified ? "Click to mark pending" : "Click to mark verified"}
                          style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            border: isVerified ? 'none' : '2px solid #CBD5E1',
                            background: isVerified ? '#10B981' : 'transparent',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            cursor: 'pointer'
                          }}
                        >
                          {isVerified && <Check size={11} strokeWidth={3} />}
                        </div>

                        {/* Title */}
                        <span style={{
                          fontSize: '13px',
                          fontWeight: isSelected ? 700 : 500,
                          color: isVerified ? '#94A3B8' : '#0F172A',
                          textDecoration: isVerified ? 'line-through' : 'none',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {item.name}
                        </span>
                      </div>

                      {/* Tag */}
                      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {item.is_critical && !isVerified ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '2px',
                            fontSize: '10px',
                            fontWeight: 700,
                            color: '#DC2626',
                            background: '#FEF2F2',
                            padding: '1px 5px',
                            borderRadius: '4px'
                          }}>
                            <AlertTriangle size={9} color="#DC2626" />
                            <span>Day-1</span>
                          </span>
                        ) : (
                          <span style={{ fontSize: '10.5px', color: '#64748B' }}>
                            {item.category}
                          </span>
                        )}
                        {isSelected && <ChevronRight size={13} color="#ED7D31" />}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 2. RIGHT COLUMN: Flat Deliverable Workspace (Direct Canvas) */}
              {activeItem ? (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.25rem'
                }}>
                  {/* Title & Metadata Header (NO EMOJIS, SLEEK ICONS) */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                      {activeItem.status === 'Verified' ? (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: '#ECFDF5',
                          color: '#059669',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          padding: '2px 10px',
                          borderRadius: '100px'
                        }}>
                          <CheckCircle2 size={12} color="#059669" />
                          <span>Verified & Cleared</span>
                        </span>
                      ) : activeItem.status === 'Submitted' ? (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: '#FFF7ED',
                          color: '#ED7D31',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          padding: '2px 10px',
                          borderRadius: '100px'
                        }}>
                          <Clock size={12} color="#ED7D31" />
                          <span>Under Review</span>
                        </span>
                      ) : (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: '#F1F5F9',
                          color: '#475569',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          padding: '2px 10px',
                          borderRadius: '100px'
                        }}>
                          <Clock size={12} color="#475569" />
                          <span>Pending Handover</span>
                        </span>
                      )}

                      <span style={{ fontSize: '12px', color: '#94A3B8' }}>•</span>

                      <span style={{ fontSize: '12px', color: '#475569', fontWeight: 600 }}>
                        {activeItem.category}
                      </span>

                      {activeItem.owner && (
                        <>
                          <span style={{ fontSize: '12px', color: '#94A3B8' }}>•</span>
                          <span style={{ fontSize: '12px', color: '#475569', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <User size={11} /> {activeItem.owner}
                          </span>
                        </>
                      )}

                      <span style={{ fontSize: '12px', color: '#94A3B8' }}>•</span>

                      <span style={{ fontSize: '12px', color: '#64748B' }}>
                        Due {activeItem.due_date || 'Day-1'}
                      </span>

                      {activeItem.is_critical && (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          fontSize: '11px',
                          color: '#DC2626',
                          background: '#FEF2F2',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontWeight: 700
                        }}>
                          <AlertTriangle size={11} color="#DC2626" />
                          <span>Day-1 Gatekeeper</span>
                        </span>
                      )}
                    </div>

                    <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0F172A', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
                      {activeItem.name}
                    </h2>

                    <p style={{ fontSize: '13.5px', color: '#475569', margin: 0, lineHeight: 1.55 }}>
                      {formatConciseDesc(activeItem.description)}
                    </p>
                  </div>

                  {/* Subtle Hairline Divider */}
                  <div style={{ height: '1px', background: '#E2E8F0' }} />

                  {/* Step-by-Step Action Guide (Connected Formatted Stepper) */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                      <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        How to Complete This Requirement
                      </span>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {credGuide?.consoleUrl && (
                          <a
                            href={credGuide.consoleUrl}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              background: '#0F172A',
                              color: '#ffffff',
                              padding: '5px 12px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 600,
                              textDecoration: 'none',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px'
                            }}
                          >
                            <span>Open {credGuide.consoleName || 'Console'}</span>
                            <ArrowUpRight size={13} color="#ED7D31" />
                          </a>
                        )}

                        {credGuide?.sourceDocUrl && (
                          <a
                            href={credGuide.sourceDocUrl}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              background: '#EFF6FF',
                              color: '#2563EB',
                              border: '1px solid #BFDBFE',
                              padding: '5px 10px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 600,
                              textDecoration: 'none'
                            }}
                          >
                            Official Docs ↗
                          </a>
                        )}

                        {credGuide?.delegationMessage && (
                          <button
                            type="button"
                            onClick={() => setShowDelegation(!showDelegation)}
                            style={{
                              background: '#F8FAFC',
                              border: '1px solid #CBD5E1',
                              color: '#475569',
                              padding: '5px 10px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            {showDelegation ? 'Hide IT Request' : 'Delegate to IT Team ↗'}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Connected Formatted Stepper Timeline */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0', marginTop: '4px' }}>
                      {(() => {
                        const stepsList = (credGuide && credGuide.quickSteps?.length > 0)
                          ? credGuide.quickSteps.filter(s => s && (s.action || s.detail))
                          : activeSteps;

                        return stepsList.map((step, idx) => {
                          const isLast = idx === stepsList.length - 1;
                          const stepNum = step.num || (idx + 1);
                          const title = step.action || step.title;
                          const detail = step.detail || step.desc;

                          return (
                            <div key={idx} style={{ display: 'flex', gap: '14px', position: 'relative' }}>
                              {/* Left Column: Number Node + Connector */}
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                                <div style={{
                                  width: '24px',
                                  height: '24px',
                                  borderRadius: '50%',
                                  background: '#FFF7F0',
                                  border: '1.5px solid #FCD9C2',
                                  color: '#ED7D31',
                                  fontSize: '11.5px',
                                  fontWeight: 800,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  boxShadow: '0 1px 3px rgba(237, 125, 49, 0.1)'
                                }}>
                                  {stepNum}
                                </div>
                                {!isLast && (
                                  <div style={{
                                    width: '2px',
                                    flex: 1,
                                    minHeight: '26px',
                                    background: '#F1F5F9',
                                    margin: '4px 0'
                                  }} />
                                )}
                              </div>

                              {/* Right Column: Title & Formatted Description */}
                              <div style={{ paddingBottom: isLast ? '0' : '14px', flex: 1 }}>
                                <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0F172A', marginBottom: '2px' }}>
                                  {renderFormattedInstruction(title)}
                                </div>
                                {detail && (
                                  <div style={{ fontSize: '13px', color: '#475569', lineHeight: 1.6 }}>
                                    {renderFormattedInstruction(detail)}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>

                    {/* IT Delegation Template */}
                    {showDelegation && credGuide?.delegationMessage && (
                      <div style={{
                        background: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                        borderRadius: '6px',
                        padding: '10px 12px',
                        marginTop: '8px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                            Email / Slack Message for IT Admin:
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyDelegation(credGuide.delegationMessage)}
                            style={{
                              background: '#ffffff',
                              border: '1px solid #CBD5E1',
                              borderRadius: '4px',
                              padding: '2px 8px',
                              fontSize: '11px',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            {copiedDelegation ? 'Copied!' : 'Copy Template'}
                          </button>
                        </div>
                        <div style={{ fontFamily: 'monospace', fontSize: '11.5px', color: '#334155', whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>
                          {credGuide.delegationMessage}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Required Artifact Strip */}
                  <div style={{
                    marginTop: '0.25rem',
                    background: '#FFFDFB',
                    border: '1px solid #FCD9C2',
                    borderLeft: '3px solid #ED7D31',
                    borderRadius: '6px',
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px'
                  }}>
                    <FileText size={16} color="#ED7D31" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div style={{ fontSize: '12.5px', color: '#334155', lineHeight: 1.5 }}>
                      <strong style={{ color: '#0F172A', marginRight: '6px' }}>Required Deliverable Proof:</strong>
                      <span>{renderFormattedInstruction(activeItem.expected_evidence)}</span>
                    </div>
                  </div>

                  {/* Clean Action Buttons */}
                  <div style={{
                    paddingTop: '1rem',
                    borderTop: '1px solid #E2E8F0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '0.75rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => setSubmitModalItem(activeItem)}
                        style={{
                          background: '#1E1E24',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '7px 12px',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}
                      >
                        <SlackLogo />
                        <span>Slack</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSubmitModalItem(activeItem)}
                        style={{
                          background: '#464EB8',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '7px 12px',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}
                      >
                        <TeamsLogo />
                        <span>Teams</span>
                      </button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={(e) => handleToggleCheck(e, activeItem)}
                        style={{
                          background: '#F8FAFC',
                          border: '1px solid #CBD5E1',
                          color: '#0F172A',
                          borderRadius: '6px',
                          padding: '7px 14px',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        {activeItem.status === 'Verified' ? 'Mark as Pending' : 'Mark as Verified'}
                      </button>

                      <button
                        type="button"
                        onClick={() => setSubmitModalItem(activeItem)}
                        style={{
                          background: '#ED7D31',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '8px 16px',
                          fontSize: '12.5px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}
                      >
                        <span>Provide Handover & Upload Proof</span>
                        <ArrowRight size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{
                  padding: '3rem 2rem',
                  textAlign: 'center',
                  color: '#64748B',
                  fontSize: '13px'
                }}>
                  Select a prerequisite from the list to view instructions and submit evidence.
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* 4. BOTTOM BRAND FOOTER (GoML Wordmark) */}
      <footer style={{
        textAlign: 'center',
        padding: '1.5rem 1rem 2.5rem',
        fontSize: '13px',
        color: '#6B7280',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px'
      }}>
        <span>An AI engineering system by</span>
        <GoMLWordmark />
      </footer>

      {/* SUBMISSION & VERIFICATION MODAL WORKSPACE */}
      <SubmitEvidenceModal
        isOpen={Boolean(submitModalItem)}
        onClose={() => setSubmitModalItem(null)}
        item={submitModalItem}
        onSubmitted={fetchProjectData}
      />
    </div>
  );
};
