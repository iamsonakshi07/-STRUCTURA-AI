import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  AlertTriangle,
  ShieldCheck,
  Activity,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  ExternalLink,
  Box,
  Layers,
  Sparkles,
  Radio,
  FileText,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
} from 'recharts';
import { Card, CardHeader } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { dashboardService } from '../services/dashboardService';
import { formatDate, getSeverityColor, getRiskColor } from '../utils/formatters';
import { mockHistoricalHealth } from '../utils/mockData';

export const Overview = () => {
  const navigate = useNavigate();
  const [overviewData, setOverviewData] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [infrastructureList, setInfrastructureList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [overview, analytics, infra] = await Promise.all([
          dashboardService.getOverview(),
          dashboardService.getAnalytics(),
          dashboardService.getInfrastructure(),
        ]);
        setOverviewData(overview);
        setAnalyticsData(analytics);
        setInfrastructureList(infra);
      } catch (err) {
        console.error('Failed to load overview data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) {
    return <LoadingSpinner label="Loading Structural Intelligence Overview..." size="lg" />;
  }

  const metrics = overviewData?.metrics || {};
  const healthDist = overviewData?.health_distribution || {};

  // Donut chart data for Section A
  const donutData = [
    { name: 'Healthy (Low Risk)', value: healthDist.low_risk || 0, color: '#22C55E' },
    { name: 'Moderate Risk', value: healthDist.moderate_risk || 0, color: '#F59E0B' },
    { name: 'High Risk', value: healthDist.high_risk || 0, color: '#EA580C' },
    { name: 'Critical Risk', value: healthDist.critical_risk || 0, color: '#EF4444' },
  ].filter((d) => d.value > 0);

  // Fallback donut data if empty
  const displayDonut = donutData.length > 0 ? donutData : [
    { name: 'Healthy (Low Risk)', value: 1, color: '#22C55E' },
    { name: 'Moderate Risk', value: 1, color: '#F59E0B' },
    { name: 'Critical Risk', value: 1, color: '#EF4444' },
  ];

  // Horizontal bar chart data for Section B
  const barData = analyticsData?.defect_categories?.map((item) => ({
    category: item.category,
    count: item.count,
  })) || [
    { category: 'Concrete Cracks', count: 2 },
    { category: 'Corrosion & Rust', count: 1 },
    { category: 'Exposed Rebar', count: 1 },
    { category: 'Deformation', count: 0 },
  ];

  // KPI card mini-sparklines
  const sparkline1 = [{ v: 3 }, { v: 3 }, { v: 3 }, { v: 3 }, { v: 4 }];
  const sparkline2 = [{ v: 8 }, { v: 12 }, { v: 9 }, { v: 15 }, { v: 18 }];
  const sparkline3 = [{ v: 1 }, { v: 2 }, { v: 3 }, { v: 4 }, { v: 4 }];
  const sparkline4 = [{ v: 0 }, { v: 1 }, { v: 1 }, { v: 1 }, { v: 1 }];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-navy-700/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-soft-white font-mono">
              STRUCTURAL INTELLIGENCE OVERVIEW
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan/15 text-cyan border border-cyan/30 uppercase">
              LIVE TELEMETRY
            </span>
          </div>
          <p className="text-xs sm:text-sm text-soft-muted mt-1">
            Real-time AI-powered infrastructure monitoring, sensor anomaly detection, and predictive integrity analytics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/geospatial')}
            icon={ExternalLink}
          >
            GIS Map
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/vision')}
            icon={Sparkles}
          >
            Run Defect Analysis
          </Button>
        </div>
      </div>

      {/* Four Premium KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* KPI 1 */}
        <Card variant="glass" hover className="relative overflow-hidden group">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-mono font-bold text-soft-subtle uppercase tracking-wider block">
                Total Infrastructure
              </span>
              <span className="text-3xl font-black text-soft-white font-mono mt-1 block">
                {metrics.total_infrastructure || 3}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-cyan/10 border border-cyan/25 flex items-center justify-center text-cyan shadow-cyan-glow group-hover:scale-110 transition-transform">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1 text-healthy font-mono font-medium">
              <TrendingUp className="w-3.5 h-3.5" /> 100% Monitored
            </span>
            <div className="w-16 h-6">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sparkline1}>
                  <Line type="monotone" dataKey="v" stroke="#00C2D1" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>

        {/* KPI 2 */}
        <Card variant="glass" hover className="relative overflow-hidden group">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-mono font-bold text-soft-subtle uppercase tracking-wider block">
                Active Telemetry & Inspections
              </span>
              <span className="text-3xl font-black text-cyan font-mono mt-1 block">
                {metrics.active_sensors_count || 3} Nodes
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1 text-cyan font-mono font-medium">
              <Radio className="w-3.5 h-3.5 animate-pulse" /> 200 Hz Sampling
            </span>
            <div className="w-16 h-6">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sparkline2}>
                  <Line type="monotone" dataKey="v" stroke="#3b82f6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>

        {/* KPI 3 */}
        <Card variant="glass" hover className="relative overflow-hidden group">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-mono font-bold text-soft-subtle uppercase tracking-wider block">
                Detected Structural Defects
              </span>
              <span className="text-3xl font-black text-warning font-mono mt-1 block">
                {metrics.total_detected_defects || 4}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-warning/10 border border-warning/25 flex items-center justify-center text-warning shadow-orange-glow group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1 text-warning font-mono font-medium">
              <TrendingDown className="w-3.5 h-3.5" /> High CV Precision
            </span>
            <div className="w-16 h-6">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sparkline3}>
                  <Line type="monotone" dataKey="v" stroke="#F59E0B" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>

        {/* KPI 4 */}
        <Card variant="glass" hover className="relative overflow-hidden group">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-mono font-bold text-soft-subtle uppercase tracking-wider block">
                Critical Risk Assets
              </span>
              <span className="text-3xl font-black text-critical font-mono mt-1 block">
                {metrics.critical_risk_count || 1}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-critical/10 border border-critical/25 flex items-center justify-center text-critical shadow-red-glow group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1 text-critical font-mono font-medium">
              Immediate Action Required
            </span>
            <div className="w-16 h-6">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sparkline4}>
                  <Line type="monotone" dataKey="v" stroke="#EF4444" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>
      </div>

      {/* Row 2: Charts (Section A, B, C) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Section A: Infrastructure Health Overview Donut */}
        <Card variant="default">
          <CardHeader
            title="Infrastructure Health Portfolio"
            subtitle="Current risk distribution based on multi-factor scoring"
            icon={ShieldCheck}
          />
          <div className="h-56 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={displayDonut}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {displayDonut.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#101B2D" strokeWidth={2} />
                  ))}
                </Pie>
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: '#101B2D',
                    borderColor: '#00C2D1',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontFamily: 'JetBrains Mono',
                  }}
                  itemStyle={{ color: '#F1F5F9' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-bold font-mono text-soft-white">
                {metrics.average_health_score ? `${metrics.average_health_score.toFixed(0)}%` : '74%'}
              </span>
              <span className="text-[10px] text-soft-subtle font-mono uppercase">Avg Health</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-navy-700/60 text-xs">
            {displayDonut.map((d, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                <span className="text-soft-muted truncate text-[11px]">{d.name}</span>
                <span className="font-mono font-bold text-soft-white ml-auto">{d.value}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Section B: Defect Distribution Horizontal Bar */}
        <Card variant="default">
          <CardHeader
            title="Defect Category Breakdown"
            subtitle="AI vision defect classification frequency"
            icon={Layers}
          />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barData}
                layout="vertical"
                margin={{ top: 10, right: 30, left: 40, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1f334d" horizontal={false} />
                <XAxis type="number" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="category"
                  stroke="#94a3b8"
                  fontSize={10}
                  tickLine={false}
                  width={90}
                />
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
                <Bar dataKey="count" fill="#00C2D1" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Section C: Historical Structural Health Trend Line Chart */}
        <Card variant="default">
          <CardHeader
            title="Structural Health Index Trend"
            subtitle="6-month portfolio degradation trajectory"
            icon={Activity}
          />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockHistoricalHealth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f334d" vertical={false} />
                <XAxis dataKey="month" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis domain={[50, 100]} stroke="#64748b" fontSize={10} tickLine={false} />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: '#101B2D',
                    borderColor: '#00C2D1',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontFamily: 'JetBrains Mono',
                  }}
                  itemStyle={{ color: '#22C55E' }}
                />
                <Line
                  type="monotone"
                  dataKey="health"
                  stroke="#22C55E"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#22C55E', stroke: '#101B2D', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: '#00C2D1' }}
                />
                <Line
                  type="monotone"
                  dataKey="threshold"
                  stroke="#EF4444"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Row 3: Section E Infrastructure Monitoring Asset Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-soft-white font-mono uppercase tracking-wide">
              Critical Infrastructure Monitoring
            </h3>
            <p className="text-xs text-soft-muted">Primary civil engineering assets under continuous AI surveillance</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/infrastructure')} icon={ArrowRight}>
            View All Assets
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {infrastructureList.map((asset) => {
            const riskInfo = getRiskColor(asset.risk_level);
            return (
              <Card key={asset.id} variant="default" hover className="overflow-hidden flex flex-col justify-between">
                <div>
                  {/* Asset Image */}
                  <div className="relative h-44 rounded-xl overflow-hidden mb-4 border border-navy-700 bg-navy-950">
                    <img
                      src={
                        asset.image ||
                        (asset.id === 1
                          ? 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?auto=format&fit=crop&w=800&q=80'
                          : asset.id === 2
                          ? 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=800&q=80'
                          : 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?auto=format&fit=crop&w=800&q=80')
                      }
                      alt={asset.name}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                    <div className="absolute top-2.5 left-2.5">
                      <span className={`text-[10px] font-mono px-2.5 py-1 rounded-full font-bold uppercase backdrop-blur-md ${riskInfo.badge}`}>
                        {asset.risk_level || 'MONITOR'}
                      </span>
                    </div>
                    <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-lg bg-navy-950/80 backdrop-blur-md text-[10px] font-mono text-cyan border border-cyan/30">
                      Health: {asset.health_score ?? 75}%
                    </div>
                  </div>

                  {/* Title & Metadata */}
                  <h4 className="text-sm font-bold text-soft-white leading-snug">{asset.name}</h4>
                  <p className="text-xs text-soft-muted mt-1">{asset.location}</p>

                  <div className="grid grid-cols-2 gap-2 mt-4 p-2.5 rounded-xl bg-navy-900/80 border border-navy-700/60 text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-soft-subtle block">DEFECTS</span>
                      <span className="text-soft-white font-bold">{asset.defects_count ?? 1} Localized</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-soft-subtle block">PREDICTED RUL</span>
                      <span className="text-cyan font-bold">{asset.predicted_rul_years ?? 14.5} Years</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-navy-700/60 flex items-center justify-between gap-3">
                  <span className="text-[11px] font-mono text-soft-subtle">
                    {formatDate(asset.updated_at || new Date().toISOString())}
                  </span>
                  <Button
                    variant="primary"
                    size="sm"
                    icon={Box}
                    onClick={() => navigate('/digital-twin')}
                  >
                    View Digital Twin
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Row 4: Section D Recent Alerts Table */}
      <Card variant="default">
        <CardHeader
          title="Recent Structural Alerts & Anomalies"
          subtitle="Real-time alerts triggered by computer vision and vibration telemetry"
          icon={AlertTriangle}
          action={
            <Button variant="ghost" size="sm" onClick={() => navigate('/alerts')} icon={ArrowRight}>
              Alerts Center
            </Button>
          }
        />

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-navy-700 text-soft-subtle font-mono uppercase text-[10px]">
                <th className="py-3 px-3">Infrastructure Asset</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Severity</th>
                <th className="py-3 px-3">Timestamp</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-700/60">
              {(overviewData?.recent_alerts || []).map((alert) => {
                const sevInfo = getSeverityColor(alert.severity);
                return (
                  <tr key={alert.id} className="hover:bg-navy-700/40 transition-colors">
                    <td className="py-3.5 px-3 font-semibold text-soft-white">
                      {alert.infrastructure_name}
                    </td>
                    <td className="py-3.5 px-3 font-mono text-cyan">
                      {alert.alert_type}
                    </td>
                    <td className="py-3.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${sevInfo.badge}`}>
                        {alert.severity}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-soft-muted font-mono">
                      {formatDate(alert.created_at)}
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-navy-600/40 text-soft-white border border-navy-500/40">
                        {alert.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate('/alerts')}
                        className="text-cyan hover:text-cyan-400"
                      >
                        Inspect
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
