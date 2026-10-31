import React from 'react';
import { AlertCircle, CheckCircle2, ShieldAlert, Layers } from 'lucide-react';
import { getSeverityColor, getDefectCategoryInfo } from '../../utils/formatters';

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
      <div className="space-y-3 max-h-[440px] overflow-y-auto pr-1">
        {defects.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-navy-800/40 border border-navy-700/50 text-soft-muted text-xs">
            No defect records detected in current image payload.
          </div>
        ) : (
          defects.map((defect, idx) => {
            const isSelected = selectedDefectId === defect.id || selectedDefectId === idx;
            const sevInfo = getSeverityColor(defect.severity);
            const categoryInfo = getDefectCategoryInfo(defect.defect_type);
            const bbox = defect.bounding_box || { x1: 0, y1: 0, x2: 0, y2: 0 };
            const description = defect.description || categoryInfo.description;

            return (
              <div
                key={defect.id || idx}
                onClick={() => onSelectDefect && onSelectDefect(defect.id || idx)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-navy-700/95 border-cyan shadow-cyan-glow scale-[1.01]'
                    : 'bg-navy-800/70 border-navy-700/80 hover:border-navy-600 hover:bg-navy-800/90'
                }`}
              >
                {/* Top Row: Category Name + Category Indicator + Severity Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm"
                      style={{ backgroundColor: categoryInfo.color }}
                      title={`${categoryInfo.name} Category`}
                    />
                    <h4 className="text-xs font-bold text-soft-white tracking-wide">
                      {categoryInfo.name}
                    </h4>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {/* Visual Severity Indicator */}
                    <span
                      className={`w-2 h-2 rounded-full ${
                        defect.severity === 'CRITICAL'
                          ? 'bg-critical animate-ping'
                          : defect.severity === 'HIGH'
                          ? 'bg-orange-500'
                          : 'bg-warning'
                      }`}
                    />
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-md font-mono font-bold ${sevInfo.badge}`}
                    >
                      {defect.severity}
                    </span>
                  </div>
                </div>

                {/* Short Defect Description */}
                <p className="mt-2 text-[11px] text-soft-muted leading-relaxed">
                  {description}
                </p>

                {/* Metrics: Confidence & Bounding Box */}
                <div className="mt-2.5 pt-2 border-t border-navy-700/60 grid grid-cols-2 gap-2 text-[11px] font-mono text-soft-muted">
                  <div>
                    <span className="text-soft-subtle block text-[10px]">AI CONFIDENCE</span>
                    <span className="text-soft-white font-semibold">
                      {(defect.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-soft-subtle block text-[10px]">BBOX COORDS</span>
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
