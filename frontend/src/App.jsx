import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { WebSocketProvider } from './context/WebSocketContext';
import { DashboardLayout } from './components/layout/DashboardLayout';

// Pages
import { Overview } from './pages/Overview';
import { InfrastructureRegistry } from './pages/InfrastructureRegistry';
import { DefectDetection } from './pages/DefectDetection';
import { DigitalTwin } from './pages/DigitalTwin';
import { SensorIntelligence } from './pages/SensorIntelligence';
import { RULPrediction } from './pages/RULPrediction';
import { RiskAssessment } from './pages/RiskAssessment';
import { GeospatialIntelligence } from './pages/GeospatialIntelligence';
import { InspectionReports } from './pages/InspectionReports';
import { AlertsNotifications } from './pages/AlertsNotifications';
import { Settings } from './pages/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <WebSocketProvider>
            <Routes>
              <Route path="/" element={<DashboardLayout />}>
                <Route index element={<Overview />} />
                <Route path="infrastructure" element={<InfrastructureRegistry />} />
                <Route path="vision" element={<DefectDetection />} />
                <Route path="digital-twin" element={<DigitalTwin />} />
                <Route path="sensors" element={<SensorIntelligence />} />
                <Route path="rul" element={<RULPrediction />} />
                <Route path="risk" element={<RiskAssessment />} />
                <Route path="geospatial" element={<GeospatialIntelligence />} />
                <Route path="reports" element={<InspectionReports />} />
                <Route path="alerts" element={<AlertsNotifications />} />
                <Route path="settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </WebSocketProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
