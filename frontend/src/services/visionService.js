import apiClient from './api';

export const visionService = {
  async analyzeImage(formData) {
    // formData must contain: infrastructure_id, file, and optional latitude, longitude
    const res = await apiClient.post('/vision/analyze', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  async getDefectResult(id) {
    const res = await apiClient.get(`/vision/results/${id}`);
    return res.data;
  },

  async getDefectsByInfrastructure(infrastructureId) {
    try {
      const res = await apiClient.get(`/vision/infrastructure/${infrastructureId}`);
      return res.data;
    } catch (err) {
      console.warn('Vision defects by infra fallback:', err.message);
      return [];
    }
  },
};
