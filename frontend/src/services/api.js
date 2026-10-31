import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

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
