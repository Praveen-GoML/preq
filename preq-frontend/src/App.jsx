import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import axios from 'axios';
import './index.css';

import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Navbar } from './components/Navbar';
import { GojiCopilot } from './components/GojiCopilot';
import { ExecutiveDashboard } from './pages/ExecutiveDashboard';
import { CreateProject } from './pages/CreateProject';
import { ProjectDashboard } from './pages/ProjectDashboard';
import { ClientPortal } from './pages/ClientPortal';
import { CertificateView } from './pages/CertificateView';
import { LoginPage } from './pages/LoginPage';

import { API_URL } from './apiConfig';

function AppLayout() {
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const location = useLocation();

  // Extract active project id if in dashboard, client or certificate view
  const match = location.pathname.match(/\/(dashboard|client|certificate)\/([^/]+)/);
  const activeProjectId = match ? match[2] : null;

  const handleAddItemFromCopilot = async (item) => {
    if (!activeProjectId) return;
    try {
      await axios.post(`${API_URL}/projects/${activeProjectId}/items`, {
        name: item.name,
        category: item.category || 'General',
        description: item.description || '',
        owner: item.owner || 'DevOps Lead',
        is_critical: item.is_critical || false,
        expected_evidence: item.expected_evidence || 'Verification document'
      });
      window.dispatchEvent(new Event('copilot-item-added'));
    } catch (err) {
      console.error('Failed to add item from copilot:', err);
    }
  };

  const isClientView = location.pathname.startsWith('/client/');
  const isLoginPage = location.pathname === '/login';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff' }}>
      {/* Internal GoML Navbar is ONLY shown for internal authenticated routes */}
      {!isClientView && !isLoginPage && <Navbar onOpenCopilot={() => setIsCopilotOpen(prev => !prev)} />}

      <main style={{ flex: 1 }}>
        <Routes>
          {/* Public Login Route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Dedicated External Client Portal (No Internal @goml.io Microsoft Auth Needed) */}
          <Route path="/client/:id" element={<ClientPortal />} />

          {/* Protected Internal Engineering & Leadership Routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <ExecutiveDashboard onOpenCopilot={() => setIsCopilotOpen(true)} />
            </ProtectedRoute>
          } />
          <Route path="/new" element={
            <ProtectedRoute>
              <CreateProject />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/:id" element={
            <ProtectedRoute>
              <ProjectDashboard onOpenCopilot={() => setIsCopilotOpen(true)} />
            </ProtectedRoute>
          } />
          <Route path="/certificate/:id" element={
            <ProtectedRoute>
              <CertificateView />
            </ProtectedRoute>
          } />
        </Routes>
      </main>

      {/* Internal AI Copilot only available for GoML Engineering Team */}
      {!isClientView && !isLoginPage && (
        <GojiCopilot
          isOpen={isCopilotOpen}
          onToggle={() => setIsCopilotOpen(prev => !prev)}
          activeProjectId={activeProjectId}
          onAddItemFromCopilot={handleAddItemFromCopilot}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </Router>
  );
}

export default App;

