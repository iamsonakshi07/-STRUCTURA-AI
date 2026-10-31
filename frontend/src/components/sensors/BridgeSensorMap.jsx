import React from 'react';
import { Activity, Radio, Cpu, Layers } from 'lucide-react';

export const BridgeSensorMap = ({ activeSensorId, onSelectSensor }) => {
  const sensorNodes = [
    { id: 'VIB-BRI-01', name: 'Anchor Pier Sensor', location: 'South Foundation Pier', top: '72%', left: '24%', type: 'Piezoelectric Accelerometer' },
    { id: 'VIB-BRI-02', name: 'Mid-Span Dynamic Sensor', location: 'Main Deck Girder', top: '48%', left: '50%', type: 'Triaxial Vibration Sensor' },
    { id: 'VIB-BRI-03', name: 'Cable Stay Strain Node', location: 'North Tower Stay', top: '28%', left: '76%', type: 'Optical Fiber FBG Sensor' },
  ];

  return (
    <div className="relative w-full h-80 rounded-2xl bg-navy-950/80 border border-navy-700/80 overflow-hidden flex flex-col p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-mono font-bold text-soft-white uppercase flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan" /> Structural Sensor Node Distribution
        </span>
        <span className="text-[10px] font-mono text-cyan bg-cyan/10 px-2 py-0.5 rounded-full border border-cyan/30">
          3 NODES TELEMETERED
        </span>
      </div>

      {/* Stylized Bridge Schematic SVG Diagram */}
      <div className="relative flex-1 flex items-center justify-center">
        <svg
          viewBox="0 0 800 280"
          className="w-full h-full max-h-56 stroke-cyan/30 fill-none"
        >
          {/* Water level */}
          <line x1="0" y1="230" x2="800" y2="230" stroke="#1f334d" strokeWidth="2" strokeDasharray="6 4" />
          
          {/* Main Deck */}
          <line x1="40" y1="160" x2="760" y2="160" stroke="#00C2D1" strokeWidth="6" />
          <line x1="40" y1="168" x2="760" y2="168" stroke="#334155" strokeWidth="2" />

          {/* South Tower */}
          <line x1="200" y1="40" x2="200" y2="230" stroke="#64748b" strokeWidth="8" />
          <line x1="180" y1="230" x2="220" y2="230" stroke="#475569" strokeWidth="12" />

          {/* North Tower */}
          <line x1="600" y1="40" x2="600" y2="230" stroke="#64748b" strokeWidth="8" />
          <line x1="580" y1="230" x2="620" y2="230" stroke="#475569" strokeWidth="12" />

          {/* Suspension Cables */}
          <path d="M 40 160 Q 120 100 200 40 Q 400 130 600 40 Q 680 100 760 160" stroke="#F59E0B" strokeWidth="2.5" fill="none" />

          {/* Vertical Suspenders */}
          {[250, 300, 350, 400, 450, 500, 550].map((x) => (
            <line key={x} x1={x} y1={x === 400 ? 130 : 90} x2={x} y2="160" stroke="#334155" strokeWidth="1" strokeDasharray="2 2" />
          ))}
        </svg>

        {/* Interactive Sensor Pins */}
        {sensorNodes.map((node) => {
          const isSelected = activeSensorId === node.id;
          return (
            <div
              key={node.id}
              onClick={() => onSelectSensor && onSelectSensor(node.id)}
              style={{ top: node.top, left: node.left }}
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
            >
              <div
                className={`relative p-2 rounded-xl transition-all ${
                  isSelected
                    ? 'bg-cyan text-navy-950 scale-125 shadow-cyan-glow'
                    : 'bg-navy-800 text-cyan hover:bg-cyan hover:text-navy-950 border border-cyan/40'
                }`}
              >
                <Radio className="w-4 h-4 animate-pulse" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-healthy animate-ping" />
              </div>

              {/* Tooltip */}
              <div className="hidden group-hover:block absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 p-2 rounded-xl bg-navy-900 border border-cyan/40 text-[10px] font-mono shadow-2xl z-20 pointer-events-none">
                <span className="font-bold text-soft-white block">{node.id}</span>
                <span className="text-cyan block">{node.name}</span>
                <span className="text-soft-subtle block">{node.type}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
