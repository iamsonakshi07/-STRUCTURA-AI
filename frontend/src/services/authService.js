import apiClient from './api';

export const authService = {
  async login(email, password) {
    const res = await apiClient.post('/auth/login', { email, password });
    if (res.data?.access_token) {
      localStorage.setItem('structura_token', res.data.access_token);
      localStorage.setItem('structura_user', JSON.stringify(res.data.user));
    }
    return res.data;
  },

  async register(name, email, password, role = 'inspector') {
    const res = await apiClient.post('/auth/register', { name, email, password, role });
    if (res.data?.access_token) {
      localStorage.setItem('structura_token', res.data.access_token);
      localStorage.setItem('structura_user', JSON.stringify(res.data.user));
    }
    return res.data;
  },

  async getMe() {
    const res = await apiClient.get('/auth/me');
    return res.data;
  },

  logout() {
    localStorage.removeItem('structura_token');
    localStorage.removeItem('structura_user');
  },

  getCurrentUser() {
    try {
      const userStr = localStorage.getItem('structura_user');
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  },
};
