import React, { useState, useEffect, Fragment } from 'react';
import axios from 'axios';
import {
  FileText, Download, X, CheckCircle2, ShieldCheck,
  Layers, RefreshCw, ChevronDown, ChevronUp, Copy, Check,
  AlertTriangle, Lock, Users, Sparkles, ExternalLink, Sun, Moon
} from 'lucide-react';
import { API_URL } from '../apiConfig';
import gomlLogo from '../assets/goml_logo.png';
import gomlLogoWhite from '../assets/goml_logo_white.png';

const WordIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
    <rect x="2" y="2" width="20" height="20" rx="4" fill="#185ABD"/>
    <path d="M6.5 7.5L8.8 16.5H10.8L12.3 11.2L13.8 16.5H15.8L18.1 7.5H16.1L14.6 13.8L13.1 7.5H11.5L10 13.8L8.5 7.5H6.5Z" fill="white"/>
  </svg>
);

const ExcelIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
    <rect x="2" y="2" width="20" height="20" rx="4" fill="#107C41"/>
    <path d="M7 7.5L10.5 12L7 16.5H9.3L11.7 13.3L14.1 16.5H16.4L12.9 12L16.4 7.5H14.1L11.7 10.7L9.3 7.5H7Z" fill="white"/>
  </svg>
);

export const BRDViewerModal = ({ projectId, projectName, onClose }) => {
  const [brd, setBrd] = useState(null);
  const [checklistItems, setChecklistItems] = useState([]);
  const [viewMode, setViewMode] = useState('docx');
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [expandedSections, setExpandedSections] = useState({});
  const [htmlContent, setHtmlContent] = useState('');

  const fetchBRD = async () => {
    setLoading(true);
    try {
      const [brdRes, itemsRes, htmlRes] = await Promise.all([
        axios.get(`${API_URL}/projects/${projectId}/brd`),
        axios.get(`${API_URL}/projects/${projectId}/checklist`).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/projects/${projectId}/preview-brd-html`, { responseType: 'text' }).catch(() => ({ data: '' }))
      ]);
      setBrd(brdRes.data);
      setChecklistItems(itemsRes.data || []);
      setHtmlContent(htmlRes.data || '');
    } catch (err) {
      console.error('Error loading BRD:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBRD();
  }, [projectId]);

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      const res = await axios.post(`${API_URL}/projects/${projectId}/generate-brd`, {});
      setBrd(res.data);
      const htmlRes = await axios.get(`${API_URL}/projects/${projectId}/preview-brd-html`, { responseType: 'text' });
      setHtmlContent(htmlRes.data || '');
    } catch (err) {
      console.error('Error regenerating BRD:', err);
      alert('Failed to regenerate BRD.');
    } finally {
      setRegenerating(false);
    }
  };

  const getRequirementTimeline = (item) => {
    const rawTimeline = item.due_date || item.requirement_timeline || 'Before development';
    const rawStr = String(rawTimeline).trim();
    const lower = rawStr.toLowerCase();
    if (lower.includes('kickoff') || lower.includes('day-1') || lower.includes('day 1')) {
      return 'Before project kickoff';
    } else if (lower.includes('start')) {
      return 'Before development starts';
    } else if (lower.includes('setup') || lower.includes('env') || lower.includes('infra')) {
      return 'Before environment setup';
    } else if (lower.includes('uat') || lower.includes('test')) {
      return 'Before UAT';
    } else if (rawStr.startsWith('Before')) {
      return rawStr;
    }
    return `Before ${rawStr}`;
  };

  const handleDownloadDocx = () => {
    window.open(`${API_URL}/projects/${projectId}/export-brd-docx`, '_blank');
  };

  const handleDownloadExcel = () => {
    window.open(`${API_URL}/projects/${projectId}/export-excel-tracker`, '_blank');
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100vw',
      height: '100vh',
      background: isDarkMode ? '#09090B' : '#F1F5F9',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 9999,
      overflow: 'hidden',
      transition: 'background 0.25s ease'
    }}>
      {/* Top Navbar Header */}
      <header style={{
        background: isDarkMode ? 'rgba(24, 24, 27, 0.98)' : 'rgba(255, 255, 255, 0.98)',
        backdropFilter: 'blur(12px)',
        borderBottom: isDarkMode ? '1px solid #27272A' : '1px solid #E2E8F0',
        height: '56px',
        padding: '0 1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
        boxShadow: isDarkMode ? 'none' : '0 1px 3px rgba(0, 0, 0, 0.03)',
        transition: 'all 0.25s ease'
      }}>
        {/* Left Side: Brand Logo + Document Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
            <svg width="90" height="27" viewBox="0 0 117 36" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M57.4577 20.6304V20.5321H54.6025V20.6216C54.6025 23.0446 52.6117 24.6665 50.049 24.6665C47.4863 24.6665 45.7618 23.0534 45.7618 20.6304C45.7618 18.179 47.4601 16.568 50.049 16.568H50.6362V13.7238H49.99C45.7269 13.7238 42.6403 16.6182 42.6403 20.6304C42.6403 24.8062 45.537 27.4802 50.1035 27.4802C52.6662 27.4802 54.2248 38.5367 54.2248 30.2656C54.2248 32.0184 52.5549 33.1906 50.049 33.1906C47.4317 33.1906 45.7902 31.8525 45.8447 29.8203H42.78C42.6119 33.5224 45.5086 36 50.049 36C54.4758 36 57.3725 33.7734 57.3725 30.2939C57.3725 28.2617 56.1479 26.7293 53.9498 25.9195C56.2331 24.9175 57.4577 23.0817 57.4577 20.6304ZM54.6025 16.568V19.1526H54.6046V16.568H54.6025Z" fill={isDarkMode ? "#FFFFFF" : "#111827"}/>
              <path d="M54.6069 19.1526V16.568H52.018V13.7238H57.4533V18.5588V19.1526H54.6069Z" fill="#ED7D31"/>
              <path d="M60.2104 20.8791C60.2104 16.7579 63.0787 13.6953 67.5624 13.6953C72.0176 13.6953 74.8859 16.7579 74.8859 20.8791C74.8859 25.0004 72.0176 28.063 67.5624 28.063C63.0787 28.063 60.2104 25.0004 60.2104 20.8791ZM71.7666 20.8791C71.7666 18.4845 70.1229 16.5352 67.5624 16.5352C64.9735 16.5352 63.3298 18.4845 63.3298 20.8791C63.3298 23.2738 64.9735 25.2231 67.5624 25.2231C70.1251 25.2231 71.7666 23.2738 71.7666 20.8791Z" fill={isDarkMode ? "#FFFFFF" : "#111827"}/>
              <path d="M17.9782 0C8.04827 0 0 8.04825 0 17.9781C0 27.908 8.04827 35.9563 17.9782 35.9563C27.9081 35.9563 35.9564 27.908 35.9564 17.9781C35.9564 8.04825 27.9103 0 17.9782 0ZM20.0235 29.5758H17.2142C10.838 29.5561 5.65365 24.3543 5.65365 17.976C5.65365 11.6413 10.7725 6.46567 17.0898 6.38053V10.6721C13.1366 10.755 9.94083 14.0097 9.94083 17.976C9.94083 21.9466 13.1366 25.1991 17.0898 25.282L18.2489 25.2842L18.286 25.2471L23.2149 20.316L23.4288 20.1064H14.4135V15.8149H23.4288L23.2171 15.6032L18.8382 11.2243L21.8724 8.19014L31.6386 17.9585L20.0235 29.5758Z" fill="#ED7D31"/>
              <path d="M98.4652 8.1377V27.7028H95.2237V13.6713L88.4327 22.2805H87.7342L80.9695 13.6997V27.7028H77.6995V8.1377H80.6617L88.0966 17.6135L95.5314 8.1377H98.4652Z" fill={isDarkMode ? "#FFFFFF" : "#111827"}/>
              <path d="M102.562 8.1377H105.832V24.6555H116.147V27.7028H102.562V8.1377Z" fill={isDarkMode ? "#FFFFFF" : "#111827"}/>
            </svg>
            <span style={{
              background: isDarkMode ? '#27272A' : '#FFF7ED',
              color: '#ED7D31',
              border: isDarkMode ? '1px solid #3F3F46' : '1px solid #FFEDD5',
              fontSize: '10.5px',
              fontWeight: 700,
              padding: '2px 6px',
              borderRadius: '9999px'
            }}>
              PreQ
            </span>
          </div>

          <div style={{
            width: '1px',
            height: '18px',
            background: isDarkMode ? '#3F3F46' : '#E2E8F0',
            margin: '0 4px'
          }} />

          <h3 style={{
            margin: 0,
            fontSize: '0.9rem',
            fontWeight: 700,
            color: isDarkMode ? '#FFFFFF' : '#0F172A',
            maxWidth: '320px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {projectName}
          </h3>
        </div>

        {/* Center: Switcher Tabs (Word vs Excel) */}
        <div style={{
          display: 'inline-flex',
          background: isDarkMode ? '#18181B' : '#F1F5F9',
          padding: '3px',
          borderRadius: '9999px',
          border: isDarkMode ? '1px solid #27272A' : '1px solid #CBD5E1'
        }}>
          <button
            type="button"
            onClick={() => setViewMode('docx')}
            style={{
              background: viewMode === 'docx' ? '#ED7D31' : 'transparent',
              color: viewMode === 'docx' ? '#FFFFFF' : (isDarkMode ? '#A1A1AA' : '#475569'),
              border: 'none',
              borderRadius: '9999px',
              padding: '5px 15px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease'
            }}
          >
            <WordIcon />
            <span>Word Document (.docx) View</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('xlsx')}
            style={{
              background: viewMode === 'xlsx' ? '#107C41' : 'transparent',
              color: viewMode === 'xlsx' ? '#FFFFFF' : (isDarkMode ? '#A1A1AA' : '#475569'),
              border: 'none',
              borderRadius: '9999px',
              padding: '5px 15px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease'
            }}
          >
            <ExcelIcon />
            <span>Excel Tracker (.xlsx) View</span>
          </button>
        </div>

        {/* Right Action Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={handleDownloadDocx}
            style={{
              background: '#ED7D31',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '9999px',
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 6px rgba(237, 125, 49, 0.25)',
              transition: 'all 0.15s ease'
            }}
          >
            <WordIcon />
            <span>Download .docx</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadExcel}
            style={{
              background: '#107C41',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '9999px',
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 6px rgba(16, 124, 65, 0.25)',
              transition: 'all 0.15s ease'
            }}
          >
            <ExcelIcon />
            <span>Download .xlsx</span>
          </button>

          <button
            type="button"
            onClick={handleRegenerate}
            disabled={regenerating || loading}
            style={{
              background: isDarkMode ? '#27272A' : '#FFFFFF',
              color: isDarkMode ? '#A1A1AA' : '#334155',
              border: isDarkMode ? '1px solid #3F3F46' : '1px solid #E2E8F0',
              borderRadius: '9999px',
              padding: '5px 10px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              transition: 'all 0.15s ease'
            }}
            title="Regenerate BRD strictly from proposal"
          >
            <RefreshCw size={14} className={regenerating ? 'animate-spin' : ''} />
          </button>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: isDarkMode ? '#27272A' : '#F1F5F9',
              border: isDarkMode ? '1px solid #3F3F46' : '1px solid #E2E8F0',
              color: isDarkMode ? '#FFFFFF' : '#334155',
              cursor: 'pointer',
              padding: '5px 14px',
              borderRadius: '9999px',
              fontSize: '12px',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.15s ease'
            }}
          >
            <X size={14} />
            <span>Close</span>
          </button>
        </div>
      </header>

      {/* Main Full-Bleed Viewport Canvas */}
      <div style={{
        flex: 1,
        width: '100vw',
        height: 'calc(100vh - 56px)',
        background: '#525659',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '8rem 0', color: '#FFFFFF' }}>
            <RefreshCw size={44} color="#ED7D31" className="animate-spin" style={{ margin: '0 auto 1rem' }} />
            <p style={{ fontWeight: 700, fontSize: '1.15rem' }}>Loading Enterprise BRD Document...</p>
            <p style={{ fontSize: '13px', color: '#CBD5E1' }}>Synthesizing 27-section BRD and openpyxl tracker layout</p>
          </div>
        ) : !brd ? (
          <div style={{ textAlign: 'center', padding: '6rem 0', color: '#FFFFFF' }}>
            <AlertTriangle size={44} color="#ED7D31" style={{ margin: '0 auto 1rem' }} />
            <p style={{ fontWeight: 600, fontSize: '1.1rem' }}>No BRD data found.</p>
            <button onClick={handleRegenerate} className="btn-goml btn-goml-orange" style={{ marginTop: '1rem' }}>
              Generate BRD Now
            </button>
          </div>
        ) : viewMode === 'docx' ? (
          /* Full-Bleed Direct 1:1 Document Viewer Iframe */
          <iframe
            src={`${API_URL}/projects/${projectId}/preview-brd-html?t=${Date.now()}`}
            title={`${projectName} — BRD Document`}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              background: '#525659'
            }}
          />
        ) : (
          /* Excel Tracker View */
          <div style={{
            width: '100%',
            height: '100%',
            overflowY: 'auto',
            padding: '2rem 3rem',
            background: '#CBD5E1',
            boxSizing: 'border-box'
          }}>
            <div style={{
              maxWidth: '1200px',
              margin: '0 auto',
              background: '#FFFFFF',
              borderRadius: '4px',
              border: '1px solid #94A3B8',
              boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
              padding: '2rem 2.5rem',
              color: '#000000'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '2px solid #C55A11',
                paddingBottom: '1rem',
                marginBottom: '1.5rem'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ExcelIcon />
                    <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#107C41' }}>
                      Minimal Pre-Req Tracker Spreadsheet (.xlsx)
                    </span>
                  </div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '4px 0 2px', color: '#C55A11' }}>
                    {brd?.project_name || projectName}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadExcel}
                  style={{
                    background: '#107C41',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 16px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Download size={15} />
                  <span>Export .xlsx File</span>
                </button>
              </div>

              {/* Excel Table Grid */}
              <div style={{ overflowX: 'auto', border: '1px solid #000000' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#C55A11', color: '#FFFFFF' }}>
                      <th style={{ padding: '10px 12px', border: '1px solid #000000', color: '#FFFFFF', fontWeight: 700, width: '22%' }}>Category</th>
                      <th style={{ padding: '10px 12px', border: '1px solid #000000', color: '#FFFFFF', fontWeight: 700, width: '25%' }}>Title</th>
                      <th style={{ padding: '10px 12px', border: '1px solid #000000', color: '#FFFFFF', fontWeight: 700, width: '38%' }}>Description</th>
                      <th style={{ padding: '10px 12px', border: '1px solid #000000', color: '#FFFFFF', fontWeight: 700, width: '15%' }}>Requirement Timeline</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(
                      checklistItems.reduce((acc, item) => {
                        const cat = item.category || 'General';
                        if (!acc[cat]) acc[cat] = [];
                        acc[cat].push(item);
                        return acc;
                      }, {})
                    ).map(([catName, catItems]) => (
                      <Fragment key={catName}>
                        {catItems.map((item, idx) => {
                          const title = item.name || item.title || '';
                          const desc = (item.description || item.expected_evidence || item.details || '').trim() ||
                            `Technical clearance, access provisioning, and verification required for ${title}.`;
                          const timeline = getRequirementTimeline(item);

                          return (
                            <tr key={item.id || idx} style={{ background: idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA' }}>
                              {idx === 0 && (
                                <td
                                  rowSpan={catItems.length}
                                  style={{
                                    padding: '10px 12px',
                                    border: '1px solid #000000',
                                    background: '#FBE5D6',
                                    fontWeight: 700,
                                    color: '#000000',
                                    verticalAlign: 'middle',
                                    textAlign: 'center'
                                  }}
                                >
                                  {catName}
                                </td>
                              )}
                              <td style={{ padding: '8px 12px', border: '1px solid #000000', color: '#000000', fontWeight: 600 }}>
                                {title}
                              </td>
                              <td style={{ padding: '8px 12px', border: '1px solid #000000', color: '#000000', lineHeight: 1.4 }}>
                                {desc}
                              </td>
                              <td style={{ padding: '8px 12px', border: '1px solid #000000', color: '#000000', whiteSpace: 'nowrap' }}>
                                <span style={{
                                  background: '#FFF7ED',
                                  border: '1px solid #FFEDD5',
                                  color: '#C55A11',
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  fontSize: '11px',
                                  fontWeight: 700
                                }}>
                                  {timeline}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </Fragment>
                    ))}
                    {checklistItems.length === 0 && (
                      <tr>
                        <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>
                          No checklist items available for Excel tracking.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
