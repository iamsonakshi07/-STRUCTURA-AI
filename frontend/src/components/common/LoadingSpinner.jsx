import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingSpinner = ({ label = 'Processing structural data...', size = 'md' }) => {
  const sizes = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3 text-cyan">
      <div className="relative">
        <Loader2 className={`${sizes[size]} animate-spin text-cyan`} />
        <div className="absolute inset-0 rounded-full blur-sm bg-cyan/30 animate-pulse" />
      </div>
      {label && <p className="text-xs font-mono uppercase tracking-wider text-soft-muted">{label}</p>}
    </div>
  );
};

export const EmptyState = ({
  icon: Icon,
  title = 'No records located',
  description = 'No matching infrastructure telemetry or records found.',
  action,
}) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
    {Icon && (
      <div className="w-14 h-14 rounded-2xl bg-navy-700/60 border border-navy-600 flex items-center justify-center text-cyan mb-4 shadow-cyan-glow">
        <Icon className="w-7 h-7" />
      </div>
    )}
    <h3 className="text-base font-semibold text-soft-white">{title}</h3>
    <p className="text-sm text-soft-muted mt-1 max-w-sm">{description}</p>
    {action && <div className="mt-5">{action}</div>}
  </div>
);
