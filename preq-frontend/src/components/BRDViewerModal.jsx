import React, { useState, useEffect, useMemo, Fragment } from 'react';
import axios from 'axios';
import {
  FileText, Download, X, Layers, RefreshCw, AlertTriangle,
  FileSpreadsheet, ChevronDown
} from 'lucide-react';
import { API_URL } from '../apiConfig';

export const BRDViewerModal = ({ projectId, projectName, onClose }) => {
  const [brd, setBrd] = useState(null);
  const [checklistItems, setChecklistItems] = useState([]);
  const [viewMode, setViewMode] = useState('docx'); // 'docx' | 'xlsx'
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [revision, setRevision] = useState(0);

  // Real Excel Spreadsheet state
  const [selectedCell, setSelectedCell] = useState({
    coord: 'B2',
    col: 'B',
    row: 2,
    value: ''
  });

  // Stable memoized iframe source to permanently prevent reload/flickering and jumping to page 1
  const iframeSrc = useMemo(() => {
    return `${API_URL}/projects/${projectId}/preview-brd-html?rev=${revision}`;
  }, [projectId, revision]);

  const fetchBRD = async () => {
    setLoading(true);
    try {
      const [brdRes, itemsRes] = await Promise.all([
        axios.get(`${API_URL}/projects/${projectId}/brd`),
        axios.get(`${API_URL}/projects/${projectId}/checklist`).catch(() => ({ data: [] }))
      ]);
      setBrd(brdRes.data);
      setChecklistItems(itemsRes.data || []);
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
    if (regenerating) return;
    setRegenerating(true);
    try {
      const res = await axios.post(`${API_URL}/projects/${projectId}/generate-brd`, {});
      setBrd(res.data);
      // Increment revision so iframe reloads ONLY upon explicit regenerate
      setRevision(prev => prev + 1);
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

  // Structured data for Real Excel Workbook rendering
  const excelData = useMemo(() => {
    const rows = [];
    let currentRow = 2; // Row 1 is header
    const grouped = (checklistItems || []).reduce((acc, item) => {
      const cat = item.category || 'General';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    }, {});

    Object.entries(grouped).forEach(([catName, items]) => {
      const count = items.length;
      items.forEach((item, idx) => {
        const title = item.name || item.title || '';
        const desc = (item.description || item.expected_evidence || item.details || '').trim() ||
          `Technical clearance, access provisioning, and verification required for ${title}.`;
        const timeline = getRequirementTimeline(item);

        rows.push({
          rowNum: currentRow,
          isFirstInCat: idx === 0,
          catSpan: count,
          category: catName,
          title,
          description: desc,
          timeline,
          rawItem: item
        });
        currentRow++;
      });
    });
    return { rows, lastDataRow: currentRow - 1 };
  }, [checklistItems]);

  const emptyRows = useMemo(() => {
    const start = (excelData.lastDataRow || 1) + 1;
    const end = Math.max(start + 18, 36);
    const result = [];
    for (let r = start; r <= end; r++) {
      result.push(r);
    }
    return result;
  }, [excelData.lastDataRow]);

  useEffect(() => {
    if (checklistItems && checklistItems.length > 0) {
      const firstTitle = checklistItems[0].name || checklistItems[0].title || '';
      setSelectedCell({
        coord: 'B2',
        col: 'B',
        row: 2,
        value: firstTitle
      });
    }
  }, [checklistItems]);

  const [downloadingDocx, setDownloadingDocx] = useState(false);
  const [downloadingExcel, setDownloadingExcel] = useState(false);

  const handleDownloadDocx = async () => {
    if (downloadingDocx) return;
    setDownloadingDocx(true);
    try {
      const response = await axios.get(`${API_URL}/projects/${projectId}/export-brd-docx`, {
        responseType: 'blob'
      });
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const safeName = (projectName || 'Project').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_');
      link.download = `${safeName}_BRD_Document.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
      window.location.href = `${API_URL}/projects/${projectId}/export-brd-docx`;
    } finally {
      setDownloadingDocx(false);
    }
  };

  const handleDownloadExcel = async () => {
    if (downloadingExcel) return;
    setDownloadingExcel(true);
    try {
      const response = await axios.get(`${API_URL}/projects/${projectId}/export-excel-tracker`, {
        responseType: 'blob'
      });
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const safeName = (projectName || 'Project').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_');
      link.download = `${safeName}_PreReq_Tracker.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
      window.location.href = `${API_URL}/projects/${projectId}/export-excel-tracker`;
    } finally {
      setDownloadingExcel(false);
    }
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
      background: '#525659',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 9999,
      overflow: 'hidden',
      fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Top Spacious Material 3 Header Bar */}
      <header style={{
        background: 'rgba(255, 255, 255, 0.98)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(226, 232, 240, 0.9)',
        height: '68px',
        padding: '0 1.75rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
        boxShadow: '0 1px 4px rgba(15, 23, 42, 0.05)'
      }}>
        {/* Left Side: Brand Logo + Document Title Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            {/* GoML Official SVG Logo */}
            <svg width="102" height="31" viewBox="0 0 117 36" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M57.4577 20.6304V20.5321H54.6025V20.6216C54.6025 23.0446 52.6117 24.6665 50.049 24.6665C47.4863 24.6665 45.7618 23.0534 45.7618 20.6304C45.7618 18.179 47.4601 16.568 50.049 16.568H50.6362V13.7238H49.99C45.7269 13.7238 42.6403 16.6182 42.6403 20.6304C42.6403 24.8062 45.537 27.4802 50.1035 27.4802C52.6662 27.4802 54.2248 38.5367 54.2248 30.2656C54.2248 32.0184 52.5549 33.1906 50.049 33.1906C47.4317 33.1906 45.7902 31.8525 45.8447 29.8203H42.78C42.6119 33.5224 45.5086 36 50.049 36C54.4758 36 57.3725 33.7734 57.3725 30.2939C57.3725 28.2617 56.1479 26.7293 53.9498 25.9195C56.2331 24.9175 57.4577 23.0817 57.4577 20.6304ZM54.6025 16.568V19.1526H54.6046V16.568H54.6025Z" fill="#111827"/>
              <path d="M54.6069 19.1526V16.568H52.018V13.7238H57.4533V18.5588V19.1526H54.6069Z" fill="#ED7D31"/>
              <path d="M60.2104 20.8791C60.2104 16.7579 63.0787 13.6953 67.5624 13.6953C72.0176 13.6953 74.8859 16.7579 74.8859 20.8791C74.8859 25.0004 72.0176 28.063 67.5624 28.063C63.0787 28.063 60.2104 25.0004 60.2104 20.8791ZM71.7666 20.8791C71.7666 18.4845 70.1229 16.5352 67.5624 16.5352C64.9735 16.5352 63.3298 18.4845 63.3298 20.8791C63.3298 23.2738 64.9735 25.2231 67.5624 25.2231C70.1251 25.2231 71.7666 23.2738 71.7666 20.8791Z" fill="#111827"/>
              <path d="M17.9782 0C8.04827 0 0 8.04825 0 17.9781C0 27.908 8.04827 35.9563 17.9782 35.9563C27.9081 35.9563 35.9564 27.908 35.9564 17.9781C35.9564 8.04825 27.9103 0 17.9782 0ZM20.0235 29.5758H17.2142C10.838 29.5561 5.65365 24.3543 5.65365 17.976C5.65365 11.6413 10.7725 6.46567 17.0898 6.38053V10.6721C13.1366 10.755 9.94083 14.0097 9.94083 17.976C9.94083 21.9466 13.1366 25.1991 17.0898 25.282L18.2489 25.2842L18.286 25.2471L23.2149 20.316L23.4288 20.1064H14.4135V15.8149H23.4288L23.2171 15.6032L18.8382 11.2243L21.8724 8.19014L31.6386 17.9585L20.0235 29.5758Z" fill="#ED7D31"/>
              <path d="M98.4652 8.1377V27.7028H95.2237V13.6713L88.4327 22.2805H87.7342L80.9695 13.6997V27.7028H77.6995V8.1377H80.6617L88.0966 17.6135L95.5314 8.1377H98.4652Z" fill="#111827"/>
              <path d="M102.562 8.1377H105.832V24.6555H116.147V27.7028H102.562V8.1377Z" fill="#111827"/>
            </svg>
            <span style={{
              background: '#FFF7ED',
              color: '#ED7D31',
              border: '1px solid #FFEDD5',
              fontSize: '11px',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: '6px',
              letterSpacing: '0.04em'
            }}>
              PreQ
            </span>
          </div>

          <div style={{
            width: '1px',
            height: '22px',
            background: '#E2E8F0',
            margin: '0 4px'
          }} />

          {/* Project Title Badge Chip */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            height: '42px',
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '9999px',
            padding: '0 18px',
            boxShadow: '0 1px 2px rgba(15, 23, 42, 0.03)'
          }}>
            <span style={{
              fontSize: '13.5px',
              fontWeight: 700,
              color: '#0F172A',
              maxWidth: '320px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {projectName}
            </span>
          </div>
        </div>

        {/* Center: Large Material 3 Segmented Pill Switcher */}
        <div style={{
          display: 'inline-flex',
          background: '#F1F5F9',
          padding: '4px',
          borderRadius: '9999px',
          border: '1px solid #E2E8F0',
          gap: '4px',
          height: '48px',
          boxSizing: 'border-box'
        }}>
          <button
            type="button"
            onClick={() => setViewMode('docx')}
            style={{
              background: viewMode === 'docx' ? '#ED7D31' : 'transparent',
              color: viewMode === 'docx' ? '#FFFFFF' : '#64748B',
              border: 'none',
              borderRadius: '9999px',
              padding: '0 22px',
              height: '38px',
              fontSize: '13.5px',
              fontWeight: viewMode === 'docx' ? 800 : 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              boxShadow: viewMode === 'docx' ? '0 2px 8px rgba(237, 125, 49, 0.3)' : 'none',
              transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            <span>BRD Document</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('xlsx')}
            style={{
              background: viewMode === 'xlsx' ? '#ED7D31' : 'transparent',
              color: viewMode === 'xlsx' ? '#FFFFFF' : '#64748B',
              border: 'none',
              borderRadius: '9999px',
              padding: '0 22px',
              height: '38px',
              fontSize: '13.5px',
              fontWeight: viewMode === 'xlsx' ? 800 : 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              boxShadow: viewMode === 'xlsx' ? '0 2px 8px rgba(237, 125, 49, 0.3)' : 'none',
              transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            <span>Pre-Req Tracker</span>
          </button>
        </div>

        {/* Right Action Bar: Large Material Pill Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {viewMode === 'docx' ? (
            <button
                type="button"
                onClick={handleDownloadDocx}
                disabled={downloadingDocx}
                style={{
                  background: '#FFFFFF',
                  color: '#0F172A',
                  border: '2px solid #E2E8F0',
                  borderRadius: '9999px',
                  height: '42px',
                  padding: '0 20px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: downloadingDocx ? 'wait' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
                  transition: 'all 0.15s ease'
                }}
                onMouseOver={(e) => {
                  if (!downloadingDocx) {
                    e.currentTarget.style.background = '#F8FAFC';
                    e.currentTarget.style.borderColor = '#0F172A';
                  }
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = '#FFFFFF';
                  e.currentTarget.style.borderColor = '#E2E8F0';
                }}
                title="Download formatted Word BRD Document (.docx)"
              >
                <span>{downloadingDocx ? 'Downloading BRD...' : 'Export .docx'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleDownloadExcel}
                disabled={downloadingExcel}
                style={{
                  background: '#FFFFFF',
                  color: '#0F172A',
                  border: '2px solid #E2E8F0',
                  borderRadius: '9999px',
                  height: '42px',
                  padding: '0 20px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: downloadingExcel ? 'wait' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
                  transition: 'all 0.15s ease'
                }}
                onMouseOver={(e) => {
                  if (!downloadingExcel) {
                    e.currentTarget.style.background = '#F8FAFC';
                    e.currentTarget.style.borderColor = '#0F172A';
                  }
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = '#FFFFFF';
                  e.currentTarget.style.borderColor = '#E2E8F0';
                }}
                title="Download minimal Excel Pre-Req Tracker (.xlsx)"
              >
                <span>{downloadingExcel ? 'Downloading Tracker...' : 'Export .xlsx'}</span>
              </button>
            )}

          <button
            type="button"
            onClick={handleRegenerate}
            disabled={regenerating || loading}
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              color: '#64748B',
              cursor: regenerating ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
              transition: 'all 0.15s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#FFF7ED';
              e.currentTarget.style.borderColor = '#FED7AA';
              e.currentTarget.style.color = '#ED7D31';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = '#FFFFFF';
              e.currentTarget.style.borderColor = '#E2E8F0';
              e.currentTarget.style.color = '#64748B';
            }}
            title="Regenerate BRD strictly from proposal"
          >
            <RefreshCw size={15} className={regenerating ? 'animate-spin' : ''} />
          </button>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#0F172A',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '9999px',
              height: '42px',
              padding: '0 22px',
              fontSize: '13.5px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
              boxShadow: '0 2px 6px rgba(15, 23, 42, 0.16)',
              transition: 'all 0.15s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#1E293B';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(15, 23, 42, 0.25)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = '#0F172A';
              e.currentTarget.style.boxShadow = '0 2px 6px rgba(15, 23, 42, 0.16)';
            }}
          >
            <X size={15} strokeWidth={2.6} color="#FFFFFF" />
            <span>Close</span>
          </button>
        </div>
      </header>

      {/* Main Document Viewport Canvas */}
      <div style={{
        flex: 1,
        width: '100vw',
        height: 'calc(100vh - 68px)',
        background: '#525659',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '8rem 0', color: '#FFFFFF' }}>
            <RefreshCw size={44} color="#ED7D31" className="animate-spin" style={{ margin: '0 auto 1.25rem' }} />
            <p style={{ fontWeight: 700, fontSize: '1.2rem', margin: '0 0 6px' }}>Loading Enterprise BRD Document...</p>
            <p style={{ fontSize: '13.5px', color: '#CBD5E1', margin: 0 }}>Synthesizing 27-section BRD and Pre-Req Tracker</p>
          </div>
        ) : !brd ? (
          <div style={{ textAlign: 'center', padding: '6rem 0', color: '#FFFFFF' }}>
            <AlertTriangle size={44} color="#ED7D31" style={{ margin: '0 auto 1.25rem' }} />
            <p style={{ fontWeight: 700, fontSize: '1.15rem' }}>No BRD data found.</p>
            <button
              onClick={handleRegenerate}
              style={{
                marginTop: '1.25rem',
                background: '#ED7D31',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '9999px',
                height: '42px',
                padding: '0 24px',
                fontSize: '13.5px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Generate BRD Now
            </button>
          </div>
        ) : viewMode === 'docx' ? (
          /* Stable 1:1 Document Viewer Iframe (Never flickers or jumps to top on state changes) */
          <iframe
            key={`brd-viewer-${projectId}`}
            src={iframeSrc}
            title={`${projectName} — BRD Document`}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              background: '#525659'
            }}
          />
        ) : (
          /* REAL EXCEL SPREADSHEET SHEET VIEW */
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            background: '#FFFFFF',
            overflow: 'hidden',
            fontFamily: "'Calibri', 'Segoe UI', Arial, sans-serif"
          }}>
            {/* 1. EXCEL FORMULA BAR */}
            <div style={{
              height: '32px',
              background: '#FFFFFF',
              borderBottom: '1px solid #D4D4D4',
              display: 'flex',
              alignItems: 'center',
              padding: '0 8px',
              flexShrink: 0,
              gap: '6px'
            }}>
              {/* Name Box (e.g. B2) */}
              <div style={{
                width: '64px',
                height: '24px',
                background: '#FFFFFF',
                border: '1px solid #D4D4D4',
                borderRadius: '2px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '3px',
                cursor: 'pointer'
              }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#201F1E' }}>
                  {selectedCell.coord}
                </span>
                <ChevronDown size={10} color="#64748B" />
              </div>

              {/* Function fx icon */}
              <div style={{ display: 'flex', alignItems: 'center', padding: '0 6px', gap: '5px' }}>
                <span style={{ fontStyle: 'italic', fontWeight: 800, fontSize: '13px', color: '#475569' }}>fx</span>
              </div>

              <div style={{ width: '1px', height: '18px', background: '#D4D4D4' }} />

              {/* Cell Value Input Box */}
              <input
                type="text"
                value={selectedCell.value}
                onChange={(e) => setSelectedCell(prev => ({ ...prev, value: e.target.value }))}
                style={{
                  flex: 1,
                  height: '24px',
                  border: 'none',
                  outline: 'none',
                  padding: '0 8px',
                  fontSize: '12px',
                  fontFamily: "'Calibri', 'Segoe UI', Arial, sans-serif",
                  color: '#1E293B',
                  background: 'transparent'
                }}
              />
            </div>

            {/* 2. EXCEL SPREADSHEET GRID */}
            <div style={{
              flex: 1,
              overflow: 'auto',
              background: '#FFFFFF',
              position: 'relative'
            }}>
              <table style={{
                borderCollapse: 'collapse',
                tableLayout: 'fixed',
                fontFamily: "'Calibri', 'Segoe UI', Arial, sans-serif",
                fontSize: '12px',
                color: '#000000',
                background: '#FFFFFF',
                minWidth: '100%'
              }}>
                {/* Column Headers (A, B, C, D, E, F...) */}
                <thead>
                  <tr style={{ position: 'sticky', top: 0, zIndex: 30 }}>
                    {/* Top-Left Corner Box (Select All) */}
                    <th style={{
                      width: '44px',
                      minWidth: '44px',
                      height: '24px',
                      background: '#F3F3F3',
                      border: '1px solid #D4D4D4',
                      position: 'sticky',
                      left: 0,
                      zIndex: 40,
                      padding: 0
                    }}>
                      <div style={{
                        width: 0,
                        height: 0,
                        borderStyle: 'solid',
                        borderWidth: '0 0 6px 6px',
                        borderColor: 'transparent transparent #94A3B8 transparent',
                        margin: 'auto'
                      }} />
                    </th>

                    {/* Columns A through G */}
                    {[
                      { key: 'A', name: 'Category', width: 180 },
                      { key: 'B', name: 'Title', width: 280 },
                      { key: 'C', name: 'Description', width: 560 },
                      { key: 'D', name: 'Requirement Timeline', width: 220 },
                      { key: 'E', name: '', width: 120 },
                      { key: 'F', name: '', width: 120 },
                      { key: 'G', name: '', width: 120 }
                    ].map((col) => {
                      const isColSelected = selectedCell.col === col.key;
                      return (
                        <th
                          key={col.key}
                          style={{
                            width: `${col.width}px`,
                            minWidth: `${col.width}px`,
                            height: '24px',
                            background: isColSelected ? '#E1DFDD' : '#F3F3F3',
                            border: '1px solid #D4D4D4',
                            borderBottom: isColSelected ? '2px solid #107C41' : '1px solid #D4D4D4',
                            color: isColSelected ? '#107C41' : '#323130',
                            fontSize: '11px',
                            fontWeight: isColSelected ? 800 : 600,
                            textAlign: 'center',
                            cursor: 'pointer'
                          }}
                          onClick={() => setSelectedCell({ coord: `${col.key}1`, col: col.key, row: 1, value: col.name })}
                        >
                          {col.key}
                        </th>
                      );
                    })}
                  </tr>
                </thead>

                <tbody>
                  {/* Row 1: The Table Header Row (Matches openpyxl C55A11 style) */}
                  <tr>
                    {/* Row 1 Header Number */}
                    <td style={{
                      width: '44px',
                      minWidth: '44px',
                      height: '28px',
                      textAlign: 'center',
                      background: selectedCell.row === 1 ? '#E1DFDD' : '#F3F3F3',
                      border: '1px solid #D4D4D4',
                      borderRight: selectedCell.row === 1 ? '2px solid #107C41' : '1px solid #D4D4D4',
                      color: selectedCell.row === 1 ? '#107C41' : '#323130',
                      fontSize: '11px',
                      fontWeight: selectedCell.row === 1 ? 800 : 500,
                      position: 'sticky',
                      left: 0,
                      zIndex: 20
                    }}>
                      1
                    </td>

                    {/* Header Cells (Category, Title, Description, Requirement Timeline) */}
                    {[
                      { coord: 'A1', col: 'A', val: 'Category' },
                      { coord: 'B1', col: 'B', val: 'Title' },
                      { coord: 'C1', col: 'C', val: 'Description' },
                      { coord: 'D1', col: 'D', val: 'Requirement Timeline' }
                    ].map((h) => {
                      const isSel = selectedCell.coord === h.coord;
                      return (
                        <td
                          key={h.coord}
                          onClick={() => setSelectedCell({ coord: h.coord, col: h.col, row: 1, value: h.val })}
                          style={{
                            background: '#C55A11',
                            color: '#FFFFFF',
                            border: '1px solid #000000',
                            fontFamily: "'Calibri', 'Segoe UI', Arial, sans-serif",
                            fontSize: '11pt',
                            fontWeight: 700,
                            padding: '6px 12px',
                            textAlign: 'left',
                            cursor: 'cell',
                            outline: isSel ? '2px solid #107C41' : 'none',
                            outlineOffset: '-2px',
                            position: isSel ? 'relative' : 'static',
                            zIndex: isSel ? 10 : 1
                          }}
                        >
                          {h.val}
                          {isSel && (
                            <span style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '6px', height: '6px', background: '#107C41', border: '1px solid #FFFFFF', zIndex: 20 }} />
                          )}
                        </td>
                      );
                    })}

                    {/* Empty cells in Row 1 */}
                    {['E', 'F', 'G'].map((c) => {
                      const coord = `${c}1`;
                      const isSel = selectedCell.coord === coord;
                      return (
                        <td
                          key={coord}
                          onClick={() => setSelectedCell({ coord, col: c, row: 1, value: '' })}
                          style={{
                            background: '#FFFFFF',
                            border: '1px solid #E0E0E0',
                            cursor: 'cell',
                            outline: isSel ? '2px solid #107C41' : 'none',
                            outlineOffset: '-2px',
                            position: isSel ? 'relative' : 'static',
                            zIndex: isSel ? 10 : 1
                          }}
                        >
                          {isSel && (
                            <span style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '6px', height: '6px', background: '#107C41', border: '1px solid #FFFFFF', zIndex: 20 }} />
                          )}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Data Rows 2..N */}
                  {excelData.rows.map((r) => {
                    const isRowSel = selectedCell.row === r.rowNum;
                    const isSelA = selectedCell.coord === `A${r.rowNum}`;
                    const isSelB = selectedCell.coord === `B${r.rowNum}`;
                    const isSelC = selectedCell.coord === `C${r.rowNum}`;
                    const isSelD = selectedCell.coord === `D${r.rowNum}`;

                    return (
                      <tr key={r.rowNum}>
                        {/* Row Header Number */}
                        <td style={{
                          width: '44px',
                          minWidth: '44px',
                          height: '32px',
                          textAlign: 'center',
                          background: isRowSel ? '#E1DFDD' : '#F3F3F3',
                          border: '1px solid #D4D4D4',
                          borderRight: isRowSel ? '2px solid #107C41' : '1px solid #D4D4D4',
                          color: isRowSel ? '#107C41' : '#323130',
                          fontSize: '11px',
                          fontWeight: isRowSel ? 800 : 500,
                          position: 'sticky',
                          left: 0,
                          zIndex: 20
                        }}>
                          {r.rowNum}
                        </td>

                        {/* Column A: Category (Merged with rowSpan like openpyxl ws.merge_cells) */}
                        {r.isFirstInCat && (
                          <td
                            rowSpan={r.catSpan}
                            onClick={() => setSelectedCell({ coord: `A${r.rowNum}`, col: 'A', row: r.rowNum, value: r.category })}
                            style={{
                              background: '#FBE5D6',
                              color: '#000000',
                              border: '1px solid #000000',
                              fontFamily: "'Calibri', 'Segoe UI', Arial, sans-serif",
                              fontSize: '10pt',
                              fontWeight: 700,
                              textAlign: 'center',
                              verticalAlign: 'middle',
                              padding: '10px 12px',
                              cursor: 'cell',
                              outline: isSelA ? '2px solid #107C41' : 'none',
                              outlineOffset: '-2px',
                              position: isSelA ? 'relative' : 'static',
                              zIndex: isSelA ? 10 : 1
                            }}
                          >
                            {r.category}
                            {isSelA && (
                              <span style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '6px', height: '6px', background: '#107C41', border: '1px solid #FFFFFF', zIndex: 20 }} />
                            )}
                          </td>
                        )}

                        {/* Column B: Title */}
                        <td
                          onClick={() => setSelectedCell({ coord: `B${r.rowNum}`, col: 'B', row: r.rowNum, value: r.title })}
                          style={{
                            background: '#FBE5D6',
                            color: '#000000',
                            border: '1px solid #000000',
                            fontFamily: "'Calibri', 'Segoe UI', Arial, sans-serif",
                            fontSize: '10pt',
                            fontWeight: 700,
                            textAlign: 'left',
                            verticalAlign: 'middle',
                            padding: '7px 10px',
                            cursor: 'cell',
                            outline: isSelB ? '2px solid #107C41' : 'none',
                            outlineOffset: '-2px',
                            position: isSelB ? 'relative' : 'static',
                            zIndex: isSelB ? 10 : 1
                          }}
                        >
                          {r.title}
                          {isSelB && (
                            <span style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '6px', height: '6px', background: '#107C41', border: '1px solid #FFFFFF', zIndex: 20 }} />
                          )}
                        </td>

                        {/* Column C: Description */}
                        <td
                          onClick={() => setSelectedCell({ coord: `C${r.rowNum}`, col: 'C', row: r.rowNum, value: r.description })}
                          style={{
                            background: '#FBE5D6',
                            color: '#000000',
                            border: '1px solid #000000',
                            fontFamily: "'Calibri', 'Segoe UI', Arial, sans-serif",
                            fontSize: '10pt',
                            fontWeight: 400,
                            lineHeight: 1.42,
                            textAlign: 'left',
                            verticalAlign: 'middle',
                            padding: '7px 10px',
                            cursor: 'cell',
                            outline: isSelC ? '2px solid #107C41' : 'none',
                            outlineOffset: '-2px',
                            position: isSelC ? 'relative' : 'static',
                            zIndex: isSelC ? 10 : 1
                          }}
                        >
                          {r.description}
                          {isSelC && (
                            <span style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '6px', height: '6px', background: '#107C41', border: '1px solid #FFFFFF', zIndex: 20 }} />
                          )}
                        </td>

                        {/* Column D: Requirement Timeline (Real Excel plain text, NO web tags/pills) */}
                        <td
                          onClick={() => setSelectedCell({ coord: `D${r.rowNum}`, col: 'D', row: r.rowNum, value: r.timeline })}
                          style={{
                            background: '#FBE5D6',
                            color: '#000000',
                            border: '1px solid #000000',
                            fontFamily: "'Calibri', 'Segoe UI', Arial, sans-serif",
                            fontSize: '10pt',
                            fontWeight: 400,
                            textAlign: 'left',
                            verticalAlign: 'middle',
                            padding: '7px 10px',
                            whiteSpace: 'nowrap',
                            cursor: 'cell',
                            outline: isSelD ? '2px solid #107C41' : 'none',
                            outlineOffset: '-2px',
                            position: isSelD ? 'relative' : 'static',
                            zIndex: isSelD ? 10 : 1
                          }}
                        >
                          {r.timeline}
                          {isSelD && (
                            <span style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '6px', height: '6px', background: '#107C41', border: '1px solid #FFFFFF', zIndex: 20 }} />
                          )}
                        </td>

                        {/* Empty Columns E through G */}
                        {['E', 'F', 'G'].map((c) => {
                          const coord = `${c}${r.rowNum}`;
                          const isSel = selectedCell.coord === coord;
                          return (
                            <td
                              key={coord}
                              onClick={() => setSelectedCell({ coord, col: c, row: r.rowNum, value: '' })}
                              style={{
                                background: '#FFFFFF',
                                border: '1px solid #E0E0E0',
                                cursor: 'cell',
                                outline: isSel ? '2px solid #107C41' : 'none',
                                outlineOffset: '-2px',
                                position: isSel ? 'relative' : 'static',
                                zIndex: isSel ? 10 : 1
                              }}
                            >
                              {isSel && (
                                <span style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '6px', height: '6px', background: '#107C41', border: '1px solid #FFFFFF', zIndex: 20 }} />
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}

                  {/* Empty Grid Rows Beyond Data (Rows N+1 .. 32) */}
                  {emptyRows.map((rowNum) => {
                    const isRowSel = selectedCell.row === rowNum;
                    return (
                      <tr key={rowNum}>
                        {/* Row Header */}
                        <td style={{
                          width: '44px',
                          minWidth: '44px',
                          height: '24px',
                          textAlign: 'center',
                          background: isRowSel ? '#E1DFDD' : '#F3F3F3',
                          border: '1px solid #D4D4D4',
                          borderRight: isRowSel ? '2px solid #107C41' : '1px solid #D4D4D4',
                          color: isRowSel ? '#107C41' : '#323130',
                          fontSize: '11px',
                          fontWeight: isRowSel ? 800 : 500,
                          position: 'sticky',
                          left: 0,
                          zIndex: 20
                        }}>
                          {rowNum}
                        </td>

                        {/* Empty Cells A through G */}
                        {['A', 'B', 'C', 'D', 'E', 'F', 'G'].map((c) => {
                          const coord = `${c}${rowNum}`;
                          const isSel = selectedCell.coord === coord;
                          return (
                            <td
                              key={coord}
                              onClick={() => setSelectedCell({ coord, col: c, row: rowNum, value: '' })}
                              style={{
                                background: '#FFFFFF',
                                border: '1px solid #E0E0E0',
                                height: '24px',
                                cursor: 'cell',
                                outline: isSel ? '2px solid #107C41' : 'none',
                                outlineOffset: '-2px',
                                position: isSel ? 'relative' : 'static',
                                zIndex: isSel ? 10 : 1
                              }}
                            >
                              {isSel && (
                                <span style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '6px', height: '6px', background: '#107C41', border: '1px solid #FFFFFF', zIndex: 20 }} />
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* 3. EXCEL BOTTOM SHEET TAB & STATUS BAR */}
            <div style={{
              height: '28px',
              background: '#F3F3F3',
              borderTop: '1px solid #D4D4D4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 12px',
              flexShrink: 0,
              fontSize: '11px'
            }}>
              {/* Sheet Tab: Pre-Req Tracker */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  background: '#FFFFFF',
                  borderTop: '2px solid #ED7D31',
                  borderLeft: '1px solid #D4D4D4',
                  borderRight: '1px solid #D4D4D4',
                  padding: '0 14px',
                  height: '27px',
                  fontSize: '11.5px',
                  fontWeight: 800,
                  color: '#ED7D31',
                  cursor: 'pointer'
                }}>
                  <span>Pre-Req Tracker</span>
                </div>
              </div>

              {/* Status details */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', color: '#64748B' }}>
                <span style={{ fontWeight: 800, color: '#ED7D31' }}>Ready</span>
                <span>Selected: <strong style={{ color: '#0F172A' }}>{selectedCell.coord}</strong></span>
                <span>Count: <strong style={{ color: '#0F172A' }}>{checklistItems.length}</strong></span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
