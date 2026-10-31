import React, { useState, useRef } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Eye, EyeOff, Layers, Sparkles } from 'lucide-react';
import { getSeverityColor } from '../../utils/formatters';

export const DetectionCanvas = ({
  originalImage,
  annotatedImageUrl,
  defects = [],
  imageWidth = 640,
  imageHeight = 480,
  selectedDefectId,
  onSelectDefect,
}) => {
  const [zoom, setZoom] = useState(1);
  const [showOverlays, setShowOverlays] = useState(true);
  const [mode, setMode] = useState('annotated'); // 'annotated' | 'original'
  const containerRef = useRef(null);

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 3));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.75));
  const handleResetZoom = () => setZoom(1);

  const activeImageSrc = mode === 'annotated' && annotatedImageUrl ? annotatedImageUrl : originalImage;

  return (
    <div className="relative w-full h-[480px] bg-navy-950/90 rounded-2xl border border-navy-700/80 overflow-hidden flex flex-col">
      {/* Top Controls Bar */}
      <div className="h-12 px-4 bg-navy-900/90 backdrop-blur-md border-b border-navy-700/60 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <button
            onClick={() => setMode(mode === 'annotated' ? 'original' : 'annotated')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              mode === 'annotated'
                ? 'bg-cyan/15 text-cyan border border-cyan/30'
                : 'bg-navy-800 text-soft-muted hover:text-soft-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{mode === 'annotated' ? 'AI Annotated View' : 'Original Raw'}</span>
          </button>

          {/* Overlay Toggle */}
          <button
            onClick={() => setShowOverlays(!showOverlays)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              showOverlays
                ? 'bg-navy-800 text-cyan border border-navy-600'
                : 'bg-navy-800/50 text-soft-subtle'
            }`}
          >
            {showOverlays ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>Bounding Overlays</span>
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 bg-navy-800/80 rounded-xl p-1 border border-navy-700">
          <button
            onClick={handleZoomOut}
            className="p-1 rounded-lg text-soft-muted hover:text-soft-white hover:bg-navy-700 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-mono px-2 text-soft-white">{Math.round(zoom * 100)}%</span>
          <button
            onClick={handleZoomIn}
            className="p-1 rounded-lg text-soft-muted hover:text-soft-white hover:bg-navy-700 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleResetZoom}
            className="p-1 rounded-lg text-soft-muted hover:text-soft-white hover:bg-navy-700 transition-colors"
            title="Reset Zoom"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Image Viewport with Bounding Box Overlay */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-auto flex items-center justify-center p-4 select-none cursor-grab active:cursor-grabbing"
      >
        <div
          className="relative inline-block transition-transform duration-150 origin-center"
          style={{ transform: `scale(${zoom})` }}
        >
          {activeImageSrc ? (
            <img
              src={activeImageSrc}
              alt="Structural Defect Inspection"
              className="max-h-[380px] w-auto rounded-xl object-contain shadow-2xl block"
            />
          ) : (
            <div className="w-[500px] h-[340px] rounded-xl border border-dashed border-navy-700 flex flex-col items-center justify-center text-soft-subtle">
              <Layers className="w-10 h-10 mb-2 opacity-50" />
              <p className="text-xs">No inspection image loaded</p>
            </div>
          )}

          {/* Interactive Bounding Boxes when in Original Mode with Overlays ON */}
          {showOverlays &&
            mode === 'original' &&
            defects.map((def, idx) => {
              const bbox = def.bounding_box || { x1: 50, y1: 50, x2: 250, y2: 200 };
              const leftPct = (bbox.x1 / imageWidth) * 100;
              const topPct = (bbox.y1 / imageHeight) * 100;
              const widthPct = ((bbox.x2 - bbox.x1) / imageWidth) * 100;
              const heightPct = ((bbox.y2 - bbox.y1) / imageHeight) * 100;

              const isSelected = selectedDefectId === def.id || selectedDefectId === idx;
              const sev = (def.severity || 'HIGH').toUpperCase();
              const borderColor =
                sev === 'CRITICAL' ? '#EF4444' : sev === 'HIGH' ? '#F59E0B' : '#00C2D1';

              return (
                <div
                  key={idx}
                  onClick={() => onSelectDefect && onSelectDefect(def.id || idx)}
                  className={`absolute cursor-pointer transition-all ${
                    isSelected ? 'ring-2 ring-cyan shadow-cyan-glow' : ''
                  }`}
                  style={{
                    left: `${leftPct}%`,
                    top: `${topPct}%`,
                    width: `${widthPct}%`,
                    height: `${heightPct}%`,
                    border: `2px solid ${borderColor}`,
                    backgroundColor: `${borderColor}1A`,
                  }}
                >
                  <div
                    className="absolute -top-6 left-0 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold text-white uppercase whitespace-nowrap shadow-md"
                    style={{ backgroundColor: borderColor }}
                  >
                    {def.defect_type} ({(def.confidence * 100).toFixed(0)}%)
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};
