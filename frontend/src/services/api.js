import axios from 'axios';

/**
 * Normalizes backend root URL (e.g., "https://structura-backend.onrender.com")
 */
export const getBackendRootUrl = () => {
  const rawBase = import.meta.env.VITE_API_BASE_URL?.trim();
  if (!rawBase) {
    if (typeof window !== 'undefined' && window.location) {
      return window.location.origin;
    }
    return 'http://127.0.0.1:8000';
  }

  let url = rawBase;
  // If host only without protocol, prepend https://
  if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('/')) {
    url = `https://${url}`;
  }

  // Strip trailing /api/v1 or trailing slash
  return url.replace(/\/api\/v1\/?$/, '').replace(/\/$/, '');
};

/**
 * Normalizes full API base endpoint including /api/v1
 */
export const getApiBaseUrl = () => {
  const rawBase = import.meta.env.VITE_API_BASE_URL?.trim();
  if (!rawBase) return '/api/v1';

  let url = rawBase;
  if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('/')) {
    url = `https://${url}`;
  }

  // Normalize to end with /api/v1
  const clean = url.replace(/\/+$/, '');
  if (!clean.endsWith('/api/v1')) {
    return `${clean}/api/v1`;
  }
  return clean;
};

/**
 * Normalizes WebSocket base endpoint
 */
export const getWebSocketUrl = () => {
  const rawWs = import.meta.env.VITE_WS_BASE_URL?.trim();
  if (rawWs) {
    if (!rawWs.startsWith('ws://') && !rawWs.startsWith('wss://')) {
      return `wss://${rawWs.replace(/^\/+/, '')}`;
    }
    return rawWs;
  }

  const rawApi = import.meta.env.VITE_API_BASE_URL?.trim();
  if (rawApi && (rawApi.startsWith('http://') || rawApi.startsWith('https://') || !rawApi.startsWith('/'))) {
    let apiHost = rawApi;
    if (!apiHost.startsWith('http://') && !apiHost.startsWith('https://')) {
      apiHost = `https://${apiHost}`;
    }
    try {
      const parsed = new URL(apiHost);
      const proto = parsed.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${proto}//${parsed.host}/ws/alerts`;
    } catch {
      // Fall through to window.location fallback
    }
  }

  if (typeof window !== 'undefined' && window.location) {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${proto}//${window.location.host}/ws/alerts`;
  }

  return 'ws://127.0.0.1:8000/ws/alerts';
};

export const API_BASE_URL = getApiBaseUrl();

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Attach JWT access token to every outgoing request if available
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('structura_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to extract data payload and handle unauth
apiClient.interceptors.response.use(
  (response) => {
    // If backend returns { success: true, data: ..., message: ... }
    return response.data;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Optional: Clear token if expired
      // localStorage.removeItem('structura_token');
    }
    return Promise.reject(error);
  }
);

export default apiClient;
