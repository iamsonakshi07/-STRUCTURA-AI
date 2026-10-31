import React from 'react';
import { AlertCircle, CheckCircle2, ShieldAlert, MapPin, Clock, Tag } from 'lucide-react';
import { getSeverityColor } from '../../utils/formatters';

export const DefectListCard = ({
  defects = [],
  engineName = 'YOLOv8 / OpenCV Hybrid',
  isSimulated = false,
  selectedDefectId,
  onSelectDefect,
}) => {
  return (
    <div className="space-y-4">
      {/* Header Metric */}
      <div className="p-4 rounded-2xl bg-navy-800/80 border border-navy-700/60 backdrop-blur-md flex items-center justify-between">
        <div>
          <span className="text-xs font-mono text-soft-subtle uppercase block">Defects Localized</span>
          <span className="text-2xl font-black text-soft-white font-mono">{defects.length}</span>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-mono text-soft-subtle block">DETECTION ENGINE</span>
          <span className="text-xs font-semibold text-cyan font-mono truncate max-w-[150px] block">
            {engineName}
          </span>
          {isSimulated && (
            <span className="inline-block mt-0.5 text-[9px] font-mono px-1.5 py-0.2 rounded bg-warning/15 text-warning border border-warning/30">
              PROTOTYPE HEURISTICS
            </span>
          )}
        </div>
      </div>

      {/* List of Detected Defect Cards */}
      <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
        {defects.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-navy-800/40 border border-navy-700/50 text-soft-muted text-xs">
            No defect records detected in current image payload.
          </div>
        ) : (
          defects.map((defect, idx) => {
            const isSelected = selectedDefectId === defect.id || selectedDefectId === idx;
            const sevInfo = getSeverityColor(defect.severity);
            const bbox = defect.bounding_box || { x1: 0, y1: 0, x2: 0, y2: 0 };

            return (
              <div
                key={defect.id || idx}
                onClick={() => onSelectDefect && onSelectDefect(defect.id || idx)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-navy-700/90 border-cyan shadow-cyan-glow'
                    : 'bg-navy-800/60 border-navy-700/70 hover:border-navy-600'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: sevInfo.hex }}
                    />
                    <h4 className="text-xs font-bold text-soft-white capitalize tracking-wide">
                      {defect.defect_type.replace('_', ' ')}
                    </h4>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-md font-mono font-bold ${sevInfo.badge}`}
                  >
                    {defect.severity}
                  </span>
                </div>

                <div className="mt-2.5 grid grid-cols-2 gap-2 text-[11px] font-mono text-soft-muted">
                  <div>
                    <span className="text-soft-subtle block text-[10px]">AI CONFIDENCE</span>
                    <span className="text-soft-white font-semibold">
                      {(defect.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-soft-subtle block text-[10px]">LOCATION BBOX</span>
                    <span className="text-soft-white truncate block">
                      [{bbox.x1}, {bbox.y1}, {bbox.x2}, {bbox.y2}]
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
