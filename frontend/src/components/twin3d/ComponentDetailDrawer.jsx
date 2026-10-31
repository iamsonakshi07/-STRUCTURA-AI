import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, ShieldCheck, Calendar, Activity, Cpu, ExternalLink, ArrowRight } from 'lucide-react';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

export const ComponentDetailDrawer = ({ item, onClose, onOpenInspection }) => {
  if (!item) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        className="absolute top-4 right-4 z-20 w-80 sm:w-96 rounded-2xl bg-navy-800/95 backdrop-blur-md border border-cyan/30 shadow-2xl p-5 text-soft-white overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-navy-700">
          <div>
            <div className="flex items-center gap-2">
              <Badge
                variant={
                  item.severity === 'CRITICAL'
                    ? 'critical'
                    : item.severity === 'HIGH'
                    ? 'warning'
                    : 'cyan'
                }
                size="sm"
                dot
              >
                {item.severity || 'INSPECTED'}
              </Badge>
              <span className="text-[10px] font-mono text-soft-muted">
                Confidence: {(item.confidence ? item.confidence * 100 : 94).toFixed(0)}%
              </span>
            </div>
            <h3 className="text-sm font-bold text-soft-white mt-1.5 leading-snug">
              {item.componentName || 'Bridge Component'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-soft-muted hover:text-soft-white hover:bg-navy-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Image Preview */}
        {item.image && (
          <div className="mt-3 relative rounded-xl overflow-hidden border border-navy-700 h-36 bg-navy-950">
            <img src={item.image} alt={item.componentName} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-navy-950/80 to-transparent" />
            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] font-mono text-cyan">
              <span>AI ANNOTATED CAPTURE</span>
              <span className="text-soft-white">{item.inspectionDate || '2026-10-29'}</span>
            </div>
          </div>
        )}

        {/* Defect Metrics */}
        <div className="mt-4 space-y-2.5 text-xs">
          <div className="p-3 rounded-xl bg-navy-900/80 border border-navy-700/60 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-soft-muted">Identified Defect</span>
              <span className="font-semibold text-soft-white capitalize">
                {item.defectCategory || 'Surface Distress'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-soft-muted">Component Health</span>
              <span
                className={`font-mono font-bold ${
                  (item.healthScore || 70) > 75
                    ? 'text-healthy'
                    : (item.healthScore || 70) > 60
                    ? 'text-warning'
                    : 'text-critical'
                }`}
              >
                {item.healthScore || 70.0} / 100
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-soft-muted">Sensor Node</span>
              <span className="font-mono text-cyan">VIB-BRI-01 (Active)</span>
            </div>
          </div>

          <p className="text-soft-muted text-xs leading-relaxed">
            {item.description ||
              'Computer vision analysis detected irregular boundary distress along structural section. Non-destructive acoustic evaluation recommended.'}
          </p>
        </div>

        {/* Footer Actions */}
        <div className="mt-4 pt-3 border-t border-navy-700 flex items-center justify-between gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="flex-1"
          >
            Dismiss
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={onOpenInspection}
            icon={ArrowRight}
            className="flex-1"
          >
            Run AI Scan
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
