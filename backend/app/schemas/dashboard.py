from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class OverviewMetrics(BaseModel):
    total_infrastructure: int
    total_detected_defects: int
    critical_risk_count: int
    average_health_score: float
    active_alerts_count: int
    active_sensors_count: int


class HealthDistribution(BaseModel):
    low_risk: int
    moderate_risk: int
    high_risk: int
    critical_risk: int


class DashboardAlertItem(BaseModel):
    id: int
    infrastructure_id: int
    infrastructure_name: str
    alert_type: str
    severity: str
    message: str
    status: str
    created_at: datetime


class DashboardOverviewResponse(BaseModel):
    metrics: OverviewMetrics
    health_distribution: HealthDistribution
    recent_alerts: List[DashboardAlertItem]
    generated_at: datetime


class DefectCategoryStat(BaseModel):
    category: str
    count: int
    percentage: float


class SeverityStat(BaseModel):
    severity: str
    count: int


class SensorActivityStat(BaseModel):
    total_readings_24h: int
    anomalies_24h: int
    anomaly_rate_pct: float
    active_sensors_list: List[str]


class DashboardAnalyticsResponse(BaseModel):
    defect_categories: List[DefectCategoryStat]
    defect_severities: List[SeverityStat]
    sensor_activity: SensorActivityStat
    infrastructure_type_breakdown: Dict[str, int]
    generated_at: datetime


class DashboardAlertsResponse(BaseModel):
    total_alerts: int
    active_alerts: int
    acknowledged_alerts: int
    resolved_alerts: int
    alerts: List[DashboardAlertItem]


class DashboardInfrastructureItem(BaseModel):
    id: int
    name: str
    infrastructure_type: str
    location: str
    latitude: float
    longitude: float
    construction_year: int
    material_type: str
    health_score: float
    risk_level: str
    inspection_priority: str
    defects_count: int
    sensors_count: int
    predicted_rul_years: Optional[float]
