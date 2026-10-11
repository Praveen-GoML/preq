import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export const MaterialSelect = ({ value, onChange, options = [], placeholder = 'Select an option' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
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
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (option) => {
    onChange(option);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {/* Trigger Box */}
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
        <span style={{
          fontSize: '16.5px',
          fontWeight: value ? 700 : 500,
          color: value ? '#0F172A' : '#94A3B8',
          letterSpacing: '-0.01em',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          paddingRight: '12px',
          fontFamily: 'inherit'
        }}>
          {value || placeholder}
        </span>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: isOpen ? '#ED7D31' : '#64748B',
          transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'
        }}>
          <ChevronDown size={20} strokeWidth={2.5} />
        </div>
      </div>

      {/* Material 3 Dropdown Popover Menu */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          left: 0,
          right: 0,
          background: '#FFFFFF',
          borderRadius: '18px',
          border: '1.5px solid #FFEDD5',
          boxShadow: '0 20px 40px -10px rgba(15, 23, 42, 0.2), 0 0 0 1px rgba(237, 125, 49, 0.1)',
          padding: '8px',
          zIndex: 1000,
          maxHeight: '290px',
          overflowY: 'auto',
          boxSizing: 'border-box',
          animation: 'gomlFadeIn 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          {options.map((option) => {
            const isSelected = value === option;

            return (
              <div
                key={option}
                onClick={() => handleSelect(option)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '13px 16px',
                  borderRadius: '12px',
                  fontSize: '15.5px',
                  fontWeight: isSelected ? 800 : 600,
                  color: isSelected ? '#ED7D31' : '#1E293B',
                  background: isSelected ? '#FFF7ED' : 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  marginBottom: '2px',
                  fontFamily: 'inherit'
                }}
                onMouseOver={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = '#F8FAFC';
                    e.currentTarget.style.color = '#ED7D31';
                  }
                }}
                onMouseOut={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#1E293B';
                  }
                }}
              >
                <span>{option}</span>
                {isSelected && (
                  <Check size={18} color="#ED7D31" strokeWidth={3} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
