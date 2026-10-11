import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldCheck, Lock, AlertTriangle, 
  Loader2, Sparkles, ChevronDown, ChevronUp
} from 'lucide-react';

// Official Microsoft 4-Tile Vector Logo
const MicrosoftLogo = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="1" width="9" height="9" fill="#F25022" />
    <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
    <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
    <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
  </svg>
);

// Official GoML Wordmark Logo
const GoMLWordmark = ({ width = 110, height = 32 }) => (
  <svg width={width} height={height} viewBox="0 0 117 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M57.4577 20.6304V20.5321H54.6025V20.6216C54.6025 23.0446 52.6117 24.6665 50.049 24.6665C47.4863 24.6665 45.7618 23.0534 45.7618 20.6304C45.7618 18.179 47.4601 16.568 50.049 16.568H50.6362V13.7238H49.99C45.7269 13.7238 42.6403 16.6182 42.6403 20.6304C42.6403 24.8062 45.537 27.4802 50.1035 27.4802C52.6662 27.4802 54.2248 28.5367 54.2248 30.2656C54.2248 32.0184 52.5549 33.1906 50.049 33.1906C47.4317 33.1906 45.7902 31.8525 45.8447 29.8203H42.78C42.6119 33.5224 45.5086 36 50.049 36C54.4758 36 57.3725 33.7734 57.3725 30.2939C57.3725 28.2617 56.1479 26.7293 53.9498 25.9195C56.2331 24.9175 57.4577 23.0817 57.4577 20.6304ZM54.6025 16.568V19.1526H54.6046V16.568H54.6025Z" fill="#111827" />
    <path d="M54.6069 19.1526V16.568H52.018V13.7238H57.4533V18.5588V19.1526H54.6069Z" fill="#ED7D31" />
    <path d="M60.2104 20.8791C60.2104 16.7579 63.0787 13.6953 67.5624 13.6953C72.0176 13.6953 74.8859 16.7579 74.8859 20.8791C74.8859 25.0004 72.0176 28.063 67.5624 28.063C63.0787 28.063 60.2104 25.0004 60.2104 20.8791ZM71.7666 20.8791C71.7666 18.4845 70.1229 16.5352 67.5624 16.5352C64.9735 16.5352 63.3298 18.4845 63.3298 20.8791C63.3298 23.2738 64.9735 25.2231 67.5624 25.2231C70.1251 25.2231 71.7666 23.2738 71.7666 20.8791Z" fill="#111827" />
    <path d="M17.9782 0C8.04827 0 0 8.04825 0 17.9781C0 27.908 8.04827 35.9563 17.9782 35.9563C27.9081 35.9563 35.9564 27.908 35.9564 17.9781C35.9564 8.04825 27.9103 0 17.9782 0ZM20.0235 29.5758H17.2142C10.838 29.5561 5.65365 24.3543 5.65365 17.976C5.65365 11.6413 10.7725 6.46567 17.0898 6.38053V10.6721C13.1366 10.755 9.94083 14.0097 9.94083 17.976C9.94083 21.9466 13.1366 25.1991 17.0898 25.282L18.2489 25.2842L18.286 25.2471L23.2149 20.316L23.4288 20.1064H14.4135V15.8149H23.4288L23.2171 15.6032L18.8382 11.2243L21.8724 8.19014L31.6386 17.9585L20.0235 29.5758Z" fill="#ED7D31" />
    <path d="M98.4652 8.1377V27.7028H95.2237V13.6713L88.4327 22.2805H87.7342L80.9695 13.6997V27.7028H77.6995V8.1377H80.6617L88.0966 17.6135L95.5314 8.1377H98.4652Z" fill="#111827" />
    <path d="M102.562 8.1377H105.832V24.6555H116.147V27.7028H102.562V8.1377Z" fill="#111827" />
  </svg>
);

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithRealMicrosoftFirebase, loginWithTeamPreset, loading, error, TEAM_PRESETS } = useAuth();

  const [showTeamOptions, setShowTeamOptions] = useState(false);
  const [emailInput, setEmailInput] = useState('praveen@goml.io');

  const from = location.state?.from?.pathname || '/';

  const handleRealMicrosoftSignIn = async () => {
    const success = await loginWithRealMicrosoftFirebase();
    if (success) {
      navigate(from, { replace: true });
    }
  };

  const handlePresetSignIn = async (emailToUse) => {
    const targetEmail = emailToUse || emailInput;
    const success = await loginWithTeamPreset(targetEmail);
    if (success) {
      navigate(from, { replace: true });
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      alignItems: 'center',
      background: '#FAFAFC',
      padding: '3rem 1.5rem',
      boxSizing: 'border-box',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Top Spacer */}
      <div />

      {/* Center Sign-In Box (Clean Minimalist — No Bulky Side Container) */}
      <div style={{
        maxWidth: '420px',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: '1.5rem'
      }}>
        {/* Official goML PreQ Brand Logo */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
          <GoMLWordmark width={110} height={32} />
          <span style={{
            background: '#ED7D31',
            color: '#ffffff',
            fontSize: '11px',
            fontWeight: 800,
            padding: '2px 8px',
            borderRadius: '6px',
            letterSpacing: '0.04em'
          }}>
            PreQ
          </span>
        </div>

        {/* Heading */}
        <div>
          <h1 style={{
            fontSize: '1.85rem',
            fontWeight: 800,
            color: '#0F172A',
            margin: '0 0 6px 0',
            letterSpacing: '-0.025em'
          }}>
            Sign in to goML PreQ
          </h1>
          <p style={{
            fontSize: '14px',
            color: '#475569',
            margin: 0,
            lineHeight: 1.5
          }}>
            Use your Microsoft work account (<strong>@goml.io</strong>).
          </p>
        </div>

        {/* Error Notice */}
        {error && (
          <div style={{
            width: '100%',
            background: '#FEF2F2',
            border: '1px solid #FEE2E2',
            borderRadius: '10px',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            fontSize: '12px',
            color: '#DC2626',
            textAlign: 'left',
            lineHeight: 1.4
          }}>
            <AlertTriangle size={15} color="#DC2626" style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{error}</span>
          </div>
        )}

        {/* Primary Action Button: Warm Peach Microsoft SSO Button */}
        <button
          type="button"
          onClick={handleRealMicrosoftSignIn}
          disabled={loading}
          style={{
            width: '100%',
            background: '#FFEAD9',
            color: '#111827',
            border: '1px solid #FCD9C2',
            borderRadius: '12px',
            padding: '13px 20px',
            fontSize: '14px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            transition: 'all 0.15s ease',
            boxShadow: '0 2px 8px rgba(237, 125, 49, 0.08)'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = '#FFE0C8';
            e.currentTarget.style.borderColor = '#FBBF97';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = '#FFEAD9';
            e.currentTarget.style.borderColor = '#FCD9C2';
          }}
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={16} color="#ED7D31" />
              <span>Connecting to Microsoft...</span>
            </>
          ) : (
            <>
              <MicrosoftLogo size={18} />
              <span>Sign in with Microsoft</span>
            </>
          )}
        </button>

        {/* Concise Ad-style Text about PreQ (Clean Text Without Big Container) */}
        <div style={{
          padding: '12px 16px',
          background: '#FFFFFF',
          borderRadius: '10px',
          border: '1px solid #F1F5F9',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '11px', fontWeight: 800, color: '#ED7D31', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '3px' }}>
            Day-1 Kick-Off Clearance Engine
          </div>
          <p style={{ fontSize: '12.5px', color: '#64748B', margin: 0, lineHeight: 1.45 }}>
            Automating mandatory technical prerequisites, cryptographic credential handovers, and compliance verification for enterprise AI delivery.
          </p>
        </div>

        {/* Secondary Fast Sign-in Toggle */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={() => setShowTeamOptions(!showTeamOptions)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#64748B',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px'
            }}
          >
            <span>{showTeamOptions ? 'Hide fast team options' : 'Instant team member sign-in'}</span>
            {showTeamOptions ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>

          {showTeamOptions && (
            <div style={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              textAlign: 'left'
            }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Select goML Profile:
              </span>

              {TEAM_PRESETS.map((preset) => (
                <div
                  key={preset.email}
                  onClick={() => handlePresetSignIn(preset.email)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    background: '#F8FAFC',
                    border: '1px solid #F1F5F9',
                    cursor: 'pointer',
                    transition: 'all 0.12s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = '#ED7D31';
                    e.currentTarget.style.background = '#FFF7F0';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = '#F1F5F9';
                    e.currentTarget.style.background = '#F8FAFC';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      background: '#ED7D31',
                      color: '#ffffff',
                      fontSize: '10px',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {preset.avatar}
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A' }}>{preset.name}</div>
                      <div style={{ fontSize: '10.5px', color: '#64748B' }}>{preset.email}</div>
                    </div>
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#ED7D31' }}>Sign in ➔</span>
                </div>
              ))}

              {/* Custom Email Input */}
              <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                <input
                  type="email"
                  placeholder="your.name@goml.io"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handlePresetSignIn(emailInput);
                  }}
                  style={{
                    flex: 1,
                    padding: '7px 10px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    fontSize: '12px',
                    outline: 'none',
                    background: '#FFFFFF',
                    color: '#0F172A'
                  }}
                />
                <button
                  type="button"
                  onClick={() => handlePresetSignIn(emailInput)}
                  style={{
                    background: '#ED7D31',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '0 12px',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Sign In
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Minimal Footer */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        color: '#64748B',
        fontSize: '12px'
      }}>
        <Lock size={12} color="#ED7D31" />
        <span>Microsoft Azure AD SSO • <strong>@goml.io</strong> corporate accounts only</span>
      </div>
    </div>
  );
};
