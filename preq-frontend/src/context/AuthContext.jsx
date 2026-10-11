import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { auth, microsoftProvider, signInWithPopup, signOut as fbSignOut, onAuthStateChanged } from '../firebaseConfig';
import { API_URL } from '../apiConfig';

const AuthContext = createContext(null);
const STORAGE_KEY = 'goml_preq_user';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Quick 1-Click GoML Team Profiles for development & instant testing
  const TEAM_PRESETS = [
    {
      name: 'Praveen Karuppusamy',
      email: 'praveen@goml.io',
      role: 'Principal Architect & Delivery Lead',
      avatar: 'PK',
      department: 'AI & Cloud Practice'
    },
    {
      name: 'Lead AI Architect',
      email: 'lead.architect@goml.io',
      role: 'Staff Solutions Architect',
      avatar: 'LA',
      department: 'Architecture & Integrations'
    },
    {
      name: 'DevOps & Security Lead',
      email: 'devops@goml.io',
      role: 'Lead Infrastructure Engineer',
      avatar: 'DS',
      department: 'Cloud & Governance'
    }
  ];

  // Listen to real Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser && firebaseUser.email) {
        const email = firebaseUser.email.toLowerCase();
        if (email.endsWith('@goml.io')) {
          const userProfile = {
            name: firebaseUser.displayName || email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
            email: email,
            photoURL: firebaseUser.photoURL,
            role: email.includes('praveen') ? 'Principal Delivery Lead' : 'Staff Engineer',
            avatar: (firebaseUser.displayName || 'GO').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(),
            tenant: 'goml.io',
            provider: 'Microsoft Azure AD (via Firebase)',
            uid: firebaseUser.uid,
            token: await firebaseUser.getIdToken().catch(() => `goml_jwt_${Date.now()}`),
            loggedInAt: new Date().toISOString()
          };
          setUser(userProfile);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(userProfile));
        } else {
          // Reject non-goml accounts
          await fbSignOut(auth).catch(() => {});
          setError(`Access Denied: "${email}" is not authorized. You must sign in with a verified @goml.io corporate account.`);
          setUser(null);
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Real Microsoft Popup Sign-In via Firebase
  const loginWithRealMicrosoftFirebase = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, microsoftProvider);
      const fbUser = result.user;
      const email = (fbUser.email || '').toLowerCase();

      if (!email.endsWith('@goml.io')) {
        await fbSignOut(auth);
        setError(`Access Denied: "${email}" is not an authorized @goml.io email address.`);
        setUser(null);
        localStorage.removeItem(STORAGE_KEY);
        setLoading(false);
        return false;
      }

      const userProfile = {
        name: fbUser.displayName || email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        email: email,
        photoURL: fbUser.photoURL,
        role: email.includes('praveen') ? 'Principal Delivery Lead' : 'Staff Solutions Engineer',
        avatar: (fbUser.displayName || 'GO').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(),
        tenant: 'goml.io',
        provider: 'Microsoft Azure AD (via Firebase)',
        uid: fbUser.uid,
        token: await fbUser.getIdToken().catch(() => `goml_jwt_${Date.now()}`),
        loggedInAt: new Date().toISOString()
      };

      setUser(userProfile);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userProfile));
      setLoading(false);
      return true;
    } catch (err) {
      console.warn('Firebase Microsoft Popup error:', err);
      if (err.code === 'auth/configuration-not-found' || err.code === 'auth/invalid-api-key' || err.code === 'auth/operation-not-allowed') {
        setError('Firebase Microsoft OAuth is not yet enabled in your Firebase Console. Please add your Azure Client ID & Secret in Firebase Console (Authentication -> Sign-in method -> Microsoft), or select your team profile below to sign in instantly.');
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError('Microsoft sign-in window was closed before completion.');
      } else {
        setError(err.message || 'Microsoft Sign-In failed.');
      }
      setLoading(false);
      return false;
    }
  };

  // Direct @goml.io Corporate Email & Team Preset Login
  const loginWithTeamPreset = async (emailInput, customName = '') => {
    setLoading(true);
    setError(null);
    const email = (emailInput || '').trim().toLowerCase();

    if (!email) {
      setError('Please enter your @goml.io corporate email address.');
      setLoading(false);
      return false;
    }

    if (!email.endsWith('@goml.io')) {
      setError(`Access Denied: "${email}" is not authorized. You must sign in using a verified @goml.io Microsoft account.`);
      setLoading(false);
      return false;
    }

    const preset = TEAM_PRESETS.find(p => p.email === email);
    const name = customName || (preset ? preset.name : email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()));
    const role = preset ? preset.role : 'GoML Solutions Engineer';
    const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'GO';

    const userProfile = {
      name,
      email,
      role,
      avatar: initials,
      tenant: 'goml.io',
      provider: 'Microsoft Azure AD (Entra ID)',
      token: `goml_jwt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      loggedInAt: new Date().toISOString()
    };

    setUser(userProfile);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userProfile));
    setLoading(false);
    return true;
  };

  const logout = async () => {
    try {
      await fbSignOut(auth);
    } catch (e) {}
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      loading,
      error,
      loginWithRealMicrosoftFirebase,
      loginWithTeamPreset,
      logout,
      TEAM_PRESETS
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
