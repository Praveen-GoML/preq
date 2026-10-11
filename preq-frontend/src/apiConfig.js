// Centralized API Configuration for Local Dev & Vercel Production
const rawApiUrl = (import.meta.env.VITE_API_URL || '').trim();
export const API_URL = rawApiUrl
  ? (rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl.replace(/\/+$/, '')}/api`)
  : (typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://localhost:8000/api' : '/api');

export const BASE_URL = import.meta.env.VITE_BASE_URL 
  || (rawApiUrl ? rawApiUrl.replace(/\/api\/?$/, '') : '')
  || (typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://localhost:8000' : '');

import axios from 'axios';

// Automatically inject stored Groq API key into all outgoing requests
axios.interceptors.request.use((config) => {
  try {
    const key = typeof window !== 'undefined' ? localStorage.getItem('groq_api_key') : null;
    if (key && !config.headers['X-Groq-Api-Key'] && !config.headers['x-groq-api-key']) {
      config.headers['X-Groq-Api-Key'] = key;
    }
  } catch (_) {}
  return config;
});
