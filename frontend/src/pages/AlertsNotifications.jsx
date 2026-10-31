import React, { useState, useEffect } from 'react';
import {
  BellRing,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Filter,
  Search,
  Radio,
  Clock,
  ShieldAlert,
  ArrowRight,
  Check,
} from 'lucide-react';
import { Card, CardHeader } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { dashboardService } from '../services/dashboardService';
import { useWebSocketAlerts } from '../context/WebSocketContext';
import { useToast } from '../context/ToastContext';
import { formatDate, getSeverityColor } from '../utils/formatters';

export const AlertsNotifications = () => {
  const [alerts, setAlerts] = useState([]);
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { isConnected, liveAlerts } = useWebSocketAlerts();
  const { addToast } = useToast();

  const fetchAlerts = async () => {
    setIsLoading(true);
    try {
      const data = await dashboardService.getAlerts();
      setAlerts(data?.alerts || []);
    } catch (err) {
      console.error('Failed to load alerts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleUpdateStatus = async (alertId, newStatus) => {
    try {
      await dashboardService.updateAlertStatus(alertId, newStatus);
      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, status: newStatus } : a))
      );
      addToast({
        title: 'Alert Status Updated',
        message: `Alert #${alertId} marked as ${newStatus}.`,
        type: 'success',
      });
    } catch (err) {
      // Local fallback state
      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, status: newStatus } : a))
      );
      addToast({
        title: 'Status Updated (Local)',
        message: `Alert updated to ${newStatus}.`,
        type: 'info',
      });
    }
  };

  const filteredAlerts = alerts.filter((alert) => {
    const matchesSev =
      filterSeverity === 'ALL' || alert.severity?.toUpperCase() === filterSeverity.toUpperCase();
    const matchesStat =
      filterStatus === 'ALL' || alert.status?.toUpperCase() === filterStatus.toUpperCase();
    const matchesSearch =
      alert.infrastructure_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.message?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.alert_type?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSev && matchesStat && matchesSearch;
  });

  const criticalCount = alerts.filter((a) => a.severity === 'CRITICAL').length;
  const highCount = alerts.filter((a) => a.severity === 'HIGH').length;
  const activeCount = alerts.filter((a) => a.status === 'ACTIVE').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-navy-700/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-soft-white font-mono">
              ALERTS & NOTIFICATIONS CENTER
            </h1>
            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-cyan/15 text-cyan border border-cyan/30 uppercase">
              <Radio className="w-3 h-3 animate-pulse" /> /ws/alerts Broadcast
            </span>
          </div>
          <p className="text-xs sm:text-sm text-soft-muted mt-1">
            Real-time incident dispatch for critical structural defects, dynamic vibration surges, and anomaly alarms.
          </p>
        </div>

        {/* WebSocket Stream Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-navy-800/80 border border-navy-700 text-xs font-mono">
          <span
            className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-healthy animate-pulse shadow-green-glow' : 'bg-warning animate-ping'
            }`}
          />
          <span className="text-soft-muted">
            {isConnected ? 'LIVE WEBSOCKET STREAM' : 'STREAM RECONNECTING'}
          </span>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Card variant="glass">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-mono font-bold text-soft-subtle uppercase">
                Active System Incidents
              </span>
              <span className="text-3xl font-black text-cyan font-mono mt-1 block">
                {activeCount}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-cyan/10 border border-cyan/25 flex items-center justify-center text-cyan shadow-cyan-glow">
              <BellRing className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card variant="glass">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-mono font-bold text-soft-subtle uppercase">
                Critical Severity
              </span>
              <span className="text-3xl font-black text-critical font-mono mt-1 block">
                {criticalCount}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-critical/10 border border-critical/25 flex items-center justify-center text-critical shadow-red-glow">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card variant="glass">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-mono font-bold text-soft-subtle uppercase">
                High Risk Warnings
              </span>
              <span className="text-3xl font-black text-warning font-mono mt-1 block">
                {highCount}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-warning/10 border border-warning/25 flex items-center justify-center text-warning shadow-orange-glow">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-navy-800/80 border border-navy-700/80">
        <div className="flex items-center gap-3 flex-1 min-w-[240px] max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-soft-subtle" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by infrastructure or incident message..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-navy-900 border border-navy-700 text-xs text-soft-white placeholder-soft-subtle focus:outline-none focus:border-cyan"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          {/* Severity filter */}
          <div className="flex items-center gap-1 bg-navy-900 p-1 rounded-xl border border-navy-700">
            {['ALL', 'CRITICAL', 'HIGH', 'MODERATE'].map((sev) => (
              <button
                key={sev}
                onClick={() => setFilterSeverity(sev)}
                className={`px-2.5 py-1 rounded-lg font-mono font-semibold transition-colors ${
                  filterSeverity === sev
                    ? 'bg-cyan text-navy-950 shadow-cyan-glow font-bold'
                    : 'text-soft-muted hover:text-soft-white'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1 bg-navy-900 p-1 rounded-xl border border-navy-700">
            {['ALL', 'ACTIVE', 'ACKNOWLEDGED', 'RESOLVED'].map((stat) => (
              <button
                key={stat}
                onClick={() => setFilterStatus(stat)}
                className={`px-2.5 py-1 rounded-lg font-mono font-semibold transition-colors ${
                  filterStatus === stat
                    ? 'bg-navy-700 text-soft-white border border-navy-600'
                    : 'text-soft-muted hover:text-soft-white'
                }`}
              >
                {stat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Alerts Feed */}
      {isLoading ? (
        <LoadingSpinner label="Polling Alert Triage Stream..." size="lg" />
      ) : filteredAlerts.length === 0 ? (
        <Card className="text-center py-16 text-soft-muted text-xs">
          No matching alert notifications found.
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map((alert) => {
            const sevInfo = getSeverityColor(alert.severity);
            const isResolved = alert.status === 'RESOLVED';
            const isAcknowledged = alert.status === 'ACKNOWLEDGED';

            return (
              <div
                key={alert.id}
                className={`p-4 rounded-2xl border transition-all ${
                  alert.severity === 'CRITICAL' && !isResolved
                    ? 'bg-navy-800/90 border-critical/40 shadow-red-glow'
                    : 'bg-navy-800/70 border-navy-700/80 hover:border-navy-600'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-navy-700/50">
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold uppercase ${sevInfo.badge}`}
                    >
                      {alert.severity}
                    </span>
                    <span className="text-xs font-mono font-bold text-cyan">
                      {alert.alert_type}
                    </span>
                    <span className="text-xs font-bold text-soft-white">
                      • {alert.infrastructure_name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-mono text-soft-subtle">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatDate(alert.created_at)}</span>
                  </div>
                </div>

                <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <p className="text-xs text-soft-muted leading-relaxed max-w-2xl">
                    {alert.message}
                  </p>

                  <div className="flex items-center gap-2 font-mono text-xs flex-shrink-0">
                    <span className="text-[10px] text-soft-subtle uppercase mr-1">Status:</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isResolved
                          ? 'bg-healthy/20 text-healthy border border-healthy/30'
                          : isAcknowledged
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          : 'bg-warning/20 text-warning border border-warning/30'
                      }`}
                    >
                      {alert.status}
                    </span>

                    {!isResolved && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleUpdateStatus(alert.id, 'RESOLVED')}
                        icon={Check}
                      >
                        Resolve
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
