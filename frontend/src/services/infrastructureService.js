import apiClient from './api';
import { mockInfrastructureList } from '../utils/mockData';

export const infrastructureService = {
  async getAll(params = {}) {
    try {
      const res = await apiClient.get('/infrastructure/', { params });
      return res.data;
    } catch (err) {
      console.warn('Infrastructure API fallback active:', err.message);
      return mockInfrastructureList;
    }
  },

  async getById(id) {
    try {
      const res = await apiClient.get(`/infrastructure/${id}`);
      return res.data;
    } catch (err) {
      console.warn(`Infrastructure ${id} detail API fallback:`, err.message);
      const match = mockInfrastructureList.find((i) => i.id === Number(id));
      return match || mockInfrastructureList[0];
    }
  },

  async create(data) {
    const res = await apiClient.post('/infrastructure/', data);
    return res.data;
  },

  async update(id, data) {
    const res = await apiClient.put(`/infrastructure/${id}`, data);
    return res.data;
  },

  async delete(id) {
    const res = await apiClient.delete(`/infrastructure/${id}`);
    return res.data;
  },
};
