import React from 'react';
import { Activity, Wifi, AlertTriangle, CheckCircle2, Radio } from 'lucide-react';
import { Card } from '../common/Card';

export const SensorCard = ({
  sensorId,
  infraName,
  vibration,
  acceleration,
  frequency,
  isAnomaly,
  timestamp,
  isActive = true,
}) => {
  return (
    <Card
      variant="default"
      hover
      className={`border transition-all ${
        isAnomaly
          ? 'border-critical/60 shadow-red-glow bg-navy-800/90'
          : 'border-navy-700/60'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              isAnomaly
                ? 'bg-critical/15 text-critical border border-critical/30 animate-pulse'
                : 'bg-cyan/10 text-cyan border border-cyan/25'
            }`}
          >
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-mono font-bold text-soft-white">{sensorId}</h4>
              <span
                className={`w-2 h-2 rounded-full ${
                  isActive ? 'bg-healthy shadow-green-glow' : 'bg-soft-subtle'
                }`}
              />
            </div>
            <p className="text-[11px] text-soft-muted truncate max-w-[180px]">{infraName}</p>
          </div>
        </div>

        <span
          className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
            isAnomaly
              ? 'bg-critical/20 text-critical border border-critical/40'
              : 'bg-healthy/15 text-healthy border border-healthy/30'
          }`}
        >
          {isAnomaly ? 'ANOMALY' : 'NORMAL'}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-navy-900/80 border border-navy-700/60 text-center font-mono">
        <div>
          <span className="text-[10px] text-soft-subtle block">VIB (RMS)</span>
          <span
            className={`text-sm font-bold ${
              isAnomaly ? 'text-critical' : 'text-cyan'
            }`}
          >
            {vibration?.toFixed(2) || '0.00'}
          </span>
          <span className="text-[9px] text-soft-subtle block">mm/s</span>
        </div>
        <div>
          <span className="text-[10px] text-soft-subtle block">ACCEL</span>
          <span className="text-sm font-bold text-soft-white">{acceleration?.toFixed(2) || '0.00'}</span>
          <span className="text-[9px] text-soft-subtle block">m/s²</span>
        </div>
        <div>
          <span className="text-[10px] text-soft-subtle block">FREQ</span>
          <span className="text-sm font-bold text-soft-white">{frequency?.toFixed(1) || '0.0'}</span>
          <span className="text-[9px] text-soft-subtle block">Hz</span>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-[10px] text-soft-subtle font-mono">
        <span className="flex items-center gap-1">
          <Radio className="w-3 h-3 text-cyan" /> 200 Hz Sampling
        </span>
        <span>{timestamp ? new Date(timestamp).toLocaleTimeString() : 'Live'}</span>
      </div>
    </Card>
  );
};
