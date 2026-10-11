import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar, CheckCircle2, Clock, ArrowRight, ShieldCheck,
  AlertTriangle, User, FileText, ChevronDown, ChevronRight,
  Download, Sparkles, Key, Check, ExternalLink, Filter,
  Layers, CheckSquare, Square, Zap, Info, ArrowUpRight, Copy,
  Plus, Trash2, Edit3, MoveRight, HelpCircle, Search,
  X, RefreshCw, AlertCircle, CheckCircle, BarChart3,
  Boxes, ShieldAlert, Lock, Settings
} from 'lucide-react';

// Default authentic MovilVentas initiative items (13 items, 4 cleared, 9 Day-1 blockers, 31% complete)
export const DEFAULT_INITIATIVE_ITEMS = [
  // Week 1: Environment & Cloud IAM (3 items: 1 cleared, 2 Day-1 blockers)
  {
    id: 'item_w1_1',
    name: 'AWS Bedrock Access IAM Role ARN',
    category: 'Security',
    owner: 'Security & Compliance Lead',
    is_critical: true,
    status: 'Verified',
    guideTitle: 'Credential Guide',
    target_sprint_week: 1,
    description: 'Dedicated cross-account IAM Role ARN with bedrock:InvokeModel and bedrock:ListFoundationModels permissions in us-east-1.'
  },
  {
    id: 'item_w1_2',
    name: 'NAT Gateway IP Whitelisting for Google Maps API',
    category: 'Environment',
    owner: 'Security Lead',
    is_critical: true,
    status: 'Pending',
    guideTitle: 'Whitelisting SOP',
    target_sprint_week: 1,
    description: 'Configure egress NAT gateway elastic IPs and whitelist outbound calls to Google Maps Routing & Geocoding APIs.'
  },
  {
    id: 'item_w1_3',
    name: 'Staging VPC Peering and Routing Tables',
    category: 'Environment',
    owner: 'DevOps Lead',
    is_critical: true,
    status: 'Pending',
    guideTitle: 'CIDR Allocation Specs',
    target_sprint_week: 1,
    description: 'VPC peering handshake between goML agent staging VPC and MovilVentas AWS RDS private subnets.'
  },

  // Week 2: Data Ingestion & Schemas (5 items: 2 cleared, 3 Day-1 blockers)
  {
    id: 'item_w2_1',
    name: 'MovilVentas MySQL Read-Only Replica Credentials',
    category: 'Data',
    owner: 'Data Engineering Lead',
    is_critical: true,
    status: 'Verified',
    guideTitle: 'Connection Guide',
    target_sprint_week: 2,
    description: 'Least-privilege MySQL 8.0 read-only credentials for sales order tables with SSL enforcement.'
  },
  {
    id: 'item_w2_2',
    name: 'CRM Route Optimization Data Dictionary & Schema',
    category: 'Data',
    owner: 'Solution Architect',
    is_critical: false,
    status: 'Verified',
    guideTitle: 'Data Dictionary',
    target_sprint_week: 2,
    description: 'Column mappings for delivery latitude, longitude, order priority weights, and driver constraints.'
  },
  {
    id: 'item_w2_3',
    name: 'Historical Delivery Latency CSV Sample Dump',
    category: 'Data',
    owner: 'BI Lead',
    is_critical: true,
    status: 'Pending',
    guideTitle: 'Sample Data Specs',
    target_sprint_week: 2,
    description: '5,000 anonymized delivery dispatch records for route baseline evaluation and model fine-tuning.'
  },
  {
    id: 'item_w2_4',
    name: 'S3 Staging Bucket for Batch Route Cache',
    category: 'Data',
    owner: 'Cloud Architect',
    is_critical: true,
    status: 'Pending',
    guideTitle: 'S3 Policy Spec',
    target_sprint_week: 2,
    description: 'Encrypted KMS bucket for caching daily dispatch routes and intermediate matrix solutions.'
  },
  {
    id: 'item_w2_5',
    name: 'Secrets Manager Dynamic Rotation Configuration',
    category: 'Data',
    owner: 'DevOps Lead',
    is_critical: true,
    status: 'Pending',
    guideTitle: 'Secrets Rotation SOP',
    target_sprint_week: 2,
    description: 'AWS Secrets Manager ARN with automated 30-day rotation for database and API tokens.'
  },

  // Week 3: Agent Engine & Routing Prompts (3 items: 1 cleared, 2 Day-1 blockers)
  {
    id: 'item_w3_1',
    name: 'Bedrock Claude 3.5 Sonnet Quota Elevation',
    category: 'Integration',
    owner: 'Cloud Architect',
    is_critical: true,
    status: 'Verified',
    guideTitle: 'Quota Request SOP',
    target_sprint_week: 3,
    description: 'Service quota increase for Claude 3.5 Sonnet to 200 RPM and 500k TPM in us-east-1.'
  },
  {
    id: 'item_w3_2',
    name: 'Google Maps Distance Matrix & Geocoding API Key',
    category: 'Integration',
    owner: 'Fullstack Lead',
    is_critical: true,
    status: 'Pending',
    guideTitle: 'API Key Guidance',
    target_sprint_week: 3,
    description: 'Restricted Google Maps Platform API key with Distance Matrix, Directions, and Geocoding scopes.'
  },
  {
    id: 'item_w3_3',
    name: 'Prompt Orchestration Template Approval',
    category: 'Integration',
    owner: 'AI Lead',
    is_critical: true,
    status: 'Pending',
    guideTitle: 'Prompt Guidelines',
    target_sprint_week: 3,
    description: 'Final prompt engineering templates for multi-stop vehicle capacity reasoning and fallback handling.'
  },

  // Week 5: Admin Portal & Handovers (2 items: 0 cleared, 2 Day-1 blockers)
  {
    id: 'item_w5_1',
    name: 'Admin Dispatcher Webhook Callback Endpoint',
    category: 'Frontend',
    owner: 'Frontend Lead',
    is_critical: true,
    status: 'Pending',
    guideTitle: 'Webhook Contract',
    target_sprint_week: 5,
    description: 'Authenticated HTTPS endpoint for receiving asynchronous route optimization completion notifications.'
  },
  {
    id: 'item_w5_2',
    name: 'Executive Reporting PDF Template Specification',
    category: 'Product',
    owner: 'Product Owner',
    is_critical: true,
    status: 'Pending',
    guideTitle: 'Report Specs',
    target_sprint_week: 5,
    description: 'Brand asset guidelines, layout metrics, and KPI definition cards for daily dispatch summary PDF export.'
  }
];

// Pre-defined default week themes
const DEFAULT_WEEK_THEMES = [
  'Cloud & IAM',
  'Data Ingest',
  'Agent Engine',
  'Routing API',
  'Admin Portal',
  'Go-Live',
  'Pilot Deployment',
  'Production Go-Live'
];

// Compute calendar date range for a given week number
const computeWeekDateRange = (startDateStr, weekNum) => {
  try {
    const baseDate = startDateStr ? new Date(startDateStr) : new Date('2026-10-22');
    if (isNaN(baseDate.getTime())) return `Sprint ${weekNum}`;

    if (weekNum === 0) {
      return 'Immediate Action';
    }

    const start = new Date(baseDate);
    start.setDate(baseDate.getDate() + (weekNum - 1) * 7);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    const shortOpts = { month: 'short', day: 'numeric' };
    return `${start.toLocaleDateString('en-US', shortOpts)} – ${end.toLocaleDateString('en-US', options)}`;
  } catch (e) {
    return `Sprint Week ${weekNum}`;
  }
};

// Senior Architect AI Multi-Sprint Auto-Balancer
export const computeIntelligentSprintWeek = (item, index, totalItems, totalWeeks = 6) => {
  if (item.target_sprint_week !== undefined && item.target_sprint_week !== null) {
    return Math.min(totalWeeks, Math.max(0, parseInt(item.target_sprint_week, 10)));
  }

  const name = (item.name || '').toLowerCase();
  const desc = (item.description || '').toLowerCase();
  const cat = (item.category || '').toLowerCase();
  const text = `${name} ${desc} ${cat}`;

  // Week 1: Environment & Cloud IAM
  if (
    text.includes('bedrock access') || text.includes('iam role') || text.includes('nat gateway') ||
    text.includes('whitelisting') || text.includes('vpc peering') || text.includes('routing table') ||
    text.includes('terraform') || text.includes('network') || text.includes('vpn') ||
    (cat === 'environment' || (cat === 'security' && (name.includes('arn') || name.includes('iam') || name.includes('role'))))
  ) {
    return Math.min(totalWeeks, 1);
  }

  // Week 2: Data Ingestion & Schemas
  if (
    text.includes('dataset') || text.includes('sample') || text.includes('database') ||
    text.includes('sql') || text.includes('mysql') || text.includes('postgres') ||
    text.includes('dump') || text.includes('schema') || text.includes('dictionary') ||
    text.includes('orders') || text.includes('er diagram') || text.includes('s3') ||
    text.includes('storage') || text.includes('secrets manager') || cat === 'data'
  ) {
    return Math.min(totalWeeks, 2);
  }

  // Week 3: Agent Engine & Models
  if (
    text.includes('routing agent') || text.includes('model') || text.includes('claude') ||
    text.includes('anthropic') || text.includes('agent') || text.includes('vector') ||
    text.includes('prompt') || text.includes('llm') || text.includes('maps api') ||
    cat === 'integration'
  ) {
    return Math.min(totalWeeks, 3);
  }

  // Week 4: Routing API
  if (text.includes('api contract') || text.includes('openapi') || text.includes('swagger') || text.includes('routing api')) {
    return Math.min(totalWeeks, 4);
  }

  // Week 5: Admin Portal & Handovers
  if (
    text.includes('admin') || text.includes('portal') || text.includes('ui') ||
    text.includes('dashboard') || text.includes('reporting') || text.includes('pdf') ||
    cat === 'frontend' || cat === 'product'
  ) {
    return Math.min(totalWeeks, 5);
  }

  // Week 6: Go-Live
  if (text.includes('acceptance') || text.includes('charter') || text.includes('signoff') || text.includes('go-live') || text.includes('cutover')) {
    return Math.min(totalWeeks, 6);
  }

  return Math.min(totalWeeks, Math.max(1, Math.floor((index / Math.max(1, totalItems)) * totalWeeks) + 1));
};

export const WeeklyPlanner = ({
  checklist = [],
  project = {},
  onProvideHandover,
  onToggleCheck,
  onAddItem,
  onSwitchToChecklist,
  portalView = 'PLANNER'
}) => {
  // Standard 6-Week Cadence
  const [totalWeeks, setTotalWeeks] = useState(6);

  // Kickoff Date
  const [kickoffDate, setKickoffDate] = useState(() => {
    if (project.target_kickoff_date) {
      try {
        const d = new Date(project.target_kickoff_date);
        if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
      } catch (e) {}
    }
    return '2026-10-22';
  });

  // Dynamic Custom Assignments: map of { itemId: weekNum }
  const [itemWeekMap, setItemWeekMap] = useState({});
  // Expand Week 0 and Week 1 by default (matching screenshot)
  const [expandedPhaseIds, setExpandedPhaseIds] = useState(['WEEK_0', 'WEEK_1']);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'BLOCKERS' | 'PENDING' | 'CLEARED'
  const [viewMode, setViewMode] = useState('TIMELINE'); // 'TIMELINE' | 'TABLE'

  // Custom week titles
  const [customWeekTitles, setCustomWeekTitles] = useState({});

  // Add Task Modal State
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [targetModalWeek, setTargetModalWeek] = useState(0);
  const [newTaskData, setNewTaskData] = useState({
    name: '',
    description: '',
    category: 'Cloud Infrastructure',
    owner: 'DevOps Lead',
    is_critical: false
  });

  // Guide SOP Details Modal State
  const [guideModalItem, setGuideModalItem] = useState(null);

  // Local additional items added by user
  const [localItems, setLocalItems] = useState([]);

  // Base list of items: use checklist if populated from backend, otherwise fallback to DEFAULT_INITIATIVE_ITEMS
  const baseItems = useMemo(() => {
    if (checklist && checklist.length > 0) {
      return checklist;
    }
    return DEFAULT_INITIATIVE_ITEMS;
  }, [checklist]);

  // Merge base items and locally added tasks
  const combinedChecklist = useMemo(() => {
    const combined = [...baseItems];
    localItems.forEach(item => {
      if (!combined.some(c => c.id === item.id)) {
        combined.push(item);
      }
    });
    return combined;
  }, [baseItems, localItems]);

  // Senior Architect AI Auto-Balance across N weeks
  const applySmartSprintBalancing = (weeksCount = totalWeeks) => {
    const newMap = {};
    combinedChecklist.forEach((item, index) => {
      newMap[item.id] = computeIntelligentSprintWeek(item, index, combinedChecklist.length, weeksCount);
    });
    setItemWeekMap(newMap);
  };

  // Initialize smart assignments
  useEffect(() => {
    const newMap = {};
    let needsRebalance = false;

    combinedChecklist.forEach((item, index) => {
      if (itemWeekMap[item.id] === undefined) {
        newMap[item.id] = computeIntelligentSprintWeek(item, index, combinedChecklist.length, totalWeeks);
        needsRebalance = true;
      } else {
        newMap[item.id] = itemWeekMap[item.id];
      }
    });

    if (needsRebalance || Object.keys(itemWeekMap).length === 0) {
      setItemWeekMap(newMap);
    }
  }, [combinedChecklist, totalWeeks]);

  // Construct dynamic N-Week Phase objects
  const dynamicPhases = useMemo(() => {
    const phases = [
      {
        id: 'WEEK_0',
        weekNum: 0,
        title: customWeekTitles[0] || 'Pre-Kickoff Gatekeepers (Week 0)',
        badgeText: 'Immediate Action',
        shortName: 'Readiness Gate',
        subtitle: 'Immediate Action',
        dateRange: 'Pre-Kickoff Gatekeepers',
        accentColor: '#0D0F11'
      }
    ];

    for (let w = 1; w <= totalWeeks; w++) {
      let defaultTheme = DEFAULT_WEEK_THEMES[(w - 1) % DEFAULT_WEEK_THEMES.length] || `Sprint ${w} Execution`;
      if (w === 3) defaultTheme = 'Agent Engine & Routing Prompts';

      const themeTitle = customWeekTitles[w] || defaultTheme;
      const shortName = themeTitle.split('(')[0].split('&')[0].trim();

      phases.push({
        id: `WEEK_${w}`,
        weekNum: w,
        title: `Week ${w}: ${themeTitle}`,
        shortName: shortName,
        badgeText: `Sprint ${w}`,
        subtitle: computeWeekDateRange(kickoffDate, w),
        dateRange: computeWeekDateRange(kickoffDate, w),
        accentColor: w % 2 === 1 ? '#ED7D31' : '#000000'
      });
    }
    return phases;
  }, [totalWeeks, customWeekTitles, kickoffDate]);

  // Assign items to dynamic phases with search & status filtering
  const groupedPhases = useMemo(() => {
    return dynamicPhases.map(phase => {
      const items = combinedChecklist.filter(item => {
        const assignedWeek = itemWeekMap[item.id] !== undefined ? itemWeekMap[item.id] : 0;
        if (assignedWeek !== phase.weekNum) return false;

        // Search Filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = (item.name || '').toLowerCase().includes(q);
          const matchDesc = (item.description || '').toLowerCase().includes(q);
          const matchCat = (item.category || '').toLowerCase().includes(q);
          const matchOwner = (item.owner || '').toLowerCase().includes(q);
          if (!matchName && !matchDesc && !matchCat && !matchOwner) return false;
        }

        // Status Filter
        if (statusFilter === 'BLOCKERS' && !(item.is_critical && item.status !== 'Verified')) return false;
        if (statusFilter === 'PENDING' && item.status === 'Verified') return false;
        if (statusFilter === 'CLEARED' && item.status !== 'Verified') return false;

        return true;
      });

      const completed = items.filter(i => i.status === 'Verified').length;
      const progressPct = items.length > 0 ? Math.round((completed / items.length) * 100) : 0;
      const criticalBlockers = items.filter(i => i.is_critical && i.status !== 'Verified').length;

      return {
        ...phase,
        items,
        completedCount: completed,
        totalCount: items.length,
        progressPct,
        criticalBlockers
      };
    });
  }, [dynamicPhases, combinedChecklist, itemWeekMap, searchQuery, statusFilter]);

  // Summary Metrics
  const totalItems = combinedChecklist.length;
  const totalCompleted = combinedChecklist.filter(i => i.status === 'Verified').length;
  const overallProgress = totalItems > 0 ? Math.round((totalCompleted / totalItems) * 100) : 0;
  const totalBlockers = combinedChecklist.filter(i => i.is_critical && i.status !== 'Verified').length;
  const pendingCount = combinedChecklist.filter(i => i.status !== 'Verified').length;
  const avgVelocity = totalWeeks > 0 ? (totalItems / totalWeeks).toFixed(1) : '2.2';

  // Toggle Phase Expansion
  const togglePhaseExpand = (phaseId) => {
    setExpandedPhaseIds(prev =>
      prev.includes(phaseId) ? prev.filter(id => id !== phaseId) : [...prev, phaseId]
    );
  };

  // Open Add Task Modal
  const handleOpenAddTaskModal = (weekNum) => {
    setTargetModalWeek(weekNum);
    setNewTaskData({
      name: '',
      description: '',
      category: 'Cloud Infrastructure',
      owner: 'DevOps Lead',
      is_critical: weekNum === 0
    });
    setShowAddTaskModal(true);
  };

  const handleSaveNewTask = () => {
    if (!newTaskData.name.trim()) return;

    const newItem = {
      id: `custom_${Date.now()}`,
      name: newTaskData.name.trim(),
      description: newTaskData.description.trim() || 'Custom prerequisite task planned for project delivery.',
      category: newTaskData.category,
      owner: newTaskData.owner,
      is_critical: newTaskData.is_critical,
      status: 'Pending',
      guideTitle: 'Setup Guide',
      expected_evidence: 'Artifact / Config details'
    };

    setLocalItems(prev => [...prev, newItem]);
    setItemWeekMap(prev => ({
      ...prev,
      [newItem.id]: targetModalWeek
    }));

    if (onAddItem) {
      onAddItem(newItem);
    }
    setShowAddTaskModal(false);
  };

  // Export CSV handler
  const handleExportCSV = () => {
    const headers = ['Sprint Phase / Week', 'Calendar Schedule', 'Category', 'Prerequisite Deliverable', 'Description', 'Owner', 'Criticality', 'Status'];
    const rows = [];

    groupedPhases.forEach(phase => {
      phase.items.forEach(item => {
        rows.push([
          `"${phase.title}"`,
          `"${phase.dateRange}"`,
          `"${item.category || 'General'}"`,
          `"${item.name || ''}"`,
          `"${(item.description || '').replace(/"/g, '""')}"`,
          `"${item.owner || 'DevOps Lead'}"`,
          `"${item.is_critical ? 'Day-1 Blocker' : 'Standard'}"`,
          `"${item.status || 'Pending'}"`
        ]);
      });
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${project.name || 'MovilVentas'}_Implementation_Tracker.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper: Get link label for guide
  const getGuideLabel = (item) => {
    if (item.guideTitle) return item.guideTitle;
    const name = (item.name || '').toLowerCase();
    if (name.includes('role') || name.includes('iam') || name.includes('arn') || name.includes('key')) return 'Credential Guide';
    if (name.includes('whitelist') || name.includes('nat') || name.includes('ip')) return 'Whitelisting SOP';
    if (name.includes('vpc') || name.includes('peering') || name.includes('cidr')) return 'CIDR Allocation Specs';
    if (name.includes('sql') || name.includes('mysql') || name.includes('connection')) return 'Connection Guide';
    if (name.includes('schema') || name.includes('dictionary')) return 'Data Dictionary';
    if (name.includes('quota')) return 'Quota Request SOP';
    if (name.includes('webhook')) return 'Webhook Contract';
    return 'Credential Guide';
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '1.25rem',
      fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: '#0D0F11'
    }}>

      {/* 1. TOP ENGAGEMENT SCOPE HERO CARD (Matches Screenshot) */}
      <section style={{
        background: '#FFFFFF',
        borderRadius: '12px',
        border: '1px solid #E2E8F0',
        padding: '1.25rem 1.5rem',
        boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        {/* Top Badges & View Switcher Row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          {/* Left: Engagement Scope, SOW tag, Webhook sync */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{
              fontSize: '10.5px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: '#64748B',
              padding: '2px 8px',
              borderRadius: '4px',
              background: '#F8FAFC',
              border: '1px solid #E2E8F0'
            }}>
              ENGAGEMENT SCOPE
            </span>

            <span style={{
              fontSize: '11.5px',
              color: '#64748B',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: '4px',
              background: '#F8FAFC',
              border: '1px solid #E2E8F0'
            }}>
              SOW-MV-2026-v2.4
            </span>

            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11.5px',
              color: '#475569',
              fontWeight: 600
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0D0F11', display: 'inline-block' }} />
              <span>Continuous Webhook Sync: <strong>Active</strong></span>
            </span>
          </div>

          {/* Right: Pill View Switcher */}
          <div style={{
            display: 'inline-flex',
            padding: '2px',
            background: '#F1F5F9',
            borderRadius: '9999px',
            border: '1px solid #E2E8F0',
            gap: '2px'
          }}>
            <button
              type="button"
              onClick={onSwitchToChecklist}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '5px 14px',
                borderRadius: '9999px',
                background: 'transparent',
                color: '#64748B',
                fontSize: '11.5px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <span>Checklist</span>
            </button>

            <button
              type="button"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '5px 14px',
                borderRadius: '9999px',
                background: '#0D0F11',
                color: '#FFFFFF',
                fontSize: '11.5px',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <span>Implementation Planner</span>
            </button>
          </div>
        </div>

        {/* 2-Column Split: Title & Narrative on Left, Bedrock Badge on Right */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) auto',
          gap: '2rem',
          alignItems: 'start'
        }}>
          {/* Left Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <h1 style={{
              fontSize: '1.65rem',
              fontWeight: 800,
              color: '#0D0F11',
              margin: 0,
              letterSpacing: '-0.025em',
              lineHeight: 1.2
            }}>
              {project.name || 'Bedrock Autonomous LLM Routing Agent'}
            </h1>
            <p style={{
              fontSize: '13px',
              color: '#475569',
              margin: 0,
              lineHeight: 1.55,
              maxWidth: '900px'
            }}>
              {project.description ||
                'Production-ready Bedrock-hosted LLM routing agent that ingests natural-language prompts, accesses MovilVentas MySQL data, calls Google Maps for optimal sequencing, and returns geolocated maps plus spreadsheet reports. Encompasses full AWS environment provisioning, AWE blueprint configuration, admin UI integration, and client handover.'}
            </p>
          </div>

          {/* Right Column: Compact AWS Bedrock Runtime Badge */}
          <div style={{
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '8px',
            padding: '10px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '3px',
            alignItems: 'flex-start',
            minWidth: '240px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#0D0F11' }}>
              <Settings size={13} color="#64748B" />
              <span>AWS Bedrock Claude 3.5 Sonnet</span>
            </div>
            <div style={{ fontSize: '11px', color: '#64748B' }}>
              Region: us-east-1 &nbsp;•&nbsp; <span style={{ color: '#DC2626', fontWeight: 700 }}>&lt;1,800ms P95 latency</span>
            </div>
          </div>
        </div>

        {/* Minimalist KPI Metric Strip with Vertical Dividers (4 Columns) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '1rem',
          paddingTop: '0.75rem',
          borderTop: '1px solid #F1F5F9'
        }}>
          {/* Col 1: Total Deliverables */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748B' }}>
              <Boxes size={12} color="#64748B" />
              <span>TOTAL DELIVERABLES</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '2px' }}>
              <span style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0D0F11', lineHeight: 1.1 }}>{totalItems}</span>
              <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 500 }}>milestones defined</span>
            </div>
          </div>

          {/* Col 2: Verified Readiness */}
          <div style={{ borderLeft: '1px solid #F1F5F9', paddingLeft: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748B' }}>
              <CheckCircle size={12} color="#64748B" />
              <span>VERIFIED READINESS</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '2px' }}>
              <span style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0D0F11', lineHeight: 1.1 }}>{totalCompleted}/{totalItems}</span>
              <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 500 }}>({overallProgress}% cleared)</span>
            </div>
          </div>

          {/* Col 3: Day-1 Blockers */}
          <div style={{ borderLeft: '1px solid #F1F5F9', paddingLeft: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#EA580C' }}>
              <span>DAY-1 BLOCKERS</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '2px' }}>
              <span style={{ fontSize: '1.75rem', fontWeight: 900, color: '#EA580C', lineHeight: 1.1 }}>{totalBlockers}</span>
              <span style={{ fontSize: '12px', color: '#EA580C', fontWeight: 500 }}>requires client unblock</span>
            </div>
          </div>

          {/* Col 4: Sprint Velocity */}
          <div style={{ borderLeft: '1px solid #F1F5F9', paddingLeft: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748B' }}>
              <Zap size={12} color="#64748B" />
              <span>SPRINT VELOCITY</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '2px' }}>
              <span style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0D0F11', lineHeight: 1.1 }}>{avgVelocity}</span>
              <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 500 }}>tasks/wk projected</span>
            </div>
          </div>
        </div>

        {/* Progress Bar Strip */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '5px',
          paddingTop: '0.25rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11.5px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ED7D31', display: 'inline-block' }} />
              <span style={{ fontWeight: 600, color: '#0D0F11' }}>
                Sprint Clearance Target: <span style={{ fontWeight: 400, color: '#475569' }}>100% Day-1 Clearance Required</span>
              </span>
            </div>
            <strong style={{ fontWeight: 700, color: '#ED7D31' }}>{overallProgress}% Complete</strong>
          </div>

          <div style={{
            width: '100%',
            height: '3px',
            background: '#E2E8F0',
            borderRadius: '9999px',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              background: '#ED7D31',
              width: `${overallProgress}%`,
              borderRadius: '9999px',
              transition: 'width 0.4s ease'
            }} />
          </div>
        </div>
      </section>

      {/* 2. INTERACTIVE PLANNING CANVAS / SPRINT ROADMAP & GOVERNANCE CARD */}
      <section style={{
        background: '#FFFFFF',
        borderRadius: '12px',
        border: '1px solid #E2E8F0',
        padding: '1.25rem 1.5rem',
        boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        {/* Header with Target Tag & Title & Action Buttons */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <span style={{
              display: 'inline-block',
              fontSize: '10px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              color: '#EA580C',
              background: '#FFF7ED',
              border: '1px solid #FFEDD5',
              padding: '2px 8px',
              borderRadius: '4px',
              marginBottom: '4px'
            }}>
              TARGET KICK-OFF: 22-10-2026
            </span>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0D0F11', margin: 0, letterSpacing: '-0.02em' }}>
              Sprint Execution Roadmap &amp; Governance
            </h2>
            <p style={{ fontSize: '12.5px', color: '#64748B', margin: '2px 0 0 0' }}>
              Calibrate sprint duration, resolve architectural blockers, and manage cross-functional handovers.
            </p>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setViewMode('TIMELINE')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                background: '#FFFFFF',
                color: '#0D0F11',
                border: '1px solid #E2E8F0',
                fontSize: '11.5px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <FileText size={12} color="#475569" />
              <span>Timeline View</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('TABLE')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                background: '#FFFFFF',
                color: '#0D0F11',
                border: '1px solid #E2E8F0',
                fontSize: '11.5px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Layers size={12} color="#475569" />
              <span>Excel Matrix</span>
            </button>

            <button
              type="button"
              onClick={() => applySmartSprintBalancing(totalWeeks)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                background: '#FFFFFF',
                color: '#0D0F11',
                border: '1px solid #E2E8F0',
                fontSize: '11.5px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Sparkles size={12} color="#EA580C" />
              <span>AI Auto-Plan Sprints</span>
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                background: '#0D0F11',
                color: '#FFFFFF',
                border: 'none',
                fontSize: '11.5px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <Download size={12} color="#FFFFFF" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Sprint Cadence Row with Add Deliverable Button */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
          padding: '6px 10px',
          background: '#F8FAFC',
          borderRadius: '6px',
          border: '1px solid #E2E8F0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '10.5px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748B' }}>
              SPRINT CADENCE:
            </span>
            {[2, 4, 6, 8, 12, 16].map(w => {
              const isActive = totalWeeks === w;
              return (
                <button
                  key={w}
                  type="button"
                  onClick={() => {
                    setTotalWeeks(w);
                    applySmartSprintBalancing(w);
                  }}
                  style={{
                    padding: '3px 10px',
                    borderRadius: '9999px',
                    fontSize: '11px',
                    fontWeight: 700,
                    border: isActive ? 'none' : '1px solid #E2E8F0',
                    background: isActive ? '#0D0F11' : '#FFFFFF',
                    color: isActive ? '#FFFFFF' : '#475569',
                    cursor: 'pointer'
                  }}
                >
                  {w === 6 ? '6W Standard' : `${w}W`}
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => handleOpenAddTaskModal(0)}
              style={{
                background: '#FFFFFF',
                color: '#475569',
                border: '1px solid #E2E8F0',
                borderRadius: '9999px',
                padding: '3px 8px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              + Custom
            </button>
          </div>

          <button
            type="button"
            onClick={() => handleOpenAddTaskModal(1)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              background: '#FFFFFF',
              color: '#0D0F11',
              border: '1px solid #E2E8F0',
              borderRadius: '9999px',
              padding: '4px 12px',
              fontSize: '11.5px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <Plus size={12} color="#0D0F11" />
            <span>Add Deliverable</span>
          </button>
        </div>

        {/* Filters & Search Row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          {/* Filter Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              style={{
                padding: '4px 12px',
                borderRadius: '9999px',
                fontSize: '11.5px',
                fontWeight: 700,
                background: statusFilter === 'ALL' ? '#0D0F11' : '#FFFFFF',
                color: statusFilter === 'ALL' ? '#FFFFFF' : '#475569',
                border: statusFilter === 'ALL' ? 'none' : '1px solid #E2E8F0',
                cursor: 'pointer'
              }}
            >
              All Deliverables ({totalItems})
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('BLOCKERS')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 12px',
                borderRadius: '9999px',
                fontSize: '11.5px',
                fontWeight: 700,
                background: statusFilter === 'BLOCKERS' ? '#FFF7ED' : '#FFFFFF',
                color: statusFilter === 'BLOCKERS' ? '#EA580C' : '#475569',
                border: statusFilter === 'BLOCKERS' ? '1.5px solid #FED7AA' : '1px solid #E2E8F0',
                cursor: 'pointer'
              }}
            >
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#EA580C' }} />
              <span>Day-1 Blockers ({totalBlockers})</span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('PENDING')}
              style={{
                padding: '4px 12px',
                borderRadius: '9999px',
                fontSize: '11.5px',
                fontWeight: 700,
                background: statusFilter === 'PENDING' ? '#0F172A' : '#FFFFFF',
                color: statusFilter === 'PENDING' ? '#FFFFFF' : '#475569',
                border: statusFilter === 'PENDING' ? '1.5px solid #0F172A' : '1px solid #E2E8F0',
                cursor: 'pointer'
              }}
            >
              Need Action ({pendingCount})
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('CLEARED')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 12px',
                borderRadius: '9999px',
                fontSize: '11.5px',
                fontWeight: 700,
                background: statusFilter === 'CLEARED' ? '#0F172A' : '#FFFFFF',
                color: statusFilter === 'CLEARED' ? '#FFFFFF' : '#475569',
                border: statusFilter === 'CLEARED' ? '1.5px solid #0F172A' : '1px solid #E2E8F0',
                cursor: 'pointer'
              }}
            >
              <span>Cleared ({totalCompleted})</span>
            </button>
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', width: '260px' }}>
            <Search size={13} color="#94A3B8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter deliverables, owners, tags..."
              style={{
                width: '100%',
                padding: '5px 10px 5px 28px',
                fontSize: '11.5px',
                borderRadius: '6px',
                border: '1px solid #E2E8F0',
                background: '#FFFFFF',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>

        {/* 3. IMPLEMENTATION HORIZON (7 CADENCES) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748B' }}>
              IMPLEMENTATION HORIZON (7 CADENCES)
            </span>
            <span style={{ fontSize: '11px', color: '#64748B' }}>
              6 Weeks Active Track
            </span>
          </div>

          {/* 7 Stepper Cards Row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${groupedPhases.length}, minmax(130px, 1fr))`,
            gap: '8px',
            overflowX: 'auto',
            paddingBottom: '2px'
          }}>
            {groupedPhases.map((phase) => {
              const isWeek1 = phase.weekNum === 1;
              const hasBlockers = phase.criticalBlockers > 0;

              return (
                <div
                  key={phase.id}
                  onClick={() => togglePhaseExpand(phase.id)}
                  style={{
                    background: '#FFFFFF',
                    borderRadius: '8px',
                    border: isWeek1 ? '1.5px solid #0D0F11' : '1px solid #E2E8F0',
                    padding: '8px 10px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{
                      fontSize: '9.5px',
                      fontWeight: 700,
                      color: '#64748B'
                    }}>
                      {phase.weekNum === 0 ? 'Pre-Kick' : `Week ${phase.weekNum}`}
                    </span>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      color: phase.progressPct > 0 ? '#EA580C' : '#64748B'
                    }}>
                      {phase.progressPct}%
                    </span>
                  </div>

                  <div style={{
                    fontSize: '11.5px',
                    fontWeight: 700,
                    color: '#0D0F11',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {phase.shortName}
                  </div>

                  <div style={{ fontSize: '10px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    {hasBlockers ? (
                      <span style={{ color: '#DC2626', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#DC2626', display: 'inline-block' }} />
                        <span>{phase.criticalBlockers} Blocker{phase.criticalBlockers > 1 ? 's' : ''}</span>
                      </span>
                    ) : (
                      <span>{phase.completedCount}/{phase.totalCount} items</span>
                    )}
                  </div>

                  {/* Bottom Line */}
                  <div style={{ width: '100%', height: '2px', background: '#F1F5F9', borderRadius: '9999px', overflow: 'hidden', marginTop: '2px' }}>
                    <div style={{
                      width: `${Math.max(phase.progressPct, 0)}%`,
                      height: '100%',
                      background: phase.progressPct > 0 ? '#ED7D31' : '#E2E8F0',
                      borderRadius: '9999px'
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. MULTI-WEEK SPRINT ACCORDIONS (Clean light rows matching screenshot) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {groupedPhases.map((phase) => {
          const isExpanded = expandedPhaseIds.includes(phase.id);
          const hasBlockers = phase.criticalBlockers > 0;

          return (
            <div
              key={phase.id}
              style={{
                background: '#F8FAFC',
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                overflow: 'hidden'
              }}
            >
              {/* Accordion Header Bar */}
              <div
                onClick={() => togglePhaseExpand(phase.id)}
                style={{
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
              >
                {/* Left: Chevron + Phase Title + Schedule/Blockers */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                  <span style={{ color: '#64748B', display: 'flex', alignItems: 'center' }}>
                    {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                  </span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#0D0F11' }}>
                      {phase.title}
                    </span>

                    {phase.weekNum === 0 ? (
                      <span style={{
                        fontSize: '11px',
                        color: '#475569',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        background: '#FFFFFF',
                        border: '1px solid #E2E8F0'
                      }}>
                        Immediate Action
                      </span>
                    ) : (
                      <span style={{ fontSize: '11.5px', color: '#64748B' }}>
                        {phase.subtitle}
                      </span>
                    )}

                    <span style={{ color: '#CBD5E1' }}>•</span>

                    <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#475569' }}>
                      {phase.completedCount}/{phase.totalCount} Complete
                    </span>

                    {hasBlockers && (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        fontSize: '10.5px',
                        fontWeight: 700,
                        background: '#FFF5EE',
                        color: '#EA580C',
                        border: '1px solid #FFD8BF'
                      }}>
                        <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#EA580C' }} />
                        <span>{phase.criticalBlockers} Day-1 Blocker{phase.criticalBlockers > 1 ? 's' : ''}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: + Add Task */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenAddTaskModal(phase.weekNum);
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: 'transparent',
                    border: 'none',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    color: '#64748B',
                    cursor: 'pointer'
                  }}
                >
                  <Plus size={11} color="#64748B" />
                  <span>Add Task</span>
                </button>
              </div>

              {/* Accordion Content */}
              {isExpanded && (
                <div style={{
                  padding: '8px 12px 12px 12px',
                  background: '#FFFFFF',
                  borderTop: '1px solid #E2E8F0'
                }}>
                  {phase.items.length === 0 ? (
                    /* Week 0 Empty State */
                    <div style={{
                      borderRadius: '8px',
                      padding: '1.75rem 1rem',
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#64748B'
                      }}>
                        <Lock size={14} />
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#0D0F11' }}>
                        No deliverables currently pending in Pre-Kickoff stage
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#64748B', maxWidth: '480px' }}>
                        All environmental requirements have transitioned into active Sprint 1 provisioning.
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenAddTaskModal(phase.weekNum)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          marginTop: '4px',
                          padding: '5px 12px',
                          borderRadius: '9999px',
                          background: '#FFFFFF',
                          border: '1px solid #CBD5E1',
                          fontSize: '11.5px',
                          fontWeight: 600,
                          color: '#0D0F11',
                          cursor: 'pointer'
                        }}
                      >
                        <Plus size={11} color="#0D0F11" />
                        <span>Add Deliverable to Sprint</span>
                      </button>
                    </div>
                  ) : (
                    /* Deliverable Item Rows */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {phase.items.map((item) => {
                        const isDone = item.status === 'Verified';
                        const guideName = getGuideLabel(item);

                        return (
                          <div
                            key={item.id}
                            style={{
                              background: '#FFFFFF',
                              border: '1px solid #E2E8F0',
                              borderRadius: '8px',
                              padding: '10px 14px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '12px'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                              {/* Left Icon */}
                              {isDone ? (
                                <div style={{
                                  width: '18px',
                                  height: '18px',
                                  borderRadius: '50%',
                                  background: '#0D0F11',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0
                                }}>
                                  <Check size={11} color="#FFFFFF" strokeWidth={3} />
                                </div>
                              ) : (
                                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#ED7D31', display: 'inline-block', margin: '0 5px', flexShrink: 0 }} />
                              )}

                              {/* Title, Badges & Metadata */}
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                  <span style={{
                                    fontSize: '13px',
                                    fontWeight: 700,
                                    color: '#0D0F11',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                  }}>
                                    {item.name}
                                  </span>

                                  {/* Category Tag */}
                                  <span style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    padding: '1px 6px',
                                    borderRadius: '4px',
                                    fontSize: '10px',
                                    fontWeight: 600,
                                    background: '#F1F5F9',
                                    color: '#475569',
                                    border: '1px solid #E2E8F0'
                                  }}>
                                    {item.category || 'Security'}
                                  </span>

                                  {/* Day-1 Blocker Tag */}
                                  {item.is_critical && (
                                    <span style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      padding: '1px 6px',
                                      borderRadius: '4px',
                                      fontSize: '10px',
                                      fontWeight: 700,
                                      background: isDone ? '#F1F5F9' : '#FFF7ED',
                                      color: isDone ? '#94A3B8' : '#EA580C',
                                      border: isDone ? '1px solid #E2E8F0' : '1.5px solid #FED7AA',
                                      textDecoration: isDone ? 'line-through' : 'none'
                                    }}>
                                      Day-1 Blocker
                                    </span>
                                  )}
                                </div>

                                {/* Metadata Subline */}
                                <div style={{
                                  fontSize: '11px',
                                  color: '#64748B',
                                  marginTop: '2px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  flexWrap: 'wrap'
                                }}>
                                  <User size={11} color="#94A3B8" />
                                  <span>{item.owner || 'Security & Compliance Lead'}</span>
                                  <span>•</span>
                                  <span>Sprint: <strong>Week {phase.weekNum}</strong></span>
                                  <span>•</span>
                                  <button
                                    type="button"
                                    onClick={() => setGuideModalItem(item)}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      padding: 0,
                                      color: '#0D0F11',
                                      fontWeight: 600,
                                      fontSize: '11px',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '2px',
                                      cursor: 'pointer',
                                      textDecoration: 'underline'
                                    }}
                                  >
                                    <span>{guideName}</span>
                                    <ArrowUpRight size={10} />
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Right Action Button */}
                            <div style={{ flexShrink: 0 }}>
                              {isDone ? (
                                <button
                                  type="button"
                                  onClick={() => onProvideHandover && onProvideHandover(item)}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '4px 12px',
                                    borderRadius: '9999px',
                                    background: '#F8FAFC',
                                    border: '1px solid #E2E8F0',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    color: '#334155',
                                    cursor: 'pointer'
                                  }}
                                >
                                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0F172A' }} />
                                  <span>Cleared</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => onProvideHandover && onProvideHandover(item)}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '5px 14px',
                                    borderRadius: '9999px',
                                    background: '#0D0F11',
                                    color: '#FFFFFF',
                                    border: 'none',
                                    fontSize: '11.5px',
                                    fontWeight: 700,
                                    cursor: 'pointer'
                                  }}
                                >
                                  <span>Review Handover</span>
                                  <ArrowRight size={11} />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 5. FOOTER (Matches Screenshot) */}
      <footer style={{
        marginTop: '1.25rem',
        padding: '1rem 0',
        borderTop: '1px solid #E2E8F0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        fontSize: '11px',
        color: '#64748B'
      }}>
        <div>
          <strong style={{ color: '#0D0F11' }}>GOML PREQ DELIVERY PROTOCOL</strong> &nbsp;•&nbsp; An AI engineering delivery system by goML. Verified Pre-Kickoff Protocol.
        </div>

        <div>
          Confidential &nbsp;•&nbsp; {project.client_name || 'MovilVentas'} SOW &nbsp;•&nbsp; Version 2.4.0
        </div>
      </footer>

      {/* GUIDE / SOP MODAL */}
      {guideModalItem && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(13, 15, 17, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1.25rem'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '14px',
            width: '100%',
            maxWidth: '540px',
            padding: '1.5rem',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '10.5px', fontWeight: 800, textTransform: 'uppercase', color: '#64748B' }}>
                  TECHNICAL IMPLEMENTATION SOP
                </span>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0D0F11', margin: '2px 0 0 0' }}>
                  {guideModalItem.name}
                </h3>
              </div>
              <button
                onClick={() => setGuideModalItem(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: '4px' }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px 12px', fontSize: '12px', color: '#475569', lineHeight: 1.5 }}>
              {guideModalItem.description || 'Follow standard cloud provisioning SOP to configure and hand over required credentials.'}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <strong style={{ fontSize: '11.5px', color: '#0D0F11' }}>Execution Steps:</strong>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '11.5px', color: '#475569' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ fontWeight: 800, color: '#0D0F11' }}>1.</span>
                  <span>Log into the cloud console with administrator privileges in target AWS account (us-east-1).</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ fontWeight: 800, color: '#0D0F11' }}>2.</span>
                  <span>Provision IAM Role or Security Group rule with designated goML staging principal trust policy.</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ fontWeight: 800, color: '#0D0F11' }}>3.</span>
                  <span>Click <strong>"Review Handover"</strong> to submit the ARN / Endpoint payload for automated goML Day-1 verification.</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
              <button
                type="button"
                onClick={() => setGuideModalItem(null)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  background: '#F1F5F9',
                  border: '1px solid #E2E8F0',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  color: '#475569',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const item = guideModalItem;
                  setGuideModalItem(null);
                  if (onProvideHandover) onProvideHandover(item);
                }}
                style={{
                  padding: '6px 16px',
                  borderRadius: '6px',
                  background: '#0D0F11',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Review Handover
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD TASK MODAL */}
      {showAddTaskModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(13, 15, 17, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1.25rem'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '18px',
            width: '100%',
            maxWidth: '560px',
            padding: '1.75rem',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)',
            border: '1px solid #E2E8F0',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{
                  background: '#FFF5EE',
                  border: '1px solid #FFD8BF',
                  color: '#EA580C',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}>
                  {targetModalWeek === 0 ? 'Day-1 Readiness' : `Phase Schedule: Week ${targetModalWeek}`}
                </span>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0D0F11', margin: '6px 0 0 0', letterSpacing: '-0.02em' }}>
                  Add Deliverable to {targetModalWeek === 0 ? 'Pre-Kickoff Gate' : `Week ${targetModalWeek}`}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddTaskModal(false)}
                style={{
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '50%',
                  width: '30px',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#64748B'
                }}
              >
                <X size={15} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#64748B', marginBottom: '4px' }}>
                  Deliverable / Milestone Name *
                </label>
                <input
                  type="text"
                  value={newTaskData.name}
                  onChange={(e) => setNewTaskData({ ...newTaskData, name: e.target.value })}
                  placeholder="e.g. AWS VPC Peering & Ingress Route Tables"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '12.5px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#64748B', marginBottom: '4px' }}>
                    Category
                  </label>
                  <select
                    value={newTaskData.category}
                    onChange={(e) => setNewTaskData({ ...newTaskData, category: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '12.5px', outline: 'none', boxSizing: 'border-box', background: '#FFFFFF' }}
                  >
                    <option value="Security">Security &amp; IAM</option>
                    <option value="Environment">Cloud &amp; Environment</option>
                    <option value="Data">Data &amp; Analytics</option>
                    <option value="Integration">API &amp; Integrations</option>
                    <option value="Architecture">Architecture</option>
                    <option value="Frontend">Frontend &amp; UI</option>
                    <option value="Product">Product &amp; Governance</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#64748B', marginBottom: '4px' }}>
                    Responsible Owner
                  </label>
                  <input
                    type="text"
                    value={newTaskData.owner}
                    onChange={(e) => setNewTaskData({ ...newTaskData, owner: e.target.value })}
                    placeholder="e.g. Security & Compliance Lead"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '12.5px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#64748B', marginBottom: '4px' }}>
                  Scope Description &amp; Handover Requirements
                </label>
                <textarea
                  rows={2}
                  value={newTaskData.description}
                  onChange={(e) => setNewTaskData({ ...newTaskData, description: e.target.value })}
                  placeholder="Describe technical requirements, inputs, and handover specifications..."
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '12px', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{
                background: '#FFF7ED',
                border: '1px solid #FFEDD5',
                borderRadius: '8px',
                padding: '10px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    id="criticalCheckbox"
                    checked={newTaskData.is_critical}
                    onChange={(e) => setNewTaskData({ ...newTaskData, is_critical: e.target.checked })}
                    style={{ cursor: 'pointer', accentColor: '#EA580C' }}
                  />
                  <label htmlFor="criticalCheckbox" style={{ fontSize: '12px', fontWeight: 700, color: '#EA580C', cursor: 'pointer' }}>
                    Mark as Day-1 Critical Gatekeeper Blocker
                  </label>
                </div>
                <span style={{ fontSize: '11px', color: '#9A3412', fontWeight: 600 }}>
                  High Priority
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px', paddingTop: '12px', borderTop: '1px solid #F1F5F9' }}>
              <button
                type="button"
                onClick={() => setShowAddTaskModal(false)}
                style={{
                  padding: '7px 16px',
                  borderRadius: '6px',
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#475569',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveNewTask}
                style={{
                  padding: '7px 20px',
                  borderRadius: '6px',
                  background: '#0D0F11',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                }}
              >
                Add Deliverable
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
