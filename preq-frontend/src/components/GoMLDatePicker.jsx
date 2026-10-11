import React, { useState, useEffect, useRef } from 'react';
import { Calendar, ChevronLeft, ChevronRight, X, ChevronDown } from 'lucide-react';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export const GoMLDatePicker = ({ value, onChange, placeholder = 'Select kick-off date' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isYearPicker, setIsYearPicker] = useState(false);
  const containerRef = useRef(null);

  const parseDate = (str) => {
    if (!str) return null;
    const parts = str.split('-').map(Number);
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      return new Date(parts[0], parts[1] - 1, parts[2]);
    }
    return null;
  };

  const selectedDate = parseDate(value);
  const today = new Date();

  // Temporary date state while browsing in calendar
  const [tempDate, setTempDate] = useState(selectedDate);
  const [viewYear, setViewYear] = useState(selectedDate ? selectedDate.getFullYear() : today.getFullYear());
  const [viewMonth, setViewMonth] = useState(selectedDate ? selectedDate.getMonth() : today.getMonth());

  useEffect(() => {
    const parsed = parseDate(value);
    setTempDate(parsed);
    if (parsed) {
      setViewYear(parsed.getFullYear());
      setViewMonth(parsed.getMonth());
    }
  }, [value]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setIsYearPicker(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setIsYearPicker(false);
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handlePrevMonth = (e) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = (e) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const formatISODate = (y, m, d) => {
    const mm = String(m + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    return `${y}-${mm}-${dd}`;
  };

  const handleSelectDay = (y, m, d) => {
    const picked = new Date(y, m, d);
    setTempDate(picked);
    const iso = formatISODate(y, m, d);
    onChange(iso);
    setIsOpen(false);
  };

  const handleSelectYear = (year) => {
    setViewYear(year);
    setIsYearPicker(false);
  };

  const handleToday = () => {
    const now = new Date();
    setTempDate(now);
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    onChange(formatISODate(now.getFullYear(), now.getMonth(), now.getDate()));
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e?.stopPropagation();
    setTempDate(null);
    onChange('');
  };

  // Generate 42 calendar grid cells
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const cells = [];
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const prevMonthIdx = viewMonth === 0 ? 11 : viewMonth - 1;
    const prevYear = viewMonth === 0 ? viewYear - 1 : viewYear;
    cells.push({
      day: daysInPrevMonth - i,
      month: prevMonthIdx,
      year: prevYear,
      isCurrentMonth: false
    });
  }
  for (let i = 1; i <= daysInCurrentMonth; i++) {
    cells.push({
      day: i,
      month: viewMonth,
      year: viewYear,
      isCurrentMonth: true
    });
  }
  const remaining = 42 - cells.length;
  for (let i = 1; i <= remaining; i++) {
    const nextMonthIdx = viewMonth === 11 ? 0 : viewMonth + 1;
    const nextYear = viewMonth === 11 ? viewYear + 1 : viewYear;
    cells.push({
      day: i,
      month: nextMonthIdx,
      year: nextYear,
      isCurrentMonth: false
    });
  }

  // Format trigger display string
  const formatTriggerDisplay = () => {
    if (!selectedDate) return placeholder;
    return selectedDate.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Format Material 3 Header display string (e.g. "Fri, Oct 16")
  const formatM3Header = () => {
    const active = tempDate || selectedDate || today;
    return active.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const isToday = (y, m, d) => {
    return (
      today.getFullYear() === y &&
      today.getMonth() === m &&
      today.getDate() === d
    );
  };

  const isSelected = (y, m, d) => {
    const target = tempDate || selectedDate;
    if (!target) return false;
    return (
      target.getFullYear() === y &&
      target.getMonth() === m &&
      target.getDate() === d
    );
  };

  // Range of years for Material Year Selector
  const years = [];
  const currentYear = today.getFullYear();
  for (let y = currentYear - 2; y <= currentYear + 8; y++) {
    years.push(y);
  }

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {/* Trigger Input Box */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          height: '58px',
          background: '#FFFFFF',
          border: isOpen ? '2px solid #ED7D31' : '2px solid #CBD5E1',
          borderRadius: '16px',
          padding: '0 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          boxSizing: 'border-box',
          boxShadow: isOpen ? '0 0 0 3px rgba(237, 125, 49, 0.18)' : 'none',
          transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
          userSelect: 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '9px',
            background: isOpen || value ? '#FFF7ED' : '#F8FAFC',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isOpen || value ? '#ED7D31' : '#64748B',
            transition: 'all 0.18s ease'
          }}>
            <Calendar size={19} />
          </div>
          <span style={{
            fontSize: '16.5px',
            fontWeight: value ? 700 : 500,
            color: value ? '#0F172A' : '#94A3B8',
            letterSpacing: value ? '-0.01em' : 'normal',
            fontFamily: 'inherit'
          }}>
            {formatTriggerDisplay()}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {value && (
            <button
              type="button"
              onClick={handleClear}
              title="Clear date"
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                background: '#F1F5F9',
                border: 'none',
                color: '#64748B',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = '#FEE2E2';
                e.currentTarget.style.color = '#DC2626';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = '#F1F5F9';
                e.currentTarget.style.color = '#64748B';
              }}
            >
              <X size={14} />
            </button>
          )}
          <span style={{
            color: isOpen ? '#ED7D31' : '#94A3B8',
            fontSize: '11px',
            fontWeight: 800,
            padding: '2px 6px',
            borderRadius: '6px',
            background: isOpen ? '#FFF7ED' : 'transparent'
          }}>
            {isOpen ? '▲' : '▼'}
          </span>
        </div>
      </div>

      {/* Material 3 Styled Popover Calendar Dialog */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 10px)',
          right: 0,
          width: '360px',
          background: '#FFFFFF',
          borderRadius: '28px',
          border: '1.5px solid #FFEDD5',
          boxShadow: '0 24px 50px -10px rgba(15, 23, 42, 0.28), 0 0 0 1px rgba(237, 125, 49, 0.12)',
          overflow: 'hidden',
          zIndex: 1000,
          boxSizing: 'border-box',
          animation: 'gomlFadeIn 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
          userSelect: 'none'
        }}>
          {/* Material 3 Header Card */}
          <div style={{
            background: '#FFF7ED',
            padding: '20px 24px 16px 24px',
            borderBottom: '1.5px solid #FED7AA'
          }}>
            <div style={{
              fontSize: '11px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: '#ED7D31',
              marginBottom: '4px'
            }}>
              Select Date
            </div>
            <div style={{
              fontSize: '28px',
              fontWeight: 800,
              color: '#0F172A',
              letterSpacing: '-0.03em',
              lineHeight: 1.15
            }}>
              {formatM3Header()}
            </div>
          </div>

          <div style={{ padding: '16px 20px 18px 20px' }}>
            {/* Navigation / Month-Year Switcher Bar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px'
            }}>
              <button
                type="button"
                onClick={() => setIsYearPicker(!isYearPicker)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: isYearPicker ? '#FFF7ED' : 'transparent',
                  border: isYearPicker ? '1px solid #FED7AA' : '1px solid transparent',
                  borderRadius: '9999px',
                  padding: '5px 12px',
                  color: '#0F172A',
                  fontSize: '15.5px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.color = '#ED7D31';
                  e.currentTarget.style.background = '#FFF7ED';
                }}
                onMouseOut={(e) => {
                  if (!isYearPicker) {
                    e.currentTarget.style.color = '#0F172A';
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <span>{MONTH_NAMES[viewMonth]} {viewYear}</span>
                <ChevronDown size={16} strokeWidth={2.5} style={{ transform: isYearPicker ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>

              {!isYearPicker && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    title="Previous month"
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '50%',
                      background: 'transparent',
                      border: 'none',
                      color: '#475569',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = '#FFF7ED';
                      e.currentTarget.style.color = '#ED7D31';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#475569';
                    }}
                  >
                    <ChevronLeft size={20} />
                  </button>

                  <button
                    type="button"
                    onClick={handleNextMonth}
                    title="Next month"
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '50%',
                      background: 'transparent',
                      border: 'none',
                      color: '#475569',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = '#FFF7ED';
                      e.currentTarget.style.color = '#ED7D31';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#475569';
                    }}
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              )}
            </div>

            {/* Year Selector Grid Mode */}
            {isYearPicker ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '10px',
                maxHeight: '230px',
                overflowY: 'auto',
                padding: '8px 4px',
                marginBottom: '12px'
              }}>
                {years.map((y) => {
                  const isCurrentYear = y === viewYear;
                  return (
                    <button
                      key={y}
                      type="button"
                      onClick={() => handleSelectYear(y)}
                      style={{
                        padding: '12px 0',
                        borderRadius: '9999px',
                        border: isCurrentYear ? '2px solid #ED7D31' : '1px solid #E2E8F0',
                        background: isCurrentYear ? '#ED7D31' : '#FFFFFF',
                        color: isCurrentYear ? '#FFFFFF' : '#1E293B',
                        fontSize: '15px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseOver={(e) => {
                        if (!isCurrentYear) {
                          e.currentTarget.style.background = '#FFF7ED';
                          e.currentTarget.style.color = '#ED7D31';
                        }
                      }}
                      onMouseOut={(e) => {
                        if (!isCurrentYear) {
                          e.currentTarget.style.background = '#FFFFFF';
                          e.currentTarget.style.color = '#1E293B';
                        }
                      }}
                    >
                      {y}
                    </button>
                  );
                })}
              </div>
            ) : (
              <>
                {/* Day of Week Headers */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  textAlign: 'center',
                  marginBottom: '6px'
                }}>
                  {DAY_LABELS.map((label, idx) => (
                    <span
                      key={`${label}-${idx}`}
                      style={{
                        fontSize: '12.5px',
                        fontWeight: 800,
                        color: idx === 0 || idx === 6 ? '#ED7D31' : '#94A3B8',
                        padding: '4px 0'
                      }}
                    >
                      {label}
                    </span>
                  ))}
                </div>

                {/* Days Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  gap: '4px',
                  marginBottom: '12px'
                }}>
                  {cells.map((cell, idx) => {
                    const selected = isSelected(cell.year, cell.month, cell.day);
                    const currentDay = isToday(cell.year, cell.month, cell.day);

                    return (
                      <button
                        key={`${cell.year}-${cell.month}-${cell.day}-${idx}`}
                        type="button"
                        onClick={() => handleSelectDay(cell.year, cell.month, cell.day)}
                        style={{
                          width: '38px',
                          height: '38px',
                          margin: '0 auto',
                          borderRadius: '50%',
                          border: currentDay && !selected ? '2px solid #ED7D31' : 'none',
                          background: selected
                            ? '#ED7D31'
                            : (currentDay ? '#FFF7ED' : 'transparent'),
                          color: selected
                            ? '#FFFFFF'
                            : (cell.isCurrentMonth
                                ? (currentDay ? '#ED7D31' : '#0F172A')
                                : '#CBD5E1'),
                          fontSize: '14px',
                          fontWeight: selected ? 800 : (cell.isCurrentMonth ? 700 : 500),
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s ease',
                          boxShadow: selected ? '0 4px 12px rgba(237, 125, 49, 0.45)' : 'none',
                          fontFamily: 'inherit'
                        }}
                        onMouseOver={(e) => {
                          if (!selected) {
                            e.currentTarget.style.background = '#FFF7ED';
                            e.currentTarget.style.color = '#ED7D31';
                            e.currentTarget.style.transform = 'scale(1.1)';
                          }
                        }}
                        onMouseOut={(e) => {
                          if (!selected) {
                            e.currentTarget.style.background = currentDay ? '#FFF7ED' : 'transparent';
                            e.currentTarget.style.color = cell.isCurrentMonth
                              ? (currentDay ? '#ED7D31' : '#0F172A')
                              : '#CBD5E1';
                            e.currentTarget.style.transform = 'scale(1)';
                          }
                        }}
                      >
                        {cell.day}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* Material 3 Actions Footer */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '12px',
              borderTop: '1px solid #F1F5F9'
            }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={handleToday}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#ED7D31',
                    fontSize: '13.5px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    padding: '6px 10px',
                    borderRadius: '8px',
                    transition: 'background 0.15s ease'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = '#FFF7ED'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  Today
                </button>

                <button
                  type="button"
                  onClick={handleClear}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#64748B',
                    fontSize: '13.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    padding: '6px 10px',
                    borderRadius: '8px',
                    transition: 'background 0.15s ease'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = '#F1F5F9'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  Clear
                </button>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#64748B',
                    fontSize: '13.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    transition: 'background 0.15s ease'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = '#F1F5F9'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  style={{
                    background: '#ED7D31',
                    border: 'none',
                    color: '#FFFFFF',
                    fontSize: '13.5px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    padding: '6px 16px',
                    borderRadius: '9999px',
                    boxShadow: '0 2px 8px rgba(237, 125, 49, 0.35)',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = '#E06D22'}
                  onMouseOut={(e) => e.currentTarget.style.background = '#ED7D31'}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
