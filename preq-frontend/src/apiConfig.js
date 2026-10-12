// Centralized API Configuration for Local Dev & Production
export const DEPLOYED_BACKEND_URL = 'https://preq-ten.vercel.app';

const rawApiUrl = (import.meta.env.VITE_API_URL || DEPLOYED_BACKEND_URL).trim();
export const API_URL = rawApiUrl.endsWith('/api')
  ? rawApiUrl
  : `${rawApiUrl.replace(/\/+$/, '')}/api`;

export const BASE_URL = import.meta.env.VITE_BASE_URL 
  || rawApiUrl.replace(/\/api\/?$/, '');

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
