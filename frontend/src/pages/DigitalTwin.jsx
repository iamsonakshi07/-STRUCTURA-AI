import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Layers,
  Activity,
  Flame,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  Info,
  Maximize2,
  Compass,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { BridgeCanvas } from '../components/twin3d/BridgeCanvas';
import { ComponentDetailDrawer } from '../components/twin3d/ComponentDetailDrawer';

export const DigitalTwin = () => {
  const navigate = useNavigate();
  const [viewLayer, setViewLayer] = useState('normal'); // 'normal' | 'heatmap' | 'health' | 'component'
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [lastSync, setLastSync] = useState(new Date().toLocaleTimeString());

  const inspectionLayers = [
    { id: 'normal', name: '1. Realistic Normal View', icon: Box, desc: 'PBR industrial materials' },
    { id: 'heatmap', name: '2. Defect Heatmap Layer', icon: Flame, desc: 'Thermal stress & damage zones' },
    { id: 'health', name: '3. Structural Health View', icon: ShieldCheck, desc: 'Component safety gradients' },
    { id: 'component', name: '4. Component Inspection', icon: Layers, desc: 'Individual element selection' },
  ];

  const handleSelectMarker = (marker) => {
    setSelectedMarker(marker);
    setSelectedComponent(null);
  };

  const handleSelectComponent = (compName) => {
    setSelectedComponent(compName);
    // Open info for this component
    setSelectedMarker({
      id: compName,
      componentName: compName.toUpperCase().replace('_', ' '),
      defectCategory: compName.includes('deck') ? 'Asphalt Shear Crack' : compName.includes('south') ? 'Concrete Spalling' : 'Nominal Vibration',
      severity: compName.includes('south') ? 'CRITICAL' : compName.includes('deck') ? 'HIGH' : 'LOW',
      confidence: 0.94,
      inspectionDate: '2026-10-28',
      healthScore: compName.includes('south') ? 58.0 : compName.includes('deck') ? 72.0 : 92.0,
      image: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?auto=format&fit=crop&w=600&q=80',
      description: `Target component ${compName.toUpperCase()} selected. Structural stress evaluation parameters active.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-navy-700/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-soft-white font-mono">
              INTERACTIVE 3D DIGITAL TWIN
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan/15 text-cyan border border-cyan/30 uppercase">
              Three.js & WebGL
            </span>
          </div>
          <p className="text-xs sm:text-sm text-soft-muted mt-1">
            Real-time parametric digital twin visualization of Bridge A with localized structural defect telemetry.
          </p>
        </div>

        {/* Layer Selector Tabs */}
        <div className="flex flex-wrap items-center gap-2 bg-navy-800/80 p-1.5 rounded-2xl border border-navy-700/80">
          {inspectionLayers.map((layer) => {
            const isActive = viewLayer === layer.id;
            return (
              <button
                key={layer.id}
                onClick={() => setViewLayer(layer.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-cyan text-navy-950 font-bold shadow-cyan-glow'
                    : 'text-soft-muted hover:text-soft-white hover:bg-navy-700/60'
                }`}
              >
                <layer.icon className="w-3.5 h-3.5" />
                <span>{layer.name.split('.')[1]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main 3D Canvas Viewport */}
      <div className="relative w-full h-[600px] rounded-3xl overflow-hidden border border-cyan/25 shadow-2xl bg-[#0a121e]">
        {/* Three.js Canvas */}
        <BridgeCanvas
          viewLayer={viewLayer}
          selectedComponent={selectedComponent}
          onSelectComponent={handleSelectComponent}
          selectedMarker={selectedMarker}
          onSelectMarker={handleSelectMarker}
        />

        {/* Top-Left Digital Twin Status Overlay Panel */}
        <div className="absolute top-4 left-4 z-10 w-72 p-4 rounded-2xl bg-navy-900/90 backdrop-blur-md border border-cyan/25 shadow-xl text-xs space-y-2.5">
          <div className="flex items-center justify-between pb-2 border-b border-navy-700">
            <span className="font-bold text-soft-white flex items-center gap-2 font-mono">
              <Compass className="w-4 h-4 text-cyan" /> DIGITAL TWIN STATUS
            </span>
            <span className="text-[10px] font-mono text-healthy bg-healthy/15 px-2 py-0.5 rounded-full border border-healthy/30">
              SYNCHRONIZED
            </span>
          </div>

          <div className="space-y-1.5 font-mono text-[11px]">
            <div className="flex justify-between items-center">
              <span className="text-soft-muted">Structural Health:</span>
              <span className="text-healthy font-bold">72.5 / 100</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-soft-muted">Active Defect Markers:</span>
              <span className="text-warning font-bold">3 Localized</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-soft-muted">IoT Sensors Telemetered:</span>
              <span className="text-cyan font-bold">3 Online</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-soft-muted">Last Synchronization:</span>
              <span className="text-soft-white">{lastSync}</span>
            </div>
          </div>

          <div className="pt-2 border-t border-navy-700/60 flex items-center justify-between text-[10px] text-soft-subtle">
            <span>Rotate: Left Click + Drag</span>
            <span>Zoom: Scroll</span>
          </div>
        </div>

        {/* Color Legend Overlay (Bottom-Left) */}
        <div className="absolute bottom-4 left-4 z-10 px-3.5 py-2 rounded-xl bg-navy-900/90 backdrop-blur-md border border-navy-700/80 flex items-center gap-4 text-[11px] font-mono">
          <span className="flex items-center gap-1.5 text-healthy">
            <span className="w-2.5 h-2.5 rounded-full bg-healthy" /> Healthy
          </span>
          <span className="flex items-center gap-1.5 text-warning">
            <span className="w-2.5 h-2.5 rounded-full bg-warning" /> Warning
          </span>
          <span className="flex items-center gap-1.5 text-critical">
            <span className="w-2.5 h-2.5 rounded-full bg-critical" /> Critical
          </span>
          <span className="flex items-center gap-1.5 text-cyan">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan shadow-cyan-glow" /> Selected
          </span>
        </div>

        {/* Selected Component / Defect Drawer (Right side) */}
        <ComponentDetailDrawer
          item={selectedMarker}
          onClose={() => {
            setSelectedMarker(null);
            setSelectedComponent(null);
          }}
          onOpenInspection={() => navigate('/vision')}
        />
      </div>
    </div>
  );
};
