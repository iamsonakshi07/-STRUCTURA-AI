import apiClient from './api';

export const geospatialService = {
  async getInfrastructureGeoJSON() {
    try {
      const res = await apiClient.get('/geo/infrastructure');
      return res.data;
    } catch (err) {
      console.warn('Geospatial infrastructure fallback active:', err.message);
      return {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            id: 1,
            geometry: { type: 'Point', coordinates: [-122.4783, 37.8199] },
            properties: {
              id: 1,
              name: 'Bridge A – Bay Cable-Stayed Viaduct',
              infrastructure_type: 'bridge',
              location: 'San Francisco Bay, CA',
              construction_year: 1965,
              material_type: 'steel',
              health_score: 72.5,
              risk_level: 'MODERATE',
              inspection_priority: 'MONITOR',
              active_defects_count: 1,
              marker_color: '#F59E0B',
              marker_radius: 12,
            },
          },
          {
            type: 'Feature',
            id: 2,
            geometry: { type: 'Point', coordinates: [-122.3321, 47.6062] },
            properties: {
              id: 2,
              name: 'Highway Overpass B – Interstate 90 Concrete Span',
              infrastructure_type: 'overpass',
              location: 'Seattle Metro Area, WA',
              construction_year: 1978,
              material_type: 'reinforced_concrete',
              health_score: 52.0,
              risk_level: 'CRITICAL',
              inspection_priority: 'IMMEDIATE_ACTION',
              active_defects_count: 1,
              marker_color: '#EF4444',
              marker_radius: 16,
            },
          },
          {
            type: 'Feature',
            id: 3,
            geometry: { type: 'Point', coordinates: [-114.7377, 36.0160] },
            properties: {
              id: 3,
              name: 'Dam C – Cascade Hydroelectric Gravity Dam',
              infrastructure_type: 'dam',
              location: 'Clark County, NV',
              construction_year: 1948,
              material_type: 'reinforced_concrete',
              health_score: 64.0,
              risk_level: 'HIGH',
              inspection_priority: 'URGENT',
              active_defects_count: 2,
              marker_color: '#EA580C',
              marker_radius: 14,
            },
          },
        ],
      };
    }
  },

  async getDefectsGeoJSON() {
    try {
      const res = await apiClient.get('/geo/defects');
      return res.data;
    } catch (err) {
      console.warn('Geospatial defects fallback active:', err.message);
      return { type: 'FeatureCollection', features: [] };
    }
  },

  async getHeatmap(category = null) {
    try {
      const res = await apiClient.get('/geo/heatmap', { params: { category } });
      return res.data;
    } catch (err) {
      console.warn('Geospatial heatmap fallback active:', err.message);
      return {
        points: [
          { latitude: 37.8199, longitude: -122.4783, intensity: 0.45, weight: 1.5, category: 'infrastructure', source_type: 'asset', source_id: 1 },
          { latitude: 47.6062, longitude: -122.3321, intensity: 0.95, weight: 3.0, category: 'defect', source_type: 'crack', source_id: 2 },
          { latitude: 36.0160, longitude: -114.7377, intensity: 0.75, weight: 2.2, category: 'infrastructure', source_type: 'asset', source_id: 3 },
        ],
        total_points: 3,
        bounds: { min_lat: 36.0, max_lat: 48.0, min_lng: -123.0, max_lng: -114.0 },
        generated_at: new Date().toISOString(),
      };
    }
  },
};
