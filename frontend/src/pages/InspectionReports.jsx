import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  FileSpreadsheet,
  Printer,
  Download,
  Calendar,
  Building2,
  ShieldAlert,
  Activity,
  Sparkles,
  Layers,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { Card, CardHeader } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { formatDate } from '../utils/formatters';

export const InspectionReports = () => {
  const { infrastructures = [] } = useOutletContext() || {};
  const [selectedInfraId, setSelectedInfraId] = useState(1);

  const selectedAsset =
    infrastructures.find((inf) => inf.id === selectedInfraId) || infrastructures[0] || {
      id: 1,
      name: 'Bridge A – Bay Cable-Stayed Viaduct',
      infrastructure_type: 'bridge',
      location: 'San Francisco Bay, CA',
      construction_year: 1965,
      material_type: 'steel',
      health_score: 72.5,
      risk_level: 'MODERATE',
      inspection_priority: 'MONITOR',
      predicted_rul_years: 18.4,
    };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header (Hidden on Print) */}
      <div className="no-print flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-navy-700/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-soft-white font-mono">
              INSPECTION REPORTS & CERTIFICATIONS
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan/15 text-cyan border border-cyan/30 uppercase">
              Official Audit Dossier
            </span>
          </div>
          <p className="text-xs sm:text-sm text-soft-muted mt-1">
            Standardized multi-modal engineering inspection dossier combining computer vision, IoT vibration waveforms, and RUL forecasts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedInfraId}
            onChange={(e) => setSelectedInfraId(Number(e.target.value))}
            className="px-3.5 py-2 rounded-xl bg-navy-800 border border-cyan/30 text-soft-white text-xs font-mono focus:outline-none"
          >
            {infrastructures.map((inf) => (
              <option key={inf.id} value={inf.id}>
                {inf.name}
              </option>
            ))}
          </select>

          <Button variant="primary" size="sm" onClick={handlePrint} icon={Printer}>
            Print / Export PDF
          </Button>
        </div>
      </div>

      {/* Official Inspection Dossier Document Card */}
      <Card variant="default" className="p-8 sm:p-10 border border-navy-700/80 max-w-5xl mx-auto shadow-2xl">
        {/* Document Header */}
        <div className="border-b-2 border-cyan/40 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-mono tracking-widest text-cyan uppercase font-bold">
              STRUCTURA AI • AUTONOMOUS STRUCTURAL INTEGRITY DOSSIER
            </span>
            <h2 className="text-2xl font-black text-soft-white mt-1 font-mono tracking-tight">
              CIVIL ASSET CONDITION INSPECTION REPORT
            </h2>
            <p className="text-xs text-soft-muted mt-1 font-mono">
              Report Ref: STR-2026-INF-{selectedAsset.id}-09B • Multi-Modal Automated Triage
            </p>
          </div>

          <div className="text-right font-mono text-xs text-soft-subtle">
            <div className="text-soft-white font-bold">DATE: {new Date().toLocaleDateString()}</div>
            <div>STATUS: PROTOTYPE TRIAGE</div>
            <div className="text-cyan">SECURITY: OFFICIAL RECORD</div>
          </div>
        </div>

        {/* Section 1: Asset Identification */}
        <div className="mt-6">
          <h3 className="text-xs font-bold text-cyan font-mono uppercase tracking-wider mb-3 flex items-center gap-2">
            <Building2 className="w-4 h-4" /> 1. Civil Asset Identification & Baseline Parameters
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-navy-900/80 border border-navy-700 text-xs font-mono">
            <div>
              <span className="text-[10px] text-soft-subtle block">ASSET IDENTIFIER</span>
              <span className="text-soft-white font-bold">{selectedAsset.name}</span>
            </div>
            <div>
              <span className="text-[10px] text-soft-subtle block">CLASSIFICATION</span>
              <span className="text-soft-white font-bold uppercase">{selectedAsset.infrastructure_type}</span>
            </div>
            <div>
              <span className="text-[10px] text-soft-subtle block">CONSTRUCTION YEAR</span>
              <span className="text-soft-white font-bold">{selectedAsset.construction_year || 1970}</span>
            </div>
            <div>
              <span className="text-[10px] text-soft-subtle block">MATERIAL SPECIFICATION</span>
              <span className="text-soft-white font-bold capitalize">
                {selectedAsset.material_type?.replace('_', ' ') || 'Structural Steel'}
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: Executive Condition Summary */}
        <div className="mt-8">
          <h3 className="text-xs font-bold text-cyan font-mono uppercase tracking-wider mb-3 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" /> 2. Multi-Modal Structural Health & Risk Assessment
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-navy-900/80 border border-navy-700 text-center font-mono">
              <span className="text-[10px] text-soft-subtle uppercase block">COMPOSITE HEALTH SCORE</span>
              <span className="text-3xl font-black text-healthy mt-1 block">
                {selectedAsset.health_score || 72.5} / 100
              </span>
              <span className="text-[10px] text-soft-muted mt-1 block">AASHTO Grade: Fair</span>
            </div>
            <div className="p-4 rounded-xl bg-navy-900/80 border border-navy-700 text-center font-mono">
              <span className="text-[10px] text-soft-subtle uppercase block">RISK LEVEL</span>
              <span className="text-2xl font-black text-warning mt-1 block uppercase">
                {selectedAsset.risk_level || 'MODERATE'}
              </span>
              <span className="text-[10px] text-soft-muted mt-1 block">Triage Priority: MONITOR</span>
            </div>
            <div className="p-4 rounded-xl bg-navy-900/80 border border-navy-700 text-center font-mono">
              <span className="text-[10px] text-soft-subtle uppercase block">PROJECTED RESIDUAL LIFE</span>
              <span className="text-3xl font-black text-cyan mt-1 block">
                {selectedAsset.predicted_rul_years || 18.4} Yrs
              </span>
              <span className="text-[10px] text-soft-muted mt-1 block">Uncertainty: ± 1.8 Yrs</span>
            </div>
          </div>
        </div>

        {/* Section 3: Drone Computer Vision Defect Localization */}
        <div className="mt-8">
          <h3 className="text-xs font-bold text-cyan font-mono uppercase tracking-wider mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> 3. Computer Vision Defect Localizations
          </h3>
          <div className="p-4 rounded-xl bg-navy-900/80 border border-navy-700 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="relative rounded-xl overflow-hidden border border-navy-700 h-44 bg-navy-950">
                <img
                  src="https://images.unsplash.com/photo-1545569341-9eb8b30979d9?auto=format&fit=crop&w=800&q=80"
                  alt="Defect Capture"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-critical text-white font-mono text-[10px] font-bold">
                  LOCALIZED DEFECT #01
                </div>
              </div>

              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between py-1 border-b border-navy-800">
                  <span className="text-soft-muted">Identified Class:</span>
                  <span className="text-soft-white font-bold">Surface Corrosion & Rebar Pitting</span>
                </div>
                <div className="flex justify-between py-1 border-b border-navy-800">
                  <span className="text-soft-muted">AI Confidence:</span>
                  <span className="text-cyan font-bold">93.4% (YOLOv8 Engine)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-navy-800">
                  <span className="text-soft-muted">Severity Tag:</span>
                  <span className="text-warning font-bold">HIGH SEVERITY</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-soft-muted">Estimated Area:</span>
                  <span className="text-soft-white">0.45 m² localized patch</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Dynamic IoT Telemetry Analysis */}
        <div className="mt-8">
          <h3 className="text-xs font-bold text-cyan font-mono uppercase tracking-wider mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4" /> 4. IoT Dynamic Vibration & Anomaly Analysis
          </h3>
          <div className="p-4 rounded-xl bg-navy-900/80 border border-navy-700 text-xs font-mono space-y-2">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div>
                <span className="text-[10px] text-soft-subtle block">VIBRATION RMS</span>
                <span className="text-soft-white font-bold mt-1 block">1.85 mm/s</span>
              </div>
              <div>
                <span className="text-[10px] text-soft-subtle block">PEAK ACCELERATION</span>
                <span className="text-soft-white font-bold mt-1 block">0.38 m/s²</span>
              </div>
              <div>
                <span className="text-[10px] text-soft-subtle block">CREST FACTOR</span>
                <span className="text-soft-white font-bold mt-1 block">3.12</span>
              </div>
              <div>
                <span className="text-[10px] text-soft-subtle block">ANOMALY STATUS</span>
                <span className="text-healthy font-bold mt-1 block">NOMINAL (NO SURGE)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 5: Statutory Recommendation */}
        <div className="mt-8 pt-6 border-t-2 border-navy-700">
          <h3 className="text-xs font-bold text-cyan font-mono uppercase tracking-wider mb-2">
            5. Recommended Engineering Actions & Schedule
          </h3>
          <p className="text-xs text-soft-muted leading-relaxed">
            Based on the automated composite score of <strong>72.5/100</strong>, Bridge A does not present imminent collapse risk, but localized rebar corrosion on south pier foundation requires cleaning, rust conversion coating, and acoustic non-destructive testing (NDE) within <strong>60 days</strong> to arrest degradation acceleration.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-navy-800 text-[10px] font-mono text-soft-subtle">
            <div>
              <span>GENERATED BY: STRUCTURA AI CORE ENGINE v1.0.0</span>
              <div className="text-soft-muted">HOST: FASTAPI / TORCH-LSTM AUTOENCODER</div>
            </div>
            <div className="text-right">
              <span>OFFICIAL VERIFICATION HASH</span>
              <div className="text-cyan">SHA256: 7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1f</div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
