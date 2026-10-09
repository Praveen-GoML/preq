import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import {
  CheckCircle2, Clock, Upload, ArrowLeft, ArrowRight,
  FileText, CheckCircle, Loader2, Building2, ShieldCheck,
  ExternalLink, Key, Check, Send, AlertTriangle, Copy,
  Layers, Info, LogOut, Sparkles, CheckSquare, Square,
  Zap, Paperclip, Filter, Search, ArrowUpRight, User, Share2,
  ChevronDown, ChevronRight, HelpCircle, ShieldAlert, KeyRound, 
  Calendar, RefreshCw, X, Boxes, Settings, Database, Network, FileCheck2
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
      borderRadius: '4px',
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

// Helper: Actionable 3-step guide for client to fulfill the requirement
const getItemSteps = (item) => {
  const name = (item.name || '').toLowerCase();
  const cat = (item.category || '').toLowerCase();

  if (name.includes('key') || name.includes('credential') || name.includes('token') || name.includes('bedrock') || name.includes('iam') || cat === 'security' || cat === 'integration') {
    return [
      { step: 1, title: 'Locate or Generate Service Credentials', desc: 'Access your cloud portal (AWS, GCP, OpenAI, or 1Password) and provision a dedicated service credential.' },
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

  const regex = /(\*\*[^*]+\*\*|https?:\/\/[^\s,)]+|`[^`]+`|\/[\w/.-]+)/g;
  const parts = text.split(regex);

  return parts.map((part, i) => {
    if (!part) return null;

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

// Helper: format kickoff date to "Oct 22, 2026" style matching screenshot
const formatKickoffDate = (dateStr) => {
  try {
    const d = dateStr ? new Date(dateStr) : new Date('2026-10-22');
    if (isNaN(d.getTime())) return 'Oct 22, 2026';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch (e) {
    return 'Oct 22, 2026';
  }
};

export const ClientPortal = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [project, setProject] = useState(null);
  const [checklist, setChecklist] = useState([]);
  const [activeItem, setActiveItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitModalItem, setSubmitModalItem] = useState(null);
  const [filterTab, setFilterTab] = useState('ALL'); // 'ALL' | 'BLOCKERS' | 'PENDING' | 'CLEARED'
  const [portalView, setPortalView] = useState(() => searchParams.get('tab') === 'checklist' ? 'CHECKLIST' : 'PLANNER'); // 'CHECKLIST' | 'PLANNER'
  const [activeSubTab, setActiveSubTab] = useState('Overview'); // 'Overview' | 'Scope of Work' | 'Architecture' | 'Milestones' | 'Team' | 'Artifacts'
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [globalToast, setGlobalToast] = useState('');
  const [showDelegation, setShowDelegation] = useState(false);
  const [copiedDelegation, setCopiedDelegation] = useState(false);
  const [dynamicGuide, setDynamicGuide] = useState(null);

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
    e?.stopPropagation();
    if (item.is_locked) {
      alert("This prerequisite is locked pending completion of earlier dependencies.");
      return;
    }

    // If milestone is already verified by goML Engineering
    if (item.status === 'Verified') {
      triggerToast('Milestone is verified & cleared by goML Engineering.');
      return;
    }

    // Client transitions between Pending and Submitted (In Review for goML)
    const nextStatus = item.status === 'Submitted' ? 'Pending' : 'Submitted';
    try {
      await axios.put(`${API_URL}/items/${item.id}`, { status: nextStatus });
      fetchProjectData();
      if (nextStatus === 'Submitted') {
        triggerToast(`Submitted "${item.name}" for goML Engineering review!`);
      } else {
        triggerToast(`Moved "${item.name}" back to Pending.`);
      }
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
    let isMounted = true;
    fetchProjectData();
    const interval = setInterval(() => {
      if (isMounted) fetchProjectData();
    }, 2000);

    const onFocus = () => {
      if (isMounted) fetchProjectData();
    };
    window.addEventListener('focus', onFocus);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [id]);

  if (loading && !project) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        background: '#F8FAFC',
        fontFamily: 'Inter, sans-serif'
      }}>
        <Loader2 className="animate-spin" size={42} color="#ED7D31" style={{ marginBottom: '1rem' }} />
        <h3 style={{ color: '#0F172A', fontWeight: 800, letterSpacing: '-0.02em' }}>Loading Client Readiness Checklist...</h3>
        <p style={{ color: '#64748B', fontSize: '14px' }}>Connecting to Day-1 Verification Engine</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div style={{ padding: '6rem 2rem', textAlign: 'center', fontFamily: 'Inter, sans-serif' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>Client Portal Initialization</h2>
        <p style={{ color: '#64748B', maxWidth: '500px', margin: '0 auto 1.5rem auto', fontSize: '14px' }}>
          Connecting to your Day-1 Readiness Checklist workspace. If you just created this project, please refresh or return to registry.
        </p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button onClick={() => fetchProjectData()} style={{ background: '#ED7D31', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '9999px', fontWeight: 700, cursor: 'pointer' }}>
            Refresh Portal
          </button>
          <button onClick={() => navigate('/')} style={{ background: '#F1F5F9', color: '#0F172A', border: '1px solid #CBD5E1', padding: '10px 20px', borderRadius: '9999px', fontWeight: 700, cursor: 'pointer' }}>
            Go to Projects Registry
          </button>
        </div>
      </div>
    );
  }

  const completedCount = checklist.filter(i => i.status === 'Verified').length;
  const criticalBlockersCount = checklist.filter(i => i.is_critical && i.status !== 'Verified').length;
  const pendingCount = checklist.filter(i => i.status !== 'Verified').length;
  const progressPct = checklist.length > 0 ? Math.round((completedCount / checklist.length) * 100) : 0;
  const totalWeeks = 4;
  const avgVelocity = checklist.length > 0 ? (checklist.length / totalWeeks).toFixed(1) : '2.2';

  // Filter checklist tasks cleanly
  const filteredChecklist = checklist.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (filterTab === 'BLOCKERS') return item.is_critical && item.status !== 'Verified';
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
      `• *Pending Gatekeepers:* ${pendingCount} remaining | *Critical Blockers:* ${criticalBlockersCount}`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `*Complete Prerequisite Status Matrix:*`
    ];

    checklist.forEach((item) => {
      const statusTag = item.status === 'Verified' ? '[CLEARED]' : item.status === 'Submitted' ? '[IN REVIEW]' : '[PENDING]';
      lines.push(`${statusTag} *${item.name}* (\`${item.category}\`) — _${item.status}_ (Owner: ${item.owner || 'DevOps'})`);
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
    checklist.forEach((item) => {
      const statusColor = item.status === 'Verified' ? '#16A34A' : item.status === 'Submitted' ? '#ED7D31' : '#6B7280';
      rows += `<tr>
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
      `PRE-REQUISITE CHECKLIST MANIFEST`,
      `========================================================================`
    ];

    checklist.forEach((item) => {
      bodyLines.push(`[${item.is_critical ? 'DAY-1' : 'STAGING'}] ${item.name} (${item.category}) — STATUS: ${item.status.toUpperCase()} (Owner: ${item.owner || 'DevOps'})`);
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

  const credGuide = dynamicGuide || (activeItem ? getCredentialGuidance(activeItem) : null);
  const activeSteps = credGuide?.quickSteps?.map(s => ({ step: s.num, title: s.action, desc: s.detail })) || (activeItem ? getItemSteps(activeItem) : []);

  // Compute initials
  const clientInitials = (project.client_name || 'Client Sponsor')
    .split(' ')
    .filter(Boolean)
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'CS';

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: '#F8FAFC',
      fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: '#0F172A'
    }}>

      {/* GLOBAL TOAST NOTIFICATION */}
      {globalToast && (
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
          <span>{globalToast}</span>
        </div>
      )}

      {/* BEGIN: TopNavigation (Header) */}
      {/* BEGIN: TopNavigation (Header) */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        background: '#FFFFFF',
        borderBottom: '1px solid #E2E8F0',
        boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
      }}>
        <div style={{
          maxWidth: '1720px',
          margin: '0 auto',
          padding: '0 1.5rem',
          height: '56px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.25rem'
        }}>
          {/* Left side: Logo, Client, Kickoff Date, Top Nav Links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
              <GoMLPreQLogo />
            </Link>

            <div style={{ height: '14px', width: '1px', background: '#E2E8F0' }} />

            {/* Client Name & Kickoff Date */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                fontSize: '13.5px',
                fontWeight: 700,
                color: '#0F172A',
                letterSpacing: '-0.01em'
              }}>
                {project.client_name || 'MovilVentas'}
              </span>

              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '11.5px',
                color: '#64748B',
                fontWeight: 500,
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                padding: '2px 8px',
                borderRadius: '4px'
              }}>
                <Calendar size={12} color="#94A3B8" />
                <span>Kick-off {formatKickoffDate(project.target_kickoff_date)}</span>
              </div>
            </div>

            <div style={{ height: '14px', width: '1px', background: '#E2E8F0' }} />

            {/* In-header Navigation Tabs */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
              <button
                type="button"
                onClick={() => { setActiveSubTab('Overview'); setPortalView('CHECKLIST'); }}
                style={{
                  background: activeSubTab === 'Overview' && portalView === 'CHECKLIST' ? '#09090B' : 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 14px',
                  fontWeight: activeSubTab === 'Overview' && portalView === 'CHECKLIST' ? 700 : 500,
                  color: activeSubTab === 'Overview' && portalView === 'CHECKLIST' ? '#FFFFFF' : '#64748B',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                Overview
              </button>

              <button
                type="button"
                onClick={() => { setActiveSubTab('Implementation Planner'); setPortalView('PLANNER'); }}
                style={{
                  background: portalView === 'PLANNER' || activeSubTab === 'Implementation Planner' ? '#09090B' : 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 14px',
                  fontWeight: portalView === 'PLANNER' || activeSubTab === 'Implementation Planner' ? 700 : 500,
                  color: portalView === 'PLANNER' || activeSubTab === 'Implementation Planner' ? '#FFFFFF' : '#64748B',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                Implementation Planner
              </button>

              <button
                type="button"
                onClick={() => { setActiveSubTab('Technical Scope'); setPortalView('CHECKLIST'); }}
                style={{
                  background: activeSubTab === 'Technical Scope' ? '#09090B' : 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 14px',
                  fontWeight: activeSubTab === 'Technical Scope' ? 700 : 500,
                  color: activeSubTab === 'Technical Scope' ? '#FFFFFF' : '#64748B',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                Technical Scope
              </button>

              <button
                type="button"
                onClick={() => { setActiveSubTab('Architecture'); setPortalView('CHECKLIST'); }}
                style={{
                  background: activeSubTab === 'Architecture' ? '#09090B' : 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 14px',
                  fontWeight: activeSubTab === 'Architecture' ? 700 : 500,
                  color: activeSubTab === 'Architecture' ? '#FFFFFF' : '#64748B',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                Architecture
              </button>
            </div>
          </div>

          {/* Right side: Sponsor profile, session verification, action icons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Client Sponsor Tag */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              color: '#334155',
              padding: '4px 12px',
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '9999px'
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ED7D31', display: 'inline-block' }} />
              <strong style={{ color: '#0F172A' }}>{project.client_name || 'MovilVentas'}</strong>
              <span style={{ color: '#64748B' }}>• Client Sponsor</span>
            </div>

            {/* Verification Status */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: '9999px',
              border: '1px solid #E2E8F0',
              background: '#FFFFFF',
              color: '#0F172A',
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '0.04em'
            }}>
              <CheckCircle size={13} color="#000000" strokeWidth={2.5} />
              <span>VERIFIED SESSION</span>
            </div>

            {/* Slack / Hash Button */}
            <button
              type="button"
              onClick={handleGlobalExportSlack}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '30px',
                height: '30px',
                background: '#FFFFFF',
                color: '#64748B',
                borderRadius: '6px',
                border: '1px solid #E2E8F0',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 700
              }}
              title="Share Slack Report"
            >
              #
            </button>

            {/* Alert / Bell Button */}
            <button
              type="button"
              onClick={() => {}}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '30px',
                height: '30px',
                background: '#FFFFFF',
                color: '#64748B',
                borderRadius: '6px',
                border: '1px solid #E2E8F0',
                cursor: 'pointer'
              }}
              title="Alerts"
            >
              <AlertTriangle size={13} color="#64748B" />
            </button>

            {/* Share Link Button */}
            <button
              type="button"
              onClick={handleCopyLink}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '30px',
                height: '30px',
                background: '#FFFFFF',
                color: '#64748B',
                borderRadius: '6px',
                border: '1px solid #E2E8F0',
                cursor: 'pointer'
              }}
              title="Share Portal Link"
            >
              {copiedLink ? <Check size={13} color="#16A34A" /> : <Share2 size={13} color="#64748B" />}
            </button>

            {/* User Profile Avatar in Black Circle with Initials */}
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: '#09090B',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer',
              letterSpacing: '0.02em'
            }}>
              {clientInitials || 'MV'}
            </div>
          </div>
        </div>
      </header>

      {/* BEGIN: MainContentArea */}
      <main style={{
        flex: 1,
        maxWidth: '1440px',
        width: '100%',
        margin: '0 auto',
        padding: '1.75rem 2rem 3rem 2rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.75rem',
        boxSizing: 'border-box'
      }}>

        {/* Dynamic View: Weekly Implementation Planner vs Checklist Workspace */}
        {portalView === 'PLANNER' ? (
          <WeeklyPlanner
            project={project}
            checklist={checklist}
            onItemUpdated={fetchProjectData}
            onOpenSubmitModal={(item) => setSubmitModalItem(item)}
            onProvideHandover={(item) => setSubmitModalItem(item)}
            onToggleCheck={handleToggleCheck}
            onSwitchToChecklist={() => setPortalView('CHECKLIST')}
            portalView={portalView}
          />
        ) : (
          <>
            {/* 1. TOP HERO CARD (Pre-Kickoff Client Readiness) */}
            <section style={{
              background: '#FFFFFF',
              borderRadius: '12px',
              border: '1px solid #E4E4E7',
              padding: '1.75rem 2rem',
              boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '2rem',
              flexWrap: 'wrap'
            }}>
              {/* Left Side Scope & Narrative */}
              <div style={{ flex: 1, minWidth: '320px' }}>
                <div style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  color: '#71717A',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  marginBottom: '6px'
                }}>
                  SCOPE REF: {project.sow_ref || 'SOW-MV-2026-V2.4'} &bull; {project.type ? project.type.toUpperCase() : 'BEDROCK LLM ROUTING AGENT'}
                </div>
                <h1 style={{
                  fontSize: '1.85rem',
                  fontWeight: 800,
                  color: '#09090B',
                  margin: '0 0 6px 0',
                  letterSpacing: '-0.025em',
                  lineHeight: 1.2
                }}>
                  Pre-Kickoff Client Readiness
                </h1>
                <p style={{
                  fontSize: '13.5px',
                  color: '#71717A',
                  margin: 0,
                  lineHeight: 1.5,
                  maxWidth: '680px'
                }}>
                  All Day-1 blockers must be submitted and validated 48 hours prior to joint architectural sprint zero.
                </p>
              </div>

              {/* Right Side KPIs */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem', flexShrink: 0 }}>
                {/* Vertical Divider */}
                <div style={{ height: '60px', width: '1px', background: '#F4F4F5' }} />

                {/* Overall Clearance */}
                <div>
                  <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#71717A', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>
                    OVERALL CLEARANCE
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                    <span style={{ fontSize: '1.45rem', fontWeight: 800, color: '#09090B' }}>
                      {completedCount} <span style={{ fontSize: '1.1rem', fontWeight: 600, color: '#71717A' }}>/ {checklist.length} Cleared</span>
                    </span>
                  </div>
                  <div style={{ fontSize: '12.5px', color: '#71717A', fontWeight: 600, marginTop: '2px' }}>
                    ({progressPct}%)
                  </div>
                </div>

                {/* Vertical Divider */}
                <div style={{ height: '60px', width: '1px', background: '#F4F4F5' }} />

                {/* Day-1 Blockers */}
                <div>
                  <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#71717A', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                    DAY-1 BLOCKERS
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#ED7D31', display: 'inline-block' }} />
                    <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ED7D31' }}>
                      {criticalBlockersCount} Critical Pending
                    </span>
                  </div>
                  {/* Mini Progress Bar */}
                  <div style={{
                    width: '130px',
                    height: '6px',
                    background: '#E4E4E7',
                    borderRadius: '9999px',
                    marginTop: '6px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${checklist.length ? Math.round(((checklist.length - criticalBlockersCount) / checklist.length) * 100) : 0}%`,
                      height: '100%',
                      background: '#ED7D31',
                      borderRadius: '9999px'
                    }} />
                  </div>
                </div>
              </div>
            </section>

            {/* View Switcher Bar (Checklist vs Implementation Planner vs Technical Scope) */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              flexWrap: 'wrap'
            }}>
              <div style={{
                display: 'inline-flex',
                padding: '3px',
                background: '#FFFFFF',
                borderRadius: '9999px',
                border: '1px solid #E4E4E7',
                gap: '3px'
              }}>
                <button
                  type="button"
                  onClick={() => { setPortalView('CHECKLIST'); setActiveSubTab('Overview'); }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 16px',
                    borderRadius: '9999px',
                    background: portalView === 'CHECKLIST' && activeSubTab === 'Overview' ? '#09090B' : 'transparent',
                    color: portalView === 'CHECKLIST' && activeSubTab === 'Overview' ? '#FFFFFF' : '#71717A',
                    fontSize: '12px',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <CheckSquare size={13} />
                  <span>Deliverables Checklist</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setPortalView('PLANNER'); setActiveSubTab('Implementation Planner'); }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 16px',
                    borderRadius: '9999px',
                    background: portalView === 'PLANNER' || activeSubTab === 'Implementation Planner' ? '#09090B' : 'transparent',
                    color: portalView === 'PLANNER' || activeSubTab === 'Implementation Planner' ? '#FFFFFF' : '#71717A',
                    fontSize: '12px',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Calendar size={13} />
                  <span>Implementation Planner</span>
                </button>
              </div>

              <div style={{ fontSize: '12px', color: '#71717A', fontWeight: 600 }}>
                {checklist.length} total milestones &bull; {criticalBlockersCount} Day-1 blockers
              </div>
            </div>

            {/* 2. CATEGORY-GROUPED DELIVERABLES CHECKLIST (Matching exact Screenshot Cards) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
              {filteredChecklist.length === 0 ? (
                <div style={{
                  background: '#FFFFFF',
                  borderRadius: '12px',
                  border: '1px solid #E4E4E7',
                  padding: '3.5rem 2rem',
                  textAlign: 'center',
                  color: '#71717A',
                  fontSize: '13.5px'
                }}>
                  No deliverables match your criteria.
                </div>
              ) : (
                (() => {
                  const categories = Array.from(new Set(filteredChecklist.map(i => i.category || 'General')));

                  return categories.map((catName) => {
                    const catItems = filteredChecklist.filter(i => (i.category || 'General') === catName);
                    const catCompleted = catItems.filter(i => i.status === 'Verified').length;

                    return (
                      <div key={catName} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {/* Category Header Row */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0 4px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '15px', fontWeight: 800, color: '#09090B' }}>
                              {catName}
                            </span>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 600,
                              color: '#71717A',
                              background: '#F4F4F5',
                              border: '1px solid #E4E4E7',
                              padding: '2px 8px',
                              borderRadius: '4px'
                            }}>
                              {catItems.length} {catItems.length === 1 ? 'item' : 'items'}
                            </span>
                          </div>

                          <span style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            color: '#71717A',
                            background: '#F4F4F5',
                            border: '1px solid #E4E4E7',
                            padding: '2px 10px',
                            borderRadius: '4px'
                          }}>
                            {catCompleted} / {catItems.length} Cleared
                          </span>
                        </div>

                        {/* Individual Cards for each item */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {catItems.map((item, idx) => {
                            const isDone = item.status === 'Verified';
                            const guideTitle = item.guideTitle ||
                              (item.name.toLowerCase().includes('whitelist') ? 'Whitelisting SOP' :
                               item.name.toLowerCase().includes('sql') ? 'Connection Guide' :
                               item.name.toLowerCase().includes('role') || item.name.toLowerCase().includes('iam') ? 'IAM Role SOP' : 'Credential Guide');

                            return (
                              <div
                                key={item.id || idx}
                                onClick={() => setSubmitModalItem(item)}
                                style={{
                                  background: '#FFFFFF',
                                  border: '1px solid #E4E4E7',
                                  borderRadius: '10px',
                                  padding: '14px 20px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  gap: '16px',
                                  cursor: 'pointer',
                                  boxShadow: '0 1px 2px rgba(0,0,0,0.01)',
                                  transition: 'border-color 0.15s ease, box-shadow 0.15s ease'
                                }}
                                onMouseOver={(e) => { e.currentTarget.style.borderColor = '#CBD5E1'; e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.04)'; }}
                                onMouseOut={(e) => { e.currentTarget.style.borderColor = '#E4E4E7'; e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.01)'; }}
                              >
                                {/* Left Icon + Metadata */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0, flex: 1 }}>
                                  {/* Square status icon */}
                                  <div style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '8px',
                                    background: isDone ? '#F4F4F5' : '#FFF7ED',
                                    border: isDone ? '1px solid #E4E4E7' : '1px solid #FFEDD5',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                  }}>
                                    {isDone ? (
                                      <Check size={14} color="#18181B" strokeWidth={2.5} />
                                    ) : (
                                      <Clock size={15} color="#ED7D31" />
                                    )}
                                  </div>

                                  <div style={{ minWidth: 0, flex: 1 }}>
                                    {/* Title & inline tags */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                      <span style={{
                                        fontSize: '13.5px',
                                        fontWeight: 700,
                                        color: '#09090B'
                                      }}>
                                        {item.name}
                                      </span>

                                      {/* Category tag */}
                                      <span style={{
                                        fontSize: '11px',
                                        fontWeight: 600,
                                        color: '#52525B',
                                        background: '#F4F4F5',
                                        border: '1px solid #E4E4E7',
                                        padding: '1px 7px',
                                        borderRadius: '4px'
                                      }}>
                                        {item.category || 'General'}
                                      </span>

                                      {/* Day-1 Blocker tag */}
                                      {item.is_critical && (
                                        <span style={{
                                          fontSize: '11px',
                                          fontWeight: isDone ? 500 : 700,
                                          color: isDone ? '#A1A1AA' : '#ED7D31',
                                          background: isDone ? 'transparent' : '#FFF7ED',
                                          border: isDone ? 'none' : '1px solid #FFEDD5',
                                          padding: isDone ? '0' : '1px 7px',
                                          borderRadius: '4px',
                                          textDecoration: isDone ? 'line-through' : 'none',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '4px'
                                        }}>
                                          {!isDone && <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#ED7D31' }} />}
                                          Day-1 Blocker
                                        </span>
                                      )}

                                      {/* Submitted for Engineering Review tag */}
                                      {!isDone && item.status === 'Submitted' && (
                                        <span style={{
                                          fontSize: '11px',
                                          fontWeight: 700,
                                          color: '#EA580C',
                                          background: '#FFF7ED',
                                          border: '1px solid #FED7AA',
                                          padding: '1px 8px',
                                          borderRadius: '4px',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '4px'
                                        }}>
                                          <Clock size={11} color="#EA580C" />
                                          <span>In Review</span>
                                        </span>
                                      )}

                                      {/* Evidence Attached tag */}
                                      {item.evidence_file && (
                                        <span style={{
                                          fontSize: '11px',
                                          fontWeight: 600,
                                          color: '#0F172A',
                                          background: '#F1F5F9',
                                          border: '1px solid #CBD5E1',
                                          padding: '1px 7px',
                                          borderRadius: '4px',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '3px'
                                        }}>
                                          <span>📎 Proof Attached</span>
                                        </span>
                                      )}

                                      {/* Verified by goML tag */}
                                      {isDone && (
                                        <span style={{
                                          fontSize: '11px',
                                          fontWeight: 700,
                                          color: '#18181B',
                                          background: '#F4F4F5',
                                          border: '1px solid #E4E4E7',
                                          padding: '1px 8px',
                                          borderRadius: '4px',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '4px'
                                        }}>
                                          <Check size={11} strokeWidth={3} />
                                          <span>Verified by goML</span>
                                        </span>
                                      )}
                                    </div>

                                    {/* Subtitle / metadata */}
                                    <div style={{
                                      fontSize: '12px',
                                      color: '#71717A',
                                      marginTop: '3px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '6px',
                                      flexWrap: 'wrap'
                                    }}>
                                      <span>{item.owner || 'Data Steward'}</span>
                                      <span>&bull;</span>
                                      <span>Due {item.due_date || '2026-10-19'}</span>
                                      <span>&bull;</span>
                                      <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); setSubmitModalItem(item); }}
                                        style={{
                                          background: 'none',
                                          border: 'none',
                                          padding: 0,
                                          color: '#09090B',
                                          fontSize: '12px',
                                          fontWeight: 600,
                                          cursor: 'pointer',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '3px'
                                        }}
                                      >
                                        <span>{guideTitle}</span>
                                        <ArrowUpRight size={11} />
                                      </button>
                                    </div>
                                  </div>
                                </div>

                                {/* Right Action Button */}
                                <div style={{ flexShrink: 0 }}>
                                  {isDone ? (
                                    <button
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); setSubmitModalItem(item); }}
                                      style={{
                                        background: '#FFFFFF',
                                        color: '#09090B',
                                        border: '1px solid #E4E4E7',
                                        borderRadius: '9999px',
                                        padding: '6px 18px',
                                        fontSize: '12px',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                      }}
                                    >
                                      <Check size={12} strokeWidth={2.5} />
                                      <span>Cleared</span>
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); setSubmitModalItem(item); }}
                                      style={{
                                        background: '#000000',
                                        color: '#FFFFFF',
                                        border: 'none',
                                        borderRadius: '9999px',
                                        padding: '8px 20px',
                                        fontSize: '12.5px',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                                        transition: 'all 0.15s ease'
                                      }}
                                      onMouseOver={(e) => e.currentTarget.style.background = '#18181B'}
                                      onMouseOut={(e) => e.currentTarget.style.background = '#000000'}
                                    >
                                      <span>Review Handover</span>
                                      <ArrowRight size={12} />
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  });
                })()
              )}
            </div>
          </>
        )}
      </main>

      {/* BEGIN: SiteFooter matching screenshot */}
      <footer style={{
        marginTop: 'auto',
        borderTop: '1px solid #E4E4E7',
        background: '#FFFFFF',
        padding: '1.25rem 2rem'
      }}>
        <div style={{
          maxWidth: '1440px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          fontSize: '12px',
          color: '#71717A'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#ED7D31', display: 'inline-block' }} />
            <strong style={{ color: '#09090B' }}>GOML PREQ DELIVERY PROTOCOL</strong>
            <span>&mdash; Verified Pre-Kickoff Protocol v4.8</span>
          </div>

          <div>
            An AI engineering delivery management system by goML. All telemetry secured.
          </div>
        </div>
      </footer>

      {/* EVIDENCE SUBMISSION & HANDOVER MODAL */}
      <SubmitEvidenceModal
        isOpen={!!submitModalItem}
        onClose={() => setSubmitModalItem(null)}
        item={submitModalItem}
        onSubmitted={() => {
          fetchProjectData();
          triggerToast('Evidence submitted successfully! Dispatched to goML Engineering.');
        }}
      />
    </div>
  );
};
