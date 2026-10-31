import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  ScanEye,
  Box,
  Activity,
  TrendingDown,
  ShieldAlert,
  Globe2,
  FileSpreadsheet,
  BellRing,
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield,
  Layers,
} from 'lucide-react';
import { useWebSocketAlerts } from '../../context/WebSocketContext';

export const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
  const { isConnected, liveAlerts } = useWebSocketAlerts();

  const navigation = [
    { name: 'Overview', to: '/', icon: LayoutDashboard },
    { name: 'Infrastructure Registry', to: '/infrastructure', icon: Building2 },
    { name: 'AI Defect Detection', to: '/vision', icon: ScanEye },
    { name: 'Digital Twin', to: '/digital-twin', icon: Box },
    { name: 'Sensor Intelligence', to: '/sensors', icon: Activity },
    { name: 'RUL Prediction', to: '/rul', icon: TrendingDown },
    { name: 'Risk Assessment', to: '/risk', icon: ShieldAlert },
    { name: 'Geospatial Intelligence', to: '/geospatial', icon: Globe2 },
    { name: 'Inspection Reports', to: '/reports', icon: FileSpreadsheet },
    {
      name: 'Alerts & Notifications',
      to: '/alerts',
      icon: BellRing,
      badge: liveAlerts.length > 0 ? liveAlerts.length : null,
    },
    { name: 'Settings', to: '/settings', icon: Settings },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 z-40 h-screen transition-all duration-300 ease-in-out bg-navy-900 border-r border-navy-700/60 flex flex-col ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-navy-700/60 bg-navy-950/40">
        {!isCollapsed ? (
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan to-blue-600 flex items-center justify-center text-navy-950 shadow-cyan-glow flex-shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-sm font-black tracking-wider text-soft-white block font-mono">
                STRUCTURA<span className="text-cyan font-bold">.AI</span>
              </span>
              <span className="text-[10px] text-soft-subtle uppercase tracking-wider block truncate">
                Infrastructure Platform
              </span>
            </div>
          </div>
        ) : (
          <div className="w-full flex justify-center">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan to-blue-600 flex items-center justify-center text-navy-950 shadow-cyan-glow">
              <Layers className="w-5 h-5" />
            </div>
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navigation.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-cyan/15 to-transparent text-cyan border-l-2 border-cyan font-semibold shadow-sm'
                  : 'text-soft-muted hover:text-soft-white hover:bg-navy-800/60'
              }`
            }
            title={isCollapsed ? item.name : undefined}
          >
            <item.icon className="w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110" />
            {!isCollapsed && <span className="truncate">{item.name}</span>}
            {!isCollapsed && item.badge && (
              <span className="ml-auto px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-critical text-white shadow-red-glow">
                {item.badge}
              </span>
            )}
            {isCollapsed && item.badge && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-critical animate-ping" />
            )}
          </NavLink>
        ))}
      </div>

      {/* Collapse Toggle & Telemetry Indicator */}
      <div className="p-3 border-t border-navy-700/60 bg-navy-950/30">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-healthy animate-pulse shadow-green-glow' : 'bg-soft-subtle'
                }`}
              />
              <span className="text-[11px] font-mono text-soft-subtle truncate">
                {isConnected ? 'LIVE TELEMETRY' : 'CONNECTING...'}
              </span>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg text-soft-muted hover:text-soft-white hover:bg-navy-800 transition-colors ml-auto"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </aside>
  );
};
