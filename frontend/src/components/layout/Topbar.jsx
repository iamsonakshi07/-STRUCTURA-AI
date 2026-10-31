import React, { useState, useEffect } from 'react';
import {
  Search,
  Bell,
  Clock,
  Sparkles,
  Server,
  UserCheck,
  ChevronDown,
  ShieldCheck,
  Radio,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useWebSocketAlerts } from '../../context/WebSocketContext';
import { Button } from '../common/Button';

export const Topbar = ({ onOpenQuickInspection, onOpenGlobalSearch }) => {
  const { user, switchDemoRole } = useAuth();
  const { isConnected, liveAlerts } = useWebSocketAlerts();
  const [time, setTime] = useState(new Date());
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showAlertMenu, setShowAlertMenu] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="sticky top-0 z-30 h-16 bg-navy-900/90 backdrop-blur-md border-b border-navy-700/60 px-6 flex items-center justify-between gap-4">
      {/* Left: Global Search trigger */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <button
          onClick={onOpenGlobalSearch}
          className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl bg-navy-800/80 border border-navy-600/50 hover:border-cyan/40 text-soft-muted text-xs transition-all shadow-inner group"
        >
          <Search className="w-4 h-4 text-soft-subtle group-hover:text-cyan transition-colors" />
          <span className="flex-1 text-left">Search infrastructure, defects, telemetry...</span>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] bg-navy-900/80 border border-navy-600 text-soft-subtle font-mono">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right: Actions, Clock, Status, Profile */}
      <div className="flex items-center gap-3">
        {/* Quick Inspection Action */}
        <Button
          onClick={onOpenQuickInspection}
          variant="primary"
          size="sm"
          icon={Sparkles}
          className="shadow-cyan-glow hidden sm:inline-flex"
        >
          Quick Inspection
        </Button>

        {/* Live Date and Time */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-navy-800/60 border border-navy-700/50 text-xs font-mono text-soft-muted">
          <Clock className="w-3.5 h-3.5 text-cyan" />
          <span>
            {time.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}{' '}
            <span className="text-soft-white font-semibold">{time.toLocaleTimeString()}</span>
          </span>
        </div>

        {/* System Status Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowStatusMenu(!showStatusMenu);
              setShowProfileMenu(false);
              setShowAlertMenu(false);
            }}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-navy-800/60 border border-navy-700/50 hover:border-cyan/30 text-xs text-soft-muted transition-colors"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-healthy animate-pulse shadow-green-glow' : 'bg-warning animate-ping'
              }`}
            />
            <span className="hidden md:inline font-mono text-[11px]">
              {isConnected ? 'SYSTEM ACTIVE' : 'RECONNECTING'}
            </span>
            <ChevronDown className="w-3 h-3 text-soft-subtle" />
          </button>

          {showStatusMenu && (
            <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-navy-800 border border-cyan/20 shadow-2xl p-4 z-50 text-xs animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between pb-3 border-b border-navy-700 font-semibold text-soft-white">
                <span className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-cyan" /> Infrastructure Core
                </span>
                <span className="text-[10px] text-healthy bg-healthy/10 px-2 py-0.5 rounded-full border border-healthy/30">
                  HEALTHY
                </span>
              </div>
              <div className="mt-3 space-y-2 text-soft-muted">
                <div className="flex justify-between items-center">
                  <span>FastAPI Backend</span>
                  <span className="text-healthy font-mono text-[11px]">v1.0.0 Online</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Database Engine</span>
                  <span className="text-healthy font-mono text-[11px]">SQLite (Connected)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Vision AI Pipeline</span>
                  <span className="text-cyan font-mono text-[11px]">OpenCV / YOLOv8 Ready</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Sensor Anomaly Core</span>
                  <span className="text-healthy font-mono text-[11px]">Isolation Forest Active</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>WebSocket Stream</span>
                  <span className={isConnected ? 'text-healthy font-mono text-[11px]' : 'text-warning font-mono text-[11px]'}>
                    {isConnected ? '/ws/alerts Active' : 'Connecting'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => {
              setShowAlertMenu(!showAlertMenu);
              setShowStatusMenu(false);
              setShowProfileMenu(false);
            }}
            className="relative p-2 rounded-xl bg-navy-800/60 border border-navy-700/50 hover:border-cyan/30 text-soft-muted hover:text-soft-white transition-colors"
          >
            <Bell className="w-4 h-4" />
            {liveAlerts.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-critical text-white text-[9px] font-bold flex items-center justify-center animate-pulse">
                {liveAlerts.length}
              </span>
            )}
          </button>

          {showAlertMenu && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-navy-800 border border-cyan/25 shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between pb-3 border-b border-navy-700">
                <span className="text-xs font-bold text-soft-white flex items-center gap-2">
                  <Radio className="w-3.5 h-3.5 text-cyan animate-pulse" /> Live System Telemetry
                </span>
                <span className="text-[10px] text-cyan font-mono font-semibold">
                  {liveAlerts.length} Active
                </span>
              </div>
              <div className="mt-3 max-h-60 overflow-y-auto space-y-2 pr-1">
                {liveAlerts.length === 0 ? (
                  <p className="text-xs text-soft-muted text-center py-4">No recent live alerts broadcast.</p>
                ) : (
                  liveAlerts.map((al, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-navy-900/70 border border-navy-700/60 text-xs">
                      <div className="flex items-center justify-between font-semibold text-soft-white">
                        <span className="text-[11px] text-critical uppercase">{al.severity || 'ALERT'}</span>
                        <span className="text-[10px] text-soft-subtle">Just now</span>
                      </div>
                      <p className="text-soft-muted mt-1 text-[11px] leading-tight">{al.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile & Demo Switcher */}
        <div className="relative">
          <button
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowStatusMenu(false);
              setShowAlertMenu(false);
            }}
            className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-navy-800/80 border border-navy-700/50 hover:border-cyan/40 transition-colors"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan/30 to-blue-600/40 border border-cyan/40 flex items-center justify-center text-cyan text-xs font-bold">
              {user?.name ? user.name[0] : 'U'}
            </div>
            <div className="text-left hidden md:block">
              <div className="text-xs font-semibold text-soft-white leading-none">{user?.name || 'Engineer'}</div>
              <div className="text-[10px] font-mono text-cyan uppercase mt-0.5">{user?.role || 'inspector'}</div>
            </div>
            <ChevronDown className="w-3 h-3 text-soft-subtle ml-1 hidden md:block" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-navy-800 border border-cyan/25 shadow-2xl p-4 z-50 text-xs animate-in fade-in slide-in-from-top-2">
              <div className="pb-3 border-b border-navy-700">
                <p className="font-semibold text-soft-white">{user?.name}</p>
                <p className="text-[11px] text-soft-muted truncate">{user?.email}</p>
                <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-cyan/15 text-cyan border border-cyan/30 font-mono uppercase">
                  Role: {user?.role}
                </span>
              </div>

              <div className="mt-3">
                <p className="text-[10px] font-mono text-soft-subtle uppercase mb-2">Switch Demo Persona</p>
                <div className="space-y-1.5">
                  <button
                    onClick={() => {
                      switchDemoRole('admin');
                      setShowProfileMenu(false);
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors ${
                      user?.role === 'admin'
                        ? 'bg-cyan/15 text-cyan border border-cyan/30'
                        : 'hover:bg-navy-700 text-soft-muted'
                    }`}
                  >
                    <span>Chief Engineer Admin</span>
                    {user?.role === 'admin' && <ShieldCheck className="w-4 h-4 text-cyan" />}
                  </button>
                  <button
                    onClick={() => {
                      switchDemoRole('inspector');
                      setShowProfileMenu(false);
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors ${
                      user?.role === 'inspector'
                        ? 'bg-cyan/15 text-cyan border border-cyan/30'
                        : 'hover:bg-navy-700 text-soft-muted'
                    }`}
                  >
                    <span>Lead Inspector Sarah</span>
                    {user?.role === 'inspector' && <ShieldCheck className="w-4 h-4 text-cyan" />}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
