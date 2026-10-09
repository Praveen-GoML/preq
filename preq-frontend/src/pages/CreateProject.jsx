import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import lottie from 'lottie-web';
import scanningAnimation from '../assets/scanning-animation.json';
import {
  Upload, Cpu, ArrowRight, Layers, Sparkles, Loader2, CheckCircle2, X
} from 'lucide-react';

import { API_URL } from '../apiConfig';

const ScanningLottiePlayer = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    let anim = null;
    if (containerRef.current) {
      anim = lottie.loadAnimation({
        container: containerRef.current,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        animationData: scanningAnimation
      });
    }
    return () => {
      if (anim) {
        anim.destroy();
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width: '90px',
        height: '90px',
        margin: '0 auto 1.25rem auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        zIndex: 1
      }}
    />
  );
};

export const CreateProject = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'sow' ? 'sow' : 'wizard';
  const [tab, setTab] = useState(initialTab);
  const navigate = useNavigate();

  const handleTabChange = (newTab) => {
    setTab(newTab);
    setSearchParams(newTab === 'sow' ? { tab: 'sow' } : {});
  };

  // Dynamic Catalog State
  const [projectTypes, setProjectTypes] = useState([
    { id: "GenAI / LLM Application", label: "GenAI & LLM Application", desc: "Foundation models, RAG, token limits, AI safety" },
    { id: "Cloud Migration & Modernization", label: "Cloud Migration", desc: "Landing zone, IAM federation, VPN/interconnect" },
    { id: "Enterprise Data Platform & Lakehouse", label: "Data Platform & Lakehouse", desc: "Object storage, CDC replicas, data governance" },
    { id: "Full-Stack Web & Microservices", label: "Web & Microservices", desc: "Kubernetes, CI/CD runners, OIDC auth" },
    { id: "Cybersecurity & Zero Trust Architecture", label: "Cybersecurity & Zero Trust", desc: "MFA tokens, SIEM ingestion, ZTNA connector" },
    { id: "ERP / CRM Enterprise System Integration", label: "ERP / CRM Integration", desc: "Sandboxes, OData APIs, mTLS certs" }
  ]);
  const [industries, setIndustries] = useState([
    "BFSI (Banking & Financial Services)",
    "Healthcare & Life Sciences",
    "Retail & E-Commerce",
    "Manufacturing & Supply Chain",
    "Public Sector & GovTech",
    "Telecom & Technology"
  ]);
  const [deployments, setDeployments] = useState([
    "AWS Cloud",
    "Microsoft Azure",
    "Google Cloud Platform (GCP)",
    "Hybrid & On-Premise",
    "Multi-Cloud Kubernetes"
  ]);

  // Wizard state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');

  const [projectType, setProjectType] = useState("GenAI / LLM Application");
  const [customProjectType, setCustomProjectType] = useState('');
  const [isCustomType, setIsCustomType] = useState(false);

  const [industry, setIndustry] = useState("BFSI (Banking & Financial Services)");
  const [customIndustry, setCustomIndustry] = useState('');
  const [isCustomIndustry, setIsCustomIndustry] = useState(false);

  const [deployment, setDeployment] = useState("AWS Cloud");
  const [customDeployment, setCustomDeployment] = useState('');
  const [isCustomDeployment, setIsCustomDeployment] = useState(false);

  const [kickoffDate, setKickoffDate] = useState('');
  const [wizardLoading, setWizardLoading] = useState(false);
  const [wizardError, setWizardError] = useState('');

  // SOW state
  const [file, setFile] = useState(null);
  const [sowText, setSowText] = useState('');
  const [sowLoading, setSowLoading] = useState(false);
  const [sowStatus, setSowStatus] = useState('');
  const [sowError, setSowError] = useState('');
  const [isDropzoneHovered, setIsDropzoneHovered] = useState(false);

  // Fetch dynamic template options from API
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await axios.get(`${API_URL}/templates`);
        if (res.data) {
          if (Array.isArray(res.data.project_types) && res.data.project_types.length > 0) {
            const formatted = res.data.project_types.map(t => {
              if (typeof t === 'string') {
                return { id: t, label: t, desc: 'Enterprise architecture delivery blueprint' };
              }
              return t;
            });
            setProjectTypes(formatted);
            setProjectType(formatted[0].id);
          }
          if (Array.isArray(res.data.industries) && res.data.industries.length > 0) {
            setIndustries(res.data.industries);
            setIndustry(res.data.industries[0]);
          }
          if (Array.isArray(res.data.deployment_targets) && res.data.deployment_targets.length > 0) {
            setDeployments(res.data.deployment_targets);
            setDeployment(res.data.deployment_targets[0]);
          }
        }
      } catch (err) {
        console.warn('Using fallback templates config:', err);
      }
    };
    fetchTemplates();
  }, []);

  const handleCreateWizard = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setWizardError('Initiative name is required.');
      return;
    }
    setWizardLoading(true);
    setWizardError('');

    const finalType = isCustomType ? (customProjectType.trim() || 'Custom Archetype') : projectType;
    const finalIndustry = isCustomIndustry ? (customIndustry.trim() || 'General Enterprise') : industry;
    const finalDeployment = isCustomDeployment ? (customDeployment.trim() || 'Multi-Cloud') : deployment;

    try {
      const res = await axios.post(`${API_URL}/projects`, {
        name: name.trim(),
        description: description.trim(),
        client_name: clientName.trim() || 'Enterprise Client',
        client_email: clientEmail.trim() || 'sponsor@client.com',
        type: finalType,
        industry: finalIndustry,
        deployment: finalDeployment,
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
      setSowError('Please upload any project document, slide deck, spreadsheet, or paste Statement of Work text.');
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
    <div style={{
      minHeight: 'calc(100vh - 64px)',
      background: '#FFFFFF',
      padding: '2rem 1.5rem 3rem 1.5rem',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      boxSizing: 'border-box',
      fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Material 3 Segmented Pill Switcher (Large & Tactile) */}
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        background: '#F1F5F9',
        border: '1.5px solid #E2E8F0',
        padding: '6px',
        borderRadius: '9999px',
        gap: '6px',
        marginBottom: '2rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
      }}>
        <button
          type="button"
          onClick={() => handleTabChange('wizard')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '12px 28px',
            borderRadius: '9999px',
            fontSize: '14.5px',
            fontWeight: 700,
            border: tab === 'wizard' ? '1.5px solid #D96B20' : '1.5px solid transparent',
            cursor: 'pointer',
            transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
            background: tab === 'wizard' ? '#ED7D31' : 'transparent',
            color: tab === 'wizard' ? '#FFFFFF' : '#475569',
            boxShadow: tab === 'wizard' ? '0 4px 14px rgba(237, 125, 49, 0.35)' : 'none',
            fontFamily: 'inherit'
          }}
        >
          <span>Interactive Blueprint Wizard</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('sow')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '12px 28px',
            borderRadius: '9999px',
            fontSize: '14.5px',
            fontWeight: 700,
            border: tab === 'sow' ? '1.5px solid #D96B20' : '1.5px solid transparent',
            cursor: 'pointer',
            transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
            background: tab === 'sow' ? '#ED7D31' : 'transparent',
            color: tab === 'sow' ? '#FFFFFF' : '#475569',
            boxShadow: tab === 'sow' ? '0 4px 14px rgba(237, 125, 49, 0.35)' : 'none',
            fontFamily: 'inherit'
          }}
        >
          <span>Proposal Upload & BRD Generator</span>
        </button>
      </div>

      {/* SOW / Proposal View: Large, Grand, Seamless Canvas */}
      {tab === 'sow' && (
        <div style={{
          maxWidth: '760px',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center'
        }}>
          <form onSubmit={handleAnalyzeSOW} style={{ width: '100%' }}>
            {/* Header */}
            <div style={{ marginBottom: '1.75rem' }}>


              <h2 style={{
                fontSize: '2rem',
                fontWeight: 800,
                color: '#0F172A',
                margin: '0 0 0.5rem 0',
                letterSpacing: '-0.025em',
                fontFamily: 'inherit'
              }}>
                Proposal Ingestion & BRD Generator
              </h2>
              <p style={{
                color: '#475569',
                fontSize: '15px',
                margin: 0,
                lineHeight: 1.55,
                maxWidth: '640px',
                marginLeft: 'auto',
                marginRight: 'auto',
                fontWeight: 500
              }}>
                Upload DOC/DOCX, PPT/PPTX, or PDF proposal documents. The AI engine automatically generates a <strong>27-Section BRD Document</strong> and a <strong>Minimal Pre-Req Tracker</strong> for internal review by Akshay & Thasleema.
              </p>
            </div>

            {/* Material Tactile Dropzone (Larger & Spacious) */}
            <div
              onMouseEnter={() => setIsDropzoneHovered(true)}
              onMouseLeave={() => setIsDropzoneHovered(false)}
              style={{
                border: file ? '2px solid #22C55E' : (isDropzoneHovered ? '2px dashed #ED7D31' : '2px dashed #FDBA74'),
                backgroundColor: file ? '#F0FDF4' : (isDropzoneHovered ? '#FFFDF9' : '#FAFAFC'),
                borderRadius: '18px',
                padding: '2.25rem 1.75rem',
                textAlign: 'center',
                position: 'relative',
                cursor: 'pointer',
                marginBottom: '1.5rem',
                boxShadow: isDropzoneHovered ? '0 6px 20px rgba(237, 125, 49, 0.12)' : '0 2px 6px rgba(0,0,0,0.03)',
                transition: 'all 0.18s ease'
              }}
            >
              <input
                type="file"
                accept="*/*"
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
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    background: '#DCFCE7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#16A34A',
                    boxShadow: '0 2px 8px rgba(22,163,74,0.18)'
                  }}>
                    <CheckCircle2 size={24} />
                  </div>
                  <span style={{ fontWeight: 800, fontSize: '16px', color: '#0F172A' }}>{file.name}</span>
                  <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 600 }}>
                    {(file.size / 1024).toFixed(1)} KB • {
                      file.name.match(/\.(pptx|ppt|potx|ppsx|odp|key)$/i) ? 'PowerPoint / Presentation Deck' :
                        file.name.match(/\.pdf$/i) ? 'PDF Document' :
                          file.name.match(/\.(docx|doc|odt|pages|rtf)$/i) ? 'Word / Rich Text Document' :
                            file.name.match(/\.(xlsx|xls|csv|tsv|numbers|ods)$/i) ? 'Spreadsheet / Tabular Data' :
                              file.name.match(/\.(txt|md|json|yaml|yml|xml|html)$/i) ? 'Text / Markup / Structured' :
                                file.name.match(/\.(zip|tar|gz)$/i) ? 'Archive Package' : 'Universal Document'
                    } • Ready for AI extraction
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                    style={{
                      marginTop: '6px',
                      background: '#FEE2E2',
                      color: '#DC2626',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '5px 14px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      boxShadow: '0 1px 3px rgba(220,38,38,0.12)',
                      zIndex: 10
                    }}
                  >
                    <X size={13} /> Remove file
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.65rem' }}>
                  <div style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '50%',
                    background: '#000000',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 3px 10px rgba(0,0,0,0.15)'
                  }}>
                    <Upload size={22} color="#FFFFFF" />
                  </div>
                  <span style={{ fontWeight: 800, fontSize: '16.5px', color: '#0F172A', letterSpacing: '-0.01em' }}>
                    Click or drag any Document, Slide Deck, or Spreadsheet here
                  </span>


                  <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 500, marginTop: '2px' }}>
                    Universal AI Ingestion: <strong>Any file format supported</strong> (Presentations, Docs, Sheets, Archives, Raw Text)
                  </span>
                </div>
              )}
            </div>

            {/* Material Outlined Text Field (Larger) */}
            <div style={{ marginBottom: '1.75rem', textAlign: 'left' }}>
              <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 700, color: '#1E293B', marginBottom: '0.45rem' }}>
                Or Paste Proposal / Scope Narrative
              </label>
              <textarea
                className="goml-input"
                rows={3}
                placeholder="Paste the Statement of Work text, deliverables, architecture stack, and client responsibilities..."
                value={sowText}
                onChange={(e) => setSowText(e.target.value)}
                style={{
                  width: '100%',
                  borderRadius: '12px',
                  border: '1.5px solid #E2E8F0',
                  fontSize: '14px',
                  lineHeight: 1.5,
                  boxSizing: 'border-box',
                  background: '#FAFAFC',
                  padding: '12px 16px',
                  boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)',
                  fontFamily: 'inherit',
                  transition: 'border-color 0.15s ease, box-shadow 0.15s ease'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#ED7D31';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(237,125,49,0.14)';
                  e.currentTarget.style.background = '#FFFFFF';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#E2E8F0';
                  e.currentTarget.style.boxShadow = 'inset 0 1px 2px rgba(0,0,0,0.02)';
                  e.currentTarget.style.background = '#FAFAFC';
                }}
              />
            </div>

            {sowError && (
              <div style={{ color: '#DC2626', background: '#FEF2F2', border: '1px solid #FEE2E2', padding: '0.75rem 1rem', borderRadius: '10px', marginBottom: '1.25rem', fontSize: '13px', textAlign: 'left', fontWeight: 600 }}>
                {sowError}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
              <button
                type="submit"
                disabled={sowLoading}
                style={{
                  padding: '14px 44px',
                  fontSize: '15.5px',
                  fontWeight: 700,
                  letterSpacing: '-0.01em',
                  borderRadius: '9999px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: sowLoading ? 'not-allowed' : 'pointer',
                  border: '2px solid #D96B20',
                  background: '#ED7D31',
                  color: '#FFFFFF',
                  opacity: sowLoading ? 0.7 : 1,
                  boxShadow: '0 6px 20px rgba(237, 125, 49, 0.35)',
                  transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
                  fontFamily: 'inherit'
                }}
                onMouseOver={(e) => {
                  if (!sowLoading) {
                    e.currentTarget.style.background = '#E06D22';
                    e.currentTarget.style.borderColor = '#C25E17';
                    e.currentTarget.style.boxShadow = '0 8px 26px rgba(237, 125, 49, 0.45)';
                    e.currentTarget.style.transform = 'translateY(-1.5px)';
                  }
                }}
                onMouseOut={(e) => {
                  if (!sowLoading) {
                    e.currentTarget.style.background = '#ED7D31';
                    e.currentTarget.style.borderColor = '#D96B20';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(237, 125, 49, 0.35)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
                onMouseDown={(e) => {
                  if (!sowLoading) {
                    e.currentTarget.style.transform = 'translateY(1px)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(237, 125, 49, 0.3)';
                  }
                }}
              >
                <span>{sowLoading ? 'Analyzing SOW...' : 'Analyze SOW & Generate Kick-off Graph'}</span>
              </button>
            </div>
          </form>

          {/* Dedicated Lottie AI Scanning & Analysis Modal */}
          {sowLoading && (
            <div style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '1.5rem',
              animation: 'gomlFadeIn 0.2s ease'
            }}>
              <div style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '32px',
                padding: '3.25rem 3rem',
                maxWidth: '660px',
                width: '100%',
                textAlign: 'center',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(237, 125, 49, 0.15)',
                border: '1.5px solid #FFEDD5',
                position: 'relative',
                overflow: 'hidden',
                animation: 'gomlScaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
              }}>
                {/* Ambient glow in modal header */}
                <div style={{
                  position: 'absolute',
                  top: '-50px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '380px',
                  height: '180px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(237, 125, 49, 0.22) 0%, transparent 70%)',
                  pointerEvents: 'none',
                  zIndex: 0
                }} />

                {/* Reduced Accent Lottie Animation */}
                <ScanningLottiePlayer />

                {/* Title */}
                <h3 style={{
                  fontSize: '1.65rem',
                  fontWeight: 800,
                  color: '#0F172A',
                  margin: '0 0 0.5rem 0',
                  letterSpacing: '-0.025em',
                  position: 'relative',
                  zIndex: 1
                }}>
                  AI SOW Analysis in Progress
                </h3>

                {/* Live Dynamic Status Message */}
                <div style={{
                  fontWeight: 700,
                  color: '#ED7D31',
                  fontSize: '15.5px',
                  minHeight: '24px',
                  marginBottom: '1.75rem',
                  lineHeight: 1.45,
                  position: 'relative',
                  zIndex: 1
                }}>
                  {sowStatus || 'Extracting scope and architectural requirements...'}
                </div>

                {/* Shimmer Progress Track */}
                <div style={{
                  width: '100%',
                  maxWidth: '480px',
                  height: '7px',
                  borderRadius: '9999px',
                  background: '#FFEDD5',
                  margin: '0 auto 1.75rem auto',
                  position: 'relative',
                  overflow: 'hidden',
                  zIndex: 1
                }}>
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    width: '40%',
                    background: 'linear-gradient(90deg, transparent 0%, #ED7D31 50%, #FB923C 85%, transparent 100%)',
                    borderRadius: '9999px',
                    animation: 'gomlScanBeam 1.8s cubic-bezier(0.4, 0, 0.2, 1) infinite'
                  }} />
                </div>

                {/* Pipeline Stages */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '8px',
                  flexWrap: 'wrap',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  position: 'relative',
                  zIndex: 1
                }}>
                  <span style={{
                    padding: '5px 14px',
                    borderRadius: '8px',
                    background: sowStatus.includes('Uploading') ? '#FFEDD5' : '#F1F5F9',
                    color: sowStatus.includes('Uploading') ? '#C2410C' : '#475569',
                    border: sowStatus.includes('Uploading') ? '1px solid #FED7AA' : '1px solid transparent'
                  }}>
                    1. Ingest SOW
                  </span>
                  <span style={{ color: '#CBD5E1' }}>→</span>
                  <span style={{
                    padding: '5px 14px',
                    borderRadius: '8px',
                    background: sowStatus.includes('Extracting') ? '#FFEDD5' : '#F1F5F9',
                    color: sowStatus.includes('Extracting') ? '#C2410C' : '#475569',
                    border: sowStatus.includes('Extracting') ? '1px solid #FED7AA' : '1px solid transparent'
                  }}>
                    2. Scope Extraction
                  </span>
                  <span style={{ color: '#CBD5E1' }}>→</span>
                  <span style={{
                    padding: '5px 14px',
                    borderRadius: '8px',
                    background: sowStatus.includes('Generating') ? '#FFEDD5' : '#F1F5F9',
                    color: sowStatus.includes('Generating') ? '#C2410C' : '#475569',
                    border: sowStatus.includes('Generating') ? '1px solid #FED7AA' : '1px solid transparent'
                  }}>
                    3. Day-1 Matrix
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Wizard View: Spacious, Grand, Structured */}
      {tab === 'wizard' && (
        <div style={{
          maxWidth: '880px',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          <form onSubmit={handleCreateWizard}>
            {/* Top Grid: Profile + Metadata */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#1E293B', marginBottom: '0.4rem' }}>
                  Initiative Name *
                </label>
                <input
                  type="text"
                  className="goml-input"
                  placeholder="e.g. Apex Wealth Advisory AI Copilot"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  style={{ background: '#FAFAFC', border: '1.5px solid #E2E8F0', borderRadius: '10px', fontSize: '14px', padding: '10px 14px', fontFamily: 'inherit' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#1E293B', marginBottom: '0.4rem' }}>
                  Client Organization
                </label>
                <input
                  type="text"
                  className="goml-input"
                  placeholder="e.g. Apex Global Wealth Management"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  style={{ background: '#FAFAFC', border: '1.5px solid #E2E8F0', borderRadius: '10px', fontSize: '14px', padding: '10px 14px', fontFamily: 'inherit' }}
                />
              </div>
            </div>

            {/* Archetype Selector (Dynamic Grid + Custom Option) */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B', margin: 0 }}>
                  Select Archetype Blueprint
                </label>
                <button
                  type="button"
                  onClick={() => setIsCustomType(!isCustomType)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#ED7D31',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  {isCustomType ? '← Choose from Catalog' : '+ Define Custom Blueprint'}
                </button>
              </div>

              {isCustomType ? (
                <div style={{ background: '#FFFDFB', border: '1.5px solid #FED7AA', borderRadius: '14px', padding: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0F172A', marginBottom: '0.35rem' }}>
                    Custom Archetype / Delivery Scope *
                  </label>
                  <input
                    type="text"
                    className="goml-input"
                    placeholder="e.g. AI-Powered Autonomous Supply Chain Forecaster"
                    value={customProjectType}
                    onChange={(e) => setCustomProjectType(e.target.value)}
                    required={isCustomType}
                    style={{ background: '#FFFFFF', border: '1.5px solid #E2E8F0', borderRadius: '10px', fontSize: '14px', padding: '10px 14px' }}
                  />
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
                  {projectTypes.map(pt => (
                    <div
                      key={pt.id}
                      onClick={() => {
                        setProjectType(pt.id);
                        setIsCustomType(false);
                      }}
                      style={{
                        border: `1.5px solid ${(!isCustomType && projectType === pt.id) ? '#ED7D31' : '#E2E8F0'}`,
                        backgroundColor: (!isCustomType && projectType === pt.id) ? '#FFF7F0' : '#FAFAFC',
                        borderRadius: '12px',
                        padding: '12px 14px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        boxShadow: (!isCustomType && projectType === pt.id) ? '0 3px 10px rgba(237,125,49,0.15)' : 'none'
                      }}
                    >
                      <div style={{ fontWeight: 800, fontSize: '13.5px', color: (!isCustomType && projectType === pt.id) ? '#ED7D31' : '#0F172A' }}>
                        {pt.label}
                      </div>
                      {pt.desc && (
                        <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '3px', lineHeight: 1.35, fontWeight: 500 }}>
                          {pt.desc}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Dynamic Dropdowns row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B', margin: 0 }}>
                    Industry Vertical
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCustomIndustry(!isCustomIndustry)}
                    style={{ background: 'transparent', border: 'none', color: '#ED7D31', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    {isCustomIndustry ? 'Standard' : 'Custom'}
                  </button>
                </div>
                {isCustomIndustry ? (
                  <input
                    type="text"
                    className="goml-input"
                    placeholder="Enter custom industry"
                    value={customIndustry}
                    onChange={(e) => setCustomIndustry(e.target.value)}
                    style={{ background: '#FFFFFF', border: '1.5px solid #E2E8F0', borderRadius: '10px', fontSize: '13.5px', padding: '9px 12px' }}
                  />
                ) : (
                  <select className="goml-input" value={industry} onChange={(e) => setIndustry(e.target.value)} style={{ background: '#FAFAFC', border: '1.5px solid #E2E8F0', borderRadius: '10px', fontSize: '13.5px', padding: '9px 12px', fontFamily: 'inherit' }}>
                    {industries.map(i => <option key={i} value={i}>{i}</option>)}
                  </select>
                )}
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B', margin: 0 }}>
                    Deployment Platform
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCustomDeployment(!isCustomDeployment)}
                    style={{ background: 'transparent', border: 'none', color: '#ED7D31', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    {isCustomDeployment ? 'Standard' : 'Custom'}
                  </button>
                </div>
                {isCustomDeployment ? (
                  <input
                    type="text"
                    className="goml-input"
                    placeholder="e.g. On-Prem OpenShift & AWS"
                    value={customDeployment}
                    onChange={(e) => setCustomDeployment(e.target.value)}
                    style={{ background: '#FFFFFF', border: '1.5px solid #E2E8F0', borderRadius: '10px', fontSize: '13.5px', padding: '9px 12px' }}
                  />
                ) : (
                  <select className="goml-input" value={deployment} onChange={(e) => setDeployment(e.target.value)} style={{ background: '#FAFAFC', border: '1.5px solid #E2E8F0', borderRadius: '10px', fontSize: '13.5px', padding: '9px 12px', fontFamily: 'inherit' }}>
                    {deployments.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#1E293B', marginBottom: '0.4rem' }}>
                  Target Kick-Off Date
                </label>
                <input
                  type="date"
                  className="goml-input"
                  value={kickoffDate}
                  onChange={(e) => setKickoffDate(e.target.value)}
                  style={{ background: '#FAFAFC', border: '1.5px solid #E2E8F0', borderRadius: '10px', fontSize: '13.5px', padding: '8px 12px', fontFamily: 'inherit' }}
                />
              </div>
            </div>

            {wizardError && (
              <div style={{ color: '#DC2626', background: '#FEF2F2', border: '1px solid #FEE2E2', padding: '0.6rem 0.85rem', borderRadius: '10px', marginBottom: '1rem', fontSize: '13px', fontWeight: 600 }}>
                {wizardError}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.85rem', marginTop: '1rem' }}>
              <button
                type="button"
                onClick={() => navigate('/')}
                style={{
                  padding: '10px 24px',
                  fontSize: '14px',
                  fontWeight: 700,
                  borderRadius: '9999px',
                  border: '1.5px solid #CBD5E1',
                  background: '#FFFFFF',
                  color: '#475569',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  fontFamily: 'inherit'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = '#94A3B8';
                  e.currentTarget.style.color = '#0F172A';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = '#CBD5E1';
                  e.currentTarget.style.color = '#475569';
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={wizardLoading}
                style={{
                  padding: '14px 40px',
                  fontSize: '15.5px',
                  fontWeight: 700,
                  borderRadius: '9999px',
                  border: '2px solid #D96B20',
                  background: '#ED7D31',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 6px 20px rgba(237, 125, 49, 0.35)',
                  transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
                  fontFamily: 'inherit'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = '#E06D22';
                  e.currentTarget.style.borderColor = '#C25E17';
                  e.currentTarget.style.boxShadow = '0 8px 26px rgba(237, 125, 49, 0.45)';
                  e.currentTarget.style.transform = 'translateY(-1.5px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = '#ED7D31';
                  e.currentTarget.style.borderColor = '#D96B20';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(237, 125, 49, 0.35)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.transform = 'translateY(1px)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(237, 125, 49, 0.3)';
                }}
              >
                {wizardLoading && <Loader2 className="animate-spin" size={16} />}
                <span>Initialize Pre-requisite Matrix</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

