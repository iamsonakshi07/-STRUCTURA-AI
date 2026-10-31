import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  Layers,
  Sparkles,
  Info,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from 'recharts';
import { Card, CardHeader } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { riskService } from '../services/riskService';
import { getRiskColor, getPriorityColor } from '../utils/formatters';

export const RiskAssessment = () => {
  const { infrastructures = [] } = useOutletContext() || {};
  const [selectedInfraId, setSelectedInfraId] = useState(1);
  const [assessment, setAssessment] = useState(null);
  const [summary, setSummary] = useState(null);
  const [criticalList, setCriticalList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [assess, sum, crit] = await Promise.all([
          riskService.getAssessment(selectedInfraId),
          riskService.getPortfolioSummary(),
          riskService.getCriticalAssets(),
        ]);
        setAssessment(assess);
        setSummary(sum);
        setCriticalList(crit || []);
      } catch (err) {
        console.error('Failed to load risk assessment data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [selectedInfraId]);

  if (isLoading) {
    return <LoadingSpinner label="Evaluating Multi-Modal Structural Risk..." size="lg" />;
  }

  const riskInfo = getRiskColor(assessment?.risk_level);
  const breakdown = assessment?.score_breakdown || {
    vision_score: 75.0,
    sensor_score: 82.0,
    rul_score: 68.0,
    age_score: 60.0,
    weights: { vision: 0.35, sensor: 0.25, rul: 0.25, age: 0.15 },
  };

  // Infrastructure Risk Comparison Chart data
  const comparisonData = [
    { name: 'Bridge A (Viaduct)', score: 72.5, risk: 'MODERATE' },
    { name: 'Overpass B (I-90)', score: 52.0, risk: 'CRITICAL' },
    { name: 'Dam C (Cascade)', score: 64.0, risk: 'HIGH' },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-navy-700/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-soft-white font-mono">
              STRUCTURAL RISK ASSESSMENT CENTER
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan/15 text-cyan border border-cyan/30 uppercase">
              Composite Risk Engine
            </span>
          </div>
          <p className="text-xs sm:text-sm text-soft-muted mt-1">
            Holistic multi-factor risk triage aggregating computer vision, IoT vibration anomaly detection, RUL forecasting, and structural age.
          </p>
        </div>

        {/* Asset Selection */}
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
        </div>
      </div>

      {/* Mandatory Engineering Disclaimer */}
      <div className="p-3.5 rounded-2xl bg-navy-800/80 border border-warning/40 flex items-start gap-3 text-xs text-soft-muted">
        <ShieldAlert className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-soft-white font-mono uppercase block">
            PROTOTYPE TRIAGE RECOMMENDATION ONLY
          </span>
          <p className="mt-0.5 leading-relaxed text-[11px]">
            {assessment?.engineering_disclaimer ||
              'This risk scoring is an algorithmic triage recommendation engineered for priority queue ordering and does not constitute an official statutory structural certification by a licensed Professional Engineer (PE).'}
          </p>
        </div>
      </div>

      {/* Top Section: Composite Risk Score Card & Score Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Main Overall Health & Risk Gauge (Col 1-5) */}
        <Card variant="glass" glow className="lg:col-span-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-soft-subtle uppercase">
                Overall Composite Health Score
              </span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold uppercase ${riskInfo.badge}`}>
                {assessment?.risk_level}
              </span>
            </div>

            <div className="mt-6 flex flex-col items-center justify-center py-4">
              <div className="relative w-44 h-44 rounded-full border-8 border-navy-700 flex flex-col items-center justify-center">
                <div
                  className="absolute inset-0 rounded-full border-8 transition-all duration-700"
                  style={{
                    borderColor: riskInfo.hex,
                    clipPath: `polygon(0 0, 100% 0, 100% ${assessment?.overall_health_score || 72}%, 0 ${assessment?.overall_health_score || 72}%)`,
                  }}
                />
                <span className="text-5xl font-black font-mono text-soft-white">
                  {assessment?.overall_health_score ? assessment.overall_health_score.toFixed(0) : '73'}
                </span>
                <span className="text-xs font-mono text-soft-muted uppercase mt-1">out of 100</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-navy-700/60 space-y-2 text-xs font-mono">
            <div className="flex justify-between items-center">
              <span className="text-soft-muted">Inspection Priority:</span>
              <span className={`px-2 py-0.5 rounded font-bold ${getPriorityColor(assessment?.inspection_priority)}`}>
                {assessment?.inspection_priority}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-soft-muted">Active Defects Detected:</span>
              <span className="text-soft-white font-bold">{assessment?.active_defects_count ?? 1} Defect(s)</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-soft-muted">Recent Sensor Anomalies:</span>
              <span className="text-soft-white font-bold">{assessment?.recent_anomalies_count ?? 0} Anomaly</span>
            </div>
          </div>
        </Card>

        {/* Score Breakdown Bars (Col 6-12) */}
        <Card variant="default" className="lg:col-span-7 flex flex-col justify-between">
          <div>
            <CardHeader
              title="Multi-Modal Score Breakdown"
              subtitle="Weighted component scores that drive overall structural risk"
              icon={Layers}
            />

            <div className="space-y-4 text-xs font-mono">
              {/* Vision */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-soft-white">Computer Vision Defect Index (Weight: 35%)</span>
                  <span className="font-bold text-cyan">{breakdown.vision_score?.toFixed(1)} / 100</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-navy-900 overflow-hidden border border-navy-700">
                  <div className="h-full bg-cyan transition-all" style={{ width: `${breakdown.vision_score}%` }} />
                </div>
              </div>

              {/* Sensor */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-soft-white">IoT Vibration Telemetry Index (Weight: 25%)</span>
                  <span className="font-bold text-blue-400">{breakdown.sensor_score?.toFixed(1)} / 100</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-navy-900 overflow-hidden border border-navy-700">
                  <div className="h-full bg-blue-500 transition-all" style={{ width: `${breakdown.sensor_score}%` }} />
                </div>
              </div>

              {/* RUL */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-soft-white">RUL Residual Lifespan Horizon (Weight: 25%)</span>
                  <span className="font-bold text-healthy">{breakdown.rul_score?.toFixed(1)} / 100</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-navy-900 overflow-hidden border border-navy-700">
                  <div className="h-full bg-healthy transition-all" style={{ width: `${breakdown.rul_score}%` }} />
                </div>
              </div>

              {/* Age */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-soft-white">Structural Age & Fatigue Endurance (Weight: 15%)</span>
                  <span className="font-bold text-warning">{breakdown.age_score?.toFixed(1)} / 100</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-navy-900 overflow-hidden border border-navy-700">
                  <div className="h-full bg-warning transition-all" style={{ width: `${breakdown.age_score}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Risk Explanation & Recommended Action */}
          <div className="mt-6 pt-4 border-t border-navy-700/60 p-4 rounded-xl bg-navy-900/80 border border-navy-700 space-y-2">
            <div>
              <span className="text-[10px] font-mono text-soft-subtle uppercase block">EVALUATED FACTORS & EXPLANATION</span>
              <p className="text-xs text-soft-white mt-0.5 leading-relaxed">
                {assessment?.risk_explanation || 'Asset presents moderate corrosion degradation on pier support and baseline cyclic stress.'}
              </p>
            </div>
            <div className="pt-2 border-t border-navy-800">
              <span className="text-[10px] font-mono text-cyan uppercase block">RECOMMENDED TRIAGE ACTION</span>
              <p className="text-xs text-cyan font-medium mt-0.5">
                {assessment?.recommended_action || 'Schedule targeted non-destructive evaluation (NDE) within 60 days.'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Row 2: Portfolio Risk Comparison Chart */}
      <Card variant="default">
        <CardHeader
          title="Portfolio Risk Comparison"
          subtitle="Relative structural health comparison across monitored civil assets"
          icon={ShieldCheck}
        />
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparisonData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f334d" vertical={false} />
              <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis domain={[0, 100]} stroke="#64748b" fontSize={10} tickLine={false} />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: '#101B2D',
                  borderColor: '#00C2D1',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontFamily: 'JetBrains Mono',
                }}
                itemStyle={{ color: '#00C2D1' }}
              />
              <Bar dataKey="score" fill="#00C2D1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
};
