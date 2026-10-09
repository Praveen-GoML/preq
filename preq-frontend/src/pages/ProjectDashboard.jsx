import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  CheckCircle, Clock, AlertTriangle, Upload, Plus, 
  ExternalLink, Lock, Sparkles, Award, Search, 
  CheckCircle2, XCircle, FileText, Send, Loader2, ChevronDown, ChevronUp, ArrowRight, Key,
  Building2, Copy, Calendar, Layers, Zap, ListChecks, Check, ShieldCheck, Filter, Eye, Download, RefreshCw
} from 'lucide-react';
import { API_URL } from '../apiConfig';
import { SubmitEvidenceModal } from '../components/SubmitEvidenceModal';
import { ViewProofModal } from '../components/ViewProofModal';
import { AddItemModal } from '../components/AddItemModal';
import { EscalateModal } from '../components/EscalateModal';
import { RejectModal } from '../components/RejectModal';
import { WeeklyPlanner } from '../components/WeeklyPlanner';

import { BRDViewerModal } from '../components/BRDViewerModal';

const WordIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
    <rect x="2" y="2" width="20" height="20" rx="4" fill="#185ABD"/>
    <path d="M6.5 7.5L8.8 16.5H10.8L12.3 11.2L13.8 16.5H15.8L18.1 7.5H16.1L14.6 13.8L13.1 7.5H11.5L10 13.8L8.5 7.5H6.5Z" fill="white"/>
  </svg>
);

const ExcelIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
    <rect x="2" y="2" width="20" height="20" rx="4" fill="#107C41"/>
    <path d="M7 7.5L10.5 12L7 16.5H9.3L11.7 13.3L14.1 16.5H16.4L12.9 12L16.4 7.5H14.1L11.7 10.7L9.3 7.5H7Z" fill="white"/>
  </svg>
);

export const ProjectDashboard = ({ onOpenCopilot }) => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [checklist, setChecklist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [onlyCritical, setOnlyCritical] = useState(false);
  const [expandedItemId, setExpandedItemId] = useState(null);
  const [dashboardView, setDashboardView] = useState('SIMPLE'); // 'SIMPLE' | 'MATRIX' | 'PLANNER'

  // Modals & UI action states
  const [submitModalItem, setSubmitModalItem] = useState(null);
  const [viewProofModalItem, setViewProofModalItem] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBrdModalOpen, setIsBrdModalOpen] = useState(false);
  const [escalateModalItem, setEscalateModalItem] = useState(null);
  const [rejectModalItem, setRejectModalItem] = useState(null);
  const [fetchError, setFetchError] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [internalSignoffLoading, setInternalSignoffLoading] = useState(false);
  const [verifyingId, setVerifyingId] = useState(null);

  const fetchProjectData = async (retryCount = 0) => {
    try {
      const [projRes, checkRes] = await Promise.all([
        axios.get(`${API_URL}/projects/${id}`),
        axios.get(`${API_URL}/projects/${id}/checklist`)
      ]);
      setProject(projRes.data);
      setChecklist(Array.isArray(checkRes.data) ? checkRes.data : []);
      setFetchError(false);
      setLoading(false);
    } catch (err) {
      if (axios.isCancel(err) || err.name === 'CanceledError' || err.code === 'ERR_CANCELED') {
        return;
      }
      console.warn(`Error fetching project data (attempt ${retryCount + 1}):`, err);
      
      // Auto-retry up to 3 times in case of DB sync delay after document upload
      if (retryCount < 3) {
        setTimeout(() => {
          fetchProjectData(retryCount + 1);
        }, 600 * (retryCount + 1));
        return;
      }
      setFetchError(true);
      setLoading(false);
    }
  };

  const handleInternalSignoff = async () => {
    if (!window.confirm("Confirm Akshay & Thasleema internal governance sign-off? This validates that the Pre-Req Tracker has been strictly reviewed without unnecessary filler, and is now cleared for external engagement.")) {
      return;
    }
    setInternalSignoffLoading(true);
    try {
      const res = await axios.post(`${API_URL}/projects/${id}/internal-review-signoff`, {
        reviewer: "Akshay & Thasleema",
        action: "Approve",
        notes: "Pre-Req Tracker verified internally according to minimal standard format."
      });
      setProject(res.data);
      alert("✅ Internal Governance Sign-off complete! Tracker is verified and approved by Akshay & Thasleema.");
    } catch (err) {
      console.error("Signoff error:", err);
      alert("Failed to complete internal sign-off.");
    } finally {
      setInternalSignoffLoading(false);
    }
  };

  const isInternalApproved = project?.internal_review_status?.includes("Approved");

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setFetchError(false);
    fetchProjectData();

    const interval = setInterval(() => {
      if (isMounted && !fetchError) {
        fetchProjectData(0);
      }
    }, 3000);

    const onFocus = () => {
      if (isMounted) fetchProjectData(0);
    };
    window.addEventListener('focus', onFocus);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [id]);

  const handleManualVerify = async (itemId) => {
    try {
      await axios.post(`${API_URL}/items/${itemId}/verify`);
      fetchProjectData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Verification failed');
    }
  };

  const handleToggleCheck = async (e, item) => {
    e?.stopPropagation();
    const nextStatus = item.status === 'Verified' ? 'Pending' : 'Verified';
    try {
      await axios.put(`${API_URL}/items/${item.id}`, { status: nextStatus });
      fetchProjectData();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || 'Failed to update milestone status');
    }
  };

  const handleAiVerify = async (itemId) => {
    setVerifyingId(itemId);
    try {
      await axios.post(`${API_URL}/items/${itemId}/ai-verify`);
      fetchProjectData();
    } catch (err) {
      alert(err.response?.data?.detail || 'AI verification failed');
    } finally {
      setVerifyingId(null);
    }
  };

  if (loading || (!project && !fetchError)) {
    return (
      <div style={{ textAlign: 'center', padding: '8rem 1rem', background: '#FBFBFC', minHeight: '100vh' }}>
        <Loader2 className="animate-spin" size={42} color="#ED7D31" style={{ margin: '0 auto 1.25rem' }} />
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>Initializing PreQ Governance Workspace...</h3>
        <p style={{ color: '#64748B', fontSize: '13px', marginTop: '0.4rem' }}>Synchronizing extracted 27-Section BRD requirements & prerequisite database</p>
      </div>
    );
  }

  if (!project || fetchError) {
    return (
      <div className="goml-container" style={{ padding: '6rem 1rem', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: '#FFF7ED', border: '1px solid #FFEDD5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
          <AlertTriangle size={28} color="#ED7D31" />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>Initiative Workspace Sync Pending</h2>
        <p style={{ color: '#64748B', fontSize: '13.5px', marginTop: '0.6rem', lineHeight: 1.6 }}>
          The requested project workspace (<code style={{ background: '#F1F5F9', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>{id?.slice(0, 12)}...</code>) is finalizing setup or experienced a brief sync delay.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '1.75rem', flexWrap: 'wrap' }}>
          <button 
            onClick={() => {
              setLoading(true);
              setFetchError(false);
              fetchProjectData(0);
            }} 
            style={{
              background: '#ED7D31',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '9999px',
              padding: '9px 20px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(237, 125, 49, 0.3)'
            }}
          >
            <RefreshCw size={14} />
            <span>Retry Workspace Load</span>
          </button>

          <button 
            onClick={() => navigate('/')} 
            style={{
              background: '#000000',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '9999px',
              padding: '9px 20px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Return to Executive Portfolio
          </button>
        </div>
      </div>
    );
  }

  const safeChecklist = Array.isArray(checklist) ? checklist : [];

  const categories = Array.from(new Set(safeChecklist.map(i => i?.category || 'General')));

  const filteredItems = safeChecklist.filter(item => {
    if (!item) return false;
    const nameStr = (item.name || '').toLowerCase();
    const descStr = (item.description || '').toLowerCase();
    const ownerStr = (item.owner || '').toLowerCase();
    const query = (search || '').toLowerCase();

    const matchesSearch = nameStr.includes(query) ||
                          descStr.includes(query) ||
                          ownerStr.includes(query);
    const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
    const matchesStatus = selectedStatus === 'ALL' ||
      (selectedStatus === 'LOCKED' && item.is_locked) ||
      (item.status === selectedStatus);
    const matchesCritical = !onlyCritical || item.is_critical;

    return matchesSearch && matchesCategory && matchesStatus && matchesCritical;
  });

  const getStatusBadge = (status) => {
    if (status === 'Kick-off Cleared') {
      return (
        <span style={{
          background: '#000000',
          color: '#FFFFFF',
          border: '1px solid #27272A',
          padding: '4px 12px',
          borderRadius: '9999px',
          fontSize: '11.5px',
          fontWeight: 700,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ED7D31', display: 'inline-block' }} />
          <span>Cleared for Kick-off</span>
        </span>
      );
    }
    if (status === 'Critical / Blocked') {
      return (
        <span style={{
          background: '#FFF7ED',
          color: '#EA580C',
          border: '1px solid #FED7AA',
          padding: '4px 12px',
          borderRadius: '9999px',
          fontSize: '11.5px',
          fontWeight: 700,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#EA580C', display: 'inline-block' }} />
          <span>Critical Blocker</span>
        </span>
      );
    }
    if (status === 'At Risk') {
      return (
        <span style={{
          background: '#FFF7ED',
          color: '#C2410C',
          border: '1px solid #FFEDD5',
          padding: '4px 12px',
          borderRadius: '9999px',
          fontSize: '11.5px',
          fontWeight: 700,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ED7D31', display: 'inline-block' }} />
          <span>At Risk</span>
        </span>
      );
    }
    return (
      <span style={{
        background: '#F4F4F5',
        color: '#18181B',
        border: '1px solid #E4E4E7',
        padding: '4px 12px',
        borderRadius: '9999px',
        fontSize: '11.5px',
        fontWeight: 600,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px'
      }}>
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#71717A', display: 'inline-block' }} />
        <span>In Progress</span>
      </span>
    );
  };

  const blockersCount = safeChecklist.filter(i => i?.is_critical && i?.status !== 'Verified').length;
  const lockedCount = safeChecklist.filter(i => i?.is_locked).length;

  return (
    <div style={{ background: '#FBFBFC', minHeight: '100vh', paddingBottom: '4rem' }}>
      {/* Workspace Header Strip */}
      <section style={{ background: '#ffffff', paddingTop: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid #E2E8F0' }}>
        <div className="goml-container">
          {/* Breadcrumb & Quick Portal Share */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748B' }}>
              <Link 
                to="/" 
                style={{ color: '#64748B', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600, transition: 'color 0.15s ease' }}
                onMouseOver={e => e.currentTarget.style.color = '#ED7D31'}
                onMouseOut={e => e.currentTarget.style.color = '#64748B'}
              >
                ← Executive Portfolio
              </Link>
              <span style={{ color: '#CBD5E1' }}>/</span>
              <span style={{ color: '#0F172A', fontWeight: 600 }}>{project.client_name}</span>
            </div>

            {/* Micro Client Portal Link with Copy */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 500 }}>Client Self-Service:</span>
              <button
                type="button"
                onClick={() => {
                  const clientUrl = `${window.location.origin}/client/${id}`;
                  navigator.clipboard.writeText(clientUrl);
                  setCopiedLink(true);
                  setTimeout(() => setCopiedLink(false), 2200);
                }}
                style={{
                  background: copiedLink ? '#DCFCE7' : '#F1F5F9',
                  color: copiedLink ? '#166534' : '#334155',
                  border: '1px solid',
                  borderColor: copiedLink ? '#86EFAC' : '#E2E8F0',
                  borderRadius: '9999px',
                  padding: '4px 11px',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  transition: 'all 0.15s ease'
                }}
                title="Copy client-facing self-service URL"
              >
                {copiedLink ? <Check size={12} color="#166534" /> : <Copy size={12} />}
                <span>{copiedLink ? 'Link Copied!' : 'Copy Portal Link'}</span>
              </button>
            </div>
          </div>

          {/* Main Title Row & Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.25rem' }}>
            <div style={{ maxWidth: '720px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: 0, color: '#0F172A', letterSpacing: '-0.025em', lineHeight: 1.2 }}>
                  {project.name}
                </h1>
                {getStatusBadge(project.status)}
              </div>

              {/* Subtitle & Clean Metadata Pill Bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', fontSize: '12.5px', color: '#64748B', marginTop: '0.35rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '2px 9px', borderRadius: '6px' }}>
                  <Building2 size={12} color="#64748B" />
                  <span>Client:</span>
                  <strong style={{ color: '#0F172A' }}>{project.client_name}</strong>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '2px 9px', borderRadius: '6px' }}>
                  <Layers size={12} color="#64748B" />
                  <span>Type:</span>
                  <span style={{ color: '#334155', fontWeight: 600 }}>{project.type}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '2px 9px', borderRadius: '6px' }}>
                  <Calendar size={12} color="#64748B" />
                  <span>Kick-off:</span>
                  <strong style={{ color: '#0F172A' }}>{project.target_kickoff_date || 'TBD'}</strong>
                </div>

                {project.industry && (
                  <span style={{ background: '#F1F5F9', border: '1px solid #E2E8F0', padding: '2px 9px', borderRadius: '6px', fontSize: '11.5px', color: '#475569', fontWeight: 600 }}>
                    {project.industry}
                  </span>
                )}
                {project.deployment && (
                  <span style={{ background: '#FFF7ED', border: '1px solid #FFEDD5', padding: '2px 9px', borderRadius: '6px', fontSize: '11.5px', color: '#C2410C', fontWeight: 700 }}>
                    {project.deployment}
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons - Clean 2-Tier Visual Hierarchy */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                onClick={() => setIsBrdModalOpen(true)}
                style={{
                  background: '#ED7D31',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '9999px',
                  padding: '8px 18px',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '7px',
                  boxShadow: '0 2px 8px rgba(237, 125, 49, 0.35)',
                  transition: 'all 0.15s ease'
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = '#EA580C'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = '#ED7D31'; }}
              >
                <WordIcon />
                <span>View BRD (27 Sections)</span>
              </button>

              <a
                href={`${API_URL}/projects/${id}/export-excel-tracker`}
                target="_blank"
                rel="noreferrer"
                style={{
                  background: '#FFFFFF',
                  color: '#0F172A',
                  border: '1px solid #E2E8F0',
                  borderRadius: '9999px',
                  padding: '7px 14px',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                  transition: 'all 0.15s ease'
                }}
                onMouseOver={(e) => { e.currentTarget.style.borderColor = '#107C41'; }}
                onMouseOut={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; }}
                title="Download minimal Excel Pre-Req Tracker"
              >
                <ExcelIcon />
                <span>Tracker (.xlsx)</span>
              </a>

              <a
                href={`${API_URL}/projects/${id}/export-brd-docx`}
                target="_blank"
                rel="noreferrer"
                style={{
                  background: '#FFFFFF',
                  color: '#0F172A',
                  border: '1px solid #E2E8F0',
                  borderRadius: '9999px',
                  padding: '7px 14px',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                  transition: 'all 0.15s ease'
                }}
                onMouseOver={(e) => { e.currentTarget.style.borderColor = '#185ABD'; }}
                onMouseOut={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; }}
                title="Download formatted Word BRD Document"
              >
                <WordIcon />
                <span>BRD (.docx)</span>
              </a>

              <Link
                to={`/client/${id}`}
                target="_blank"
                style={{
                  background: '#FFFFFF',
                  color: '#0F172A',
                  border: '1px solid #E2E8F0',
                  borderRadius: '9999px',
                  padding: '7px 14px',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  transition: 'all 0.15s ease'
                }}
                onMouseOver={(e) => { e.currentTarget.style.borderColor = '#000000'; }}
                onMouseOut={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; }}
              >
                <ExternalLink size={13} color="#0F172A" />
                <span>Client Portal</span>
              </Link>

              {project.score >= 90 && blockersCount === 0 && (
                <button
                  onClick={() => navigate(`/certificate/${id}`)}
                  className="btn-goml btn-goml-orange btn-goml-sm"
                  style={{ borderRadius: '9999px', padding: '7px 16px', fontSize: '12.5px', fontWeight: 700 }}
                >
                  <Award size={14} /> Certificate
                </button>
              )}

              <button
                onClick={() => setIsAddModalOpen(true)}
                style={{
                  background: '#000000',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '9999px',
                  padding: '8px 18px',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                  transition: 'all 0.15s ease'
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = '#ED7D31'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = '#000000'; }}
              >
                <Plus size={14} strokeWidth={2.5} color="#FFFFFF" />
                <span>Add Pre-requisite</span>
              </button>
            </div>
          </div>

          {/* Sleek Internal Review Governance Banner */}
          <div style={{
            marginTop: '1.25rem',
            padding: '0.75rem 1.25rem',
            borderRadius: '12px',
            background: isInternalApproved ? '#F0FDF4' : '#FFF7ED',
            border: '1px solid',
            borderColor: isInternalApproved ? '#86EFAC' : '#FED7AA',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: isInternalApproved ? '#DCFCE7' : '#FFEDD5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <ShieldCheck size={17} color={isInternalApproved ? '#16A34A' : '#EA580C'} />
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: isInternalApproved ? '#166534' : '#9A3412', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>{isInternalApproved ? 'Internal Governance Review: Approved by Akshay & Thasleema' : 'Internal Governance Review: Pending Approval (Akshay & Thasleema)'}</span>
                  <span style={{ fontSize: '10.5px', background: isInternalApproved ? '#DCFCE7' : '#FED7AA', color: isInternalApproved ? '#166534' : '#9A3412', padding: '1px 6px', borderRadius: '4px', fontWeight: 800 }}>
                    {isInternalApproved ? 'CLEARED' : 'INTERNAL ONLY'}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: isInternalApproved ? '#15803D' : '#C2410C', marginTop: '1px' }}>
                  {isInternalApproved
                    ? 'The Pre-Req Tracker and 27-Section BRD have been reviewed internally without unnecessary descriptions, and are cleared for client engagement.'
                    : 'The generated tracker must not be sent directly to the client. Akshay and Thasleema will review the generated tracker internally before external distribution.'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {!isInternalApproved ? (
                <button
                  type="button"
                  onClick={handleInternalSignoff}
                  disabled={internalSignoffLoading}
                  style={{
                    background: '#09090B',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '7px 16px',
                    borderRadius: '9999px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: internalSignoffLoading ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.background = '#ED7D31'; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = '#09090B'; }}
                >
                  <ShieldCheck size={14} color="#ED7D31" />
                  <span>{internalSignoffLoading ? 'Signing off...' : 'Sign Off (Akshay & Thasleema)'}</span>
                </button>
              ) : (
                <span style={{ fontSize: '12px', color: '#166534', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Check size={14} strokeWidth={3} /> Signed & Cleared
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Modern 3-Card Metrics Section */}
      <section style={{ padding: '1.5rem 0', borderBottom: '1px solid #E2E8F0', background: '#FFFFFF' }}>
        <div className="goml-container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {/* Metric 1: Readiness Score */}
            <div style={{
              background: '#FAFAFC',
              borderRadius: '14px',
              border: '1px solid #E2E8F0',
              padding: '1.25rem 1.4rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease'
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#09090B', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    Day-1 Readiness Index
                  </span>
                  {getStatusBadge(project.status)}
                </div>
                <div style={{
                  fontSize: '2.4rem',
                  fontWeight: 800,
                  lineHeight: 1,
                  color: project.score >= 90 ? '#000000' : '#ED7D31',
                  letterSpacing: '-0.03em',
                  marginBottom: '0.65rem'
                }}>
                  {project.score}<span style={{ fontSize: '1.3rem', fontWeight: 700 }}>%</span>
                </div>
                {/* Progress bar */}
                <div style={{ width: '100%', height: '6px', background: '#E2E8F0', borderRadius: '9999px', overflow: 'hidden', marginBottom: '0.65rem' }}>
                  <div style={{
                    width: `${project.score}%`,
                    height: '100%',
                    borderRadius: '9999px',
                    background: project.score >= 90 ? '#000000' : '#ED7D31',
                    transition: 'width 0.5s ease'
                  }} />
                </div>
              </div>
              <div style={{ fontSize: '12px', color: '#64748B', lineHeight: 1.4 }}>
                {project.verified_items} of {project.total_items} milestones cleared across all delivery dimensions.
              </div>
            </div>

            {/* Metric 2: Critical Gatekeepers */}
            <div style={{
              background: '#FAFAFC',
              borderRadius: '14px',
              border: '1px solid #E2E8F0',
              padding: '1.25rem 1.4rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease'
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#09090B', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    Critical Gatekeepers
                  </span>
                  {blockersCount > 0 ? (
                    <span style={{ background: '#FFF7ED', border: '1px solid #FED7AA', color: '#EA580C', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '9999px' }}>
                      Action Required
                    </span>
                  ) : (
                    <span style={{ background: '#F4F4F5', border: '1px solid #E4E4E7', color: '#18181B', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '9999px' }}>
                      All Clear
                    </span>
                  )}
                </div>
                <div style={{
                  fontSize: '2.4rem',
                  fontWeight: 800,
                  lineHeight: 1,
                  color: blockersCount > 0 ? '#EA580C' : '#000000',
                  letterSpacing: '-0.03em',
                  marginBottom: '0.65rem'
                }}>
                  {blockersCount} <span style={{ fontSize: '1.15rem', fontWeight: 700, color: blockersCount > 0 ? '#EA580C' : '#000000' }}>{blockersCount === 1 ? 'Blocker' : 'Blockers'}</span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#64748B', lineHeight: 1.4 }}>
                  {blockersCount > 0 ? 'Mandatory items that halt production kick-off.' : 'All high-severity gatekeeper criteria cleared.'}
                </div>
                {lockedCount > 0 && (
                  <div style={{ fontSize: '11.5px', color: '#ED7D31', marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                    <Lock size={12} /> {lockedCount} item{lockedCount > 1 ? 's' : ''} waiting on upstream dependencies
                  </div>
                )}
              </div>
            </div>

            {/* Metric 3: Verification Ledger */}
            <div style={{
              background: '#FAFAFC',
              borderRadius: '14px',
              border: '1px solid #E2E8F0',
              padding: '1.25rem 1.4rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease'
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#09090B', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    Verification Ledger
                  </span>
                  <span style={{ color: '#000000', fontSize: '11px', fontWeight: 700, background: '#FFF7ED', border: '1px solid #FED7AA', padding: '2px 8px', borderRadius: '9999px' }}>
                    {project.verified_items} / {project.total_items} Verified
                  </span>
                </div>
                <div style={{
                  fontSize: '2.4rem',
                  fontWeight: 800,
                  lineHeight: 1,
                  color: '#000000',
                  letterSpacing: '-0.03em',
                  marginBottom: '0.65rem'
                }}>
                  {project.verified_items} <span style={{ fontSize: '1.2rem', fontWeight: 600, color: '#71717A' }}>/ {project.total_items}</span>
                </div>
                {/* Progress bar */}
                <div style={{ width: '100%', height: '6px', background: '#E2E8F0', borderRadius: '9999px', overflow: 'hidden', marginBottom: '0.65rem' }}>
                  <div style={{
                    width: `${project.total_items > 0 ? (project.verified_items / project.total_items) * 100 : 0}%`,
                    height: '100%',
                    borderRadius: '9999px',
                    background: '#ED7D31',
                    transition: 'width 0.5s ease'
                  }} />
                </div>
              </div>
              <div style={{ fontSize: '12px', color: '#64748B', lineHeight: 1.4 }}>
                {project.total_items - project.verified_items > 0
                  ? `${project.total_items - project.verified_items} milestones remaining for full governance sign-off.`
                  : 'All milestones verified with cryptographic audit proof.'}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Delivery Dimensions Strip (Replaces bulky Category Governance card) */}
      <section style={{ background: '#FFFFFF', padding: '1.25rem 0', borderBottom: '1px solid #E2E8F0' }}>
        <div className="goml-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#000000' }}>Governance Dimensions</span>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#ED7D31', background: '#FFF7ED', border: '1px solid #FFEDD5', padding: '2px 8px', borderRadius: '9999px' }}>
                {project.category_scores?.length || categories.length} Dimensions
              </span>
            </div>
            {selectedCategory !== 'ALL' && (
              <button
                type="button"
                onClick={() => setSelectedCategory('ALL')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#ED7D31',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                Reset Dimension Filter ✕
              </button>
            )}
          </div>

          {/* Interactive dimension tiles that also act as fast category filters */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
            {project.category_scores?.map((cat, idx) => {
              const isSelected = selectedCategory === cat.category;
              return (
                <div
                  key={idx}
                  onClick={() => setSelectedCategory(isSelected ? 'ALL' : cat.category)}
                  style={{
                    background: isSelected ? '#FFF7ED' : '#FAFAFC',
                    borderRadius: '10px',
                    border: '1px solid',
                    borderColor: isSelected ? '#ED7D31' : '#E2E8F0',
                    padding: '0.75rem 1rem',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                    boxShadow: isSelected ? '0 2px 10px rgba(237, 125, 49, 0.15)' : 'none'
                  }}
                  onMouseOver={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = '#FED7AA';
                      e.currentTarget.style.background = '#FFFFFF';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.04)';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = '#E2E8F0';
                      e.currentTarget.style.background = '#FAFAFC';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <strong style={{ color: isSelected ? '#ED7D31' : '#000000', fontSize: '12.5px' }}>{cat.category}</strong>
                    <strong style={{ color: cat.score >= 90 ? '#000000' : cat.score > 0 ? '#ED7D31' : '#71717A', fontSize: '12.5px' }}>
                      {cat.score}%
                    </strong>
                  </div>

                  <div style={{ width: '100%', height: '4px', background: '#E2E8F0', borderRadius: '9999px', overflow: 'hidden', marginBottom: '0.3rem' }}>
                    <div
                      style={{
                        width: `${cat.score}%`,
                        height: '100%',
                        borderRadius: '9999px',
                        backgroundColor: cat.score >= 90 ? '#000000' : '#ED7D31',
                        transition: 'width 0.4s ease'
                      }}
                    />
                  </div>

                  <div style={{ fontSize: '11px', color: '#71717A', fontWeight: 500 }}>
                    {cat.verified} of {cat.total} cleared
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Core Pre-requisite Checklist Table / Weekly Planner */}
      <section className="goml-section" style={{ background: '#ffffff', paddingTop: '2rem', paddingBottom: '4rem' }}>
        <div className="goml-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', margin: 0, fontWeight: 800 }}>
                {dashboardView === 'SIMPLE' ? 'Prerequisites Checklist' : dashboardView === 'MATRIX' ? 'Governance Verification Matrix' : 'Weekly Sprint Planner'}
              </h2>
              <p style={{ color: '#64748b', fontSize: '0.875rem', margin: '0.2rem 0 0' }}>
                {dashboardView === 'SIMPLE'
                  ? 'Streamlined task list — click any checkbox to verify or update milestones instantly.'
                  : dashboardView === 'MATRIX'
                  ? 'Full audit ledger with cryptographic proof, SLAs, and evidence inspection.'
                  : 'Multi-week horizon sprint plan aligned with technical prerequisites.'}
              </p>
            </div>

            {/* View Switcher Tabs (Borderless & Minimal) */}
            <div style={{
              background: '#F1F5F9',
              borderRadius: '10px',
              padding: '3px',
              display: 'flex',
              gap: '4px'
            }}>
              <button
                type="button"
                onClick={() => setDashboardView('SIMPLE')}
                style={{
                  background: dashboardView === 'SIMPLE' ? '#000000' : 'transparent',
                  color: dashboardView === 'SIMPLE' ? '#ffffff' : '#475569',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '6px 14px',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
              >
                <Zap size={14} color={dashboardView === 'SIMPLE' ? '#FFFFFF' : '#64748B'} />
                <span>Simple Checklist</span>
              </button>

              <button
                type="button"
                onClick={() => setDashboardView('MATRIX')}
                style={{
                  background: dashboardView === 'MATRIX' ? '#000000' : 'transparent',
                  color: dashboardView === 'MATRIX' ? '#ffffff' : '#475569',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '6px 14px',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
              >
                <Layers size={14} color={dashboardView === 'MATRIX' ? '#FFFFFF' : '#64748B'} />
                <span>Detailed Matrix</span>
              </button>

              <button
                type="button"
                onClick={() => setDashboardView('EXCEL')}
                style={{
                  background: dashboardView === 'EXCEL' ? '#000000' : 'transparent',
                  color: dashboardView === 'EXCEL' ? '#ffffff' : '#475569',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '6px 14px',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
              >
                <FileText size={14} color={dashboardView === 'EXCEL' ? '#ED7D31' : '#64748B'} />
                <span>Minimal Excel View</span>
              </button>

              <button
                type="button"
                onClick={() => setDashboardView('PLANNER')}
                style={{
                  background: dashboardView === 'PLANNER' ? '#000000' : 'transparent',
                  color: dashboardView === 'PLANNER' ? '#ffffff' : '#475569',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '6px 14px',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
              >
                <Calendar size={14} color={dashboardView === 'PLANNER' ? '#FFFFFF' : '#64748B'} />
                <span>Weekly Planner</span>
              </button>
            </div>
          </div>

          {dashboardView === 'PLANNER' ? (
            <WeeklyPlanner
              checklist={checklist}
              project={project}
              onProvideHandover={(item) => setSubmitModalItem(item)}
              onToggleCheck={handleToggleCheck}
            />
          ) : dashboardView === 'EXCEL' ? (
            <div style={{
              background: '#FFFFFF',
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
              overflow: 'hidden',
              boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
              fontFamily: '"Calibri", "Inter", sans-serif'
            }}>
              <div style={{
                padding: '0.85rem 1.25rem',
                background: '#C55A11',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={18} color="#FFFFFF" />
                  <span style={{ fontWeight: 800, fontSize: '14px', letterSpacing: '0.02em' }}>
                    Minimal Pre-Req Tracker — {project.name}
                  </span>
                </div>
                <a
                  href={`${API_URL}/projects/${id}/export-excel-tracker`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    background: '#FFFFFF',
                    color: '#C55A11',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '5px 12px',
                    fontSize: '12px',
                    fontWeight: 800,
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <Download size={13} />
                  <span>Download Excel (.xlsx)</span>
                </a>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#C55A11', color: '#FFFFFF' }}>
                      <th style={{ padding: '10px 14px', border: '1px solid #000000', width: '22%', textAlign: 'left', fontSize: '12.5px', fontWeight: 700 }}>Category</th>
                      <th style={{ padding: '10px 14px', border: '1px solid #000000', width: '24%', textAlign: 'left', fontSize: '12.5px', fontWeight: 700 }}>Title</th>
                      <th style={{ padding: '10px 14px', border: '1px solid #000000', width: '38%', textAlign: 'left', fontSize: '12.5px', fontWeight: 700 }}>Description</th>
                      <th style={{ padding: '10px 14px', border: '1px solid #000000', width: '16%', textAlign: 'left', fontSize: '12.5px', fontWeight: 700 }}>Requirement Timeline</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(
                      checklist.reduce((acc, item) => {
                        const cat = item.category || 'General';
                        if (!acc[cat]) acc[cat] = [];
                        acc[cat].push(item);
                        return acc;
                      }, {})
                    ).map(([catName, catItems]) => (
                      <React.Fragment key={catName}>
                        {catItems.map((item, idx) => (
                          <tr key={item.id} style={{ background: '#FBE5D6' }}>
                            {idx === 0 && (
                              <td
                                rowSpan={catItems.length}
                                style={{
                                  padding: '10px 14px',
                                  border: '1px solid #000000',
                                  verticalAlign: 'middle',
                                  textAlign: 'center',
                                  fontWeight: 700,
                                  color: '#000000',
                                  background: '#FBE5D6'
                                }}
                              >
                                {catName}
                              </td>
                            )}
                            <td style={{ padding: '10px 14px', border: '1px solid #000000', fontWeight: 700, color: '#000000', verticalAlign: 'middle' }}>
                              {item.name}
                            </td>
                            <td style={{ padding: '10px 14px', border: '1px solid #000000', color: '#000000', verticalAlign: 'middle', lineHeight: 1.45 }}>
                              {item.description}
                            </td>
                            <td style={{ padding: '10px 14px', border: '1px solid #000000', color: '#000000', verticalAlign: 'middle' }}>
                              {item.due_date?.startsWith('Before') ? item.due_date : `Before ${item.due_date || 'development'}`}
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : dashboardView === 'SIMPLE' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {/* Simple View Filter & Search Bar - Completely Borderless */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '8px',
                paddingBottom: '0.5rem'
              }}>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => { setSelectedStatus('ALL'); setOnlyCritical(false); }}
                    style={{
                      background: selectedStatus === 'ALL' && !onlyCritical ? '#000000' : '#F4F4F5',
                      color: selectedStatus === 'ALL' && !onlyCritical ? '#FFFFFF' : '#18181B',
                      border: '1px solid',
                      borderColor: selectedStatus === 'ALL' && !onlyCritical ? '#000000' : '#E4E4E7',
                      borderRadius: '100px',
                      padding: '5px 14px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    All ({checklist.length})
                  </button>

                  <button
                    onClick={() => { setOnlyCritical(true); setSelectedStatus('ALL'); }}
                    style={{
                      background: onlyCritical ? '#ED7D31' : '#FFF7ED',
                      color: onlyCritical ? '#FFFFFF' : '#EA580C',
                      border: '1px solid',
                      borderColor: onlyCritical ? '#D96B20' : '#FED7AA',
                      borderRadius: '100px',
                      padding: '5px 14px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <AlertTriangle size={13} color={onlyCritical ? '#FFFFFF' : '#18181B'} />
                    <span>Critical Blockers ({checklist.filter(i => i.is_critical && i.status !== 'Verified').length})</span>
                  </button>

                  <button
                    onClick={() => { setSelectedStatus('Submitted'); setOnlyCritical(false); }}
                    style={{
                      background: selectedStatus === 'Submitted' ? '#ED7D31' : '#FFF7ED',
                      color: selectedStatus === 'Submitted' ? '#FFFFFF' : '#C2410C',
                      border: '1px solid',
                      borderColor: selectedStatus === 'Submitted' ? '#D96B20' : '#FFEDD5',
                      borderRadius: '100px',
                      padding: '5px 14px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Clock size={13} color={selectedStatus === 'Submitted' ? '#FFFFFF' : '#18181B'} />
                    <span>In Review ({checklist.filter(i => i.status === 'Submitted' || i.status === 'Verifying').length})</span>
                  </button>

                  <button
                    onClick={() => { setSelectedStatus('Pending'); setOnlyCritical(false); }}
                    style={{
                      background: selectedStatus === 'Pending' ? '#000000' : '#F4F4F5',
                      color: selectedStatus === 'Pending' ? '#FFFFFF' : '#18181B',
                      border: '1px solid',
                      borderColor: selectedStatus === 'Pending' ? '#000000' : '#E4E4E7',
                      borderRadius: '100px',
                      padding: '5px 14px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <ListChecks size={13} color={selectedStatus === 'Pending' ? '#FFFFFF' : '#71717A'} />
                    <span>To Do ({checklist.filter(i => i.status !== 'Verified').length})</span>
                  </button>

                  <button
                    onClick={() => { setSelectedStatus('Verified'); setOnlyCritical(false); }}
                    style={{
                      background: selectedStatus === 'Verified' ? '#000000' : '#F4F4F5',
                      color: selectedStatus === 'Verified' ? '#FFFFFF' : '#18181B',
                      border: '1px solid',
                      borderColor: selectedStatus === 'Verified' ? '#000000' : '#E4E4E7',
                      borderRadius: '100px',
                      padding: '5px 14px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <CheckCircle2 size={13} color={selectedStatus === 'Verified' ? '#FFFFFF' : '#71717A'} />
                    <span>Verified ({checklist.filter(i => i.status === 'Verified').length})</span>
                  </button>
                </div>

                <div style={{ position: 'relative', minWidth: '240px' }}>
                  <Search size={14} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    placeholder="Search milestones..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{
                      padding: '7px 12px 7px 34px',
                      borderRadius: '8px',
                      border: '1px solid #E2E8F0',
                      fontSize: '12.5px',
                      outline: 'none',
                      width: '100%',
                      background: '#FFFFFF',
                      color: '#0F172A',
                      transition: 'all 0.15s ease'
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#ED7D31'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(237, 125, 49, 0.12)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.boxShadow = 'none'; }}
                  />
                </div>
              </div>

              {/* Flat Unified Table / List (Clean Enterprise Tabular List) */}
              <div style={{
                background: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #E4E4E7',
                overflow: 'hidden',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
              }}>
                {/* Header Row */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(280px, 2.8fr) 1.2fr 1.1fr 160px',
                  padding: '11px 16px',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#09090B',
                  background: '#FAFAFC',
                  borderBottom: '1px solid #E4E4E7',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  <div>Prerequisite Milestone</div>
                  <div>Category & Owner</div>
                  <div>Status</div>
                  <div style={{ textAlign: 'right' }}>Actions</div>
                </div>

                {/* Flat List Rows */}
                {filteredItems.map((item) => {
                  const isVerified = item.status === 'Verified';
                  const isSubmitted = item.status === 'Submitted' || item.status === 'Verifying';
                  const isVerifying = verifyingId === item.id;
                  const isExpanded = expandedItemId === item.id;

                  return (
                    <React.Fragment key={item.id}>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'minmax(280px, 2.8fr) 1.2fr 1.1fr 160px',
                          alignItems: 'center',
                          padding: '12px 16px',
                          borderBottom: isExpanded ? 'none' : '1px solid #F4F4F5',
                          background: isExpanded ? '#FFFBF8' : isVerified ? '#FAFAFA' : '#ffffff',
                          transition: 'background 0.12s ease'
                        }}
                        onMouseOver={(e) => {
                          if (!isExpanded) e.currentTarget.style.background = '#FAFAFA';
                        }}
                        onMouseOut={(e) => {
                          if (!isExpanded) e.currentTarget.style.background = isVerified ? '#FAFAFA' : '#ffffff';
                        }}
                      >
                        {/* Col 1: Checkbox + Title + Description */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingRight: '12px' }}>
                          <button
                            type="button"
                            onClick={(e) => handleToggleCheck(e, item)}
                            style={{
                              background: 'none',
                              border: 'none',
                              padding: 0,
                              cursor: 'pointer',
                              flexShrink: 0
                            }}
                            title={isVerified ? "Click to mark as pending" : "Click to mark verified"}
                          >
                            {isVerified ? (
                              <div style={{
                                width: '20px',
                                height: '20px',
                                borderRadius: '5px',
                                background: '#000000',
                                color: '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 2px 5px rgba(0, 0, 0, 0.25)',
                                border: '1.5px solid #000000'
                              }}>
                                <Check size={13} strokeWidth={3.2} color="#FFFFFF" />
                              </div>
                            ) : isSubmitted ? (
                              <div style={{
                                width: '20px',
                                height: '20px',
                                borderRadius: '5px',
                                border: '1.5px solid #000000',
                                background: '#F4F4F5',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}>
                                <Clock size={12} color="#18181B" />
                              </div>
                            ) : (
                              <div style={{
                                width: '20px',
                                height: '20px',
                                borderRadius: '5px',
                                border: item.is_critical ? '1.5px solid #ED7D31' : '1.5px solid #D4D4D8',
                                background: '#ffffff',
                                transition: 'border-color 0.15s ease'
                              }} />
                            )}
                          </button>

                          <div
                            style={{ minWidth: 0, cursor: 'pointer', flex: 1 }}
                            onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                            title="Click to view details & evidence"
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{
                                fontSize: '13.5px',
                                fontWeight: 600,
                                color: isVerified ? '#A1A1AA' : '#09090B',
                                textDecoration: isVerified ? 'line-through' : 'none',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}>
                                {item.name}
                              </span>
                              {item.is_critical && !isVerified && (
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                  fontSize: '10px',
                                  fontWeight: 700,
                                  color: '#09090B',
                                  background: '#FFF7ED',
                                  border: '1px solid #FED7AA',
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                  flexShrink: 0
                                }}>
                                  <AlertTriangle size={10} color="#09090B" />
                                  <span>Day-1</span>
                                </span>
                              )}
                              {item.has_api_key && (
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); setViewProofModalItem(item); }}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                    fontSize: '10.5px',
                                    fontWeight: 700,
                                    color: '#09090B',
                                    background: '#F4F4F5',
                                    border: '1px solid #E4E4E7',
                                    padding: '1px 6px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    flexShrink: 0
                                  }}
                                  title="View Credential Specification"
                                >
                                  <Key size={10} color="#18181B" />
                                  <span>Cred</span>
                                </button>
                              )}
                              {item.evidence_file && (
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); setViewProofModalItem(item); }}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                    fontSize: '10.5px',
                                    fontWeight: 700,
                                    color: '#ED7D31',
                                    background: '#FFF7ED',
                                    border: '1px solid #FFEDD5',
                                    padding: '1px 6px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    flexShrink: 0
                                  }}
                                  title="Inspect Attached Evidence File / Screenshot"
                                >
                                  <FileText size={10} color="#ED7D31" />
                                  <span>Proof</span>
                                </button>
                              )}
                              {item.evidence_notes && (item.evidence_notes.includes('Teams') || item.evidence_notes.includes('Host/Endpoint')) && (
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); setViewProofModalItem(item); }}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                    fontSize: '10.5px',
                                    fontWeight: 700,
                                    color: '#09090B',
                                    background: '#F4F4F5',
                                    border: '1px solid #CBD5E1',
                                    padding: '1px 6px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    flexShrink: 0
                                  }}
                                  title="Teams Handover Specification Available"
                                >
                                  <span>💬 Teams</span>
                                </button>
                              )}
                            </div>
                            <div style={{ fontSize: '12px', color: '#71717A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '1px' }}>
                              {item.description}
                            </div>
                          </div>
                        </div>

                        {/* Col 2: Category & Owner */}
                        <div style={{ fontSize: '12px', color: '#18181B' }}>
                          <div style={{ fontWeight: 600, color: '#09090B' }}>{item.category}</div>
                          <div style={{ fontSize: '11px', color: '#71717A' }}>{item.owner}</div>
                        </div>

                        {/* Col 3: Status & Due Date */}
                        <div>
                          {isVerified ? (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '3px 10px',
                              borderRadius: '100px',
                              background: '#000000',
                              color: '#FFFFFF',
                              border: '1px solid #27272A'
                            }}>
                              <Check size={11} strokeWidth={3} color="#FFFFFF" />
                              <span>Verified by goML</span>
                            </span>
                          ) : isSubmitted ? (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              fontSize: '11.5px',
                              fontWeight: 700,
                              padding: '3px 10px',
                              borderRadius: '100px',
                              background: '#FFF7ED',
                              color: '#EA580C',
                              border: '1px solid #FED7AA'
                            }}>
                              <Clock size={12} color="#18181B" />
                              <span>In Review</span>
                            </span>
                          ) : (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              fontSize: '11.5px',
                              fontWeight: 700,
                              padding: '3px 10px',
                              borderRadius: '100px',
                              background: '#F4F4F5',
                              color: '#52525B',
                              border: '1px solid #E4E4E7'
                            }}>
                              <Clock size={12} color="#71717A" />
                              <span>Pending</span>
                            </span>
                          )}
                          {item.due_date && (
                            <div style={{ fontSize: '10.5px', color: '#71717A', marginTop: '2px' }}>
                              Due {item.due_date}
                            </div>
                          )}
                        </div>

                        {/* Col 4: Actions (Clean Pill Actions) */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                          {/* Dedicated Proof & Handover Review Button */}
                          {(isSubmitted || isVerified || item.evidence_file || item.evidence_notes || item.has_api_key) && (
                            <button
                              type="button"
                              onClick={() => setViewProofModalItem(item)}
                              style={{
                                background: '#09090B',
                                color: '#FFFFFF',
                                border: 'none',
                                borderRadius: '9999px',
                                padding: '5px 12px',
                                fontSize: '11.5px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
                                transition: 'all 0.15s ease'
                              }}
                              onMouseOver={(e) => { e.currentTarget.style.background = '#ED7D31'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                              onMouseOut={(e) => { e.currentTarget.style.background = '#09090B'; e.currentTarget.style.transform = 'translateY(0)'; }}
                              title="Inspect Handover Specifications & Verification Proof"
                            >
                              <Eye size={12} />
                              <span>{item.evidence_notes?.includes('Teams') ? 'Teams Proof' : 'Inspect Proof'}</span>
                            </button>
                          )}

                          {isSubmitted && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleManualVerify(item.id)}
                                style={{
                                  background: '#ED7D31',
                                  color: '#ffffff',
                                  border: 'none',
                                  borderRadius: '9999px',
                                  padding: '5px 12px',
                                  fontSize: '11.5px',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  transition: 'all 0.15s ease'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.background = '#D96B20'}
                                onMouseOut={(e) => e.currentTarget.style.background = '#ED7D31'}
                                title="Verify and clear this deliverable"
                              >
                                <Check size={12} strokeWidth={2.5} />
                                <span>Verify</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleAiVerify(item.id)}
                                disabled={isVerifying}
                                style={{
                                  background: '#FFFFFF',
                                  color: '#ED7D31',
                                  border: '1px solid #FED7AA',
                                  borderRadius: '9999px',
                                  padding: '4px 10px',
                                  fontSize: '11.5px',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  transition: 'all 0.15s ease'
                                }}
                                title="Run AI auto-verification"
                              >
                                {isVerifying ? <Loader2 className="animate-spin" size={12} /> : <Sparkles size={12} />}
                                <span>AI</span>
                              </button>
                            </>
                          )}

                          {!isVerified && !isSubmitted && (
                            <button
                              type="button"
                              onClick={() => setSubmitModalItem(item)}
                              style={{
                                background: '#000000',
                                color: '#ffffff',
                                border: '1px solid #27272A',
                                borderRadius: '9999px',
                                padding: '5px 12px',
                                fontSize: '11.5px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                transition: 'all 0.15s ease'
                              }}
                              onMouseOver={(e) => { e.currentTarget.style.background = '#ED7D31'; e.currentTarget.style.borderColor = '#ED7D31'; }}
                              onMouseOut={(e) => { e.currentTarget.style.background = '#000000'; e.currentTarget.style.borderColor = '#27272A'; }}
                            >
                              <Upload size={12} />
                              <span>Submit</span>
                            </button>
                          )}

                          {!isVerified && (
                            <button
                              type="button"
                              onClick={() => setEscalateModalItem(item)}
                              style={{
                                background: '#FFF7ED',
                                border: '1px solid #FFEDD5',
                                borderRadius: '9999px',
                                padding: '5px 8px',
                                cursor: 'pointer',
                                color: '#ED7D31',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.15s ease'
                              }}
                              onMouseOver={(e) => { e.currentTarget.style.background = '#FFEDD5'; }}
                              onMouseOut={(e) => { e.currentTarget.style.background = '#FFF7ED'; }}
                              title="Send Nudge to Owner"
                            >
                              <Send size={12} />
                            </button>
                          )}

                          {isVerified && (
                            <button
                              type="button"
                              onClick={(e) => handleToggleCheck(e, item)}
                              style={{
                                background: '#F4F4F5',
                                border: '1px solid #E4E4E7',
                                borderRadius: '9999px',
                                padding: '4px 10px',
                                fontSize: '11px',
                                fontWeight: 600,
                                color: '#18181B',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                              onMouseOver={(e) => { e.currentTarget.style.borderColor = '#ED7D31'; e.currentTarget.style.color = '#ED7D31'; }}
                              onMouseOut={(e) => { e.currentTarget.style.borderColor = '#E4E4E7'; e.currentTarget.style.color = '#18181B'; }}
                            >
                              Reset
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#71717A',
                              cursor: 'pointer',
                              padding: '4px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            title={isExpanded ? "Collapse details" : "Expand details"}
                          >
                            {isExpanded ? <ChevronUp size={14} color="#18181B" /> : <ChevronDown size={14} />}
                          </button>
                        </div>
                      </div>

                      {/* Inline Expanded Inspector Drawer */}
                      {isExpanded && (
                        <div style={{
                          padding: '1rem 1.25rem',
                          background: '#FFFBF8',
                          borderBottom: '1px solid #F1F5F9',
                          borderTop: '1px dashed #FED7AA'
                        }}>
                          <div style={{
                            background: '#FFFFFF',
                            borderRadius: '10px',
                            border: '1px solid #FED7AA',
                            padding: '1.25rem',
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                            gap: '1.25rem'
                          }}>
                            <div>
                              <div style={{ fontSize: '11px', fontWeight: 700, color: '#ED7D31', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.25rem' }}>
                                Expected Deliverable Standard
                              </div>
                              <div style={{ fontSize: '12.5px', color: '#334155', lineHeight: 1.4 }}>
                                {item.expected_evidence || 'Structured handover artifact, access credential, or architecture sign-off required.'}
                              </div>

                              {item.evidence_notes && (
                                <div style={{ marginTop: '0.6rem' }}>
                                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Technical Notes:</div>
                                  <div style={{ fontSize: '12px', color: '#475569', background: '#F8FAFC', padding: '6px 10px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                                    {item.evidence_notes}
                                  </div>
                                </div>
                              )}
                            </div>

                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                                <div style={{ fontSize: '11px', fontWeight: 700, color: '#ED7D31', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                  Verification Evidence Artifact
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setViewProofModalItem(item)}
                                  style={{
                                    background: '#09090B',
                                    color: '#FFFFFF',
                                    border: 'none',
                                    borderRadius: '9999px',
                                    padding: '3px 10px',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}
                                >
                                  <Eye size={11} />
                                  <span>Inspect Proof Modal ↗</span>
                                </button>
                              </div>

                              {item.has_api_key && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#0F172A' }}>Masked Credential:</span>
                                  <code style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', padding: '2px 7px', borderRadius: '6px', fontSize: '11.5px', color: '#0F172A', fontFamily: 'monospace' }}>
                                    {item.masked_api_key}
                                  </code>
                                  <span style={{ fontSize: '11px', color: '#16A34A', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                    <ShieldCheck size={12} /> Secure
                                  </span>
                                </div>
                              )}

                              {item.evidence_file && (
                                <div style={{ marginBottom: '0.6rem', fontSize: '12.5px' }}>
                                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                                    Attached Evidence Files & Screenshots:
                                  </div>
                                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                    {item.evidence_file.split(',').map((fPath, fIdx) => {
                                      const clean = fPath.trim();
                                      if (!clean) return null;
                                      const fullUrl = clean.startsWith('http') ? clean : `${BASE_URL}${clean}`;
                                      const isImg = /\.(png|jpe?g|webp|gif|svg)$/i.test(clean);
                                      const fname = clean.split('/').pop();
                                      return (
                                        <div key={fIdx} style={{
                                          border: '1px solid #E2E8F0',
                                          borderRadius: '8px',
                                          padding: '6px 10px',
                                          background: '#F8FAFC',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '8px',
                                          maxWidth: '280px'
                                        }}>
                                          {isImg ? (
                                            <a href={fullUrl} target="_blank" rel="noreferrer" title="Click to open full screenshot">
                                              <img
                                                src={fullUrl}
                                                alt={fname}
                                                style={{
                                                  width: '44px',
                                                  height: '44px',
                                                  objectFit: 'cover',
                                                  borderRadius: '6px',
                                                  border: '1px solid #CBD5E1',
                                                  cursor: 'pointer'
                                                }}
                                              />
                                            </a>
                                          ) : (
                                            <FileText size={24} color="#ED7D31" />
                                          )}
                                          <div style={{ minWidth: 0, overflow: 'hidden' }}>
                                            <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={fname}>
                                              {fname}
                                            </div>
                                            <a
                                              href={fullUrl}
                                              target="_blank"
                                              rel="noreferrer"
                                              style={{ fontSize: '11px', color: '#ED7D31', fontWeight: 600, textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}
                                            >
                                              <span>{isImg ? 'View Full Screenshot' : 'Download File'}</span>
                                              <ExternalLink size={10} />
                                            </a>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {item.evidence_url && (
                                <div style={{ marginBottom: '0.4rem', fontSize: '12.5px' }}>
                                  <strong>Documentation URL:</strong>{' '}
                                  <a href={item.evidence_url} target="_blank" rel="noreferrer" style={{ color: '#ED7D31', fontWeight: 600, textDecoration: 'underline' }}>
                                    {item.evidence_url}
                                  </a>
                                </div>
                              )}

                              {!item.evidence_file && !item.evidence_url && !item.has_api_key && (
                                <div style={{ fontSize: '12px', color: '#94A3B8' }}>
                                  No evidence artifact uploaded yet.
                                </div>
                              )}

                              {item.verification_notes && (
                                <div style={{ marginTop: '0.5rem', padding: '6px 10px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '6px', fontSize: '12px', color: '#166534' }}>
                                  <strong>AI Proof Evaluation:</strong> {item.verification_notes}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}

                {filteredItems.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#64748B', fontSize: '13px' }}>
                    No prerequisites match your current filters.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Detailed Matrix Table Filters Toolbar */}
              {/* Detailed Matrix Table Filters Toolbar */}
              <div style={{
                display: 'flex',
                gap: '0.75rem',
                alignItems: 'center',
                marginBottom: '1rem',
                flexWrap: 'wrap',
                background: '#FFFFFF',
                padding: '0.75rem 1rem',
                borderRadius: '12px',
                border: '1px solid #E2E8F0'
              }}>
                {/* Search */}
                <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
                  <Search size={15} color="#94A3B8" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    placeholder="Search milestones, descriptions, owners..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 12px 6px 32px',
                      borderRadius: '8px',
                      border: '1px solid #E2E8F0',
                      fontSize: '12.5px',
                      outline: 'none',
                      background: '#F8FAFC',
                      color: '#0F172A'
                    }}
                  />
                </div>

                {/* Category Filter Pills */}
                <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto', whiteSpace: 'nowrap' }}>
                  <button
                    onClick={() => setSelectedCategory('ALL')}
                    style={{
                      background: selectedCategory === 'ALL' ? '#0F172A' : '#F1F5F9',
                      color: selectedCategory === 'ALL' ? '#FFFFFF' : '#475569',
                      border: 'none',
                      borderRadius: '9999px',
                      padding: '4px 12px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    All Categories
                  </button>
                  {categories.map(c => (
                    <button
                      key={c}
                      onClick={() => setSelectedCategory(c)}
                      style={{
                        background: selectedCategory === c ? '#0F172A' : '#F1F5F9',
                        color: selectedCategory === c ? '#FFFFFF' : '#475569',
                        border: 'none',
                        borderRadius: '9999px',
                        padding: '4px 12px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {c}
                    </button>
                  ))}
                </div>

                {/* Status Select */}
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  style={{
                    width: 'auto',
                    minWidth: '135px',
                    padding: '5px 10px',
                    fontSize: '12px',
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    background: '#FFFFFF',
                    color: '#334155',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Submitted">Submitted</option>
                  <option value="Verifying">Verifying</option>
                  <option value="Verified">Verified</option>
                  <option value="Rejected">Rejected</option>
                  <option value="LOCKED">Dependency Locked</option>
                </select>

                {/* Critical Toggle */}
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '12px', color: onlyCritical ? '#DC2626' : '#64748B', fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={onlyCritical}
                    onChange={(e) => setOnlyCritical(e.target.checked)}
                    style={{ accentColor: '#DC2626' }}
                  />
                  <span>Critical Gatekeepers</span>
                </label>
              </div>

              {/* Matrix Table */}
              <div style={{
                background: '#FFFFFF',
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                overflow: 'hidden'
              }}>
                <table className="goml-table" style={{ margin: 0, borderCollapse: 'separate', borderSpacing: 0 }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                      <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', width: '48%' }}>
                        PREREQUISITE MILESTONE
                      </th>
                      <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', width: '20%' }}>
                        CATEGORY & OWNER
                      </th>
                      <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', width: '14%' }}>
                        STATUS
                      </th>
                      <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', width: '18%', textAlign: 'right' }}>
                        ACTIONS
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map(item => {
                      const isExpanded = expandedItemId === item.id;
                      const isVerifying = verifyingId === item.id;
                      const isCleared = item.status === 'Verified';

                      return (
                        <React.Fragment key={item.id}>
                          <tr 
                            onClick={(e) => {
                              if (e.target.closest('button') || e.target.closest('a') || e.target.closest('input')) {
                                return;
                              }
                              setExpandedItemId(isExpanded ? null : item.id);
                            }}
                            style={{
                              background: isExpanded ? '#FFFBF8' : isCleared ? '#F9FDFB' : '#FFFFFF',
                              borderBottom: '1px solid #F1F5F9',
                              cursor: 'pointer',
                              transition: 'background 0.15s ease'
                            }}
                          >
                            {/* PREREQUISITE MILESTONE (Radio Circle + Title + Subtitle) */}
                            <td style={{ padding: '14px 16px' }}>
                              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                {/* Radio/Checkbox Circle Button */}
                                <button
                                  type="button"
                                  onClick={(e) => handleToggleCheck(e, item)}
                                  style={{
                                    width: '20px',
                                    height: '20px',
                                    borderRadius: '50%',
                                    border: isCleared ? 'none' : '2px solid #CBD5E1',
                                    background: isCleared ? '#10B981' : '#FFFFFF',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                    marginTop: '2px',
                                    transition: 'all 0.15s ease'
                                  }}
                                  title={isCleared ? "Click to mark as Pending" : "Click to mark as Verified"}
                                >
                                  {isCleared && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
                                </button>

                                <div 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setExpandedItemId(isExpanded ? null : item.id);
                                  }}
                                  style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
                                >
                                  {/* Badges */}
                                  {(item.is_critical || item.is_locked || item.escalation_level > 0) && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '4px' }}>
                                      {item.is_critical && (
                                        <span className="goml-badge goml-badge-critical" style={{ fontSize: '10px', padding: '2px 7px' }}>
                                          Critical Gatekeeper
                                        </span>
                                      )}
                                      {item.is_locked && (
                                        <span className="goml-badge goml-badge-risk" style={{ fontSize: '10px', padding: '2px 7px' }}>
                                          <Lock size={10} /> Blocked
                                        </span>
                                      )}
                                      {item.escalation_level > 0 && !isCleared && (
                                        <span className="goml-badge goml-badge-orange" style={{ fontSize: '10px', padding: '2px 7px' }}>
                                          Tier {item.escalation_level} Alert
                                        </span>
                                      )}
                                    </div>
                                  )}

                                  {/* Milestone Name */}
                                  <div style={{
                                    fontWeight: 700,
                                    color: isCleared ? '#475569' : '#0F172A',
                                    fontSize: '13.5px',
                                    lineHeight: 1.3,
                                    textDecoration: isCleared ? 'line-through' : 'none'
                                  }}>
                                    {item.name}
                                  </div>

                                  {/* Milestone Subtitle Description */}
                                  <div style={{
                                    fontSize: '12px',
                                    color: '#64748B',
                                    marginTop: '3px',
                                    lineHeight: 1.45,
                                    display: '-webkit-box',
                                    WebkitLineClamp: isExpanded ? 'unset' : 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden'
                                  }}>
                                    {item.description}
                                  </div>

                                  {item.rejection_reason && (
                                    <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', marginTop: '4px' }}>
                                      <strong>Rejection Reason:</strong> {item.rejection_reason}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* CATEGORY & OWNER */}
                            <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                              <div style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                                {item.category || 'General'}
                              </div>
                              {item.owner && (
                                <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>
                                  {item.owner}
                                </div>
                              )}
                            </td>

                            {/* STATUS */}
                            <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                              <div style={{ display: 'inline-flex', alignItems: 'center' }}>
                                {isCleared ? (
                                  <span style={{
                                    background: '#DCFCE7',
                                    color: '#15803D',
                                    border: '1px solid #86EFAC',
                                    padding: '3px 10px',
                                    borderRadius: '9999px',
                                    fontSize: '11.5px',
                                    fontWeight: 700,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '5px'
                                  }}>
                                    <CheckCircle2 size={12} color="#15803D" />
                                    <span>Verified</span>
                                  </span>
                                ) : item.status === 'Submitted' || item.status === 'Verifying' ? (
                                  <span style={{
                                    background: '#FFF7ED',
                                    color: '#C2410C',
                                    border: '1px solid #FFEDD5',
                                    padding: '3px 10px',
                                    borderRadius: '9999px',
                                    fontSize: '11.5px',
                                    fontWeight: 700,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '5px'
                                  }}>
                                    <Sparkles size={12} color="#ED7D31" />
                                    <span>{item.status}</span>
                                  </span>
                                ) : item.status === 'Rejected' ? (
                                  <span style={{
                                    background: '#FEF2F2',
                                    color: '#DC2626',
                                    border: '1px solid #FECACA',
                                    padding: '3px 10px',
                                    borderRadius: '9999px',
                                    fontSize: '11.5px',
                                    fontWeight: 700,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '5px'
                                  }}>
                                    <XCircle size={12} color="#DC2626" />
                                    <span>Rejected</span>
                                  </span>
                                ) : (
                                  <span style={{
                                    background: '#F1F5F9',
                                    color: '#475569',
                                    border: '1px solid #E2E8F0',
                                    padding: '3px 10px',
                                    borderRadius: '9999px',
                                    fontSize: '11.5px',
                                    fontWeight: 600,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '5px'
                                  }}>
                                    <Clock size={12} color="#64748B" />
                                    <span>Pending</span>
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* ACTIONS (Black Submit Button + Orange Paperplane Icon + Expand Chevron) */}
                            <td style={{ padding: '14px 16px', textAlign: 'right', verticalAlign: 'top' }}>
                              <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center', justifyContent: 'flex-end' }}>
                                {!isCleared && (
                                  <>
                                    {/* Black Submit Button */}
                                    <button
                                      type="button"
                                      onClick={() => setSubmitModalItem(item)}
                                      style={{
                                        background: '#000000',
                                        color: '#FFFFFF',
                                        border: 'none',
                                        borderRadius: '6px',
                                        padding: '5px 12px',
                                        fontSize: '12px',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '5px',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                                        transition: 'all 0.15s ease'
                                      }}
                                      onMouseOver={(e) => e.currentTarget.style.background = '#18181B'}
                                      onMouseOut={(e) => e.currentTarget.style.background = '#000000'}
                                      title="Submit Evidence Artifact"
                                    >
                                      <Upload size={12} />
                                      <span>Submit</span>
                                    </button>

                                    {/* AI Verify Button if submitted */}
                                    {(item.status === 'Submitted' || item.status === 'Verifying') && (
                                      <button
                                        type="button"
                                        onClick={() => handleAiVerify(item.id)}
                                        disabled={isVerifying}
                                        style={{
                                          background: '#ED7D31',
                                          color: '#FFFFFF',
                                          border: 'none',
                                          borderRadius: '6px',
                                          padding: '5px 9px',
                                          fontSize: '11.5px',
                                          fontWeight: 700,
                                          cursor: 'pointer',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '4px'
                                        }}
                                        title="AI Verify Evidence"
                                      >
                                        {isVerifying ? <Loader2 className="animate-spin" size={12} /> : <Sparkles size={12} />}
                                        <span>AI</span>
                                      </button>
                                    )}

                                    {/* Orange Nudge / Escalate Paperplane Icon Button */}
                                    <button
                                      type="button"
                                      onClick={() => setEscalateModalItem(item)}
                                      style={{
                                        background: '#FFF7ED',
                                        border: '1px solid #FFEDD5',
                                        borderRadius: '6px',
                                        padding: '5px 8px',
                                        cursor: 'pointer',
                                        color: '#ED7D31',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'all 0.15s ease'
                                      }}
                                      onMouseOver={(e) => { e.currentTarget.style.background = '#ED7D31'; e.currentTarget.style.color = '#FFFFFF'; }}
                                      onMouseOut={(e) => { e.currentTarget.style.background = '#FFF7ED'; e.currentTarget.style.color = '#ED7D31'; }}
                                      title="Trigger Nudge / Escalation"
                                    >
                                      <Send size={12} />
                                    </button>
                                  </>
                                )}

                                {/* Chevron Toggle button */}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setExpandedItemId(isExpanded ? null : item.id);
                                  }}
                                  style={{
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#64748B',
                                    padding: '4px'
                                  }}
                                  title={isExpanded ? "Collapse details" : "Expand details"}
                                >
                                  {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* Expandable Evidence Inspection Card */}
                          {isExpanded && (
                            <tr style={{ background: '#FFFDFB' }}>
                              <td colSpan={4} style={{ padding: '0.75rem 1rem 1rem 3.25rem' }}>
                                <div style={{
                                  background: '#FFFFFF',
                                  border: '1px solid #FFEDD5',
                                  borderRadius: '12px',
                                  padding: '1.15rem 1.25rem',
                                  boxShadow: '0 2px 8px rgba(237, 125, 49, 0.05)'
                                }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.25rem' }}>
                                    {/* Left: Expected Deliverable Standard */}
                                    <div style={{ flex: 1, minWidth: '260px' }}>
                                      <div style={{ fontSize: '11px', fontWeight: 800, color: '#ED7D31', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>
                                        EXPECTED DELIVERABLE STANDARD
                                      </div>
                                      <div style={{ fontSize: '12.5px', color: '#334155', lineHeight: 1.5 }}>
                                        {item.expected_evidence || item.description || 'Standard verification artifact or system access configuration.'}
                                      </div>
                                    </div>

                                    {/* Middle: Verification Evidence Artifact */}
                                    <div style={{ flex: 1, minWidth: '260px' }}>
                                      <div style={{ fontSize: '11px', fontWeight: 800, color: '#ED7D31', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>
                                        VERIFICATION EVIDENCE ARTIFACT
                                      </div>
                                      <div style={{ fontSize: '12.5px', color: item.evidence_notes || item.evidence_file || item.evidence_url ? '#0F172A' : '#94A3B8', lineHeight: 1.5 }}>
                                        {item.evidence_notes || item.evidence_file || item.evidence_url || 'No evidence artifact uploaded yet.'}
                                      </div>
                                    </div>

                                    {/* Right: Inspect Proof Modal Action Button */}
                                    <div style={{ alignSelf: 'center' }}>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const hasProof = Boolean(item.evidence_url || item.evidence_file || item.has_api_key || item.evidence_notes);
                                          if (hasProof) {
                                            setViewProofModalItem(item);
                                          } else {
                                            setSubmitModalItem(item);
                                          }
                                        }}
                                        style={{
                                          background: '#000000',
                                          color: '#FFFFFF',
                                          border: 'none',
                                          borderRadius: '9999px',
                                          padding: '7px 16px',
                                          fontSize: '12px',
                                          fontWeight: 700,
                                          cursor: 'pointer',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '6px',
                                          boxShadow: '0 2px 6px rgba(0,0,0,0.18)',
                                          transition: 'all 0.15s ease'
                                        }}
                                        onMouseOver={(e) => e.currentTarget.style.background = '#ED7D31'}
                                        onMouseOut={(e) => e.currentTarget.style.background = '#000000'}
                                        title="Open Handover Proof & Technical Specifications Modal"
                                      >
                                        <Eye size={13} color="#FFFFFF" />
                                        <span>Inspect Proof Modal ↗</span>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}

                          {/* Expandable Evidence Inspection Row */}
                          {isExpanded && (
                            <tr style={{ background: '#FFFBF8' }}>
                              <td colSpan={6} style={{ padding: '1rem 1.5rem' }}>
                                <div style={{ background: '#FFFFFF', border: '1px solid #FED7AA', borderRadius: '10px', padding: '1rem' }}>
                                  <div style={{ fontWeight: 700, color: '#0F172A', marginBottom: '0.4rem', fontSize: '13px' }}>
                                    Verification Artifact Detail:
                                  </div>
                                  <div style={{ fontSize: '12px', color: '#475569', marginBottom: '0.35rem' }}>
                                    <strong>Expected:</strong> {item.expected_evidence}
                                  </div>
                                  {item.has_api_key && (
                                    <div style={{ fontSize: '12px', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                                      <strong>Client Credential:</strong>
                                      <span className="goml-badge goml-badge-neutral" style={{ fontFamily: 'monospace', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                        <Key size={12} color="#18181B" />
                                        <span>{item.api_key_name || 'API_KEY'}: {item.masked_api_key}</span>
                                      </span>
                                      <span style={{ color: '#16A34A', fontWeight: 600, fontSize: '11.5px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                        <ShieldCheck size={13} />
                                        <span>Zero-exposure cryptographic mask</span>
                                      </span>
                                    </div>
                                  )}
                                  {item.evidence_file && (
                                    <div style={{ marginBottom: '0.6rem', fontSize: '12.5px' }}>
                                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                                        Attached Evidence Files & Screenshots:
                                      </div>
                                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                        {item.evidence_file.split(',').map((fPath, fIdx) => {
                                          const clean = fPath.trim();
                                          if (!clean) return null;
                                          const fullUrl = clean.startsWith('http') ? clean : `${BASE_URL}${clean}`;
                                          const isImg = /\.(png|jpe?g|webp|gif|svg)$/i.test(clean);
                                          const fname = clean.split('/').pop();
                                          return (
                                            <div key={fIdx} style={{
                                              border: '1px solid #E2E8F0',
                                              borderRadius: '8px',
                                              padding: '6px 10px',
                                              background: '#F8FAFC',
                                              display: 'flex',
                                              alignItems: 'center',
                                              gap: '8px',
                                              maxWidth: '280px'
                                            }}>
                                              {isImg ? (
                                                <a href={fullUrl} target="_blank" rel="noreferrer" title="Click to open full screenshot">
                                                  <img
                                                    src={fullUrl}
                                                    alt={fname}
                                                    style={{
                                                      width: '44px',
                                                      height: '44px',
                                                      objectFit: 'cover',
                                                      borderRadius: '6px',
                                                      border: '1px solid #CBD5E1',
                                                      cursor: 'pointer'
                                                    }}
                                                  />
                                                </a>
                                              ) : (
                                                <FileText size={24} color="#ED7D31" />
                                              )}
                                              <div style={{ minWidth: 0, overflow: 'hidden' }}>
                                                <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={fname}>
                                                  {fname}
                                                </div>
                                                <a
                                                  href={fullUrl}
                                                  target="_blank"
                                                  rel="noreferrer"
                                                  style={{ fontSize: '11px', color: '#ED7D31', fontWeight: 600, textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}
                                                >
                                                  <span>{isImg ? 'View Full Screenshot' : 'Download File'}</span>
                                                  <ExternalLink size={10} />
                                                </a>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                  {item.evidence_url && (
                                    <div style={{ fontSize: '12px', marginBottom: '0.35rem' }}>
                                      <strong>URL:</strong> <a href={item.evidence_url} target="_blank" rel="noreferrer" style={{ color: '#ED7D31', textDecoration: 'underline' }}>{item.evidence_url}</a>
                                    </div>
                                  )}
                                  {item.evidence_notes && (
                                    <div style={{ fontSize: '12px', color: '#334155' }}>
                                      <strong>Technical Notes:</strong> {item.evidence_notes}
                                    </div>
                                  )}
                                  {item.verification_notes && (
                                    <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px dashed #E2E8F0', fontSize: '12px', color: '#16A34A' }}>
                                      <strong>AI Evaluation:</strong> {item.verification_notes}
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}

                    {filteredItems.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: '#64748B', fontSize: '13px' }}>
                          No pre-requisites match your filter criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
          </>
          )}
        </div>
      </section>

      {/* Modals */}
      <ViewProofModal
        isOpen={!!viewProofModalItem}
        item={viewProofModalItem}
        project={project}
        onClose={() => setViewProofModalItem(null)}
        onUpdated={fetchProjectData}
        onOpenRejectModal={(it) => setRejectModalItem(it)}
      />

      <SubmitEvidenceModal
        isOpen={!!submitModalItem}
        onClose={() => setSubmitModalItem(null)}
        item={submitModalItem}
        onSubmitted={fetchProjectData}
      />

      <AddItemModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        projectId={id}
        existingItems={checklist}
        onItemAdded={fetchProjectData}
      />

      <EscalateModal
        isOpen={!!escalateModalItem}
        onClose={() => setEscalateModalItem(null)}
        item={escalateModalItem}
        onEscalated={fetchProjectData}
      />

      <RejectModal
        isOpen={!!rejectModalItem}
        onClose={() => setRejectModalItem(null)}
        item={rejectModalItem}
        onRejected={fetchProjectData}
      />

      {isBrdModalOpen && (
        <BRDViewerModal
          projectId={id}
          projectName={project.name}
          onClose={() => setIsBrdModalOpen(false)}
        />
      )}
    </div>
  );
};
