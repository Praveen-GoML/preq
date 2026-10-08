// Centralized API Configuration for Local Dev & Vercel Production
export const API_URL = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://localhost:8000/api' : '/api');
export const BASE_URL = import.meta.env.VITE_BASE_URL || (typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://localhost:8000' : '');
