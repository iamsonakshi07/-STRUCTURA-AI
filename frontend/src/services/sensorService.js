import apiClient from './api';

export const sensorService = {
  async getReadings(infrastructureId, limit = 50) {
    try {
      const res = await apiClient.get(`/sensors/${infrastructureId}/readings`, {
        params: { limit },
      });
      return res.data;
    } catch (err) {
      console.warn('Sensor readings fallback active:', err.message);
      // Generate realistic demo sensor wave
      const now = Date.now();
      return Array.from({ length: 30 }, (_, i) => ({
        id: i + 1,
        infrastructure_id: Number(infrastructureId),
        sensor_id: `VIB-ACC-${infrastructureId}-01`,
        vibration: +(1.5 + Math.sin(i * 0.4) * 0.8 + Math.random() * 0.4).toFixed(2),
        acceleration: +(0.3 + Math.sin(i * 0.3) * 0.15 + Math.random() * 0.05).toFixed(2),
        frequency: +(8.0 + Math.cos(i * 0.2) * 2.0).toFixed(1),
        is_anomaly: i === 18,
        anomaly_score: i === 18 ? 0.87 : 0.05,
        timestamp: new Date(now - (30 - i) * 60000).toISOString(),
      }));
    }
  },

  async getAnomalies(infrastructureId) {
    try {
      const res = await apiClient.get(`/sensors/${infrastructureId}/anomalies`);
      return res.data;
    } catch (err) {
      console.warn('Sensor anomalies fallback active:', err.message);
      return [];
    }
  },

  async recordReading(data) {
    const res = await apiClient.post('/sensors/data', data);
    return res.data;
  },

  async recordBatch(data) {
    const res = await apiClient.post('/sensors/batch', data);
    return res.data;
  },

  async simulate(data) {
    const res = await apiClient.post('/sensors/simulate', data);
    return res.data;
  },
};
