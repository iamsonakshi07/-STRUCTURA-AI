import apiClient from './api';
import { mockOverview, mockAnalytics, mockInfrastructureList } from '../utils/mockData';

export const dashboardService = {
  async getOverview() {
    try {
      const res = await apiClient.get('/dashboard/overview');
      return res.data;
    } catch (err) {
      console.warn('Dashboard overview API fallback active:', err.message);
      return mockOverview;
    }
  },

  async getAnalytics() {
    try {
      const res = await apiClient.get('/dashboard/analytics');
      return res.data;
    } catch (err) {
      console.warn('Dashboard analytics API fallback active:', err.message);
      return mockAnalytics;
    }
  },

  async getAlerts() {
    try {
      const res = await apiClient.get('/dashboard/alerts');
      return res.data;
    } catch (err) {
      console.warn('Dashboard alerts API fallback active:', err.message);
      return {
        total_alerts: mockOverview.recent_alerts.length,
        active_alerts: mockOverview.recent_alerts.filter(a => a.status === 'ACTIVE').length,
        acknowledged_alerts: 0,
        resolved_alerts: 0,
        alerts: mockOverview.recent_alerts,
      };
    }
  },

  async getInfrastructure() {
    try {
      const res = await apiClient.get('/dashboard/infrastructure');
      return res.data;
    } catch (err) {
      console.warn('Dashboard infrastructure API fallback active:', err.message);
      return mockInfrastructureList;
    }
  },

  async updateAlertStatus(alertId, newStatus) {
    try {
      const res = await apiClient.put(`/dashboard/alerts/${alertId}/status`, null, {
        params: { status_update: newStatus },
      });
      return res.data;
    } catch (err) {
      console.error('Failed to update alert status:', err);
      throw err;
    }
  },
};
