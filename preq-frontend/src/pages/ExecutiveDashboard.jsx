import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  CheckCircle, Clock, AlertTriangle, Plus, Upload, 
  ExternalLink, ArrowRight, Sparkles, Building2, Server, 
  ChevronRight, Award, ShieldAlert, CheckCircle2, Search
} from 'lucide-react';

import { API_URL } from '../apiConfig';

export const ExecutiveDashboard = ({ onOpenCopilot }) => {
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [industryFilter, setIndustryFilter] = useState('ALL');
  const [deploymentFilter, setDeploymentFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const [projRes, statsRes] = await Promise.all([
        axios.get(`${API_URL}/projects`),
        axios.get(`${API_URL}/projects/dashboard-stats`)
      ]);
      setProjects(projRes.data);
      setStats(statsRes.data);
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

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                          p.client_name.toLowerCase().includes(search.toLowerCase()) ||
                          p.type.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' ||
      (statusFilter === 'CLEARED' && p.status === 'Kick-off Cleared') ||
      (statusFilter === 'AT_RISK' && (p.status === 'At Risk' || p.status === 'Critical / Blocked')) ||
      (statusFilter === 'IN_PROGRESS' && p.status === 'In Progress');

    const matchesIndustry = industryFilter === 'ALL' || p.industry === industryFilter;
    const matchesDeployment = deploymentFilter === 'ALL' || p.deployment === deploymentFilter;

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

  return (
    <div>
      {/* Hero Section */}
      <section className="goml-section" style={{ paddingTop: '3rem', paddingBottom: '3rem', background: '#ffffff' }}>
        <div className="goml-container">
          <div style={{ maxWidth: '850px' }}>
            <h1 style={{ fontSize: '3rem', fontWeight: 800, lineHeight: 1.15, marginBottom: '1.25rem' }}>
              The <span className="creative-text">PreQ</span> Day-1 Kick-off Readiness Platform
            </h1>
            <p style={{ fontSize: '1.15rem', color: '#475569', lineHeight: 1.6, marginBottom: '2rem' }}>
              Automated pre-requisite verification, dependency engine governance, and cryptographic kick-off certification for enterprise AI and cloud implementations.
            </p>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => navigate('/new')}
                className="btn-goml btn-goml-black"
                style={{ fontSize: '0.95rem', padding: '0.85rem 1.75rem' }}
              >
                <span>Initialize Initiative</span>
                <ArrowRight size={16} />
              </button>

              <button
                onClick={() => navigate('/new?tab=sow')}
                className="btn-goml btn-goml-orange"
                style={{ fontSize: '0.95rem', padding: '0.85rem 1.75rem' }}
              >
                <Upload size={16} />
                <span>Upload Statement of Work (SOW)</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* PreQ Capability Ribbon */}
      <div className="marquee-ribbon">
        <div className="marquee-content">
          <span><span className="marquee-dot" /> Zero Day-1 Delivery Blockers</span>
          <span><span className="marquee-dot" /> Automated Groq LLM Evidence Auditing</span>
          <span><span className="marquee-dot" /> Multi-Tier Dependency Lock Engine</span>
          <span><span className="marquee-dot" /> Zero-Exposure Masked Credentials</span>
          <span><span className="marquee-dot" /> SHA-256 Cryptographic Readiness Certificates</span>
          <span><span className="marquee-dot" /> Client Portal One-Click Evidence Ingestion</span>
          <span><span className="marquee-dot" /> Real-Time SLA Escalation Triggers</span>
        </div>
      </div>

      {/* GoML 3-Column Metrics Stripe */}
      <section className="goml-section" style={{ background: '#fafbfc' }}>
        <div className="goml-container">
          <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--goml-orange)', letterSpacing: '0.08em', marginBottom: '0.25rem' }}>
                Delivery Benchmarks
              </div>
              <h2 style={{ fontSize: '1.85rem' }}>
                Day-1 Kick-Off Readiness & Gatekeeper Benchmarks
              </h2>
            </div>

            {stats && (
              <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.9rem' }}>
                <div>
                  <strong style={{ fontSize: '1.25rem', color: '#111827' }}>{stats.total_projects}</strong> Active Initiatives
                </div>
                <div>
                  <strong style={{ fontSize: '1.25rem', color: '#16a34a' }}>{stats.cleared_projects}</strong> Cleared for Launch
                </div>
                <div>
                  <strong style={{ fontSize: '1.25rem', color: '#d97706' }}>{stats.average_score}%</strong> Portfolio Score
                </div>
              </div>
            )}
          </div>

          <div className="metric-stripe">
            {/* Column 1: Portfolio Readiness */}
            <div className="metric-stripe-col">
              <div className="metric-stripe-tag">Portfolio Readiness Index</div>
              <div className="metric-stripe-val" style={{ color: (stats?.average_score || 0) >= 80 ? '#16a34a' : '#d97706' }}>
                {stats ? stats.average_score : 0}<span style={{ fontSize: '1.5rem', fontWeight: 600 }}>%</span>
              </div>
              <div className="metric-stripe-desc">
                Weighted readiness clearance across all active enterprise client initiatives.
              </div>
              <div className="metric-stripe-legacy">
                <strong>{stats ? stats.total_projects : 0}</strong> Active client initiatives in pipeline
              </div>
            </div>

            {/* Column 2: Critical Gatekeepers */}
            <div className="metric-stripe-col">
              <div className="metric-stripe-tag">Critical Gatekeepers</div>
              <div className="metric-stripe-val" style={{ color: (stats?.total_critical_blockers || 0) > 0 ? '#dc2626' : '#16a34a' }}>
                {stats ? stats.total_critical_blockers : 0} <span style={{ fontSize: '1.25rem', fontWeight: 600 }}>{stats?.total_critical_blockers === 1 ? 'Blocker' : 'Blockers'}</span>
              </div>
              <div className="metric-stripe-desc">
                Zero-tolerance pre-requisite items halting Day-1 production implementation.
              </div>
              <div className="metric-stripe-legacy">
                <strong>{stats ? stats.at_risk_projects : 0}</strong> Initiatives currently flagged At Risk
              </div>
            </div>

            {/* Column 3: Cleared for Kick-off */}
            <div className="metric-stripe-col">
              <div className="metric-stripe-tag">Cleared for Kick-off</div>
              <div className="metric-stripe-val" style={{ color: '#16a34a' }}>
                {stats ? stats.cleared_projects : 0} <span style={{ fontSize: '1.25rem', fontWeight: 600, color: '#64748b' }}>/ {stats ? stats.total_projects : 0}</span>
              </div>
              <div className="metric-stripe-desc">
                Initiatives with 100% verified evidence and issued Kick-off Readiness Certificates.
              </div>
              <div className="metric-stripe-legacy">
                <strong>100%</strong> Audit-verified gatekeeper artifacts
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Table View (NO CARDS! Enterprise Data Table UI) */}
      <section className="goml-section" style={{ background: '#ffffff' }}>
        <div className="goml-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.6rem', margin: 0 }}>Executive Initiative Registry</h2>
              <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '0.25rem 0 0' }}>
                All enterprise client deployments, readiness audit scores, and gatekeeper clearances.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => navigate('/new')} className="btn-goml btn-goml-black btn-goml-sm">
                <Plus size={14} /> New Initiative
              </button>
            </div>
          </div>

          {/* Table Filters Toolbar */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            alignItems: 'center',
            marginBottom: '1.25rem',
            flexWrap: 'wrap',
            background: '#f8fafc',
            padding: '0.85rem 1.25rem',
            borderRadius: '10px',
            border: '1px solid #e5e5e5'
          }}>
            {/* Search */}
            <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
              <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                className="goml-input"
                placeholder="Search by initiative, client, or technology..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: '2.5rem', padding: '0.55rem 0.85rem 0.55rem 2.5rem', fontSize: '0.85rem' }}
              />
            </div>

            {/* Status Filter Buttons */}
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              {[
                { id: 'ALL', label: 'All' },
                { id: 'CLEARED', label: 'Cleared' },
                { id: 'AT_RISK', label: 'At Risk' },
                { id: 'IN_PROGRESS', label: 'In Progress' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className="btn-goml btn-goml-sm"
                  style={{
                    backgroundColor: statusFilter === tab.id ? 'var(--goml-black)' : 'transparent',
                    color: statusFilter === tab.id ? '#ffffff' : '#475569',
                    border: 'none',
                    fontWeight: 600
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Industry Filter */}
            <select
              className="goml-input"
              value={industryFilter}
              onChange={(e) => setIndustryFilter(e.target.value)}
              style={{ width: 'auto', minWidth: '170px', padding: '0.55rem 0.85rem', fontSize: '0.85rem' }}
            >
              <option value="ALL">All Industries</option>
              <option value="BFSI (Banking & Financial Services)">BFSI</option>
              <option value="Healthcare & Life Sciences">Healthcare</option>
              <option value="Retail & E-Commerce">Retail</option>
              <option value="Manufacturing & Supply Chain">Manufacturing</option>
              <option value="Public Sector & GovTech">Public Sector</option>
              <option value="Telecom & Technology">Telecom & Tech</option>
            </select>

            {/* Deployment Filter */}
            <select
              className="goml-input"
              value={deploymentFilter}
              onChange={(e) => setDeploymentFilter(e.target.value)}
              style={{ width: 'auto', minWidth: '150px', padding: '0.55rem 0.85rem', fontSize: '0.85rem' }}
            >
              <option value="ALL">All Deployments</option>
              <option value="AWS Cloud">AWS Cloud</option>
              <option value="Microsoft Azure">Microsoft Azure</option>
              <option value="Google Cloud Platform (GCP)">GCP</option>
              <option value="Hybrid & On-Premise">Hybrid</option>
              <option value="Multi-Cloud Kubernetes">Multi-Cloud K8s</option>
            </select>
          </div>

          {/* Clean Enterprise Data Table (NO CARDS!) */}
          <div className="goml-table-wrapper">
            <table className="goml-table">
              <thead>
                <tr>
                  <th style={{ width: '28%' }}>Initiative & Client</th>
                  <th style={{ width: '18%' }}>Archetype & Cloud</th>
                  <th style={{ width: '14%' }}>Target Kick-off</th>
                  <th style={{ width: '18%' }}>Readiness Progress</th>
                  <th style={{ width: '12%' }}>Gatekeeper State</th>
                  <th style={{ width: '10%', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map(proj => (
                  <tr key={proj.id}>
                    {/* Initiative & Client */}
                    <td>
                      <div>
                        <Link
                          to={`/dashboard/${proj.id}`}
                          style={{
                            fontWeight: 700,
                            color: '#111827',
                            textDecoration: 'none',
                            fontSize: '0.95rem',
                            display: 'block',
                            marginBottom: '0.2rem'
                          }}
                        >
                          {proj.name}
                        </Link>
                        <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Building2 size={13} color="#ED7D31" />
                          <strong>{proj.client_name}</strong>
                          <span>•</span>
                          <span>{proj.industry.split(' ')[0]}</span>
                        </div>
                      </div>
                    </td>

                    {/* Archetype & Cloud */}
                    <td>
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
                          {proj.type}
                        </div>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                          <Server size={12} color="#ED7D31" />
                          <span>{proj.deployment}</span>
                        </div>
                      </div>
                    </td>

                    {/* Target Kick-off */}
                    <td>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#111827' }}>
                        {proj.target_kickoff_date || 'TBD'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
                        Day-1 Countdown
                      </div>
                    </td>

                    {/* Readiness Progress */}
                    <td>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                          <span style={{ color: proj.score >= 90 ? '#16a34a' : proj.score >= 50 ? '#d97706' : '#dc2626' }}>
                            {proj.score}% Score
                          </span>
                          <span style={{ color: '#64748b' }}>
                            {proj.verified_items} / {proj.total_items}
                          </span>
                        </div>
                        <div style={{ width: '100%', height: '6px', background: '#e5e5e5', borderRadius: '3px', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${proj.score}%`,
                              height: '100%',
                              backgroundColor: proj.score >= 90 ? '#16a34a' : proj.score >= 50 ? '#d97706' : '#dc2626'
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
                          <div style={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: 600, marginTop: '0.25rem' }}>
                            {proj.critical_blockers} blocker{proj.critical_blockers > 1 ? 's' : ''} open
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                        <button
                          onClick={() => navigate(`/dashboard/${proj.id}`)}
                          className="btn-goml btn-goml-black btn-goml-sm"
                          title="Open Workspace"
                        >
                          Workspace
                        </button>

                        <button
                          onClick={() => navigate(`/client/${proj.id}`)}
                          className="btn-goml btn-goml-outline btn-goml-sm"
                          title="Client Portal View"
                        >
                          Client
                        </button>

                        {proj.score >= 90 && proj.critical_blockers === 0 && (
                          <button
                            onClick={() => navigate(`/certificate/${proj.id}`)}
                            className="btn-goml btn-goml-orange btn-goml-sm"
                            title="Official Kick-Off Certificate"
                          >
                            <Award size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredProjects.length === 0 && !loading && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                      No initiatives match your search or filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Escalation Center Strip (Tabular) */}
      {stats?.recent_escalations && stats.recent_escalations.length > 0 && (
        <section className="goml-section" style={{ background: '#fdfaf7' }}>
          <div className="goml-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--goml-orange)', letterSpacing: '0.08em', marginBottom: '0.25rem' }}>
                  SLA Governance
                </div>
                <h3 style={{ fontSize: '1.4rem', margin: 0 }}>Active Escalation Trail</h3>
              </div>
              <span className="goml-badge goml-badge-critical">
                {stats.recent_escalations.length} Active SLA Alerts
              </span>
            </div>

            <div className="goml-table-wrapper">
              <table className="goml-table">
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
                        <div style={{ fontWeight: 700, color: '#111827' }}>{esc.title}</div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem' }}>{esc.message}</div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.85rem', color: '#334155' }}>{esc.recipient}</div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                          {new Date(esc.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Link to={`/dashboard/${esc.project_id}`} className="btn-goml btn-goml-outline btn-goml-sm">
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
