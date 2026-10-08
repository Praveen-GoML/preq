import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  CheckCircle, Clock, AlertTriangle, Upload, Plus, 
  ExternalLink, Lock, Sparkles, Award, Search, 
  CheckCircle2, XCircle, FileText, Send, Loader2, ChevronDown, ChevronUp, ArrowRight, Key,
  Building2, Copy, Calendar, Layers, Zap, ListChecks, Check, ShieldCheck, Filter
} from 'lucide-react';
import { SubmitEvidenceModal } from '../components/SubmitEvidenceModal';
import { AddItemModal } from '../components/AddItemModal';
import { EscalateModal } from '../components/EscalateModal';
import { RejectModal } from '../components/RejectModal';
import { WeeklyPlanner } from '../components/WeeklyPlanner';

import { API_URL, BASE_URL } from '../apiConfig';

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

  // Modals state
  const [submitModalItem, setSubmitModalItem] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [escalateModalItem, setEscalateModalItem] = useState(null);
  const [rejectModalItem, setRejectModalItem] = useState(null);
  const [verifyingId, setVerifyingId] = useState(null);

  const fetchProjectData = async () => {
    try {
      const [projRes, checkRes] = await Promise.all([
        axios.get(`${API_URL}/projects/${id}`),
        axios.get(`${API_URL}/projects/${id}/checklist`)
      ]);
      setProject(projRes.data);
      setChecklist(checkRes.data);
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

  if (!project && loading) {
    return (
      <div style={{ textAlign: 'center', padding: '6rem 0' }}>
        <Loader2 className="animate-spin" size={40} color="#ED7D31" style={{ margin: '0 auto 1rem' }} />
        <p style={{ color: '#64748b' }}>Loading GoML PreQ Workspace...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="goml-container" style={{ padding: '4rem 0', textAlign: 'center' }}>
        <h2>Initiative Workspace Not Found</h2>
        <button onClick={() => navigate('/')} className="btn-goml btn-goml-black" style={{ marginTop: '1.5rem' }}>
          Return to Executive Registry
        </button>
      </div>
    );
  }

  const categories = Array.from(new Set(checklist.map(i => i.category || 'General')));

  const filteredItems = checklist.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
                          item.description.toLowerCase().includes(search.toLowerCase()) ||
                          item.owner.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
    const matchesStatus = selectedStatus === 'ALL' ||
      (selectedStatus === 'LOCKED' && item.is_locked) ||
      (item.status === selectedStatus);
    const matchesCritical = !onlyCritical || item.is_critical;

    return matchesSearch && matchesCategory && matchesStatus && matchesCritical;
  });

  const getStatusBadge = (status) => {
    if (status === 'Kick-off Cleared') {
      return <span className="goml-badge goml-badge-cleared"><CheckCircle size={12} /> Cleared for Kick-off</span>;
    }
    if (status === 'Critical / Blocked') {
      return <span className="goml-badge goml-badge-critical"><AlertTriangle size={12} /> Critical Blocker</span>;
    }
    if (status === 'At Risk') {
      return <span className="goml-badge goml-badge-risk"><Clock size={12} /> At Risk</span>;
    }
    return <span className="goml-badge goml-badge-neutral">In Progress</span>;
  };

  const blockersCount = checklist.filter(i => i.is_critical && i.status !== 'Verified').length;
  const lockedCount = checklist.filter(i => i.is_locked).length;

  return (
    <div>
      {/* Workspace Header Strip */}
      <section className="goml-section" style={{ background: '#ffffff', paddingTop: '2.5rem', paddingBottom: '2.5rem' }}>
        <div className="goml-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                {getStatusBadge(project.status)}
                <span className="goml-badge goml-badge-neutral">{project.industry}</span>
                <span className="goml-badge goml-badge-orange">{project.deployment}</span>
              </div>

              <h1 style={{ fontSize: '2.25rem', fontWeight: 800, margin: 0 }}>
                {project.name}
              </h1>

              <div style={{ color: '#475569', fontSize: '0.95rem', marginTop: '0.4rem' }}>
                Client: <strong style={{ color: '#111827' }}>{project.client_name}</strong> • Type: {project.type} • Target Kick-off: <strong style={{ color: '#ED7D31' }}>{project.target_kickoff_date || 'TBD'}</strong>
              </div>
            </div>

            {/* Header Actions */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                onClick={() => navigate(`/client/${id}`)}
                className="btn-goml btn-goml-outline btn-goml-sm"
              >
                <ExternalLink size={14} /> Client Portal
              </button>

              <button
                onClick={onOpenCopilot}
                className="btn-goml btn-goml-outline btn-goml-sm"
                style={{ borderColor: 'var(--goml-orange)', color: 'var(--goml-orange)' }}
              >
                <Sparkles size={14} /> AI Copilot
              </button>

              {project.score >= 90 && blockersCount === 0 ? (
                <button
                  onClick={() => navigate(`/certificate/${id}`)}
                  className="btn-goml btn-goml-orange btn-goml-sm"
                >
                  <Award size={14} /> Official Certificate
                </button>
              ) : (
                <span
                  className="goml-badge goml-badge-neutral"
                  title="Certificate unlocked when score >= 90% and zero critical blockers"
                >
                  <Award size={13} /> Certificate (Locked)
                </span>
              )}

              <button
                onClick={() => setIsAddModalOpen(true)}
                className="btn-goml btn-goml-black btn-goml-sm"
              >
                <Plus size={14} /> Add Pre-requisite
              </button>
            </div>
          </div>

          {/* DEDICATED SEPARATE CLIENT PORTAL BANNER */}
          <div style={{
            marginTop: '1.75rem',
            background: '#FFF9F5',
            borderRadius: '12px',
            padding: '1.15rem 1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                background: '#FFE8D6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ED7D31'
              }}>
                <Building2 size={20} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '14.5px', color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>Separate Client Readiness Portal:</span>
                  <span style={{ color: '#ED7D31', fontWeight: 800 }}>{project.client_name}</span>
                  <span style={{ background: '#ED7D31', color: '#ffffff', fontSize: '10.5px', fontWeight: 700, padding: '1px 8px', borderRadius: '100px' }}>
                    External Client View
                  </span>
                </div>
                <div style={{ fontSize: '13px', color: '#5E5656', marginTop: '2px' }}>
                  Clients access a dedicated self-service portal (without internal GoML engineering controls) to provide credentials and sign-offs.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <button
                type="button"
                onClick={() => {
                  const clientUrl = `${window.location.origin}/client/${id}`;
                  navigator.clipboard.writeText(clientUrl);
                  alert(`Copied dedicated Client Portal link:\n${clientUrl}`);
                }}
                className="btn-goml btn-goml-outline btn-goml-sm"
                style={{ border: 'none', background: '#FFFFFF', color: '#475569' }}
              >
                <Copy size={13} /> Copy Client Link
              </button>

              <Link
                to={`/client/${id}`}
                target="_blank"
                className="btn-goml btn-goml-black btn-goml-sm"
                style={{ textDecoration: 'none' }}
              >
                <ExternalLink size={13} /> Open Client Portal
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Readiness Metrics Strip (GoML Style 3-Column Stripe - NO CARDS & BORDERLESS) */}
      <section className="goml-section" style={{ background: '#f8fafc', padding: '2rem 0' }}>
        <div className="goml-container">
          <div className="metric-stripe">
            {/* Metric 1: Readiness Score */}
            <div className="metric-stripe-col">
              <div className="metric-stripe-tag">Day-1 Readiness Score</div>
              <div className="metric-stripe-val" style={{ color: project.score >= 90 ? '#16a34a' : project.score >= 50 ? '#d97706' : '#dc2626' }}>
                {project.score}<span style={{ fontSize: '1.5rem', fontWeight: 600 }}>%</span>
              </div>
              <div className="metric-stripe-desc">
                Weighted clearance index across all governance dimensions.
              </div>
              <div style={{ marginTop: '0.85rem' }}>
                {getStatusBadge(project.status)}
              </div>
            </div>

            {/* Metric 2: Critical Gatekeepers */}
            <div className="metric-stripe-col">
              <div className="metric-stripe-tag">Critical Gatekeepers</div>
              <div className="metric-stripe-val" style={{ color: blockersCount > 0 ? '#dc2626' : '#16a34a' }}>
                {blockersCount} <span style={{ fontSize: '1.25rem', fontWeight: 600 }}>{blockersCount === 1 ? 'Blocker' : 'Blockers'}</span>
              </div>
              <div className="metric-stripe-desc">
                {blockersCount > 0 ? 'Mandatory items that halt production kick-off.' : 'All high-severity gatekeeper criteria cleared.'}
              </div>
              {lockedCount > 0 && (
                <div style={{ fontSize: '0.8rem', color: '#d97706', marginTop: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Lock size={12} /> {lockedCount} item{lockedCount > 1 ? 's' : ''} waiting on upstream dependencies
                </div>
              )}
            </div>

            {/* Metric 3: Verification Ledger */}
            <div className="metric-stripe-col">
              <div className="metric-stripe-tag">Verification Ledger</div>
              <div className="metric-stripe-val">
                {project.verified_items} <span style={{ fontSize: '1.25rem', fontWeight: 600, color: '#64748b' }}>/ {project.total_items}</span>
              </div>
              <div className="metric-stripe-desc">
                Pre-requisite milestones validated with cryptographic & audit proof.
              </div>
              <div style={{ fontSize: '0.8rem', color: '#16a34a', marginTop: '0.85rem', fontWeight: 600 }}>
                {project.total_items - project.verified_items} Remaining Milestones
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Breakdown Table Strip */}
      <section className="goml-section" style={{ background: '#ffffff', padding: '2rem 0' }}>
        <div className="goml-container">
          <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.25rem', margin: 0 }}>Category Governance Breakdown</h3>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
              6 Core Delivery Dimensions
            </span>
          </div>

          <div className="goml-table-wrapper" style={{ border: 'none', background: 'transparent' }}>
            <table className="goml-table">
              <thead>
                <tr>
                  <th style={{ width: '25%' }}>Category</th>
                  <th style={{ width: '20%' }}>Verified Ratio</th>
                  <th style={{ width: '35%' }}>Progress Bar</th>
                  <th style={{ width: '20%', textAlign: 'right' }}>Readiness</th>
                </tr>
              </thead>
              <tbody>
                {project.category_scores?.map((cat, idx) => (
                  <tr key={idx}>
                    <td>
                      <strong style={{ color: '#111827' }}>{cat.category}</strong>
                    </td>
                    <td>
                      <span style={{ color: '#64748b' }}>{cat.verified} of {cat.total} milestones cleared</span>
                    </td>
                    <td>
                      <div style={{ width: '100%', height: '7px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${cat.score}%`,
                            height: '100%',
                            backgroundColor: cat.score >= 90 ? '#16a34a' : cat.score >= 50 ? '#d97706' : '#ED7D31'
                          }}
                        />
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <strong style={{ color: cat.score >= 90 ? '#16a34a' : cat.score >= 50 ? '#d97706' : '#dc2626' }}>
                        {cat.score}%
                      </strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
                  background: dashboardView === 'SIMPLE' ? '#0F172A' : 'transparent',
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
                <Zap size={14} color={dashboardView === 'SIMPLE' ? '#ED7D31' : '#64748B'} />
                <span>Simple Checklist</span>
              </button>

              <button
                type="button"
                onClick={() => setDashboardView('MATRIX')}
                style={{
                  background: dashboardView === 'MATRIX' ? '#0F172A' : 'transparent',
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
                <Layers size={14} color={dashboardView === 'MATRIX' ? '#ED7D31' : '#64748B'} />
                <span>Detailed Matrix</span>
              </button>

              <button
                type="button"
                onClick={() => setDashboardView('PLANNER')}
                style={{
                  background: dashboardView === 'PLANNER' ? '#0F172A' : 'transparent',
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
                <Calendar size={14} color={dashboardView === 'PLANNER' ? '#ED7D31' : '#64748B'} />
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
                      background: selectedStatus === 'ALL' && !onlyCritical ? '#0F172A' : '#F1F5F9',
                      color: selectedStatus === 'ALL' && !onlyCritical ? '#ffffff' : '#475569',
                      border: 'none',
                      borderRadius: '100px',
                      padding: '5px 14px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    All ({checklist.length})
                  </button>

                  <button
                    onClick={() => { setOnlyCritical(true); setSelectedStatus('ALL'); }}
                    style={{
                      background: onlyCritical ? '#DC2626' : '#FEF2F2',
                      color: onlyCritical ? '#ffffff' : '#DC2626',
                      border: 'none',
                      borderRadius: '100px',
                      padding: '5px 14px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <AlertTriangle size={13} color={onlyCritical ? '#ffffff' : '#DC2626'} />
                    <span>Critical Blockers ({checklist.filter(i => i.is_critical && i.status !== 'Verified').length})</span>
                  </button>

                  <button
                    onClick={() => { setSelectedStatus('Submitted'); setOnlyCritical(false); }}
                    style={{
                      background: selectedStatus === 'Submitted' ? '#D97706' : '#FFFBEB',
                      color: selectedStatus === 'Submitted' ? '#ffffff' : '#B45309',
                      border: 'none',
                      borderRadius: '100px',
                      padding: '5px 14px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Clock size={13} color={selectedStatus === 'Submitted' ? '#ffffff' : '#D97706'} />
                    <span>In Review ({checklist.filter(i => i.status === 'Submitted' || i.status === 'Verifying').length})</span>
                  </button>

                  <button
                    onClick={() => { setSelectedStatus('Pending'); setOnlyCritical(false); }}
                    style={{
                      background: selectedStatus === 'Pending' ? '#ED7D31' : '#FFF7F0',
                      color: selectedStatus === 'Pending' ? '#ffffff' : '#ED7D31',
                      border: 'none',
                      borderRadius: '100px',
                      padding: '5px 14px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <ListChecks size={13} color={selectedStatus === 'Pending' ? '#ffffff' : '#ED7D31'} />
                    <span>To Do ({checklist.filter(i => i.status !== 'Verified').length})</span>
                  </button>

                  <button
                    onClick={() => { setSelectedStatus('Verified'); setOnlyCritical(false); }}
                    style={{
                      background: selectedStatus === 'Verified' ? '#10B981' : '#F0FDF4',
                      color: selectedStatus === 'Verified' ? '#ffffff' : '#10B981',
                      border: 'none',
                      borderRadius: '100px',
                      padding: '5px 14px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <CheckCircle2 size={13} color={selectedStatus === 'Verified' ? '#ffffff' : '#10B981'} />
                    <span>Verified ({checklist.filter(i => i.status === 'Verified').length})</span>
                  </button>
                </div>

                <div style={{ position: 'relative', minWidth: '220px' }}>
                  <Search size={14} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    placeholder="Search milestones..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{
                      padding: '6px 12px 6px 34px',
                      borderRadius: '8px',
                      border: 'none',
                      fontSize: '12.5px',
                      outline: 'none',
                      width: '100%',
                      background: '#F1F5F9',
                      color: '#0F172A'
                    }}
                  />
                </div>
              </div>

              {/* Flat Unified Table / List (BORDERLESS, NO CARDS, MODERN) */}
              <div style={{
                background: '#ffffff',
                borderRadius: '10px'
              }}>
                {/* Header Row */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(280px, 2.8fr) 1.2fr 1.1fr 160px',
                  padding: '10px 14px',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#94A3B8',
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

                  return (
                    <div
                      key={item.id}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'minmax(280px, 2.8fr) 1.2fr 1.1fr 160px',
                        alignItems: 'center',
                        padding: '12px 14px',
                        borderRadius: '8px',
                        background: isVerified ? '#FAFAFC' : '#ffffff',
                        transition: 'background 0.12s ease',
                        marginBottom: '2px'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.background = '#F8FAFC'}
                      onMouseOut={(e) => e.currentTarget.style.background = isVerified ? '#FAFAFC' : '#ffffff'}
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
                              width: '18px',
                              height: '18px',
                              borderRadius: '50%',
                              background: '#10B981',
                              color: '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <Check size={11} strokeWidth={3} />
                            </div>
                          ) : (
                            <div style={{
                              width: '18px',
                              height: '18px',
                              borderRadius: '50%',
                              border: item.is_critical ? '2px solid #DC2626' : '2px solid #CBD5E1',
                              background: 'transparent'
                            }} />
                          )}
                        </button>

                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{
                              fontSize: '13.5px',
                              fontWeight: 600,
                              color: isVerified ? '#94A3B8' : '#0F172A',
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
                                color: '#DC2626',
                                background: '#FEF2F2',
                                padding: '1px 6px',
                                borderRadius: '4px',
                                flexShrink: 0
                              }}>
                                <AlertTriangle size={10} color="#DC2626" />
                                <span>Day-1</span>
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '1px' }}>
                            {item.description}
                          </div>
                        </div>
                      </div>

                      {/* Col 2: Category & Owner */}
                      <div style={{ fontSize: '12px', color: '#475569' }}>
                        <div><strong>{item.category}</strong></div>
                        <div style={{ fontSize: '11px', color: '#94A3B8' }}>{item.owner}</div>
                      </div>

                      {/* Col 3: Status & Due Date (ICONS - NO EMOJIS) */}
                      <div>
                        {isVerified ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            fontSize: '11.5px',
                            fontWeight: 700,
                            padding: '3px 10px',
                            borderRadius: '100px',
                            background: '#DCFCE7',
                            color: '#166534'
                          }}>
                            <CheckCircle2 size={12} color="#166534" />
                            <span>Verified</span>
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
                            background: '#FEF3C7',
                            color: '#92400E'
                          }}>
                            <Clock size={12} color="#92400E" />
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
                            background: '#F1F5F9',
                            color: '#475569'
                          }}>
                            <Clock size={12} color="#64748B" />
                            <span>Pending</span>
                          </span>
                        )}
                        {item.due_date && (
                          <div style={{ fontSize: '10.5px', color: '#94A3B8', marginTop: '2px' }}>
                            Due {item.due_date}
                          </div>
                        )}
                      </div>

                      {/* Col 4: Actions (CLEAN BORDERLESS ACTIONS) */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '5px' }}>
                        {isSubmitted && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleManualVerify(item.id)}
                              style={{
                                background: '#10B981',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '5px 10px',
                                fontSize: '11.5px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                              title="Verify and clear this deliverable"
                            >
                              <Check size={12} />
                              <span>Verify</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleAiVerify(item.id)}
                              disabled={isVerifying}
                              style={{
                                background: '#ED7D31',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '5px 10px',
                                fontSize: '11.5px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
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
                              background: '#0F172A',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '5px 12px',
                              fontSize: '11.5px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
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
                              background: '#F8FAFC',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '5px 7px',
                              cursor: 'pointer',
                              color: '#ED7D31'
                            }}
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
                              background: '#F1F5F9',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '4px 10px',
                              fontSize: '11.5px',
                              color: '#64748B',
                              cursor: 'pointer'
                            }}
                          >
                            Revoke
                          </button>
                        )}
                      </div>
                    </div>
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
          <div style={{
            display: 'flex',
            gap: '1rem',
            alignItems: 'center',
            marginBottom: '1rem',
            flexWrap: 'wrap',
            background: '#f8fafc',
            padding: '0.75rem 1.25rem',
            borderRadius: '10px',
            border: '1px solid #e5e5e5'
          }}>
            {/* Search */}
            <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
              <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                className="goml-input"
                placeholder="Search milestones, descriptions, owners..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: '2.5rem', padding: '0.5rem 0.85rem 0.5rem 2.5rem', fontSize: '0.85rem' }}
              />
            </div>

            {/* Category Filter Pills */}
            <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto', whiteSpace: 'nowrap' }}>
              <button
                onClick={() => setSelectedCategory('ALL')}
                className="btn-goml btn-goml-sm"
                style={{
                  backgroundColor: selectedCategory === 'ALL' ? 'var(--goml-black)' : 'transparent',
                  color: selectedCategory === 'ALL' ? '#ffffff' : '#475569',
                  border: 'none',
                  fontWeight: 600
                }}
              >
                All Categories
              </button>
              {categories.map(c => (
                <button
                  key={c}
                  onClick={() => setSelectedCategory(c)}
                  className="btn-goml btn-goml-sm"
                  style={{
                    backgroundColor: selectedCategory === c ? 'var(--goml-black)' : 'transparent',
                    color: selectedCategory === c ? '#ffffff' : '#475569',
                    border: 'none',
                    fontWeight: 600
                  }}
                >
                  {c}
                </button>
              ))}
            </div>

            {/* Status Select */}
            <select
              className="goml-input"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{ width: 'auto', minWidth: '140px', padding: '0.5rem 0.85rem', fontSize: '0.85rem' }}
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
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.85rem', color: onlyCritical ? '#dc2626' : '#64748b' }}>
              <input
                type="checkbox"
                checked={onlyCritical}
                onChange={(e) => setOnlyCritical(e.target.checked)}
                style={{ accentColor: '#dc2626' }}
              />
              <span style={{ fontWeight: 600 }}>Critical Gatekeepers Only</span>
            </label>
          </div>

          {/* Matrix Table */}
          <div className="goml-table-wrapper">
            <table className="goml-table">
              <thead>
                <tr>
                  <th style={{ width: '32%' }}>Pre-requisite Milestone</th>
                  <th style={{ width: '13%' }}>Category & Owner</th>
                  <th style={{ width: '12%' }}>Due Date / SLA</th>
                  <th style={{ width: '15%' }}>Pipeline Status</th>
                  <th style={{ width: '10%' }}>Evidence Artifact</th>
                  <th style={{ width: '18%', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map(item => {
                  const isExpanded = expandedItemId === item.id;
                  const isVerifying = verifyingId === item.id;
                  return (
                    <React.Fragment key={item.id}>
                      <tr style={{ background: isExpanded ? '#fefcfb' : 'transparent' }}>
                        {/* Milestone Name & Description */}
                        <td>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.2rem' }}>
                              {item.is_critical && (
                                <span className="goml-badge goml-badge-critical" style={{ fontSize: '0.7rem' }}>
                                  Critical Gatekeeper
                                </span>
                              )}
                              {item.is_locked && (
                                <span className="goml-badge goml-badge-risk" style={{ fontSize: '0.7rem' }}>
                                  <Lock size={11} /> Blocked: {item.blocking_items?.[0]?.name || 'Prerequisite'}
                                </span>
                              )}
                              {item.escalation_level > 0 && item.status !== 'Verified' && (
                                <span className="goml-badge goml-badge-orange" style={{ fontSize: '0.7rem' }}>
                                  Tier {item.escalation_level} Alert
                                </span>
                              )}
                            </div>

                            <div style={{ fontWeight: 700, color: '#111827', fontSize: '0.95rem' }}>
                              {item.name}
                            </div>

                            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem', lineHeight: 1.4 }}>
                              {item.description}
                            </div>

                            {item.rejection_reason && (
                              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '0.4rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', marginTop: '0.4rem' }}>
                                <strong>Rejection Reason:</strong> {item.rejection_reason}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Category & Owner */}
                        <td>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#111827' }}>
                            {item.category}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem' }}>
                            {item.owner}
                          </div>
                        </td>

                        {/* Due Date */}
                        <td>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#111827' }}>
                            {item.due_date || 'TBD'}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem' }}>
                            Day-1 SLA
                          </div>
                        </td>

                        {/* Pipeline Status */}
                        <td>
                          <div>
                            <span className={`goml-badge ${item.status === 'Verified' ? 'goml-badge-cleared' : item.status === 'Verifying' ? 'goml-badge-orange' : item.status === 'Submitted' ? 'goml-badge-orange' : item.status === 'Rejected' ? 'goml-badge-critical' : 'goml-badge-neutral'}`}>
                              {item.status}
                            </span>
                            {item.verification_score !== null && item.verification_score !== undefined && (
                              <div style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600, marginTop: '0.25rem' }}>
                                AI Proof: {item.verification_score}%
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Evidence */}
                        <td>
                          {item.evidence_url || item.evidence_file || item.has_api_key ? (
                            <button
                              onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                              className="btn-goml btn-goml-outline btn-goml-sm"
                              style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
                            >
                              {item.has_api_key ? <Key size={12} color="#ED7D31" /> : <FileText size={12} color="#ED7D31" />}
                              <span>{item.has_api_key ? 'Credential' : 'Inspect'}</span>
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>None Yet</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '0.35rem', alignItems: 'center' }}>
                            {item.is_locked ? (
                              <span className="goml-badge goml-badge-neutral" style={{ fontSize: '0.75rem' }}>
                                <Lock size={12} /> Locked
                              </span>
                            ) : item.status !== 'Verified' ? (
                              <>
                                <button
                                  onClick={() => setSubmitModalItem(item)}
                                  className="btn-goml btn-goml-black btn-goml-sm"
                                  title="Submit Evidence"
                                >
                                  <Upload size={12} />
                                  <span>Submit</span>
                                </button>

                                {item.status === 'Submitted' || item.status === 'Verifying' ? (
                                  <>
                                    <button
                                      onClick={() => handleAiVerify(item.id)}
                                      disabled={isVerifying}
                                      className="btn-goml btn-goml-orange btn-goml-sm"
                                      title="AI Verify Evidence"
                                    >
                                      {isVerifying ? <Loader2 className="animate-spin" size={12} /> : <Sparkles size={12} />}
                                      <span>AI</span>
                                    </button>

                                    <button
                                      onClick={() => handleManualVerify(item.id)}
                                      className="btn-goml btn-goml-outline btn-goml-sm"
                                      title="Manual Approve"
                                      style={{ color: '#16a34a', borderColor: '#bbf7d0' }}
                                    >
                                      <CheckCircle size={12} />
                                    </button>

                                    <button
                                      onClick={() => setRejectModalItem(item)}
                                      className="btn-goml btn-goml-outline btn-goml-sm"
                                      title="Reject Evidence"
                                      style={{ color: '#dc2626', borderColor: '#fecaca' }}
                                    >
                                      <XCircle size={12} />
                                    </button>
                                  </>
                                ) : null}

                                <button
                                  onClick={() => setEscalateModalItem(item)}
                                  className="btn-goml btn-goml-outline btn-goml-sm"
                                  title="Trigger Nudge / Escalation"
                                >
                                  <Send size={12} color="#ED7D31" />
                                </button>
                              </>
                            ) : (
                              <span className="goml-badge goml-badge-cleared">
                                <CheckCircle2 size={13} /> Verified
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Evidence Inspection Row */}
                      {isExpanded && (
                        <tr style={{ background: '#fdfaf7' }}>
                          <td colSpan={6} style={{ padding: '1.25rem 2rem' }}>
                            <div style={{ background: '#ffffff', border: '1px solid #fae6d9', borderRadius: '8px', padding: '1rem' }}>
                              <div style={{ fontWeight: 700, color: '#111827', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
                                Verification Artifact Detail:
                              </div>
                              <div style={{ fontSize: '0.8rem', color: '#475569', marginBottom: '0.35rem' }}>
                                <strong>Expected:</strong> {item.expected_evidence}
                              </div>
                              {item.has_api_key && (
                                <div style={{ fontSize: '0.8rem', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                                  <strong>Client Credential:</strong>
                                  <span className="goml-badge goml-badge-neutral" style={{ fontFamily: 'monospace', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                    <Key size={12} color="#ED7D31" />
                                    <span>{item.api_key_name || 'API_KEY'}: {item.masked_api_key}</span>
                                  </span>
                                  <span style={{ color: '#16a34a', fontWeight: 600, fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                    <ShieldCheck size={13} />
                                    <span>Zero-exposure cryptographic mask</span>
                                  </span>
                                </div>
                              )}
                              {item.evidence_file && (
                                <div style={{ fontSize: '0.8rem', marginBottom: '0.35rem' }}>
                                  <strong>File:</strong> <a href={`${BASE_URL}${item.evidence_file}`} target="_blank" rel="noreferrer" style={{ color: '#ED7D31', textDecoration: 'underline' }}>Download Artifact</a>
                                </div>
                              )}
                              {item.evidence_url && (
                                <div style={{ fontSize: '0.8rem', marginBottom: '0.35rem' }}>
                                  <strong>URL:</strong> <a href={item.evidence_url} target="_blank" rel="noreferrer" style={{ color: '#ED7D31', textDecoration: 'underline' }}>{item.evidence_url}</a>
                                </div>
                              )}
                              {item.evidence_notes && (
                                <div style={{ fontSize: '0.8rem', color: '#334155' }}>
                                  <strong>Technical Notes:</strong> {item.evidence_notes}
                                </div>
                              )}
                              {item.verification_notes && (
                                <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px dashed #e5e5e5', fontSize: '0.8rem', color: '#16a34a' }}>
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
                    <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
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
    </div>
  );
};
