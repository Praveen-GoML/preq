// Centralized API Configuration for Local Dev & Vercel Production
const rawApiUrl = (import.meta.env.VITE_API_URL || '').trim();
export const API_URL = rawApiUrl
  ? (rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl.replace(/\/+$/, '')}/api`)
  : (typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://localhost:8000/api' : '/api');

export const BASE_URL = import.meta.env.VITE_BASE_URL 
  || (rawApiUrl ? rawApiUrl.replace(/\/api\/?$/, '') : '')
  || (typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://localhost:8000' : '');
