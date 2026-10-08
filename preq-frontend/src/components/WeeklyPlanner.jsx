import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar, CheckCircle2, Clock, ArrowRight, ShieldCheck,
  AlertTriangle, User, FileText, ChevronDown, ChevronUp,
  Download, Sparkles, Key, Check, ExternalLink, Filter,
  Layers, CheckSquare, Square, Zap, Info, ArrowUpRight, Copy,
  Plus, Trash2, Edit3, MoveRight, HelpCircle, Search,
  X, RefreshCw, AlertCircle, CheckCircle, BarChart3, ChevronRight
} from 'lucide-react';
import { getCredentialGuidance, fetchDynamicCredentialGuidance } from '../utils/credentialGuide';

// Theme color palettes for dynamic weeks (repeats gracefully for any N weeks)
const WEEK_PALETTES = [
  { badgeBg: '#EFF6FF', badgeColor: '#2563EB', badgeBorder: '#BFDBFE', accentColor: '#2563EB' },
  { badgeBg: '#F5F3FF', badgeColor: '#7C3AED', badgeBorder: '#DDD6FE', accentColor: '#7C3AED' },
  { badgeBg: '#ECFDF5', badgeColor: '#059669', badgeBorder: '#A7F3D0', accentColor: '#059669' },
  { badgeBg: '#FFFBEB', badgeColor: '#D97706', badgeBorder: '#FDE68A', accentColor: '#D97706' },
  { badgeBg: '#FDF2F8', badgeColor: '#DB2777', badgeBorder: '#FBCFE8', accentColor: '#DB2777' },
  { badgeBg: '#F0FDFA', badgeColor: '#0D9488', badgeBorder: '#99F6E4', accentColor: '#0D9488' },
  { badgeBg: '#FEF3C7', badgeColor: '#B45309', badgeBorder: '#FCD34D', accentColor: '#B45309' },
  { badgeBg: '#EEF2FF', badgeColor: '#4F46E5', badgeBorder: '#C7D2FE', accentColor: '#4F46E5' },
  { badgeBg: '#F3F4F6', badgeColor: '#4B5563', badgeBorder: '#E5E7EB', accentColor: '#4B5563' }
];

// Pre-defined default week objective themes for initial population
const DEFAULT_WEEK_THEMES = [
  'Environment & Cloud IAM (VPC, Cloud IAM, VPN, Git Access)',
  'Data Ingestion & Schemas (Database Dictionaries, ETL & Sample Payloads)',
  'Core AI & API Integration (Endpoints, Webhooks & Models)',
  'Business Logic & Validation (Rules, Acceptance Criteria & Pilot Test)',
  'Security & Compliance Review (SOC2, DPA, Audit Logs & Pen-testing)',
  'UAT & Production Staging (Load Testing, SLA & Sign-Off)',
  'Pilot Deployment & Enterprise User Onboarding',
  'Production Go-Live & Day-1 Handover Operations',
  'Post-Launch Hypercare & Performance Optimization',
  'Phase 2 Scalability & Enterprise Rollout'
];

// Compute calendar date range for a given week number
const computeWeekDateRange = (startDateStr, weekNum) => {
  try {
    const baseDate = startDateStr ? new Date(startDateStr) : new Date();
    if (isNaN(baseDate.getTime())) return `Week ${weekNum}`;

    if (weekNum === 0) {
      return 'Pre-Kickoff Clearance';
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

// Senior Architect AI Multi-Sprint Auto-Balancer (Distributes deliverables realistically across N weeks)
export const computeIntelligentSprintWeek = (item, index, totalItems, totalWeeks = 4) => {
  if (item.target_sprint_week !== undefined && item.target_sprint_week !== null) {
    return Math.min(totalWeeks, Math.max(0, parseInt(item.target_sprint_week, 10)));
  }

  const name = (item.name || '').toLowerCase();
  const desc = (item.description || '').toLowerCase();
  const cat = (item.category || '').toLowerCase();
  const text = `${name} ${desc} ${cat}`;

  // 1. Week 0 (Pre-Kickoff Gatekeepers) - ONLY absolute Day-1 foundation (Max 1-2 items)
  if (
    (name.includes('master cloud') || name.includes('root iam') || name.includes('cloud provider account')) ||
    (name.includes('data processing agreement') || name.includes('signed dpa')) ||
    (name.includes('whatsapp') && (name.includes('phone') || name.includes('account approval') || name.includes('business manager'))) ||
    (index === 0 && item.is_critical && (cat === 'compliance' || cat === 'security'))
  ) {
    return 0; // Week 0 (Pre-Kickoff)
  }

  // 2. Week 1: Environment & Cloud IAM (VPC, IAM, Git, Terraform, Network)
  if (
    text.includes('vpc') || text.includes('peering') || text.includes('iam role') ||
    text.includes('terraform') || text.includes('github') || text.includes('gitlab') ||
    text.includes('ci/cd') || text.includes('network') || text.includes('subnet') ||
    text.includes('ip whitelist') || text.includes('vpn') || cat === 'environment'
  ) {
    return Math.min(totalWeeks, 1);
  }

  // 3. Week 2: Data Ingestion & Schemas (Datasets, SQL, DB Secrets, Dictionaries)
  if (
    text.includes('dataset') || text.includes('sample') || text.includes('database') ||
    text.includes('sql') || text.includes('postgres') || text.includes('mysql') ||
    text.includes('dump') || text.includes('schema') || text.includes('dictionary') ||
    text.includes('er diagram') || text.includes('s3') || text.includes('storage') ||
    cat === 'data'
  ) {
    return Math.min(totalWeeks, 2);
  }

  // 4. Week 3: Core AI Models & API Integration (LLM, Bedrock, OpenAI, OpenAPI, Webhook)
  if (
    text.includes('model') || text.includes('bedrock') || text.includes('openai') ||
    text.includes('anthropic') || text.includes('opensearch') || text.includes('vector') ||
    text.includes('openapi') || text.includes('swagger') || text.includes('api key') ||
    text.includes('webhook') || text.includes('endpoint') || cat === 'integration'
  ) {
    return Math.min(totalWeeks, Math.min(3, totalWeeks));
  }

  // 5. Week 4: Business Logic & Acceptance Validation (Rules, Benchmark, Pilot)
  if (
    text.includes('rule') || text.includes('acceptance') || text.includes('charter') ||
    text.includes('logic') || text.includes('benchmark') || text.includes('pilot') ||
    cat === 'people' || cat === 'business'
  ) {
    return Math.min(totalWeeks, Math.min(4, totalWeeks));
  }

  // 6. Week 5+ or Dynamic Distribution across remaining weeks
  if (text.includes('soc2') || text.includes('audit') || text.includes('load test') || text.includes('pen-test')) {
    return Math.min(totalWeeks, Math.max(1, totalWeeks));
  }

  // Balanced fallback: distribute across 1..N based on item position
  const targetWeek = Math.min(totalWeeks, Math.max(1, Math.floor((index / Math.max(1, totalItems)) * totalWeeks) + 1));
  return targetWeek;
};

export const WeeklyPlanner = ({
  checklist = [],
  project = {},
  onProvideHandover,
  onToggleCheck,
  onAddItem
}) => {
  // Determine initial number of weeks based on project duration or checklist items
  const initialWeeksCount = Math.max(4, Math.min(12, Math.ceil(checklist.length / 2.5) || 4));
  const [totalWeeks, setTotalWeeks] = useState(initialWeeksCount);

  // Kickoff Date State (allows interactive date picking to recalculate schedule)
  const [kickoffDate, setKickoffDate] = useState(() => {
    if (project.target_kickoff_date) {
      try {
        const d = new Date(project.target_kickoff_date);
        if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
      } catch (e) {}
    }
    return new Date().toISOString().split('T')[0];
  });

  // Dynamic Custom Assignments: map of { itemId: weekNum } (0 = Pre-Kickoff, 1..N = Week 1..N)
  const [itemWeekMap, setItemWeekMap] = useState({});
  const [selectedPhaseId, setSelectedPhaseId] = useState('ALL');
  const [expandedPhaseIds, setExpandedPhaseIds] = useState(['WEEK_0', 'WEEK_1', 'WEEK_2', 'WEEK_3', 'WEEK_4']);
  const [viewMode, setViewMode] = useState('TIMELINE'); // 'TIMELINE' | 'TABLE'
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Interactive Credential Guidance
  const [activeCredItem, setActiveCredItem] = useState(null);
  const [dynamicGuideMap, setDynamicGuideMap] = useState({});
  const [copiedDelegationId, setCopiedDelegationId] = useState(null);
  const [isScrapingMap, setIsScrapingMap] = useState({});

  // Custom week titles/objectives editable by user
  const [customWeekTitles, setCustomWeekTitles] = useState({});
  const [editingWeekNum, setEditingWeekNum] = useState(null);
  const [editTitleInput, setEditTitleInput] = useState('');

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

  // Local additional items added by user on the fly
  const [localItems, setLocalItems] = useState([]);

  // Merge backend checklist and locally added tasks
  const combinedChecklist = useMemo(() => {
    const combined = [...checklist];
    localItems.forEach(item => {
      if (!combined.some(c => c.id === item.id)) {
        combined.push(item);
      }
    });
    return combined;
  }, [checklist, localItems]);

  // Available categories
  const categories = useMemo(() => {
    const set = new Set();
    combinedChecklist.forEach(item => {
      if (item.category) set.add(item.category);
    });
    return Array.from(set);
  }, [combinedChecklist]);

  // Senior Architect AI Auto-Balance across N weeks
  const applySmartSprintBalancing = (weeksCount = totalWeeks) => {
    const newMap = {};
    combinedChecklist.forEach((item, index) => {
      newMap[item.id] = computeIntelligentSprintWeek(item, index, combinedChecklist.length, weeksCount);
    });
    setItemWeekMap(newMap);
  };

  // Initialize smart assignments on load or when checklist changes
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
        subtitle: 'Mandatory Before Project Kickoff (Day-1 Blockers)',
        dateRange: 'Immediate Action (Pre-Kickoff)',
        timelineLabel: 'Before project kickoff',
        description: 'Critical cloud credentials, core IAM permissions, WhatsApp/Messaging setup, and legal governance.',
        badgeBg: '#FFF7F0',
        badgeColor: '#ED7D31',
        badgeBorder: '#FCD9C2',
        accentColor: '#ED7D31'
      }
    ];

    for (let w = 1; w <= totalWeeks; w++) {
      const palette = WEEK_PALETTES[(w - 1) % WEEK_PALETTES.length];
      const defaultTheme = DEFAULT_WEEK_THEMES[(w - 1) % DEFAULT_WEEK_THEMES.length] || `Sprint ${w} Milestone Execution`;
      const themeTitle = customWeekTitles[w] || defaultTheme;

      phases.push({
        id: `WEEK_${w}`,
        weekNum: w,
        title: `Week ${w}: ${themeTitle.split('(')[0].trim()}`,
        subtitle: `Sprint ${w} (${computeWeekDateRange(kickoffDate, w)})`,
        dateRange: computeWeekDateRange(kickoffDate, w),
        timelineLabel: `Sprint Week ${w} (${computeWeekDateRange(kickoffDate, w)})`,
        description: themeTitle.includes('(') ? themeTitle.substring(themeTitle.indexOf('(') + 1, themeTitle.indexOf(')')) : themeTitle,
        badgeBg: palette.badgeBg,
        badgeColor: palette.badgeColor,
        badgeBorder: palette.badgeBorder,
        accentColor: palette.accentColor
      });
    }
    return phases;
  }, [totalWeeks, customWeekTitles, kickoffDate]);

  // Assign items to dynamic phases with search & category filtering
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

        // Category Filter
        if (categoryFilter !== 'ALL' && item.category !== categoryFilter) {
          return false;
        }

        // Status Filter
        if (statusFilter !== 'ALL') {
          if (statusFilter === 'VERIFIED' && item.status !== 'Verified') return false;
          if (statusFilter === 'PENDING' && item.status === 'Verified') return false;
          if (statusFilter === 'CRITICAL' && !item.is_critical) return false;
        }

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
  }, [dynamicPhases, combinedChecklist, itemWeekMap, searchQuery, categoryFilter, statusFilter]);

  // Summary Metrics
  const totalItems = combinedChecklist.length;
  const totalCompleted = combinedChecklist.filter(i => i.status === 'Verified').length;
  const overallProgress = totalItems > 0 ? Math.round((totalCompleted / totalItems) * 100) : 0;
  const totalBlockers = combinedChecklist.filter(i => i.is_critical && i.status !== 'Verified').length;
  const avgVelocity = totalWeeks > 0 ? (totalItems / totalWeeks).toFixed(1) : 0;

  // Reassign an item to another week
  const handleMoveItemToWeek = (itemId, targetWeekNum) => {
    setItemWeekMap(prev => ({
      ...prev,
      [itemId]: parseInt(targetWeekNum, 10)
    }));
  };

  // Add new week
  const handleAddWeek = () => {
    if (totalWeeks < 24) {
      const nextWeek = totalWeeks + 1;
      setTotalWeeks(nextWeek);
      setExpandedPhaseIds(prev => [...prev, `WEEK_${nextWeek}`]);
    }
  };

  // Remove week
  const handleRemoveWeek = (weekNum) => {
    if (totalWeeks > 1) {
      setItemWeekMap(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(itemId => {
          if (next[itemId] === weekNum) {
            next[itemId] = Math.max(0, weekNum - 1);
          }
        });
        return next;
      });
      setTotalWeeks(prev => prev - 1);
    }
  };

  // Start editing week objective
  const handleStartEditWeek = (weekNum, currentTitle) => {
    setEditingWeekNum(weekNum);
    setEditTitleInput(currentTitle || '');
  };

  const handleSaveWeekTitle = (weekNum) => {
    if (editTitleInput.trim()) {
      setCustomWeekTitles(prev => ({
        ...prev,
        [weekNum]: editTitleInput.trim()
      }));
    }
    setEditingWeekNum(null);
  };

  // Handle adding custom item to a specific sprint
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
      input_type: 'credential_form',
      is_locked: false
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

  const togglePhaseExpand = (phaseId) => {
    setExpandedPhaseIds(prev =>
      prev.includes(phaseId) ? prev.filter(id => id !== phaseId) : [...prev, phaseId]
    );
  };

  const handleCopyDelegation = (msg, itemId) => {
    if (!msg) return;
    navigator.clipboard.writeText(msg);
    setCopiedDelegationId(itemId);
    setTimeout(() => setCopiedDelegationId(null), 2500);
  };

  const toggleCredItem = (item) => {
    if (activeCredItem?.id === item.id) {
      setActiveCredItem(null);
      return;
    }
    setActiveCredItem(item);
    if (!dynamicGuideMap[item.id]) {
      setIsScrapingMap(prev => ({ ...prev, [item.id]: true }));
      fetchDynamicCredentialGuidance(item).then(res => {
        if (res) {
          setDynamicGuideMap(prev => ({ ...prev, [item.id]: res }));
        }
      }).catch(() => {})
        .finally(() => {
          setIsScrapingMap(prev => ({ ...prev, [item.id]: false }));
        });
    }
  };

  const handleReScrapeItem = (item) => {
    setIsScrapingMap(prev => ({ ...prev, [item.id]: true }));
    fetchDynamicCredentialGuidance(item, true).then(res => {
      if (res) {
        setDynamicGuideMap(prev => ({ ...prev, [item.id]: res }));
      }
    }).catch(() => {})
      .finally(() => {
        setIsScrapingMap(prev => ({ ...prev, [item.id]: false }));
      });
  };

  // Export to CSV spreadsheet with dynamic N weeks
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
    link.setAttribute('download', `${project.name || 'Project'}_${totalWeeks}Week_Implementation_Tracker.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', fontFamily: 'Inter, -apple-system, sans-serif' }}>

      {/* TOP PLANNER HEADER & REAL-LIFE N-WEEK CONTROLS */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #EBEAEF',
        borderRadius: '16px',
        padding: '1.35rem 1.75rem',
        boxShadow: '0 2px 12px rgba(14, 10, 26, 0.03)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1.25rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
            <span style={{
              background: '#FFF7F0',
              color: '#ED7D31',
              border: '1px solid #FCD9C2',
              fontSize: '11px',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: '100px',
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}>
              Dynamic {totalWeeks}-Week Delivery Planner
            </span>
            <span style={{ fontSize: '13px', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>Target Kick-off:</span>
              <input
                type="date"
                value={kickoffDate}
                onChange={(e) => setKickoffDate(e.target.value)}
                style={{
                  border: '1px solid #CBD5E1',
                  borderRadius: '6px',
                  padding: '2px 6px',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#0E0A1A',
                  background: '#F8FAFC',
                  outline: 'none',
                  cursor: 'pointer'
                }}
                title="Adjust kickoff start date to recalculate all sprint calendar dates"
              />
            </span>
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0E0A1A', margin: 0, letterSpacing: '-0.02em' }}>
            Interactive N-Week Implementation Roadmap
          </h2>
          <p style={{ fontSize: '13px', color: '#6B7280', margin: '4px 0 0 0' }}>
            Fully customizable sprint duration (N weeks), drag/reassign deliverables, edit objectives, and export matrix tables.
          </p>
        </div>

        {/* Action Controls: N-Week Selector & View Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Quick N-Week Duration Selector */}
          <div style={{
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '10px',
            padding: '3px 8px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#475569', marginRight: '2px' }}>Weeks:</span>
            {[2, 4, 6, 8, 12, 16].map(w => (
              <button
                key={w}
                type="button"
                onClick={() => {
                  setTotalWeeks(w);
                  applySmartSprintBalancing(w);
                }}
                style={{
                  background: totalWeeks === w ? '#0E0A1A' : 'transparent',
                  color: totalWeeks === w ? '#ffffff' : '#64748B',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '3px 8px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {w}W
              </button>
            ))}
            
            {/* Custom Week Stepper */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '2px', borderLeft: '1px solid #CBD5E1', paddingLeft: '6px', marginLeft: '2px' }}>
              <input
                type="number"
                min={1}
                max={24}
                value={totalWeeks}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val) && val >= 1 && val <= 24) {
                    setTotalWeeks(val);
                    applySmartSprintBalancing(val);
                  }
                }}
                style={{
                  width: '38px',
                  textAlign: 'center',
                  fontSize: '11.5px',
                  fontWeight: 800,
                  border: '1px solid #CBD5E1',
                  borderRadius: '4px',
                  padding: '2px 0',
                  color: '#0E0A1A'
                }}
                title="Enter custom number of weeks (1-24)"
              />
              <button
                type="button"
                onClick={handleAddWeek}
                disabled={totalWeeks >= 24}
                style={{
                  background: '#FFF7F0',
                  color: '#ED7D31',
                  border: '1px solid #FCD9C2',
                  borderRadius: '6px',
                  padding: '3px 7px',
                  fontSize: '11px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px'
                }}
                title="Add an additional sprint week"
              >
                <Plus size={12} />
                <span>Week</span>
              </button>
            </div>
          </div>

          {/* AI Auto-Balance Sprints Button */}
          <button
            type="button"
            onClick={() => applySmartSprintBalancing(totalWeeks)}
            style={{
              background: 'linear-gradient(135deg, #FFF7F0 0%, #FFF0E5 100%)',
              color: '#ED7D31',
              border: '1.5px solid #FCD9C2',
              borderRadius: '10px',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(237, 125, 49, 0.12)',
              transition: 'transform 0.15s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            title="Automatically distribute deliverables across all N weeks using Senior AI Architect logic"
          >
            <Sparkles size={13} color="#ED7D31" />
            <span>AI Auto-Plan Sprints</span>
          </button>

          {/* View Mode Switcher: Timeline vs Excel Table */}
          <div style={{
            background: '#F3F4F6',
            border: '1px solid #E5E7EB',
            borderRadius: '10px',
            padding: '3px',
            display: 'flex',
            gap: '3px'
          }}>
            <button
              type="button"
              onClick={() => setViewMode('TIMELINE')}
              style={{
                background: viewMode === 'TIMELINE' ? '#ffffff' : 'transparent',
                color: viewMode === 'TIMELINE' ? '#0E0A1A' : '#6B7280',
                border: 'none',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: viewMode === 'TIMELINE' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s ease',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <Calendar size={13} color={viewMode === 'TIMELINE' ? '#ED7D31' : '#6B7280'} />
              <span>Timeline Roadmap</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('TABLE')}
              style={{
                background: viewMode === 'TABLE' ? '#ffffff' : 'transparent',
                color: viewMode === 'TABLE' ? '#0E0A1A' : '#6B7280',
                border: 'none',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: viewMode === 'TABLE' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s ease',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <Layers size={13} color={viewMode === 'TABLE' ? '#ED7D31' : '#6B7280'} />
              <span>Excel Matrix Table</span>
            </button>
          </div>

          {/* Export CSV / Excel Button */}
          <button
            type="button"
            onClick={handleExportCSV}
            style={{
              background: '#0E0A1A',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              padding: '8px 14px',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(14, 10, 26, 0.15)',
              transition: 'transform 0.15s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            title="Download formatted CSV spreadsheet tracker"
          >
            <Download size={13} color="#ED7D31" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* EXECUTIVE REAL-LIFE METRICS STRIP */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem'
      }}>
        {/* Total Deliverables */}
        <div style={{
          background: '#ffffff',
          border: '1px solid #EBEAEF',
          borderRadius: '14px',
          padding: '1rem 1.25rem',
          boxShadow: '0 1px 4px rgba(0,0,0,0.02)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#F8FAFC', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Layers size={18} color="#0E0A1A" />
          </div>
          <div>
            <div style={{ fontSize: '11.5px', color: '#6B7280', fontWeight: 600 }}>Total Deliverables</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0E0A1A' }}>{totalItems} Items</div>
          </div>
        </div>

        {/* Verified Readiness */}
        <div style={{
          background: '#ffffff',
          border: '1px solid #EBEAEF',
          borderRadius: '14px',
          padding: '1rem 1.25rem',
          boxShadow: '0 1px 4px rgba(0,0,0,0.02)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#ECFDF5', border: '1px solid #A7F3D0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={18} color="#059669" />
          </div>
          <div>
            <div style={{ fontSize: '11.5px', color: '#6B7280', fontWeight: 600 }}>Verified Readiness</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#059669' }}>
              {totalCompleted}/{totalItems} ({overallProgress}%)
            </div>
          </div>
        </div>

        {/* Day-1 Pre-Kickoff Blockers */}
        <div style={{
          background: totalBlockers > 0 ? '#FFF8F8' : '#ffffff',
          border: totalBlockers > 0 ? '1px solid #FECACA' : '1px solid #EBEAEF',
          borderRadius: '14px',
          padding: '1rem 1.25rem',
          boxShadow: '0 1px 4px rgba(0,0,0,0.02)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: totalBlockers > 0 ? '#FEF2F2' : '#F0FDF4',
            border: totalBlockers > 0 ? '1px solid #FCA5A5' : '1px solid #BBF7D0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <AlertTriangle size={18} color={totalBlockers > 0 ? '#DC2626' : '#16A34A'} />
          </div>
          <div>
            <div style={{ fontSize: '11.5px', color: '#6B7280', fontWeight: 600 }}>Day-1 Blockers</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: totalBlockers > 0 ? '#DC2626' : '#16A34A' }}>
              {totalBlockers > 0 ? `${totalBlockers} Pending` : 'All Clear'}
            </div>
          </div>
        </div>

        {/* Sprint Velocity */}
        <div style={{
          background: '#ffffff',
          border: '1px solid #EBEAEF',
          borderRadius: '14px',
          padding: '1rem 1.25rem',
          boxShadow: '0 1px 4px rgba(0,0,0,0.02)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#FFF7F0', border: '1px solid #FCD9C2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={18} color="#ED7D31" />
          </div>
          <div>
            <div style={{ fontSize: '11.5px', color: '#6B7280', fontWeight: 600 }}>Sprint Velocity</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ED7D31' }}>
              {avgVelocity} <span style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280' }}>tasks/week</span>
            </div>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #EBEAEF',
        borderRadius: '14px',
        padding: '0.75rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '220px' }}>
          <Search size={15} color="#9CA3AF" />
          <input
            type="text"
            placeholder="Search deliverables, credentials, owners, or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              border: 'none',
              background: 'transparent',
              fontSize: '13px',
              color: '#0E0A1A',
              width: '100%',
              outline: 'none'
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#9CA3AF' }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{
              border: '1px solid #CBD5E1',
              borderRadius: '8px',
              padding: '5px 10px',
              fontSize: '12px',
              fontWeight: 600,
              color: '#334155',
              background: '#F8FAFC',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="ALL">All Categories</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              border: '1px solid #CBD5E1',
              borderRadius: '8px',
              padding: '5px 10px',
              fontSize: '12px',
              fontWeight: 600,
              color: '#334155',
              background: '#F8FAFC',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending / In Progress</option>
            <option value="VERIFIED">Verified / Cleared</option>
            <option value="CRITICAL">Day-1 Blockers Only</option>
          </select>

          <button
            type="button"
            onClick={() => handleOpenAddTaskModal(0)}
            style={{
              background: '#FFF7F0',
              color: '#ED7D31',
              border: '1px solid #FCD9C2',
              borderRadius: '8px',
              padding: '5px 12px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Plus size={13} />
            <span>Add Custom Task</span>
          </button>
        </div>
      </div>

      {/* DYNAMIC SPRINT ROADMAP PROGRESS BAR CAROUSEL */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
        gap: '0.75rem'
      }}>
        {groupedPhases.map((phase) => {
          const isSelected = selectedPhaseId === phase.id;
          return (
            <div
              key={phase.id}
              onClick={() => setSelectedPhaseId(selectedPhaseId === phase.id ? 'ALL' : phase.id)}
              style={{
                background: isSelected ? '#FFF8F3' : '#ffffff',
                border: isSelected ? '1.5px solid #ED7D31' : '1px solid #EBEAEF',
                borderRadius: '14px',
                padding: '0.85rem 1rem',
                cursor: 'pointer',
                boxShadow: isSelected ? '0 4px 14px rgba(237, 125, 49, 0.12)' : '0 1px 4px rgba(0,0,0,0.02)',
                transition: 'all 0.15s ease',
                display: 'flex',
                flexDirection: 'column',
                gap: '5px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{
                  fontSize: '10.5px',
                  fontWeight: 800,
                  color: phase.badgeColor,
                  background: phase.badgeBg,
                  border: `1px solid ${phase.badgeBorder}`,
                  padding: '2px 7px',
                  borderRadius: '100px'
                }}>
                  {phase.weekNum === 0 ? 'Pre-Kickoff' : `Week ${phase.weekNum}`}
                </span>
                <span style={{ fontSize: '11.5px', fontWeight: 800, color: phase.progressPct === 100 ? '#10B981' : '#ED7D31' }}>
                  {phase.progressPct}%
                </span>
              </div>

              <div style={{ fontSize: '12px', fontWeight: 800, color: '#0E0A1A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {phase.weekNum === 0 ? 'Day-1 Gatekeepers' : `Sprint ${phase.weekNum}`}
              </div>

              <div style={{ fontSize: '11px', color: '#6B7280' }}>
                {phase.completedCount}/{phase.totalCount} Done {phase.criticalBlockers > 0 && <span style={{ color: '#DC2626', fontWeight: 700 }}>• {phase.criticalBlockers} Blocker</span>}
              </div>

              {/* Progress mini bar */}
              <div style={{ width: '100%', height: '4px', background: '#F0ECE8', borderRadius: '100px', overflow: 'hidden', marginTop: '3px' }}>
                <div style={{
                  width: `${phase.progressPct}%`,
                  height: '100%',
                  background: phase.progressPct === 100 ? '#10B981' : phase.accentColor,
                  borderRadius: '100px',
                  transition: 'width 0.4s ease'
                }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* VIEW 1: EXPANSIVE N-WEEK SPRINT TIMELINE CARDS WITH REASSIGNMENT */}
      {viewMode === 'TIMELINE' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {groupedPhases
            .filter(phase => selectedPhaseId === 'ALL' || selectedPhaseId === phase.id)
            .map(phase => {
              const isExpanded = expandedPhaseIds.includes(phase.id);
              const isEditing = editingWeekNum === phase.weekNum;

              return (
                <div
                  key={phase.id}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #EBEAEF',
                    borderRadius: '18px',
                    boxShadow: '0 2px 14px rgba(14, 10, 26, 0.03)',
                    overflow: 'hidden'
                  }}
                >
                  {/* Phase Header Bar */}
                  <div
                    onClick={() => togglePhaseExpand(phase.id)}
                    style={{
                      padding: '1.15rem 1.5rem',
                      background: phase.badgeBg,
                      borderBottom: isExpanded ? '1px solid #EBEAEF' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      userSelect: 'none',
                      flexWrap: 'wrap',
                      gap: '0.75rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '280px' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: phase.accentColor,
                        color: '#ffffff',
                        fontWeight: 800,
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                        flexShrink: 0
                      }}>
                        {phase.weekNum === 0 ? '0' : phase.weekNum}
                      </div>

                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          {isEditing ? (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                            >
                              <input
                                type="text"
                                value={editTitleInput}
                                onChange={(e) => setEditTitleInput(e.target.value)}
                                autoFocus
                                style={{
                                  fontSize: '14px',
                                  fontWeight: 700,
                                  color: '#0E0A1A',
                                  padding: '2px 8px',
                                  border: '1.5px solid #ED7D31',
                                  borderRadius: '6px',
                                  outline: 'none'
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveWeekTitle(phase.weekNum)}
                                style={{
                                  background: '#ED7D31',
                                  color: '#ffffff',
                                  border: 'none',
                                  borderRadius: '6px',
                                  padding: '3px 8px',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  cursor: 'pointer'
                                }}
                              >
                                Save
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0E0A1A', margin: 0 }}>
                                {phase.title}
                              </h3>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStartEditWeek(phase.weekNum, customWeekTitles[phase.weekNum] || phase.title);
                                }}
                                style={{
                                  border: 'none',
                                  background: 'transparent',
                                  cursor: 'pointer',
                                  color: '#64748B',
                                  padding: '2px'
                                }}
                                title="Edit sprint objective / theme"
                              >
                                <Edit3 size={13} />
                              </button>
                            </div>
                          )}

                          <span style={{ fontSize: '12px', color: '#4B5563', fontWeight: 600, background: '#ffffff', padding: '2px 8px', borderRadius: '6px', border: '1px solid #E5E7EB', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Calendar size={11} color="#6B7280" />
                            <span>{phase.dateRange}</span>
                          </span>
                        </div>
                        <p style={{ fontSize: '12px', color: '#4B5563', margin: '3px 0 0 0' }}>
                          {phase.description}
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '13px', fontWeight: 800, color: phase.progressPct === 100 ? '#10B981' : '#0E0A1A' }}>
                          {phase.completedCount}/{phase.totalCount} Complete
                        </span>
                        <div style={{ fontSize: '11px', color: phase.criticalBlockers > 0 ? '#DC2626' : '#6B7280', fontWeight: phase.criticalBlockers > 0 ? 700 : 500, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '3px' }}>
                          {phase.criticalBlockers > 0 ? (
                            <>
                              <AlertTriangle size={11} color="#DC2626" />
                              <span>{phase.criticalBlockers} Day-1 Blocker</span>
                            </>
                          ) : (
                            <span>On Track</span>
                          )}
                        </div>
                      </div>

                      {/* Add Task Button for this Sprint */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenAddTaskModal(phase.weekNum);
                        }}
                        style={{
                          background: '#ffffff',
                          color: '#0E0A1A',
                          border: '1px solid #CBD5E1',
                          borderRadius: '8px',
                          padding: '5px 9px',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                        title={`Add a new task directly to Week ${phase.weekNum}`}
                      >
                        <Plus size={12} color="#ED7D31" />
                        <span>Add Task</span>
                      </button>

                      {/* Remove Week Button (if custom added week) */}
                      {phase.weekNum > 2 && phase.weekNum === totalWeeks && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveWeek(phase.weekNum);
                          }}
                          style={{
                            background: '#FEE2E2',
                            color: '#DC2626',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          title="Remove this sprint week"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}

                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: '#ffffff',
                        border: '1px solid #E5E7EB',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#4B5563'
                      }}>
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </div>
                  </div>

                  {/* Phase Checklist Items Container */}
                  {isExpanded && (
                    <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      {phase.items.length === 0 ? (
                        <div style={{ padding: '1.75rem', textAlign: 'center', color: '#9CA3AF', fontSize: '13px', background: '#FAFAFC', borderRadius: '12px', border: '1px dashed #CBD5E1' }}>
                          <p style={{ margin: '0 0 8px 0' }}>No deliverables currently assigned to {phase.weekNum === 0 ? 'Pre-Kickoff' : `Week ${phase.weekNum}`}.</p>
                          <button
                            type="button"
                            onClick={() => handleOpenAddTaskModal(phase.weekNum)}
                            style={{
                              background: '#FFF7F0',
                              color: '#ED7D31',
                              border: '1px solid #FCD9C2',
                              borderRadius: '6px',
                              padding: '4px 10px',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            + Add Deliverable to Sprint
                          </button>
                        </div>
                      ) : (
                        phase.items.map((item, idx) => {
                          const isVerified = item.status === 'Verified';
                          const isSubmitted = item.status === 'Submitted';
                          const isScraping = isScrapingMap[item.id];
                          const credGuide = dynamicGuideMap[item.id] || getCredentialGuidance(item);

                          return (
                            <div
                              key={item.id || idx}
                              style={{
                                background: isVerified ? '#F9FDFB' : '#FAFAFC',
                                border: isVerified ? '1px solid #DCFCE7' : '1px solid #EBEAEF',
                                borderRadius: '12px',
                                padding: '1rem 1.25rem',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.75rem',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', flex: 1, minWidth: '260px' }}>
                                  {/* Checkbox circle */}
                                  <div
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (onToggleCheck) onToggleCheck(e, item);
                                    }}
                                    style={{ cursor: 'pointer', marginTop: '2px', flexShrink: 0 }}
                                    title={isVerified ? "Mark pending" : "Click to verify"}
                                  >
                                    {isVerified ? (
                                      <div style={{
                                        width: '22px',
                                        height: '22px',
                                        borderRadius: '50%',
                                        background: '#10B981',
                                        color: '#ffffff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: '0 2px 6px rgba(16, 185, 129, 0.25)'
                                      }}>
                                        <Check size={13} strokeWidth={3} />
                                      </div>
                                    ) : (
                                      <div style={{
                                        width: '22px',
                                        height: '22px',
                                        borderRadius: '50%',
                                        border: '2px dashed #CBD5E1',
                                        background: '#ffffff'
                                      }} />
                                    )}
                                  </div>

                                  {/* Title & Metadata */}
                                  <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '3px' }}>
                                      <span style={{
                                        fontSize: '11px',
                                        fontWeight: 700,
                                        background: '#F3F4F6',
                                        color: '#374151',
                                        padding: '1px 8px',
                                        borderRadius: '100px'
                                      }}>
                                        {item.category || 'General'}
                                      </span>

                                      {item.is_critical && (
                                        <span style={{
                                          fontSize: '11px',
                                          fontWeight: 700,
                                          background: '#FEF2F2',
                                          color: '#DC2626',
                                          padding: '1px 8px',
                                          borderRadius: '100px',
                                          border: '1px solid #FEE2E2'
                                        }}>
                                          Day-1 Blocker
                                        </span>
                                      )}

                                      {item.owner && (
                                        <span style={{ fontSize: '11px', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                          <User size={11} /> {item.owner}
                                        </span>
                                      )}
                                    </div>

                                    <h4 style={{
                                      fontSize: '14px',
                                      fontWeight: 700,
                                      color: isVerified ? '#64748B' : '#0E0A1A',
                                      margin: '0 0 3px 0',
                                      textDecoration: isVerified ? 'line-through' : 'none'
                                    }}>
                                      {item.name}
                                    </h4>

                                    <p style={{ fontSize: '12.5px', color: '#4B5563', margin: 0, lineHeight: 1.5 }}>
                                      {item.description}
                                    </p>
                                  </div>
                                </div>

                                {/* Right Planning Controls: Move to Week N & Credential Guide */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, flexWrap: 'wrap' }}>
                                  {/* Real-Life Planable Sprint Week Selector */}
                                  <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    background: '#ffffff',
                                    border: '1px solid #E2E8F0',
                                    borderRadius: '8px',
                                    padding: '3px 8px'
                                  }}>
                                    <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>Sprint:</span>
                                    <select
                                      value={itemWeekMap[item.id] !== undefined ? itemWeekMap[item.id] : phase.weekNum}
                                      onChange={(e) => handleMoveItemToWeek(item.id, e.target.value)}
                                      style={{
                                        border: 'none',
                                        background: 'transparent',
                                        fontSize: '11.5px',
                                        fontWeight: 700,
                                        color: '#0E0A1A',
                                        cursor: 'pointer',
                                        outline: 'none'
                                      }}
                                    >
                                      <option value={0}>Pre-Kickoff (Day-1)</option>
                                      {Array.from({ length: totalWeeks }, (_, i) => i + 1).map(w => (
                                        <option key={w} value={w}>
                                          Week {w} ({computeWeekDateRange(kickoffDate, w)})
                                        </option>
                                      ))}
                                    </select>
                                  </div>

                                  {/* Non-Technical Guide Trigger Button */}
                                  {credGuide && credGuide.isCredential && (
                                    <button
                                      type="button"
                                      onClick={() => toggleCredItem(item)}
                                      style={{
                                        background: '#FFF7F0',
                                        color: '#ED7D31',
                                        border: '1px solid #FCD9C2',
                                        borderRadius: '8px',
                                        padding: '5px 10px',
                                        fontSize: '11.5px',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                      }}
                                    >
                                      <Key size={12} color="#ED7D31" />
                                      <span>{activeCredItem?.id === item.id ? 'Hide Guide' : 'How to Get Credential ↗'}</span>
                                    </button>
                                  )}

                                  {/* Provide Handover CTA */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (onProvideHandover) onProvideHandover(item);
                                    }}
                                    style={{
                                      background: isVerified ? '#ffffff' : 'linear-gradient(135deg, #ED7D31 0%, #D1611B 100%)',
                                      color: isVerified ? '#10B981' : '#ffffff',
                                      border: isVerified ? '1px solid #10B981' : 'none',
                                      borderRadius: '8px',
                                      padding: '6px 12px',
                                      fontSize: '12px',
                                      fontWeight: 700,
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      boxShadow: isVerified ? 'none' : '0 2px 6px rgba(237, 125, 49, 0.25)'
                                    }}
                                  >
                                    {isVerified && <Check size={12} />}
                                    <span>{isVerified ? 'Cleared' : isSubmitted ? 'Review Handover' : 'Provide Handover'}</span>
                                  </button>
                                </div>
                              </div>

                              {/* EMBEDDED NON-TECHNICAL CREDENTIAL RETRIEVAL GUIDE (EXPANDS ON CLICK) */}
                              {activeCredItem?.id === item.id && credGuide && credGuide.isCredential && (
                                <div style={{
                                  background: '#FFFDFB',
                                  border: '1.5px solid #FCD9C2',
                                  borderRadius: '10px',
                                  padding: '1rem',
                                  marginTop: '6px',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '8px'
                                }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                      <span style={{ background: '#ED7D31', color: '#ffffff', fontSize: '10.5px', fontWeight: 800, padding: '1px 7px', borderRadius: '100px' }}>
                                        Step-by-Step Instructions
                                      </span>
                                      {credGuide.isDynamicScraped && (
                                        <span style={{ background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', fontSize: '10.5px', fontWeight: 800, padding: '1px 7px', borderRadius: '100px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                          <ExternalLink size={10} />
                                          <span>Live Scraped Docs</span>
                                        </span>
                                      )}
                                      <strong style={{ fontSize: '12.5px', color: '#0E0A1A' }}>
                                        {credGuide.serviceName}
                                      </strong>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <button
                                        type="button"
                                        onClick={() => handleReScrapeItem(item)}
                                        disabled={isScraping}
                                        style={{
                                          background: '#ffffff',
                                          border: '1px solid #CBD5E1',
                                          borderRadius: '6px',
                                          padding: '3px 8px',
                                          fontSize: '11px',
                                          fontWeight: 600,
                                          color: '#475569',
                                          cursor: isScraping ? 'wait' : 'pointer',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '4px'
                                        }}
                                        title="Re-scrape latest developer documentation live"
                                      >
                                        <RefreshCw size={11} className={isScraping ? 'spin' : ''} />
                                        <span>{isScraping ? 'Scraping...' : 'Re-Scrape Docs'}</span>
                                      </button>

                                      {credGuide.sourceDocUrl && (
                                        <a
                                          href={credGuide.sourceDocUrl}
                                          target="_blank"
                                          rel="noreferrer"
                                          style={{ fontSize: '11.5px', color: '#2563EB', textDecoration: 'underline', fontWeight: 600, marginRight: '4px' }}
                                        >
                                          Official Docs ↗
                                        </a>
                                      )}

                                      {credGuide.consoleUrl && (
                                        <a
                                          href={credGuide.consoleUrl}
                                          target="_blank"
                                          rel="noreferrer"
                                          style={{
                                            background: '#0E0A1A',
                                            color: '#ffffff',
                                            padding: '3px 10px',
                                            borderRadius: '6px',
                                            fontSize: '11.5px',
                                            fontWeight: 700,
                                            textDecoration: 'none',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px'
                                          }}
                                        >
                                          <span>Open {credGuide.consoleName || 'Console'}</span>
                                          <ArrowUpRight size={12} color="#ED7D31" />
                                        </a>
                                      )}
                                    </div>
                                  </div>

                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                                    {credGuide.quickSteps.map(step => (
                                      <div key={step.num} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px' }}>
                                        <div style={{
                                          width: '18px',
                                          height: '18px',
                                          borderRadius: '50%',
                                          background: '#ED7D31',
                                          color: '#ffffff',
                                          fontSize: '10.5px',
                                          fontWeight: 800,
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          flexShrink: 0,
                                          marginTop: '1px'
                                        }}>
                                          {step.num}
                                        </div>
                                        <div style={{ lineHeight: 1.4 }}>
                                          <strong style={{ color: '#0E0A1A' }}>{step.action}: </strong>
                                          <span style={{ color: '#4B5563' }}>{step.detail}</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>

                                  {/* IT Delegation Copy Helper inside weekly card */}
                                  {credGuide.delegationMessage && (
                                    <div style={{ borderTop: '1px dashed #FCD9C2', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <span style={{ fontSize: '11.5px', color: '#6B7280' }}>
                                        Need IT assistance? <strong>Ask {credGuide.delegationRole || 'IT Admin'}</strong>
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => handleCopyDelegation(credGuide.delegationMessage, item.id)}
                                        style={{
                                          background: '#ffffff',
                                          border: '1px solid #CBD5E1',
                                          borderRadius: '6px',
                                          padding: '3px 8px',
                                          fontSize: '11px',
                                          fontWeight: 700,
                                          cursor: 'pointer',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '4px'
                                        }}
                                      >
                                        {copiedDelegationId === item.id ? <Check size={11} color="#10B981" /> : <Copy size={11} />}
                                        <span>{copiedDelegationId === item.id ? 'Copied Request!' : 'Copy IT Request'}</span>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}

      {/* VIEW 2: FULL DYNAMIC N-WEEK EXCEL MASTER MATRIX TABLE */}
      {viewMode === 'TABLE' && (
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #EBEAEF',
          boxShadow: '0 2px 14px rgba(14, 10, 26, 0.03)',
          overflow: 'hidden'
        }}>
          {/* Table Header */}
          <div style={{
            background: '#FFF7F0',
            borderBottom: '2px solid #ED7D31',
            padding: '12px 1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={16} color="#ED7D31" />
              <strong style={{ fontSize: '14px', color: '#0E0A1A' }}>
                Dynamic {totalWeeks}-Week Prerequisites Master Matrix Table
              </strong>
            </div>
            <span style={{ fontSize: '12px', color: '#ED7D31', fontWeight: 700 }}>
              {totalCompleted} of {totalItems} Verified ({overallProgress}%)
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#0E0A1A', color: '#ffffff' }}>
                  <th style={{ padding: '10px 14px', width: '14%', fontWeight: 700 }}>SPRINT / WEEK</th>
                  <th style={{ padding: '10px 14px', width: '14%', fontWeight: 700 }}>CATEGORY</th>
                  <th style={{ padding: '10px 14px', width: '22%', fontWeight: 700 }}>DELIVERABLE TITLE</th>
                  <th style={{ padding: '10px 14px', width: '26%', fontWeight: 700 }}>DESCRIPTION</th>
                  <th style={{ padding: '10px 14px', width: '12%', fontWeight: 700 }}>CALENDAR DATES</th>
                  <th style={{ padding: '10px 14px', width: '12%', fontWeight: 700 }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {groupedPhases.map((phase) =>
                  phase.items.map((item, idx) => {
                    const isVerified = item.status === 'Verified';
                    return (
                      <tr
                        key={item.id || `${phase.id}-${idx}`}
                        style={{
                          borderBottom: '1px solid #EBEAEF',
                          background: isVerified ? '#F9FDFB' : idx % 2 === 0 ? '#ffffff' : '#FAFAFC',
                          transition: 'background 0.15s ease'
                        }}
                      >
                        {/* Sprint / Week Selector inside Table */}
                        <td style={{ padding: '10px 14px', fontWeight: 700 }}>
                          <select
                            value={itemWeekMap[item.id] !== undefined ? itemWeekMap[item.id] : phase.weekNum}
                            onChange={(e) => handleMoveItemToWeek(item.id, e.target.value)}
                            style={{
                              background: phase.badgeBg,
                              color: phase.badgeColor,
                              border: `1px solid ${phase.badgeBorder}`,
                              padding: '2px 8px',
                              borderRadius: '100px',
                              fontSize: '11px',
                              fontWeight: 800,
                              cursor: 'pointer',
                              outline: 'none'
                            }}
                          >
                            <option value={0}>Pre-Kickoff</option>
                            {Array.from({ length: totalWeeks }, (_, i) => i + 1).map(w => (
                              <option key={w} value={w}>Week {w}</option>
                            ))}
                          </select>
                        </td>

                        {/* Category */}
                        <td style={{ padding: '10px 14px', fontWeight: 700, color: '#374151' }}>
                          <span style={{
                            background: '#F3F4F6',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '11.5px',
                            color: '#1F2937'
                          }}>
                            {item.category || 'General'}
                          </span>
                        </td>

                        {/* Title & Blocker Indicator */}
                        <td style={{ padding: '10px 14px', fontWeight: 700, color: isVerified ? '#64748B' : '#0E0A1A' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <span>{item.name}</span>
                            {item.is_critical && (
                              <span style={{ fontSize: '10px', background: '#FEF2F2', color: '#DC2626', padding: '1px 6px', borderRadius: '100px', border: '1px solid #FEE2E2' }}>
                                Day-1
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Description */}
                        <td style={{ padding: '10px 14px', color: '#4B5563', lineHeight: 1.45 }}>
                          {item.description}
                        </td>

                        {/* Schedule Dates */}
                        <td style={{ padding: '10px 14px', fontSize: '11.5px', color: '#6B7280', whiteSpace: 'nowrap' }}>
                          {phase.dateRange}
                        </td>

                        {/* Status */}
                        <td style={{ padding: '10px 14px' }}>
                          <span
                            onClick={(e) => {
                              if (onToggleCheck) onToggleCheck(e, item);
                            }}
                            style={{
                              background: isVerified ? '#DCFCE7' : item.status === 'Submitted' ? '#FFF7F0' : '#F3F4F6',
                              color: isVerified ? '#16A34A' : item.status === 'Submitted' ? '#ED7D31' : '#4B5563',
                              border: isVerified ? '1px solid #BBF7D0' : item.status === 'Submitted' ? '1px solid #FCD9C2' : '1px solid #E5E7EB',
                              padding: '3px 10px',
                              borderRadius: '100px',
                              fontSize: '11px',
                              fontWeight: 800,
                              whiteSpace: 'nowrap',
                              cursor: 'pointer',
                              display: 'inline-block'
                            }}
                            title="Click to toggle status"
                          >
                            {item.status || 'Pending'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: ADD CUSTOM DELIVERABLE TASK TO SPRINT */}
      {showAddTaskModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(14, 10, 26, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '18px',
            width: '100%',
            maxWidth: '520px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            overflow: 'hidden',
            border: '1px solid #EBEAEF'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '1.25rem 1.5rem',
              background: '#0E0A1A',
              color: '#ffffff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0 }}>
                  Add Task to {targetModalWeek === 0 ? 'Pre-Kickoff' : `Week ${targetModalWeek}`}
                </h3>
                <p style={{ fontSize: '12px', color: '#9CA3AF', margin: '2px 0 0 0' }}>
                  Plan a custom prerequisite deliverable for this sprint
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddTaskModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#9CA3AF', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '4px' }}>
                  Deliverable Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. AWS VPC Peering Connection / SSL Certificates"
                  value={newTaskData.name}
                  onChange={(e) => setNewTaskData(prev => ({ ...prev, name: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  autoFocus
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '4px' }}>
                  Description / Handover Requirements
                </label>
                <textarea
                  rows={3}
                  placeholder="Specific credentials, CIDR blocks, URLs, or IAM roles needed from client..."
                  value={newTaskData.description}
                  onChange={(e) => setNewTaskData(prev => ({ ...prev, description: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '4px' }}>
                    Category
                  </label>
                  <select
                    value={newTaskData.category}
                    onChange={(e) => setNewTaskData(prev => ({ ...prev, category: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '12.5px',
                      background: '#ffffff',
                      outline: 'none'
                    }}
                  >
                    <option value="Cloud Infrastructure">Cloud Infrastructure</option>
                    <option value="API & Messaging">API & Messaging</option>
                    <option value="Data & Storage">Data & Storage</option>
                    <option value="Security & Compliance">Security & Compliance</option>
                    <option value="Business & Governance">Business & Governance</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '4px' }}>
                    Responsible Owner
                  </label>
                  <select
                    value={newTaskData.owner}
                    onChange={(e) => setNewTaskData(prev => ({ ...prev, owner: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '12.5px',
                      background: '#ffffff',
                      outline: 'none'
                    }}
                  >
                    <option value="DevOps Lead">DevOps Lead</option>
                    <option value="Cloud Architect">Cloud Architect</option>
                    <option value="SecOps / IT Admin">SecOps / IT Admin</option>
                    <option value="AI / ML Engineer">AI / ML Engineer</option>
                    <option value="Business Stakeholder">Business Stakeholder</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <input
                  type="checkbox"
                  id="criticalCheckbox"
                  checked={newTaskData.is_critical}
                  onChange={(e) => setNewTaskData(prev => ({ ...prev, is_critical: e.target.checked }))}
                  style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#DC2626' }}
                />
                <label htmlFor="criticalCheckbox" style={{ fontSize: '12.5px', fontWeight: 700, color: '#DC2626', cursor: 'pointer' }}>
                  Mark as Day-1 Critical Blocker (Required for kickoff)
                </label>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '1rem 1.5rem',
              background: '#FAFAFC',
              borderTop: '1px solid #EBEAEF',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px'
            }}>
              <button
                type="button"
                onClick={() => setShowAddTaskModal(false)}
                style={{
                  background: '#ffffff',
                  border: '1px solid #CBD5E1',
                  borderRadius: '8px',
                  padding: '7px 14px',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  color: '#475569'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveNewTask}
                disabled={!newTaskData.name.trim()}
                style={{
                  background: newTaskData.name.trim() ? '#ED7D31' : '#CBD5E1',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '7px 18px',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  cursor: newTaskData.name.trim() ? 'pointer' : 'not-allowed',
                  boxShadow: newTaskData.name.trim() ? '0 2px 8px rgba(237, 125, 49, 0.25)' : 'none'
                }}
              >
                Save Deliverable
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
