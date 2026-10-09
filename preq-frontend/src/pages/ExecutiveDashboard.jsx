import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  CheckCircle, Clock, AlertTriangle, Plus, Upload, 
  ExternalLink, ArrowRight, Sparkles, Building2, Server, 
  ChevronRight, Award, ShieldAlert, CheckCircle2, Search,
  ShieldCheck, Lock, Layers, Calendar, ArrowUpRight,
  Trash2, RefreshCw, FileText, Check
} from 'lucide-react';

import { API_URL } from '../apiConfig';

export const ExecutiveDashboard = ({ onOpenCopilot }) => {
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [industryFilter, setIndustryFilter] = useState('ALL');
  const [deploymentFilter, setDeploymentFilter] = useState('ALL');
  const [dynamicIndustries, setDynamicIndustries] = useState([]);
  const [dynamicDeployments, setDynamicDeployments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isClearing, setIsClearing] = useState(false);
  const [isSeedingDemo, setIsSeedingDemo] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const navigate = useNavigate();

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const fetchData = async () => {
    try {
      const [projRes, statsRes, tmplRes] = await Promise.all([
        axios.get(`${API_URL}/projects`),
        axios.get(`${API_URL}/projects/dashboard-stats`),
        axios.get(`${API_URL}/templates`).catch(() => ({ data: {} }))
      ]);
      setProjects(projRes.data || []);
      setStats(statsRes.data);
      if (tmplRes.data?.industries) {
        setDynamicIndustries(tmplRes.data.industries);
      }
      if (tmplRes.data?.deployments) {
        setDynamicDeployments(tmplRes.data.deployments);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleClearAll = async () => {
    setIsClearing(true);
    try {
      await axios.post(`${API_URL}/projects/clear-all`);
      setProjects([]);
      setStats({
        total_projects: 0,
        cleared_projects: 0,
        at_risk_projects: 0,
        average_score: 0,
        total_critical_blockers: 0,
        recent_escalations: []
      });
      setShowClearConfirm(false);
      triggerToast('All initiatives and prerequisite data cleared successfully.');
    } catch (err) {
      console.error('Failed to clear database:', err);
      triggerToast('Error clearing database. Please try again.');
    } finally {
      setIsClearing(false);
    }
  };

  const handleDeleteProject = async (id, name, e) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete initiative "${name}"?`)) return;
    try {
      await axios.delete(`${API_URL}/projects/${id}`);
      setProjects(prev => prev.filter(p => p.id !== id));
      triggerToast(`Initiative "${name}" deleted.`);
      fetchData();
    } catch (err) {
      console.error('Failed to delete project:', err);
      triggerToast('Error deleting initiative.');
    }
  };

  const handleSeedDemo = async () => {
    setIsSeedingDemo(true);
    try {
      await axios.post(`${API_URL}/projects/seed-demo`);
      triggerToast('Benchmark MovilVentas demo initiative loaded.');
      fetchData();
    } catch (err) {
      console.error('Failed to seed demo:', err);
      triggerToast('Error seeding demo initiative.');
    } finally {
      setIsSeedingDemo(false);
    }
  };

  // Compute unique dynamic industries and deployments
  const allIndustries = useMemo(() => {
    const fromProjects = projects.map(p => p.industry).filter(Boolean);
    const combined = Array.from(new Set([...dynamicIndustries, ...fromProjects]));
    return combined.sort();
  }, [projects, dynamicIndustries]);

  const allDeployments = useMemo(() => {
    const fromProjects = projects.flatMap(p => (p.deployment ? p.deployment.split('|').map(s => s.trim()) : [])).filter(Boolean);
    const combined = Array.from(new Set([...dynamicDeployments, ...fromProjects]));
    return combined.sort();
  }, [projects, dynamicDeployments]);

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                          p.client_name.toLowerCase().includes(search.toLowerCase()) ||
                          p.type.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' ||
      (statusFilter === 'CLEARED' && p.status === 'Kick-off Cleared') ||
      (statusFilter === 'AT_RISK' && (p.status === 'At Risk' || p.status === 'Critical / Blocked')) ||
      (statusFilter === 'IN_PROGRESS' && p.status === 'In Progress');

    const matchesIndustry = industryFilter === 'ALL' || p.industry === industryFilter;
    const matchesDeployment = deploymentFilter === 'ALL' || (p.deployment && p.deployment.includes(deploymentFilter));

    return matchesSearch && matchesStatus && matchesIndustry && matchesDeployment;
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

  const clearedCount = projects.filter(p => p.status === 'Kick-off Cleared').length;
  const atRiskCount = projects.filter(p => p.status === 'At Risk' || p.status === 'Critical / Blocked').length;
  const inProgressCount = projects.filter(p => p.status === 'In Progress').length;

  return (
    <div style={{
      background: '#F8FAFC',
      minHeight: '100vh',
      paddingBottom: '5rem',
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
          padding: '12px 24px',
          borderRadius: '100px',
          fontSize: '13.5px',
          fontWeight: 700,
          boxShadow: '0 16px 36px rgba(0,0,0,0.3)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          border: '1px solid rgba(255,255,255,0.15)'
        }}>
          <CheckCircle size={18} color="#10B981" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Confirmation Modal for Clearing Database */}
      {showClearConfirm && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.72)',
          backdropFilter: 'blur(5px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '20px',
            maxWidth: '480px',
            width: '100%',
            padding: '2rem',
            boxShadow: '0 24px 48px rgba(0,0,0,0.25)',
            border: '1px solid #E2E8F0'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#DC2626',
              marginBottom: '1.25rem'
            }}>
              <Trash2 size={24} />
            </div>

            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0F172A', margin: '0 0 0.5rem 0' }}>
              Clear All Portfolio Data?
            </h3>
            <p style={{ fontSize: '14px', color: '#64748B', lineHeight: 1.6, margin: '0 0 1.75rem 0' }}>
              This will wipe all active client initiatives, prerequisite items, evidence attachments, and escalation logs. This action cannot be undone.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                style={{
                  background: 'transparent',
                  border: '1px solid #E2E8F0',
                  borderRadius: '10px',
                  padding: '10px 18px',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  color: '#64748B',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleClearAll}
                disabled={isClearing}
                style={{
                  background: '#DC2626',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '10px 22px',
                  fontSize: '13.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(220, 38, 38, 0.35)'
                }}
              >
                {isClearing ? 'Clearing...' : 'Yes, Wipe All Data'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. HERO HEADER BAR (Matching ClientPortal.jsx) */}
      <section style={{
        background: '#FFFFFF',
        padding: '2.25rem 0 1.75rem 0',
        borderBottom: '1px solid #E2E8F0'
      }}>
        <div className="goml-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
            <div style={{ maxWidth: '820px' }}>
              {/* Badges Row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.65rem', flexWrap: 'wrap' }}>
                <span style={{
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  color: '#334155',
                  padding: '4px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 700
                }}>
                  Executive Portfolio
                </span>

                <span style={{
                  background: '#FFF5EE',
                  border: '1px solid #FFD8BF',
                  color: '#EA580C',
                  padding: '4px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#EA580C' }} />
                  <span>goML Delivery Engine</span>
                </span>

                <span style={{
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  color: '#64748B',
                  padding: '4px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <ShieldCheck size={14} color="#64748B" />
                  <span>Real-Time SLA Governance</span>
                </span>
              </div>

              {/* Title & Narrative */}
              <h1 style={{
                fontSize: '2.1rem',
                fontWeight: 800,
                margin: '0 0 0.5rem 0',
                color: '#0F172A',
                letterSpacing: '-0.03em',
                lineHeight: 1.2
              }}>
                Executive Initiative Portfolio
              </h1>
              <p style={{ fontSize: '14.5px', color: '#475569', margin: 0, lineHeight: 1.6 }}>
                Real-time Day-1 readiness clearance, gatekeeper governance, and cryptographic launch verification across all enterprise deployments.
              </p>
            </div>

            {/* Dashboard Action Controls */}
            <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', flexWrap: 'wrap' }}>
              {projects.length > 0 && (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  style={{
                    background: '#FFFFFF',
                    color: '#DC2626',
                    border: '1.5px solid #FECACA',
                    borderRadius: '10px',
                    padding: '9px 16px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '7px',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.background = '#FEF2F2'; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = '#FFFFFF'; }}
                  title="Clear all initiatives from database"
                >
                  <Trash2 size={14} color="#DC2626" />
                  <span>Clear All</span>
                </button>
              )}

              <button
                onClick={() => navigate('/new?tab=sow')}
                style={{
                  background: '#FFFFFF',
                  color: '#0F172A',
                  border: '1.5px solid #E2E8F0',
                  borderRadius: '10px',
                  padding: '9px 18px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '7px',
                  transition: 'all 0.15s ease'
                }}
                onMouseOver={(e) => { e.currentTarget.style.borderColor = '#ED7D31'; e.currentTarget.style.color = '#ED7D31'; }}
                onMouseOut={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.color = '#0F172A'; }}
              >
                <Upload size={14} color="#0F172A" />
                <span>Upload SOW / Proposal</span>
              </button>

              <button
                onClick={() => navigate('/new')}
                style={{
                  background: '#ED7D31',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '10px 22px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '7px',
                  boxShadow: '0 4px 14px rgba(237, 125, 49, 0.35)',
                  transition: 'all 0.15s ease'
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = '#D94E06'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = '#ED7D31'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <Plus size={15} strokeWidth={2.5} />
                <span>New Initiative</span>
              </button>
            </div>
          </div>

          {/* 4-COLUMN KPI METRIC STRIP (Aligned with ClientPortal.jsx / WeeklyPlanner.jsx) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '14px',
            marginTop: '1.75rem',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}>
            {/* KPI 1: Readiness Index */}
            <div style={{ padding: '1.35rem 1.6rem', borderRight: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#64748B', marginBottom: '6px' }}>
                PORTFOLIO READINESS INDEX
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{
                  fontSize: '2.1rem',
                  fontWeight: 800,
                  color: (stats?.average_score || 0) >= 80 ? '#000000' : (stats?.average_score || 0) > 0 ? '#ED7D31' : '#000000',
                  letterSpacing: '-0.03em'
                }}>
                  {stats ? stats.average_score : 0}%
                </span>
                <span style={{ fontSize: '12px', color: '#71717A', fontWeight: 600 }}>Weighted Average</span>
              </div>
              <div style={{ width: '100%', height: '4px', background: '#F4F4F5', borderRadius: '9999px', overflow: 'hidden', marginTop: '8px' }}>
                <div style={{
                  width: `${stats?.average_score || 0}%`,
                  height: '100%',
                  background: (stats?.average_score || 0) >= 80 ? '#000000' : '#ED7D31',
                  borderRadius: '9999px'
                }} />
              </div>
            </div>

            {/* KPI 2: Critical Blockers */}
            <div style={{ padding: '1.35rem 1.6rem', borderRight: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#71717A', marginBottom: '6px' }}>
                CRITICAL GATEKEEPERS
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{
                  fontSize: '2.1rem',
                  fontWeight: 800,
                  color: (stats?.total_critical_blockers || 0) > 0 ? '#EA580C' : '#000000',
                  letterSpacing: '-0.03em'
                }}>
                  {stats ? stats.total_critical_blockers : 0}
                </span>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '6px',
                  background: (stats?.total_critical_blockers || 0) > 0 ? '#FFF7ED' : '#F4F4F5',
                  color: (stats?.total_critical_blockers || 0) > 0 ? '#EA580C' : '#18181B',
                  border: (stats?.total_critical_blockers || 0) > 0 ? '1px solid #FED7AA' : '1px solid #E4E4E7'
                }}>
                  {(stats?.total_critical_blockers || 0) > 0 ? 'Action Required' : 'All Clear'}
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#71717A', marginTop: '6px' }}>
                Zero-tolerance blockers halting kick-off
              </div>
            </div>

            {/* KPI 3: Cleared for Kick-off */}
            <div style={{ padding: '1.35rem 1.6rem', borderRight: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#71717A', marginBottom: '6px' }}>
                CLEARED FOR KICK-OFF
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontSize: '2.1rem', fontWeight: 800, color: '#000000', letterSpacing: '-0.03em' }}>
                  {stats ? stats.cleared_projects : 0}
                </span>
                <span style={{ fontSize: '13px', color: '#71717A', fontWeight: 600 }}>/ {stats ? stats.total_projects : 0} Initiatives</span>
              </div>
              <div style={{ fontSize: '12px', color: '#71717A', marginTop: '6px' }}>
                100% verified &amp; certified for Day-1
              </div>
            </div>

            {/* KPI 4: Active Initiatives / Escalations */}
            <div style={{ padding: '1.35rem 1.6rem' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#71717A', marginBottom: '6px' }}>
                ACTIVE SLA ESCALATIONS
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{
                  fontSize: '2.1rem',
                  fontWeight: 800,
                  color: (stats?.recent_escalations?.length || 0) > 0 ? '#ED7D31' : '#000000',
                  letterSpacing: '-0.03em'
                }}>
                  {stats?.recent_escalations?.length || 0}
                </span>
                <span style={{ fontSize: '12px', color: '#71717A', fontWeight: 600 }}>Alerts Dispatched</span>
              </div>
              <div style={{ fontSize: '12px', color: '#64748B', marginTop: '6px' }}>
                Automated multi-tier SLA monitoring
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. REGISTRY SECTION */}
      <section style={{ paddingTop: '2rem' }}>
        <div className="goml-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.45rem', margin: 0, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
                Initiative Registry
              </h2>
              <p style={{ color: '#64748B', fontSize: '13.5px', margin: '0.25rem 0 0' }}>
                Track delivery clearance, gatekeepers, and client portal links for each active deployment.
              </p>
            </div>

            {projects.length > 0 && (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <span style={{
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  padding: '5px 12px',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#334155'
                }}>
                  {filteredProjects.length} of {projects.length} Shown
                </span>
              </div>
            )}
          </div>

          {/* Table Filters Toolbar (Only show when projects exist) */}
          {projects.length > 0 && (
            <div style={{
              display: 'flex',
              gap: '0.75rem',
              alignItems: 'center',
              marginBottom: '1.25rem',
              flexWrap: 'wrap',
              background: '#FFFFFF',
              padding: '0.85rem 1.15rem',
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
            }}>
              {/* Search */}
              <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
                <Search size={15} color="#94A3B8" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Search by initiative name, client, or cloud..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '7px 12px 7px 34px',
                    borderRadius: '8px',
                    border: '1.5px solid #E2E8F0',
                    fontSize: '13px',
                    outline: 'none',
                    background: '#F8FAFC',
                    color: '#0F172A',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              {/* Status Filter Pills */}
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {[
                  { id: 'ALL', label: `All (${projects.length})` },
                  { id: 'CLEARED', label: `Cleared (${clearedCount})` },
                  { id: 'AT_RISK', label: `At Risk (${atRiskCount})` },
                  { id: 'IN_PROGRESS', label: `In Progress (${inProgressCount})` }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setStatusFilter(tab.id)}
                    style={{
                      backgroundColor: statusFilter === tab.id ? '#0F172A' : '#F1F5F9',
                      color: statusFilter === tab.id ? '#FFFFFF' : '#475569',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '6px 14px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Industry Filter */}
              {allIndustries.length > 0 && (
                <select
                  value={industryFilter}
                  onChange={(e) => setIndustryFilter(e.target.value)}
                  style={{
                    padding: '6px 12px',
                    fontSize: '12.5px',
                    borderRadius: '8px',
                    border: '1.5px solid #E2E8F0',
                    background: '#FFFFFF',
                    color: '#334155',
                    outline: 'none',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  <option value="ALL">All Industries</option>
                  {allIndustries.map((ind) => (
                    <option key={ind} value={ind}>{ind}</option>
                  ))}
                </select>
              )}

              {/* Deployment Filter */}
              {allDeployments.length > 0 && (
                <select
                  value={deploymentFilter}
                  onChange={(e) => setDeploymentFilter(e.target.value)}
                  style={{
                    padding: '6px 12px',
                    fontSize: '12.5px',
                    borderRadius: '8px',
                    border: '1.5px solid #E2E8F0',
                    background: '#FFFFFF',
                    color: '#334155',
                    outline: 'none',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  <option value="ALL">All Deployments</option>
                  {allDeployments.map((dep) => (
                    <option key={dep} value={dep}>{dep}</option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* 3. TABLE / EMPTY STATE CONTAINER */}
          {projects.length === 0 ? (
            /* EMPTY STATE (Aligned with Client Portal) */
            <div style={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '16px',
              padding: '4.5rem 2rem',
              textAlign: 'center',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {/* Glowing Icon Container */}
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '18px',
                background: '#FFF5EE',
                border: '1.5px solid #FFD8BF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#EA580C',
                marginBottom: '1.5rem',
                boxShadow: '0 8px 24px rgba(234, 88, 12, 0.15)'
              }}>
                <Sparkles size={30} color="#000000" />
              </div>

              <h3 style={{
                fontSize: '1.65rem',
                fontWeight: 800,
                color: '#0F172A',
                margin: '0 0 0.6rem 0',
                letterSpacing: '-0.025em'
              }}>
                Executive Portfolio Empty
              </h3>

              <p style={{
                fontSize: '14.5px',
                color: '#64748B',
                maxWidth: '540px',
                lineHeight: 1.6,
                margin: '0 0 2rem 0'
              }}>
                All initiative records have been cleared. Upload an enterprise Statement of Work (SOW) or provision a new initiative to begin automated Day-1 readiness tracking.
              </p>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <button
                  onClick={() => navigate('/new?tab=sow')}
                  style={{
                    background: '#ED7D31',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '11px 24px',
                    fontSize: '13.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(237, 125, 49, 0.35)',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.background = '#D94E06'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = '#ED7D31'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <Upload size={16} color="#FFFFFF" />
                  <span>Upload SOW / Proposal</span>
                </button>

                <button
                  onClick={() => navigate('/new')}
                  style={{
                    background: '#0F172A',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '11px 22px',
                    fontSize: '13.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.background = '#1E293B'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = '#0F172A'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <Plus size={16} strokeWidth={2.5} />
                  <span>Provision New Initiative</span>
                </button>

                <button
                  onClick={handleSeedDemo}
                  disabled={isSeedingDemo}
                  style={{
                    background: '#FFFFFF',
                    color: '#0F172A',
                    border: '1.5px solid #CBD5E1',
                    borderRadius: '10px',
                    padding: '11px 20px',
                    fontSize: '13.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.borderColor = '#ED7D31'; e.currentTarget.style.color = '#ED7D31'; }}
                  onMouseOut={(e) => { e.currentTarget.style.borderColor = '#CBD5E1'; e.currentTarget.style.color = '#0F172A'; }}
                >
                  <FileText size={15} color="#0F172A" />
                  <span>{isSeedingDemo ? 'Loading Demo...' : 'Load MovilVentas Benchmark Demo'}</span>
                </button>
              </div>
            </div>
          ) : (
            /* DATA TABLE (Enterprise Tabular UI) */
            <div style={{
              background: '#FFFFFF',
              borderRadius: '14px',
              border: '1px solid #E2E8F0',
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
            }}>
              <table className="goml-table" style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th style={{ width: '28%' }}>Initiative &amp; Client</th>
                    <th style={{ width: '18%' }}>Archetype &amp; Cloud</th>
                    <th style={{ width: '14%' }}>Target Kick-off</th>
                    <th style={{ width: '18%' }}>Readiness Progress</th>
                    <th style={{ width: '12%' }}>Gatekeeper State</th>
                    <th style={{ width: '10%', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProjects.map(proj => (
                    <tr key={proj.id} style={{ transition: 'background 0.12s ease' }}>
                      {/* Initiative & Client */}
                      <td>
                        <div>
                          <Link
                            to={`/dashboard/${proj.id}`}
                            style={{
                              fontWeight: 700,
                              color: '#0F172A',
                              textDecoration: 'none',
                              fontSize: '0.94rem',
                              display: 'block',
                              marginBottom: '0.25rem',
                              lineHeight: 1.35
                            }}
                            onMouseOver={(e) => e.currentTarget.style.color = '#ED7D31'}
                            onMouseOut={(e) => e.currentTarget.style.color = '#0F172A'}
                          >
                            {proj.name}
                          </Link>
                          <div style={{ fontSize: '0.8rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                            <Building2 size={13} color="#64748B" />
                            <strong style={{ color: '#0F172A' }}>{proj.client_name}</strong>
                            {proj.industry && (
                              <>
                                <span>•</span>
                                <span>{proj.industry.split('(')[0].trim()}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Archetype & Cloud */}
                      <td>
                        <div>
                          <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#334155' }}>
                            {proj.type}
                          </div>
                          {proj.deployment && (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.76rem', color: '#64748B', marginTop: '0.2rem' }}>
                              <Server size={12} color="#64748B" />
                              <span>{proj.deployment}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Target Kick-off */}
                      <td>
                        <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0F172A' }}>
                          {proj.target_kickoff_date || 'TBD'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '0.15rem' }}>
                          Target SLA
                        </div>
                      </td>

                      {/* Readiness Progress */}
                      <td>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                            <span style={{ color: proj.score >= 90 ? '#000000' : proj.score > 0 ? '#ED7D31' : '#71717A' }}>
                              {proj.score}% Score
                            </span>
                            <span style={{ color: '#71717A', fontWeight: 600 }}>
                              {proj.verified_items} / {proj.total_items}
                            </span>
                          </div>
                          <div style={{ width: '100%', height: '5px', background: '#F4F4F5', borderRadius: '9999px', overflow: 'hidden' }}>
                            <div
                              style={{
                                width: `${proj.score}%`,
                                height: '100%',
                                borderRadius: '9999px',
                                backgroundColor: proj.score >= 90 ? '#000000' : '#ED7D31'
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Gatekeeper State */}
                      <td>
                        <div>
                          {getStatusBadge(proj.status)}
                          {proj.critical_blockers > 0 && (
                            <div style={{ fontSize: '0.74rem', color: '#EA580C', fontWeight: 700, marginTop: '0.25rem' }}>
                              {proj.critical_blockers} blocker{proj.critical_blockers > 1 ? 's' : ''}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center' }}>
                          <button
                            onClick={() => navigate(`/dashboard/${proj.id}`)}
                            style={{
                              background: '#0F172A',
                              color: '#FFFFFF',
                              border: 'none',
                              borderRadius: '8px',
                              padding: '5px 12px',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              transition: 'background 0.15s ease'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = '#ED7D31'}
                            onMouseOut={(e) => e.currentTarget.style.background = '#0F172A'}
                            title="Open Initiative Workspace"
                          >
                            Workspace
                          </button>

                          <button
                            onClick={() => navigate(`/client/${proj.id}`)}
                            style={{
                              background: '#FFFFFF',
                              color: '#475569',
                              border: '1.5px solid #E2E8F0',
                              borderRadius: '8px',
                              padding: '5px 11px',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                            title="Client Portal View"
                          >
                            <span>Client</span>
                            <ArrowUpRight size={12} color="#64748B" />
                          </button>

                          {proj.score >= 90 && proj.critical_blockers === 0 && (
                            <button
                              onClick={() => navigate(`/certificate/${proj.id}`)}
                              style={{
                                background: '#FFF5EE',
                                color: '#EA580C',
                                border: '1.5px solid #FFD8BF',
                                borderRadius: '8px',
                                padding: '5px 9px',
                                fontSize: '12px',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                              title="Official Kick-Off Certificate"
                            >
                              <Award size={14} />
                            </button>
                          )}

                          <button
                            onClick={(e) => handleDeleteProject(proj.id, proj.name, e)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#94A3B8',
                              cursor: 'pointer',
                              padding: '4px',
                              borderRadius: '6px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.color = '#DC2626'}
                            onMouseOut={(e) => e.currentTarget.style.color = '#94A3B8'}
                            title="Delete Initiative"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredProjects.length === 0 && !loading && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '3.5rem', color: '#64748B', fontSize: '13.5px' }}>
                        No initiatives match your search or filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* 4. ESCALATION CENTER STRIP */}
      {stats?.recent_escalations && stats.recent_escalations.length > 0 && (
        <section style={{ padding: '2.5rem 0 0 0' }}>
          <div className="goml-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#ED7D31', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>
                  SLA GOVERNANCE
                </div>
                <h3 style={{ fontSize: '1.35rem', margin: 0, fontWeight: 800, color: '#0F172A' }}>Active Escalation Trail</h3>
              </div>
              <span className="goml-badge goml-badge-critical">
                {stats.recent_escalations.length} Active SLA Alerts
              </span>
            </div>

            <div style={{
              background: '#FFFFFF',
              borderRadius: '14px',
              border: '1px solid #E2E8F0',
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
            }}>
              <table className="goml-table" style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th style={{ width: '12%' }}>Severity</th>
                    <th style={{ width: '38%' }}>Escalation Event</th>
                    <th style={{ width: '25%' }}>Recipient / Owner</th>
                    <th style={{ width: '15%' }}>Dispatched</th>
                    <th style={{ width: '10%', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recent_escalations.map(esc => (
                    <tr key={esc.id}>
                      <td>
                        <span className={`goml-badge ${esc.level === 3 ? 'goml-badge-critical' : esc.level === 2 ? 'goml-badge-risk' : 'goml-badge-orange'}`}>
                          Tier {esc.level}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '13px' }}>{esc.title}</div>
                        <div style={{ fontSize: '12px', color: '#64748B', marginTop: '0.15rem' }}>{esc.message}</div>
                      </td>
                      <td>
                        <div style={{ fontSize: '12.5px', color: '#334155', fontWeight: 500 }}>{esc.recipient}</div>
                      </td>
                      <td>
                        <div style={{ fontSize: '12px', color: '#94A3B8' }}>
                          {new Date(esc.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Link
                          to={`/dashboard/${esc.project_id}`}
                          style={{
                            background: '#F1F5F9',
                            color: '#334155',
                            border: '1px solid #E2E8F0',
                            borderRadius: '8px',
                            padding: '4px 10px',
                            fontSize: '11.5px',
                            fontWeight: 700,
                            textDecoration: 'none'
                          }}
                        >
                          Resolve
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
