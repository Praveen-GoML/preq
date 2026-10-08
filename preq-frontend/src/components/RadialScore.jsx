import React from 'react';

export const RadialScore = ({ score = 0, size = 160, strokeWidth = 12, label = "Readiness" }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  let color = '#ef4444';
  let glowColor = 'rgba(239, 68, 68, 0.3)';
  let gradientId = 'score-red';

  if (score >= 90) {
    color = '#10b981';
    glowColor = 'rgba(16, 185, 129, 0.4)';
    gradientId = 'score-green';
  } else if (score >= 60) {
    color = '#f59e0b';
    glowColor = 'rgba(245, 158, 11, 0.35)';
    gradientId = 'score-amber';
  }

  return (
    <div style={{
      position: 'relative',
      width: size,
      height: size,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto'
    }}>
      {/* Background glow */}
      <div style={{
        position: 'absolute',
        width: size * 0.75,
        height: size * 0.75,
        borderRadius: '50%',
        background: glowColor,
        filter: 'blur(24px)',
        zIndex: 0
      }} />

      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', zIndex: 1 }}>
        <defs>
          <linearGradient id="score-green" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <linearGradient id="score-amber" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
          <linearGradient id="score-red" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f87171" />
            <stop offset="100%" stopColor="#dc2626" />
          </linearGradient>
        </defs>

        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Progress Arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{
            transition: 'stroke-dashoffset 1s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        />
      </svg>

      {/* Center Label */}
      <div style={{
        position: 'absolute',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2
      }}>
        <span style={{
          fontSize: size > 120 ? '2.5rem' : '1.75rem',
          fontWeight: '800',
          letterSpacing: '-0.03em',
          color: 'white',
          lineHeight: 1
        }}>
          {score}%
        </span>
        <span style={{
          fontSize: size > 120 ? '0.75rem' : '0.65rem',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: '#94a3b8',
          fontWeight: '600',
          marginTop: '0.25rem'
        }}>
          {label}
        </span>
      </div>
    </div>
  );
};
