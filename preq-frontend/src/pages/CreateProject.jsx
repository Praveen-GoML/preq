import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { 
  Upload, Cpu, ArrowRight, Layers, Sparkles, Loader2, CheckCircle2 
} from 'lucide-react';

import { API_URL } from '../apiConfig';

const PROJECT_TYPES = [
  { id: "GenAI / LLM Application", label: "GenAI & LLM Application", desc: "Foundation models, RAG document stores, token rate limits, AI safety policies" },
  { id: "Cloud Migration & Modernization", label: "Cloud Migration & Modernization", desc: "Landing zone, IAM federation, VPN / DirectConnect interconnect, rollback runbooks" },
  { id: "Enterprise Data Platform & Lakehouse", label: "Data Platform & Lakehouse", desc: "Object storage tiers, CDC read-replicas, schema freeze, data privacy line of defense" },
  { id: "Full-Stack Web & Microservices", label: "Web & Microservices", desc: "Kubernetes ingress, CI/CD runners, secret stores, OIDC authentication tenants" },
  { id: "Cybersecurity & Zero Trust Architecture", label: "Cybersecurity & Zero Trust", desc: "Hardware token MFA, SIEM SOC ingestion, ZTNA connector, pen-test scopes" },
  { id: "ERP / CRM Enterprise System Integration", label: "ERP / CRM Integration", desc: "SAP / Salesforce full-copy sandboxes, OData APIs, mTLS certs, business mapping" }
];

const INDUSTRIES = [
  "BFSI (Banking & Financial Services)",
  "Healthcare & Life Sciences",
  "Retail & E-Commerce",
  "Manufacturing & Supply Chain",
  "Public Sector & GovTech",
  "Telecom & Technology"
];

const DEPLOYMENTS = [
  "AWS Cloud",
  "Microsoft Azure",
  "Google Cloud Platform (GCP)",
  "Hybrid & On-Premise",
  "Multi-Cloud Kubernetes"
];

export const CreateProject = () => {
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState(searchParams.get('tab') === 'sow' ? 'sow' : 'wizard');
  const navigate = useNavigate();

  // Wizard state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [projectType, setProjectType] = useState(PROJECT_TYPES[0].id);
  const [industry, setIndustry] = useState(INDUSTRIES[0]);
  const [deployment, setDeployment] = useState(DEPLOYMENTS[0]);
  const [kickoffDate, setKickoffDate] = useState('');
  const [wizardLoading, setWizardLoading] = useState(false);
  const [wizardError, setWizardError] = useState('');

  // SOW state
  const [file, setFile] = useState(null);
  const [sowText, setSowText] = useState('');
  const [sowLoading, setSowLoading] = useState(false);
  const [sowStatus, setSowStatus] = useState('');
  const [sowError, setSowError] = useState('');

  const handleCreateWizard = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setWizardError('Initiative name is required.');
      return;
    }
    setWizardLoading(true);
    setWizardError('');

    try {
      const res = await axios.post(`${API_URL}/projects`, {
        name: name.trim(),
        description: description.trim(),
        client_name: clientName.trim() || 'Enterprise Client',
        client_email: clientEmail.trim() || 'sponsor@client.com',
        type: projectType,
        industry: industry,
        deployment: deployment,
        target_kickoff_date: kickoffDate || ''
      });

      navigate(`/dashboard/${res.data.id}`);
    } catch (err) {
      console.error(err);
      setWizardError(err.response?.data?.detail || 'Failed to initialize project.');
    } finally {
      setWizardLoading(false);
    }
  };

  const handleAnalyzeSOW = async (e) => {
    e.preventDefault();
    if (!file && !sowText.trim()) {
      setSowError('Please upload an SOW document (.pdf, .txt) or paste Statement of Work text.');
      return;
    }

    setSowLoading(true);
    setSowError('');
    setSowStatus('Uploading Statement of Work to GoML AI Engine...');

    try {
      setTimeout(() => setSowStatus('Extracting client scope, technology stack & security boundaries...'), 1200);
      setTimeout(() => setSowStatus('Generating tailored prerequisites across Data, Env, Compliance & People...'), 2400);

      let res;
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        res = await axios.post(`${API_URL}/analyze-sow-file`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        res = await axios.post(`${API_URL}/analyze-sow`, {
          content: sowText
        });
      }

      navigate(`/dashboard/${res.data.id}`);
    } catch (err) {
      console.error(err);
      setSowError(err.response?.data?.detail || 'AI SOW analysis encountered an error.');
    } finally {
      setSowLoading(false);
    }
  };

  return (
    <div>
      {/* Hero Header */}
      <section className="goml-section" style={{ background: '#ffffff', paddingTop: '3rem', paddingBottom: '3rem' }}>
        <div className="goml-container">
          <div style={{ maxWidth: '800px' }}>
            <h1 style={{ fontSize: '2.75rem', fontWeight: 800, marginBottom: '0.75rem' }}>
              Initialize <span className="creative-text">PreQ</span> Pre-requisite Workspace
            </h1>
            <p style={{ fontSize: '1.1rem', color: '#475569', lineHeight: 1.6, marginBottom: '2rem' }}>
              Select an architectural blueprint or let AI extract deliverables and pre-requisites from your Statement of Work.
            </p>

            {/* Tab Pills */}
            <div style={{ display: 'inline-flex', gap: '0.5rem', background: '#f1f5f9', padding: '0.35rem', borderRadius: '9999px' }}>
              <button
                onClick={() => setTab('wizard')}
                className="btn-goml btn-goml-sm"
                style={{
                  backgroundColor: tab === 'wizard' ? 'var(--goml-black)' : 'transparent',
                  color: tab === 'wizard' ? '#ffffff' : '#475569',
                  border: 'none',
                  fontWeight: 600
                }}
              >
                <Layers size={14} /> Interactive Blueprint Wizard
              </button>
              <button
                onClick={() => setTab('sow')}
                className="btn-goml btn-goml-sm"
                style={{
                  backgroundColor: tab === 'sow' ? 'var(--goml-black)' : 'transparent',
                  color: tab === 'sow' ? '#ffffff' : '#475569',
                  border: 'none',
                  fontWeight: 600
                }}
              >
                <Sparkles size={14} color={tab === 'sow' ? '#ED7D31' : '#64748b'} /> AI SOW Extractor
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Wizard Form Strip (NO CARDS - Structured Form Section) */}
      {tab === 'wizard' && (
        <section className="goml-section" style={{ background: '#fdfaf7', paddingTop: '2.5rem', paddingBottom: '4rem' }}>
          <div className="goml-container">
            <div style={{ background: '#ffffff', border: '1px solid #e5e5e5', borderRadius: '16px', padding: '2.5rem', maxWidth: '1000px', margin: '0 auto' }}>
              <form onSubmit={handleCreateWizard}>
                {/* Section 1: Initiative Profile */}
                <div style={{ borderBottom: '1px solid #e5e5e5', paddingBottom: '2rem', marginBottom: '2rem' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--goml-orange)', letterSpacing: '0.08em', marginBottom: '0.35rem' }}>
                    Step 1
                  </div>
                  <h3 style={{ fontSize: '1.4rem', marginBottom: '1.25rem' }}>Client Initiative Profile</h3>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                        Initiative Name *
                      </label>
                      <input
                        type="text"
                        className="goml-input"
                        placeholder="e.g. Apex Wealth Advisory AI Copilot"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                        Client Organization
                      </label>
                      <input
                        type="text"
                        className="goml-input"
                        placeholder="e.g. Apex Global Wealth Management"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                        Client Sponsor Email
                      </label>
                      <input
                        type="email"
                        className="goml-input"
                        placeholder="sponsor@apexwealth.com"
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                      />
                    </div>

                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                        Scope Summary & Business Goals
                      </label>
                      <textarea
                        className="goml-input"
                        rows={2}
                        placeholder="Brief summary of staging objectives, workloads, and deliverables..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Architecture & Archetype */}
                <div style={{ borderBottom: '1px solid #e5e5e5', paddingBottom: '2rem', marginBottom: '2rem' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--goml-orange)', letterSpacing: '0.08em', marginBottom: '0.35rem' }}>
                    Step 2
                  </div>
                  <h3 style={{ fontSize: '1.4rem', marginBottom: '1.25rem' }}>Architecture & Industry Archetype</h3>

                  {/* Archetype Horizontal Options */}
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.6rem' }}>
                    Select Archetype Blueprint
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    {PROJECT_TYPES.map(pt => (
                      <div
                        key={pt.id}
                        onClick={() => setProjectType(pt.id)}
                        style={{
                          border: `1.5px solid ${projectType === pt.id ? '#ED7D31' : '#e5e5e5'}`,
                          backgroundColor: projectType === pt.id ? '#fff9f5' : '#ffffff',
                          borderRadius: '10px',
                          padding: '1rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: projectType === pt.id ? '#ED7D31' : '#111827' }}>
                          {pt.label}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.3rem', lineHeight: 1.4 }}>
                          {pt.desc}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                        Industry Vertical
                      </label>
                      <select className="goml-input" value={industry} onChange={(e) => setIndustry(e.target.value)}>
                        {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                        Deployment Target Platform
                      </label>
                      <select className="goml-input" value={deployment} onChange={(e) => setDeployment(e.target.value)}>
                        {DEPLOYMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                        Target Kick-Off Date
                      </label>
                      <input
                        type="date"
                        className="goml-input"
                        value={kickoffDate}
                        onChange={(e) => setKickoffDate(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Blueprint Summary Box */}
                <div style={{
                  background: '#fdfaf7',
                  border: '1px solid #fae6d9',
                  borderRadius: '10px',
                  padding: '1.25rem',
                  marginBottom: '2rem'
                }}>
                  <div style={{ fontWeight: 700, color: '#ED7D31', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                    Auto-Generated Pre-requisite Template
                  </div>
                  <p style={{ fontSize: '0.875rem', color: '#475569', margin: 0 }}>
                    PreQ will automatically synthesize <strong>10–14 critical pre-requisites</strong> covering Data Permissions, Cloud Landing Zones, Security Guardrails, and Key Personnel for <strong>{projectType}</strong> on <strong>{deployment}</strong>.
                  </p>
                </div>

                {wizardError && (
                  <div style={{ color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
                    {wizardError}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.85rem' }}>
                  <button type="button" onClick={() => navigate('/')} className="btn-goml btn-goml-outline">
                    Cancel
                  </button>
                  <button type="submit" disabled={wizardLoading} className="btn-goml btn-goml-black">
                    {wizardLoading ? <Loader2 className="animate-spin" size={16} /> : <ArrowRight size={16} />}
                    <span>Initialize Pre-requisite Matrix</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </section>
      )}

      {/* SOW Tab Strip */}
      {tab === 'sow' && (
        <section className="goml-section" style={{ background: '#fdfaf7', paddingTop: '2.5rem', paddingBottom: '4rem' }}>
          <div className="goml-container">
            <div style={{ background: '#ffffff', border: '1px solid #e5e5e5', borderRadius: '16px', padding: '2.5rem', maxWidth: '900px', margin: '0 auto' }}>
              <form onSubmit={handleAnalyzeSOW}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                  <Cpu size={40} color="#ED7D31" style={{ margin: '0 auto 0.75rem' }} />
                  <h3 style={{ fontSize: '1.5rem', margin: 0 }}>AI Statement of Work (SOW) Analyzer</h3>
                  <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.35rem' }}>
                    Upload your client proposal or SOW document. Groq AI parses architecture requirements and generates a Day-1 kick-off checklist.
                  </p>
                </div>

                {/* File Dropzone */}
                <div style={{
                  border: '2px dashed #fcd9c2',
                  backgroundColor: '#fffdfa',
                  borderRadius: '12px',
                  padding: '2.5rem',
                  textAlign: 'center',
                  position: 'relative',
                  cursor: 'pointer',
                  marginBottom: '1.5rem'
                }}>
                  <input
                    type="file"
                    accept=".pdf,.txt"
                    onChange={(e) => setFile(e.target.files[0])}
                    style={{
                      position: 'absolute',
                      top: 0, left: 0, right: 0, bottom: 0,
                      opacity: 0,
                      cursor: 'pointer',
                      width: '100%',
                      height: '100%'
                    }}
                  />
                  {file ? (
                    <div style={{ color: '#16a34a', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
                      <CheckCircle2 size={32} />
                      <span style={{ fontWeight: 700, fontSize: '1rem', color: '#111827' }}>{file.name}</span>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{(file.size / 1024).toFixed(1)} KB • Ready for AI extraction</span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
                      <Upload size={32} color="#ED7D31" />
                      <span style={{ fontWeight: 600, fontSize: '0.95rem', color: '#111827' }}>Click or drag Statement of Work document here</span>
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Supported formats: PDF or TXT</span>
                    </div>
                  )}
                </div>

                {/* SOW Text alternative */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                    Or Paste Proposal / Scope Narrative
                  </label>
                  <textarea
                    className="goml-input"
                    rows={4}
                    placeholder="Paste the Statement of Work text, deliverables, architecture stack, and client responsibilities..."
                    value={sowText}
                    onChange={(e) => setSowText(e.target.value)}
                  />
                </div>

                {sowError && (
                  <div style={{ color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
                    {sowError}
                  </div>
                )}

                {sowLoading ? (
                  <div style={{ textAlign: 'center', padding: '2rem', background: '#fff9f5', border: '1px solid #fae6d9', borderRadius: '12px' }}>
                    <Loader2 className="animate-spin" size={28} color="#ED7D31" style={{ margin: '0 auto 0.5rem' }} />
                    <div style={{ fontWeight: 700, color: '#111827' }}>{sowStatus}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Groq AI LLM Inference</div>
                  </div>
                ) : (
                  <button
                    type="submit"
                    className="btn-goml btn-goml-orange"
                    style={{ width: '100%', padding: '0.85rem', fontSize: '0.95rem' }}
                  >
                    <Sparkles size={16} />
                    <span>Analyze SOW & Generate Kick-off Graph</span>
                  </button>
                )}
              </form>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
