/**
 * STRUCTURA AI - Demonstration Fallback Dataset
 * Used only when live backend API connection is interrupted or loading.
 * Always clearly labeled with isDemonstrationData: true.
 */

export const mockOverview = {
  metrics: {
    total_infrastructure: 3,
    total_detected_defects: 4,
    critical_risk_count: 1,
    average_health_score: 74.2,
    active_alerts_count: 3,
    active_sensors_count: 3,
  },
  health_distribution: {
    low_risk: 1,
    moderate_risk: 1,
    high_risk: 0,
    critical_risk: 1,
  },
  recent_alerts: [
    {
      id: 1,
      infrastructure_id: 2,
      infrastructure_name: "Highway Overpass B – Interstate 90 Concrete Span",
      alert_type: "DEFECT_DETECTED",
      severity: "CRITICAL",
      message: "Severe structural shear crack detected in main concrete deck.",
      status: "ACTIVE",
      created_at: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    },
    {
      id: 2,
      infrastructure_id: 3,
      infrastructure_name: "Dam C – Cascade Hydroelectric Gravity Dam",
      alert_type: "SENSOR_ANOMALY",
      severity: "HIGH",
      message: "Abnormal crest dynamic resonance detected (Vibration: 11.4 mm/s).",
      status: "ACTIVE",
      created_at: new Date(Date.now() - 1000 * 60 * 75).toISOString(),
    },
    {
      id: 3,
      infrastructure_id: 1,
      infrastructure_name: "Bridge A – Bay Cable-Stayed Viaduct",
      alert_type: "DEFECT_DETECTED",
      severity: "HIGH",
      message: "Substantial surface corrosion identified on anchor pier 03.",
      status: "ACTIVE",
      created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    },
  ],
  generated_at: new Date().toISOString(),
  isDemonstrationData: true,
};

export const mockInfrastructureList = [
  {
    id: 1,
    name: "Bridge A – Bay Cable-Stayed Viaduct",
    infrastructure_type: "bridge",
    location: "San Francisco Bay, CA",
    latitude: 37.8199,
    longitude: -122.4783,
    construction_year: 1965,
    material_type: "steel",
    health_score: 72.5,
    risk_level: "MODERATE",
    inspection_priority: "MONITOR",
    defects_count: 1,
    sensors_count: 1,
    predicted_rul_years: 18.4,
    created_at: "2026-01-10T08:00:00Z",
    updated_at: new Date().toISOString(),
    image: "/assets/bridge_a_cable_stayed.jpg",
  },
  {
    id: 2,
    name: "Highway Overpass B – Interstate 90 Concrete Span",
    infrastructure_type: "overpass",
    location: "Seattle Metro Area, WA",
    latitude: 47.6062,
    longitude: -122.3321,
    construction_year: 1978,
    material_type: "reinforced_concrete",
    health_score: 52.0,
    risk_level: "CRITICAL",
    inspection_priority: "IMMEDIATE_ACTION",
    defects_count: 1,
    sensors_count: 1,
    predicted_rul_years: 8.2,
    created_at: "2026-01-15T09:30:00Z",
    updated_at: new Date().toISOString(),
    image: "https://images.unsplash.com/photo-1543996991-51fe458abfbd?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 3,
    name: "Dam C – Cascade Hydroelectric Gravity Dam",
    infrastructure_type: "dam",
    location: "Clark County, NV",
    latitude: 36.0160,
    longitude: -114.7377,
    construction_year: 1948,
    material_type: "reinforced_concrete",
    health_score: 64.0,
    risk_level: "HIGH",
    inspection_priority: "URGENT",
    defects_count: 2,
    sensors_count: 1,
    predicted_rul_years: 12.6,
    created_at: "2026-02-01T11:00:00Z",
    updated_at: new Date().toISOString(),
    image: "https://images.unsplash.com/photo-1588590501129-5d3ee96acdd5?auto=format&fit=crop&w=800&q=80",
  },
];

export const mockAnalytics = {
  defect_categories: [
    { category: "Concrete Cracks", count: 2, percentage: 50.0 },
    { category: "Corrosion & Rust", count: 1, percentage: 25.0 },
    { category: "Exposed Reinforcement", count: 1, percentage: 25.0 },
    { category: "Structural Deformation", count: 0, percentage: 0.0 },
  ],
  defect_severities: [
    { severity: "CRITICAL", count: 2 },
    { severity: "HIGH", count: 2 },
    { severity: "MODERATE", count: 0 },
    { severity: "LOW", count: 0 },
  ],
  sensor_activity: {
    total_readings_24h: 90,
    anomalies_24h: 3,
    anomaly_rate_pct: 3.33,
    active_sensors_list: ["VIB-BRI-01", "VIB-OVE-01", "VIB-DAM-01"],
  },
  infrastructure_type_breakdown: {
    bridge: 1,
    overpass: 1,
    dam: 1,
  },
  generated_at: new Date().toISOString(),
};

export const mockHistoricalHealth = [
  { month: "May", health: 86.4, threshold: 70 },
  { month: "Jun", health: 84.8, threshold: 70 },
  { month: "Jul", health: 81.2, threshold: 70 },
  { month: "Aug", health: 79.5, threshold: 70 },
  { month: "Sep", health: 76.1, threshold: 70 },
  { month: "Oct", health: 74.2, threshold: 70 },
];
