import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Award, Printer, Share2, Check, ArrowLeft, Loader2 
} from 'lucide-react';

import { API_URL } from '../apiConfig';

export const CertificateView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cert, setCert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchCertificate = async () => {
      try {
        const res = await axios.get(`${API_URL}/projects/${id}/certificate`);
        setCert(res.data);
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.detail || 'Project has not yet achieved kick-off clearance for certification.');
      } finally {
        setLoading(false);
      }
    };
    fetchCertificate();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '6rem 0' }}>
        <Loader2 className="animate-spin" size={40} color="#ED7D31" style={{ margin: '0 auto 1rem' }} />
        <p style={{ color: '#64748b' }}>Generating Kick-Off Readiness Certificate...</p>
      </div>
    );
  }

  if (error || !cert) {
    return (
      <div className="goml-container" style={{ padding: '4rem 0', textAlign: 'center' }}>
        <Award size={48} color="#ED7D31" style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
        <h2>Certificate Unavailable</h2>
        <p style={{ color: '#64748b', margin: '1rem 0' }}>{error}</p>
        <button onClick={() => navigate(`/dashboard/${id}`)} className="btn-goml btn-goml-black">
          Back to Initiative Workspace
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Top Toolbar (Hidden during print) */}
      <div className="no-print" style={{ background: '#f8fafc', borderBottom: '1px solid #e5e5e5', padding: '1rem 0' }}>
        <div className="goml-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={() => navigate(`/dashboard/${id}`)} className="btn-goml btn-goml-outline btn-goml-sm">
            <ArrowLeft size={14} /> Back to Initiative Workspace
          </button>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={handleCopy} className="btn-goml btn-goml-outline btn-goml-sm">
              {copied ? <Check size={14} color="#16a34a" /> : <Share2 size={14} />}
              <span>{copied ? 'Link Copied!' : 'Share Verification Link'}</span>
            </button>
            <button onClick={handlePrint} className="btn-goml btn-goml-black btn-goml-sm">
              <Printer size={14} />
              <span>Print / Export PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Official GoML Certificate Canvas */}
      <section style={{ padding: '4rem 0', background: '#fafbfc' }}>
        <div className="goml-container" style={{ maxWidth: '1000px' }}>
          <div
            className="cert-container"
            style={{
              background: '#ffffff',
              border: '3px solid #ED7D31',
              borderRadius: '20px',
              padding: '4rem 3.5rem',
              boxShadow: '0 20px 50px -10px rgba(0, 0, 0, 0.1)',
              position: 'relative'
            }}
          >
            {/* Header Stamp */}
            <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: '#fff3eb',
                border: '2px solid #ED7D31',
                marginBottom: '1rem'
              }}>
                <Award size={38} color="#ED7D31" />
              </div>

              <div style={{ textTransform: 'uppercase', letterSpacing: '0.15em', fontSize: '0.8rem', color: '#ED7D31', fontWeight: 800, marginBottom: '0.4rem' }}>
                GoML Autonomous PreQ Governance Engine
              </div>

              <h1 style={{ fontSize: '2.75rem', fontWeight: 800, margin: '0 0 0.5rem', color: '#111827' }}>
                Certificate of Kick-Off Readiness
              </h1>

              <p style={{ color: '#64748b', fontSize: '0.95rem', margin: 0 }}>
                Enterprise Delivery Assurance & Day-1 Zero Blocker Verification
              </p>
            </div>

            {/* Narrative Body */}
            <div style={{ textAlign: 'center', maxWidth: '750px', margin: '0 auto 2.5rem' }}>
              <p style={{ color: '#475569', fontSize: '1.1rem', lineHeight: 1.6 }}>
                This officially validates that the enterprise deployment initiative
              </p>

              <div style={{
                fontSize: '1.85rem',
                fontWeight: 800,
                color: '#111827',
                margin: '0.65rem 0',
                borderBottom: '2px solid #ED7D31',
                paddingBottom: '0.5rem',
                display: 'inline-block'
              }}>
                {cert.project_name}
              </div>

              <p style={{ color: '#475569', fontSize: '1.05rem', margin: '0.65rem 0 1.5rem', lineHeight: 1.6 }}>
                for <strong style={{ color: '#111827' }}>{cert.client_name}</strong> in the <strong style={{ color: '#111827' }}>{cert.industry}</strong> sector targeted for <strong style={{ color: '#ED7D31' }}>{cert.deployment}</strong> has satisfied all mandatory architectural, compliance, data and stakeholder pre-requisites with zero critical blockers remaining.
              </p>
            </div>

            {/* 3 Metric Summary Boxes */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '1.25rem',
              maxWidth: '750px',
              margin: '0 auto 3rem',
              textAlign: 'center'
            }}>
              <div style={{ background: '#f8fafc', border: '1px solid #e5e5e5', borderRadius: '12px', padding: '1.25rem' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Readiness Score</div>
                <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#16a34a', marginTop: '0.2rem' }}>{cert.score}%</div>
              </div>

              <div style={{ background: '#f8fafc', border: '1px solid #e5e5e5', borderRadius: '12px', padding: '1.25rem' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Verified Milestones</div>
                <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#111827', marginTop: '0.2rem' }}>{cert.verified_count} / {cert.total_count}</div>
              </div>

              <div style={{ background: '#f8fafc', border: '1px solid #e5e5e5', borderRadius: '12px', padding: '1.25rem' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Critical Blockers</div>
                <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#16a34a', marginTop: '0.2rem' }}>0 Open</div>
              </div>
            </div>

            {/* Signatures Roster */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '1.5rem',
              borderTop: '1px solid #e5e5e5',
              paddingTop: '2rem',
              marginBottom: '2rem',
              textAlign: 'center'
            }}>
              {cert.signatories?.map((sig, i) => (
                <div key={i}>
                  <div style={{ height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontFamily: 'monospace', color: '#16a34a', fontSize: '0.8rem', fontWeight: 600 }}>
                      ✓ {sig.status}
                    </span>
                  </div>
                  <div style={{ height: '1px', background: '#d1d5db', margin: '0.4rem 0' }} />
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#111827' }}>{sig.name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem' }}>{sig.role}</div>
                </div>
              ))}
            </div>

            {/* Verification Hash & Certificate ID Footer */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.75rem',
              color: '#64748b',
              borderTop: '1px solid #f1f5f9',
              paddingTop: '1rem',
              flexWrap: 'wrap',
              gap: '0.5rem'
            }}>
              <div>
                <strong>Certificate Number:</strong> {cert.cert_number}
              </div>
              <div style={{ fontFamily: 'monospace' }}>
                <strong>SHA-256 Hash:</strong> {cert.verification_hash}
              </div>
              <div>
                <strong>Issued:</strong> {new Date(cert.issued_at).toUTCString()}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
