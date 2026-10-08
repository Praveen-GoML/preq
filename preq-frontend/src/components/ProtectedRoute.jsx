import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{
        minHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px'
      }}>
        <Loader2 className="animate-spin" size={36} color="#ED7D31" />
        <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 600 }}>
          Verifying Microsoft @goml.io session...
        </span>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to Microsoft login page while preserving intended destination
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};
